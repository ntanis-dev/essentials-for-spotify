import StreamDeck, {
	WillAppearEvent,
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import logger from './../library/logger.js'

@action({ UUID: 'com.ntanis.spotify-essentials.playback-control-dial' })
export default class PlaybackControlDial extends Dial {
	constructor() {
		super('playback-control-layout.json', 'images/icons/playback-control.png')
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)

		// StreamDeck.client.setFeedback(ev.action.id, {
		// 	title: {
		// 		value: 'Playback Control'
		// 	},

		// 	indicator: {
		// 		opacity: 0.3
		// 	},

		// 	icon: {
		// 		opacity: 0.3
		// 	},

		// 	value: {
		// 		value: '??:?? / ??:??',
		// 		opacity: 0.3,

		// 		font: {
		// 			size: 18
		// 		}
		// 	}
		// }).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}
}
