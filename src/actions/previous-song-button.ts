import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.previous-song-button' })
export default class PreviousSongButton extends Button {
	async invokeWrapperAction(context: string) {
		return wrapper.previousSong()
	}
}
