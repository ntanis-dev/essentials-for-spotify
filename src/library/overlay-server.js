import StreamDeck from '@elgato/streamdeck'
import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'node:http'
import wrapper from './wrapper'
import connector from './connector'
import constants from './constants'
import logger from './logger'

class OverlayServer {
	#server = null
	#wss = null
	#port = null
	#subscribed = false
	#app = null

	start() {
		this.#app = express()

		this.#app.use((req, res, next) => {
			if (req.path.endsWith('.html')) {
				res.status(404).send()
				return
			}

			next()
		})

		this.#app.use(express.static('./bin/overlay', {
			index: false
		}))

		this.#app.get('/', (req, res) => res.sendFile('./index.html', {
			root: './bin/overlay'
		}))

		this.#app.get('/status', (req, res) => res.json({
			connected: connector.set,
			clients: this.#wss?.clients?.size ?? 0,
			port: this.#port
		}))

		if (!this.#subscribed) {
			this.#subscribeToEvents()
			this.#subscribed = true
		}

		this.#listenWithRetry()
	}

	#listenWithRetry(attempt = 0) {
		const port = constants.OVERLAY_DEFAULT_PORT + attempt

		this.#server = http.createServer(this.#app)

		this.#wss = new WebSocketServer({
			server: this.#server
		})

		this.#wss.on('connection', ws => {
			logger.info('Overlay server: new WebSocket client connected.')

			ws.send(JSON.stringify(this.#buildFullState()))

			ws.on('error', (err) => logger.error(`Overlay server WebSocket error: "${err.message}"`))
		})

		this.#server.on('error', err => {
			if (err.code === 'EADDRINUSE' && attempt < constants.PORT_RETRY_RANGE) {
				logger.warn(`Port "${port}" in use, trying "${port + 1}".`)
				this.#listenWithRetry(attempt + 1)
			} else
				logger.error(`Failed to start overlay server: "${err.message || 'No message.'}"`)
		})

		this.#server.listen(port, () => {
			this.#port = port
			logger.info(`Overlay server listening on port "${port}".`)

			StreamDeck.settings.getGlobalSettings().then(settings => {
				StreamDeck.settings.setGlobalSettings({
					...settings,
					overlayPort: port
				})
			}).catch(e => logger.error(`An error occured while updating overlay port in global settings: "${e.message || 'No message.'}".`))
		})
	}

	#subscribeToEvents() {
		connector.on('setupStateChanged', state => this.#broadcast({
			type: 'setupStateChanged',
			connected: state
		}))

		wrapper.on('songChanged', (song, pending) => this.#broadcast({
			type: 'songChanged',
			song: song ? this.#sanitizeSong(song) : null,
			pending
		}))

		wrapper.on('songTimeChanged', (progress, duration, pending) => this.#broadcast({
			type: 'songTimeChanged',
			progress,
			duration,
			pending
		}))

		wrapper.on('playbackStateChanged', playing => this.#broadcast({
			type: 'playbackStateChanged',
			playing
		}))

		wrapper.on('songLikedStateChanged', (liked, pending) => this.#broadcast({
			type: 'songLikedStateChanged',
			liked,
			pending
		}))

		wrapper.on('shuffleStateChanged', state => this.#broadcast({
			type: 'shuffleStateChanged',
			shuffle: state
		}))

		wrapper.on('repeatStateChanged', state => this.#broadcast({
			type: 'repeatStateChanged',
			repeat: state
		}))

		wrapper.on('volumePercentChanged', percent => this.#broadcast({
			type: 'volumePercentChanged',
			volume: percent
		}))

		wrapper.on('playbackContextChanged', context => this.#broadcast({
			type: 'playbackContextChanged',

			context: context ? {
				type: context.type,
				title: context.title,
				subtitle: context.subtitle,
				uri: context.uri
			} : null
		}))
	}

	#buildFullState() {
		const song = wrapper.song

		return {
			type: 'fullState',
			connected: connector.set,
			playing: wrapper.playing ?? false,
			song: song ? this.#sanitizeSong(song) : null,
			repeat: wrapper.repeatState ?? 'off',
			shuffle: wrapper.shuffleState ?? false,
			volume: wrapper.volumePercent,

			context: wrapper.playbackContext ? {
				type: wrapper.playbackContext.type,
				title: wrapper.playbackContext.title,
				subtitle: wrapper.playbackContext.subtitle,
				uri: wrapper.playbackContext.uri
			} : null
		}
	}

	#sanitizeSong(song) {
		return {
			name: song.item?.name ?? null,
			artists: song.item?.artists?.map(a => a.name) ?? [],
			albumArt: song.item?.album?.images?.length > 0 ? song.item.album.images.sort((a, b) => b.width - a.width)[0].url : null,
			duration: song.item?.duration_ms ?? 0,
			progress: song.progress ?? 0,
			liked: song.liked ?? false,
			explicit: song.item?.explicit ?? false
		}
	}

	#broadcast(message) {
		if (!this.#wss)
			return

		const data = JSON.stringify(message)

		for (const client of this.#wss.clients)
			if (client.readyState === 1)
				client.send(data)
	}
}

export default new OverlayServer()
