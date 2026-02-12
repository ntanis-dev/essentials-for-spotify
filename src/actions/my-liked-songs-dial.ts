import {
	action
} from '@elgato/streamdeck'

import ItemsDial from './items-dial.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.my-liked-songs-dial' })
export default class MyLikedSongs extends ItemsDial {
	constructor() {
		super('layouts/items-layout.json', 'images/icons/items.png')
	}

	async fetchItems(page: number) {
		return await wrapper.getUserLikedSongs(page)
	}
}
