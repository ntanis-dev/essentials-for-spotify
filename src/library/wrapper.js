import { EventEmitter } from 'events'
import connector from './connector'
import constants from './constants'
import logger from './logger'

class Wrapper extends EventEmitter {
	#lastDevices = []
	#lastMuted = false
	#lastPlaying = false
	#lastShuffleState = false
	#lastVolumePercent = 100
	#lastDevice = null
	#lastSong = null
	#lastPlaybackStateUpdate = null
	#songChangeForceUpdatePlaybackStateTimeout = null
	#lastRepeatState = 'off'
	#updatePlaybackStateStatus = 'idle'

	constructor() {
		super()

		connector.on('setupStateChanged', state => {
			if (state)
				this.#updatePlaybackState()
		})

		if (connector.set)
			this.#updatePlaybackState()

		setInterval(() => {
			if (!connector.set)
				return

			this.#updatePlaybackState()
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
		
		if (volumePercent > 0)
			this.#setMuted(false)
		else if (volumePercent === 0 && this.#lastMuted === false)
			this.#setMuted(this.#lastVolumePercent || constants.VOLUME_PERCENT_MUTE_RESTORE)

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastVolumePercent = volumePercent
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

	#setSong(song, pending = false) {
		const songChanged = this.#lastSong?.item?.id !== song?.item?.id
		const likedChanged = this.#lastSong?.liked !== song?.liked

		if ((!songChanged) && (!likedChanged) && (!pending))
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastSong = song

		if (songChanged)
			this.emit('songChanged', song, pending)

		if (likedChanged)
			this.emit('likedStateChanged', song?.liked, pending)
	}

	#setDevices(last, devices) {
		if (this.#lastDevice !== last) {
			this.#updatePlaybackStateStatus = 'skip'
			this.#lastDevice = last
			this.emit('deviceChanged', last)
		}

		if (!(this.#lastDevices.length !== devices.length || this.#lastDevices.some((device, index) => device.id !== devices[index].id) || this.#lastDevices.some((device, index) => device.is_active !== devices[index].is_active)))
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastDevices = devices

		this.emit('devicesChanged', devices)
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

			this.#setSong(response?.item ? {
				item: response.item,
				liked: (await connector.callSpotifyApi(`me/tracks/contains?ids=${response.item.id}`))[0]
			} : null)

			this.#setDevices(response?.device.id || null, (await connector.callSpotifyApi('me/player/devices')).devices)
		} catch (e) {
			return {}
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async #callPlaybackApi(fn) {
		this.#updatePlaybackStateStatus = 'pause'

		try {
			return await fn()
		} catch (e) {
			return false
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async resumePlayback(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			const response = await connector.callSpotifyApi(`me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.resumePlayback(this.#lastDevices[0].id)

			if (this.#lastSong === null) {
				clearTimeout(this.#songChangeForceUpdatePlaybackStateTimeout)
				this.#setSong(null, true)
				this.#songChangeForceUpdatePlaybackStateTimeout = setTimeout(async () => await this.#updatePlaybackState(true), constants.SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP)
			}

			this.#setPlaying(true)

			return true
		})
	}

	async pausePlayback(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			const response = await connector.callSpotifyApi(`me/player/pause${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.pausePlayback(this.#lastDevices[0].id)

			this.#setPlaying(false)

			return true
		})
	}

	async nextSong(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			const response = await connector.callSpotifyApi(`me/player/next${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'POST'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.nextSong(this.#lastDevices[0].id)

			clearTimeout(this.#songChangeForceUpdatePlaybackStateTimeout)
			this.#setSong(null, true)
			this.#songChangeForceUpdatePlaybackStateTimeout = setTimeout(async () => await this.#updatePlaybackState(true), constants.SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP)

			return true
		})
	}

	async previousSong(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			const response = await connector.callSpotifyApi(`me/player/previous${deviceId ? `?device_id=${deviceId}` : ''}`, {
				method: 'POST'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.previousSong(this.#lastDevices[0].id)

			clearTimeout(this.#songChangeForceUpdatePlaybackStateTimeout)
			this.#setSong(null, true)
			this.#songChangeForceUpdatePlaybackStateTimeout = setTimeout(async () => await this.#updatePlaybackState(true), constants.SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP)

			return true
		})
	}

	async turnOnShuffle(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			const response = await connector.callSpotifyApi(`me/player/shuffle?state=true${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOnShuffle(this.#lastDevices[0].id)

			this.#setShuffleState(true)

			return true
		})
	}

	async turnOffShuffle(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			const response = await connector.callSpotifyApi(`me/player/shuffle?state=false${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOffShuffle(this.#lastDevices[0].id)

			this.#setShuffleState(false)

			return true
		})
	}

	async turnOnContextRepeat(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			const response = await connector.callSpotifyApi(`me/player/repeat?state=context${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOnContextRepeat(this.#lastDevices[0].id)

			this.#setRepeatState('context')

			return true
		})
	}

	async turnOnTrackRepeat(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			const response = await connector.callSpotifyApi(`me/player/repeat?state=track${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOnTrackRepeat(this.#lastDevices[0].id)

			this.#setRepeatState('track')

			return true
		})
	}

	async turnOffRepeat(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			const response = await connector.callSpotifyApi(`me/player/repeat?state=off${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.turnOffRepeat(this.#lastDevices[0].id)

			this.#setRepeatState('off')

			return true
		})
	}

	async setPlaybackVolume(volumePercent, deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			volumePercent = Math.max(0, Math.min(100, volumePercent))

			const response = await connector.callSpotifyApi(`me/player/volume?volume_percent=${volumePercent}${deviceId ? `&device_id=${deviceId}` : ''}`, {
				method: 'PUT'
			})

			if (response === constants.API_NOT_FOUND_RESPONSE && this.#lastDevices.length > 0)
				return this.setPlaybackVolume(volumePercent, this.#lastDevices[0].id)

			this.#setVolumePercent(volumePercent)

			return true
		})
	}

	async muteVolume(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			this.#setMuted(this.#lastVolumePercent)
			return this.setPlaybackVolume(0, deviceId)
		})
	}

	async unmuteVolume(deviceId = this.#lastDevice) {
		return this.#callPlaybackApi(async () => {
			return this.setPlaybackVolume(this.#lastMuted, deviceId)
		})
	}

	async likeLastSong() {
		return this.#callPlaybackApi(async () => {
			if (!this.#lastSong)
				throw new Error('Tried to like last song, but no song is playing.')
	
			await connector.callSpotifyApi(`me/tracks?ids=${this.#lastSong.item.id}`, {
				method: 'PUT'
			})

			this.#setSong({
				item: this.#lastSong.item,
				liked: true
			})

			return true
		})
	}

	async unlikeLastSong() {
		return this.#callPlaybackApi(async () => {
			if (!this.#lastSong)
				throw new Error('Tried to unlike last song, but no song is playing.')
	
			await connector.callSpotifyApi(`me/tracks?ids=${this.#lastSong.item.id}`, {
				method: 'DELETE'
			})

			this.#setSong({
				item: this.#lastSong.item,
				liked: false
			})

			return true
		})
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
