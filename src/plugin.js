import StreamDeck from '@elgato/streamdeck'
import logger from './library/logger'
import connector from './library/connector'
import actions from './library/actions'
import CacheableLookup from 'cacheable-lookup'

import {
	setGlobalDispatcher,
	Agent
} from 'undici'

const cacheable = new CacheableLookup({
	maxTtl: 60,
	errorTtl: 5,
	fallbackDuration: 0,
	order: 'ipv4first'
})

const dispatcher = new Agent({
	connect: {
		lookup: cacheable.lookup
	},

	keepAliveTimeout: 60000,
	keepAliveMaxTimeout: 120000
})

setGlobalDispatcher(dispatcher)

StreamDeck.connect().then(() => {
	logger.info('Connected to Stream Deck.')

	StreamDeck.settings.getGlobalSettings().then(settings => {
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
