
import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import logger from './../library/logger.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.like-unlike-button' })
export default class LikeUnlikeButton extends Button {
	constructor() {
		super()
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
	}

	#onSongChanged(song: any) {
		if (this.context)
			streamDeck.client.setState(this.context, song && song.liked ? 1 : 0).catch(e => logger.error(`Failed to set state for "${this.manifestId}".`, e))
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onSongChanged(wrapper.song)
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
