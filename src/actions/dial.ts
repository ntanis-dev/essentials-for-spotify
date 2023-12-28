import StreamDeck, {
	DialUpEvent,
	DialDownEvent,
	DialRotateEvent,
	SingletonAction,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent
} from '@elgato/streamdeck'

import connector from './../library/connector.js'
import constants from './../library/constants.js'
import logger from './../library/logger.js'

export class Dial extends SingletonAction {
	static HOLDABLE = false

	static TYPES = {
		ROTATE_CLOCKWISE: Symbol('ROTATE_CLOCKWISE'),
		ROTATE_COUNTERCLOCKWISE: Symbol('ROTATE_COUNTERCLOCKWISE'),
		UP: Symbol('UP'),
		DOWN: Symbol('DOWN'),
		TAP: Symbol('TAP')
	}

	#layout: string
	#icon: string
	#busy: any = {}
	#forcedBusy: any = {}
	#holding: any = {}

	contexts: Array<string> = []

	constructor(layout: string, icon: string) {
		super()

		this.#layout = layout,
		this.#icon = icon

		connector.on('setupStateChanged', (state: boolean) => {
			if (!state)
				for (const context of this.contexts)
					this.#resetFeedbackLayout(context)
			else
				for (const context of this.contexts)
					this.updateFeedback(context)
		})

		if (connector.set)
			for (const context of this.contexts)
				this.updateFeedback(context)
	}

	async #resetFeedbackLayout(context: string) {
		await StreamDeck.client.setFeedbackLayout(context, this.#layout).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback layout of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	async #processAction(action: any, type: symbol) {
		if (this.#busy[action.id] || this.#forcedBusy[action.id] || (type === Dial.TYPES.UP && ((!(this.constructor as typeof Dial).HOLDABLE) || (!this.#holding[action.id]))) || (type === Dial.TYPES.DOWN && this.#holding[action.id]))
			return

		if (type === Dial.TYPES.UP && this.#holding[action.id])
			delete this.#holding[action.id]

		this.#busy[action.id] = true

		if (!connector.set)
			await this.flashIcon(action, 'images/icons/setup-error.png')
		else {
			const response = ((this.constructor as typeof Dial).HOLDABLE && (type === Dial.TYPES.DOWN || type === Dial.TYPES.UP)) ? (type === Dial.TYPES.DOWN ? await this.invokeHoldWrapperAction() : await this.invokeHoldReleaseWrapperAction()) : await this.invokeWrapperAction(type)

			if ((response === constants.WRAPPER_RESPONSE_SUCCESS || response === constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE) && type === Dial.TYPES.DOWN && (this.constructor as typeof Dial).HOLDABLE)
				this.#holding[action.id] = true

			if (response === constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)
				await this.flashIcon(action, 'images/icons/success.png', false)
			else if (response === constants.WRAPPER_RESPONSE_NOT_AVAILABLE)
				await this.flashIcon(action, 'images/icons/not-available.png')
			else if (response === constants.WRAPPER_RESPONSE_API_RATE_LIMITED)
				await this.flashIcon(action, 'images/icons/api-rate-limited.png')
			else if (response === constants.WRAPPER_RESPONSE_API_ERROR)
				await this.flashIcon(action, 'images/icons/api-error.png')
			else if (response === constants.WRAPPER_RESPONSE_FATAL_ERROR)
				await this.flashIcon(action, 'images/icons/fatal-error.png')
			else if (response === constants.WRAPPER_RESPONSE_NO_DEVICE_ERROR)
				await this.flashIcon(action, 'images/icons/no-device-error.png')
			else if (response === constants.WRAPPER_RESPONSE_BUSY)
				await this.flashIcon(action, 'images/icons/busy.png')
		}

		delete this.#busy[action.id]
	}

	async flashIcon(action: any, icon: string, alert = true, duration: number = 500, times = 1) {
		for (let i = 0; i < times; i++) {
			if (alert)
				await action.showAlert().catch((e: any) => logger.error(`An error occurred while showing the Stream Deck alert of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

			await action.setFeedback({
				icon
			}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

			await new Promise(resolve => setTimeout(resolve, duration))

			await action.setFeedback({
				icon: this.#icon
			}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

			if (i + 1 < times)
				await new Promise(resolve => setTimeout(resolve, duration))
		}
	}

	async onDialRotate(ev: DialRotateEvent<object>): Promise<void> {
		return this.#processAction(ev.action, ev.payload.ticks > 0 ? Dial.TYPES.ROTATE_CLOCKWISE : Dial.TYPES.ROTATE_COUNTERCLOCKWISE)
	}

	async onDialUp(ev: DialUpEvent<object>): Promise<void> {
		if ((this.constructor as typeof Dial).HOLDABLE)
			while (this.#busy[ev.action.id])
				await new Promise(resolve => setTimeout(resolve, 100))

		return this.#processAction(ev.action, Dial.TYPES.UP)
	}

	async onDialDown(ev: DialDownEvent<object>): Promise<void> {
		return this.#processAction(ev.action, Dial.TYPES.DOWN)
	}

	async onTouchTap(ev: TouchTapEvent<object>): Promise<void> {
		return this.#processAction(ev.action, Dial.TYPES.TAP)
	}

	async invokeWrapperAction(type: symbol): Promise<Symbol> {
		return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async invokeHoldWrapperAction(): Promise<Symbol | void> {
		if ((this.constructor as typeof Dial).HOLDABLE)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async invokeHoldReleaseWrapperAction(): Promise<Symbol | void> {
		if ((this.constructor as typeof Dial).HOLDABLE)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	updateFeedback(context: string) { }

	setBusy(context: string, busy: boolean) {
		if (!busy)
			delete this.#forcedBusy[context]
		else
			this.#forcedBusy[context] = busy
	}

	isVisible(context: string) {
		return this.contexts.includes(context)
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		this.contexts.push(ev.action.id)
	}

	onWillDisappear(ev: WillDisappearEvent<any>): void {
		this.contexts.splice(this.contexts.indexOf(ev.action.id), 1)
	}
}
