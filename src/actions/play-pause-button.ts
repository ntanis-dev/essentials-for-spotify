import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.play-pause-button' })
export default class PlayPauseButton extends Button {
	constructor() {
		super()
		wrapper.on('playbackStateChanged', this.#onPlaybackStateChanged.bind(this))
	}

	#onPlaybackStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => await streamDeck.client.setState(context, state ? 1 : 0))
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onPlaybackStateChanged(wrapper.playing, [ev.action.id])
	}

	async onButtonKeyDown() {
		if (wrapper.playing)
			return wrapper.pausePlayback()
		else
			return wrapper.resumePlayback()
	}
}
