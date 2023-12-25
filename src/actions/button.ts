import streamDeck, { KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck'
import connector from './../library/connector.js'
import helpers from './../library/helpers.js'
import logger from './../library/logger.js'

export class Button extends SingletonAction {
	#baseIcon: (string | null) = null

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

	getManifestIcon(action: any) {
		return streamDeck.manifest.Actions.filter((a: any) => a.UUID == action.manifestId)[0]?.Icon || null
	}

	onWillAppear(ev: WillAppearEvent<any>) {
		this.#baseIcon = this.getManifestIcon(ev.action)
		// return ev.action.setTitle('Hi!')
	}

	async onKeyDown(ev: KeyDownEvent<any>) {
		if (!connector.ready())
			await this.flashImage(ev.action, `${this.#baseIcon}-no-setup`, 500, 3)
		else if (!await this.onKeyAction())
			await this.flashImage(ev.action, `${this.#baseIcon}-network-error`, 500, 3)
	}

	async onKeyAction(): Promise<boolean> {
		throw new Error('Method not implemented.')
	}
}
