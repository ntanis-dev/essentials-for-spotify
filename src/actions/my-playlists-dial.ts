import {
	action
} from '@elgato/streamdeck'

import ItemsDial from './items-dial.js'
import {
	Dial
} from './dial.js'

import constants from './../library/constants.js'
import wrapper from './../library/wrapper.js'

const URL_REGEX = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?playlist\/([A-Za-z0-9]{22})(?:\/)?(?:\?.*)?$/i

@action({ UUID: 'com.ntanis.essentials-for-spotify.my-playlists-dial' })
export default class MyPlaylistsDial extends ItemsDial {
	#resolvedExtras: any[] = []
	#lastSpotifyTotal: number = 0

	constructor() {
		super('layouts/items-layout.json', 'images/icons/playlists.png')
	}

	#buildExtras(entries: any[]) {
		this.#resolvedExtras = entries.filter(entry => entry.name && entry.url && URL_REGEX.test(entry.url)).map(entry => {
			const match = entry.url.match(URL_REGEX)

			return {
				id: match[1],
				type: 'playlist',
				name: entry.name,
				images: []
			}
		})
	}

	async onSettingsUpdated(context: string, _oldSettings: any) {
		const newExtras = this.settings[context].extra_playlists || []
		const previousResolved = this.#resolvedExtras

		this.#buildExtras(newExtras)

		wrapper.setKnownPlaylists(this.#resolvedExtras)

		if (JSON.stringify(previousResolved) !== JSON.stringify(this.#resolvedExtras))
			await this.invokeWrapperAction(context, Dial.TYPES.LONG_TAP)
	}

	async fetchItems(page: number) {
		const extras = this.#resolvedExtras
		const pageStart = (page - 1) * constants.WRAPPER_ITEMS_PER_PAGE

		if (extras.length > 0 && this.#lastSpotifyTotal > 0 && pageStart >= this.#lastSpotifyTotal) {
			const extrasStart = pageStart - this.#lastSpotifyTotal

			return {
				status: constants.WRAPPER_RESPONSE_SUCCESS,
				items: extras.slice(extrasStart, extrasStart + constants.WRAPPER_ITEMS_PER_PAGE),
				total: this.#lastSpotifyTotal + extras.length
			}
		}

		const result = await wrapper.getUserPlaylists(page)

		if ((!result) || typeof result !== 'object' || (result.status !== constants.WRAPPER_RESPONSE_SUCCESS && result.status !== constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE))
			return result

		this.#lastSpotifyTotal = result.total

		if (extras.length === 0)
			return result

		const combinedTotal = result.total + extras.length
		const spotifyItemsOnPage = result.items.length
		const roomForExtras = constants.WRAPPER_ITEMS_PER_PAGE - spotifyItemsOnPage

		const items = [...result.items]

		if (roomForExtras > 0) {
			const extrasStart = Math.max(0, pageStart + spotifyItemsOnPage - result.total)
			items.push(...extras.slice(extrasStart, extrasStart + roomForExtras))
		}

		return {
			status: result.status,
			items,
			total: combinedTotal
		}
	}
}
