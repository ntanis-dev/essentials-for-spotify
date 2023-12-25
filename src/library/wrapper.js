import { EventEmitter } from 'events'
import connector, { NOT_FOUND_RESPONSE } from './connector'
import logger from './logger'

class Wrapper extends EventEmitter {
	#lastMuted = false
	#lastPlaying = false
	#lastShuffleState = false
	#lastRepeatState = 'off'
	#lastVolumePercent = 100
	#lastDevice = null
	#lastSong = null
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
		this.#lastPlaying = playing
		this.emit('playbackStateChanged', playing)
	}

	#setRepeatState(repeatState) {
		this.#lastRepeatState = repeatState
		this.emit('repeatStateChanged', repeatState)
	}

	#setShuffleState(shuffleState) {
		this.#lastShuffleState = shuffleState
		this.emit('shuffleStateChanged', shuffleState)
	}

	#setVolumePercent(volumePercent) {
		this.#lastVolumePercent = volumePercent

		if (this.#lastVolumePercent > 0)
			this.#setMuted(false)
		else if (this.#lastVolumePercent === 0 && this.#lastMuted === false)
			this.#setMuted(50)

		this.emit('volumePercentChanged', volumePercent)
	}

	#setMuted(volumePercent) {
		if (volumePercent === false)
			this.#lastMuted = false
		else
			this.#lastMuted = volumePercent

		this.emit('mutedStateChanged', this.#lastMuted !== false)
	}

	#setLastSong(song) {
		logger.info(`Song changed to "${song?.item.id}".`)

		this.#lastSong = song
		this.emit('songChanged', song)
	}

	#onConnectorSetup() {
		this.updatePlaybackState().then(response => {}).catch(e => logger.error(`Failed to update playback state on setup: ${e}`))

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

	async turnOnShuffle(deviceId = this.#lastDevice) {
		try {
			const response = await connector.callSpotifyApi(`me/player/shuffle?state=true${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOnShuffle(this.#lastDevices[0].id)

			this.#setShuffleState(true)

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async turnOffShuffle(deviceId = this.#lastDevice) {
		try {
			const response = await connector.callSpotifyApi(`me/player/shuffle?state=false${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOffShuffle(this.#lastDevices[0].id)

			this.#setShuffleState(false)

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async turnOnContextRepeat(deviceId = this.#lastDevice) {
		try {
			const response = await connector.callSpotifyApi(`me/player/repeat?state=context${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOnContextRepeat(this.#lastDevices[0].id)

			this.#setRepeatState('context')

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async turnOnTrackRepeat(deviceId = this.#lastDevice) {
		try {
			const response = await connector.callSpotifyApi(`me/player/repeat?state=track${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOnTrackRepeat(this.#lastDevices[0].id)

			this.#setRepeatState('track')

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async turnOffRepeat(deviceId = this.#lastDevice) {
		try {
			const response = await connector.callSpotifyApi(`me/player/repeat?state=off${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOffRepeat(this.#lastDevices[0].id)

			this.#setRepeatState('off')

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async setPlaybackVolume(volumePercent, deviceId = this.#lastDevice) {
		try {
			volumePercent = Math.max(0, Math.min(100, volumePercent))

			const response = await connector.callSpotifyApi(`me/player/volume?volume_percent=${volumePercent}${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.setPlaybackVolume(volumePercent, this.#lastDevices[0].id)

			this.#setVolumePercent(volumePercent)

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async muteVolume(deviceId = this.#lastDevice) {
		try {
			this.#setMuted(this.#lastVolumePercent)
			return this.setPlaybackVolume(0, deviceId)
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async unmuteVolume(deviceId = this.#lastDevice) {
		try {
			return this.setPlaybackVolume(this.#lastMuted, deviceId)
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async likeLastSong() {
		try {
			if (!this.#lastSong)
				throw new Error('Tried to like last song, but no song is playing.')
	
			await connector.callSpotifyApi(`me/tracks?ids=${this.#lastSong.item.id}`, {
				method: 'PUT'
			})

			this.#setLastSong({
				item: this.#lastSong.item,
				liked: true
			})

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async unlikeLastSong() {
		try {
			if (!this.#lastSong)
				throw new Error('Tried to unlike last song, but no song is playing.')
	
			await connector.callSpotifyApi(`me/tracks?ids=${this.#lastSong.item.id}`, {
				method: 'DELETE'
			})

			this.#setLastSong({
				item: this.#lastSong.item,
				liked: false
			})

			return true
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async getSongIdIsLiked(id) {
		try {
			const response = await connector.callSpotifyApi(`me/tracks/contains?ids=${id}`)
			return response[0]
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

	async updatePlaybackState() {
		try {
			const response = await connector.callSpotifyApi('me/player')
			
			this.#setPlaying(response.is_playing || false)
			this.#setRepeatState(response.repeat_state || 'off')
			this.#setShuffleState(response.shuffle_state || false)
			this.#setVolumePercent(response?.device.volume_percent === undefined ? 100 : response.device.volume_percent)

			this.#setLastSong(response.item ? {
				item: response.item,
				liked: await this.getSongIdIsLiked(response.item.id)
			} : null)

			this.#lastDevice = response?.device.id || null
		} catch (e) {
			logger.error(e)
			return {}
		}
	}

	get playing() {
		return this.#lastPlaying
	}

	get repeatState() {
		return this.#lastRepeatState
	}

	get shuffleState() {
		return this.#lastShuffleState
	}

	get volumePercent() {
		return this.#lastVolumePercent
	}

	get muted() {
		return this.#lastMuted !== false
	}

	get song() {
		return this.#lastSong
	}
}

export default new Wrapper()
