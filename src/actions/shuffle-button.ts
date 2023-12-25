import { action } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.shuffle-button' })
export default class ShuffleButton extends Button {
	async onButtonKeyDown() {
		return wrapper.resumePlayback()
	}
}
