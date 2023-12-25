import { action } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: "com.ntanis.spotify-essentials.play-button" })
export class PlayButton extends Button {
	async onKeyAction() {
		return wrapper.resumePlayback()
	}
}
