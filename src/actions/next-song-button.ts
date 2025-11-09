import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import wrapper from './../library/wrapper.js'
import constants from './../library/constants.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.next-song-button' })
export default class NextSongButton extends Button {
	static readonly HOLDABLE = true

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED) {
			await this.setImage(context)
			return
		}

		if (type === Button.TYPES.SINGLE_PRESS)
			return wrapper.nextSong()
		else if (type === Button.TYPES.HOLDING) {
			await this.setImage(context, 'images/states/forward-seek')
			return wrapper.forwardSeek(this.settings[context].step)
		}
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].step)
			await this.setSettings(context, {
				step: constants.DEFAULT_SEEK_STEP_SIZE
			})
	}
}
