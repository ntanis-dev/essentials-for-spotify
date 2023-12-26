import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import {
	spawn
} from 'child_process'

import os from 'os'
import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.song-clipboard-button' })
export default class SongClipboardButton extends Button {
		copyToClipboard(text: string) {
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
						return false
				}

				process.stdin.end(text)
			} catch (e: any) {
				logger.error(`An error occurred while copying to clipboard: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
				return false
			}

			return true
	}

	async invokeWrapperAction() {
		if (wrapper.song)
			return this.copyToClipboard(`${wrapper.song.item.name} - ${wrapper.song.item.artists.map((artist: any) => artist.name).join(', ')}\n${wrapper.song.item.external_urls.spotify}`)

		return false
	}
}
