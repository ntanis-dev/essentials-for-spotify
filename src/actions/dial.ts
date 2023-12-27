import StreamDeck, {
	DialDownEvent,
	DialRotateEvent,
	SingletonAction,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent
} from '@elgato/streamdeck'

import logger from './../library/logger.js'

export class Dial extends SingletonAction {
	#layout: string
	#forcedBusy: any = {}

	contexts: Array<string> = []

	constructor(layout: string) {
		super()
		this.#layout = layout
	}

	async #resetFeedbackLayout(context: string) {
		await StreamDeck.client.setFeedbackLayout(context, this.#layout).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback layout of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}

	async flashImage(action: any, image: string, duration: number = 500, times = 2) {
		for (let i = 0; i < times; i++) {
			await action.setImage(image).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
			await new Promise(resolve => setTimeout(resolve, duration))
			await action.setImage().catch((e: any) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

			if (i + 1 < times)
				await new Promise(resolve => setTimeout(resolve, duration))
		}
	}

	setBusy(context: string, busy: boolean) {
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

	onDialRotate(ev: DialRotateEvent<object>): void | Promise<void> {

	}

	onDialDown(ev: DialDownEvent<object>): void | Promise<void> {
		
	}

	onTouchTap(ev: TouchTapEvent<object>): void | Promise<void> {
		// long touch?
	}
}
