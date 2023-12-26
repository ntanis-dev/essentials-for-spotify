import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-down-button' })
export default class VolumeDownButton extends Button {
	async invokeWrapperAction() {
		return wrapper.setPlaybackVolume(wrapper.volumePercent - 5)
	}
}
