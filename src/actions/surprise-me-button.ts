import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.surprise-me-button' })
export default class SurpriseMeButton extends Button {
	async invokeWrapperAction(context: string) {
		for (const context of this.contexts) {
			this.setUnpressable(context, true)
			this.setImage(context, 'images/states/pending')
		}

		const response = await wrapper.surpriseMe()

		for (const context of this.contexts) {
			this.setImage(context)
			this.setUnpressable(context, false)
		}

		if (response === constants.WRAPPER_RESPONSE_SUCCESS)
			return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
		else
			return response
	}
}
