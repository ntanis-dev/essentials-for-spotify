import StreamDeck from '@elgato/streamdeck'
import logger from './library/logger'
import connector from './library/connector'
import actions from './library/actions'
import CacheableLookup from 'cacheable-lookup'
import http from 'node:http'
import https from 'node:https'

const cacheable = new CacheableLookup({
	maxTtl: 60,
	errorTtl: 5,
	fallbackDuration: 0,
	order: 'ipv4first'
})

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

http.globalAgent.keepAlive = true
https.globalAgent.keepAlive = true
https.globalAgent.keepAliveMsecs = 60000

cacheable.install(http.globalAgent)
cacheable.install(https.globalAgent)

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
