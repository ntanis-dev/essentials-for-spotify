import {
	EventEmitter
} from 'events'

import fetch from 'node-fetch'

import connector from './connector'
import constants from './constants'
import logger from './logger'
import images from './images'

class Wrapper extends EventEmitter {
	#pendingWrappedCall = false
	#lastPlaying = null
	#lastMuted = null
	#lastShuffleState = null
	#lastPendingSong = null
	#lastPendingContext = null
	#lastVolumePercent = null
	#lastDeviceId = null
	#lastSong = null
	#previousSong = null
	#lastSongTimeUpdateAt = null
	#lastPlaybackContext = null
	#lastPlaybackStateUpdate = null
	#lastPausedAt = null
	#lastExpectedCdnKeepAlive = null
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
				this.#updatePlaybackContext(null)
				this.#setPlaying(false)
				this.#setRepeatState('off')
				this.#setShuffleState(false)
				this.#setVolumePercent(null)
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
				progress: Math.min(this.#lastSong.progress + timeDiff, this.#lastSong.item.duration_ms)
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
				return constants.WRAPPER_RESPONSE_NO_DEVICE_ERROR

			if (response !== constants.WRAPPER_RESPONSE_API_RATE_LIMITED)
				if (e.message.includes('Restriction violated'))
					return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
				else
					logger.error(`An error occured while responding to a wrapper call: "${e.stack || e.message || 'No stack trace.'}".`)

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
		if (!deviceId) {
			if (this.#lastDeviceId)
				throw new constants.NoDeviceError('No device specified.')

			const activeDevices = this.#lastDevices.filter(device => device.type !== 'Speaker')

			if (activeDevices.length > 0)
				this.#setDevices(activeDevices[0].id, activeDevices)
		}

		path = `${path}${path.includes('?') ? '&' : '?'}`

		let response = await connector.callSpotifyApi(`${path}${deviceId ? `device_id=${deviceId}` : ''}`, options, [constants.API_NOT_FOUND_RESPONSE, constants.API_EMPTY_RESPONSE])

		if (response === constants.API_NOT_FOUND_RESPONSE) {
			const activeDevices = this.#lastDevices.filter(device => device.is_active)

			if (activeDevices.length > 0) {
				response = await connector.callSpotifyApi(`${path}device_id=${activeDevices[0].id}`, options, [constants.API_NOT_FOUND_RESPONSE, constants.API_EMPTY_RESPONSE])

				if (response === constants.API_NOT_FOUND_RESPONSE)
					throw new constants.NoDeviceError('No device available.')
			} else
				throw new constants.NoDeviceError('No device available.')
		}

		return response
	}

	#getPlaybackStateInterval() {
		if (!this.#lastSong)
			return constants.INTERVAL_UPDATE_PLAYBACK_STATE_IDLE
		else if (this.#lastPlaying)
			return constants.INTERVAL_UPDATE_PLAYBACK_STATE_PLAYING
		else if (this.#lastPausedAt && ((Date.now() - this.#lastPausedAt) >= constants.PLAYBACK_PAUSED_THRESHOLD))
			return constants.INTERVAL_UPDATE_PLAYBACK_STATE_PAUSED
		else
			return constants.INTERVAL_UPDATE_PLAYBACK_STATE_PLAYING
	}

	async #updatePlaybackState(force = false) {
		if (this.#updatePlaybackStateStatus === 'skip' && (!force)) {
			this.#updatePlaybackStateStatus = 'idle'
			return
		} else if (this.#updatePlaybackStateStatus === 'updating' || this.#updatePlaybackStateStatus === 'pause')
			return

		if (this.#lastPlaybackStateUpdate && (Date.now() - this.#lastPlaybackStateUpdate < this.#getPlaybackStateInterval()) && (!force))
			return

		const shouldKeepAliveExpectedCdn = this.#lastExpectedCdnKeepAlive && (Date.now() - this.#lastExpectedCdnKeepAlive < constants.INTERVAL_KEEP_ALIVE_EXPECTED_CDN_IN_PLAYBACK_STATE)

		if (shouldKeepAliveExpectedCdn)
			this.#lastExpectedCdnKeepAlive = Date.now()

		this.#lastPlaybackStateUpdate = Date.now()
		this.#updatePlaybackStateStatus = 'updating'

		try {
			if (shouldKeepAliveExpectedCdn)
				for (const domain of images.expectedCdnDomains)
					fetch(`https://${domain}/`, {
						method: 'HEAD'
					}).catch(() => {})

			let response = await connector.callSpotifyApi('me/player', undefined, [constants.API_EMPTY_RESPONSE])

			if (response === constants.API_EMPTY_RESPONSE)
				response = undefined

			if (!this.#lastUser)
				await this.updateUser()

			await this.#updatePlaybackContext(response?.context || null)

			this.#setPlaying(response?.is_playing || false)
			this.#setRepeatState(response?.repeat_state || 'off')
			this.#setShuffleState(response?.shuffle_state || false)
			this.#setVolumePercent(response?.device.supports_volume ? (typeof response?.device.volume_percent !== 'number' ? 100 : response.device.volume_percent) : null)

			this.#setSong(response?.item ? {
				item: response.item,
				liked: response.item.id && (this.#lastSong?.liked === undefined || response.item.id !== this.#lastSong?.item?.id) ? (await connector.callSpotifyApi(`me/library/contains?uris=${encodeURIComponent(response.item.uri)}`))[0] : this.#lastSong?.liked,
				progress: response.progress_ms
			} : null)

			this.#setDevices(response?.device.id ?? this.#lastDeviceId ?? null, (await connector.callSpotifyApi('me/player/devices')).devices ?? [])
			this.#setDisallowFlags((response?.actions?.disallows ? Object.keys(response.actions.disallows).filter(flag => response.actions.disallows[flag]) : []).concat(response?.device.supports_volume ? [] : 'volume'))
			this.#setCurrentlyPlayingType(response?.currently_playing_type || null)
		} catch (e) {
			logger.error(`An error occured while updating playback state: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
		} finally {
			this.#updatePlaybackStateStatus = 'idle'
			this.#lastPlaybackStateUpdate = Date.now()
		}
	}

	async #getTypeData(type, uri, nullOnFailure = false) {
		let title = 'Unknown ❓'
		let subtitle = null
		let extra = 'Unknown ❓'
		let images = []

		const id = uri.split(':')[2]

		switch (type) {
			case 'track':
				const track = await this.#wrapCall(() => connector.callSpotifyApi(`tracks/${id}`), true)

				if ((!track) && nullOnFailure)
					return null

				title = track?.name ?? 'Unknown ❓'
				subtitle = track?.artists?.map(artist => artist.name).join(', ') ?? null
				extra = 'Track 🎵'
				images = track?.album?.images ?? []

				break
			case 'artist':
				const artist = await this.#wrapCall(() => connector.callSpotifyApi(`artists/${id}`), true)

				if ((!artist) && nullOnFailure)
					return null

				title = artist?.name ?? 'Unknown ❓'
				extra = 'Artist 👤'
				images = artist?.images ?? []

				break

			case 'album':
				const album = await this.#wrapCall(() => connector.callSpotifyApi(`albums/${id}`), true)

				if ((!album) && nullOnFailure)
					return null

				switch (album.album_type) {
					case 'compilation':
						extra = 'Compilation 🗂️'
						break

					default:
						extra = 'Album 💿'
						break
				}

				title = album?.name ?? 'Unknown ❓'
				subtitle = album?.artists?.map(artist => artist.name).join(', ') ?? null
				extra = 'Album 💿'
				images = album?.images ?? []

				break

			case 'playlist':
				const playlist = await this.#wrapCall(() => connector.callSpotifyApi(`playlists/${id}`), true)

				if ((!playlist) && nullOnFailure)
					return null

				title = playlist?.name ?? 'Unknown ❓'
				extra = 'Playlist 📃'
				images = playlist?.images ?? []

				break

			case 'show':
				const show = await this.#wrapCall(() => connector.callSpotifyApi(`shows/${id}`), true)

				if ((!show) && nullOnFailure)
					return null

				title = show?.name ?? 'Unknown ❓'
				extra = 'Show 🎙️'
				images = show?.images ?? []

				break

			case 'collection':
				title = uri.includes('user:') ? 'Liked Songs' : 'Unknown ❓'
				extra = 'Collection 📚'

				images = [{
					width: 64,
					height: 64,
					url: 'https://misc.scdn.co/liked-songs/liked-songs-64.jpg'
				}]

				break

			case 'local':
				title = 'Local Files 🖥️'
				extra = null
				images = []

				break
		}

		return {
			title,
			subtitle,
			extra,
			images
		}
	}

	async #updatePlaybackContext(context, pending = false) {
		const wasPending = this.#lastPendingContext

		this.#lastPendingContext = pending

		if ((!context) && this.#lastSong?.item.uri.includes('local:'))
			context = {
				type: 'local',
				uri: 'local'
			}

		if (this.#lastPlaybackContext?.uri === context?.uri) {
			if (wasPending && !pending)
				this.emit('playbackContextChanged', this.#lastPlaybackContext, pending)

			return
		}

		if (context) {
			const typeData = await this.#getTypeData(context.type, context.uri)

			context.id = `${context.uri?.split(':')[2]}`
			context.images = typeData.images
			context.title = typeData.title
			context.subtitle = typeData.subtitle
			context.extra = typeData.extra
		}

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastPlaybackContext = context
		this.emit('playbackContextChanged', context, pending)
	}

	async #forwardSeekRaw(song, time, deviceId = this.#lastDeviceId) {
		if (this.#lastDisallowFlags.includes('seeking') || this.#lastDisallowFlags.includes('interrupting_playback') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall(`me/player/seek?position_ms=${song.progress + time}`, {
				method: 'PUT'
			}, deviceId)

			this.#setSong({
				item: song.item,
				liked: song.liked,
				progress: song.progress + time
			})

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async #backwardSeekRaw(song, time, deviceId = this.#lastDeviceId) {
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
				progress: newProgress
			})

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async #turnOnShuffle(deviceId = this.#lastDeviceId) {
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

	async #turnOnContextRepeat(deviceId = this.#lastDeviceId) {
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

	async #turnOnTrackRepeat(deviceId = this.#lastDeviceId) {
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

	async #setPlaybackVolume(volumePercent, deviceId = this.#lastDeviceId) {
		if (this.#lastDisallowFlags.includes('volume') || (this.#lastDisallowFlags.includes('interrupting_playback') && volumePercent <= 0) || this.#lastUser?.product !== 'premium')
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

	#setPlaying(playing) {
		if (this.#lastPlaying === playing)
			return

		if (playing) {
			this.#lastSongTimeUpdateAt = Date.now()
			this.#lastPausedAt = null
		} else
			this.#lastPausedAt = Date.now()

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

		const previousVolumePercent = this.#lastVolumePercent

		this.#updatePlaybackStateStatus = 'skip'
		this.#lastVolumePercent = volumePercent
		this.emit('volumePercentChanged', volumePercent)

		if (volumePercent !== null)
			if (volumePercent > 0)
				this.#setMuted(false)
			else if (volumePercent === 0 && this.#lastMuted === false)
				this.#setMuted(previousVolumePercent)
	}

	#setMuted(volumePercent) {
		if (this.#lastMuted === volumePercent)
			return

		this.#updatePlaybackStateStatus = 'skip'

		if (typeof(volumePercent) !== 'number')
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

				images.onSongChanged(null, pending)
				
				this.emit('songLikedStateChanged', false, pending)
				this.emit('songTimeChanged', 0, 0, pending)

				if (this.#lastPlaybackContext?.type === 'local')
					this.#onContextChangeExpected()
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
			this.#previousSong = JSON.parse(JSON.stringify(song))

			if ((this.#lastPlaybackContext?.type === 'local' && (!song.item.uri.includes('local:'))) || this.#lastPlaybackContext?.type !== 'local' && song.item.uri.includes('local:'))
				this.#onContextChangeExpected()

			if (songChanged || timeChanged)
				this.#lastSongTimeUpdateAt = Date.now()

			if (songChanged) {
				this.emit('songChanged', song, pending)
				images.onSongChanged(song, pending)
			}

			if (likedChanged)
				this.emit('songLikedStateChanged', song.liked, pending)

			if (timeChanged)
				this.emit('songTimeChanged', song.progress, song.item.duration_ms, pending)

			if (this.#lastSong.progress >= this.#lastSong.item.duration_ms)
				this.#onSongChangeExpected(true)
		}
	}

	#setDevices(lastDeviceId, devices) {
		if (this.#lastDeviceId !== lastDeviceId) {
			this.#updatePlaybackStateStatus = 'skip'
			this.#lastDeviceId = lastDeviceId
			this.emit('deviceChanged', lastDeviceId)
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
		this.#lastUser = user
		this.emit('userChanged', user)
	}

	#onSongChangeExpected(byTime = false) {
		clearTimeout(this.#songChangeForceUpdatePlaybackStateTimeout)

		const wasSongLoaded = !!this.#lastSong

		if (!wasSongLoaded)
			this.#onContextChangeExpected()

		this.#setSong(null, true)

		this.#songChangeForceUpdatePlaybackStateTimeout = setTimeout(() => this.#updatePlaybackState(true), wasSongLoaded ? (byTime ? constants.SONG_CHANGE_FORCE_UPDATE_PLAYBACK_TIME_SLEEP : constants.SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP) : constants.SONG_CHANGE_FORCE_UPDATE_PLAYBACK_UNLOADED_SLEEP)
	}

	#onContextChangeExpected() {
		this.#updatePlaybackContext(null, true)
	}

	async transferPlayback(deviceId) {
		return this.#wrapCall(async () => {
			await connector.callSpotifyApi('me/player', {
				method: 'PUT',

				body: JSON.stringify({
					device_ids: [deviceId]
				})
			}, [constants.API_EMPTY_RESPONSE])

			this.#setDevices(deviceId, this.#lastDevices)
			this.#setDisallowFlags(['volume', 'interrupting_playback', 'toggling_shuffle', 'toggling_repeat_context', 'toggling_repeat_track', 'seeking', 'skipping_next', 'skipping_prev'])
			this.#setVolumePercent(null)

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async updateUser() {
		return this.#wrapCall(async () => {
			let userResponse = await connector.callSpotifyApi('me')
			
			if ((!userResponse) || typeof userResponse !== 'object')
				userResponse = undefined
			
			this.#setUser(userResponse || null)
		})
	}

	async resumePlayback(deviceId = this.#lastDeviceId) {
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

	async pausePlayback(deviceId = this.#lastDeviceId) {
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

	async togglePlayback() {
		if (this.#lastPlaying)
			return this.pausePlayback()
		else
			return this.resumePlayback()
	}

	async toggleShuffle() {
		if (this.#lastShuffleState)
			return this.turnOffShuffle()
		else
			return this.#turnOnShuffle()
	}

	async toggleTrackRepeat() {
		if (this.#lastRepeatState === 'track')
			return this.turnOffRepeat()
		else
			return this.#turnOnTrackRepeat()
	}

	async toggleContextRepeat() {
		if (this.#lastRepeatState === 'context')
			return this.turnOffRepeat()
		else
			return this.#turnOnContextRepeat()
	}

	async volumeDown(step = constants.DEFAULT_VOLUME_STEP) {
		if (this.#lastMuted !== false && (this.#lastMuted || 0) > step)
			return this.unmuteVolume()
		else
			return this.#setPlaybackVolume(this.#lastVolumePercent - step)
	}

	async volumeUp(step = constants.DEFAULT_VOLUME_STEP) {
		return this.#setPlaybackVolume((this.#lastMuted !== false ? (this.#lastMuted || 0) : this.#lastVolumePercent) + (this.#lastMuted !== false ? 0 : step))
	}

	async nextSong(deviceId = this.#lastDeviceId) {
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

	async previousSong(deviceId = this.#lastDeviceId) {
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

	async turnOffShuffle(deviceId = this.#lastDeviceId) {
		if (this.#lastDisallowFlags.includes('toggling_shuffle') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/shuffle?state=false', {
				method: 'PUT'
			}, deviceId)

			this.#setShuffleState(false)

			return constants.WRAPPER_RESPONSE_SUCCESS
		}, true)
	}

	async turnOffRepeat(deviceId = this.#lastDeviceId) {
		if ((this.#lastDisallowFlags.includes('toggling_repeat_context') && this.#lastRepeatState === 'context') || (this.#lastDisallowFlags.includes('toggling_repeat_track') && this.#lastRepeatState === 'track') || this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			await this.#deviceCall('me/player/repeat?state=off', {
				method: 'PUT'
			}, deviceId)

			this.#setRepeatState('off')

			return constants.WRAPPER_RESPONSE_SUCCESS
		}, true)
	}

	async muteVolume(deviceId = this.#lastDeviceId) {
		const lastVolumePercent = this.#lastVolumePercent

		return this.#setPlaybackVolume(0, deviceId).then(response => {
			if (response === constants.WRAPPER_RESPONSE_SUCCESS)
				this.#setMuted(lastVolumePercent)

			return response
		})
	}

	async unmuteVolume(deviceId = this.#lastDeviceId) {
		return this.#setPlaybackVolume(this.#lastMuted || constants.VOLUME_PERCENT_MUTE_RESTORE, deviceId)
	}

	async likeSong(song) {
		return this.#wrapCall(async () => {
			await connector.callSpotifyApi(`me/library?uris=${encodeURIComponent(song.item.uri)}`, {
				method: 'PUT'
			})

			this.#setSong({
				item: song.item,
				liked: true,
				progress: song.progress
			})

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async forwardSeek(step = constants.DEFAULT_SEEK_STEP_SIZE) {
		step = step * 1000

		if (this.song)
			if (this.song.progress + step < this.song.item.duration_ms)
				return this.#forwardSeekRaw(this.song, step)
			else
				return constants.WRAPPER_RESPONSE_SUCCESS
		else if (this.pendingSongChange)
			return constants.WRAPPER_RESPONSE_BUSY
		else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async backwardSeek(step = constants.DEFAULT_SEEK_STEP_SIZE) {
		step = step * 1000

		if (this.song)
			return this.#backwardSeekRaw(this.song, step)
		else if (this.pendingSongChange)
			return constants.WRAPPER_RESPONSE_BUSY
		else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async unlikeSong(song) {
		return this.#wrapCall(async () => {
			await connector.callSpotifyApi(`me/library?uris=${encodeURIComponent(song.item.uri)}`, {
				method: 'DELETE'
			})

			this.#setSong({
				item: song.item,
				liked: false,
				progress: song.progress
			})

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async toggleCurrentSongLike() {
		if (!this.#lastSong?.item.id)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		else if (this.#lastSong.liked)
			return this.unlikeSong(this.#lastSong)
		else
			return this.likeSong(this.#lastSong)
	}

	async addSongToPlaylist(playlistId, trackUri) {
		return this.#wrapCall(async () => {
			await connector.callSpotifyApi(`playlists/${playlistId}/items`, {
				method: 'POST',

				body: JSON.stringify({
					uris: [trackUri]
				})
			})

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async toggleVolumeMute() {
		if (this.#lastVolumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		else if (this.muted)
			return this.unmuteVolume()
		else
			return this.muteVolume()
	}

	async playItem(item, offset = undefined, deviceId = this.#lastDeviceId) {
		if (this.#lastUser?.product !== 'premium')
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#wrapCall(async () => {
			const contextUri = `spotify:${item.type}:${item.id}`
			const songUri = offset?.uri

			await this.#deviceCall('me/player/play', {
				method: 'PUT',

				body: JSON.stringify({
					context_uri: contextUri,
					offset
				})
			}, deviceId)

			if (songUri && this.#lastSong?.item?.uri === songUri)
				this.#setSong({
					item: this.#lastSong.item,
					liked: this.#lastSong.liked,
					progress: 0
				})
			else
				this.#onSongChangeExpected()

			if (this.#lastPlaybackContext?.uri !== contextUri)
				this.#onContextChangeExpected()

			return constants.WRAPPER_RESPONSE_SUCCESS
		})
	}

	async getUserPlaylists(page = 1) {
		return this.#wrapCall(async () => {
			const playlists = await connector.callSpotifyApi(`me/playlists?limit=${constants.WRAPPER_ITEMS_PER_PAGE}&offset=${(page - 1) * constants.WRAPPER_ITEMS_PER_PAGE}`)

			return {
				status: constants.WRAPPER_RESPONSE_SUCCESS,

				items: playlists.items.map(playlist => ({
					id: playlist.id,
					type: 'playlist',
					name: playlist.name,
					images: playlist.images
				})),

				total: playlists.total
			}
		}, true)
	}

	async getUserLikedSongs(page = 1) {
		return this.#wrapCall(async () => {
			const tracks = await connector.callSpotifyApi(`me/tracks?limit=${constants.WRAPPER_ITEMS_PER_PAGE}&offset=${(page - 1) * constants.WRAPPER_ITEMS_PER_PAGE}`)

			return {
				status: constants.WRAPPER_RESPONSE_SUCCESS,

				items: tracks.items.map(item => {
					let extra = ''

					switch (item.track.album.album_type) {
						case 'album':
							extra = '💿'
							break

						case 'single':
							extra = '🎤'
							break
						
						case 'compilation':
							extra = '🗂️'
							break

						case 'ep':
							extra = '📀'
							break
					}

					return {
						id: item.track.id,
						type: 'track',
						extra,
						name: `${item.track.name} - ${item.track.artists.map(artist => artist.name).join(', ')}`,
						images: item.track.album.images
					}
				}),

				total: tracks.total
			}
		}, true)
	}

	async getCurrentTrack() {
		return this.#wrapCall(async () => {
			const response = await connector.callSpotifyApi('me/player/currently-playing', undefined, [constants.API_EMPTY_RESPONSE])

			if (response === constants.API_EMPTY_RESPONSE || !response?.item)
				return null

			return {
				id: response.item.id,
				uri: response.item.uri,
				name: response.item.name
			}
		}, true)
	}

	async getInformationOnUrl(url) {
		try {
			const realUrl = new URL(url)

			realUrl.search = ''

			const type = realUrl.pathname.split('/')[1]
			const id = realUrl.pathname.split('/')[2]
			const uri = `spotify:${type}:${id}`

			if (!['artist', 'album', 'playlist', 'show', 'collection', 'local', 'track'].includes(type))
				return null

			const typeData = await this.#getTypeData(type, uri, true)

			return typeData ? {
				url,
				uri,
				id,
				type,
				title: typeData.title,
				subtitle: typeData.subtitle,
				extra: typeData.extra,
				images: typeData.images
			} : null
		} catch {
			return null
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
		return this.#lastDeviceId
	}

	get user() {
		return this.#lastUser
	}

	get pendingSongChange() {
		return this.#lastPendingSong
	}

	get pendingContextChange() {
		return this.#lastPendingContext
	}

	get devices() {
		return this.#lastDevices
	}
}

export default new Wrapper()
