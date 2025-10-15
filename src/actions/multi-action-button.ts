import {
	action,
	KeyDownEvent,
	KeyUpEvent,
	WillAppearEvent,
	WillDisappearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import connector from '../library/connector.js'
import constants from '../library/constants.js'
import images from '../library/images.js'
import wrapper from '../library/wrapper.js'
import { Buffer } from 'buffer'

@action({ UUID: 'com.ntanis.essentials-for-spotify.multi-action-button' })
export default class MultiActionButton extends Button {
	static readonly STATABLE = true
	static readonly HOLDABLE = true

	#clickCounts: any = {}
	#clickTimers: any = {}
	#longPressTimers: any = {}
	#isLongPress: any = {}
	#busy: any = {}
	#keyPressed: any = {}
	
	private readonly CLICK_TIMEOUT = 400 // ms to wait for additional clicks
	private readonly LONG_PRESS_DELAY = 800 // ms for long press detection

	constructor() {
		super()
		this.setStatelessImage('images/states/song-information-unknown')
		wrapper.on('songChanged', this.#onSongChanged.bind(this))
		wrapper.on('playbackStateChanged', this.#onPlaybackStateChanged.bind(this))
		wrapper.on('songLikedStateChanged', this.#onLikedStateChanged.bind(this))
	}

	#onPlaybackStateChanged(state: boolean, contexts = this.contexts) {
		// Update visual state based on play/pause - could add overlay indicators
		for (const context of contexts) {
			// We keep the artwork as primary display, but could add small play/pause indicator
		}
	}

	#onLikedStateChanged(liked: boolean, pending: boolean = false, contexts = this.contexts) {
		// Update the display with heart indicator based on like status
		for (const context of contexts) {
			setImmediate(async () => {
				if (!pending && wrapper.song) {
					const songImage = await images.getForSong(wrapper.song)
					if (songImage) {
						const baseImageData = `data:image/jpeg;base64,${songImage}`
						if (liked) {
							const imageWithHeart = await this.#addHeartToIcon(baseImageData)
							this.setImage(context, imageWithHeart)
						} else {
							this.setImage(context, baseImageData)
						}
					}
				}
			})
		}
	}

	#onSongChanged(song: any, pending: boolean = false, contexts = this.contexts) {
		for (const context of contexts)
			setImmediate(async () => {
				this.setUnpressable(context, true)

				if (!song && pending)
					this.setImage(context, 'images/states/pending')
				else if (!song)
					this.setImage(context, 'images/states/song-information-unknown')
				else {
					if (!images.isSongCached(song))
						this.setImage(context, 'images/states/pending')

					const image = await images.getForSong(song)

					if (image) {
						const baseImageData = `data:image/jpeg;base64,${image}`
						if (song.liked) {
							const imageWithHeart = await this.#addHeartToIcon(baseImageData)
							this.setImage(context, imageWithHeart)
						} else {
							this.setImage(context, baseImageData)
						}
					} else {
						this.setImage(context)
					}
				}

				if (!pending)
					this.setUnpressable(context, false)
			})
	}

	async onKeyDown(ev: KeyDownEvent<any>) {
		const context = ev.action.id

		if (this.#busy[context]) {
			return
		}

		this.#keyPressed[context] = true

		if (!this.#clickCounts[context]) {
			this.#clickCounts[context] = 0
		}

		this.#clickCounts[context]++

		if (this.#clickTimers[context]) {
			clearTimeout(this.#clickTimers[context])
		}

		if (this.#clickCounts[context] === 1) {
			this.#longPressTimers[context] = setTimeout(() => {
				if (this.#keyPressed[context]) {
					this.#isLongPress[context] = true
					this.#handleLongPress(context)
					return
				}
			}, this.LONG_PRESS_DELAY)
		}

		this.#clickTimers[context] = setTimeout(() => {
			if (!this.#isLongPress[context] && !this.#keyPressed[context]) {
				this.#processClicks(context, this.#clickCounts[context])
				this.#resetClickTracking(context)
			}
		}, this.CLICK_TIMEOUT)
	}

	async onKeyUp(ev: KeyUpEvent<any>) {
		const context = ev.action.id
		
		this.#keyPressed[context] = false
		
		if (this.#longPressTimers[context] && !this.#isLongPress[context]) {
			clearTimeout(this.#longPressTimers[context])
			this.#longPressTimers[context] = null
		}
	}

	#resetClickTracking(context: string) {
		this.#clickCounts[context] = 0
		this.#isLongPress[context] = false
		this.#keyPressed[context] = false
		this.#busy[context] = false
		
		if (this.#clickTimers[context]) {
			clearTimeout(this.#clickTimers[context])
			this.#clickTimers[context] = null
		}
		if (this.#longPressTimers[context]) {
			clearTimeout(this.#longPressTimers[context])
			this.#longPressTimers[context] = null
		}
	}

	async #processClicks(context: string, clickCount: number) {
		this.#busy[context] = true

		if (!connector.set) {
			await this.#flashImage(context, 'images/states/setup-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			return
		}

		let response

		try {
			switch (clickCount) {
				case 1:
					response = await this.#handlePlayPause()
					break
				case 2:
					response = await this.#handleNextSong()
					break
				case 3:
				default:
					response = await this.#handlePreviousSong()
					break
			}

			await this.#handleResponse(context, response)
		} catch (error) {
			await this.#handleResponse(context, constants.WRAPPER_RESPONSE_FATAL_ERROR)
		}
	}

	async #handleLongPress(context: string) {
		this.#busy[context] = true

		if (!connector.set) {
			await this.#flashImage(context, 'images/states/setup-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			this.#resetClickTracking(context)
			return
		}

		try {
			const response = await this.#handleLikeUnlike()
			await this.#handleResponse(context, response)
		} catch (error) {
			await this.#handleResponse(context, constants.WRAPPER_RESPONSE_FATAL_ERROR)
		}
		
		this.#resetClickTracking(context)
	}

	async #handlePlayPause() {
		if (wrapper.playing)
			return wrapper.pausePlayback()
		else
			return wrapper.resumePlayback()
	}

	async #handleNextSong() {
		return wrapper.nextSong()
	}

	async #handlePreviousSong() {
		return wrapper.previousSong()
	}

	async #handleLikeUnlike() {
		if (!wrapper.song)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		else if (wrapper.song.liked)
			return wrapper.unlikeSong(Object.assign({}, wrapper.song))
		else
			return wrapper.likeSong(Object.assign({}, wrapper.song))
	}

	async #handleResponse(context: string, response: Symbol) {
		if (response === constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)
			await this.#flashImage(context, 'images/states/success', constants.SHORT_FLASH_DURATION, constants.SHORT_FLASH_TIMES)
		else if (response === constants.WRAPPER_RESPONSE_NOT_AVAILABLE)
			await this.#flashImage(context, 'images/states/not-available', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
		else if (response === constants.WRAPPER_RESPONSE_API_RATE_LIMITED)
			await this.#flashImage(context, 'images/states/api-rate-limited', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
		else if (response === constants.WRAPPER_RESPONSE_API_ERROR)
			await this.#flashImage(context, 'images/states/api-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
		else if (response === constants.WRAPPER_RESPONSE_FATAL_ERROR)
			await this.#flashImage(context, 'images/states/fatal-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
		else if (response === constants.WRAPPER_RESPONSE_NO_DEVICE_ERROR)
			await this.#flashImage(context, 'images/states/no-device-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
		else if (response === constants.WRAPPER_RESPONSE_BUSY)
			await this.#flashImage(context, 'images/states/busy', constants.SHORT_FLASH_DURATION, constants.SHORT_FLASH_TIMES)
	}

	async #flashImage(context: string, image: string, duration: number = 500, times: number = 1) {
		try {
			for (let i = 0; i < times; i++) {
				await this.setImage(context, image)
				await new Promise(resolve => setTimeout(resolve, duration))
				
				if (wrapper.song) {
					const songImage = await images.getForSong(wrapper.song)
					if (songImage) {
						const baseImageData = `data:image/jpeg;base64,${songImage}`
						if (wrapper.song.liked) {
							const imageWithHeart = await this.#addHeartToIcon(baseImageData)
							await this.setImage(context, imageWithHeart)
						} else {
							await this.setImage(context, baseImageData)
						}
					} else {
						await this.setImage(context)
					}
				} else {
					await this.setImage(context, 'images/states/song-information-unknown')
				}

				if (i + 1 < times)
					await new Promise(resolve => setTimeout(resolve, duration))
			}
		} catch (error) {
		}
	}

	async #addHeartToIcon(iconDataUrl: string): Promise<string> {
		try {
			const heartSize = 30;
			const iconSize = 120;
			const heartX = iconSize - heartSize - 6;
			const heartY = 6;
			
			const centerX = heartX + heartSize/2;
			const centerY = heartY + heartSize/2;
			
			const svg = `
				<svg width="${iconSize}" height="${iconSize}" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<pattern id="icon" patternUnits="userSpaceOnUse" width="${iconSize}" height="${iconSize}">
							<image href="${iconDataUrl}" x="0" y="0" width="${iconSize}" height="${iconSize}"/>
						</pattern>
						<radialGradient id="heartGradient" cx="0.3" cy="0.3" r="0.8">
							<stop offset="0%" stop-color="#1ED760"/>
							<stop offset="100%" stop-color="#1DB954"/>
						</radialGradient>
					</defs>
					<rect width="${iconSize}" height="${iconSize}" fill="url(#icon)"/>
					<circle cx="${centerX}" cy="${centerY}" r="${heartSize/2 + 2}" fill="#000000" opacity="0.7"/>
					<g transform="translate(${centerX - 13}, ${centerY - 11}) scale(0.2)">
						<path d="M 65,29 C 59,19 49,12 37,12 20,12 7,25 7,42 7,75 25,80 65,118 105,80 123,75 123,42 123,25 110,12 93,12 81,12 71,19 65,29 z" 
						      fill="url(#heartGradient)" stroke="#FFFFFF" stroke-width="2"/>
					</g>
				</svg>
			`;
			
			const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
			return svgDataUrl;
		} catch (error) {
			return iconDataUrl;
		}
	}

	async invokeWrapperAction(context: string): Promise<Symbol> {
		return constants.WRAPPER_RESPONSE_SUCCESS
	}

	async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
		await super.onWillAppear(ev)

		if (connector.set) {
			this.#onSongChanged(wrapper.song, true, [ev.action.id])
		}
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		const context = ev.action.id
		
		this.#resetClickTracking(context)
		
		delete this.#clickCounts[context]
		delete this.#isLongPress[context]
		delete this.#busy[context]
		delete this.#keyPressed[context]

		await super.onWillDisappear(ev)
	}

	onStateSettled(context: string) {
		super.onStateSettled(context, true)
		this.#onSongChanged(wrapper.song, false, [context])
	}

	onStateLoss(context: string) {
		super.onStateLoss(context)
		this.#resetClickTracking(context)
	}
}