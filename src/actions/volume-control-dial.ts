import StreamDeck, {
	DialDownEvent,
	DialUpEvent,
	DialRotateEvent,
	WillAppearEvent,
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import constants from '../library/constants.js'
import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-control-dial' })
export default class VolumeControlDial extends Dial {
	constructor() {
		super()
		wrapper.on('volumePercentChanged', this.#onVolumePercentChanged.bind(this))
	}

	#onVolumePercentChanged(volumePercent: number, contexts = this.contexts) {
		// for (const context of contexts)
		// 	StreamDeck.client.setFeedback(context, {
		// 		indicator: volumePercent,
		// 		value: `${volumePercent}%`
		// 	}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)

		StreamDeck.client.setFeedback(ev.action.id, {
			title: {
				value: 'Volume Control'
			},

			indicator: {
				opacity: 0.3
			},

			icon: {
				opacity: 0.3
			},

			value: {
				value: '?%',
				opacity: 0.3,

				font: {
					size: 18
				}
			}
		}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		this.#onVolumePercentChanged(wrapper.volumePercent, [ev.action.id])
	}

	async onDialRotate(ev: DialRotateEvent<object>): Promise<void> {
		super.onDialRotate(ev)

		if (ev.payload.ticks > 0) {
			if (wrapper.muted)
				await wrapper.unmuteVolume()
	
			await wrapper.setPlaybackVolume(wrapper.volumePercent + constants.VOLUME_STEP_SIZE)
		} else if (ev.payload.ticks < 0) {
			if (wrapper.muted && wrapper.mutedVolumePercent > constants.VOLUME_STEP_SIZE)
				await wrapper.unmuteVolume()

			return wrapper.setPlaybackVolume(wrapper.volumePercent - constants.VOLUME_STEP_SIZE)
		}
	}
}
