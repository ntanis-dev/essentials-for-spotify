import {
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import images from './../library/images.js'
import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.playback-control-dial' })
export default class PlaybackControlDial extends Dial {
	constructor() {
		super('playback-control-layout.json', 'images/icons/playback-control.png')
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
		wrapper.on('songTimeChanged', this.#onSongTimeChanged.bind(this))
		wrapper.on('playbackStateChanged', this.#onPlaybackStateChanged.bind(this))
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
		for (const context of contexts)
			this.setFeedback(context, {
				title: {
					value: wrapper.song ? `${wrapper.song.item.name} - ${wrapper.song.item.artists.map((artist: any) => artist.name).join(', ')}` : 'Playback Control',
				},

				indicator: {
					value: wrapper.song ? Math.round((wrapper.song.progress / wrapper.song.item.duration_ms) * 100) : 0,
					opacity: wrapper.playing ? 1.0 : 0.5
				},

				icon: {
					opacity: 1
				},

				text: {
					value: wrapper.song ? `${this.#beautifyTime(wrapper.song.progress, wrapper.song.item.duration_ms)}` : '??:?? / ??:??',
					opacity: wrapper.playing ? 1.0 : 0.5
				}
			})
	}

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setUnpressable(context, true)

				if (wrapper.song) {
					if (!images.isSongCached(wrapper.song))
						this.setIcon(context, 'images/icons/pending.png')
		
					const image = await images.getForSong(wrapper.song)
		
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
		for (const context of contexts)
			this.#updateJointFeedback([context])
	}

	#onPlaybackStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			this.#updateJointFeedback([context])
	}

	async resetFeedbackLayout(context: string): Promise<void> {
		super.resetFeedbackLayout(context, {
			title: 'Playback Control',
			icon: this.originalIcon
		})
	}

	async updateFeedback(context: string): Promise<void> {
		super.updateFeedback(context)
		this.#onSongChanged(wrapper.song, false, [context])
		this.#onSongTimeChanged(wrapper.song?.progress, wrapper.song?.item.duration_ms, false, [context])
		this.#onPlaybackStateChanged(wrapper.playing, [context])
	}
}
