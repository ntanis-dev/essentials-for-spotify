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
		super('layouts/volume-control-layout.json', 'images/icons/volume-control.png')
		wrapper.on('mutedStateChanged', this.#onMutedStateChanged.bind(this))
		wrapper.on('volumePercentChanged', this.#onVolumePercentChanged.bind(this))
		wrapper.on('deviceChanged', this.#onDeviceChanged.bind(this))
	}

	async #updateJointFeedback(contexts = this.contexts) {
		const promises = []

		if (wrapper.volumePercent === null) {
			for (const context of contexts)
				promises.push(this.resetFeedbackLayout(context))

			await Promise.allSettled(promises)

			return
		}

		for (const context of contexts)
			promises.push(new Promise(async (resolve) => {
				await this.setIcon(context, wrapper.muted ? 'images/icons/volume-control-muted.png' : 'images/icons/volume-control.png')

				await this.setFeedback(context, {
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

				resolve(true)
			}))

		await Promise.allSettled(promises)
	}

	async #onVolumePercentChanged(percent: number, contexts = this.contexts) {
		await this.#updateJointFeedback(contexts)
	}

	async #onMutedStateChanged(state: boolean, contexts = this.contexts) {
		await this.#updateJointFeedback(contexts)
	}

	async #onDeviceChanged(device: any, contexts = this.contexts) {
		const promises = []

		if (!device) {
			for (const context of contexts)
				promises.push(this.resetFeedbackLayout(context))

			await Promise.allSettled(promises)

			return
		}


		for (const context of contexts)
			promises.push(this.#updateJointFeedback([context]))

		await Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Dial.TYPES.ROTATE_CLOCKWISE) {
			if (wrapper.volumePercent === null)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			return wrapper.volumeUp(this.settings[context].step)
		} else if (type === Dial.TYPES.ROTATE_COUNTERCLOCKWISE)
			if (wrapper.volumePercent === null)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
			else
				return wrapper.volumeDown(this.settings[context].step)
		else if (type === Dial.TYPES.TAP)
			return wrapper.toggleVolumeMute()
		else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async invokeHoldWrapperAction(context: string) {
		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		else if (!wrapper.muted)
			return wrapper.muteVolume()
		else
			return constants.WRAPPER_RESPONSE_SUCCESS
	}

	async invokeHoldReleaseWrapperAction(context: string) {
		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		else if (wrapper.muted)
			return wrapper.unmuteVolume()
		else
			return constants.WRAPPER_RESPONSE_SUCCESS
	}

	async resetFeedbackLayout(context: string): Promise<void> {
		await super.resetFeedbackLayout(context, {
			icon: this.originalIcon
		})
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].step)
			await this.setSettings(context, {
				step: constants.DEFAULT_VOLUME_STEP
			})
	}

	async updateFeedback(context: string) {
		await super.updateFeedback(context)
		await this.#onMutedStateChanged(wrapper.muted, [context])
		await this.#onVolumePercentChanged(wrapper.volumePercent, [context])
		await this.#onDeviceChanged(wrapper.device, [context])
	}
}
