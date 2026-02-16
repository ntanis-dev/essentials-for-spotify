import {
	action
} from '@elgato/streamdeck'

import ItemsDial from './items-dial.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.my-playlists-dial' })
export default class MyPlaylistsDial extends ItemsDial {
	constructor() {
		super('layouts/items-layout.json', 'images/icons/playlists.png')
	}

	async fetchItems(page: number) {
		return await wrapper.getUserPlaylists(page)
	}
}
