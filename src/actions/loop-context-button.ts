import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import logger from './../library/logger.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.loop-context-button' })
export default class LoopContextButton extends Button {
	constructor() {
		super()
		wrapper.on('repeatStateChanged', this.#onRepeatStateChanged.bind(this))
	}

	#onRepeatStateChanged(state: string, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => await streamDeck.client.setState(context, state === 'context' ? 1 : 0).catch(e => logger.error(`Failed to set state for "${this.manifestId}".`, e)))
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onRepeatStateChanged(wrapper.repeatState, [ev.action.id])
	}

	async onButtonKeyDown() {
		if (wrapper.repeatState === 'context')
			return wrapper.turnOffRepeat()
		else
			return wrapper.turnOnContextRepeat()
	}
}
