import { action } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: "com.ntanis.spotify-essentials.pause-button" })
export class PauseButton extends Button {
	async onKeyAction() {
		return wrapper.pausePlayback()
	}
}
