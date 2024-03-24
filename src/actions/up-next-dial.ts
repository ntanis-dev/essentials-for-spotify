import {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import constants from './../library/constants.js'
import images from './../library/images.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.up-next-dial' })
export default class UpNextDial extends Dial {
	#queue: any = []

	constructor() {
		super('up-next-layout.json', 'images/icons/up-next.png')
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
		wrapper.on('deviceChanged', this.#onDeviceChanged.bind(this))
	}
	async #refreshQueue(context: string) {
		this.setIcon(context, 'images/icons/pending.png')

		this.resetFeedbackLayout(context, {
			name: {
				opacity: 1.0
			},

			text: {
				opacity: 1.0
			},

			icon: {
				opacity: 1.0
			}
		})

		const apiCall = await wrapper.getQueue()

		this.setIcon(context, this.originalIcon)

		if (typeof apiCall !== 'object' || (apiCall.status !== constants.WRAPPER_RESPONSE_SUCCESS && apiCall.status !== constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)) {
			this.resetFeedbackLayout(context, {
				name: {
					opacity: 1.0
				},

				icon: {
					opacity: 1.0
				},

				text: {
					opacity: 1.0
				}
			})

			const icon = this.getIconForStatus(typeof apiCall === 'object' ? apiCall.status : apiCall)

			if (icon)
				await this.flashIcon(context, icon)

			return
		}

		delete apiCall.status
		this.#queue = apiCall.items

		if (this.#queue.length === 0)
			this.resetFeedbackLayout(context)
		else
			await this.#refreshLayout(context)
	}

	async #refreshLayout(context: string) {
		const queueEl = this.#queue[0]

		this.setIcon(context, 'images/icons/pending.png')
		
		const duration = Math.floor(queueEl.duration_ms / 1000)
		const durationMinutes = Math.floor(duration / 60)
		const durationSeconds = duration - (durationMinutes * 60)

		this.setFeedback(context, {
			name: {
				opacity: 1.0
			},

			text: {
				value: `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`,
				opacity: 1.0
			},

			icon: {
				opacity: 1.0
			}
		})

		const nameMarquee = this.getMarquee(context, 'name')
		const title = `${queueEl.name} - ${queueEl.artists.map((artist: any) => artist.name).join(', ')}`

		if (nameMarquee) {
			this.updateMarquee(context, 'name', title, title)
			this.resumeMarquee(context, 'name')
		} else {
			this.marquee(context, 'name', title, title, 12, context)
		}

		const image = await images.getForSong({
			item: queueEl
		})

		if (image)
			this.setIcon(context, `data:image/jpeg;base64,${image}`)
		else
			this.setIcon(context, this.originalIcon)
	}

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		if (pending)
			for (const context of contexts) {
				const nameMarquee = this.getMarquee(context, 'name')

				if (nameMarquee)
					this.pauseMarquee(context, 'name')

				this.setIcon(context, 'images/icons/pending.png')

				this.setFeedback(context, {
					name: {
						value: '??????'
					},

					text: {
						value: '??:??'
					}
				})
			}
		else if (!song)
			for (const context of contexts)
				this.resetFeedbackLayout(context, {
					icon: this.originalIcon
				})
		else
			for (const context of contexts)
				this.#refreshQueue(context)
	}

	#onDeviceChanged(device: any, contexts = this.contexts) {
		if (!device) {
			for (const context of contexts)
				this.resetFeedbackLayout(context)

			return
		}
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Dial.TYPES.TAP) {
			await this.#refreshQueue(context)
			return constants.WRAPPER_RESPONSE_SUCCESS
		} else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
		super.onWillAppear(ev)
	}

	async resetFeedbackLayout(context: string, feedback = {}): Promise<void> {
		super.resetFeedbackLayout(context, Object.assign({
			icon: this.originalIcon
		}, feedback))
	}

	updateFeedback(context: string): void {
		super.updateFeedback(context)

		if (wrapper.song)
			this.#refreshQueue(context)
	}
}
