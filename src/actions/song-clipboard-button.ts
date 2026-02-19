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
import constants from '../library/constants.js'
import logger from './../library/logger.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.song-clipboard-button' })
export default class SongClipboardButton extends Button {
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

			process.stdin.end(text.replace(/[\x00-\x1F\x7F-\x9F]/g, ''))
		} catch (e: any) {
			logger.error(`An error occurred while copying to clipboard: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
			return constants.WRAPPER_RESPONSE_FATAL_ERROR
		}

		return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
	}

	#getElements(context: string) {
		const settings = this.settings[context]

		if (settings.elements && Array.isArray(settings.elements))
			return settings.elements

		return [
			{
				key: 'title',
				enabled: true
			},

			{
				key: 'artists',
				enabled: true
			},

			{
				key: 'link',
				enabled: true
			}
		]
	}

	async onSettingsUpdated(context: string, oldSettings: any) {
		if (this.settings[context].separator === undefined)
			await this.setSettings(context, {
				separator: ' - '
			})
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (!wrapper.song)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		const elements = this.#getElements(context)
		const separator = this.settings[context].separator ?? ' - '
		const segments: string[] = []
		let currentParts: string[] = []

		for (const element of elements) {
			if (!element.enabled)
				continue

			if (element.key === 'title')
				currentParts.push(wrapper.song.item.name)
			else if (element.key === 'artists')
				currentParts.push(wrapper.song.item.artists.map((a: any) => a.name).join(', '))
			else if (element.key === 'link') {
				if (currentParts.length > 0) {
					segments.push(currentParts.join(separator))
					currentParts = []
				}

				segments.push(wrapper.song.item.external_urls.spotify)
			}
		}

		if (currentParts.length > 0)
			segments.push(currentParts.join(separator))

		if (segments.length === 0)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		return this.#copyToClipboard(segments.join('\n'))
	}
}
