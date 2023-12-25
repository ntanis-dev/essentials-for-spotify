import streamDeck from '@elgato/streamdeck'
import { action } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import logger from './../library/logger.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.play-pause-button' })
export default class PlayPauseButton extends Button {
	constructor() {
		super()
		wrapper.on('playbackStateChanged', this.#onPlaybackStateChanged.bind(this))
	}

	#onPlaybackStateChanged(state: boolean) {
		if (this.context)
			streamDeck.client.setState(this.context, state ? 1 : 0).catch(e => logger.error(`Failed to set state for ${this.manifestId}.`, e))
	}

	async onButtonKeyDown() {
		if (wrapper.playing)
			return wrapper.pausePlayback()
		else
			return wrapper.resumePlayback()
	}
}
