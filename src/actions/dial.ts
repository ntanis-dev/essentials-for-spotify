import StreamDeck, {
	DialUpEvent,
	DialDownEvent,
	DialRotateEvent,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent
} from '@elgato/streamdeck'

import {
	Action
} from './action.js'

import connector from './../library/connector.js'
import constants from './../library/constants.js'
import logger from './../library/logger.js'

export class Dial extends Action {
	static HOLDABLE = false
	static STATABLE = false

	static TYPES = {
		ROTATE_CLOCKWISE: Symbol('ROTATE_CLOCKWISE'),
		ROTATE_COUNTERCLOCKWISE: Symbol('ROTATE_COUNTERCLOCKWISE'),
		UP: Symbol('UP'),
		DOWN: Symbol('DOWN'),
		TAP: Symbol('TAP'),
		LONG_TAP: Symbol('LONG_TAP')
	}
	
	layout: string
	#busy: any = {}
	#unpressable: any = {}
	#holding: any = {}
	#marquees: any = {}
	
	icon: string
	originalIcon: string
	contexts: Array<string> = []

	constructor(layout: string, icon: string) {
		super()

		this.layout = layout
		this.icon = icon
		this.originalIcon = icon

		connector.on('setupStateChanged', (state: boolean) => {
			if ((this.constructor as typeof Dial).STATABLE)
				if (!state)
					for (const context of this.contexts)
						this.onStateLoss(context)
				else
					for (const context of this.contexts)
						this.onStateSettled(context)

			if (!state)
				for (const context of this.contexts)
					this.resetFeedbackLayout(context)
			else
				for (const context of this.contexts)
					this.updateFeedback(context)
			
		})

		if (connector.set)
			for (const context of this.contexts)
				this.updateFeedback(context)
	}

