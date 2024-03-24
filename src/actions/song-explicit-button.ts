import {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.song-explicit-button' })
export default class SongExplicitButton extends Button {
	static readonly STATABLE = true

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
				this.setState(context, song?.item.explicit ? 1 : 0)
				this.setUnpressable(context, false)
			}
		}
	}

	async invokeWrapperAction(context: string) {
		return constants.WRAPPER_RESPONSE_DO_NOTHING
	}

	onStateSettled(context: string) {
		super.onStateSettled(context)
		this.#onSongChanged(wrapper.song, false, [context])
	}
}
