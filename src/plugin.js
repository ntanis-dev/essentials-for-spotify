import streamDeck from '@elgato/streamdeck'
import logger from './library/logger'
import connector from './library/connector'
import actions from './library/actions'

connector.setup('6c63d804d24c433d97128decba728e4b', 'ea144e9bb55b4fcaba380709ced20afc')

actions.register()
streamDeck.connect()

process.on('uncaughtException', e => logger.error(e))
process.on('unhandledRejection', e => logger.error(e))

logger.info('Initialized')
