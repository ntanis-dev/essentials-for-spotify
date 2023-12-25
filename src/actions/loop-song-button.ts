import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import logger from './../library/logger.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.loop-song-button' })
export default class LoopSongButton extends Button {
	constructor() {
		super()
		wrapper.on('repeatStateChanged', this.#onRepeatStateChanged.bind(this))
	}

	#onRepeatStateChanged(state: string) {
		for (const context of this.contexts)
			setImmediate(async () => await streamDeck.client.setState(context, state === 'track' ? 1 : 0).catch(e => logger.error(`Failed to set state for "${this.manifestId}".`, e)))
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onRepeatStateChanged(wrapper.repeatState)
	}

	async onButtonKeyDown() {
		if (wrapper.repeatState === 'track')
			return wrapper.turnOffRepeat()
		else
			return wrapper.turnOnTrackRepeat()
	}
}
