import StreamDeck, {
	KeyDownEvent,
	KeyUpEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent
} from '@elgato/streamdeck'

import constants from './../library/constants.js'
import connector from './../library/connector.js'
import logger from './../library/logger.js'

export class Button extends SingletonAction {
	static HOLDABLE = false
	static STATABLE = false

	#pressed: any = {}
	#holding: any = {}
	#busy: any = {}
	#unpressable: any = {}
	#statelessImage: string = ''

	contexts: Array<string> = []

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
		for (let i = 0; i < times; i++) {
			await action.setImage(image).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
			await new Promise(resolve => setTimeout(resolve, duration))
			await action.setImage((this.constructor as typeof Button).STATABLE && (!connector.set) ? this.#statelessImage : undefined).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

			if (i + 1 < times)
				await new Promise(resolve => setTimeout(resolve, duration))
		}

		if ((this.constructor as typeof Button).STATABLE && connector.set)
			this.onStateSettled(action.id)
	}

	async onKeyDown(ev: KeyDownEvent<any>) {
		if (this.#busy[ev.action.id] || this.#unpressable[ev.action.id])
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

		if (!connector.set)
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

	onStateSettled(context: string) {
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
