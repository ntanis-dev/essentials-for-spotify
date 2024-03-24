import {
	action
} from '@elgato/streamdeck'

import {
	PlaylistsDial
} from './playlists-dial.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.my-playlists-dial' })
export default class MyPlaylistsDial extends PlaylistsDial {
	constructor() {
		super('playlists-layout.json', 'images/icons/playlists.png')
	}

	async fetchPlaylists(page: number) {
		return await wrapper.getPlaylists(page)
	}
}
