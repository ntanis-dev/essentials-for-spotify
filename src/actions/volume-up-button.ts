import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.volume-up-button' })
export default class VolumeUpButton extends Button {
	static readonly HOLDABLE = true

	async invokeWrapperAction(context: string) {
		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return wrapper.setPlaybackVolume((wrapper.muted ? wrapper.mutedVolumePercent : wrapper.volumePercent) + constants.VOLUME_STEP_SIZE)
	}
}
