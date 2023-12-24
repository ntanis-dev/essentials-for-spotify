import streamDeck from '@elgato/streamdeck'
import logger from './library/logger'
import connector from './library/connector'
import actions from './library/actions'

streamDeck.client.getGlobalSettings().then(settings => {
	if (settings.clientId && settings.clientSecret && settings.refreshToken) {
		logger.info('Setting up from global settings.')
		connector.setup(settings.clientId, settings.clientSecret, settings.refreshToken)
	} else {
		logger.info('No global settings found.')
		connector.setup()
	}
})

actions.register()
streamDeck.connect()

process.on('uncaughtException', e => logger.error(e))
process.on('unhandledRejection', e => logger.error(e))

logger.info('Initialized')
