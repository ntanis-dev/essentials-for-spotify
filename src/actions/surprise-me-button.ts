import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.surprise-me-button' })
export default class SurpriseMeButton extends Button {
	async invokeWrapperAction() {
		return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}
}
