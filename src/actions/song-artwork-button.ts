
import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import logger from './../library/logger.js'
import constants from './../library/constants.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.song-artwork-button' })
export default class SongArtworkButton extends Button {
	constructor() {
		super()
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
		logger.info(`Action "${this.manifestId}" registered.`)
	}

	async #onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				const url = song && song.item.album.images.length > 0 ? song.item.album.images[0].url : null

				if (url) {
					await streamDeck.client.setImage(context, 'images/states/pending')

					try {
						// @ts-ignore
						await streamDeck.client.setImage(context, `data:image/jpeg;base64,${Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')}`).catch(e => logger.error(`Failed to set state for "${this.manifestId}".`, e))
					} catch (e) {
						logger.error(`Failed to fetch image for song "${song.item.id}".`, e)
						await streamDeck.client.setImage(context)
					}
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
