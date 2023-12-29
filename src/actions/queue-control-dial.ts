import {
	action
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

@action({ UUID: 'com.ntanis.spotify-essentials.queue-control-dial' })
export default class QueueControlDial extends Dial {
	constructor() {
		super('queue-control-layout.json', 'images/icons/queue-control.png')
	}
}
