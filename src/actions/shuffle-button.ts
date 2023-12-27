import StreamDeck, {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.shuffle-button' })
export default class ShuffleButton extends Button {
	constructor() {
		super()
		wrapper.on('shuffleStateChanged', this.#onShuffleStateChanged.bind(this))
	}

	#onShuffleStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			StreamDeck.client.setState(context, state ? 1 : 0).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck state of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	async invokeWrapperAction() {
		if (wrapper.shuffleState)
			return wrapper.turnOffShuffle()
		else
			return wrapper.turnOnShuffle()
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onShuffleStateChanged(wrapper.shuffleState, [ev.action.id])
	}
}
