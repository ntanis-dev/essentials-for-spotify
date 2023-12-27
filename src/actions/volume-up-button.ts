import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-up-button' })
export default class VolumeUpButton extends Button {
	static readonly HOLDABLE = true

	async invokeWrapperAction() {
		if (!wrapper.volumePercent)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (wrapper.muted)
			await wrapper.unmuteVolume()

		return wrapper.setPlaybackVolume(wrapper.volumePercent + constants.VOLUME_STEP_SIZE)
	}
}
