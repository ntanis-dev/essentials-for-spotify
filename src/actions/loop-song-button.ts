import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.loop-song-button' })
export default class LoopSongButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/loop-one-unknown')
		wrapper.on('repeatStateChanged', this.#onRepeatStateChanged.bind(this))
	}

	#onRepeatStateChanged(state: string, contexts = this.contexts) {
		for (const context of contexts)
			this.setState(context, state === 'track' ? 1 : 0)
	}

	async invokeWrapperAction(context: string) {
		if (wrapper.repeatState === 'track')
			return wrapper.turnOffRepeat()
		else
			return wrapper.turnOnTrackRepeat()
	}

	onStateSettled(context: string) {
		super.onStateSettled(context)
		this.#onRepeatStateChanged(wrapper.repeatState, [context])
	}
}
