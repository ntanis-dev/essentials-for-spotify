import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck'
import wrapper from './../library/wrapper.js'

@action({ UUID: "com.ntanis.spotify-essentials.play-button" })
export class PlayButton extends SingletonAction {
	onWillAppear(ev: WillAppearEvent<any>) {
		return ev.action.setTitle(`${ev.payload.settings.count ?? 0}`)
	}

	async onKeyDown(ev: KeyDownEvent<any>) {
		wrapper.resumePlayback()

		let count = ev.payload.settings.count ?? 0

		count = count + 2

		await ev.action.setSettings({ count })
		await ev.action.setTitle(`${count}`)
	}
}
