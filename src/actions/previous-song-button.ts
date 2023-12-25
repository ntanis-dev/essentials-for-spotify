import { action } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.previous-song-button' })
export default class PreviousSongButton extends Button {
	async onButtonKeyDown() {
		return wrapper.resumePlayback()
	}
}
