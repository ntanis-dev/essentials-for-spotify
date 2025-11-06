import StreamDeck, {
	SingletonAction,
	WillAppearEvent,
	DidReceiveSettingsEvent
} from '@elgato/streamdeck'

import logger from '../library/logger.js'

export class Action extends SingletonAction {
	settings: any = {}
	contexts: Array<string> = []

	async onWillAppear(ev: WillAppearEvent<object>): Promise<void> {
		super.onWillAppear?.(ev)

		this.contexts.push(ev.action.id)

		const oldSettings = JSON.parse(JSON.stringify(this.settings[ev.action.id] || {}))

		this.settings[ev.action.id] = ev.payload.settings

		await this.onSettingsUpdated(ev.action.id, oldSettings)
		
	}

	async onDidReceiveSettings(ev: DidReceiveSettingsEvent<any>): Promise<void> {
		const oldSettings = JSON.parse(JSON.stringify(this.settings[ev.action.id] || {}))
		this.settings[ev.action.id] = ev.payload.settings
		await this.onSettingsUpdated(ev.action.id, oldSettings)
	}

	async setSettings(context: string, settings: any, internal = true) {
		const oldSettings = JSON.parse(JSON.stringify(this.settings[context] || {}))

		await StreamDeck.client.setSettings(context, settings).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck settings of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		Object.assign(this.settings[context], settings)

		if (!internal)
			this.onSettingsUpdated(context, oldSettings)
	}

	async onSettingsUpdated(context: string, oldSettings: any) {
		return
	}

	beautifyTime(progressMs: number, durationMs: number, showProgress: boolean = true, showDuration: boolean = true): string {
		const progress = Math.floor(progressMs / 1000)
		const duration = Math.floor(durationMs / 1000)

		const progressMinutes = Math.floor(progress / 60)
		const progressSeconds = progress - (progressMinutes * 60)

		const durationMinutes = Math.floor(duration / 60)
		const durationSeconds = duration - (durationMinutes * 60)

		return `${showProgress ? `${progressMinutes}:${progressSeconds.toString().padStart(2, '0')}` : ''}${showProgress && showDuration ? ' / ' : ''}${showDuration ? `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}` : ''}`
	}
}
