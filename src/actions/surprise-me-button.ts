import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.surprise-me-button' })
export default class SurpriseMeButton extends Button {
	async invokeWrapperAction() {
		return true
	}
}
