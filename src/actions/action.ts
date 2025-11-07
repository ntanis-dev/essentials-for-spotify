import StreamDeck, {
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent,
	DidReceiveSettingsEvent
} from '@elgato/streamdeck'

import connector from './../library/connector.js'
import logger from '../library/logger.js'

export class Action extends SingletonAction {
	settings: any = {}
	contexts: Array<string> = []

	constructor() {
		super()

		connector.on('setupStateChanged', (state: boolean) => {
			if (state)
				for (const context of this.contexts)
					this.onSettingsUpdated(context, this.settings[context])
		})
	}

	async onWillAppear(ev: WillAppearEvent<object>): Promise<void> {
		await super.onWillAppear?.(ev)

		this.contexts.push(ev.action.id)

		const oldSettings = JSON.parse(JSON.stringify(this.settings[ev.action.id] || {}))

		this.settings[ev.action.id] = ev.payload.settings

		if (connector.set)
			await this.onSettingsUpdated(ev.action.id, oldSettings)
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		this.contexts.splice(this.contexts.indexOf(ev.action.id), 1)
	}

	async onDidReceiveSettings(ev: DidReceiveSettingsEvent<any>): Promise<void> {
		const oldSettings = JSON.parse(JSON.stringify(this.settings[ev.action.id] || {}))
		this.settings[ev.action.id] = ev.payload.settings

		if (connector.set)
			await this.onSettingsUpdated(ev.action.id, oldSettings)
	}

	async setSettings(context: string, settings: any, internal = true) {
		const oldSettings = JSON.parse(JSON.stringify(this.settings[context] || {}))

		Object.assign(this.settings[context], settings)
		
		await StreamDeck.client.setSettings(context, this.settings[context]).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck settings of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

		if ((!internal) && connector.set)
			await this.onSettingsUpdated(context, oldSettings)
	}

	async onSettingsUpdated(context: string, oldSettings: any) { }

	splitToLines(text: string, maxLineLength: number = 9, maxLines: number = 5): string {
		const ELLIPSIS = '...'

		const truncateWithEllipsis = (s: string, limit: number): string => {
			if (limit <= 0)
				return ''

			if (s.length <= limit)
				return s

			if (limit <= ELLIPSIS.length)
				return s.slice(0, limit)

			return s.slice(0, limit - ELLIPSIS.length) + ELLIPSIS
		}

		const tokens = text.trim().split(/[ \t]+|[-–—_\/\\.:|]+/).filter(Boolean)
		const lines: string[] = []

		for (let i = 0; i < tokens.length; i++) {
			if (lines.length < maxLines - 1) {
				lines.push(truncateWithEllipsis(tokens[i], maxLineLength))
				continue
			}

			if (lines.length === maxLines - 1)
				if (i < tokens.length - 1) {
					lines.push(truncateWithEllipsis(ELLIPSIS, maxLineLength))
					break
				} else {
					lines.push(truncateWithEllipsis(tokens[i], maxLineLength))
					break
				}

			break
		}

		return lines.join('\n')
	}

	processImage(iconDataUrl: string, heart: 'top-left' | 'center' | 'none', borderColor: string | null = null): string {
		if ((heart === 'none' && (!borderColor)))
			return iconDataUrl

		const iconSize = 120
		const heartPadding = 24
		const originalMinX = 7
		const originalMinY = 12
		const originalWidth = 116
		const originalHeight = 106
		const availableWidth = iconSize - (heartPadding * 2)
		const availableHeight = iconSize - (heartPadding * 2)

		const borderStrokeWidth = borderColor ? 12 : 0
		const borderInset = borderColor ? borderStrokeWidth / 2 : 0
		const glowRadius = borderColor ? Math.max(4, Math.round(borderStrokeWidth * 1.25)) : 0

		const borderRect = borderColor ? `
			<rect x="${borderInset}" y="${borderInset}" width="${iconSize - (borderInset * 2)}" height="${iconSize - (borderInset * 2)}" fill="none" stroke="${borderColor}" stroke-width="${borderStrokeWidth}" shape-rendering="geometricPrecision"/>
		` : ''

		let scaleFactor = Math.min(availableWidth / originalWidth, availableHeight / originalHeight)
		let heartWidth = originalWidth * scaleFactor
		let heartHeight = originalHeight * scaleFactor
		let offsetX = (iconSize - heartWidth) / 2
		let offsetY = (iconSize - heartHeight) / 2
		let strokeWidth = 2

		if (heart === 'top-left') {
			const cornerPadding = 12
			const maxCornerSize = iconSize * 0.4

			scaleFactor = Math.min(maxCornerSize / originalWidth, maxCornerSize / originalHeight)
			heartWidth = originalWidth * scaleFactor
			heartHeight = originalHeight * scaleFactor
			offsetX = cornerPadding
			offsetY = cornerPadding
			strokeWidth = 1
		}

		const heartShape = heart !== 'none' ? `
			<path d="M 65,29 C 59,19 49,12 37,12 20,12 7,25 7,42 7,75 25,80 65,118 105,80 123,75 123,42 123,25 110,12 93,12 81,12 71,19 65,29 z"
				fill="#1db954" stroke="#191414" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
				transform="translate(${offsetX - (originalMinX * scaleFactor)}, ${offsetY - (originalMinY * scaleFactor)}) scale(${scaleFactor})"
				vector-effect="non-scaling-stroke"/>
		` : ''

		const innerGlowRect = borderColor? `
			<rect x="${borderInset}" y="${borderInset}" width="${iconSize - (borderInset * 2)}" height="${iconSize - (borderInset * 2)}" fill="white" filter="url(#innerGlow)"/>
		` : ''

		const svg = `
			<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}" xmlns="http://www.w3.org/2000/svg">

			<defs>
				<pattern id="iconPattern" patternUnits="userSpaceOnUse" width="${iconSize}" height="${iconSize}">
					<image href="${iconDataUrl}" x="0" y="0" width="${iconSize}" height="${iconSize}"/>
				</pattern>

				<filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
					<feGaussianBlur in="SourceAlpha" stdDeviation="${glowRadius}" result="blur"/>
					<feComposite in="SourceAlpha" in2="blur" operator="out" result="innerEdge"/>
					<feFlood flood-color="#${borderColor}" flood-opacity="1" result="glowColor"/>
					<feComposite in="glowColor" in2="innerEdge" operator="in" result="coloredGlow"/>
					<feComposite in="coloredGlow" in2="coloredGlow" operator="over"/>
				</filter>
			</defs>

			<rect width="${iconSize}" height="${iconSize}" fill="url(#iconPattern)"/>

			${innerGlowRect}
			${borderRect}
			${heartShape}
			</svg>
		`

		return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
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
