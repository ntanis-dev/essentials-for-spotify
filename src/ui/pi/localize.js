(() => {
	const LANG_MAP = {
		'zh-cn': 'zh_CN',
		'zh-tw': 'zh_TW'
	}

	let strings = null

	window.t = key => (strings && strings[key]) || key

	const originalConnect = window.connectElgatoStreamDeckSocket

	window.connectElgatoStreamDeckSocket = (port, uuid, event, info, actionInfo) => {
		let lang = 'en'

		try {
			const parsed = JSON.parse(info)

			lang = parsed.application?.language || 'en'
			lang = LANG_MAP[lang.toLowerCase()] || lang.split('-')[0]
		} catch {}

		if (window.SDPIComponents?.i18n) {
			SDPIComponents.i18n.language = lang

			const retrigger = (el, attr) => {
				const value = el.getAttribute(attr)

				if (value) {
					el.removeAttribute(attr)
					el.setAttribute(attr, value)
				}
			}

			document.querySelectorAll('sdpi-item[label]').forEach(el => retrigger(el, 'label'))
			document.querySelectorAll('sdpi-select[placeholder]').forEach(el => retrigger(el, 'placeholder'))
			document.querySelectorAll('sdpi-textfield[placeholder]').forEach(el => retrigger(el, 'placeholder'))

			document.querySelectorAll('sdpi-select, sdpi-checkbox-list').forEach(el => {
				const dummy = document.createElement('option')

				el.appendChild(dummy)
				el.removeChild(dummy)
			})
		}

		if (originalConnect)
			originalConnect(port, uuid, event, info, actionInfo)

		const locales = window.__PI_LOCALES__ || window.SDPIComponents?.i18n?.locales

		if (locales)
			strings = locales[lang] || locales['en'] || {}

		localizePI()
	}

	const localizePI = () => {
		if (!strings)
			return

		document.querySelectorAll('.section-heading').forEach(el => {
			const key = el.textContent.trim()

			if (strings[key])
				el.textContent = strings[key]
		})

		document.querySelectorAll('.sdpi-item-label').forEach(el => {
			const key = el.textContent.trim()

			if (strings[key])
				el.textContent = strings[key]
		})

		document.dispatchEvent(new Event('localized'))
	}
})()
