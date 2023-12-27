import StreamDeck, {
	LogLevel
} from '@elgato/streamdeck'

export default StreamDeck.logger.setLevel(LogLevel.DEBUG).createScope('Spotify Essentials')
