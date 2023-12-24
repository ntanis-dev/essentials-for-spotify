import streamDeck, {
	LogLevel
} from '@elgato/streamdeck'

streamDeck.logger.setLevel(LogLevel.TRACE)

export default streamDeck.logger.createScope('Spotify Essentials')
