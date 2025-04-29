import {
	exec
} from 'child_process'

import {
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

	#fake = false

	constructor() {
		super()
		connector.on('setupStateChanged', this.#onSetupStateChanged.bind(this))
	}

	#onSetupStateChanged(state: boolean) {
		for (const context of this.contexts)
			this.setState(context, state ? 1 : 0)
	}

	async invokeWrapperAction(context: string) {
		if (this.#fake)
			if (connector.set)
				connector.fakeOff()
			else
				connector.fakeOn()
		else {
			if (connector.set)
				connector.invalidateSetup()

			exec(`${process.platform == 'darwin' ? 'open' : (process.platform == 'win32' ? 'start' : 'xdg-open')} http://127.0.0.1:${constants.CONNECTOR_DEFAULT_PORT}`, (error, stdout, stderr) => {
				if (error)
					logger.error(`An error occurred while opening browser: "${error.message || 'No message.'}" @ "${error.stack || 'No stack trace.'}".`)
			})
		}

		return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
	}

	onStateSettled(context: string) {
		super.onStateSettled(context)
		this.#onSetupStateChanged(true)
	}

	onStateLoss(context: string) {
		super.onStateLoss(context)
		this.#onSetupStateChanged(false)
	}
}
