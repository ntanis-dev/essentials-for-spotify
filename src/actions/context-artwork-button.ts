
import {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import connector from '../library/connector.js'
import images from '../library/images.js'
import wrapper from '../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.context-artwork-button' })
export default class ContextArtworkButton extends Button {
	static readonly STATABLE = true
	static readonly ACTIONLESS = true

	constructor() {
		super()
		this.setStatelessImage('images/states/context-artwork-unknown')
		wrapper.on('playbackContextChanged', this.#onPlaybackContextChanged.bind(this))
	}

	#onPlaybackContextChanged(playbackContext: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setUnpressable(context, true)

				if (playbackContext) {
					if (!images.isItemCached(playbackContext))
						this.setImage(context, 'images/states/pending')

					const image = await images.getForItem(playbackContext)

					if (image)
						this.setImage(context, `data:image/jpeg;base64,${image}`)
					else
						this.setImage(context)
				} else if (pending)
					this.setImage(context, 'images/states/pending')
				else
					this.setImage(context, 'images/states/context-artwork-unknown')

				if (!pending)
					this.setUnpressable(context, false)
			})
	}

	async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
		await super.onWillAppear(ev)

		if (connector.set)
			this.#onPlaybackContextChanged(wrapper.playbackContext, wrapper.pendingPlaybackContext, [ev.action.id])
	}

	onStateSettled(context: string) {
		super.onStateSettled(context, true)
		this.#onPlaybackContextChanged(wrapper.playbackContext, wrapper.pendingPlaybackContext, [context])
	}
}
