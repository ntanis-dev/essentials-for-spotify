import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.loop-context-button' })
export default class LoopContextButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/loop-unknown')
		wrapper.on('repeatStateChanged', this.#onRepeatStateChanged.bind(this))
	}

	async #onRepeatStateChanged(state: string, contexts = this.contexts) {
		const promises = []

		for (const context of contexts)
			promises.push(this.setState(context, state === 'context' ? 1 : 0))

		await Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		return wrapper.toggleContextRepeat()
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context)
		await this.#onRepeatStateChanged(wrapper.repeatState, [context])
	}
}
