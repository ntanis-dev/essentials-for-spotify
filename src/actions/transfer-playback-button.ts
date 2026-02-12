import StreamDeck, {
	action,
	SendToPluginEvent,
	WillAppearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'
import connector from '../library/connector.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.transfer-playback-button' })
export default class TransferPlaybackButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		wrapper.on('devicesChanged', this.#updateDevices.bind(this))
		this.setStatelessImage('images/states/transfer-playback-unknown')
	}

	async #updateDevices(devices: any, contexts = this.contexts) {
		if (!connector.set)
			return

		const promises = []
		const items: any = []

		for (const context of contexts)
			for (const device of devices)
				if (device.id !== this.settings[context].spotify_device_id)
					items.push({
						value: device.id,
						label: device.name
					})

		for (const context of contexts)
			promises.push(new Promise(async resolve => {
				const deviceOnline = devices.some((device: any) => device.id === this.settings[context].spotify_device_id)

				if (deviceOnline)
					await this.setSettings(context, {
						spotify_device_label: (this.settings[context].spotify_device_id) ? (wrapper.devices.find((device: any) => device.id === this.settings[context].spotify_device_id)?.name) : undefined
					})

				if (this.settings[context].spotify_device_id)
					items.unshift({
						value: this.settings[context].spotify_device_id,
						label: deviceOnline ? (this.settings[context].spotify_device_label ?? 'Unknown\nDevice') : (this.settings[context].spotify_device_label ? `${this.settings[context].spotify_device_label} (Offline)` : 'Unknown\nDevice (Offline)')
					})

				await StreamDeck.ui.sendToPropertyInspector({
					event: 'getDevices',
					items
				})

				await this.setTitle(context, this.settings[context].spotify_device_label ? this.splitToLines(this.settings[context].spotify_device_label) : (this.settings[context].spotify_device_id ? 'Unknown\nDevice' : 'No Device\nSelected'))

				if (deviceOnline)
					await this.setImage(context, 'images/states/transfer-playback')
				else
					await this.setImage(context, 'images/states/transfer-playback-offline')

				resolve(true)
			}))


		await Promise.allSettled(promises)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if ((!this.settings[context].spotify_device_id) || (!wrapper.devices.some((device: any) => device.id === this.settings[context].spotify_device_id)))
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
		else {
			const response = await wrapper.transferPlayback(this.settings[context].spotify_device_id)

			if (response === constants.WRAPPER_RESPONSE_SUCCESS)
				return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE
			else
				return response
		}
	}

	async onSendToPlugin(ev: SendToPluginEvent<any, any>): Promise<void> {
		if (ev.payload?.event === 'getDevices')
			await this.#updateDevices(wrapper.devices, [ev.action.id])
	}

	async onSettingsUpdated(context: string, oldSettings: any) {
		await this.#updateDevices(wrapper.devices, [context])
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context, true)
		await this.#updateDevices(wrapper.devices, [context])
	}

	async onStateLoss(context: string) {
		await super.onStateLoss(context)
		await this.setTitle(context, '')
	}
}
