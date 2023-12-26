import StreamDeck, {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.play-pause-button' })
export default class PlayPauseButton extends Button {
	constructor() {
		super()
		wrapper.on('playbackStateChanged', this.#onPlaybackStateChanged.bind(this))
	}

	#onPlaybackStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			StreamDeck.client.setState(context, state ? 1 : 0).catch(e => logger.error(`An error occurred while setting the Stream Deck state of "${this.manifestId}": "${e}".`))
	}

	async invokeWrapperAction() {
		if (wrapper.playing)
			return wrapper.pausePlayback()
		else
			return wrapper.resumePlayback()
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onPlaybackStateChanged(wrapper.playing, [ev.action.id])
	}
}
