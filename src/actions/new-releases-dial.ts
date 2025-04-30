import {
	action
} from '@elgato/streamdeck'

import ItemsDial from './items-dial.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.new-releases-dial' })
export default class NewReleasesDial extends ItemsDial {
	constructor() {
		super('items-layout.json', 'images/icons/items.png')
	}

	async fetchItems(page: number) {
		return await wrapper.getNewReleases(page)
	}
}
