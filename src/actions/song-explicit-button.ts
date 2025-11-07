import {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.song-explicit-button' })
export default class SongExplicitButton extends Button {
	static readonly STATABLE = true
	static readonly ACTIONLESS = true

	constructor() {
		super()
		this.setStatelessImage('images/states/song-explicit-unknown')
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
	}

	async #onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		const promises = []

		for (const context of contexts)
			promises.push(new Promise(async resolve => {
				this.setUnpressable(context, true)

				await this.setImage(context, pending ? 'images/states/pending' : undefined)

				if (!pending) {
					if (song) {
						await this.setImage(context)
						await this.setState(context, song?.item.explicit ? 1 : 0)
					} else
						await this.setImage(context, 'images/states/song-explicit-unknown')

					this.setUnpressable(context, false)
				}

				resolve(true)
			}))

		await Promise.allSettled(promises)
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context)
		await this.#onSongChanged(wrapper.song, false, [context])
	}
}
