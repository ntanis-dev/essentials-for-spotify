import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.forward-seek-button' })
export default class ForwardSeekButton extends Button {
	async invokeWrapperAction() {
		return false
	}
}
