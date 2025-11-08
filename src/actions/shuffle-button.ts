import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.shuffle-button' })
export default class ShuffleButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/shuffle-unknown')
		wrapper.on('shuffleStateChanged', this.#onShuffleStateChanged.bind(this))
	}

	async #onShuffleStateChanged(state: boolean, contexts = this.contexts) {
		const promises = []

		for (const context of contexts)
			promises.push(this.setState(context, state ? 1 : 0))

		return Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		return wrapper.toggleShuffle()
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context)
		await this.#onShuffleStateChanged(wrapper.shuffleState, [context])
	}
}
