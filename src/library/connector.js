import StreamDeck from '@elgato/streamdeck'
import EventEmitter from 'node:events'
import http from 'node:http'
import crypto from 'node:crypto'
import constants from './constants'
import logger from './logger'

import {
	serveStatic,
	sendFile,
	redirect,
	send,
	parseQuery,
	parsePath,
	parseFormBody
} from './http'

class Connector extends EventEmitter {
	#staticHandler = serveStatic('./bin/setup')
	#accessToken = null
	#refreshToken = null
	#clientId = null
	#clientSecret = null
	#port = null
	#server = null
	#lastDeviceId = null
	#setup = false
	#faked = false
	#error = false
	#state = null

	#setSetup(state) {
		this.#setup = state
		this.emit('setupStateChanged', state)
	}

	async #refreshAccessToken() {
		const response = await fetch('https://accounts.spotify.com/api/token', {
			method: 'POST',

			body: new URLSearchParams({
				refresh_token: this.#refreshToken,
				grant_type: 'refresh_token'
			}),

			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': `Basic ${Buffer.from(`${this.#clientId}:${this.#clientSecret}`).toString('base64')}`
			}
		})

		if (response.status !== 200)
			throw new constants.ApiError(response.status, `The refresh token Spotify API call failed with status "${response.status}" and body "${await response.text()}".`)

		this.#accessToken = (await response.json()).access_token

		logger.info('The access token has been refreshed.')
	}

	async callSpotifyApi(path, options = {}, allowResponses = []) {
		if (!this.#setup)
			throw new Error(`The Spotify API call "${path}" failed because the connector is not set up.`)

		let response = await fetch(`https://api.spotify.com/v1/${path}`, {
			...options,

			headers: {
				...options.headers,
				'Authorization': `Bearer ${this.#accessToken}`
			}
		})

		if (response.status === 401) {
			await this.#refreshAccessToken()

			response = await fetch(`https://api.spotify.com/v1/${path}`, {
				...options,

				headers: {
					...options.headers,
					'Authorization': `Bearer ${this.#accessToken}`
				}
			})
		}

		if (response.status === 204 && allowResponses.includes(constants.API_EMPTY_RESPONSE))
			return constants.API_EMPTY_RESPONSE
		else if (response.status === 404 && allowResponses.includes(constants.API_NOT_FOUND_RESPONSE))
			return constants.API_NOT_FOUND_RESPONSE

		if (response.status !== 200 && (response.status !== 201 || options.method !== 'POST'))
			throw new constants.ApiError(response.status, `The Spotify API call "${path}" with body ${JSON.stringify(options.body ?? {})} failed with status "${response.status}" and body "${await response.text()}".`)

		if (response.headers.get('content-type')?.includes('application/json'))
			return response.json()
		else
			return response.text()
	}

	async #handleRequest(req, res) {
		const pathname = parsePath(req.url)
		const query = parseQuery(req.url)

		if (this.#staticHandler(pathname, res))
			return
		else if (req.method === 'GET' && /^\/[a-z]{2}(_[A-Z]{2})?\.json$/.test(pathname))
			return sendFile(res, `.${pathname}`)
		else if (req.method === 'GET' && pathname === '/port')
			return send(res, 200, this.#port.toString())
		else if (req.method === 'POST' && pathname === '/') {
			const body = await parseFormBody(req)

			if ((!body.clientId) || (!body.clientSecret)) {
				this.#error = true
				return redirect(res, '/?error=1')
			}

			this.#clientId = body.clientId
			this.#clientSecret = body.clientSecret
			this.#state = crypto.randomUUID()

			return redirect(res, `https://accounts.spotify.com/authorize?response_type=code&client_id=${this.#clientId}&scope=${encodeURIComponent(constants.CONNECTOR_DEFAULT_SCOPES.join(' '))}&redirect_uri=${encodeURIComponent(`http://127.0.0.1:${this.#port}`)}&state=${this.#state}`)
		} else if (req.method === 'GET' && pathname === '/')
			if (query.error)
				if (!this.#error)
					return redirect(res, '/')
				else {
					this.#error = false
					return sendFile(res, './bin/setup/index.html')
				}
			else if (query.code && query.state === this.#state && (!this.#setup) && this.#clientId && this.#clientSecret)
				try {
					const response = await fetch('https://accounts.spotify.com/api/token', {
						method: 'POST',

						body: new URLSearchParams({
							code: query.code,
							redirect_uri: `http://127.0.0.1:${this.#port}`,
							grant_type: 'authorization_code'
						}),

						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
							'Authorization': `Basic ${Buffer.from(`${this.#clientId}:${this.#clientSecret}`).toString('base64')}`
						}
					})

					if (response.status !== 200)
						throw new constants.ApiError(response.status, `The access token Spotify API call failed with status "${response.status}".`)

					const data = await response.json()

					this.#refreshToken = data.refresh_token
					this.#accessToken = data.access_token
					this.#setSetup(true)

					this.#saveGlobalSettings({
						clientId: this.#clientId,
						clientSecret: this.#clientSecret,
						refreshToken: this.#refreshToken,
						accessToken: this.#accessToken
					})

					logger.info('The connector setup has been completed.')
					return redirect(res, '/?success=1')
				} catch (e) {
					logger.error(`An error occured while setting up the connector: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
					this.#error = true
					return redirect(res, '/?error=1')
				}
			else if (query.success && (!this.#setup))
				return redirect(res, '/')
			else {
				sendFile(res, './bin/setup/index.html')

				if (query.success && this.#setup) {
					this.#server.close()
					this.#server = null
				}

				return
			}

		res.writeHead(404)
		res.end()
	}

	startSetup(clientId = null, clientSecret = null, refreshToken = null, lastDeviceId = null) {
		logger.info('Starting connector setup.')

		this.#clientId = clientId
		this.#clientSecret = clientSecret
		this.#refreshToken = refreshToken
		this.#lastDeviceId = lastDeviceId

		if (this.#refreshToken)
			this.#refreshAccessToken().then(() => this.#setSetup(true)).catch(e => {
				logger.error(`An error occured while setting up the connector: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
				this.invalidateSetup(true)
			})
		else
			this.#listenWithRetry()
	}

	invalidateSetup(force = false) {
		if ((!force) && (!this.#setup))
			return

		this.#setSetup(false)

		this.#accessToken = null
		this.#refreshToken = null
		this.#clientId = null
		this.#clientSecret = null

		this.#listenWithRetry()

		this.#lastDeviceId = null

		this.#saveGlobalSettings({
			clientId: null,
			clientSecret: null,
			refreshToken: null,
			accessToken: null,
			lastDeviceId: null
		})

		logger.warn('The connector setup has been invalidated.')
	}

	saveLastDeviceId(deviceId) {
		this.#lastDeviceId = deviceId
		this.#saveGlobalSettings({ lastDeviceId: deviceId })
	}

	get lastDeviceId() {
		return this.#lastDeviceId
	}

	#listenWithRetry(attempt = 0) {
		const port = constants.CONNECTOR_DEFAULT_PORT + attempt

		this.#server = http.createServer((req, res) => this.#handleRequest(req, res))

		this.#server.on('listening', () => {
			this.#port = port

			logger.info(`Connector setup server listening on port "${port}".`)

			StreamDeck.settings.getGlobalSettings().then(settings => {
				StreamDeck.settings.setGlobalSettings({
					...settings,
					connectorPort: port
				})
			}).catch(e => logger.error(`An error occured while updating connector port in global settings: "${e.message || 'No message.'}".`))
		})

		this.#server.on('error', err => {
			if (err.code === 'EADDRINUSE' && attempt < constants.PORT_RETRY_RANGE) {
				logger.warn(`Port "${port}" in use, trying "${port + 1}".`)
				this.#listenWithRetry(attempt + 1)
			} else
				logger.error(`Failed to start connector setup server: "${err.message || 'No message.'}"`)
		})

		this.#server.listen(port)
	}

	#saveGlobalSettings(credentials) {
		StreamDeck.settings.getGlobalSettings().then(settings => {
			StreamDeck.settings.setGlobalSettings({
				...settings,
				...credentials
			})
		}).catch(e => logger.error(`An error occured while setting the Stream Deck global settings: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	fakeOff() {
		this.#faked = true
		this.#setup = false
		this.emit('setupStateChanged', false)
	}

	fakeOn() {
		if (!this.#faked)
			return

		this.#faked = false
		this.#setup = true
		this.emit('setupStateChanged', true)
	}

	get set() {
		return this.#setup
	}

	get port() {
		return this.#port
	}
}

export default new Connector()
