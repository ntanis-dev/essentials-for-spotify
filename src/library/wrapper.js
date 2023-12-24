import connector from './connector'
import logger from './logger'

class Wrapper {
	async callSpotifyApi(path, options = {}) {
		return connector.callSpotifyApi(path, options)
	}

	async resumePlayback(deviceId = null) {
		try {
			await connector.callSpotifyApi(`me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async pausePlayback(deviceId = null) {
		try {
			await connector.callSpotifyApi(`me/player/pause${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}
}

export default new Wrapper()
