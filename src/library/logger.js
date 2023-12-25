import streamDeck, {
	LogLevel
} from '@elgato/streamdeck'

streamDeck.logger.setLevel(LogLevel.INFO)

export default streamDeck.logger.createScope('Spotify Essentials')
