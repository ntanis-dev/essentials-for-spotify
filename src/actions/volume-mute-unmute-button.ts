
import streamDeck, { action, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-mute-unmute-button' })
export default class VolumeMuteUnmuteButton extends Button {
	constructor() {
		super()
		wrapper.on('mutedStateChanged', this.#onMutedStateChanged.bind(this))
	}

	#onMutedStateChanged(state: boolean, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => await streamDeck.client.setState(context, state ? 1 : 0))
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onMutedStateChanged(wrapper.muted, [ev.action.id])
	}

	async onButtonKeyDown() {
		if (wrapper.muted)
			return wrapper.unmuteVolume()
		else
			return wrapper.muteVolume()
	}
}
