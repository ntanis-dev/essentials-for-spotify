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

	async playSelectedItem(item: any) {
		return wrapper.playItem({
			type: 'user',
			id: `${wrapper.user?.id}:collection`
		}, {
			uri: `spotify:track:${item.id}`
		})
	}

	async fetchItems(page: number, _context: string) {
		return await wrapper.getUserLikedSongs(page)
	}
}
