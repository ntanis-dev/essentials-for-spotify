
import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import logger from './../library/logger.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.like-unlike-button' })
export default class LikeUnlikeButton extends Button {
	constructor() {
		super()
		wrapper.on('likedStateChanged', this.#onLikedStateChanged.bind(this))
	}

	#onLikedStateChanged(liked: boolean, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				if (pending)
					await streamDeck.client.setImage(context, 'images/states/pending')
				else {
					await streamDeck.client.setImage(context)
					await streamDeck.client.setState(context, liked ? 1 : 0).catch(e => logger.error(`Failed to set state for "${this.manifestId}".`, e))
				}
			})
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onLikedStateChanged(wrapper.song, false, [ev.action.id])
	}

	async onButtonKeyDown() {
		if (wrapper.song) {
			if (wrapper.song.liked)
				return wrapper.unlikeLastSong()
			else
				return wrapper.likeLastSong()
		}
	}
}
