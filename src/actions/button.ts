import { KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck'
import connector from './../library/connector.js'
import helpers from './../library/helpers.js'

export class Button extends SingletonAction {
	context: string | null = null

	constructor() {
		super()
	}

	async flashImage(action: any, image: string, duration: number = 500, times = 2) {
		for (let i = 0; i < times; i++) {
			await action.setImage(image)
			await helpers.sleep(duration)
			await action.setImage()
			await helpers.sleep(duration)
		}
	}

	onWillAppear(ev: WillAppearEvent<any>) {
		this.context = ev.action.id
	}

	async onKeyDown(ev: KeyDownEvent<any>) {
		if (!connector.setup)
			await this.flashImage(ev.action, 'images/states/setup-error', 1000, 1)
		else if (!await this.onButtonKeyDown())
			await this.flashImage(ev.action, 'images/states/api-error', 1000, 1)
	}

	async onButtonKeyDown(): Promise<boolean> {
		throw new Error('Method not implemented.')
	}
}
