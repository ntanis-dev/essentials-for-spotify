import StreamDeck, {
	WillAppearEvent,
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import logger from './../library/logger.js'

@action({ UUID: 'com.ntanis.spotify-essentials.playlists-dial' })
export default class PlaylistsDial extends Dial {
	onWillAppear(ev: WillAppearEvent<any>): void {
		super.onWillAppear(ev)

		// StreamDeck.client.setFeedback(ev.action.id, {
		// 	title: {
		// 		value: 'Playlists'
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
		// 	},

		// 	value_two: {
		// 		value: '??:?? / ??:??',
		// 		opacity: 0.3,

		// 		font: {
		// 			size: 18
		// 		}
		// 	}
		// }).catch((e: any) => logger.error(`An error occurred while setting the Stream Deck feedback of "${this.manifestId}": "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
	}
}
