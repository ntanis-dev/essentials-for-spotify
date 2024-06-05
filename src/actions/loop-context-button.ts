import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.loop-context-button' })
export default class LoopContextButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/loop-unknown')
		wrapper.on('repeatStateChanged', this.#onRepeatStateChanged.bind(this))
	}

	#onRepeatStateChanged(state: string, contexts = this.contexts) {
		for (const context of contexts)
			this.setState(context, state === 'context' ? 1 : 0)
	}

	async invokeWrapperAction(context: string) {
		if (wrapper.repeatState === 'context')
			return wrapper.turnOffRepeat()
		else
			return wrapper.turnOnContextRepeat()
	}

	onStateSettled(context: string) {
		super.onStateSettled(context)
		this.#onRepeatStateChanged(wrapper.repeatState, [context])
	}
}
