document.addEventListener('DOMContentLoaded', () => {
	const overlay = document.getElementById('overlay')
	const albumArt = document.getElementById('album-art')
	const songName = document.getElementById('song-name')
	const artistName = document.getElementById('artist-name')
	const progressFill = document.getElementById('progress-fill')
	const timeCurrent = document.getElementById('time-current')
	const timeTotal = document.getElementById('time-total')

	let currentProgress = 0
	let currentDuration = 0
	let isPlaying = false
	let lastTimeUpdate = Date.now()
	let animationFrame = null
	let currentSongKey = null

	const params = new URLSearchParams(window.location.search)
	const layout = params.get('layout') || 'horizontal'
	const opacity = Math.max(25, parseInt(params.get('opacity')) || 100)
	const rounding = params.get('rounding')
	const timeDisplay = params.get('time') || 'progress'

	if (layout !== 'horizontal')
		document.body.classList.add(`layout-${layout}`)

	overlay.style.background = `rgba(12, 12, 12, ${opacity / 100})`

	if (rounding !== null)
		overlay.style.borderRadius = `${(rounding / 100) * 45}px`
	overlay.classList.add('idle')

	const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
	const wsUrl = `${wsProtocol}//${location.host}`

	let ws = null
	let reconnectTimeout = null

	function connect() {
		ws = new WebSocket(wsUrl)

		ws.onopen = () => {}

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data)
			handleMessage(data)
		}

		ws.onclose = () => {
			reconnectTimeout = setTimeout(connect, 3000)
		}

		ws.onerror = () => {}
	}

	function handleMessage(data) {
		switch (data.type) {
			case 'fullState':
				updateSong(data.song)
				updatePlayState(data.playing)
				if (data.song) {
					currentProgress = data.song.progress
					currentDuration = data.song.duration
					lastTimeUpdate = Date.now()
				}
				break

			case 'songChanged':
				updateSong(data.song, data.pending)
				if (data.song) {
					currentProgress = data.song.progress
					currentDuration = data.song.duration
					lastTimeUpdate = Date.now()
				}
				break

			case 'songTimeChanged':
				currentProgress = data.progress
				currentDuration = data.duration
				lastTimeUpdate = Date.now()
				break

			case 'playbackStateChanged':
				updatePlayState(data.playing)
				lastTimeUpdate = Date.now()
				break
		}
	}

	function checkMarquee(container) {
		const span = container.querySelector('span')
		if (!span) return

		container.classList.remove('marquee')
		span.style.animation = 'none'
		if (span.dataset.original) span.textContent = span.dataset.original

		requestAnimationFrame(() => {
			span.style.animation = ''

			if (container.scrollWidth > container.clientWidth) {
				const text = span.textContent
				span.dataset.original = text
				const textWidth = span.scrollWidth
				const spacer = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'
				span.textContent = text + spacer + text
				const cycleWidth = span.scrollWidth - textWidth
				const duration = cycleWidth / 30
				container.style.setProperty('--marquee-offset', `-${cycleWidth}px`)
				container.style.setProperty('--marquee-duration', `${duration}s`)
				container.classList.add('marquee')
			}
		})
	}

	function updateSong(song, pending) {
		if (!song) {
			if (pending) {
				overlay.classList.add('song-transition')
				return
			}
			overlay.classList.add('idle')
			overlay.classList.remove('active')
			currentSongKey = null
			return
		}

		overlay.classList.remove('idle')
		overlay.classList.add('active')

		const songKey = song.name + '|' + (song.artists?.join(',') || '')
		const wasTransitioning = overlay.classList.contains('song-transition')
		const isNewSong = currentSongKey !== null && currentSongKey !== songKey
		currentSongKey = songKey

		if (wasTransitioning) {
			applySongData(song)
			overlay.classList.remove('song-transition')
		} else if (isNewSong) {
			overlay.classList.add('song-transition')
			setTimeout(() => {
				applySongData(song)
				overlay.classList.remove('song-transition')
			}, 250)
		} else {
			applySongData(song)
		}
	}

	function applySongData(song) {
		const songSpan = songName.querySelector('span')
		const artistSpan = artistName.querySelector('span')

		delete songSpan.dataset.original
		delete artistSpan.dataset.original
		songSpan.textContent = song.name || 'Unknown'
		artistSpan.textContent = song.artists?.join(', ') || 'Unknown Artist'

		checkMarquee(songName)
		checkMarquee(artistName)

		if (song.albumArt && albumArt.src !== song.albumArt) {
			albumArt.style.opacity = '0'
			const img = new Image()
			img.onload = () => {
				albumArt.src = song.albumArt
				albumArt.style.opacity = '1'
			}
			img.src = song.albumArt
		} else if (!song.albumArt) {
			albumArt.src = ''
			albumArt.style.opacity = '0'
		}
	}

	function updatePlayState(playing) {
		isPlaying = playing

		if (playing)
			overlay.classList.remove('paused')
		else
			overlay.classList.add('paused')
	}

	function formatTime(ms) {
		const totalSeconds = Math.max(0, Math.floor(ms / 1000))
		const minutes = Math.floor(totalSeconds / 60)
		const seconds = totalSeconds % 60
		return `${minutes}:${seconds.toString().padStart(2, '0')}`
	}

	function tick() {
		let displayProgress

		if (isPlaying) {
			const elapsed = Date.now() - lastTimeUpdate
			displayProgress = Math.min(currentProgress + elapsed, currentDuration)
		} else {
			displayProgress = currentProgress
		}

		const percent = currentDuration > 0 ? (displayProgress / currentDuration) * 100 : 0

		progressFill.style.width = `${percent}%`

		if (timeDisplay === 'duration') {
			const remaining = Math.max(0, currentDuration - displayProgress)
			timeCurrent.textContent = `-${formatTime(remaining)}`
		} else {
			timeCurrent.textContent = formatTime(displayProgress)
		}
		timeTotal.textContent = formatTime(currentDuration)

		animationFrame = requestAnimationFrame(tick)
	}

	connect()
	tick()
})
