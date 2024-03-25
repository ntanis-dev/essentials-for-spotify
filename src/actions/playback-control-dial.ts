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

@action({ UUID: 'com.ntanis.spotify-essentials.playback-control-dial' })
export default class PlaybackControlDial extends Dial {
	static readonly HOLDABLE = true

	constructor() {
		super('playback-control-layout.json', 'images/icons/playback-control.png')
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
		wrapper.on('songTimeChanged', this.#onSongTimeChanged.bind(this))
		wrapper.on('playbackStateChanged', this.#onPlaybackStateChanged.bind(this))
		wrapper.on('deviceChanged', this.#onDeviceChanged.bind(this))
	}

	#updateJointFeedback(contexts = this.contexts) {
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
					opacity: 1.0
				},

				text: {
					value: timeMarquee ? timeMarquee.last : '??:?? / ??:??',
					opacity: wrapper.playing ? 1.0 : 0.5
				}
			})
		}
	}

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setUnpressable(context, true)

				let titleMarquee = this.getMarquee(context, 'title')
				let timeMarquee = this.getMarquee(context, 'time')

				if (pending || (song && ((titleMarquee && titleMarquee.id !== song.item.id) || (timeMarquee && timeMarquee.id !== song.item.id))) || ((!song) && titleMarquee && timeMarquee)) {
					this.clearMarquee(context, 'title')
					this.clearMarquee(context, 'time')

					titleMarquee = null
					timeMarquee = null

					this.setFeedback(context, {
						title: 'Playback Control',

						text: {
							value: '??:?? / ??:??',
							opacity: wrapper.playing ? 1.0 : 0.5
						}
					})
				}

				if (song) {
					if (!images.isSongCached(song))
						this.setIcon(context, 'images/icons/pending.png')

					const image = await images.getForSong(song)
					const time = this.beautifyTime(song.progress, song.item.duration_ms)

					this.setFeedback(context, {
						text: {
							value: time
						}
					})

					if ((!titleMarquee) || titleMarquee.id !== song.item.id) {
						const title = `${song.item.name} - ${song.item.artists.map((artist: any) => artist.name).join(', ')}`
						this.marquee(song.item.id, 'title', title, title, 16, context)
					} else
						this.resumeMarquee(context, 'title')

					if ((!timeMarquee) || timeMarquee.id !== song.item.id)
						this.marquee(song.item.id, 'time', time, `${'8'.repeat(time.length - 5)}: : /`, 14, context)
					else
						this.resumeMarquee(context, 'time')

					if (image)
						this.setIcon(context, `data:image/jpeg;base64,${image}`)
					else
						this.setIcon(context, this.originalIcon)
				} else if (wrapper.pendingSongChange)
					this.setIcon(context, 'images/icons/pending.png')
				else
					this.setIcon(context, this.originalIcon)

				this.setUnpressable(context, false)
			})
	}

	#onSongTimeChanged(progress: number, duration: number, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts) {
			const timeMarquee = this.getMarquee(context, 'time')

			if (timeMarquee) {
				const time = this.beautifyTime(progress, duration)
				this.updateMarquee(context, 'time', time, `${'8'.repeat(time.length - 5)}: : /`)
			}

			this.#updateJointFeedback([context])
		}
	}

	#onPlaybackStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			this.#updateJointFeedback([context])
	}

	#onDeviceChanged(device: any, contexts = this.contexts) {
		if (!device) {
			for (const context of contexts)
				this.resetFeedbackLayout(context)

			return
		}

		for (const context of contexts)
			this.#updateJointFeedback([context])
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Dial.TYPES.ROTATE_CLOCKWISE) {
			if ((!wrapper.song) && wrapper.pendingSongChange)
				return constants.WRAPPER_RESPONSE_BUSY
			else if (!this.isHolding(context))
				return wrapper.nextSong()
			else if (wrapper.song && wrapper.song.progress + constants.SEEK_STEP_SIZE < wrapper.song.item.duration_ms)
				return wrapper.forwardSeek(Object.assign({}, wrapper.song), constants.SEEK_STEP_SIZE)
			else
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		} else if (type === Dial.TYPES.ROTATE_COUNTERCLOCKWISE) {
			if ((!wrapper.song) && wrapper.pendingSongChange)
				return constants.WRAPPER_RESPONSE_BUSY
			else if (!this.isHolding(context))
				return wrapper.previousSong()
			else if (wrapper.song)
				return wrapper.backwardSeek(Object.assign({}, wrapper.song), constants.SEEK_STEP_SIZE)
			else
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		} else if (type === Dial.TYPES.TAP)
			if (wrapper.playing)
				return wrapper.pausePlayback()
			else
				return wrapper.resumePlayback()
		else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async invokeHoldWrapperAction(context: string) {
		return constants.WRAPPER_RESPONSE_SUCCESS
	}

	async invokeHoldReleaseWrapperAction(context: string) {
		return constants.WRAPPER_RESPONSE_SUCCESS
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id, 'title')
		this.pauseMarquee(ev.action.id, 'time')
	}

	async resetFeedbackLayout(context: string): Promise<void> {
		super.resetFeedbackLayout(context, {
			title: 'Playback Control',
			icon: this.originalIcon
		})
	}

	onStateLoss(context: string) {
		super.onStateLoss(context)
		this.clearMarquee(context, 'title')
		this.clearMarquee(context, 'time')
	}

	updateFeedback(context: string): void {
		super.updateFeedback(context)
		this.#onSongChanged(wrapper.song, false, [context])
		this.#onSongTimeChanged(wrapper.song?.progress, wrapper.song?.item.duration_ms, false, [context])
		this.#onPlaybackStateChanged(wrapper.playing, [context])
		this.#onDeviceChanged(wrapper.device, [context])
	}
}
