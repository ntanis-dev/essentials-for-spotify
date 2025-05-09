import {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.play-pause-button' })
export default class PlayPauseButton extends Button {
	constructor() {
		super()
		wrapper.on('playbackStateChanged', this.#onPlaybackStateChanged.bind(this))
	}

	#onPlaybackStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			this.setState(context, state ? 1 : 0)
	}

	async invokeWrapperAction(context: string) {
		if (wrapper.playing)
			return wrapper.pausePlayback()
		else
			return wrapper.resumePlayback()
	}

	async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
		await super.onWillAppear(ev)
		this.#onPlaybackStateChanged(wrapper.playing, [ev.action.id])
	}
}
