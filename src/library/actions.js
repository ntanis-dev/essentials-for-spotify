import streamDeck from '@elgato/streamdeck'
import logger from './logger'

import { PlayButton } from './../actions/play-button'
import { PauseButton } from './../actions/pause-button'
import { SetupButton } from './../actions/setup-button'

const register = () => {
	streamDeck.actions.registerAction(new PlayButton())
	streamDeck.actions.registerAction(new PauseButton())
	streamDeck.actions.registerAction(new SetupButton())
	logger.info('Registered actions.')
}

export default {
	register
}
