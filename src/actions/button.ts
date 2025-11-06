import StreamDeck, {
	KeyDownEvent,
	KeyUpEvent,
	WillAppearEvent,
	WillDisappearEvent,
	DidReceiveSettingsEvent
} from '@elgato/streamdeck'

import {
	Action
} from './action.js'

import constants from './../library/constants.js'
import connector from './../library/connector.js'
import logger from './../library/logger.js'

export class Button extends Action {
	static ACTIONLESS = false
	static HOLDABLE = false
	static SETUPLESS = false
	static STATABLE = false

	#pressed: any = {}
	#holding: any = {}
	#busy: any = {}
	#unpressable: any = {}
	#flashing: any = {}
	#statelessImage: string = ''

	settings: any = {}
	contexts: Array<string> = []
	marquees: any = {}

	constructor() {
		super()

		if ((this.constructor as typeof Button).STATABLE)
			connector.on('setupStateChanged', (state: boolean) => {
				if (!state)
					for (const context of this.contexts)
						this.onStateLoss(context)
				else
					for (const context of this.contexts)
						this.onStateSettled(context)
			})
	}

	async #flashImage(action: any, image: string, duration: number = 500, times = 2) {
		action.setTitle('')

		this.#flashing[action.id] = true

		for (let i = 0; i < times; i++) {
			await action.setImage(image).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
			await new Promise(resolve => setTimeout(resolve, duration))
			await action.setImage((this.constructor as typeof Button).STATABLE && (!connector.set) ? this.#statelessImage : undefined).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

			if (i + 1 < times)
				await new Promise(resolve => setTimeout(resolve, duration))
		}

		if ((this.constructor as typeof Button).STATABLE && connector.set)
			this.onStateSettled(action.id)

		this.#flashing[action.id] = false

		this.resumeMarquee(action.id, true)
	}

