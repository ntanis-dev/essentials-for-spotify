import { action } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'
import { Button } from './button.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-down-button' })
export default class VolumeDownButton extends Button {
	async onButtonKeyDown() {
		return wrapper.setPlaybackVolume(wrapper.volumePercent - 5)
	}
}
