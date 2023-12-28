
import StreamDeck, {
	action,
	WillAppearEvent,
	WillDisappearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import images from '../library/images.js'
import logger from '../library/logger.js'
import wrapper from '../library/wrapper.js'

declare const fetch: Function

@action({ UUID: 'com.ntanis.spotify-essentials.song-information-button' })
export default class SongInformationButton extends Button {
	#marquees: any = {}

	constructor() {
		super()
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
		wrapper.on('songTimeChanged', this.#onSongTimeChanged.bind(this))
	}

	async #marqueeTitle(id: string, title: string, artists: string, time: string, context: string) {
		const isInitial = this.#marquees[context] === undefined

		const marqueeData = this.#marquees[context] || {
			timeout: null,

			id,

			title: {
				original: title,
				render: `${title}${' '.repeat(constants.TITLE_MARQUEE_SPACING * constants.TITLE_MARQUEE_SPACING_MULTIPLIER)}`,
				frame: null,
				totalFrames: null
			},

			artists: {
				original: artists,
				render: `${artists}${' '.repeat(constants.TITLE_MARQUEE_SPACING * constants.TITLE_MARQUEE_SPACING_MULTIPLIER)}`,
				frame: null,
				totalFrames: null
			},

			time: {
				fake: `${'8'.repeat(time.length - 5)}: : /`,
				original: time,
				render: `${time}${' '.repeat(constants.TITLE_MARQUEE_SPACING * constants.TITLE_MARQUEE_SPACING_MULTIPLIER)}`,
				frame: null,
				totalFrames: null
			}
		}

		if (this.#marquees[context] && this.#marquees[context].id !== id)
			return

		this.#marquees[context] = marqueeData

		if (marqueeData.title.frame === null)
			marqueeData.title.frame = (title.length / 2) + constants.TITLE_MARQUEE_SPACING

		if (marqueeData.artists.frame === null)
			marqueeData.artists.frame = (artists.length / 2) + constants.TITLE_MARQUEE_SPACING

		if (marqueeData.time.frame === null)
			marqueeData.time.frame = (time.length / 2) + constants.TITLE_MARQUEE_SPACING
		
		if (marqueeData.title.totalFrames === null)
			marqueeData.title.totalFrames = marqueeData.title.render.length

		if (marqueeData.artists.totalFrames === null)
			marqueeData.artists.totalFrames = marqueeData.artists.render.length

		if (marqueeData.time.totalFrames === null)
			marqueeData.time.totalFrames = marqueeData.time.render.length

		await StreamDeck.client.setTitle(context, `${this.#getTextSpacingWidth(marqueeData.title.original) > constants.TITLE_MARQUEE_SPACING ? `${marqueeData.title.render.slice(marqueeData.title.frame)}${marqueeData.title.render.slice(0, marqueeData.title.frame)}` : marqueeData.title.original}\n${this.#getTextSpacingWidth(marqueeData.artists.original) > constants.TITLE_MARQUEE_SPACING ? `${marqueeData.artists.render.slice(marqueeData.artists.frame)}${marqueeData.artists.render.slice(0, marqueeData.artists.frame)}` : marqueeData.artists.original}\n${this.#getTextSpacingWidth(marqueeData.time.fake) > constants.TITLE_MARQUEE_SPACING ? `${marqueeData.time.render.slice(marqueeData.time.frame)}${marqueeData.time.render.slice(0, marqueeData.time.frame)}` : marqueeData.time.original}`).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck title of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		if ((!this.#marquees[context]) || this.#marquees[context].id !== id)
			return

		marqueeData.title.frame++
		marqueeData.artists.frame++
		marqueeData.time.frame++

		if (marqueeData.title.frame >= marqueeData.title.totalFrames)
			marqueeData.title.frame = 0

		if (marqueeData.artists.frame >= marqueeData.artists.totalFrames)
			marqueeData.artists.frame = 0

		if (marqueeData.time.frame >= marqueeData.time.totalFrames)
			marqueeData.time.frame = 0

		marqueeData.timeout = setTimeout(() => this.#marqueeTitle(id, marqueeData.title.original, marqueeData.artists.original, marqueeData.time.original, context), isInitial ? constants.TITLE_MARQUEE_INTERVAL_INITIAL : constants.TITLE_MARQUEE_INTERVAL)
	}

	#updateMarqueeTime(context: string, time: string) {
		if (this.#marquees[context]) {
			this.#marquees[context].time.original = time
			this.#marquees[context].time.render = `${time}${' '.repeat(constants.TITLE_MARQUEE_SPACING * constants.TITLE_MARQUEE_SPACING_MULTIPLIER)}`
			this.#marquees[context].time.totalFrames = this.#marquees[context].time.render.length
		}
	}

	#resumeMarquee(context: string) {
		if (this.#marquees[context]) {
			clearTimeout(this.#marquees[context].timeout)
			this.#marquees[context].timeout = setTimeout(() => this.#marqueeTitle(this.#marquees[context].id, this.#marquees[context].title.original, this.#marquees[context].artists.original, this.#marquees[context].time.original, context), constants.TITLE_MARQUEE_INTERVAL)
		}
	}

	#pauseMarquee(context: string) {
		if (this.#marquees[context]) {
			clearTimeout(this.#marquees[context].timeout)
			this.#marquees[context].timeout = null
		}
	}

	#getTextSpacingWidth(text: string) {
		let totalWidth = 0

		for (const char of text)
			totalWidth += constants.CHARACTER_WIDTH_MAP[char] || 1

		return totalWidth;
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

	#onSongTimeChanged(progress: number, duration: number, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				if (this.#marquees[context])
					this.#updateMarqueeTime(context, this.#beautifyTime(progress, duration))
			})
	}

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setBusy(context, true)

				if (pending || (song && this.#marquees[context] && this.#marquees[context].id !== song.item.id) || ((!song) && this.#marquees[context])) {
					if (this.#marquees[context]) {
						clearTimeout(this.#marquees[context].timeout)
						delete this.#marquees[context]
					}

					await StreamDeck.client.setTitle(context, '').catch((e: any) => logger.error(`An error occurred while setting the Stream Deck title of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
				}

				if (song) {
					if (!images.isSongCached(song))
						await StreamDeck.client.setImage(context, 'images/states/pending').catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

					const image = await images.getForSong(song)

					if ((!this.#marquees[context]) || this.#marquees[context].id !== song.item.id)
						await this.#marqueeTitle(song.item.id, song.item.name, song.item.artists.map((artist: any) => artist.name).join(', '), this.#beautifyTime(song.progress, song.item.duration_ms), context)
					else
						this.#resumeMarquee(context)

					if (image)
						await StreamDeck.client.setImage(context, `data:image/jpeg;base64,${image}`).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
					else
						await StreamDeck.client.setImage(context).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
				} else if (pending)
					await StreamDeck.client.setImage(context, 'images/states/pending').catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
				else
					await StreamDeck.client.setImage(context).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

				if (!pending)
					this.setBusy(context, false)
			})
	}

	async invokeWrapperAction() {
		return constants.WRAPPER_RESPONSE_DO_NOTHING
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onSongChanged(wrapper.song, false, [ev.action.id])
		this.#onSongTimeChanged(wrapper.song?.progress, wrapper.song?.item.duration_ms, false, [ev.action.id])
	}

	onWillDisappear(ev: WillDisappearEvent<any>): void {
		super.onWillDisappear(ev)
		this.#pauseMarquee(ev.action.id)
	}
}
