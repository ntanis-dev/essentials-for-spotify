// TODO
// Better image indicators
// Better error handling, especially on promises
// Dial support
// Feedback support
// Rate limit handling
// Device hot-swapping handling

import streamDeck from '@elgato/streamdeck'
import logger from './library/logger'
import connector from './library/connector'
import actions from './library/actions'

streamDeck.connect().then(() => {
	streamDeck.client.getGlobalSettings().then(async settings => {
		if (settings.clientId && settings.clientSecret && settings.refreshToken) {
			await connector.startSetup(settings.clientId, settings.clientSecret, settings.refreshToken)
		} else {
			await connector.startSetup()
		}
	}).catch(async e => {
		await connector.startSetup()
	})

	actions.register()
})

process.on('uncaughtException', e => logger.error(`An uncaught exception occured: "${e}".`))
process.on('unhandledRejection', e => logger.error(`An unhandled promise rejection occured: "${e}".`))
