import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.volume-down-button' })
export default class VolumeDownButton extends Button {
	static readonly HOLDABLE = true

	async invokeWrapperAction(context: string) {
		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (wrapper.muted && wrapper.mutedVolumePercent > constants.VOLUME_STEP_SIZE)
			await wrapper.unmuteVolume()

		return wrapper.setPlaybackVolume(wrapper.volumePercent - constants.VOLUME_STEP_SIZE)
	}
}
