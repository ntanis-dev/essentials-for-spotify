import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.loop-song-button' })
export default class LoopSongButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/loop-one-unknown')
		wrapper.on('repeatStateChanged', this.#onRepeatStateChanged.bind(this))
	}

	async #onRepeatStateChanged(state: string, contexts = this.contexts) {
		const promises = []

		for (const context of contexts)
			promises.push(this.setState(context, state === 'track' ? 1 : 0))

		await Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string) {
		if (wrapper.repeatState === 'track')
			return wrapper.turnOffRepeat()
		else
			return wrapper.turnOnTrackRepeat()
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context)
		await this.#onRepeatStateChanged(wrapper.repeatState, [context])
	}
}
