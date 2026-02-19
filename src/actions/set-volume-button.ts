import {
	action
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import wrapper from './../library/wrapper.js'

const ICON_SIZE = 144
const SLIDER_X = 94
const SLIDER_WIDTH = 6
const SLIDER_TOP = 22
const SLIDER_BOTTOM = 122
const SLIDER_TRACK_HEIGHT = SLIDER_BOTTOM - SLIDER_TOP
const KNOB_WIDTH = 16
const KNOB_HEIGHT = 4

@action({ UUID: 'com.ntanis.essentials-for-spotify.set-volume-button' })
export default class SetVolumeButton extends Button {
	static readonly STATABLE = true

	#generateImage(volume: number): string {
		const fillHeight = (volume / 100) * SLIDER_TRACK_HEIGHT
		const fillY = SLIDER_BOTTOM - fillHeight

		const svg = `
			<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<pattern id="baseIcon" patternUnits="userSpaceOnUse" width="${ICON_SIZE}" height="${ICON_SIZE}">
						<image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAYAAADnRuK4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAE8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgMTAuMC1jMDAwIDI1LkcuZWY3MmU0ZSwgMjAyNS8wNi8yNy0xODo1NDowNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI3LjMgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNi0wMi0xOVQyMzozOTowMCswMjowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjYtMDItMTlUMjM6NDk6MTYrMDI6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjYtMDItMTlUMjM6NDk6MTYrMDI6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjNjOTY3Y2Q0LTZjNzQtMTI0Yy1hMTFkLTg5YTg5ZmY1MjY5NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozYzk2N2NkNC02Yzc0LTEyNGMtYTExZC04OWE4OWZmNTI2OTYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDozYzk2N2NkNC02Yzc0LTEyNGMtYTExZC04OWE4OWZmNTI2OTYiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjNjOTY3Y2Q0LTZjNzQtMTI0Yy1hMTFkLTg5YTg5ZmY1MjY5NiIgc3RFdnQ6d2hlbj0iMjAyNi0wMi0xOVQyMzozOTowMCswMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI3LjMgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PrnH654AAAT8SURBVHic7d1PT1xVGMfx55yZgkVom5ShQNNFV/oCpE1M2ii4MnHpa/A1+T5sXFiLdafW7kx0p9JAKRD/0VLQucecuTPtMCnz7zeEGZ7vZ1eakAG+Oefcc+beCYtXrz61EGaCmaWisHYhxmP/7vz/fnR+j1Eb5jWNm3DKv6PTklJ6UTWz+WBW6ecHGccfdBxfkyMz+bd/eNavAhPrMFpK9bN+FZhQKdUZ/yEhIEgICJLIVQwU1AMJAUFCQJDE83AUgLPDCAQJAUFCQJAQECQEBAkBQUJAkBAQJAQECQFBQkCQEBAkvKEMEuqBhIAgISBICAgSAoKEgCAhIEgICBICUgQzuzxl8dObFu8smk01HrPkCgGp8dyuWXh/wezaRZe/TYc/8ojMXbC4Mm9hdcnC5anya8ncyY+4w6Ajz+wFix9dt3jnmlntotlRPT9syTwioGGmrZVaGc/8W+XXHCOgQeSRZ6VmYW3ZrJbjcV4PAfUpNNc8a9ct3m2NPMSTEdAg01Yrnkg8LQTUy1wZT/hwqVww084xBNR12pqyuLZk8e4iC+YTEFDPq61FFsxdsJF44iZhrbFJSDzdMQK9cdpaLhfMrHl6IqDOaesWm4SDYAprySPPe62rLS7V+1XND9l0fW/Yq7Ot5ddnW7TTN99TGGdbMt8B5ZHnVr7a4mxrWD4Daj/bakxbxDOsqt9pa56zrRGourzaytPWB5xtjYKfgHIol6YsrnK2NUpVV/Hc5mxr1HxsAF1qTlutTULiGZmqi03C1eYm4QJrHlcBhXevaH/wSrBwc67tUn2ELw7jH1D87B1tuglmYbpi9naVS3WPAQUus8feeC+i6z5v1psk4x0Qxh4BQUJAkBAQJAQECQFBQkCQEBAkBAQJAUFCQJAQECQEBAkBQUJAkBAQJAQECQFBQkCQEBAkBIRzHFCFe3rG3VjfF2Y7Bz1vCOx140/IH0M5y42FLgOqf/6LNkbGYOHGbOMBmrbAg6TcBZR+/lP7BsEs/bpvNh3LZwLxcAVnayBVnt/2/7VifcuKL59Y2tg3K7jbdZTOd0Atfx9Z8cOOpfUts52Xbj/f9DT4CCj38teRFd/tWPHtU7PtA0aiEfERUHtE9zetuLdh6bd9lx/T7WoRfSrymujHPYspWPikyudiiPyMQG9YExXfbJk9e8l0JvAZUOvq7MFWOZ1tPCeiIfkMqOV5ns52Ld3fLEciHmg1MN8BpeZ09n3z6oxL/IH5DujYdLZpxRe/l1dnTGd9i64/bK5djujxnqUHW+wTDYB6TprOnh0wnfWBgNrlXv5pnp3de1IexDISdUVAJ2427r6ezhiJTkRA3aazvNnI2VlXBNRrOmttNjbOzoioEwH1tdm4Z+nrTbNtjj06EVC/09mjXSsecnbWiYCGmc44O3uFgIY5O/sqn52xsM4IaNjNxofb5XTmfCDy94YyVWqOROubjf2isLZsYTHf7eHzTWkEpGw2Ptot38z48Y3yaw4bIiBpYX3UmM7ilenmmsjcISD5rSD/WfrpD7PDulnhryACUqWk30E7wbgKg4SAICEgSAgIEgKChIAgISBICAgSAoKEgCAhIEgICBICgoSAICEgSAgIEgKChIAgISBICAgSAoKEgCAhIEgICBICgoSAICEgSAgIkphSqmjfAm6FUMkj0PRZvw5MrOn8eJfdVBQzZ/1KYJMnhBf/A4glah62cm9+AAAAAElFTkSuQmCC" x="0" y="0" width="${ICON_SIZE}" height="${ICON_SIZE}"/>
					</pattern>
					<linearGradient id="knobShadow" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="black" stop-opacity="0"/>
						<stop offset="100%" stop-color="black" stop-opacity="0.8"/>
					</linearGradient>
				</defs>

				<rect width="${ICON_SIZE}" height="${ICON_SIZE}" fill="url(#baseIcon)"/>
				<rect x="${SLIDER_X}" y="${SLIDER_TOP}" width="${SLIDER_WIDTH}" height="${SLIDER_TRACK_HEIGHT}" rx="${SLIDER_WIDTH / 2}" fill="#333333"/>
				<rect x="${SLIDER_X}" y="${fillY}" width="${SLIDER_WIDTH}" height="${fillHeight}" rx="${SLIDER_WIDTH / 2}" fill="#1db954"/>
				<rect x="${SLIDER_X + (SLIDER_WIDTH / 2) - (KNOB_WIDTH / 2)}" y="${fillY - 8}" width="${KNOB_WIDTH}" height="8" rx="1" fill="url(#knobShadow)"/>
				<rect x="${SLIDER_X + (SLIDER_WIDTH / 2) - (KNOB_WIDTH / 2)}" y="${fillY - (KNOB_HEIGHT / 2)}" width="${KNOB_WIDTH}" height="${KNOB_HEIGHT}" rx="${KNOB_HEIGHT / 2}" fill="#ffffff"/>
			</svg>
		`

		return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
	}

	async #updateImage(context: string) {
		const volume = this.settings[context].volume ?? 50
		await this.setImage(context, this.#generateImage(volume))
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		if (wrapper.volumePercent === null)
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

		const response = await wrapper.setVolume(this.settings[context].volume)

		if (response === constants.WRAPPER_RESPONSE_SUCCESS)
			return constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE

		return response
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)

		if (this.settings[context].volume === undefined)
			await this.setSettings(context, { volume: 50 })

		await this.#updateImage(context)
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context, true)
		await this.#updateImage(context)
	}
}
