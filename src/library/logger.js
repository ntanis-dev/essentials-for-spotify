import StreamDeck, {
	LogLevel
} from '@elgato/streamdeck'

export default StreamDeck.logger.setLevel(LogLevel.INFO).createScope('Essentials for Spotify')
