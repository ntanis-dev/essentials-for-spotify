import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.shuffle-button' })
export default class ShuffleButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/shuffle-unknown')
		wrapper.on('shuffleStateChanged', this.#onShuffleStateChanged.bind(this))
	}

	#onShuffleStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			this.setState(context, state ? 1 : 0)
	}

	async invokeWrapperAction() {
		if (wrapper.shuffleState)
			return wrapper.turnOffShuffle()
		else
			return wrapper.turnOnShuffle()
	}

	onStateSettled(context: string) {
		super.onStateSettled(context)
		this.#onShuffleStateChanged(wrapper.shuffleState, [context])
	}
}
