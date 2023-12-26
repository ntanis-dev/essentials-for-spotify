import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.shuffle-button' })
export default class ShuffleButton extends Button {
	constructor() {
		super()
		wrapper.on('shuffleStateChanged', this.#onShuffleStateChanged.bind(this))
	}

	#onShuffleStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => await streamDeck.client.setState(context, state ? 1 : 0))
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onShuffleStateChanged(wrapper.shuffleState, [ev.action.id])
	}

	async onButtonKeyDown() {
		if (wrapper.shuffleState)
			return wrapper.turnOffShuffle()
		else
			return wrapper.turnOnShuffle()
	}
}
