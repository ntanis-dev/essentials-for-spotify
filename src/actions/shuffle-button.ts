import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import logger from './../library/logger.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.shuffle-button' })
export default class ShuffleButton extends Button {
	constructor() {
		super()
		wrapper.on('shuffleStateChanged', this.#onShuffleStateChanged.bind(this))
	}

	#onShuffleStateChanged(state: boolean) {
		for (const context of this.contexts)
			setImmediate(async () => await streamDeck.client.setState(context, state ? 1 : 0).catch(e => logger.error(`Failed to set state for "${this.manifestId}".`, e)))
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onShuffleStateChanged(wrapper.shuffleState)
	}

	async onButtonKeyDown() {
		if (wrapper.shuffleState)
			return wrapper.turnOffShuffle()
		else
			return wrapper.turnOnShuffle()
	}
}
