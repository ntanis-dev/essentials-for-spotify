import {
	WillAppearEvent,
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-up-button' })
export default class VolumeUpButton extends Button {
	static readonly HOLDABLE = true

	async invokeWrapperAction() {
		if (wrapper.muted)
			await wrapper.unmuteVolume()

		return wrapper.setPlaybackVolume(wrapper.volumePercent + 5)
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		// this.#onVolumeChanged(wrapper.volumePercent, [ev.action.id])
	}
}
