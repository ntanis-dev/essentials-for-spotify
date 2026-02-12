import StreamDeck, {
	action,
	SendToPluginEvent,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'
import connector from '../library/connector.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.add-to-playlist-button' })
export default class AddToPlaylistButton extends Button {
	static readonly STATABLE = true

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
					await this.setImage(context, 'images/states/add-to-playlist-unknown')
					this.setUnpressable(context, true)
				} else {
					await this.setImage(context, 'images/states/add-to-playlist')
					this.setUnpressable(context, false)
					await this.#updateDisplay(context, song)
				}

				resolve(true)
			}))

		await Promise.allSettled(promises)
	}

	async #updateDisplay(context: string, song: any = wrapper.song) {
		const show = this.settings[context].show || ['playlist']
		const data: any = []

		let needsRestart = !this.marquees[context]

		for (const item of show)
			if (item === 'playlist' && this.settings[context].playlist_name)
				data.push({
					key: 'playlist',
					value: this.settings[context].playlist_name
				})
			else if (item === 'name' && song?.item?.name) {
				data.push({
					key: 'name',
					value: song.item.name
				})

				if (this.marquees[context]?.entries?.name && this.marquees[context].entries.name.original !== song.item.name)
					this.updateMarqueeEntry(context, 'name', song.item.name)
			}

		if (data.length === 0) {
			this.clearMarquee(context)
			await this.setTitle(context, '')
		} else if (needsRestart || (!this.marquees[context]))
			await this.marqueeTitle('add-to-playlist', data, context)
	}

	async #updatePlaylists(contexts = this.contexts) {
		const items: any = []

		if (connector.set)
			try {
				let page = 1

				while (true) {
					const playlistsResponse = await wrapper.getUserPlaylists(page)

					if (playlistsResponse && playlistsResponse.status === constants.WRAPPER_RESPONSE_SUCCESS) {
						for (const playlist of playlistsResponse.items)
							if (playlist) {
								const canAddTracks = playlist.type === 'collection' || playlist.owner?.id === wrapper.user?.id || playlist.collaborative === true

								if (canAddTracks)
									items.push({
										value: playlist.id,
										label: playlist.name
									})
							}

						if ((page * constants.WRAPPER_ITEMS_PER_PAGE) >= playlistsResponse.total)
							break

						page++
					} else
						break
				}
			} catch (e) { }

		for (const context of contexts) {
			await StreamDeck.client.sendToPropertyInspector(context, {
				event: 'getPlaylists',
				items
			}).catch(() => {})

			if (connector.set && this.settings[context].playlist_id && items.length > 0) {
				const playlist = items.find((p: any) => p?.value === this.settings[context].playlist_id)

				if (playlist) {
					const oldPlaylistName = this.settings[context].playlist_name

					await this.setSettings(context, {
						playlist_name: playlist.label
					})

					if (oldPlaylistName !== playlist.label)
						this.updateMarqueeEntry(context, 'playlist', playlist.label)
				}
			}
		}
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (!this.settings[context].playlist_id)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		const currentTrack = await wrapper.getCurrentTrack()

		if (!currentTrack?.uri) {
			if (!wrapper.song?.item?.id)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			const response = await wrapper.addSongToPlaylist(this.settings[context].playlist_id, wrapper.song.item.uri)

			if (response === constants.WRAPPER_RESPONSE_SUCCESS)
				return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
			else
				return response
		}

		const response = await wrapper.addSongToPlaylist(this.settings[context].playlist_id, currentTrack.uri)

		if (response === constants.WRAPPER_RESPONSE_SUCCESS)
			return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
		else
			return response
	}

	async onSendToPlugin(ev: SendToPluginEvent<any, any>): Promise<void> {
		if (ev.payload?.event === 'getPlaylists')
			await this.#updatePlaylists([ev.action.id])
	}

	async onSettingsUpdated(context: string, oldSettings: any) {
		await super.onSettingsUpdated(context, oldSettings)

		if (!this.settings[context].show)
			await this.setSettings(context, {
				show: ['playlist']
			})

		if (oldSettings.playlist_id !== this.settings[context].playlist_id)
			await this.#updatePlaylists([context])

		const showChanged = oldSettings.show?.length !== this.settings[context].show?.length || (oldSettings.show && this.settings[context].show && (!oldSettings.show.every((value: any, index: number) => value === this.settings[context].show[index])))

		if (showChanged) {
			this.clearMarquee(context)

			if (wrapper.song)
				await this.#updateDisplay(context, wrapper.song)
			else
				await this.#updateDisplay(context, null)
		} else if (oldSettings.playlist_id !== this.settings[context].playlist_id)
			if (wrapper.song)
				await this.#onSongChanged(wrapper.song, false)
			else
				await this.#onSongChanged(null, false)
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context, true)
		await this.#updatePlaylists([context])

		if (wrapper.song) {
			await this.setImage(context, 'images/states/add-to-playlist')
			this.setUnpressable(context, false)
			await this.#updateDisplay(context, wrapper.song)
		} else
			await this.#onSongChanged(null, false)
	}

	async onStateLoss(context: string) {
		await super.onStateLoss(context)
		this.clearMarquee(context)
		await this.setTitle(context, '')
	}
}
