import {
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import constants from './../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-control-dial' })
export default class VolumeControlDial extends Dial {
	static readonly HOLDABLE = true

	constructor() {
		super('volume-control-layout.json', 'images/icons/volume-control.png')
		wrapper.on('mutedStateChanged', this.#onMutedStateChanged.bind(this))
		wrapper.on('volumePercentChanged', this.#onVolumePercentChanged.bind(this))
		wrapper.on('deviceChanged', this.#onDeviceChanged.bind(this))
	}

	#updateJointFeedback(contexts = this.contexts) {
		if (wrapper.volumePercent === null)
			return

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

	async invokeWrapperAction(type: symbol) {
		if (type === Dial.TYPES.ROTATE_CLOCKWISE) {
			if (wrapper.volumePercent === null)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			return wrapper.setPlaybackVolume((wrapper.muted ? wrapper.mutedVolumePercent : wrapper.volumePercent) + constants.VOLUME_STEP_SIZE)
		} else if (type === Dial.TYPES.ROTATE_COUNTERCLOCKWISE) {
			if (wrapper.volumePercent === null)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			if (wrapper.muted && wrapper.mutedVolumePercent > constants.VOLUME_STEP_SIZE)
				await wrapper.unmuteVolume()

			return wrapper.setPlaybackVolume(wrapper.volumePercent - constants.VOLUME_STEP_SIZE)
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

	async invokeHoldWrapperAction() {
		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (!wrapper.muted)
			return wrapper.muteVolume()
		else
			return constants.WRAPPER_RESPONSE_SUCCESS
	}

	async invokeHoldReleaseWrapperAction() {
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

	updateFeedback(context: string): void {
		super.updateFeedback(context)
		this.#onMutedStateChanged(wrapper.muted, [context])
		this.#onVolumePercentChanged(wrapper.volumePercent, [context])
		this.#onDeviceChanged(wrapper.device, [context])
	}
}
