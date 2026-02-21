import {
	action
} from '@elgato/streamdeck'

import ItemsDial from './items-dial.js'
import {
	Dial
} from './dial.js'

import constants from './../library/constants.js'
import wrapper from './../library/wrapper.js'

const PLAYLIST_URL_REGEX = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?playlist\/([A-Za-z0-9]{22})(?:\/)?(?:\?.*)?$/i
const LIKED_SONGS_URL_REGEX = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?collection\/tracks(?:\/)?(?:\?.*)?$/i

@action({ UUID: 'com.ntanis.essentials-for-spotify.my-playlists-dial' })
export default class MyPlaylistsDial extends ItemsDial {
	#extraEntries: Record<string, any[]> = {}
	#resolvedExtras: Record<string, any[]> = {}
	#lastSpotifyTotal: number = 0

	constructor() {
		super('layouts/items-layout.json', 'images/icons/playlists.png')
	}

	#buildExtras(context: string, entries: any[]) {
		this.#resolvedExtras[context] = entries.filter(entry => entry.name && entry.url).map(entry => {
			const playlistMatch = entry.url.match(PLAYLIST_URL_REGEX)

			if (playlistMatch)
				return {
					id: playlistMatch[1],
					type: 'playlist',
					name: entry.name,
					images: []
				}
			else if (wrapper.user?.id && LIKED_SONGS_URL_REGEX.test(entry.url))
				return {
					id: `${wrapper.user.id}:collection`,
					type: 'user',
					name: entry.name,

					images: [{
						width: 64,
						height: 64,
						url: 'https://misc.scdn.co/liked-songs/liked-songs-64.jpg'
					}]
				}

			return null
		}).filter(v => !!v)
	}

	#refreshResolvedExtras(context: string) {
		this.#buildExtras(context, this.#extraEntries[context] || [])
		wrapper.setKnownPlaylists(Object.values(this.#resolvedExtras).flat().filter(entry => entry.type === 'playlist'))
	}

	async onSettingsUpdated(context: string, _oldSettings: any) {
		this.#extraEntries[context] = this.settings[context].extra_playlists || []

		const previousResolved = JSON.stringify(this.#resolvedExtras[context])

		this.#refreshResolvedExtras(context)

		if (previousResolved !== JSON.stringify(this.#resolvedExtras[context]))
			await this.invokeWrapperAction(context, Dial.TYPES.LONG_TAP)
	}

	async fetchItems(page: number, context: string) {
		this.#refreshResolvedExtras(context)

		const extras = this.#resolvedExtras[context] || []
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
