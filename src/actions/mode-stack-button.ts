import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'
import constants from '../library/constants.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.mode-stack-button' })
export default class ModeStackButton extends Button {
	static readonly STATABLE = true
	static readonly MULTI = true

	constructor() {
		super()
		this.setStatelessImage('images/states/mode-stack-unknown')
		wrapper.on('shuffleStateChanged', (state: boolean) => this.#onStateChanged())
		wrapper.on('repeatStateChanged', (state: string) => this.#onStateChanged())
	}

	async #onStateChanged(contexts = this.contexts) {
		const promises = []

		for (const context of contexts)
			promises.push(this.setImage(context, `images/states/mode-stack-${wrapper.shuffleState ? '1' : '0'}-${wrapper.repeatState === 'track' ? '1' : '0'}-${wrapper.repeatState === 'context' ? '1' : '0'}`))

		return Promise.allSettled(promises)
	}

	async #invokePress(context: string, action: string) {
		switch (action) {
			case 'shuffle':
				return wrapper.toggleShuffle()

			case 'loop_song':
				return wrapper.toggleTrackRepeat()

			case 'loop_context':
				return wrapper.toggleContextRepeat()

			case 'reset_all': {
				const promises = []

				if (wrapper.shuffleState)
					promises.push(wrapper.turnOffShuffle())

				if (wrapper.repeatState !== 'off')
					promises.push(wrapper.turnOffRepeat())

				return Promise.allSettled(promises)
			}
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
			return this.#invokePress(context, this.settings[context].triple_press)
		else if (type === Button.TYPES.LONG_PRESS)
			return this.#invokePress(context, this.settings[context].long_press)
		else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].single_press)
			await this.setSettings(context, {
				single_press: 'shuffle'
			})

		if (!this.settings[context].double_press)
			await this.setSettings(context, {
				double_press: 'loop_song'
			})

		if (!this.settings[context].triple_press)
			await this.setSettings(context, {
				triple_press: 'loop_context'
			})

		if (!this.settings[context].long_press)
			await this.setSettings(context, {
				long_press: 'reset_all'
			})
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context)
		await this.#onStateChanged([context])
	}
}

