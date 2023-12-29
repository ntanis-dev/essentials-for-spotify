import {
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

@action({ UUID: 'com.ntanis.spotify-essentials.playlists-dial' })
export default class PlaylistsDial extends Dial {
	constructor() {
		super('playlists-layout.json', 'images/icons/playlists.png')
	}
}
