import StreamDeck, {
	WillAppearEvent,
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import logger from './../library/logger.js'

@action({ UUID: 'com.ntanis.spotify-essentials.volume-control-dial' })
export default class VolumeControlDial extends Dial {
	constructor() {
		super('volume-control-layout.json')
	}

	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)

		// StreamDeck.client.setFeedback(ev.action.id, {
		// 	title: {
		// 		value: 'Volume Control'
		// 	},

		// 	indicator: {
		// 		opacity: 0.3
		// 	},

		// 	icon: {
		// 		opacity: 0.3
		// 	},

		// 	value: {
		// 		value: '?%',
		// 		opacity: 0.3,

		// 		font: {
		// 			size: 18
		// 		}
		// 	}
		// }).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}
}
