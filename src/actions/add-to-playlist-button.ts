import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import images from '../library/images.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.add-to-playlist-button' })
export default class AddToPlaylistButton extends Button {
	static readonly STATABLE = true

	#cachedPlaylist: {
		[context: string]: any
	} = {}

	constructor() {
		super()
		this.setStatelessImage('images/states/add-to-playlist-unknown')
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
	}

	async #onSongChanged(song: any, pending: boolean = false) {
		const promises = []

		for (const context of this.contexts)
			promises.push(new Promise(async resolve => {
				if (!song || pending) {
					this.clearMarquee(context)
					await this.setTitle(context, '')
					await this.#updateImage(context)
					this.setUnpressable(context, true)
				} else {
					this.setUnpressable(context, false)
					await this.#updateDisplay(context)
				}

				resolve(true)
			}))

		await Promise.allSettled(promises)
	}

	#processImagePlus(iconDataUrl: string): string {
		const iconSize = 120
		const badgeSize = 36
		const badgeX = iconSize - badgeSize - 6
		const badgeY = iconSize - badgeSize - 6

		const svg = `
			<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}" xmlns="http://www.w3.org/2000/svg">
			
				<defs>
					<pattern id="iconPattern" patternUnits="userSpaceOnUse" width="${iconSize}" height="${iconSize}">
						<image href="${iconDataUrl}" x="0" y="0" width="${iconSize}" height="${iconSize}"/>
					</pattern>
				</defs>
				
				<rect width="${iconSize}" height="${iconSize}" fill="url(#iconPattern)"/>
				<circle cx="${badgeX + badgeSize / 2}" cy="${badgeY + badgeSize / 2}" r="${badgeSize / 2}" fill="#1db954" stroke="#191414" stroke-width="2"/>
				<line x1="${badgeX + badgeSize / 2}" y1="${badgeY + 9}" x2="${badgeX + badgeSize / 2}" y2="${badgeY + badgeSize - 9}" stroke="#191414" stroke-width="3" stroke-linecap="round"/>
				<line x1="${badgeX + 9}" y1="${badgeY + badgeSize / 2}" x2="${badgeX + badgeSize - 9}" y2="${badgeY + badgeSize / 2}" stroke="#191414" stroke-width="3" stroke-linecap="round"/>
				
			</svg>
		`

		return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
	}

	async #updateImage(context: string) {
		if (!this.#cachedPlaylist[context]) {
			await this.setImage(context, 'images/states/add-to-playlist-unknown')
			return
		}

		if (!images.isItemCached(this.#cachedPlaylist[context]))
			await this.setImage(context, 'images/states/pending')

		const image = await images.getForItem(this.#cachedPlaylist[context])

		if (image)
			await this.setImage(context, this.#processImagePlus(`data:image/jpeg;base64,${image}`))
		else
			await this.setImage(context, 'images/states/add-to-playlist')
	}

	async #updateDisplay(context: string) {
		const show = this.settings[context].show || ['title']
		const data: any = []

		let needsRestart = !this.marquees[context]

		if (show.includes('title') && this.#cachedPlaylist[context]?.title)
			data.push({
				key: 'title',
				value: this.#cachedPlaylist[context].title
			})

		if (data.length === 0) {
			this.clearMarquee(context)
			await this.setTitle(context, '')
		} else if (needsRestart || (!this.marquees[context]))
			await this.marqueeTitle('add-to-playlist', data, context)

		await this.#updateImage(context)
	}

	async #resolvePlaylist(context: string) {
		const spotify_url = this.settings[context].spotify_url
		const badUrl = !/^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?playlist\/[A-Za-z0-9]{22}(?:\/)?(?:\?.*)?$/.test(spotify_url)

		if ((!spotify_url) || badUrl) {
			this.#cachedPlaylist[context] = null
			return
		}

		if (this.#cachedPlaylist[context]?.url === spotify_url)
			return

		this.#cachedPlaylist[context] = await wrapper.getInformationOnUrl(spotify_url)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (!this.#cachedPlaylist[context]?.id)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		const currentTrack = await wrapper.getCurrentTrack()

		if (!currentTrack?.uri) {
			if (!wrapper.song?.item?.id)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			const response = await wrapper.addSongToPlaylist(this.#cachedPlaylist[context].id, wrapper.song.item.uri)

			if (response === constants.WRAPPER_RESPONSE_SUCCESS)
				return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
			else
				return response
		}

		const response = await wrapper.addSongToPlaylist(this.#cachedPlaylist[context].id, currentTrack.uri)

		if (response === constants.WRAPPER_RESPONSE_SUCCESS)
			return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
		else
			return response
	}

	async onSettingsUpdated(context: string, oldSettings: any) {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].show)
			await this.setSettings(context, {
				show: ['title']
			})

		const urlChanged = oldSettings.spotify_url !== this.settings[context].spotify_url
		const showChanged = oldSettings.show?.length !== this.settings[context].show?.length || (oldSettings.show && this.settings[context].show && (!oldSettings.show.every((value: any, index: number) => value === this.settings[context].show[index])))

		if (urlChanged) {
			this.clearMarquee(context)
			await this.#resolvePlaylist(context)
		}

		if (urlChanged || showChanged) {
			if (showChanged)
				this.clearMarquee(context)

			await this.#updateDisplay(context)
		}
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context, true)
		await this.#resolvePlaylist(context)

		if (wrapper.song) {
			this.setUnpressable(context, false)
			await this.#updateDisplay(context)
		} else
			await this.#onSongChanged(null, false)
	}

	async onStateLoss(context: string) {
		await super.onStateLoss(context)
		this.clearMarquee(context)
		await this.setTitle(context, '')
	}
}
