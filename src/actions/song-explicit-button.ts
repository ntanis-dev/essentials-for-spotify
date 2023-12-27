import StreamDeck, {
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
	constructor() {
		super()
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
	}

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setBusy(context, true)

				await StreamDeck.client.setImage(context, pending ? 'images/states/pending' : undefined).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

				if (!pending) {
					await StreamDeck.client.setState(context, song?.item.explicit ? 1 : 0).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck state of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
					this.setBusy(context, false)
				}
			})
	}

	async invokeWrapperAction() {
		return constants.WRAPPER_RESPONSE_DO_NOTHING
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onSongChanged(wrapper.song, false, [ev.action.id])
	}
}
