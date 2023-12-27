
import StreamDeck, {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.like-unlike-button' })
export default class LikeUnlikeButton extends Button {
	constructor() {
		super()
		wrapper.on('songLikedStateChanged', this.#onLikedStateChanged.bind(this))
	}

	#onLikedStateChanged(liked: boolean, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setBusy(context, true)

				await StreamDeck.client.setImage(context, pending ? 'images/states/pending' : undefined).catch(e => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

				if (!pending) {
					await StreamDeck.client.setState(context, liked ? 1 : 0).catch(e => logger.error(`An error occurred while setting the Stream Deck state of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
					this.setBusy(context, false)
				}
			})
	}

	async invokeWrapperAction() {
		if (!wrapper.song)
			return

		if (wrapper.song.liked)
			return wrapper.unlikeSong(Object.assign({}, wrapper.song))
		else
			return wrapper.likeSong(Object.assign({}, wrapper.song))
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onLikedStateChanged(wrapper.song?.liked, false, [ev.action.id])
	}
}
