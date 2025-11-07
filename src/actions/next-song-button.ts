import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.next-song-button' })
export default class NextSongButton extends Button {
	static readonly HOLDABLE = true

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.SINGLE_PRESS)
			return wrapper.nextSong()
		else if (type === Button.TYPES.HOLDING)
			return wrapper.forwardSeek()
	}
}
