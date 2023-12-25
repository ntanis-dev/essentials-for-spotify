import { EventEmitter } from 'events'
import connector, { NOT_FOUND_RESPONSE } from './connector'
import logger from './logger'

class Wrapper extends EventEmitter {
	#playing = false
	#lastDevice = null
	#lastPlaybackState = null
	#lastDevices = []

	constructor() {
		super()

		connector.on('setupStateChanged', state => {
			if (state)
				this.#onConnectorSetup()
		})

		if (connector.setup)
			this.#onConnectorSetup()
	}

	#setPlaying(playing) {
		this.#playing = playing
		this.emit('playbackStateChanged', playing)
	}

	#onConnectorSetup() {
		this.getPlaybackState().then(response => {
			this.#lastPlaybackState = response
		}).catch(e => logger.error(`Failed to get playback state on setup: ${e}`))

		this.getDevices().then(response => {
			this.#lastDevices = response
		}).catch(e => logger.error(`Failed to get devices on setup: ${e}`))
	}

	async resumePlayback(deviceId = this.#lastDevice) {
		try {
			const response = await connector.callSpotifyApi(`me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.resumePlayback(this.#lastDevices[0].id)

			this.#setPlaying(true)

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async pausePlayback(deviceId = this.#lastDevice) {
		try {
			const response = await connector.callSpotifyApi(`me/player/pause${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.pausePlayback(this.#lastDevices[0].id)

			this.#setPlaying(false)

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async nextSong(deviceId = this.#lastDevice) {
		try {
			const response = await connector.callSpotifyApi(`me/player/next${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'POST'
			})

			if (response === NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.nextSong(this.#lastDevices[0].id)

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async previousSong(deviceId = this.#lastDevice) {
		try {
			const response = await connector.callSpotifyApi(`me/player/previous${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'POST'
			})

			if (response === NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.previousSong(this.#lastDevices[0].id)

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async getDevices() {
		try {
			const response = await connector.callSpotifyApi('me/player/devices')
			return response.devices
		} catch (e) {
			logger.error(e)
			return []
		}
	}

	async getPlaybackState() {
		try {
			const response = await connector.callSpotifyApi('me/player')
			
			this.#setPlaying(response.is_playing || false)
			this.#lastDevice = response?.device.id || null

			return response
		} catch (e) {
			logger.error(e)
			return {}
		}
	}

	get playing() {
		return this.#playing
	}
}

export default new Wrapper()
