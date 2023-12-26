import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.next-song-button' })
export default class NextSongButton extends Button {
	async invokeWrapperAction() {
		return wrapper.nextSong()
	}
}
