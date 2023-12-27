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
			if (wrapper.song.progress + constants.SEEK_STEP_SIZE < wrapper.song.item.duration_ms)
				return wrapper.forwardSeek(Object.assign({}, wrapper.song), constants.SEEK_STEP_SIZE)
			else
				return constants.WRAPPER_RESPONSE_SUCCESS
		else if (wrapper.pendingSongChange)
			return constants.WRAPPER_RESPONSE_SUCCESS
		else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}
}
