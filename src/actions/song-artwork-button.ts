import os from 'os'

import {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import {
	spawn
} from 'child_process'

import constants from '../library/constants.js'
import connector from '../library/connector.js'
import images from '../library/images.js'
import wrapper from '../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.song-artwork-button' })
export default class SongArtworkButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/song-artwork-unknown')
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
	}

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setUnpressable(context, true)

				if (song) {
					if (!images.isSongCached(song))
						this.setImage(context, 'images/states/pending')

					const image = await images.getForSong(song)

					if (image)
						this.setImage(context, `data:image/jpeg;base64,${image}`)
					else
						this.setImage(context)
				} else if (pending)
					this.setImage(context, 'images/states/pending')
				else
					this.setImage(context, 'images/states/song-artwork-unknown')

				if (!pending)
					this.setUnpressable(context, false)
			})
	}

	async invokeWrapperAction(context: string) {
		if (wrapper.song) {
			switch (os.platform()) {
				case 'darwin':
					spawn('open', [wrapper.song.item.uri])
					break

				case 'win32':
					spawn('cmd', ['/c', 'start', '', wrapper.song.item.uri])
					break

				case 'linux':
					spawn('xdg-open', [wrapper.song.item.uri])
					break

				default:
					return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
			}

			return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
		}

		return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	onStateSettled(context: string) {
		super.onStateSettled(context, true)
		this.#onSongChanged(wrapper.song, false, [context])
	}
}
