
import streamDeck, { action, WillAppearEvent, WillDisappearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import logger from './../library/logger.js'
import constants from './../library/constants.js'
import { Button } from './button.js'

declare const fetch: Function

@action({ UUID: 'com.ntanis.spotify-essentials.song-artwork-button' })
export default class SongArtworkButton extends Button {
	#marquees: any = {}

	constructor() {
		super()
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
	}

	#getTextSpacingWidth(text: string) {
		let totalWidth = 0

		for (const char of text)
			totalWidth += constants.CHARACTER_WIDTH_MAP[char] || 1

		return totalWidth;
	}

	async #marqueeTitle(title: string, artists: string, context: string) {
		const isInitial = this.#marquees[context] === undefined

		const marqueeData = this.#marquees[context] || {
			timeout: null,

			title: {
				render: `${title}${' '.repeat(constants.TITLE_MARQUEE_SPACING * constants.TITLE_MARQUEE_SPACING_MULTIPLIER)}`,
				frame: null,
				totalFrames: null
			},

			artists: {
				render: `${artists}${' '.repeat(constants.TITLE_MARQUEE_SPACING * constants.TITLE_MARQUEE_SPACING_MULTIPLIER)}`,
				frame: null,
				totalFrames: null
			}
		}

		if (marqueeData.title.frame === null)
			marqueeData.title.frame = (title.length / 2) + constants.TITLE_MARQUEE_SPACING

		if (marqueeData.artists.frame === null)
			marqueeData.artists.frame = (artists.length / 2) + constants.TITLE_MARQUEE_SPACING
		
		if (marqueeData.title.totalFrames === null)
			marqueeData.title.totalFrames = marqueeData.title.render.length

		if (marqueeData.artists.totalFrames === null)
			marqueeData.artists.totalFrames = marqueeData.artists.render.length

		await streamDeck.client.setTitle(context, `${this.#getTextSpacingWidth(title) > constants.TITLE_MARQUEE_SPACING ? `${marqueeData.title.render.slice(marqueeData.title.frame)}${marqueeData.title.render.slice(0, marqueeData.title.frame)}` : title}\n${this.#getTextSpacingWidth(artists) > constants.TITLE_MARQUEE_SPACING ? `${marqueeData.artists.render.slice(marqueeData.artists.frame)}${marqueeData.artists.render.slice(0, marqueeData.artists.frame)}` : artists}`)

		marqueeData.title.frame++
		marqueeData.artists.frame++

		if (marqueeData.title.frame >= marqueeData.title.totalFrames)
			marqueeData.title.frame = 0

		if (marqueeData.artists.frame >= marqueeData.artists.totalFrames)
			marqueeData.artists.frame = 0

		marqueeData.timeout = setTimeout(async () => await this.#marqueeTitle(title, artists, context), isInitial ? constants.TITLE_MARQUEE_INTERVAL_INITIAL : constants.TITLE_MARQUEE_INTERVAL)

		this.#marquees[context] = marqueeData
	}

	async #clearMarquee(context: string) {
		if (this.#marquees[context]) {
			clearTimeout(this.#marquees[context].timeout)
			delete this.#marquees[context]
			await streamDeck.client.setTitle(context, '')
		}
	}

	async #onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				const url = song && song.item.album.images.length > 0 ? song.item.album.images[0].url : null

				await this.#clearMarquee(context)

				if (url) {
					await streamDeck.client.setImage(context, 'images/states/pending')

					let imageBuffer = null

					try {
						imageBuffer = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
					} catch (e) {
						logger.error(`Failed to fetch image for song "${song.item.id}".`, e)
					}

					await this.#marqueeTitle(song.item.name, song.item.artists.map((artist: any) => artist.name).join(', '), context)

					if (imageBuffer)
						await streamDeck.client.setImage(context, `data:image/jpeg;base64,${imageBuffer}`).catch(e => logger.error(`Failed to set state for "${this.manifestId}".`, e))
					else
						await streamDeck.client.setImage(context)
				} else if (pending)
					await streamDeck.client.setImage(context, 'images/states/pending')
				else
					await streamDeck.client.setImage(context)
			})
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onSongChanged(wrapper.song, false, [ev.action.id])
	}

	onWillDisappear(ev: WillDisappearEvent<any>): void {
		super.onWillDisappear(ev)
		this.#clearMarquee(ev.action.id)
	}
}
