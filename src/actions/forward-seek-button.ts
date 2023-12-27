import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.forward-seek-button' })
export default class ForwardSeekButton extends Button {
	static readonly HOLDABLE = true

	async invokeWrapperAction() {
		if (wrapper.song)
			return wrapper.forwardSeek(constants.SEEK_STEP_SIZE)
		else
			return null
	}
}
