import {
	DialRotateEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent
} from '@elgato/streamdeck'

import logger from './../library/logger.js'

export class Dial extends SingletonAction {
	contexts: Array<string> = []
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
		this.contexts.splice(this.contexts.indexOf(ev.action.id), 1)
	}

	onDialRotate(ev: DialRotateEvent<object>): void | Promise<void> { }
}
