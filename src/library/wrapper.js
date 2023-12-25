import { EventEmitter } from 'stream'
import connector from './connector'
import logger from './logger'

class Wrapper extends EventEmitter {
	#playing = false
	#lastDevice = null

	#setPlaying(playing) {
		this.#playing = playing
		this.emit('playbackStateChanged', playing)
	}

	async resumePlayback(deviceId = this.#lastDevice) {
		try {
			await connector.callSpotifyApi(`me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			this.#setPlaying(true)

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async pausePlayback(deviceId = this.#lastDevice) {
		try {
			await connector.callSpotifyApi(`me/player/pause${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			this.#setPlaying(false)

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
