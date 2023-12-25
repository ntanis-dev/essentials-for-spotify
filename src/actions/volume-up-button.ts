import { action } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-up-button' })
export default class VolumeUpButton extends Button {
	async onButtonKeyDown() {
		return wrapper.setPlaybackVolume(wrapper.volumePercent + 5)
	}
}
