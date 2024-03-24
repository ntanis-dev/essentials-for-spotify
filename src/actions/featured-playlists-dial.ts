import {
	action
} from '@elgato/streamdeck'

import {
	PlaylistsDial
} from './playlists-dial.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.featured-playlists-dial' })
export default class FeaturedPlaylistsDial extends PlaylistsDial {
	constructor() {
		super('playlists-layout.json', 'images/icons/playlists.png')
	}

	async fetchPlaylists(page: number) {
		return await wrapper.getFeaturedPlaylists(page)
	}
}
