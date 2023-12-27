import {
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

	contexts: Array<string> = []
	pressed: any = {}
	holding: any = {}
	busy: any = {}
	forcedBusy: any = {}

	async flashImage(action: any, image: string, duration: number = 500, times = 2) {
		for (let i = 0; i < times; i++) {
			await action.setImage(image).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
			await new Promise(resolve => setTimeout(resolve, duration))
			await action.setImage().catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

			if (i + 1 < times)
				await new Promise(resolve => setTimeout(resolve, duration))
		}
	}

	async onKeyDown(ev: KeyDownEvent<any>) {
		if (this.busy[ev.action.id] || this.forcedBusy[ev.action.id])
			return

		this.busy[ev.action.id] = true
		this.pressed[ev.action.id] = true

		if ((!this.holding[ev.action.id]) && (this.constructor as typeof Button).HOLDABLE)
			this.holding[ev.action.id] = setTimeout(() => {
				if (this.pressed[ev.action.id]) {
					this.holding[ev.action.id] = true
					this.onKeyDown(ev)
				}
			}, constants.BUTTON_HOLD_DELAY)

		if (!connector.set)
			await this.flashImage(ev.action, 'images/states/setup-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
		else {
			const startedInvokingAt = Date.now()
			const response = await this.invokeWrapperAction()

			if (response === constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)
				await this.flashImage(ev.action, 'images/states/success', constants.SHORT_FLASH_DURATION, constants.SHORT_FLASH_TIMES)

			if ((response === constants.WRAPPER_RESPONSE_SUCCESS || response === constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE) && this.holding[ev.action.id] === true)
				this.pressed[ev.action.id] = setTimeout(() => {
					if (this.pressed[ev.action.id])
						this.onKeyDown(ev)
				}, Math.max(0, constants.BUTTON_HOLD_REPEAT_INTERVAL - (Date.now() - startedInvokingAt)))
			else if (response === constants.WRAPPER_RESPONSE_NOT_AVAILABLE)
				await this.flashImage(ev.action, 'images/states/not-available', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			else if (response === constants.WRAPPER_RESPONSE_API_RATE_LIMITED)
				await this.flashImage(ev.action, 'images/states/api-rate-limited', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			else if (response === constants.WRAPPER_RESPONSE_API_ERROR)
				await this.flashImage(ev.action, 'images/states/api-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			else if (response === constants.WRAPPER_RESPONSE_FATAL_ERROR)
				await this.flashImage(ev.action, 'images/states/fatal-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			else if (response === constants.WRAPPER_RESPONSE_NO_DEVICE_ERROR)
				await this.flashImage(ev.action, 'images/states/no-device-error', constants.LONG_FLASH_DURATION, constants.LONG_FLASH_TIMES)
			else if (response === constants.WRAPPER_RESPONSE_BUSY)
				await this.flashImage(ev.action, 'images/states/busy', constants.SHORT_FLASH_DURATION, constants.SHORT_FLASH_TIMES)
		}

		this.busy[ev.action.id] = false
	}

	async onKeyUp(ev: KeyUpEvent<any>) {
		clearTimeout(this.pressed[ev.action.id])
		clearTimeout(this.holding[ev.action.id])

		this.pressed[ev.action.id] = false
		this.holding[ev.action.id] = false
	}

	async invokeWrapperAction(): Promise<Symbol> {
		return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	setBusy(context: string, busy: boolean) {
		this.forcedBusy[context] = busy
	}

	isVisible(context: string) {
		return this.contexts.includes(context)
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		this.contexts.push(ev.action.id)
	}

	onWillDisappear(ev: WillDisappearEvent<any>): void {
		clearTimeout(this.pressed[ev.action.id])
		clearTimeout(this.holding[ev.action.id])

		this.pressed[ev.action.id] = false
		this.holding[ev.action.id] = false

		this.contexts.splice(this.contexts.indexOf(ev.action.id), 1)
	}
}
