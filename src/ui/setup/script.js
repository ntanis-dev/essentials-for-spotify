document.addEventListener('DOMContentLoaded', () => {
	const params = new URLSearchParams(window.location.search)
	const mainContainer = document.querySelector('.form-container')
	const code = document.querySelector('#url')

	code.addEventListener('click', () => {
		const range = document.createRange()
		range.selectNode(code)
		window.getSelection().removeAllRanges()
		window.getSelection().addRange(range)
	})

	mainContainer.style.display = 'block'

	setTimeout(() => mainContainer.classList.add('visible'), 500)

	if (params.has('success')) {
		document.querySelectorAll('.main').forEach(e => e.style.display = 'none')
		document.getElementById('success').style.display = 'block'
	} else if (params.has('error'))
		document.getElementById('error').style.display = 'block'
})
