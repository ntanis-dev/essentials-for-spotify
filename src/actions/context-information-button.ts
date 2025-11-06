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

	#onPlaybackContextChanged(playbackContext: any, pending: boolean = false, contexts = this.contexts, force = false) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setUnpressable(context, true)

				if ((playbackContext && this.marquees[context] && this.marquees[context].id !== playbackContext.uri) || ((!playbackContext) && this.marquees[context]) || force) {
					this.clearMarquee(context)
					this.setTitle(context, '')
				}

				if (playbackContext) {
					if (!images.isItemCached(playbackContext))
						this.setImage(context, 'images/states/pending')

					const image = await images.getForItem(playbackContext)

					if ((!this.marquees[context]) || this.marquees[context].id !== playbackContext.uri || force)
						this.marqueeTitle(playbackContext.uri, [
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
						this.setImage(context, `data:image/jpeg;base64,${image}`)
					else if (playbackContext.type === 'local')
						this.setImage(context, 'images/states/local')
					else
						this.setImage(context)
				} else if (pending)
					this.setImage(context, 'images/states/pending')
				else
					this.setImage(context, 'images/states/context-information-unknown')

				if (!pending)
					this.setUnpressable(context, false)
			})
	}

	async invokeWrapperAction(context: string) {
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
			this.#onPlaybackContextChanged(wrapper.playbackContext, wrapper.pendingPlaybackContext, [context], true)
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id)
	}

	onStateSettled(context: string) {
		super.onStateSettled(context, true)
		this.#onPlaybackContextChanged(wrapper.playbackContext, wrapper.pendingPlaybackContext, [context])
	}

	onStateLoss(context: string) {
		super.onStateLoss(context)
		this.clearMarquee(context)
		this.setTitle(context, '')
	}
}
