import StreamDeck, {
	action,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import {
	spawn
} from 'child_process'

import os from 'os'
import constants from '../library/constants.js'
import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.song-clipboard-button' })
export default class SongClipboardButton extends Button {
	constructor() {
		super()
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
	}

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setBusy(context, true)

				await StreamDeck.client.setImage(context, pending ? 'images/states/pending' : undefined).catch(e => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

				if (!pending)
					this.setBusy(context, false)
			})
	}

	#copyToClipboard(text: string) {
		let process = null

		try {
			switch (os.platform()) {
				case 'darwin':
					process = spawn('pbcopy')
					break

				case 'win32':
					process = spawn('clip')
					break

				case 'linux':
					process = spawn('xclip', ['-selection', 'c'])
					break

				default:
					return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
			}

			process.stdin.end(text)
		} catch (e: any) {
			logger.error(`An error occurred while copying to clipboard: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
			return constants.WRAPPER_RESPONSE_FATAL_ERROR
		}

		return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
	}

	async invokeWrapperAction() {
		if (wrapper.song)
			return this.#copyToClipboard(`${wrapper.song.item.name} - ${wrapper.song.item.artists.map((artist: any) => artist.name).join(', ')}\n${wrapper.song.item.external_urls.spotify}`)

		return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)
		this.#onSongChanged(wrapper.song, false, [ev.action.id])
	}
}
