import { action } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.loop-context-button' })
export default class LoopContextButton extends Button {
	async onButtonKeyDown() {
		return wrapper.resumePlayback()
	}
}
