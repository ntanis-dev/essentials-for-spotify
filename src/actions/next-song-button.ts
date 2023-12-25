import { action } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.next-song-button' })
export default class NextSongButton extends Button {
	async onButtonKeyDown() {
		return wrapper.resumePlayback()
	}
}
