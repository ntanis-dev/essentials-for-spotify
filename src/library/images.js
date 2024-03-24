import logger from './logger'
import wrapper from './wrapper'

let lastSong = null
let imageCache = {}
let pendingResults = {}

wrapper.on('songChanged', (song, pending) => {
	if (lastSong)
		delete imageCache[`song:${lastSong.item.id}`]

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

			const url = song.item.album.images.length > 0 ? song.item.album.images[0].url : undefined

			if (!url) {
				resolve(null)
				return
			}

			imageCache[`song:${song.item.id}`] = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
			resolve(imageCache[`song:${song.item.id}`])
		} catch (e) {
			logger.error(`Failed to get image for song "${song.item.id}": "${e.message}"`)
			resolve(null)
		}
	}).finally(result => {
		delete pendingResults[`song:${song.item.id}`]
		return result
	})

	return pendingResults[`song:${song.item.id}`]
}

const isSongCached = song => !!imageCache[`song:${song.item.id}`]

const getForPlaylist = async playlist => {
	if (imageCache[`playlist:${playlist.id}`])
		return imageCache[`playlist:${playlist.id}`]

	if (pendingResults[`playlist:${playlist.id}`])
		return pendingResults[`playlist:${playlist.id}`]

	pendingResults[`playlist:${playlist.id}`] = new Promise(async (resolve, reject) => {
		try {
			if (imageCache[`playlist:${playlist.id}`])
				return imageCache[`playlist:${playlist.id}`]

			const url = playlist.images.length > 0 ? playlist.images[0].url : undefined

			if (!url) {
				resolve(null)
				return
			}

			imageCache[`playlist:${playlist.id}`] = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
			resolve(imageCache[`playlist:${playlist.id}`])
		} catch (e) {
			logger.error(`Failed to get image for playlist "${playlist.id}": "${e.message}"`)
			resolve(null)
		}
	}).finally(result => {
		delete pendingResults[`playlist:${playlist.id}`]
		return result
	})

	return pendingResults[`playlist:${playlist.id}`]
}

const isPlaylistCached = playlist => !!imageCache[`playlist:${playlist.id}`]

export default {
	getForSong,
	getForPlaylist,
	isSongCached,
	isPlaylistCached
}
