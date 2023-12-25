
import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import logger from './../library/logger.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-mute-unmute-button' })
export default class VolumeMuteUnmuteButton extends Button {
	constructor() {
		super()
		wrapper.on('mutedStateChanged', this.#onMutedStateChanged.bind(this))
	}

	#onMutedStateChanged(state: boolean) {
		for (const context of this.contexts)
			setImmediate(async () => await streamDeck.client.setState(context, state ? 1 : 0).catch(e => logger.error(`Failed to set state for "${this.manifestId}".`, e)))
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onMutedStateChanged(wrapper.muted)
	}

	async onButtonKeyDown() {
		if (wrapper.muted)
			return wrapper.unmuteVolume()
		else
			return wrapper.muteVolume()
	}
}
