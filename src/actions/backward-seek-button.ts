import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.backward-seek-button' })
export default class BackwardSeekButton extends Button {
	async invokeWrapperAction() {
		return true
	}
}
