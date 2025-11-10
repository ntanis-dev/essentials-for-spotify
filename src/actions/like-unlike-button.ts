
import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.like-unlike-button' })
export default class LikeUnlikeButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/like-unknown')
		wrapper.on('songChanged', (...args: any) => this.#onLikedStateChanged(wrapper.song?.liked, wrapper.pendingSongChange))
		wrapper.on('songLikedStateChanged', this.#onLikedStateChanged.bind(this))
	}

	async #onLikedStateChanged(liked: boolean, pending: boolean = false, contexts = this.contexts) {
		const promises = []

		for (const context of contexts)
			promises.push(new Promise(async (resolve) => {
				this.setUnpressable(context, true)
				
				await this.setImage(context, pending ? 'images/states/pending' : undefined)

				if (!pending) {
					if (wrapper.song) {
						await this.setImage(context)
						await this.setState(context, liked ? 1 : 0)
					} else
						await this.setImage(context, 'images/states/like-unknown')

					this.setUnpressable(context, false)
				}

				resolve(true)
			}))

		await Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		return wrapper.toggleCurrentSongLike()
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context)
		await this.#onLikedStateChanged(wrapper.song?.liked, wrapper.pendingSongChange, [context])
	}
}