	async onKeyDown(ev: KeyDownEvent<any>) {
		if (this.#busy[ev.action.id] || this.#unpressable[ev.action.id] || (this.constructor as typeof Button).ACTIONLESS)
			return

		this.#busy[ev.action.id] = true
		this.#pressed[ev.action.id] = true

		if ((!this.#holding[ev.action.id]) && (this.constructor as typeof Button).HOLDABLE)
			this.#holding[ev.action.id] = setTimeout(() => {
				if (this.#pressed[ev.action.id]) {
					this.#holding[ev.action.id] = true
					this.onKeyDown(ev)
				}
			}, constants.BUTTON_HOLD_DELAY)

		if ((!connector.set) && (!(this.constructor as typeof Button).SETUPLESS))
			await this.#flashImage(ev.action, 'images/states/setup-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
		else {
			const startedInvokingAt = Date.now()
			const response = await this.invokeWrapperAction(ev.action.id)

			if (response === constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)
				await this.#flashImage(ev.action, 'images/states/success', constants.SHORT_FLASH_DURATION, constants.SHORT_FLASH_TIMES)

			if ((response === constants.WRAPPER_RESPONSE_SUCCESS || response === constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE) && this.#holding[ev.action.id] === true)
				this.#pressed[ev.action.id] = setTimeout(() => {
					if (this.#pressed[ev.action.id])
						this.onKeyDown(ev)
				}, Math.max(0, constants.BUTTON_HOLD_REPEAT_INTERVAL - (Date.now() - startedInvokingAt)))
			else if (response === constants.WRAPPER_RESPONSE_NOT_AVAILABLE)
				await this.#flashImage(ev.action, 'images/states/not-available', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			else if (response === constants.WRAPPER_RESPONSE_API_RATE_LIMITED)
				await this.#flashImage(ev.action, 'images/states/api-rate-limited', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			else if (response === constants.WRAPPER_RESPONSE_API_ERROR)
				await this.#flashImage(ev.action, 'images/states/api-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			else if (response === constants.WRAPPER_RESPONSE_FATAL_ERROR)
				await this.#flashImage(ev.action, 'images/states/fatal-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			else if (response === constants.WRAPPER_RESPONSE_NO_DEVICE_ERROR)
				await this.#flashImage(ev.action, 'images/states/no-device-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			else if (response === constants.WRAPPER_RESPONSE_BUSY)
				await this.#flashImage(ev.action, 'images/states/busy', constants.SHORT_FLASH_DURATION, constants.SHORT_FLASH_TIMES)
		}

		delete this.#busy[ev.action.id]
	}

	async onKeyUp(ev: KeyUpEvent<any>) {
		clearTimeout(this.#pressed[ev.action.id])
		clearTimeout(this.#holding[ev.action.id])

		delete this.#pressed[ev.action.id]
		delete this.#holding[ev.action.id]
	}

	async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
		this.contexts.push(ev.action.id)

		const oldSettings = JSON.parse(JSON.stringify(this.settings[ev.action.id] || {}))

		this.settings[ev.action.id] = ev.payload.settings

		await this.onSettingsUpdated(ev.action.id, oldSettings)

		if ((this.constructor as typeof Button).STATABLE)
			if (!connector.set)
				this.onStateLoss(ev.action.id)
			else
				this.onStateSettled(ev.action.id)
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		clearTimeout(this.#pressed[ev.action.id])
		clearTimeout(this.#holding[ev.action.id])

		delete this.#pressed[ev.action.id]
		delete this.#holding[ev.action.id]

		this.contexts.splice(this.contexts.indexOf(ev.action.id), 1)
	}

	async onDidReceiveSettings(ev: DidReceiveSettingsEvent<any>): Promise<void> {
		const oldSettings = JSON.parse(JSON.stringify(this.settings[ev.action.id] || {}))
		this.settings[ev.action.id] = ev.payload.settings
		await this.onSettingsUpdated(ev.action.id, oldSettings)
	}

	async onSettingsUpdated(context: string, oldSettings: any) {
		return
	}

	async setSettings(context: string, settings: any, internal = true) {
		const oldSettings = JSON.parse(JSON.stringify(this.settings[context] || {}))

		await StreamDeck.client.setSettings(context, settings).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck settings of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		Object.assign(this.settings[context], settings)

		if (!internal)
			this.onSettingsUpdated(context, oldSettings)
	}

	async invokeWrapperAction(context: string): Promise<Symbol> {
		return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async setTitle(context: string, title: string) {
		await StreamDeck.client.setTitle(context, title).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck title of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	async setImage(context: string, image?: string) {
		await StreamDeck.client.setImage(context, image).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	async setState(context: string, state: any) {
		await StreamDeck.client.setState(context, state).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck state of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	async marqueeTitle(id: string, data: Array<any>, context: string, forced = false) {
		if (this.#flashing[context])
			return

		data = data.filter(item => !!item)

		if (data.length === 0) {
			this.clearMarquee(context)
			this.setTitle(context, '')
			return
		}

		const isInitial = !this.marquees[context]

		const marqueeData = this.marquees[context] || {
			timeout: null,
			id,
			data,
			entries: {}
		}

		if (!this.marquees[context])
			for (let i = 0; i < data.length; i++) {
				marqueeData.entries[data[i].key] = {
					original: data[i].value,
					render: `${data[i].value}${' '.repeat(constants.BUTTON_MARQUEE_SPACING * constants.BUTTON_MARQUEE_SPACING_MULTIPLIER)}`,
					frame: null,
					totalFrames: null
				}
			}

		if (this.marquees[context] && this.marquees[context].id !== id)
			return

		this.marquees[context] = marqueeData

		let finalText = ''

		for (let i = 0; i < data.length; i++) {
			if (marqueeData.entries[data[i].key].frame === null)
				marqueeData.entries[data[i].key].frame = (marqueeData.entries[data[i].key].original.length / 2) + constants.BUTTON_MARQUEE_SPACING

			if (marqueeData.entries[data[i].key].totalFrames === null)
				marqueeData.entries[data[i].key].totalFrames = marqueeData.entries[data[i].key].render.length

			finalText += `${this.getTextSpacingWidth(marqueeData.entries[data[i].key].original) > constants.BUTTON_MARQUEE_SPACING ? `${marqueeData.entries[data[i].key].render.slice(marqueeData.entries[data[i].key].frame)}${marqueeData.entries[data[i].key].render.slice(0, marqueeData.entries[data[i].key].frame)}` : marqueeData.entries[data[i].key].original}\n`
		}

		this.setTitle(context, finalText.slice(0, -1))

		if ((!this.marquees[context]) || this.marquees[context].id !== id)
			return

		for (let i = 0; i < data.length; i++) {
			marqueeData.entries[data[i].key].frame++

			if (marqueeData.entries[data[i].key].frame >= marqueeData.entries[data[i].key].totalFrames)
				marqueeData.entries[data[i].key].frame = 0
		}

		if (!forced)
			marqueeData.timeout = setTimeout(() => this.marqueeTitle(id, marqueeData.data, context), isInitial ? constants.BUTTON_MARQUEE_INTERVAL_INITIAL : constants.BUTTON_MARQUEE_INTERVAL)
	}

	updateMarqueeEntry(context: string, key: string, value: string) {
		if (this.marquees[context] && this.marquees[context].entries[key]) {
			this.marquees[context].entries[key].original = value
			this.marquees[context].entries[key].render = `${value}${' '.repeat(constants.BUTTON_MARQUEE_SPACING * constants.BUTTON_MARQUEE_SPACING_MULTIPLIER)}`
			this.marquees[context].entries[key].totalFrames = this.marquees[context].entries[key].render.length
		}
	}

	resumeMarquee(context: string, forced = false) {
		if (this.marquees[context]) {
			clearTimeout(this.marquees[context].timeout)
			
			if (forced)
				this.marqueeTitle(this.marquees[context].id, this.marquees[context].data, context, true)

			this.marquees[context].timeout = setTimeout(() => this.marqueeTitle(this.marquees[context].id, this.marquees[context].data, context), constants.BUTTON_MARQUEE_INTERVAL)
		}
	}

	pauseMarquee(context: string) {
		if (this.marquees[context]) {
			clearTimeout(this.marquees[context].timeout)
			this.marquees[context].timeout = null
		}
	}

	clearMarquee(context: string) {
		if (this.marquees[context]) {
			clearTimeout(this.marquees[context].timeout)
			delete this.marquees[context]
		}
	}

	getTextSpacingWidth(text: string) {
		let totalWidth = 0

		for (const char of text)
			totalWidth += constants.CHARACTER_WIDTH_MAP[char] || 1

		return totalWidth;
	}

	onStateSettled(context: string, skipImageReset: boolean = false) {
		if (!skipImageReset)
			this.setImage(context)
	}

	onStateLoss(context: string) {
		this.setImage(context, this.#statelessImage)
	}

	setStatelessImage(image: string) {
		this.#statelessImage = image
	}

	setUnpressable(context: string, busy: boolean) {
		if (!busy)
			delete this.#unpressable[context]
		else
			this.#unpressable[context] = busy
	}
}
