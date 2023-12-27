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

declare const fetch: Function

@action({ UUID: 'com.ntanis.spotify-essentials.playback-control-dial' })
export default class PlaybackControlDial extends Dial {
	#imageCache: any = {}

	constructor() {
		super()
		wrapper.on('volumePercentChanged', this.#onVolumePercentChanged.bind(this))
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
		wrapper.on('songTimeChanged', this.#onSongTimeChanged.bind(this))
	}

	#beautifyProgress(progressMs: number) {
		const progress = Math.floor(progressMs / 1000)
		const progressMinutes = Math.floor(progress / 60)
		const progressSeconds = progress - (progressMinutes * 60)
		return `${progressMinutes}:${progressSeconds.toString().padStart(2, '0')}`
	}

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		// for (const context of contexts)
		// 	setImmediate(async () => {
		// 		this.setBusy(context, true)

		// 		const url = song && song.item.album.images.length > 0 ? song.item.album.images[0].url : null

		// 		if (pending)
		// 			await StreamDeck.client.setFeedback(context, {
		// 				title: '',

		// 				icon: 'images/states/pending',

		// 				indicator: {
		// 					enabled: false
		// 				},

		// 				value: {
		// 					enabled: false
		// 				}
		// 			}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		// 		if (url) {
		// 			if (!this.#imageCache[url])
		// 				await StreamDeck.client.setFeedback(context, {
		// 					icon: 'images/states/pending',

		// 					indicator: {
		// 						enabled: false
		// 					}
		// 				}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		// 			let imageBuffer = undefined

		// 			try {
		// 				imageBuffer = this.#imageCache[url] || Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
		// 			} catch (e: any) {
		// 				logger.error(`An error occurred while fetching the image of song "${song.item.id}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
		// 			}

		// 			this.#imageCache[url] = imageBuffer

		// 			await StreamDeck.client.setFeedback(context, {
		// 				title: `${song.item.name} - ${song.item.artists.map((artist: any) => artist.name).join(', ')}`
		// 			}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		// 			if (imageBuffer)
		// 				await StreamDeck.client.setFeedback(context, {
		// 					icon: `data:image/jpeg;base64,${imageBuffer}`,

		// 					indicator: {
		// 						enabled: true
		// 					},

		// 					value: {
		// 						enabled: true
		// 					}
		// 				}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
		// 			else
		// 				await StreamDeck.client.setFeedback(context, {
		// 					icon: ''
		// 				}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
		// 		} else if (pending) {
		// 			this.#imageCache = {}
		// 			await StreamDeck.client.setFeedback(context, {
		// 				icon: 'images/states/pending',

		// 				indicator: {
		// 					enabled: false
		// 				}
		// 			}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
		// 		} else
		// 			await StreamDeck.client.setFeedback(context, {
		// 				icon: ''
		// 			}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		// 		if (!pending)
		// 			this.setBusy(context, false)
		// 	})
	}

	#onSongTimeChanged(progress: number, duration: number, pending: boolean = false, contexts = this.contexts) {
		// for (const context of contexts)
		// 	StreamDeck.client.setFeedback(context, {
		// 		indicator: Math.round(progress / duration * 100),
		// 		value: `${this.#beautifyProgress(progress)}`
		// 	}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
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
				value: 'Playback Control'
			},

			indicator: {
				opacity: 0.3
			},

			icon: {
				opacity: 0.3
			},

			value: {
				value: '??:?? / ??:??',
				opacity: 0.3,

				font: {
					size: 18
				}
			}
		}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		// StreamDeck.client.showAlert(ev.action.id).catch((e: any) => logger.error(`An error occurred while showing the Stream Deck alert of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

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
