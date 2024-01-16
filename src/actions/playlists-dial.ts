import {
	action,
	WillDisappearEvent
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import constants from './../library/constants.js'
import images from './../library/images.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.playlists-dial' })
export default class PlaylistsDial extends Dial {
	#currentPlaylist: any = {}
	#playlists: any = []

	constructor() {
		super('playlists-layout.json', 'images/icons/playlists.png')
	}

	async #refreshPlaylists(context: string) {
		this.setIcon(context, 'images/icons/pending.png')

		const apiCall = await wrapper.getPlaylists()

		if (typeof apiCall !== 'object' || (apiCall.status !== constants.WRAPPER_RESPONSE_SUCCESS && apiCall.status !== constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)) {
			await this.resetFeedbackLayout(context)

			const icon = this.getIconForStatus(typeof apiCall === 'object' ? apiCall.status : apiCall)

			if (icon)
				await this.flashIcon(context, icon)

			return
		}

		delete apiCall.status

		this.#playlists = apiCall
		this.#currentPlaylist[context] = 0

		const image = await images.getForPlaylist(this.#playlists.items[this.#currentPlaylist[context]])

		this.setFeedback(context, {
			name: {
				value: this.#playlists.items[this.#currentPlaylist[context]].name,
				opacity: 1.0
			},

			icon: {
				value: image ? `data:image/jpeg;base64,${image}` : this.originalIcon,
				opacity: 1.0
			},

			count: {
				value: `${this.#currentPlaylist[context] + 1} / ${this.#playlists.total}`,
				opacity: 1.0
			}
		})

		const nameMarquee = this.getMarquee(context, 'name')

		if (nameMarquee) {
			this.updateMarquee(context, 'name', this.#playlists.items[this.#currentPlaylist[context]].name, this.#playlists.items[this.#currentPlaylist[context]].name)
			this.resumeMarquee(context, 'name')
		} else
			this.marquee(context, 'name', this.#playlists.items[this.#currentPlaylist[context]].name, this.#playlists.items[this.#currentPlaylist[context]].name, 12, context)
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id, 'name')
	}

	updateFeedback(context: string): void {
		super.updateFeedback(context)
		this.#refreshPlaylists(context)
	}
}
