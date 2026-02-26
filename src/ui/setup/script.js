document.addEventListener('DOMContentLoaded', () => {
	const params = new URLSearchParams(window.location.search)
	const mainContainer = document.querySelector('.form-container')

	let lang = params.get('lang')

	if (lang) {
		sessionStorage.setItem('lang', lang)
	} else
		lang = sessionStorage.getItem('lang') || 'en'

	const applyTranslations = t => {
		document.querySelectorAll('[data-localize]').forEach(el => {
			const key = el.getAttribute('data-localize')

			if (t[key])
				el.textContent = t[key]
		})

		document.querySelectorAll('[data-localize-html]').forEach(el => {
			const key = el.getAttribute('data-localize-html')

			if (t[key])
				el.innerHTML = t[key]
		})

		if (t.submit)
			document.querySelector('input[type="submit"]').value = t.submit

		const code = document.querySelector('#url')

		if (code)
			code.addEventListener('click', () => {
				const range = document.createRange()

				range.selectNode(code)
				window.getSelection().removeAllRanges()
				window.getSelection().addRange(range)
			})
	}

	const fetchLocale = lang =>
		fetch(`/${lang}.json`)
			.then(r => r.ok ? r.json() : Promise.reject())
			.then(data => data.Setup || {})

	const localeReady = lang !== 'en'
		? fetchLocale(lang).catch(() => fetchLocale('en')).catch(() => ({}))
		: fetchLocale('en').catch(() => ({}))

	if (params.has('success')) {
		document.querySelectorAll('.main').forEach(e => e.style.display = 'none')
		document.getElementById('success').style.display = 'block'
	} else if (params.has('error'))
		document.getElementById('error').style.display = 'block'

	Promise.all([localeReady, fetch('/port').then(r => r.text())]).then(([t, port]) => {
		applyTranslations(t)
		document.querySelectorAll('.port').forEach(e => e.textContent = port)
	}).catch(() => {}).finally(() => {
		mainContainer.style.display = 'block'
		setTimeout(() => mainContainer.classList.add('visible'), 500)
	})
})
