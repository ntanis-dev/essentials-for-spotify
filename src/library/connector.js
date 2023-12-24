import express from 'express'
import logger from './logger.js'

const DEFAULT_SCOPES = [
	'user-read-playback-state',
	'user-modify-playback-state'	
]

class Connector {
	#accessToken = null
	#refreshToken = null
	#clientId = null
	#clientSecret = null
	#app = null
	#port = null
	#server = null
	#setup = false

	async #refreshAccessToken() {
		if (!this.#setup)
			throw new Error('Tried to refresh access token without a finished setup.')

		try {
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
				throw new Error(`HTTP error during refresh access token! Status: ${response.status}`)

			const data = await response.json()

			this.#accessToken = data.access_token

			logger.info(`Refreshed access token, new value: "${this.#accessToken}".`)
		} catch (e) {
			this.#invalidateSetup()
			throw e
		}
	}

	#invalidateSetup() {
		if (!this.#setup)
			return

		this.#setup = false
		this.#accessToken = null
		this.#refreshToken = null
		this.#app.listen(this.#port, () => logger.info(`Setup server is now listening @ http://localhost:${port}`))

		logger.info('Setup was invalidated.')
	}

	async callSpotifyApi(path, options = {}, refresh = false) {
		if (!this.#setup)
			throw new Error('Tried to call Spotify API without a finished setup.')

		try {
			const response = await fetch(`https://api.spotify.com/v1/${path}`, {
				...options,

				headers: {
					...options.headers,
					'Authorization': `Bearer ${this.#accessToken}`
				}
			})

			logger.info(await response.text())

			if (!response.ok)
				throw new Error(`HTTP error during Spotify API call! Status: ${response.status}`)

			if (response.status === 401 && (!refresh)) {
				await this.#refreshAccessToken()
				return this.callSpotifyApi(path, options, true)
			}

			logger.info(`Called Spotify API: ${path}`)
			logger.info(await response.text())

			return response.json()
		} catch (e) {
			throw e
		}
	}

	setup(clientId, clientSecret, port = 4202) {
		if (this.#app)
			throw new Error('Tried to setup connector twice.')

		this.#clientId = clientId
		this.#clientSecret = clientSecret
		this.#port = port

		this.#app = express()

		this.#app.get('/', async (req, res) => {
			const code = req.query.code

			if (!code) {
				res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${this.#clientId}&scope=${encodeURIComponent(DEFAULT_SCOPES.join(' '))}&redirect_uri=${encodeURIComponent(`http://localhost:${this.#port}`)}`);
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
					throw new Error(`HTTP error during authorization! Status: ${response.status}`)

				const data = await response.json()

				this.#refreshToken = data.refresh_token
				this.#accessToken = data.access_token
				this.#setup = true

				res.send('OK! You may close this page now!')

				this.#server.close()

				this.#app = null
				this.#server = null

				logger.info(`Finished setup, access token: "${this.#accessToken}", refresh token: "${this.#refreshToken}".`)
			} catch (e) {
				logger.error(`Error during setup: ${e}`)
				res.send('Something went wrong! Please make sure you have entered the correct client ID and secret in the setup settings and try again.')
			}
		})

		this.#server = this.#app.listen(port, () => logger.info(`Setup server is now listening @ http://localhost:${port}`))
	}
}

export default new Connector()
