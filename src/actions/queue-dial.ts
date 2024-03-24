import {
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

@action({ UUID: 'com.ntanis.spotify-essentials.queue-dial' })
export default class QueueDial extends Dial {
	constructor() {
		super('queue-layout.json', 'images/icons/queue.png')
	}
}
