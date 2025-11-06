import {
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import constants from './../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.volume-control-dial' })
export default class VolumeControlDial extends Dial {
	static readonly HOLDABLE = true

	constructor() {
		super('volume-control-layout.json', 'images/icons/volume-control.png')
		wrapper.on('mutedStateChanged', this.#onMutedStateChanged.bind(this))
		wrapper.on('volumePercentChanged', this.#onVolumePercentChanged.bind(this))
		wrapper.on('deviceChanged', this.#onDeviceChanged.bind(this))
	}

	#updateJointFeedback(contexts = this.contexts) {
		if (wrapper.volumePercent === null) {
			for (const context of contexts)
				this.resetFeedbackLayout(context)

			return
		}

		for (const context of contexts) {
			this.setIcon(context, wrapper.muted ? 'images/icons/volume-control-muted.png' : 'images/icons/volume-control.png')

			this.setFeedback(context, {
				text: {
					value: `${wrapper.muted ? wrapper.mutedVolumePercent : wrapper.volumePercent}%`,
					opacity: wrapper.muted ? 0.5 : 1.0
				},

				icon: {
					opacity: 1
				},

				indicator: {
					value: wrapper.muted ? wrapper.mutedVolumePercent : wrapper.volumePercent,
					opacity: wrapper.muted ? 0.5 : 1.0
				}
			})
		}
	}

	#onVolumePercentChanged(percent: number, contexts = this.contexts) {
		this.#updateJointFeedback(contexts)
	}

	#onMutedStateChanged(state: boolean, contexts = this.contexts) {
		this.#updateJointFeedback(contexts)
	}

	#onDeviceChanged(device: any, contexts = this.contexts) {
		if (!device) {
			for (const context of contexts)
				this.resetFeedbackLayout(context)

			return
		}

		for (const context of contexts)
			this.#updateJointFeedback([context])
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Dial.TYPES.ROTATE_CLOCKWISE) {
			if (wrapper.volumePercent === null)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			return wrapper.setPlaybackVolume((wrapper.muted ? wrapper.mutedVolumePercent : wrapper.volumePercent) + this.settings[context]?.step)
		} else if (type === Dial.TYPES.ROTATE_COUNTERCLOCKWISE) {
			if (wrapper.volumePercent === null)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			if (wrapper.muted && wrapper.mutedVolumePercent > this.settings[context]?.step)
				await wrapper.unmuteVolume()

			return wrapper.setPlaybackVolume(wrapper.volumePercent - this.settings[context]?.step)
		} else if (type === Dial.TYPES.TAP) {
			if (wrapper.volumePercent === null)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			if (wrapper.muted)
				return wrapper.unmuteVolume()
			else
				return wrapper.muteVolume()
		} else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async invokeHoldWrapperAction(context: string) {
		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (!wrapper.muted)
			return wrapper.muteVolume()
		else
			return constants.WRAPPER_RESPONSE_SUCCESS
	}

	async invokeHoldReleaseWrapperAction(context: string) {
		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (wrapper.muted)
			return wrapper.unmuteVolume()
		else
			return constants.WRAPPER_RESPONSE_SUCCESS
	}

	async resetFeedbackLayout(context: string): Promise<void> {
		super.resetFeedbackLayout(context, {
			icon: this.originalIcon
		})
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].step)
			await this.setSettings(context, {
				step: 5
			})
	}

	updateFeedback(context: string): void {
		super.updateFeedback(context)
		this.#onMutedStateChanged(wrapper.muted, [context])
		this.#onVolumePercentChanged(wrapper.volumePercent, [context])
		this.#onDeviceChanged(wrapper.device, [context])
	}
}
