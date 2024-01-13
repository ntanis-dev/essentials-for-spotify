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

	#beautifyTime(progressMs: number, durationMs: number) {
		const progress = Math.floor(progressMs / 1000)
		const duration = Math.floor(durationMs / 1000)

		const progressMinutes = Math.floor(progress / 60)
		const progressSeconds = progress - (progressMinutes * 60)

		const durationMinutes = Math.floor(duration / 60)
		const durationSeconds = duration - (durationMinutes * 60)

		return `${progressMinutes}:${progressSeconds.toString().padStart(2, '0')} / ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
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

				const titleMarquee = this.getMarquee(context, 'title')
				const timeMarquee = this.getMarquee(context, 'time')

				if (pending || (song && ((titleMarquee && titleMarquee.id !== song.item.id) || (timeMarquee && timeMarquee.id !== song.item.id))) || ((!song) && titleMarquee && timeMarquee)) {
					this.clearMarquee(context, 'title')
					this.clearMarquee(context, 'time')

					this.setFeedback(context, {
						title: 'Playback Control'
					})
				}

				if (wrapper.song) {
					if (!images.isSongCached(wrapper.song))
						this.setIcon(context, 'images/icons/pending.png')

					const image = await images.getForSong(wrapper.song)

					if ((!titleMarquee) || titleMarquee.id !== song.item.id) {
						const title = `${song.item.name} - ${song.item.artists.map((artist: any) => artist.name).join(', ')}`
						this.marquee(song.item.id, 'title', title, title, 16, context)
					} else
						this.resumeMarquee(context, 'title')

					if ((!timeMarquee) || timeMarquee.id !== song.item.id) {
						const time = this.#beautifyTime(song.progress, song.item.duration_ms)
						this.marquee(song.item.id, 'time', time, time, 14, context)
					} else
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
				const time = this.#beautifyTime(progress, duration)
				this.updateMarquee(context, 'time', time, time)
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

	async invokeWrapperAction(type: symbol) {
		if (type === Dial.TYPES.ROTATE_CLOCKWISE) {
			if (wrapper.song)
				if (wrapper.song.progress + constants.SEEK_STEP_SIZE < wrapper.song.item.duration_ms)
					return wrapper.forwardSeek(Object.assign({}, wrapper.song), constants.SEEK_STEP_SIZE)
				else
					return constants.WRAPPER_RESPONSE_SUCCESS
			else if (wrapper.pendingSongChange)
				return constants.WRAPPER_RESPONSE_SUCCESS
			else
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		} else if (type === Dial.TYPES.ROTATE_COUNTERCLOCKWISE) {
			if (wrapper.song)
				return wrapper.backwardSeek(Object.assign({}, wrapper.song), constants.SEEK_STEP_SIZE)
			else if (wrapper.pendingSongChange)
				return constants.WRAPPER_RESPONSE_SUCCESS
			else
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		} else if (type === Dial.TYPES.TAP) {
			if (!wrapper.song)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			if (wrapper.playing)
				return wrapper.pausePlayback()
			else
				return wrapper.resumePlayback()
		} else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async invokeHoldWrapperAction() {
		if (!wrapper.song)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (wrapper.playing)
			return wrapper.pausePlayback()
		else
			return constants.WRAPPER_RESPONSE_SUCCESS
	}

	async invokeHoldReleaseWrapperAction() {
		if (!wrapper.song)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (!wrapper.playing)
			return wrapper.resumePlayback()
		else
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

	updateFeedback(context: string): void {
		super.updateFeedback(context)
		this.#onSongChanged(wrapper.song, false, [context])
		this.#onSongTimeChanged(wrapper.song?.progress, wrapper.song?.item.duration_ms, false, [context])
		this.#onPlaybackStateChanged(wrapper.playing, [context])
		this.#onDeviceChanged(wrapper.device, [context])
	}
}
