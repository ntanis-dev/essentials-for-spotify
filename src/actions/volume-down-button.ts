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

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (wrapper.muted && wrapper.mutedVolumePercent > this.settings[context]?.step)
			await wrapper.unmuteVolume()

		return wrapper.setPlaybackVolume(wrapper.volumePercent - this.settings[context]?.step)
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].step)
			await this.setSettings(context, {
				step: 5
			})
	}
}
