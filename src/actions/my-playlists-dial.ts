import {
	action
} from '@elgato/streamdeck'
import {
	fetch
} from 'undici'

import ItemsDial from './items-dial.js'

import wrapper from './../library/wrapper.js'

type CustomPlaylistItem = {
	id: string
	type: 'playlist'
	name: string
	images: Array<{ url: string }>
}

@action({ UUID: 'com.ntanis.essentials-for-spotify.my-playlists-dial' })
export default class MyPlaylistsDial extends ItemsDial {
	static readonly PLAYLIST_URL_REGEX = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?playlist\/([A-Za-z0-9]{22})(?:\/)?(?:\?.*)?$/i

	#customItemsCache: {
		[context: string]: Array<CustomPlaylistItem>
	} = {}

	#customItemsCacheKey: {
		[context: string]: string
	} = {}

	constructor() {
		super('layouts/items-layout.json', 'images/icons/playlists.png')
	}

	#getCustomPlaylistUrls(context: string): Array<string> {
		const rawUrls = (this.settings[context]?.spotify_urls || '').toString()

		if (!rawUrls.trim())
			return []

		const uniqueUrls = new Set<string>()

		for (const entry of rawUrls.split(/\r?\n/)) {
			const normalized = entry.trim()

			if (!normalized)
				continue

			if (!MyPlaylistsDial.PLAYLIST_URL_REGEX.test(normalized))
				continue

			uniqueUrls.add(normalized)
		}

		return Array.from(uniqueUrls)
	}

	#extractPlaylistId(url: string): string | null {
		const match = url.match(MyPlaylistsDial.PLAYLIST_URL_REGEX)
		return match ? match[1] : null
	}

	async #resolveCustomPlaylist(url: string): Promise<CustomPlaylistItem | null> {
		const id = this.#extractPlaylistId(url)

		if (!id)
			return null

		// Public oEmbed metadata works even when Web API access is limited for Spotify-owned playlists.
		try {
			const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)

			if (response.ok) {
				const data: any = await response.json()

				return {
					id,
					type: 'playlist',
					name: data?.title || `Playlist ${id.slice(0, 6)}`,
					images: data?.thumbnail_url ? [{
						url: data.thumbnail_url
					}] : []
				}
			}
		} catch { }

		const detail = await wrapper.getInformationOnUrl(url)

		if (detail?.type === 'playlist')
			return {
				id,
				type: 'playlist',
				name: (detail.title && !detail.title.startsWith('Unknown')) ? detail.title : `Playlist ${id.slice(0, 6)}`,
				images: detail.images || []
			}

		return {
			id,
			type: 'playlist',
			name: `Playlist ${id.slice(0, 6)}`,
			images: []
		}
	}

	async #getCustomPlaylistItems(context: string): Promise<Array<CustomPlaylistItem>> {
		const urls = this.#getCustomPlaylistUrls(context)
		const cacheKey = urls.join('\n')

		if (this.#customItemsCacheKey[context] === cacheKey)
			return this.#customItemsCache[context] || []

		const details = await Promise.all(urls.map(url => this.#resolveCustomPlaylist(url)))
		const items: Array<CustomPlaylistItem> = []
		const seen = new Set<string>()

		for (const detail of details) {
			if (!detail || detail.type !== 'playlist' || !detail.id || seen.has(detail.id))
				continue

			seen.add(detail.id)

			items.push({
				id: detail.id,
				type: 'playlist',
				name: detail.name || 'Unknown Playlist',
				images: detail.images || []
			})
		}

		this.#customItemsCacheKey[context] = cacheKey
		this.#customItemsCache[context] = items

		return items
	}

	async fetchItems(page: number, context: string) {
		const customItems = await this.#getCustomPlaylistItems(context)
		return await wrapper.getPlaylists(page, customItems)
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (typeof this.settings[context].spotify_urls !== 'string')
			await this.setSettings(context, {
				spotify_urls: ''
			})

		if ((oldSettings?.spotify_urls || '') !== (this.settings[context].spotify_urls || '')) {
			delete this.#customItemsCacheKey[context]
			delete this.#customItemsCache[context]
		}
	}
}
