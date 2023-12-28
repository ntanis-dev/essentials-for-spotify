import logger from './logger'
import wrapper from './wrapper'

let lastSong = null
let imageCache = {}
let pendingResults = {}

wrapper.on('songChanged', (song, pending) => {
	if (lastSong)
		imageCache[`song:${lastSong.item.id}`] = null

	if (song)
		lastSong = song
})

const getForSong = async song => {
	if (imageCache[`song:${song.item.id}`])
		return imageCache[`song:${song.item.id}`]

	if (pendingResults[`song:${song.item.id}`])
		return pendingResults[`song:${song.item.id}`]

	pendingResults[`song:${song.item.id}`] = new Promise(async (resolve, reject) => {
		try {
			if (imageCache[`song:${song.item.id}`])
				return imageCache[`song:${song.item.id}`]

			const url = song.item.album.images.length > 0 ? song.item.album.images[0].url : null

			if (!url) {
				resolve(null)
				return
			}

			imageCache[`song:${song.item.id}`] = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
			resolve(imageCache[`song:${song.item.id}`])
		} catch (e) {
			logger.error(`Failed to get image for song "${song.item.id}": "${e.message}"`)
		}
	}).finally(result => {
		pendingResults[`song:${song.item.id}`] = null
		return result
	})

	return pendingResults[`song:${song.item.id}`]
}

const isSongCached = song => !!imageCache[`song:${song.item.id}`]

export default {
	getForSong,
	isSongCached
}
