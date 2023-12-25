import { action } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-mute-unmute-button' })
export default class VolumeMuteUnmuteButton extends Button {
	async onButtonKeyDown() {
		return wrapper.resumePlayback()
	}
}
