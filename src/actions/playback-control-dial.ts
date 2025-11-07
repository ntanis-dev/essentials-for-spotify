import {
	action,
	WillDisappearEvent
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import constants from './../library/constants.js'
import images from './../library/images.js'
import wrapper from './../library/wrapper.js'
import logger from './../library/logger.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.playback-control-dial' })
export default class PlaybackControlDial extends Dial {
	static readonly HOLDABLE = true

	#seeking: boolean = false

	constructor() {
		super('layouts/playback-control-layout.json', 'images/icons/playback-control.png')
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
		wrapper.on('songTimeChanged', this.#onSongTimeChanged.bind(this))
		wrapper.on('playbackStateChanged', this.#onPlaybackStateChanged.bind(this))
		wrapper.on('deviceChanged', this.#onDeviceChanged.bind(this))
		wrapper.on('songLikedStateChanged', (liked: boolean, pending: boolean = false) => this.#onSongChanged(wrapper.song, wrapper.pendingSongChange))
	}

	async #updateJointFeedback(contexts = this.contexts) {
		if (!wrapper.device)
			return

		for (const context of contexts) {
			const titleMarquee = this.getMarquee(context, 'title')
			const timeMarquee = this.getMarquee(context, 'time')

			this.setFeedback(context, {
				title: titleMarquee ? titleMarquee.last : 'Playback Control',

				indicator: {
					value: wrapper.song ? Math.round((wrapper.song.progress / wrapper.song.item.duration_ms) * 100) : 0,
					opacity: wrapper.playing ? 1.0 : 0.5
				},

				icon: {
					opacity: wrapper.song || wrapper.pendingSongChange ? 1.0 : 0.5
				},

				text: {
					value: timeMarquee ? timeMarquee.last : `${this.settings[context].show.includes('progress') ? '??:??' : ''}${this.settings[context].show.includes('progress') && this.settings[context].show.includes('duration') ? ' / ' : ''}${this.settings[context].show.includes('duration') ? '??:??' : ''}`,
					opacity: wrapper.playing ? 1.0 : 0.5
				}
			})
		}
	}

	async #onSongChanged(song: any, pending: boolean = false, contexts = this.contexts, force = false) {
		const promises = []

		for (const context of contexts)
			promises.push(new Promise(async (resolve) => {
				this.setUnpressable(context, true)

				let titleMarquee = this.getMarquee(context, 'title')
				let timeMarquee = this.getMarquee(context, 'time')

				await this.setFeedback(context, {
					icon: {
						opacity: wrapper.device && (wrapper.song || wrapper.pendingSongChange) ? 1.0 : 0.5
					}
				})

				if (pending || (song && ((titleMarquee && titleMarquee.id !== song.item.id) || (timeMarquee && timeMarquee.id !== song.item.id))) || ((!song) && titleMarquee && timeMarquee) || force) {
					this.clearMarquee(context, 'title')
					this.clearMarquee(context, 'time')

					titleMarquee = null
					timeMarquee = null

					if ((!force) || (!song))
						await this.setFeedback(context, {
							title: 'Playback Control',

							text: {
								value: '??:?? / ??:??',
								opacity: wrapper.playing ? 1.0 : 0.5
							}
						})
				}

				if (song) {
					if (!images.isSongCached(song))
						await this.setIcon(context, 'images/icons/pending.png')

					const image = await images.getForSong(song)
					const time = this.beautifyTime(song.progress, song.item.duration_ms, this.settings[context].show.includes('progress'), this.settings[context].show.includes('duration'))

					await this.setFeedback(context, {
						text: {
							value: time
						}
					})

					if ((!titleMarquee) || titleMarquee.id !== song.item.id || force) {
						const title = `${this.settings[context].show.includes('name') ? song.item.name : ''}${this.settings[context].show.includes('name') && this.settings[context].show.includes('artists') ? ' - ' : ''}${this.settings[context].show.includes('artists') ? song.item.artists.map((artist: any) => artist.name).join(', ') : ''}`
						await this.marquee(undefined, 'title', title, title, 16, context)
					} else
						this.resumeMarquee(context, 'title')

					if ((!timeMarquee) || timeMarquee.id !== song.item.id || force)
						await this.marquee(undefined, 'time', time === '' ? ' ' : time, time === '' ? ' ' : `${'8'.repeat(time.length - (this.settings[context].show.includes('progress') && this.settings[context].show.includes('duration') ? 5 : 1))}${this.settings[context].show.includes('progress') && this.settings[context].show.includes('duration') ? ': : /' : ':'}`, 14, context)
					else
						this.resumeMarquee(context, 'time')

					if (image)
						await this.setIcon(context, this.processImage(`data:image/jpeg;base64,${image}`, this.settings[context].show.includes('liked') && song.liked ? 'top-left' : 'none'))
					else
						await this.setIcon(context, this.originalIcon)
				} else if (wrapper.pendingSongChange)
					await this.setIcon(context, 'images/icons/pending.png')
				else
					await this.setIcon(context, this.originalIcon)

				this.setUnpressable(context, false)

				resolve(true)
			}))

		await Promise.allSettled(promises)
	}

	async #onSongTimeChanged(progress: number, duration: number, pending: boolean = false, contexts = this.contexts) {
		const promises = []

		for (const context of contexts) {
			const timeMarquee = this.getMarquee(context, 'time')

			if (timeMarquee) {
				const time = this.beautifyTime(progress, duration, this.settings[context].show.includes('progress'), this.settings[context].show.includes('duration'))
				this.updateMarquee(context, 'time', time === '' ? ' ' : time, time === '' ? ' ' : `${'8'.repeat(time.length - (this.settings[context].show.includes('progress') && this.settings[context].show.includes('duration') ? 5 : 1))}${this.settings[context].show.includes('progress') && this.settings[context].show.includes('duration') ? ': : /' : ':'}`)
			}

			promises.push(this.#updateJointFeedback([context]))
		}

		await Promise.allSettled(promises)
	}

	async #onPlaybackStateChanged(state: boolean, contexts = this.contexts) {
		const promises = []

		for (const context of contexts)
			promises.push(this.#updateJointFeedback([context]))

		await Promise.allSettled(promises)
	}

	async #onDeviceChanged(device: any, contexts = this.contexts) {
		const promises = []

		if (!device) {
			for (const context of contexts)
				promises.push(this.resetFeedbackLayout(context))

			await Promise.allSettled(promises)

			return
		}

		for (const context of contexts)
			promises.push(this.#updateJointFeedback([context]))

		await Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Dial.TYPES.ROTATE_CLOCKWISE) {
			if (this.isHolding(context))
				this.#seeking = true
			else
				this.#seeking = false

			if ((!wrapper.song) && wrapper.pendingSongChange)
				return constants.WRAPPER_RESPONSE_BUSY
			else if (!this.isHolding(context))
				return wrapper.nextSong()
			else if (wrapper.song && wrapper.song.progress + constants.SEEK_STEP_SIZE < wrapper.song.item.duration_ms)
				return wrapper.forwardSeek(wrapper.song, constants.SEEK_STEP_SIZE)
			else
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		} else if (type === Dial.TYPES.ROTATE_COUNTERCLOCKWISE) {
			if (this.isHolding(context))
				this.#seeking = true
			else
				this.#seeking = false

			if ((!wrapper.song) && wrapper.pendingSongChange)
				return constants.WRAPPER_RESPONSE_BUSY
			else if (!this.isHolding(context))
				return wrapper.previousSong()
			else if (wrapper.song)
				return wrapper.backwardSeek(wrapper.song, constants.SEEK_STEP_SIZE)
			else
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		} else if (type === Dial.TYPES.TAP)
			return wrapper.togglePlayback()
		else if (type === Dial.TYPES.LONG_TAP)
			return wrapper.likeUnlikeCurrentSong()
		else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async invokeHoldWrapperAction(context: string) {
		return constants.WRAPPER_RESPONSE_SUCCESS
	}

	async invokeHoldReleaseWrapperAction(context: string) {
		if (this.#seeking) {
			this.#seeking = false
			return constants.WRAPPER_RESPONSE_SUCCESS
		}

		if (wrapper.playing)
			return wrapper.pausePlayback()
		else
			return wrapper.resumePlayback()
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		await super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id, 'title')
		this.pauseMarquee(ev.action.id, 'time')
	}

	async resetFeedbackLayout(context: string): Promise<void> {
		await super.resetFeedbackLayout(context, {
			title: 'Playback Control',
			icon: this.originalIcon
		})
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].show)
			await this.setSettings(context, {
				show: ['name', 'artists', 'progress', 'duration', 'liked']
			})

		if (oldSettings.show?.length !== this.settings[context].show?.length || (oldSettings.show && this.settings[context].show && (!oldSettings.show.every((value: any, index: number) => value === this.settings[context].show[index]))))
			await this.#onSongChanged(wrapper.song, wrapper.pendingSongChange, [context], true)
	}

	async onStateLoss(context: string) {
		await super.onStateLoss(context)

		this.clearMarquee(context, 'title')
		this.clearMarquee(context, 'time')
	}

	async updateFeedback(context: string) {
		await super.updateFeedback(context)
		await this.#onSongChanged(wrapper.song, false, [context])
		await this.#onSongTimeChanged(wrapper.song?.progress, wrapper.song?.item.duration_ms, false, [context])
		await this.#onPlaybackStateChanged(wrapper.playing, [context])
		await this.#onDeviceChanged(wrapper.device, [context])
	}
}
