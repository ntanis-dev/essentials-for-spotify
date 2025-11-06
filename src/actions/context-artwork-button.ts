import os from 'os'

import {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import {
	spawn
} from 'child_process'

import constants from '../library/constants.js'
import images from '../library/images.js'
import wrapper from '../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.context-artwork-button' })
export default class ContextArtworkButton extends Button {
	static readonly STATABLE = true

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
					else if (playbackContext.type === 'local')
						this.setImage(context, 'images/states/local')
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

	async invokeWrapperAction(context: string) {
		if (wrapper.playbackContext) {
			switch (os.platform()) {
				case 'darwin':
					spawn('open', [wrapper.playbackContext.uri])
					break

				case 'win32':
					spawn('cmd', ['/c', 'start', '', wrapper.playbackContext.uri])
					break

				case 'linux':
					spawn('xdg-open', [wrapper.playbackContext.uri])
					break

				default:
					return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
			}

			return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
		}

		return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	onStateSettled(context: string) {
		super.onStateSettled(context, true)
		this.#onPlaybackContextChanged(wrapper.playbackContext, wrapper.pendingPlaybackContext, [context])
	}
}
