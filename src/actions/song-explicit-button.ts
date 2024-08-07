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

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts) {
			this.setUnpressable(context, true)
			this.setImage(context, pending ? 'images/states/pending' : undefined)

			if (!pending) {
				if (song) {
					this.setImage(context)
					this.setState(context, song?.item.explicit ? 1 : 0)
				} else
					this.setImage(context, 'images/states/song-explicit-unknown')

				this.setUnpressable(context, false)
			}
		}
	}

	onStateSettled(context: string) {
		super.onStateSettled(context)
		this.#onSongChanged(wrapper.song, false, [context])
	}
}
