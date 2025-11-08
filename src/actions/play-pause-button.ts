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

	async #onPlaybackStateChanged(state: boolean, contexts = this.contexts) {
		const promises = []

		for (const context of contexts)
			if (this.settings[context]?.action === 'play_pause')
				promises.push(this.setState(context, state ? 1 : 0))

		await Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (wrapper.playing && this.settings[context]?.action !== 'play')
			return wrapper.pausePlayback()
		else if ((!wrapper.playing) && this.settings[context]?.action !== 'pause')
			return wrapper.resumePlayback()
	}

	async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
		await super.onWillAppear(ev)
		await this.#onPlaybackStateChanged(wrapper.playing, [ev.action.id])
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].action)
			await this.setSettings(context, {
				action: 'play_pause'
			})

		switch (this.settings[context].action) {
			case 'play_pause':
				await this.#onPlaybackStateChanged(wrapper.playing, [context])
				break

			case 'play':
				await this.setState(context, 0)
				break
			
			case 'pause':
				await this.setState(context, 1)
				break
		}
	}
}
