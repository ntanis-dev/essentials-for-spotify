import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck'
import { exec } from 'child_process'

@action({ UUID: "com.ntanis.spotify-essentials.setup-button" })
export class SetupButton extends SingletonAction {
	onWillAppear(ev: WillAppearEvent<any>) {
		return ev.action.setTitle(`${ev.payload.settings.count ?? 0}`)
	}

	async onKeyDown(ev: KeyDownEvent<any>) {
		const start = process.platform == 'darwin' ? 'open' : (process.platform == 'win32' ? 'start' : 'xdg-open')
		exec(`${start} http://localhost:4202`)
		ev.action.setTitle(`Check\nYour\nBrowser`)
	}
}
