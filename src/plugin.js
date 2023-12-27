// TODO
// Dial support
// Feedback support
// Rate limit handling
// Device hot-swapping handling
// Disable song-based buttons when something non-song is playing

import StreamDeck from '@elgato/streamdeck'
import logger from './library/logger'
import connector from './library/connector'
import actions from './library/actions'

StreamDeck.connect().then(() => {
	logger.info('Connected to Stream Deck.')

	StreamDeck.client.getGlobalSettings().then(async settings => {
		if (settings.clientId && settings.clientSecret && settings.refreshToken) {
			logger.info('Found global settings.')
			connector.startSetup(settings.clientId, settings.clientSecret, settings.refreshToken)
		} else {
			logger.info('No global settings found.')
			connector.startSetup()
		}
	}).catch(e => {
		logger.error(`An error occurred while getting the Stream Deck global settings: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`)
		connector.startSetup()
	})

	actions.register()
}).catch(e => logger.error(`An error occured while connecting to Stream Deck: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))

process.on('uncaughtException', e => logger.error(`An uncaught exception occured: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
process.on('unhandledRejection', e => logger.error(`An unhandled promise rejection occured: "${e.message || 'No message.'}" @ "${e.stack || 'No stack trace.'}".`))
