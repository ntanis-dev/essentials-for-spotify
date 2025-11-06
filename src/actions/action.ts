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

		Object.assign(this.settings[context], settings)
		
		await StreamDeck.client.setSettings(context, this.settings[context]).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck settings of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		if (!internal)
			this.onSettingsUpdated(context, oldSettings)
	}

	async onSettingsUpdated(context: string, oldSettings: any) {
		return
	}

	processImage(iconDataUrl: string, addHeart: boolean): string {
		if (!addHeart)
			return iconDataUrl

		try {
			const iconSize = 120
			const heartPadding = 24
			const originalMinX = 7
			const originalMinY = 12
			const originalWidth = 116
			const originalHeight = 106
			const availableWidth = iconSize - (heartPadding * 2)
			const availableHeight = iconSize - (heartPadding * 2)
			const scaleFactor = Math.min(availableWidth / originalWidth, availableHeight / originalHeight)
			const heartWidth = originalWidth * scaleFactor
			const heartHeight = originalHeight * scaleFactor
			const offsetX = (iconSize - heartWidth) / 2
			const offsetY = (iconSize - heartHeight) / 2
			const patternId = `iconPattern-${Math.random().toString(36).slice(2, 8)}`

			const svg = `
				<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${iconSize}" height="${iconSize}">
							<image href="${iconDataUrl}" x="0" y="0" width="${iconSize}" height="${iconSize}"/>
						</pattern>
					</defs>
					<rect width="${iconSize}" height="${iconSize}" fill="url(#${patternId})"/>
					<path d="M 65,29 C 59,19 49,12 37,12 20,12 7,25 7,42 7,75 25,80 65,118 105,80 123,75 123,42 123,25 110,12 93,12 81,12 71,19 65,29 z"
						  fill="#1db954" stroke="#191414" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
						  transform="translate(${offsetX - (originalMinX * scaleFactor)}, ${offsetY - (originalMinY * scaleFactor)}) scale(${scaleFactor})" vector-effect="non-scaling-stroke"/>
				</svg>
			`

			return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
		} catch (error) {
			return iconDataUrl
		}
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
