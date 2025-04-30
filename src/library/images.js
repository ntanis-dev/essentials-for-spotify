import constants from './constants'
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

const getForItem = async item => {
	if (Object.keys(imageCache).length > constants.WRAPPER_ITEMS_PER_PAGE)
		imageCache = Object.keys(imageCache).reduce((acc, key) => {
			if (!key.startsWith('item:'))
				acc[key] = imageCache[key]

			return acc
		}, {})

	if (imageCache[`item:${item.id}`])
		return imageCache[`item:${item.id}`]

	if (pendingResults[`item:${item.id}`])
		return pendingResults[`item:${item.id}`]

	pendingResults[`item:${item.id}`] = new Promise(async (resolve, reject) => {
		try {
			if (imageCache[`item:${item.id}`])
				return imageCache[`item:${item.id}`]

			const url = item.images.length > 0 ? item.images[0].url : undefined

			if (!url) {
				resolve(null)
				return
			}

			imageCache[`item:${item.id}`] = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
			resolve(imageCache[`item:${item.id}`])
		} catch (e) {
			logger.error(`Failed to get image for item "${item.id}": "${e.message}"`)
			resolve(null)
		}
	}).finally(result => {
		delete pendingResults[`item:${item.id}`]
		return result
	})

	return pendingResults[`item:${item.id}`]
}

const isItemCached = item => !!imageCache[`item:${item.id}`]

const getRaw = async (url, cacheKey) => {
	try {
		if (imageCache[cacheKey])
			return imageCache[cacheKey]

		imageCache[cacheKey] = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
		return imageCache[cacheKey]
	} catch (e) {
		logger.error(`Failed to get image for URL "${url}": "${e.message}"`)
		return null
	}
}

const clearRaw = cacheKey => {
	delete imageCache[cacheKey]
}

const isRawCached = cacheKey => !!imageCache[cacheKey]

export default {
	getRaw,
	getForSong,
	getForItem,
	clearRaw,
	isSongCached,
	isItemCached,
	isRawCached
}
