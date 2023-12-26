import streamDeck from '@elgato/streamdeck'
import express from 'express'
import constants from './constants'
import EventEmitter from 'events'

class Connector extends EventEmitter {
	#accessToken = null
	#refreshToken = null
	#clientId = null
	#clientSecret = null
	#app = null
	#port = null
	#server = null
	#setup = false

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

		if (!response.ok)
			throw new Error(`The refresh token Spotify API call failed with status "${response.status}".`)

		this.#accessToken = (await response.json()).access_token
		return true
	}

	#invalidateSetup() {
		if (!this.#setup)
			return

		this.#setSetup(false)
		this.#accessToken = null
		this.#refreshToken = null

		this.#server = this.#app.listen(this.#port)

		streamDeck.client.setGlobalSettings({
			clientId: null,
			clientSecret: null,
			refreshToken: null,
			accessToken: null
		})
	}

	async callSpotifyApi(path, options = {}) {
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

		if (response.status === 204)
			return constants.API_EMPTY_RESPONSE
		else if (response.status === 404)
			return constants.API_NOT_FOUND_RESPONSE

		if (!response.ok)
			throw new Error(`The Spotify API call "${path}" failed with status "${response.status}".`)

		if (response.headers.get('content-type')?.includes('application/json'))
			return response.json()
		else
			return response.text()
	}

	startSetup(clientId = null, clientSecret = null, refreshToken = null, port = 4202) {
		this.#clientId = clientId
		this.#clientSecret = clientSecret
		this.#refreshToken = refreshToken
		this.#port = port

		this.#app = express()

		this.#app.get('/', async (req, res) => {
			const code = req.query.code

			if ((!this.#clientId) || (!this.#clientSecret)) {
				if (req.query.clientId && req.query.clientSecret) {
					this.#clientId = req.query.clientId
					this.#clientSecret = req.query.clientSecret
					res.redirect('/')
					return
				}

				res.send(`
					<form action="/" method="GET">
						<label for="clientId">Client ID:</label>
						<input type="text" id="clientId" name="clientId" /><br />
						<label for="clientSecret">Client Secret:</label>
						<input type="text" id="clientSecret" name="clientSecret" /><br />
						<input type="submit" value="Submit" />
					</form>
				`)

				return
			}

			if (!code) {
				res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${this.#clientId}&scope=${encodeURIComponent(constants.CONNECTOR_DEFAULT_SCOPES.join(' '))}&redirect_uri=${encodeURIComponent(`http://localhost:${this.#port}`)}`);
				return
			}

			try {
				const response = await fetch('https://accounts.spotify.com/api/token', {
					method: 'POST',

					body: new URLSearchParams({
						code: code,
						redirect_uri: `http://localhost:${this.#port}`,
						grant_type: 'authorization_code'
					}),

					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Authorization': `Basic ${Buffer.from(`${this.#clientId}:${this.#clientSecret}`).toString('base64')}`
					}
				})

				if (!response.ok)
					throw new Error(`The access token Spotify API call failed with status "${response.status}".`)

				const data = await response.json()

				this.#refreshToken = data.refresh_token
				this.#accessToken = data.access_token
				this.#setSetup(true)

				streamDeck.client.setGlobalSettings({
					clientId: this.#clientId,
					clientSecret: this.#clientSecret,
					refreshToken: this.#refreshToken,
					accessToken: this.#accessToken
				})

				res.send('OK! You may close this page now!')

				this.#server.close()
				this.#server = null
			} catch (e) {
				logger.error(`An error occured while setting up the connector: "${e}".`)

				res.send(`
					Something went wrong! Please make sure you have entered the correct client ID and secret in the setup settings and try again.

					<form action="/" method="GET">
						<label for="clientId">Client ID:</label>
						<input type="text" id="clientId" name="clientId" /><br />
						<label for="clientSecret">Client Secret:</label>
						<input type="text" id="clientSecret" name="clientSecret" /><br />
						<input type="submit" value="Submit" />
					</form>
				`)
			}
		})

		if (this.#refreshToken)
			this.#refreshAccessToken().then(() => this.#setSetup(true)).catch(e => {
				logger.error(`An error occured while setting up the connector: "${e}".`)
				this.#invalidateSetup()
			})
		else
			this.#server = this.#app.listen(port)
	}

	get set() {
		return this.#setup
	}
}

export default new Connector()
