import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.next-song-button' })
export default class NextSongButton extends Button {
	async invokeWrapperAction(context: string) {
		return wrapper.nextSong()
	}
}
