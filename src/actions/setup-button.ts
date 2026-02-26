import {
	exec
} from 'child_process'

import StreamDeck, {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import connector from './../library/connector.js'
import logger from './../library/logger.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.setup-button' })
export default class SetupButton extends Button {
	static readonly SETUPLESS = true
	static readonly STATABLE = true
	
	readonly FAKE = false

	constructor() {
		super()
		connector.on('setupStateChanged', this.#onSetupStateChanged.bind(this))
	}

	#onSetupStateChanged(state: boolean) {
		const promises = []

		for (const context of this.contexts)
			promises.push(this.setState(context, state ? 1 : 0))

		return Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (this.FAKE)
			if (connector.set)
				connector.fakeOff()
			else
				connector.fakeOn()
		else {
			if (connector.set)
				connector.invalidateSetup()

			exec(`${process.platform == 'darwin' ? 'open' : (process.platform == 'win32' ? 'start' : 'xdg-open')} http://127.0.0.1:${connector.port || constants.CONNECTOR_DEFAULT_PORT}/?lang=${StreamDeck.info.application.language}`, (error, stdout, stderr) => {
				if (error)
					logger.error(`An error occurred while opening browser: "${error.message || 'No message.'}" @ "${error.stack || 'No stack trace.'}".`)
			})
		}

		return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context)
		await this.#onSetupStateChanged(true)
	}

	async onStateLoss(context: string) {
		await super.onStateLoss(context)
		await this.#onSetupStateChanged(false)
	}
}
