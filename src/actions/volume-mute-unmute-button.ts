
import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-mute-unmute-button' })
export default class VolumeMuteUnmuteButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/volume-mute-unknown')
		wrapper.on('mutedStateChanged', this.#onMutedStateChanged.bind(this))
	}

	#onMutedStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			this.setState(context, state ? 1 : 0)
	}

	async invokeWrapperAction() {
		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		if (wrapper.muted)
			return wrapper.unmuteVolume()
		else
			return wrapper.muteVolume()
	}

	onStateSettled(context: string) {
		super.onStateSettled(context)
		this.#onMutedStateChanged(wrapper.muted, [context])
	}
}
