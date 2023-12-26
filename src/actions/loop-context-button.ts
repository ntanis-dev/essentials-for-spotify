import StreamDeck, {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.loop-context-button' })
export default class LoopContextButton extends Button {
	constructor() {
		super()
		wrapper.on('repeatStateChanged', this.#onRepeatStateChanged.bind(this))
	}

	#onRepeatStateChanged(state: string, contexts = this.contexts) {
		for (const context of contexts)
			StreamDeck.client.setState(context, state === 'context' ? 1 : 0).catch(e => logger.error(`An error occurred while setting the Stream Deck state of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stacktrace.'}".`))
	}

	async invokeWrapperAction() {
		if (wrapper.repeatState === 'context')
			return wrapper.turnOffRepeat()
		else
			return wrapper.turnOnContextRepeat()
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onRepeatStateChanged(wrapper.repeatState, [ev.action.id])
	}
}
