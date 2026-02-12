import StreamDeck from '@elgato/streamdeck'
import EventEmitter from 'events'
import express from 'express'
import constants from './constants'
import logger from './logger'

import {
	fetch,
	ProxyAgent
} from 'undici'

import {
	v4
} from 'uuid'

const proxyAgent = true ? new ProxyAgent({
	uri: 'http://127.0.0.1:8000',

	requestTls: {
		rejectUnauthorized: false
	}
}) : undefined

class Connector extends EventEmitter {
	#accessToken = null
	#refreshToken = null
	#clientId = null
	#clientSecret = null
	#app = null
	#port = null
	#server = null
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
			dispatcher: proxyAgent,

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
			dispatcher: proxyAgent,

			headers: {
				...options.headers,
				'Authorization': `Bearer ${this.#accessToken}`
			}
		})

		if (response.status === 401) {
			await this.#refreshAccessToken()

			response = await fetch(`https://api.spotify.com/v1/${path}`, {
				...options,
				dispatcher: proxyAgent,

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

		if (response.status !== 200)
			throw new constants.ApiError(response.status, `The Spotify API call "${path}" with body ${JSON.stringify(options.body ?? {})} failed with status "${response.status}" and body "${await response.text()}".`)

		if (response.headers.get('content-type')?.includes('application/json'))
			return response.json()
		else
			return response.text()
	}

	startSetup(clientId = null, clientSecret = null, refreshToken = null) {
		logger.info('Starting connector setup.')

		this.#clientId = clientId
		this.#clientSecret = clientSecret
		this.#refreshToken = refreshToken
		this.#port = constants.CONNECTOR_DEFAULT_PORT

		this.#app = express()

		this.#app.use((req, res, next) => {
			if (req.path.endsWith('.html')) {
				res.status(404).send()
				return
			}

			next()
		})

		this.#app.use(express.static('./bin/setup', {
			index: false
		}))

		this.#app.use(express.urlencoded({
			extended: true
		}))

		this.#app.get('/', async (req, res) => {
			if (req.query.error)
				if (!this.#error)
					res.redirect('/')
				else {
					this.#error = false
					
					res.sendFile('./index.html', {
						root: './bin/setup'
					})
				}
			else if (req.query.code && req.query.state === this.#state && (!this.#setup) && this.#clientId && this.#clientSecret)
				try {
					const response = await fetch('https://accounts.spotify.com/api/token', {
						method: 'POST',
						dispatcher: proxyAgent,

						body: new URLSearchParams({
							code: req.query.code,
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

					StreamDeck.settings.setGlobalSettings({
						clientId: this.#clientId,
						clientSecret: this.#clientSecret,
						refreshToken: this.#refreshToken,
						accessToken: this.#accessToken
					}).catch(e => logger.error(`An error occured while setting the Stream Deck global settings: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

					logger.info('The connector setup has been completed.')
					res.redirect('/?success=1')
				} catch (e) {
					logger.error(`An error occured while setting up the connector: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
					this.#error = true
					res.redirect('/?error=1')
				}
			else if (req.query.success && (!this.#setup))
				res.redirect('/')
			else {
				res.sendFile('./index.html', {
					root: './bin/setup'
				})

				if (req.query.success && this.#setup) {
					this.#server.close()
					this.#server = null
				}
			}
		})

		this.#app.post('/', async (req, res) => {
			if ((!req.body.clientId) || (!req.body.clientSecret)) {
				this.#error = true
				res.redirect('/?error=1')
			} else {
				this.#clientId = req.body.clientId
				this.#clientSecret = req.body.clientSecret
				this.#state = v4()
				res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${this.#clientId}&scope=${encodeURIComponent(constants.CONNECTOR_DEFAULT_SCOPES.join(' '))}&redirect_uri=${encodeURIComponent(`http://127.0.0.1:${this.#port}`)}&state=${this.#state}`);
			}
		})

		this.#app.get('/port', (req, res) => res.send(this.#port.toString()))

		if (this.#refreshToken)
			this.#refreshAccessToken().then(() => this.#setSetup(true)).catch(e => {
				logger.error(`An error occured while setting up the connector: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
				this.invalidateSetup(true)
			})
		else
			this.#server = this.#app.listen(this.#port, (err) => {
				if (err) return logger.error(`Failed to start connector setup server on port "${this.#port}": "${err.message || 'No message.'}"`)
				logger.info(`Connector setup server listening on port "${this.#port}".`)
			})
	}

	invalidateSetup(force = false) {
		if ((!force) && (!this.#setup))
			return

		this.#setSetup(false)

		this.#accessToken = null
		this.#refreshToken = null
		this.#clientId = null
		this.#clientSecret = null

		this.#server = this.#app.listen(this.#port, (err) => {
			if (err) return logger.error(`Failed to start connector setup server on port "${this.#port}": "${err.message || 'No message.'}"`)
			logger.info(`Connector setup server listening on port "${this.#port}".`)
		})

		StreamDeck.settings.setGlobalSettings({
			clientId: null,
			clientSecret: null,
			refreshToken: null,
			accessToken: null
		}).catch(e => logger.error(`An error occured while setting the Stream Deck global settings: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		logger.warn('The connector setup has been invalidated.')
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
}

export default new Connector()
