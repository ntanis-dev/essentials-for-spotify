import {
	KeyDownEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent
} from '@elgato/streamdeck'

import constants from './../library/constants.js'
import connector from './../library/connector.js'
import logger from './../library/logger.js'

export class Button extends SingletonAction {
	contexts: Array<string> = []

	constructor() {
		super()
	}

	async flashImage(action: any, image: string, duration: number = 500, times = 2) {
		for (let i = 0; i < times; i++) {
			await action.setImage(image).catch((e: Error) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e}".`))
			await new Promise(resolve => setTimeout(resolve, duration))
			await action.setImage().catch((e: Error) => logger.error(`An error occurred while setting the Stream Deck image of "${this.manifestId}": "${e}".`))
			await new Promise(resolve => setTimeout(resolve, duration))
		}
	}

	async onKeyDown(ev: KeyDownEvent<any>) {
		if (!connector.set)
			await this.flashImage(ev.action, 'images/states/setup-error', 1000, 1)
		else {
			const response = await this.invokeWrapperAction()

			if (response === constants.WRAPPER_RESPONSE_ERROR)
				await this.flashImage(ev.action, 'images/states/api-error', 1000, 1)
			else if (response === constants.WRAPPER_RESPONSE_PENDING)
				await this.flashImage(ev.action, 'images/states/busy', 500, 1)
		}
	}

	async invokeWrapperAction(): Promise<boolean> {
		throw new Error('The method "invokeWrapperAction" is not implemented.')
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
