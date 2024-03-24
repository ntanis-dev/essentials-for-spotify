import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import connector from './../library/connector.js'

@action({ UUID: 'com.ntanis.spotify-essentials.setup-button' })
export default class SetupButton extends Button {
	static readonly SETUPLESS = true

	constructor() {
		super()
	}

	async invokeWrapperAction(context: string) {
		if (connector.set)
			connector.fakeOff()
		else
			connector.fakeOn()

		return constants.WRAPPER_RESPONSE_SUCCESS
	}
}
