import StreamDeck, {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.surprise-me-button' })
export default class SurpriseMeButton extends Button {
	async invokeWrapperAction() {
		for (const context of this.contexts) {
			this.setBusy(context, true)
			await StreamDeck.client.setImage(context, 'images/states/pending').catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
		}

		const response = await wrapper.surpriseMe()

		for (const context of this.contexts) {
			this.setBusy(context, false)
			await StreamDeck.client.setImage(context).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
		}

		if (response === constants.WRAPPER_RESPONSE_SUCCESS)
			return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
		else
			return response
	}
}
