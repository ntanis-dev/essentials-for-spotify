import StreamDeck, {
	WillAppearEvent,
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import constants from './../library/constants.js'
import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-control-dial' })
export default class VolumeControlDial extends Dial {
	static readonly HOLDABLE = true

	constructor() {
		super('volume-control-layout.json', 'images/icons/volume-control.png')
		wrapper.on('mutedStateChanged', this.#onMutedStateChanged.bind(this))
		wrapper.on('volumePercentChanged', this.#onVolumePercentChanged.bind(this))
	}

	#onVolumePercentChanged(percent: number, contexts = this.contexts) {
		for (const context of contexts)
			this.updateFeedback(context)
	}

	#onMutedStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			this.updateFeedback(context)
	}

	async invokeWrapperAction(type: symbol) {
		if (type === Dial.TYPES.ROTATE_CLOCKWISE) {
			if (wrapper.volumePercent === null)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			return wrapper.setPlaybackVolume((wrapper.muted ? wrapper.mutedVolumePercent : wrapper.volumePercent) + constants.VOLUME_STEP_SIZE)
		} else if (type === Dial.TYPES.ROTATE_COUNTERCLOCKWISE) {
			if (wrapper.volumePercent === null)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			if (wrapper.muted && wrapper.mutedVolumePercent > constants.VOLUME_STEP_SIZE)
				await wrapper.unmuteVolume()

			return wrapper.setPlaybackVolume(wrapper.volumePercent - constants.VOLUME_STEP_SIZE)
		} else if (type === Dial.TYPES.TAP) {
			if (wrapper.muted)
				return wrapper.unmuteVolume()
			else
				return wrapper.muteVolume()
		} else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async invokeHoldWrapperAction() {
		return wrapper.muteVolume()
	}

	async invokeHoldReleaseWrapperAction() {
		return wrapper.unmuteVolume()
	}

	updateFeedback(context: string): void {
		if (wrapper.volumePercent === null)
			return

		StreamDeck.client.setFeedback(context, {
			indicator: {
				value: wrapper.muted ? wrapper.mutedVolumePercent : wrapper.volumePercent,
				opacity: wrapper.muted ? 0.5 : 1.0
			},

			icon: {
				opacity: 1,
				value: wrapper.muted ? 'images/icons/volume-control-muted.png' : 'images/icons/volume-control.png'
			},

			text: {
				value: `${wrapper.muted ? wrapper.mutedVolumePercent : wrapper.volumePercent}%`,
				opacity: wrapper.muted ? 0.5 : 1.0
			}
		}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}
}
