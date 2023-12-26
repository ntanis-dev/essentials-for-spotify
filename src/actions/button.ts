import { KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from '@elgato/streamdeck'
import connector from './../library/connector.js'

export class Button extends SingletonAction {
	contexts: Array<string> = []

	constructor() {
		super()
	}

	isVisible(context: string) {
		return this.contexts.includes(context)
	}

	async flashImage(action: any, image: string, duration: number = 500, times = 2) {
		for (let i = 0; i < times; i++) {
			await action.setImage(image)
			await new Promise(resolve => setTimeout(resolve, duration))
			await action.setImage()
			await new Promise(resolve => setTimeout(resolve, duration))
		}
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		this.contexts.push(ev.action.id)
	}

	onWillDisappear(ev: WillDisappearEvent<any>): void {
		this.contexts.splice(this.contexts.indexOf(ev.action.id), 1)
	}

	async onKeyDown(ev: KeyDownEvent<any>) {
		if (!connector.set)
			await this.flashImage(ev.action, 'images/states/setup-error', 1000, 1)
		else if (!await this.onButtonKeyDown())
			await this.flashImage(ev.action, 'images/states/api-error', 1000, 1)
	}

	async onButtonKeyDown(): Promise<boolean> {
		throw new Error('Method not implemented.')
	}
}
