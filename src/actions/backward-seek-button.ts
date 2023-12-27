import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.backward-seek-button' })
export default class BackwardSeekButton extends Button {
	static readonly HOLDABLE = true

	async invokeWrapperAction() {
		if (wrapper.song)
			return wrapper.backwardSeek(Object.assign({}, wrapper.song), constants.SEEK_STEP_SIZE)
		else if (wrapper.pendingSongChange)
			return constants.WRAPPER_RESPONSE_SUCCESS
		else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}
}
