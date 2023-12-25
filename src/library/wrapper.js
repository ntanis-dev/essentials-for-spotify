import { EventEmitter } from 'events'
import connector from './connector'
import constants from './constants'
import logger from './logger'
import helpers from './helpers'

class Wrapper extends EventEmitter {
	#lastMuted = false
	#lastPlaying = false
	#lastShuffleState = false
	#lastRepeatState = 'off'
	#lastVolumePercent = 100
	#lastDevice = null
	#lastSong = null
	#lastDevices = []
	#lastPlaybackStateUpdate = null
	#songChangeForceUpdatePlaybackStateTimeout = null
	#updatePlaybackStateStatus = 'idle'

	constructor() {
		super()

		connector.on('setupStateChanged', state => {
			if (state)
				this.#onConnectorSetup()
		})

		if (connector.set)
			this.#onConnectorSetup()

		setInterval(() => {
			if (!connector.set)
				return

			this.#updatePlaybackState().then(response => {}).catch(e => logger.error(`Failed to update playback state on interval: ${e}`))
		}, constants.INTERVAL_CHECK_UPDATE_PLAYBACK_STATE)
	}

	#setPlaying(playing) {
		if (this.#lastPlaying === playing)
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastPlaying = playing
		this.emit('playbackStateChanged', playing)
	}

	#setRepeatState(repeatState) {
		if (this.#lastRepeatState === repeatState)
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastRepeatState = repeatState
		this.emit('repeatStateChanged', repeatState)
	}

	#setShuffleState(shuffleState) {
		if (this.#lastShuffleState === shuffleState)
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastShuffleState = shuffleState
		this.emit('shuffleStateChanged', shuffleState)
	}

