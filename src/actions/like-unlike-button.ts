
import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.like-unlike-button' })
export default class LikeUnlikeButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/like-unknown')
		wrapper.on('songLikedStateChanged', this.#onLikedStateChanged.bind(this))
	}

	#onLikedStateChanged(liked: boolean, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts) {
			this.setUnpressable(context, true)
			this.setImage(context, pending ? 'images/states/pending' : undefined)

			if (!pending) {
				if (wrapper.song) {
					this.setImage(context)
					this.setState(context, liked ? 1 : 0)
				} else
					this.setImage(context, 'images/states/like-unknown')

				this.setUnpressable(context, false)
			}
		}
	}

	async invokeWrapperAction(context: string) {
		if (!wrapper.song)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (wrapper.song.liked)
			return wrapper.unlikeSong(Object.assign({}, wrapper.song))
		else
			return wrapper.likeSong(Object.assign({}, wrapper.song))
	}

	onStateSettled(context: string) {
		super.onStateSettled(context)
		this.#onLikedStateChanged(wrapper.song?.liked, false, [context])
	}
}
