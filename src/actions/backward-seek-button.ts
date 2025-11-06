import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.backward-seek-button' })
export default class BackwardSeekButton extends Button {
	static readonly HOLDABLE = true

	async invokeWrapperAction(context: string) {
		if (wrapper.song)
			return wrapper.backwardSeek(wrapper.song, constants.SEEK_STEP_SIZE)
		else if (wrapper.pendingSongChange)
			return constants.WRAPPER_RESPONSE_BUSY
		else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}
}