	async #processAction(action: any, type: symbol) {
		if (this.#busy[action.id] || this.#unpressable[action.id] || (type === Dial.TYPES.DOWN && this.#holding[action.id]) || (type === Dial.TYPES.UP && (this.constructor as typeof Dial).HOLDABLE && (!this.#holding[action.id])))
			return

		this.#busy[action.id] = true

		if (type === Dial.TYPES.UP && this.#holding[action.id])
			delete this.#holding[action.id]

		if (!connector.set)
			await this.flashIcon(action.id, 'images/icons/setup-error.png')
		else {
			const response = ((this.constructor as typeof Dial).HOLDABLE && (type === Dial.TYPES.DOWN || type === Dial.TYPES.UP)) ? (type === Dial.TYPES.DOWN ? await this.invokeHoldWrapperAction(action.id) : await this.invokeHoldReleaseWrapperAction(action.id)) : await this.invokeWrapperAction(action.id, type)

			if ((response === constants.WRAPPER_RESPONSE_SUCCESS || response === constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE) && type === Dial.TYPES.DOWN && (this.constructor as typeof Dial).HOLDABLE)
				this.#holding[action.id] = true

			if (response === constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)
				await this.flashIcon(action.id, 'images/icons/success.png', false)
			else if (response === constants.WRAPPER_RESPONSE_NOT_AVAILABLE)
				await this.flashIcon(action.id, 'images/icons/not-available.png')
			else if (response === constants.WRAPPER_RESPONSE_API_RATE_LIMITED)
				await this.flashIcon(action.id, 'images/icons/api-rate-limited.png')
			else if (response === constants.WRAPPER_RESPONSE_API_ERROR)
				await this.flashIcon(action.id, 'images/icons/api-error.png')
			else if (response === constants.WRAPPER_RESPONSE_FATAL_ERROR)
				await this.flashIcon(action.id, 'images/icons/fatal-error.png')
			else if (response === constants.WRAPPER_RESPONSE_NO_DEVICE_ERROR)
				await this.flashIcon(action.id, 'images/icons/no-device-error.png')
			else if (response === constants.WRAPPER_RESPONSE_BUSY)
				await this.flashIcon(action.id, 'images/icons/busy.png')
		}

		delete this.#busy[action.id]
	}

	getIconForStatus(status: Symbol) {
		if (!connector.set)
			return 'images/icons/setup-error.png'
		else if (status === constants.WRAPPER_RESPONSE_SUCCESS)
			return 'images/icons/success.png'
		else if (status === constants.WRAPPER_RESPONSE_NOT_AVAILABLE)
			return 'images/icons/not-available.png'
		else if (status === constants.WRAPPER_RESPONSE_API_RATE_LIMITED)
			return 'images/icons/api-rate-limited.png'
		else if (status === constants.WRAPPER_RESPONSE_API_ERROR)
			return 'images/icons/api-error.png'
		else if (status === constants.WRAPPER_RESPONSE_FATAL_ERROR)
			return 'images/icons/fatal-error.png'
		else if (status === constants.WRAPPER_RESPONSE_NO_DEVICE_ERROR)
			return 'images/icons/no-device-error.png'
		else if (status === constants.WRAPPER_RESPONSE_BUSY)
			return 'images/icons/busy.png'
	}

	async flashIcon(context: string, icon: string, alert = true, duration: number = 500, times = 1) {
		for (let i = 0; i < times; i++) {
			if (alert)
				await this.showAlert(context).catch((e: any) => logger.error(`An error occurred while showing the Stream Deck alert of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

			await this.setFeedback(context, {
				icon
			}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

			await new Promise(resolve => setTimeout(resolve, duration))

			await this.setFeedback(context, {
				icon: connector.set ? this.icon : this.originalIcon
			}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

			if (i + 1 < times)
				await new Promise(resolve => setTimeout(resolve, duration))
		}
	}

	async marquee(id: string, key: string, value: string, countable: string, visible: number, context: string) {
		const marqueeIdentifier = `${context}-${key}`
		const isInitial = !this.#marquees[marqueeIdentifier]

		const marqueeData = this.#marquees[marqueeIdentifier] || {
			timeout: null,
			id,
			key,
			original: value,
			countable,
			render: `${value} | `,
			visible,
			frame: 0,
			context,
			last: null,
			totalFrames: null
		}

		if (this.#marquees[marqueeIdentifier] && this.#marquees[marqueeIdentifier].id !== id)
			return

		this.#marquees[marqueeIdentifier] = marqueeData
		
		if (marqueeData.totalFrames === null)
			marqueeData.totalFrames = marqueeData.render.length

		if (marqueeData.last && countable.length > marqueeData.visible)
			while (marqueeData.last[1] === ' ') {
				marqueeData.last = marqueeData.last.substr(1)
				marqueeData.frame++

				if (marqueeData.frame >= marqueeData.totalFrames) {
					marqueeData.frame = 0
					marqueeData.last = marqueeData.original
				}
			}
	
		marqueeData.last = countable.length > marqueeData.visible ? `${marqueeData.render.substr(marqueeData.frame, marqueeData.visible)}${marqueeData.frame + marqueeData.visible > marqueeData.render.length ? marqueeData.render.substr(0, (marqueeData.frame + marqueeData.visible) - marqueeData.render.length) : ''}` : marqueeData.original

		this.setFeedback(context, {
			[marqueeData.key]: marqueeData.last
		})

		if ((!this.#marquees[marqueeIdentifier]) || this.#marquees[marqueeIdentifier].id !== id)
			return

		marqueeData.frame++

		if (marqueeData.frame >= marqueeData.totalFrames)
			marqueeData.frame = 0

		marqueeData.timeout = setTimeout(() => this.marquee(id, marqueeData.key, marqueeData.original, marqueeData.countable, marqueeData.visible, context), isInitial ? constants.DIAL_MARQUEE_INTERVAL_INITIAL : constants.DIAL_MARQUEE_INTERVAL)
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
		return this.#processAction(ev.action, ev.payload.hold ? Dial.TYPES.LONG_TAP : Dial.TYPES.TAP)
	}

	async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
		await super.onWillAppear(ev)

		if (connector.set)
			this.updateFeedback(ev.action.id)
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		this.contexts.splice(this.contexts.indexOf(ev.action.id), 1)
	}

	async invokeWrapperAction(context: string, type: symbol): Promise<Symbol> {
		return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async invokeHoldWrapperAction(context: string): Promise<Symbol | void> {
		if ((this.constructor as typeof Dial).HOLDABLE)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async invokeHoldReleaseWrapperAction(context: string): Promise<Symbol | void> {
		if ((this.constructor as typeof Dial).HOLDABLE)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async setFeedback(context: string, feedback: any) {
		if ((!this.contexts.includes(context)) || (!connector.set))
			return

		await StreamDeck.client.setFeedback(context, feedback).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	async showAlert(context: string) {
		await StreamDeck.client.showAlert(context).catch((e: any) => logger.error(`An error occurred while showing the Stream Deck alert of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	async setIcon(context: string, icon: string) {
		if ((!this.contexts.includes(context)) || (!connector.set))
			return

		this.icon = icon

		await StreamDeck.client.setFeedback(context, {
			icon
		}).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	async resetFeedbackLayout(context: string, feedback: any = null) {
		for (const key in this.#marquees)
			this.pauseMarquee(context, this.#marquees[key].key)

		await StreamDeck.client.setFeedbackLayout(context, this.layout).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback layout of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		if (feedback)
			await StreamDeck.client.setFeedback(context, feedback).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	isHolding(context: string) {
		return this.#holding[context]
	}

	updateMarquee(context: string, key: string, value: string, countable: string) {
		const marqueeIdentifier = `${context}-${key}`

		if (this.#marquees[marqueeIdentifier]) {
			this.#marquees[marqueeIdentifier].frame = 0
			this.#marquees[marqueeIdentifier].original = value
			this.#marquees[marqueeIdentifier].countable = countable
			this.#marquees[marqueeIdentifier].render = `${value} | `
			this.#marquees[marqueeIdentifier].totalFrames = this.#marquees[marqueeIdentifier].render.length
		}
	}

	resumeMarquee(context: string, key: string) {
		const marqueeIdentifier = `${context}-${key}`

		if (this.#marquees[marqueeIdentifier]) {
			this.#marquees[marqueeIdentifier].frame--

			if (this.#marquees[marqueeIdentifier].frame < 0)
				this.#marquees[marqueeIdentifier].frame = this.#marquees[marqueeIdentifier].totalFrames

			clearTimeout(this.#marquees[marqueeIdentifier].timeout)
			this.marquee(this.#marquees[marqueeIdentifier].id, this.#marquees[marqueeIdentifier].key, this.#marquees[marqueeIdentifier].original, this.#marquees[marqueeIdentifier].countable, this.#marquees[marqueeIdentifier].visible, context)
		}
	}

	pauseMarquee(context: string, key: string) {
		const marqueeIdentifier = `${context}-${key}`

		if (this.#marquees[marqueeIdentifier]) {
			clearTimeout(this.#marquees[marqueeIdentifier].timeout)
			this.#marquees[marqueeIdentifier].timeout = null
		}
	}

	clearMarquee(context: string, key: string) {
		const marqueeIdentifier = `${context}-${key}`

		if (this.#marquees[marqueeIdentifier]) {
			clearTimeout(this.#marquees[marqueeIdentifier].timeout)
			delete this.#marquees[marqueeIdentifier]
		}
	}

	getMarquee(context: string, key: string) {
		return this.#marquees[`${context}-${key}`]
	}

	setUnpressable(context: string, busy: boolean) {
		if (!busy)
			delete this.#unpressable[context]
		else
			this.#unpressable[context] = busy
	}

	onStateSettled(context: string) { }
	onStateLoss(context: string) { }
	updateFeedback(context: string) { }
}
