
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

@action({ UUID: 'com.ntanis.spotify-essentials.volume-mute-unmute-button' })
export default class VolumeMuteUnmuteButton extends Button {
	constructor() {
		super()
		wrapper.on('mutedStateChanged', this.#onMutedStateChanged.bind(this))
	}

	#onMutedStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			StreamDeck.client.setState(context, state ? 1 : 0).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck state of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	async invokeWrapperAction() {
		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (wrapper.muted)
			return wrapper.unmuteVolume()
		else
			return wrapper.muteVolume()
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onMutedStateChanged(wrapper.muted, [ev.action.id])
	}
}
