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

@action({ UUID: 'com.ntanis.spotify-essentials.playlists-dial' })
export default class PlaylistsDial extends Dial {
	#currentPlaylist: any = {}
	#playlistsPage: any = {}
	#playlists: any = []
	#lastTotal: number = 0

	constructor() {
		super('playlists-layout.json', 'images/icons/playlists.png')
	}

	async #refreshPlaylists(context: string) {
		if (this.#playlistsPage[context] === undefined)
			this.#playlistsPage[context] = 1

		const apiCall = await wrapper.getPlaylists(this.#playlistsPage[context])

		if (typeof apiCall !== 'object' || (apiCall.status !== constants.WRAPPER_RESPONSE_SUCCESS && apiCall.status !== constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)) {
			await this.resetFeedbackLayout(context)

			const icon = this.getIconForStatus(typeof apiCall === 'object' ? apiCall.status : apiCall)

			if (icon)
				await this.flashIcon(context, icon)

			return
		}

		const lastTotal = this.#lastTotal

		delete apiCall.status
		this.#playlists = apiCall
		this.#lastTotal = this.#playlists.total
		return lastTotal !== this.#lastTotal
	}

	async #refreshPage(context: string) {
		const nameMarquee = this.getMarquee(context, 'name')

		if (nameMarquee)
			this.pauseMarquee(context, 'name')

		this.setFeedback(context, {
			name: {
				value: '??????'
			}
		})

		this.setIcon(context, 'images/icons/pending.png')
		this.#refreshCount(context)

		const refreshPlaylists = await this.#refreshPlaylists(context)

		if (refreshPlaylists) {
			await this.#refreshLayout(true, context)
			return false
		}

		return true
	}

	async #refreshLayout(refreshPlaylists = false, context: string) {
		const nameMarquee = this.getMarquee(context, 'name')

		if (refreshPlaylists) {
			this.resetFeedbackLayout(context)

			this.setFeedback(context, {
				name: {
					opacity: 1.0
				},

				icon: {
					opacity: 1.0
				},

				count: {
					opacity: 1.0
				}
			})

			this.setIcon(context, 'images/icons/pending.png')

			this.#playlistsPage = {}
			this.#currentPlaylist = {}
			this.#playlists = {}
			await this.#refreshPlaylists(context)

			if (this.#playlists.total === 0) {
				this.setIcon(context, this.originalIcon)
				return
			}
		} else if (this.#playlists.items[this.#currentPlaylist[context]] && (!images.isPlaylistCached(this.#playlists.items[this.#currentPlaylist[context]])))
			this.setIcon(context, 'images/icons/pending.png')

		if (this.#currentPlaylist[context] === undefined)
			this.#currentPlaylist[context] = 0

		this.setFeedback(context, {
			name: {
				opacity: 1.0
			},

			icon: {
				opacity: 1.0
			}
		})

		this.#refreshCount(context)

		if (nameMarquee) {
			this.updateMarquee(context, 'name', this.#playlists.items[this.#currentPlaylist[context]].name, this.#playlists.items[this.#currentPlaylist[context]].name)
			this.resumeMarquee(context, 'name')
		} else
			this.marquee(context, 'name', this.#playlists.items[this.#currentPlaylist[context]].name, this.#playlists.items[this.#currentPlaylist[context]].name, 12, context)

		const image = await images.getForPlaylist(this.#playlists.items[this.#currentPlaylist[context]])

		if (image)
			this.setIcon(context, `data:image/jpeg;base64,${image}`)
		else
			this.setIcon(context, this.originalIcon)
	}

	async #refreshCount(context: string) {
		this.setFeedback(context, {
			count: {
				value: `${((this.#playlistsPage[context] - 1) * constants.WRAPPER_PLAYLISTS_PER_PAGE) + this.#currentPlaylist[context] + 1} / ${this.#playlists.total}`,
				opacity: 1.0
			}
		})
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Dial.TYPES.ROTATE_CLOCKWISE) {
			if (this.#playlists.total <= 1)
				return constants.WRAPPER_RESPONSE_SUCCESS

			this.pauseMarquee(context, 'name')
			this.#currentPlaylist[context]++

			if (this.#currentPlaylist[context] >= this.#playlists.items.length) {
				this.#currentPlaylist[context] = 0

				const lastPage = this.#playlistsPage[context]

				if (this.#playlistsPage[context] < Math.ceil(this.#playlists.total / constants.WRAPPER_PLAYLISTS_PER_PAGE))
					this.#playlistsPage[context]++
				else
					this.#playlistsPage[context] = 1

				if (lastPage !== this.#playlistsPage[context])
					if (!(await this.#refreshPage(context)))
						return constants.WRAPPER_RESPONSE_API_ERROR
			}

			this.#refreshCount(context)
			this.#refreshLayout(false, context)
		} else if (type === Dial.TYPES.ROTATE_COUNTERCLOCKWISE) {
			if (this.#playlists.total <= 1)
				return constants.WRAPPER_RESPONSE_SUCCESS

			this.pauseMarquee(context, 'name')
			this.#currentPlaylist[context]--

			if (this.#currentPlaylist[context] < 0) {
				const lastPage = this.#playlistsPage[context]

				if (this.#playlistsPage[context] > 1) {
					this.#playlistsPage[context]--
					this.#currentPlaylist[context] = constants.WRAPPER_PLAYLISTS_PER_PAGE - 1
				} else {
					this.#playlistsPage[context] = Math.ceil(this.#playlists.total / constants.WRAPPER_PLAYLISTS_PER_PAGE)
					this.#currentPlaylist[context] = this.#playlists.total - ((this.#playlistsPage[context] - 1) * constants.WRAPPER_PLAYLISTS_PER_PAGE) - 1
				}

				if (lastPage !== this.#playlistsPage[context])
					if (!(await this.#refreshPage(context)))
						return constants.WRAPPER_RESPONSE_API_ERROR
			}

			this.#refreshCount(context)
			this.#refreshLayout(false, context)
		} else if (type === Dial.TYPES.TAP) {
			await this.#refreshLayout(true, context)
			return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
		} else if (type === Dial.TYPES.DOWN)
			return constants.WRAPPER_RESPONSE_SUCCESS
		else if (type === Dial.TYPES.UP) {
			if (this.#playlists.total === 0)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			if (this.#currentPlaylist[context] !== undefined)
				if (this.#playlists.items[this.#currentPlaylist[context]]) {
					const apiCall = await wrapper.playPlaylist(this.#playlists.items[this.#currentPlaylist[context]].id)

					if (apiCall !== constants.WRAPPER_RESPONSE_SUCCESS && apiCall !== constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)
						await this.#refreshLayout(true, context)
					else
						return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
				} else
					await this.#refreshLayout(true, context)

				return constants.WRAPPER_RESPONSE_API_ERROR
		} else
			return constants.WRAPPER_RESPONSE_API_ERROR
	}

	async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
		super.onWillAppear(ev)
	}

	updateFeedback(context: string): void {
		super.updateFeedback(context)
		this.#refreshLayout(true, context)
	}
}
