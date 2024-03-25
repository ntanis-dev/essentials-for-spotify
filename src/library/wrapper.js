import {
	EventEmitter
} from 'events'

import connector from './connector'
import constants from './constants'
import logger from './logger'

class Wrapper extends EventEmitter {
	#pendingWrappedCall = false
	#lastPlaying = null
	#lastMuted = null
	#lastShuffleState = null
	#lastPendingSong = null
	#lastVolumePercent = null
	#lastDevice = null
	#lastSong = null
	#previousSong = null
	#lastSongTimeUpdateAt = null
	#lastPlaybackContext = null
	#lastPlaybackStateUpdate = null
	#lastRepeatState = null
	#lastCurrentlyPlayingType = null
	#lastUser = null
	#songChangeForceUpdatePlaybackStateTimeout = null
	#lastDevices = []
	#lastDisallowFlags = []
	#updatePlaybackStateStatus = 'idle'

	constructor() {
		super()

		connector.on('setupStateChanged', state => {
			if (state)
				this.#updatePlaybackState(true)
			else {
				this.#setPlaying(false)
				this.#setRepeatState('off')
				this.#setShuffleState(false)
				this.#setVolumePercent(null)
				this.#setPlaybackContext(null)
				this.#setSong(null)
				this.#setDevices(null, [])
				this.#setDisallowFlags([])
				this.#setCurrentlyPlayingType(null)
				this.#setUser(null)
			}
		})

		if (connector.set)
			this.#updatePlaybackState()

		setInterval(() => {
			if (!connector.set)
				return

			this.#updatePlaybackState()
		}, constants.INTERVAL_CHECK_UPDATE_PLAYBACK_STATE)

		setInterval(() => {
			if (!connector.set)
				return

			if ((!this.#lastSong) || (!this.#lastPlaying))
				return

			const timeDiff = (Date.now() - this.#lastSongTimeUpdateAt)

			this.#setSong({
				item: this.#lastSong.item,
				liked: this.#lastSong.liked,
				progress: Math.min(this.#lastSong.progress + timeDiff, this.#lastSong.item.duration_ms),
				surprise: this.#lastSong.surprise
			}, false, true)
		}, constants.INTERVAL_CHECK_UPDATE_SONG_TIME)
	}

	async #wrapCall(fn, parallel = false) {
		if (!parallel) {
			if (this.#pendingWrappedCall)
				return constants.WRAPPER_RESPONSE_BUSY

			this.#updatePlaybackStateStatus = 'pause'
			this.#pendingWrappedCall = true
		}

		try {
			return await fn()
		} catch (e) {
			let response = constants.WRAPPER_RESPONSE_FATAL_ERROR

			if (e instanceof constants.ApiError)
				response = e.status == 429 ? constants.WRAPPER_RESPONSE_API_RATE_LIMITED : constants.WRAPPER_RESPONSE_API_ERROR
			else if (e instanceof constants.NoDeviceError)
				response = constants.WRAPPER_RESPONSE_NO_DEVICE_ERROR

			if (response !== constants.WRAPPER_RESPONSE_API_RATE_LIMITED)
				logger.error(`An error occured while responding to a wrapper call: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)

			return response
		} finally {
			if (!parallel) {
				this.#updatePlaybackStateStatus = 'idle'
				this.#lastPlaybackStateUpdate = Date.now()
				this.#pendingWrappedCall = false
			}
		}
	}

	async #deviceCall(path, options, deviceId) {
		path = `${path}${path.includes('?') ? '&' : '?'}`

		let response = await connector.callSpotifyApi(`${path}${deviceId ? `device_id=${deviceId}` : ''}`, options, [constants.API_NOT_FOUND_RESPONSE, constants.API_EMPTY_RESPONSE])

		if (response === constants.API_NOT_FOUND_RESPONSE) {
			const activeDevices = this.#lastDevices || []

			if (activeDevices.length > 0) {
				response = await connector.callSpotifyApi(`${path}device_id=${activeDevices[0].id}`, options, [constants.API_NOT_FOUND_RESPONSE, constants.API_EMPTY_RESPONSE])

				if (response === constants.API_NOT_FOUND_RESPONSE)
					throw new constants.NoDeviceError('No device available.')
			} else
				throw new constants.NoDeviceError('No device available.')
		}

		return response
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
			let userResponse = await connector.callSpotifyApi('me')

			if ((!userResponse) || typeof userResponse !== 'object')
				userResponse = undefined

			this.#setUser(userResponse || null)

			let response = await connector.callSpotifyApi('me/player', undefined, [constants.API_EMPTY_RESPONSE])

			if (response === constants.API_EMPTY_RESPONSE)
				response = undefined

			this.#setPlaying(response?.is_playing || false)
			this.#setRepeatState(response?.repeat_state || 'off')
			this.#setShuffleState(response?.shuffle_state || false)
			this.#setVolumePercent(response?.device.supports_volume ? (typeof response?.device.volume_percent !== 'number' ? 100 : response.device.volume_percent) : null)
			this.#setPlaybackContext(response?.context?.uri || null)

			this.#setSong(response?.item ? {
				item: response.item,
				liked: (await connector.callSpotifyApi(`me/tracks/contains?ids=${response.item.id}`))[0],
				progress: response.progress_ms,
				surprise: this.#lastSong && this.#lastSong.item.id === response.item.id ? this.#lastSong.surprise : false
			} : null)

			this.#setDevices(response?.device.id || null, (await connector.callSpotifyApi('me/player/devices')).devices)
			this.#setDisallowFlags(response?.actions?.disallows ? Object.keys(response.actions.disallows).filter(flag => response.actions.disallows[flag]) : [])
			this.#setCurrentlyPlayingType(response?.currently_playing_type || null)
		} catch (e) {
			logger.error(`An error occured while updating playback state: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	#setPlaying(playing) {
		if (this.#lastPlaying === playing)
			return

		if (playing)
			this.#lastSongTimeUpdateAt = Date.now()

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

	#setPlaybackContext(context) {
		if (this.#lastPlaybackContext === context)
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastPlaybackContext = context
		this.emit('playbackContextChanged', context)
	}

	#setVolumePercent(volumePercent) {
		if (this.#lastVolumePercent === volumePercent)
			return

		if (volumePercent !== null)
			if (volumePercent > 0)
				this.#setMuted(false)
			else if (volumePercent === 0 && this.#lastMuted === false)
				this.#setMuted(0)

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

	#setSong(song, pending = false, allowPlaybackStateUpdate = false) {
		this.#lastPendingSong = pending

		if (!allowPlaybackStateUpdate)
			this.#updatePlaybackStateStatus = 'skip'

		if (!song) {
			const hadSong = !!this.#lastSong

			this.#lastSong = null

			if (hadSong || this.#lastCurrentlyPlayingType !== 'track') {
				this.emit('songChanged', null, pending)
				this.emit('songLikedStateChanged', false, pending)
				this.emit('songTimeChanged', 0, 0, pending)
			}
		} else {
			const previousSongChanged = this.#previousSong?.item?.id !== song.item.id
			const previousSongLikedChanged = this.#previousSong?.liked !== song.liked
			const previousSongTimeChanged = this.#previousSong?.progress !== song.progress || this.#previousSong?.item?.duration_ms !== song.item.duration_ms

			if (this.#previousSong && (!previousSongChanged) && (!previousSongLikedChanged) && (!previousSongTimeChanged) && (this.#lastPlaying))
				return

			const songChanged = this.#lastSong?.item?.id !== song?.item?.id
			const likedChanged = this.#lastSong?.liked !== song?.liked
			const timeChanged = this.#lastSong?.progress !== song?.progress || this.#lastSong?.item?.duration_ms !== song?.duration_ms

			this.#lastSong = song
			this.#previousSong = Object.assign({}, this.#lastSong)

			if (songChanged || timeChanged)
				this.#lastSongTimeUpdateAt = Date.now()

			if (songChanged)
				this.emit('songChanged', song, pending)

			if (likedChanged)
				this.emit('songLikedStateChanged', song.liked, pending)

			if (timeChanged)
				this.emit('songTimeChanged', song.progress, song.item.duration_ms, pending)

			if (this.#lastSong.progress > this.#lastSong.item.duration_ms)
				this.#onSongChangeExpected(true)
		}
	}

	#setDevices(last, devices) {
		if (this.#lastDevice !== last) {
			this.#updatePlaybackStateStatus = 'skip'
			this.#lastDevice = last
			this.emit('deviceChanged', last)
		}

		if (this.#lastDevices && this.#lastDevices.length === devices.length && this.#lastDevices.every((device, index) => device.id === devices[index].id))
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastDevices = devices
		this.emit('devicesChanged', devices)
	}

	#setDisallowFlags(disallowFlags) {
		if (this.#lastDisallowFlags.length === disallowFlags.length && this.#lastDisallowFlags.every((flag, index) => flag === disallowFlags[index]))
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastDisallowFlags = disallowFlags
		this.emit('disallowFlagsChanged', disallowFlags)
	}

	#setCurrentlyPlayingType(type) {
		if (this.#lastCurrentlyPlayingType === type)
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastCurrentlyPlayingType = type
		this.emit('currentlyPlayingTypeChanged', type)
	}

	#setUser(user) {
		if (this.#lastUser?.id === user?.id)
			return

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastUser = user
		this.emit('userChanged', user)
	}

	#onSongChangeExpected(byTime = false) {
		clearTimeout(this.#songChangeForceUpdatePlaybackStateTimeout)
		this.#setSong(null, true)
		this.#songChangeForceUpdatePlaybackStateTimeout = setTimeout(() => this.#updatePlaybackState(true), byTime ? constants.SONG_CHANGE_FORCE_UPDATE_PLAYBACK_TIME_SLEEP : constants.SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP)
	}

	async resumePlayback(deviceId = this.#lastDevice) {
		if (this.#lastPlaying || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/play', {
				method: 'PUT'
			}, deviceId)

			if (!this.#lastSong)
				this.#onSongChangeExpected()

			this.#setPlaying(true)

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async pausePlayback(deviceId = this.#lastDevice) {
		if ((!this.#lastPlaying) || this.#lastDisallowFlags.includes('interrupting_playback') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/pause', {
				method: 'PUT'
			}, deviceId)

			this.#setPlaying(false)

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async nextSong(deviceId = this.#lastDevice) {
		if (this.#lastDisallowFlags.includes('skipping_next') || this.#lastDisallowFlags.includes('interrupting_playback') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/next', {
				method: 'POST'
			}, deviceId)

			if (this.#lastCurrentlyPlayingType === 'track')
				this.#onSongChangeExpected()
			else
				await this.#updatePlaybackState(true)

			return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
		})
	}

	async previousSong(deviceId = this.#lastDevice) {
		if (this.#lastDisallowFlags.includes('skipping_prev') || this.#lastDisallowFlags.includes('interrupting_playback') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/previous', {
				method: 'POST'
			}, deviceId)

			if (this.#lastCurrentlyPlayingType === 'track')
				this.#onSongChangeExpected()
			else
				await this.#updatePlaybackState(true)

			return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
		})
	}

	async turnOnShuffle(deviceId = this.#lastDevice) {
		if (this.#lastDisallowFlags.includes('toggling_shuffle') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/shuffle?state=true', {
				method: 'PUT'
			}, deviceId)

			this.#setShuffleState(true)

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async turnOffShuffle(deviceId = this.#lastDevice) {
		if (this.#lastDisallowFlags.includes('toggling_shuffle') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/shuffle?state=false', {
				method: 'PUT'
			}, deviceId)

			this.#setShuffleState(false)

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async turnOnContextRepeat(deviceId = this.#lastDevice) {
		if (this.#lastDisallowFlags.includes('toggling_repeat_context') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/repeat?state=context', {
				method: 'PUT'
			}, deviceId)

			this.#setRepeatState('context')

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async turnOnTrackRepeat(deviceId = this.#lastDevice) {
		if (this.#lastDisallowFlags.includes('toggling_repeat_track') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/repeat?state=track', {
				method: 'PUT'
			}, deviceId)

			this.#setRepeatState('track')

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async turnOffRepeat(deviceId = this.#lastDevice) {
		if ((this.#lastDisallowFlags.includes('toggling_repeat_context') && this.#lastRepeatState === 'context') || (this.#lastDisallowFlags.includes('toggling_repeat_track') && this.#lastRepeatState === 'track') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/repeat?state=off', {
				method: 'PUT'
			}, deviceId)

			this.#setRepeatState('off')

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async setPlaybackVolume(volumePercent, deviceId = this.#lastDevice) {
		if ((this.#lastDisallowFlags.includes('interrupting_playback') && volumePercent <= 0) || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			volumePercent = Math.max(0, Math.min(100, volumePercent))

			await this.#deviceCall(`me/player/volume?volume_percent=${volumePercent}`, {
				method: 'PUT'
			}, deviceId)

			this.#setVolumePercent(volumePercent)

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async muteVolume(deviceId = this.#lastDevice) {
		const lastVolumePercent = this.#lastVolumePercent

		return this.setPlaybackVolume(0, deviceId).then(() => {
			this.#setMuted(lastVolumePercent)
		})
	}

	async unmuteVolume(deviceId = this.#lastDevice) {
		return this.setPlaybackVolume(this.#lastMuted || constants.VOLUME_PERCENT_MUTE_RESTORE, deviceId)
	}

	async likeSong(song) {
		return this.#wrapCall(async () => {
			await connector.callSpotifyApi(`me/tracks?ids=${song.item.id}`, {
				method: 'PUT'
			})

			this.#setSong({
				item: song.item,
				liked: true,
				progress: song.progress,
				surprise: song.surprise
			})

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async unlikeSong(song) {
		return this.#wrapCall(async () => {
			await connector.callSpotifyApi(`me/tracks?ids=${song.item.id}`, {
				method: 'DELETE'
			})

			this.#setSong({
				item: song.item,
				liked: false,
				progress: song.progress,
				surprise: song.surprise
			})

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async forwardSeek(song, time, deviceId = this.#lastDevice) {
		if (this.#lastDisallowFlags.includes('seeking') || this.#lastDisallowFlags.includes('interrupting_playback') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall(`me/player/seek?position_ms=${song.progress + time}`, {
				method: 'PUT'
			}, deviceId)

			this.#setSong({
				item: song.item,
				liked: song.liked,
				progress: song.progress + time,
				surprise: song.surprise
			})

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async backwardSeek(song, time, deviceId = this.#lastDevice) {
		if (this.#lastDisallowFlags.includes('seeking') || this.#lastDisallowFlags.includes('interrupting_playback') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			const newProgress = Math.max(0, song.progress - time)

			await this.#deviceCall(`me/player/seek?position_ms=${newProgress}`, {
				method: 'PUT'
			}, deviceId)

			this.#setSong({
				item: song.item,
				liked: song.liked,
				progress: newProgress,
				surprise: song.surprise
			})

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async surpriseMe(deviceId = this.#lastDevice) {
		if (this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			let recommendations = {
				tracks: []
			}

			if ((!this.#lastPlaying) || (!this.#lastSong) || this.#lastSong.surprise) {
				const genreSeeds = await connector.callSpotifyApi('recommendations/available-genre-seeds')

				if (!genreSeeds.genres.length)
					throw new constants.ApiError('No genre seeds available.')

				const randomSeeds = []

				for (let i = 0; i < 5; i++) {
					const randomIndex = Math.floor(Math.random() * genreSeeds.genres.length)
					randomSeeds.push(genreSeeds.genres[randomIndex])
				}

				recommendations = await connector.callSpotifyApi(`recommendations?seed_genres=${randomSeeds.join(',')}`)
			} else
				recommendations = await connector.callSpotifyApi(`recommendations?seed_tracks=${this.#lastSong.item.id}`)

			if (!recommendations.tracks.length)
				throw new constants.ApiError('No recommendations available.')

			await this.#deviceCall('me/player/play', {
				method: 'PUT',

				body: JSON.stringify({
					uris: recommendations.tracks.map(track => track.uri)
				})
			}, deviceId)

			this.#setSong({
				item: recommendations.tracks[0],
				liked: (await connector.callSpotifyApi(`me/tracks/contains?ids=${recommendations.tracks[0].id}`))[0],
				progress: 0,
				surprise: this.#lastSong?.surprise || (!this.#lastPlaying)
			})

			this.#setPlaying(true)

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async playPlaylist(playlistId, deviceId = this.#lastDevice) {
		if (this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/play', {
				method: 'PUT',

				body: JSON.stringify({
					context_uri: `spotify:playlist:${playlistId}`
				})
			}, deviceId)

			this.#onSongChangeExpected()

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async getPlaylists(page = 1) {
		return this.#wrapCall(async () => {
			const playlists = await connector.callSpotifyApi(`me/playlists?limit=${constants.WRAPPER_PLAYLISTS_PER_PAGE}&offset=${(page - 1) * constants.WRAPPER_PLAYLISTS_PER_PAGE}`)

			return {
				status: constants.WRAPPER_RESPONSE_SUCCESS,

				items: playlists.items.map(playlist => ({
					id: playlist.id,
					name: playlist.name,
					owner: playlist.owner.display_name,
					images: playlist.images
				})),

				total: playlists.total
			}
		}, true)
	}

	async getFeaturedPlaylists(page = 1) {
		return this.#wrapCall(async () => {
			const playlists = await connector.callSpotifyApi(`browse/featured-playlists?limit=${constants.WRAPPER_PLAYLISTS_PER_PAGE}&offset=${(page - 1) * constants.WRAPPER_PLAYLISTS_PER_PAGE}`)

			return {
				status: constants.WRAPPER_RESPONSE_SUCCESS,

				items: playlists.playlists.items.map(playlist => ({
					id: playlist.id,
					name: playlist.name,
					owner: playlist.owner.display_name,
					images: playlist.images
				})),

				total: playlists.playlists.total
			}
		}, true)
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

	get playbackContext() {
		return this.#lastPlaybackContext
	}

	get volumePercent() {
		return this.#lastVolumePercent
	}

	get mutedVolumePercent() {
		return this.#lastMuted || 0
	}

	get muted() {
		return this.#lastMuted !== false
	}

	get song() {
		return this.#lastSong
	}

	get device() {
		return this.#lastDevice
	}

	get user() {
		return this.#lastUser
	}

	get pendingSongChange() {
		return this.#lastPendingSong
	}
}

export default new Wrapper()
