import os from 'os'

import {
	action,
	WillDisappearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import {
	spawn
} from 'child_process'

import constants from '../library/constants.js'
import images from '../library/images.js'
import wrapper from '../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.context-information-button' })
export default class ContextInformationButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/context-information-unknown')
		wrapper.on('playbackContextChanged', this.#onPlaybackContextChanged.bind(this))
	}

	async #onPlaybackContextChanged(playbackContext: any, pending: boolean = false, contexts = this.contexts, force = false) {
		const promises = []

		for (const context of contexts) 
			promises.push(new Promise(async (resolve) => {
				this.setUnpressable(context, true)

				if ((playbackContext && this.marquees[context] && this.marquees[context].id !== playbackContext.uri) || ((!playbackContext) && this.marquees[context]) || force) {
					this.clearMarquee(context)
					await this.setTitle(context, '')
				}

				if (playbackContext) {
					if (!images.isItemCached(playbackContext))
						await this.setImage(context, 'images/states/pending')

					const image = await images.getForItem(playbackContext)

					if ((!this.marquees[context]) || this.marquees[context].id !== playbackContext.uri || force)
						await this.marqueeTitle(playbackContext.uri, [
							this.settings[context].show.includes('title') ? {
								key: 'title',
								value: playbackContext.title
							} : undefined,

							playbackContext.subtitle && this.settings[context].show.includes('subtitle') ? {
								key: 'subtitle',
								value: playbackContext.subtitle
							} : undefined,

							playbackContext.extra && this.settings[context].show.includes('extra') ? {
								key: 'extra',
								value: playbackContext.extra
							} : undefined
						].filter(v => !!v), context)
					else
						this.resumeMarquee(context)

					if (image)
						await this.setImage(context, `data:image/jpeg;base64,${image}`)
					else if (playbackContext.type === 'local')
						await this.setImage(context, 'images/states/local')
					else
						await this.setImage(context)
				} else if (pending)
					await this.setImage(context, 'images/states/pending')
				else
					await this.setImage(context, 'images/states/context-information-unknown')

				if (!pending)
					this.setUnpressable(context, false)

				resolve(true)
			}))

		await Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (this.settings[context].action === 'play_pause')
			return wrapper.togglePlayback()
		else if (this.settings[context].action === 'open_spotify')
			if (wrapper.playbackContext) {
				switch (os.platform()) {
					case 'darwin':
						spawn('open', [wrapper.playbackContext.uri])
						break

					case 'win32':
						spawn('cmd', ['/c', 'start', '', wrapper.playbackContext.uri])
						break

					case 'linux':
						spawn('xdg-open', [wrapper.playbackContext.uri])
						break

					default:
						return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
				}

				return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
			}

		return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].action)
			await this.setSettings(context, {
				action: 'open_spotify'
			})

		if (!this.settings[context].show)
			await this.setSettings(context, {
				show: ['title', 'extra', 'subtitle']
			})

		if (oldSettings.show?.length !== this.settings[context].show?.length || (oldSettings.show && this.settings[context].show && (!oldSettings.show.every((value: any, index: number) => value === this.settings[context].show[index]))))
			await this.#onPlaybackContextChanged(wrapper.playbackContext, wrapper.pendingPlaybackContext, [context], true)
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		await super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id)
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context, true)
		await this.#onPlaybackContextChanged(wrapper.playbackContext, wrapper.pendingPlaybackContext, [context])
	}

	async onStateLoss(context: string) {
		await super.onStateLoss(context)

		this.clearMarquee(context)

		await this.setTitle(context, '')
	}
}
