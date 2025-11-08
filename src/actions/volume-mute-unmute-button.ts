
import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.volume-mute-unmute-button' })
export default class VolumeMuteUnmuteButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/volume-mute-unknown')
		wrapper.on('mutedStateChanged', this.#onMutedStateChanged.bind(this))
	}

	async #onMutedStateChanged(state: boolean, contexts = this.contexts) {
		const promises = []

		for (const context of contexts)
			promises.push(new Promise(async (resolve) => {
				if (wrapper.volumePercent === null)
					await this.setImage(context, 'images/states/volume-mute-unknown')
				else {
					await this.setImage(context)
					await this.setState(context, state ? 1 : 0)
				}

				resolve(true)
			}))

		await Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		else if (wrapper.muted)
			return wrapper.unmuteVolume()
		else
			return wrapper.muteVolume()
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context)
		await this.#onMutedStateChanged(wrapper.muted, [context])
	}
}
