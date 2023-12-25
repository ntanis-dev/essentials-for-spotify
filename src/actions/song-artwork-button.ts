
import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
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
		logger.info(`Action "${this.manifestId}" registered.`)
	}

	#marqueeTitle(title: string, artists: string, context: string) {
		const marqueeData = this.#marquees[context] || {
			timeout: null,

			title: {
				render: `${title}${' '.repeat(constants.TITLE_MARQUEE_SPACING)}`,
				frame: null,
				totalFrames: null
			},

			artists: {
				render: `${artists}${' '.repeat(constants.TITLE_MARQUEE_SPACING)}`,
				frame: null,
				totalFrames: null
			}
		}

		marqueeData.timeout = setTimeout(async () => {
			if (marqueeData.title.frame === null)
				marqueeData.title.frame = (title.length / 2) + constants.TITLE_MARQUEE_SPACING

			if (marqueeData.artists.frame === null)
				marqueeData.artists.frame = (artists.length / 2) + constants.TITLE_MARQUEE_SPACING
			
			if (marqueeData.title.totalFrames === null)
				marqueeData.title.totalFrames = marqueeData.title.render.length

			if (marqueeData.artists.totalFrames === null)
				marqueeData.artists.totalFrames = marqueeData.artists.render.length

			await streamDeck.client.setTitle(context, `${title.length > constants.TITLE_MARQUEE_SPACING ? `${marqueeData.title.render.slice(marqueeData.title.frame)}${marqueeData.title.render.slice(0, marqueeData.title.frame)}` : title}\n${artists.length > constants.TITLE_MARQUEE_SPACING ? `${marqueeData.artists.render.slice(marqueeData.artists.frame)}${marqueeData.artists.render.slice(0, marqueeData.artists.frame)}` : artists}`)

			marqueeData.title.frame++
			marqueeData.artists.frame++

			if (marqueeData.title.frame >= marqueeData.title.totalFrames)
				marqueeData.title.frame = 0

			if (marqueeData.artists.frame >= marqueeData.artists.totalFrames)
				marqueeData.artists.frame = 0

			marqueeData.timeout = setTimeout(() => this.#marqueeTitle(title, artists, context), constants.TITLE_MARQUEE_INTERVAL)
		}, constants.TITLE_MARQUEE_INTERVAL_INITIAL)

		this.#marquees[context] = marqueeData
	}

	#clearMarquee(context: string) {
		if (this.#marquees[context]) {
			clearTimeout(this.#marquees[context].timeout)
			delete this.#marquees[context]
		}
	}

	async #onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				const url = song && song.item.album.images.length > 0 ? song.item.album.images[0].url : null

				this.#clearMarquee(context)
				await streamDeck.client.setTitle(context, '')

				if (url) {
					await streamDeck.client.setImage(context, 'images/states/pending')

					try {
						await streamDeck.client.setImage(context, `data:image/jpeg;base64,${Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')}`).catch(e => logger.error(`Failed to set state for "${this.manifestId}".`, e))
					} catch (e) {
						logger.error(`Failed to fetch image for song "${song.item.id}".`, e)
						await streamDeck.client.setImage(context)
					}

					this.#marqueeTitle(song.item.name, song.item.artists.map((artist: any) => artist.name).join(', '), context)
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
}