	#setVolumePercent(volumePercent) {
		if (this.#lastVolumePercent === volumePercent)
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastVolumePercent = volumePercent

		if (this.#lastVolumePercent > 0)
			this.#setMuted(false)
		else if (this.#lastVolumePercent === 0 && this.#lastMuted === false)
			this.#setMuted(constants.VOLUME_PERCENT_MUTE_RESTORE)

		this.emit('volumePercentChanged', volumePercent)
	}

	#setMuted(volumePercent) {
		if (this.#lastMuted === volumePercent)
			return

		this.#updatePlaybackStateStatus = 'skip'

		if (volumePercent === false)
			this.#lastMuted = false
		else
			this.#lastMuted = volumePercent

		this.emit('mutedStateChanged', this.#lastMuted !== false)
	}

	#setLastSong(song, pending = false) {
		const songChanged = this.#lastSong?.item?.id !== song?.item?.id
		const likedChanged = this.#lastSong?.liked !== song?.liked

		if ((!songChanged) && (!likedChanged))
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastSong = song

		if (songChanged)
			this.emit('songChanged', song, pending)

		if (likedChanged)
			this.emit('likedStateChanged', song?.liked, pending)
	}

	#onConnectorSetup() {
		this.#updatePlaybackState().then(response => {}).catch(e => logger.error(`Failed to update playback state on setup: ${e}`))

		this.#getDevices().then(response => {
			this.#lastDevices = response
		}).catch(e => logger.error(`Failed to get devices on setup: ${e}`))
	}
	
	async #updatePlaybackState(force = false) {
		if (this.#updatePlaybackStateStatus === 'skip' && (!force)) {
			this.#updatePlaybackStateStatus = 'idle'
			return
		} else if (this.#updatePlaybackStateStatus === 'updating' || this.#updatePlaybackStateStatus === 'pause')
			return

		if (this.#lastPlaybackStateUpdate && (Date.now() - this.#lastPlaybackStateUpdate < constants.INTERVAL_UPDATE_PLAYBACK_STATE) && (!force))
			return

		this.#lastPlaybackStateUpdate = Date.now()
		this.#updatePlaybackStateStatus = 'updating'

		try {
			let response = await connector.callSpotifyApi('me/player')

			if (response === constants.API_EMPTY_RESPONSE)
				response = undefined

			this.#setPlaying(response?.is_playing || false)
			this.#setRepeatState(response?.repeat_state || 'off')
			this.#setShuffleState(response?.shuffle_state || false)
			this.#setVolumePercent(typeof(response?.device.volume_percent) !== 'number' ? 100 : response.device.volume_percent)

			this.#setLastSong(response?.item ? {
				item: response.item,
				liked: await this.#getSongIdIsLiked(response.item.id)
			} : null)

			this.#lastDevice = response?.device.id || null
		} catch (e) {
			logger.error(e)
			return {}
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async #getSongIdIsLiked(id) {
		try {
			const response = await connector.callSpotifyApi(`me/tracks/contains?ids=${id}`)
			return response[0]
		} catch (e) {
			logger.error(e)
			return false
		}
	}

	async #getDevices() {
		try {
			const response = await connector.callSpotifyApi('me/player/devices')
			return response.devices
		} catch (e) {
			logger.error(e)
			return []
		}
	}

	async resumePlayback(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			const response = await connector.callSpotifyApi(`me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.resumePlayback(this.#lastDevices[0].id)

			this.#setPlaying(true)

			return true
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async pausePlayback(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			const response = await connector.callSpotifyApi(`me/player/pause${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.pausePlayback(this.#lastDevices[0].id)

			this.#setPlaying(false)

			return true
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async nextSong(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			const response = await connector.callSpotifyApi(`me/player/next${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'POST'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.nextSong(this.#lastDevices[0].id)

			clearTimeout(this.#songChangeForceUpdatePlaybackStateTimeout)

			this.#setLastSong(null, true)
			this.#songChangeForceUpdatePlaybackStateTimeout = setTimeout(async () => await this.#updatePlaybackState(true), constants.SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP)
			
			return true
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async previousSong(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			const response = await connector.callSpotifyApi(`me/player/previous${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'POST'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.previousSong(this.#lastDevices[0].id)

			clearTimeout(this.#songChangeForceUpdatePlaybackStateTimeout)

			this.#setLastSong(null, true)
			this.#songChangeForceUpdatePlaybackStateTimeout = setTimeout(async () => await this.#updatePlaybackState(true), constants.SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP)

			return true
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async turnOnShuffle(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			const response = await connector.callSpotifyApi(`me/player/shuffle?state=true${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOnShuffle(this.#lastDevices[0].id)

			this.#setShuffleState(true)

			return true
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async turnOffShuffle(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			const response = await connector.callSpotifyApi(`me/player/shuffle?state=false${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOffShuffle(this.#lastDevices[0].id)

			this.#setShuffleState(false)

			return true
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async turnOnContextRepeat(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			const response = await connector.callSpotifyApi(`me/player/repeat?state=context${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOnContextRepeat(this.#lastDevices[0].id)

			this.#setRepeatState('context')

			return true
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async turnOnTrackRepeat(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			const response = await connector.callSpotifyApi(`me/player/repeat?state=track${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOnTrackRepeat(this.#lastDevices[0].id)

			this.#setRepeatState('track')

			return true
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async turnOffRepeat(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			const response = await connector.callSpotifyApi(`me/player/repeat?state=off${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOffRepeat(this.#lastDevices[0].id)

			this.#setRepeatState('off')

			return true
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async setPlaybackVolume(volumePercent, deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			volumePercent = Math.max(0, Math.min(100, volumePercent))

			const response = await connector.callSpotifyApi(`me/player/volume?volume_percent=${volumePercent}${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.setPlaybackVolume(volumePercent, this.#lastDevices[0].id)

			this.#setVolumePercent(volumePercent)

			return true
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async muteVolume(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			this.#setMuted(this.#lastVolumePercent)
			return this.setPlaybackVolume(0, deviceId)
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async unmuteVolume(deviceId = this.#lastDevice) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			return this.setPlaybackVolume(this.#lastMuted, deviceId)
		} catch (e) {
			logger.error(e)
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async likeLastSong() {
		this.#updatePlaybackStateStatus = 'pause'

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
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async unlikeLastSong() {
		this.#updatePlaybackStateStatus = 'pause'

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
		} finally {
			this.#updatePlaybackStateStatus = 'idle'	
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
