import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.previous-song-button' })
export default class PreviousSongButton extends Button {
	static readonly HOLDABLE = true

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED) {
			await this.setImage(context)
			return
		}

		if (type === Button.TYPES.SINGLE_PRESS)
			return wrapper.previousSong()
		else if (type === Button.TYPES.HOLDING) {
			await this.setImage(context, 'images/states/backward-seek')
			return wrapper.backwardSeek()
		}
	}
}
