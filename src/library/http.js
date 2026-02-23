import fs from 'node:fs'
import path from 'node:path'

import {
	URL
} from 'node:url'

const MIME_TYPES = {
	'.html': 'text/html',
	'.css': 'text/css',
	'.js': 'application/javascript',
	'.json': 'application/json',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon'
}

export function serveStatic(root) {
	const absRoot = path.resolve(root)

	return (pathname, res) => {
		if (pathname === '/' || pathname.endsWith('.html'))
			return false

		const filePath = path.join(absRoot, pathname)

		if (!filePath.startsWith(absRoot))
			return false

		try {
			const stat = fs.statSync(filePath)

			if (!stat.isFile())
				return false
		} catch {
			return false
		}

		const ext = path.extname(filePath)

		res.writeHead(200, {
			'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
		})

		fs.createReadStream(filePath).pipe(res)

		return true
	}
}

export function sendFile(res, filePath) {
	const resolved = path.resolve(filePath)
	const ext = path.extname(resolved)

	res.writeHead(200, {
		'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
	})

	fs.createReadStream(resolved).pipe(res)
}

export function sendJson(res, data) {
	const body = JSON.stringify(data)

	res.writeHead(200, {
		'Content-Type': 'application/json'
	})

	res.end(body)
}

export function redirect(res, url) {
	res.writeHead(302, {
		'Location': url
	})

	res.end()
}

export function send(res, status, text = '') {
	res.writeHead(status, {
		'Content-Type': 'text/plain'
	})

	res.end(text)
}

export function parseQuery(url) {
	const parsed = new URL(url, 'http://127.0.0.1')
	return Object.fromEntries(parsed.searchParams)
}

export function parsePath(url) {
	return new URL(url, 'http://127.0.0.1').pathname
}

export function parseFormBody(req) {
	return new Promise((resolve, reject) => {
		let body = ''

		req.on('data', chunk => body += chunk)
		req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(body))))
		req.on('error', reject)
	})
}
