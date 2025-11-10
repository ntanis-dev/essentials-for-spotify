import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.volume-stack-button' })
export default class VolumeStackButton extends Button {
	static readonly MULTI = true
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/volume-stack-unknown')
		wrapper.on('mutedStateChanged', (state: boolean) => this.#onStateChanged())
		wrapper.on('volumePercentChanged', (percent: number) => this.#onStateChanged())
	}

	#roundToNext10(percent: number) {
		return Math.min(100, Math.ceil(percent / 10) * 10)
	}

	async #onStateChanged(contexts = this.contexts) {
		const promises = []

		for (const context of contexts)
			if (((!wrapper.muted) && wrapper.volumePercent === null) || (wrapper.muted && wrapper.mutedVolumePercent === null))
				promises.push(this.setImage(context, 'images/states/volume-stack-unknown'))
			else
				promises.push(this.setImage(context, `images/states/volume-stack-${this.#roundToNext10(wrapper.muted ? wrapper.mutedVolumePercent : wrapper.volumePercent)}${wrapper.muted ? '-muted' : ''}`))

		return Promise.allSettled(promises)
	}

	async #invokePress(context: string, action: string) {
		switch (action) {
			case 'volume_up':
				return wrapper.volumeUp(this.settings[context].step)

			case 'volume_down':
				return wrapper.volumeDown(this.settings[context].step)

			case 'volume_mute_unmute':
				return wrapper.toggleVolumeMute()
		}
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (type === Button.TYPES.SINGLE_PRESS)
			return this.#invokePress(context, this.settings[context].single_press)
		else if (type === Button.TYPES.DOUBLE_PRESS)
			return this.#invokePress(context, this.settings[context].double_press)
		else if (type === Button.TYPES.TRIPLE_PRESS)
			return constants.WRAPPER_RESPONSE_SUCCESS
		else if (type === Button.TYPES.LONG_PRESS)
			return this.#invokePress(context, this.settings[context].long_press)
		else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].step)
			await this.setSettings(context, {
				step: constants.DEFAULT_VOLUME_STEP
			})

		if (!this.settings[context].single_press)
			await this.setSettings(context, {
				single_press: 'volume_up'
			})

		if (!this.settings[context].double_press)
			await this.setSettings(context, {
				double_press: 'volume_down'
			})

		if (!this.settings[context].long_press)
			await this.setSettings(context, {
				long_press: 'volume_mute_unmute'
			})
	}
}
