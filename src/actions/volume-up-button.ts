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

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return wrapper.setPlaybackVolume((wrapper.muted ? wrapper.mutedVolumePercent : wrapper.volumePercent) + this.settings[context]?.step)
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].step)
			await this.setSettings(context, {
				step: 5
			})
	}
}
