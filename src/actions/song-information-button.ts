import os from 'os'

import {
	action,
	WillAppearEvent,
	WillDisappearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import {
	spawn
} from 'child_process'

import constants from '../library/constants.js'
import images from '../library/images.js'
import wrapper from '../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.song-information-button' })
export default class SongInformationButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		this.setStatelessImage('images/states/song-information-unknown')
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
		wrapper.on('songTimeChanged', this.#onSongTimeChanged.bind(this))
	}

	#onSongTimeChanged(progress: number, duration: number, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			if (this.marquees[context])
				this.updateMarqueeEntry(context, 'time', this.beautifyTime(progress, duration))
	}

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setUnpressable(context, true)

				if ((song && this.marquees[context] && this.marquees[context].id !== song.item.id) || ((!song) && this.marquees[context])) {
					this.clearMarquee(context)
					this.setTitle(context, '')
				}

				if (song) {
					if (!images.isSongCached(song))
						this.setImage(context, 'images/states/pending')

					const image = await images.getForSong(song)

					if ((!this.marquees[context]) || this.marquees[context].id !== song.item.id)
						this.marqueeTitle(song.item.id, [
							{
								key: 'title',
								value: song.item.name
							},

							{
								key: 'artists',
								value: song.item.artists.map((artist: any) => artist.name).join(', ')
							},

							{
								key: 'time',
								value: this.beautifyTime(song.progress, song.item.duration_ms)
							}
						], context)
					else
						this.resumeMarquee(context)

					if (image)
						this.setImage(context, `data:image/jpeg;base64,${image}`)
					else if (song.item.uri.includes('local:'))
						this.setImage(context, 'images/states/local')
					else
						this.setImage(context)
				} else if (pending)
					this.setImage(context, 'images/states/pending')
				else
					this.setImage(context, 'images/states/song-information-unknown')

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

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id)
	}

	onStateSettled(context: string) {
		super.onStateSettled(context, true)
		this.#onSongChanged(wrapper.song, false, [context])
		this.#onSongTimeChanged(wrapper.song?.progress, wrapper.song?.item.duration_ms, wrapper.pendingSongChange, [context])
	}

	onStateLoss(context: string) {
		super.onStateLoss(context)
		this.clearMarquee(context)
		this.setTitle(context, '')
	}
}
