const API_EMPTY_RESPONSE = Symbol('API_EMPTY_RESPONSE')
const API_NOT_FOUND_RESPONSE = Symbol('API_NOT_FOUND_RESPONSE')

const WRAPPER_RESPONSE_SUCCESS = Symbol('WRAPPER_RESPONSE_SUCCESS')
const WRAPPER_RESPONSE_SUCCESS_INDICATIVE = Symbol('WRAPPER_RESPONSE_SUCCESS_INDICATIVE')
const WRAPPER_RESPONSE_API_RATE_LIMITED = Symbol('WRAPPER_RESPONSE_API_RATE_LIMITED')
const WRAPPER_RESPONSE_API_ERROR = Symbol('WRAPPER_RESPONSE_API_ERROR')
const WRAPPER_RESPONSE_FATAL_ERROR = Symbol('WRAPPER_RESPONSE_FATAL_ERROR')
const WRAPPER_RESPONSE_NO_DEVICE_ERROR = Symbol('WRAPPER_RESPONSE_NO_DEVICE_ERROR')
const WRAPPER_RESPONSE_BUSY = Symbol('WRAPPER_RESPONSE_BUSY')
const WRAPPER_RESPONSE_NOT_AVAILABLE = Symbol('WRAPPER_RESPONSE_NOT_AVAILABLE')
const WRAPPER_PLAYLISTS_PER_PAGE = 50

const BUTTON_MARQUEE_SPACING = 8
const BUTTON_MARQUEE_SPACING_MULTIPLIER = 2
const BUTTON_MARQUEE_INTERVAL = 350
const BUTTON_MARQUEE_INTERVAL_INITIAL = 750
const BUTTON_HOLD_DELAY = 500
const BUTTON_HOLD_REPEAT_INTERVAL = 250
const DIAL_MARQUEE_INTERVAL = 500
const DIAL_MARQUEE_INTERVAL_INITIAL = 750
const VOLUME_PERCENT_MUTE_RESTORE = 50
const INTERVAL_CHECK_UPDATE_PLAYBACK_STATE = 500
const SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP = 1250
const SONG_CHANGE_FORCE_UPDATE_PLAYBACK_TIME_SLEEP = 150
const INTERVAL_UPDATE_PLAYBACK_STATE = 5000
const INTERVAL_CHECK_UPDATE_SONG_TIME = 500
const CONNECTOR_DEFAULT_PORT = 6545
const LONG_FLASH_DURATION = 3000
const LONG_FLASH_TIMES = 1
const SHORT_FLASH_DURATION = 1000
const SHORT_FLASH_TIMES = 1
const VOLUME_STEP_SIZE = 5
const SEEK_STEP_SIZE = 5000

const SETUP_HTML = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Installation | Spotify Essentials</title>
		<style>
			body {
				background-color: #121212;
				color: #ffffff;
				font-family: 'Helvetica Neue', sans-serif;
			}
			
			.form-container {
				max-width: 600px;
				margin: 50px auto;
				padding: 20px 40px;
				background-color: #181818;
				border: 1px solid #282828;
				opacity: 0;
				display: none;
				transition: opacity 1.5s ease;
			}

			.form-container form {
				text-align: center;
			}

			.form-container.visible {
				opacity: 1;
			}
			
			input[type="text"], input[type="submit"] {
				box-sizing: border-box;
				width: calc(100% - 20px);
				padding: 10px;
				margin-bottom: 20px;
				background-color: #282828;
				border: 1px solid #333;
				color: #fff;
			}
			
			input[type="submit"] {
				background-color: #1db954;
				font-weight: bold;
				cursor: pointer;
			}
			
			input[type="submit"]:hover {
				background-color: #1ed760;
			}

			.instructions {
				max-width: 600px;
				margin: 20px auto;
				color: #b3b3b3;
			}

			a {
				color: #1db954;
				text-decoration: none;
				transition: color 0.3s ease, text-decoration 0.3s ease;
			}
			
			a:hover, a:focus {
				color: #1ed760;
				text-decoration: underline;
			}

			ol li {
				margin-top: 5px;
			}

			h2 {
				position: relative;
			}

			h2 img {
				position: absolute;
				top: 0;
				right: 0;
			}

			code {
				background-color: #282828;
				padding: 2px 4px;
				cursor: pointer;
			}

			::selection {
				background-color: #1db954;
				color: #fff;
			}

			::-moz-selection {
				background-color: #1db954;
				color: #fff;
			}

			::-webkit-selection {
				background-color: #1db954;
				color: #fff;
			}

			::-webkit-scrollbar {
				width: 10px;
			}

			::-webkit-scrollbar-track {
				background: #282828;
			}

			::-webkit-scrollbar-thumb {
				background: #333;
			}

			::-webkit-scrollbar-thumb:hover {
				background: #444;
			}
		</style>

		<link rel="shortcut icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAACXBIWXMAAAsTAAALEwEAmpwYAAACEElEQVRIic3WS48NURQF4K+lvQcGmCBBtFeIeAaDNhLxB8RIxIQY8Q/8CDPPhBA9M0I6IvGcGHiEbkQQNBIJIkZey+DWlVLqXn1pnV7JSar2PrXX2Wftfep0JTGaGDeqbOjuYO4i9GIZZhW2V7iPa3g4rChJ/jS2JjmXP+NCMbdtvHbOiUlODIOoipNJJnVKOD3J/b8ga2KwiPFb7K78XqXdGMDCDvStw2Mswbeysa5KT40AGfTgdNVYzbAXV4rnF7iMO3iO1/iI75iMGZiHBViHtYW9ik24+vOtssfXCw3etBK9zZiZZEeS8xU9r7fScB6eFs/vsBRfi5WvxlyN/huPD3iJQdzC7UpWq3Co+Bbm41k1wz2VlX3voCo/JzmWZFMp3t6Sf0/TXj5plldW2YUbOFto8BDvC99UjaJYgc3Yjl3FuKSh/e7a2KUVnams+maHGm5JcrHFDpxpzmt3ePfgQKHFPY1+Smk8Qh92YgL6i2y3tYn5S4YHh6HVUJInSd7V+I4kmZZkaY3vYJOnXdEkydEkK1tsoSSzk+xP8qj0zZeaOD+LplVbNLEXh7EeazAHU/C22NJ+jRaCjTiOxTUbWdsW5cbvBHdLGeyr8f/S+FXC3r8gbGIoyacae7k3a39Pff9AWkVfNf6Y+D191SiAgX8ge4ANVTKMnSvGf7tE1WnYCiNyTeyEcEQw6jfvH9bTWQ2RWcY3AAAAAElFTkSuQmCC" />
	</head>
	<body>
		<div class="form-container">
			<h2>
				Spotify Essentials

				<br />

				<small>
					<small>Installation</small>
				</small>

				<img alt="Spotify Essentials" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAYAAACohjseAAAACXBIWXMAAAsTAAALEwEAmpwYAAAE2klEQVRoge3a16sdVRQG8F/s1xZjiSVi7w0U64PGGiyoT7YnK4igoj75D/im4ouoWGJBIaCiYgMLMWKLooLXktiixBol6o3GmuXDmivx3Jkzc+fMjddLPtjMYfaevdd39lp7lZlpEWEqY53/WoCJxlqC/3dMeYLrTcCcO+EEnIq9sQs2qxg7giX4AE9iAT7pUphpHZ6iZ+IcnIFNWs7xOx7HPXisE6kiYtA2JyLmR/eYHxGnDCrfIA9Pj4i5E0CsF3MjYkZbOQfZtc/XALlRLI2I09rI2obcRRGxas3wGoNLGsrYmuBVa45LJa6Occg8nlP0Aszt5GQbHBfjriYDmxI8Bi8MItEEYLb0m33RhOAMvINZHQjVJb7Cfvih36AmodotJh852B631g2q28Hj8VzNHN9gGRbjC3yP77ASv8noZH1sgM2xFbbBzti9+L1lnaB9cAKer+qsI/g6Du259zPuw7t4s7j+OICA2+IgHFhcZ8v4tSlex+GVvX2O2JNLjuhfIuLo8RzTLdrmEXFERFwfEW80dB0nV83Xb6FHSyZ6cYLJlbXZEXFvRKzoQ/DRquerVHQWPsJGPfffw/591GVjmRptJ0/fIWl/f0h7/BFfF9cVTfRvNeyJK4rWi5VF/xe9HVX54CnGkiOP5WtxMzaVdrOPJL0X9sAWkti6Jc8HfpF54MdYhGGZD76svy1/iCulzfeenkOFzHeMXbF8a+f1V/n4PCKW1YwZL5ZGxFMRcX5E7FqlckVbVPL8vLKxVSq6qNiRtvhTquSfWCV3cwPlWlGGlXgCd+Lpnr4hfCbdy+pYLCsI/0IVwRGpgk2wDG/IaGdJ0b6S7uRX/CXtcGNsjZnYDTviEBysfwXgOdyGh6VLuV2WQ3qxQklppIpgkwD1fmkL70vn3hY74EicjuNkAFCGz2SgMKPPXNPG3GhJ8EGcVTOmDTbDHFyKk1o8P4Zg27LhRzX9Q5gu7WSr4vdQmQA9GMFDkuTxeKSlfP+g7Q4uxXl4RdrQwTKu3Fv60JlSndYr5lolo/7vpa/6sGjDWCj9ZBVOl6awQxM+Y24MYIPkTu7RcGwVPsZLmIenKtY+TZYT69A5wa4xLKsGt0hXMYpDZVBdh8YEV2hXvA18iy+lOo6mTOtIH7ilVOFZ+tv/B7gOD0h1fxhH1aw9LjfR1NEvkTY0LFOnxZLYT9LJl2G6JHqgLIUcIt1D1fybSv9Zh1JH3zZUi4h4LSI2qQmpmrZ9Iyt2bzdYtwqloVpVsP0Mzm7wj/1ccn8jeYJuV1w3lLs5IjOJ5f5tX2Sw8D5uku84LseJNeuXyTwG402XVscPMrpfIjOK3XFA8XumDM1WzyhGM4nvZNr1Kt4qBPu1ZP7LcGONDKOoTJfGm/BOBD6NiBsi1bRXhjcbzlGZ8PYjWFaymGjcGRG7FevPiYiRhs9Vlizqik4LcVgDFekSy/EajtVMPRfiiKrOLsqG/zVOwrNVnXXB9vMyhJqsmKcPOZqX7oc1C3bXJDor3S+XmcNkw7lqyNE8H1yACweRpmNcrMGbJcaX8N6Nq9tI0zGu0fDdINa+wq5qU/ojhNE2PabwZyS9uzl/AojNjw4+BOryU64z5NE9qT7l6pLgKHaSId6pMnXaxRT5GG9SYsp/L7qW4P8dU57g32HpfsMWVs1eAAAAAElFTkSuQmCC" />
			</h2>

			<div class="instructions">
				<span id="success" style="display: none">
					<span style="color: #1db954">The installation has been <b>completed successfully</b>!</span>
					<br />
					You may close this page now.
				</span>

				<ol class="main">
					<li>Navigate to <a href="https://developer.spotify.com/dashboard/create" target="_blank" rel="noopener">Create app - Spotify for Developers</a>.</li>
					<li>Set <code id="url">http://localhost:{{PORT}}</code> as <b>"Redirect URI"</b>.</li>
					<li>Tick <b>"Web API"</b> in <b>"Which API/SDKs are you planning to use?"</b>.</li>
					<li>Fill the rest of the form to your liking, <b>"Website"</b> field can be left empty.</li>
					<li>Create the app and navigate to the app's dashboard.</li>
					<li>Click <b>"Settings"</b> in the app's dashboard.</li>
					<li>Copy the <b>"Client ID"</b> to the form below.</li>
					<li>Click <b>"View client secret"</b> and copy the <b>"Client Secret"</b> to the form below.</li>
					<li>Submit the form below.</li>
				</ol>
			</div>

			<br />

			<form action="/" method="GET" class="main">
				<div id="error" style="display: none">
					<span style="color: #ff2f2f">Something went wrong!</span>
					<br />
					<small><b>Please double-check the app information and try again.</b></small>
					<br /><br><br>
				</div>

				<input type="text" id="clientId" name="clientId" placeholder="Client ID" required />
				<input type="text" id="clientSecret" name="clientSecret" placeholder="Client Secret" required />
				<input type="submit" value="Submit" />
			</form>
		</div>

		<div class="form-container" id="success">
			<h2>
				Spotify Essentials

				<br />

				<small>
					<small>Installation</small>
				</small>

				<img alt="Spotify Essentials" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAYAAACohjseAAAACXBIWXMAAAsTAAALEwEAmpwYAAAE2klEQVRoge3a16sdVRQG8F/s1xZjiSVi7w0U64PGGiyoT7YnK4igoj75D/im4ouoWGJBIaCiYgMLMWKLooLXktiixBol6o3GmuXDmivx3Jkzc+fMjddLPtjMYfaevdd39lp7lZlpEWEqY53/WoCJxlqC/3dMeYLrTcCcO+EEnIq9sQs2qxg7giX4AE9iAT7pUphpHZ6iZ+IcnIFNWs7xOx7HPXisE6kiYtA2JyLmR/eYHxGnDCrfIA9Pj4i5E0CsF3MjYkZbOQfZtc/XALlRLI2I09rI2obcRRGxas3wGoNLGsrYmuBVa45LJa6Occg8nlP0Aszt5GQbHBfjriYDmxI8Bi8MItEEYLb0m33RhOAMvINZHQjVJb7Cfvih36AmodotJh852B631g2q28Hj8VzNHN9gGRbjC3yP77ASv8noZH1sgM2xFbbBzti9+L1lnaB9cAKer+qsI/g6Du259zPuw7t4s7j+OICA2+IgHFhcZ8v4tSlex+GVvX2O2JNLjuhfIuLo8RzTLdrmEXFERFwfEW80dB0nV83Xb6FHSyZ6cYLJlbXZEXFvRKzoQ/DRquerVHQWPsJGPfffw/591GVjmRptJ0/fIWl/f0h7/BFfF9cVTfRvNeyJK4rWi5VF/xe9HVX54CnGkiOP5WtxMzaVdrOPJL0X9sAWkti6Jc8HfpF54MdYhGGZD76svy1/iCulzfeenkOFzHeMXbF8a+f1V/n4PCKW1YwZL5ZGxFMRcX5E7FqlckVbVPL8vLKxVSq6qNiRtvhTquSfWCV3cwPlWlGGlXgCd+Lpnr4hfCbdy+pYLCsI/0IVwRGpgk2wDG/IaGdJ0b6S7uRX/CXtcGNsjZnYDTviEBysfwXgOdyGh6VLuV2WQ3qxQklppIpgkwD1fmkL70vn3hY74EicjuNkAFCGz2SgMKPPXNPG3GhJ8EGcVTOmDTbDHFyKk1o8P4Zg27LhRzX9Q5gu7WSr4vdQmQA9GMFDkuTxeKSlfP+g7Q4uxXl4RdrQwTKu3Fv60JlSndYr5lolo/7vpa/6sGjDWCj9ZBVOl6awQxM+Y24MYIPkTu7RcGwVPsZLmIenKtY+TZYT69A5wa4xLKsGt0hXMYpDZVBdh8YEV2hXvA18iy+lOo6mTOtIH7ilVOFZ+tv/B7gOD0h1fxhH1aw9LjfR1NEvkTY0LFOnxZLYT9LJl2G6JHqgLIUcIt1D1fybSv9Zh1JH3zZUi4h4LSI2qQmpmrZ9Iyt2bzdYtwqloVpVsP0Mzm7wj/1ccn8jeYJuV1w3lLs5IjOJ5f5tX2Sw8D5uku84LseJNeuXyTwG402XVscPMrpfIjOK3XFA8XumDM1WzyhGM4nvZNr1Kt4qBPu1ZP7LcGONDKOoTJfGm/BOBD6NiBsi1bRXhjcbzlGZ8PYjWFaymGjcGRG7FevPiYiRhs9Vlizqik4LcVgDFekSy/EajtVMPRfiiKrOLsqG/zVOwrNVnXXB9vMyhJqsmKcPOZqX7oc1C3bXJDor3S+XmcNkw7lqyNE8H1yACweRpmNcrMGbJcaX8N6Nq9tI0zGu0fDdINa+wq5qU/ojhNE2PabwZyS9uzl/AojNjw4+BOryU64z5NE9qT7l6pLgKHaSId6pMnXaxRT5GG9SYsp/L7qW4P8dU57g32HpfsMWVs1eAAAAAElFTkSuQmCC" />
			</h2>

			<div class="instructions">
			</div>
		</div>

		<script type="text/javascript">
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
		</script>
	</body>
	</html>
`

const CONNECTOR_DEFAULT_SCOPES = [
	'user-read-currently-playing',
	'user-read-playback-state',
	'user-modify-playback-state',
	'user-read-private',
	'user-library-read',
	'user-library-modify',
	'playlist-read-private'
]

const CHARACTER_WIDTH_MAP = {
	'A': 1,
	'B': 0.9,
	'C': 0.9,
	'D': 1,
	'E': 0.9,
	'F': 0.8,
	'G': 1,
	'H': 1,
	'I': 0.4,
	'J': 0.7,
	'K': 0.9,
	'L': 0.8,
	'M': 1.2,
	'N': 1,
	'O': 1,
	'P': 0.9,
	'Q': 1,
	'R': 0.9,
	'S': 0.9,
	'T': 0.9,
	'U': 1,
	'V': 1,
	'W': 1.3,
	'X': 0.9,
	'Y': 0.9,
	'Z': 0.9,
	'a': 0.9,
	'b': 0.9,
	'c': 0.8,
	'd': 0.9,
	'e': 0.9,
	'f': 0.5,
	'g': 0.9,
	'h': 0.9,
	'i': 0.4,
	'j': 0.5,
	'k': 0.8,
	'l': 0.4,
	'm': 1.4,
	'n': 0.9,
	'o': 0.9,
	'p': 0.9,
	'q': 0.9,
	'r': 0.6,
	's': 0.8,
	't': 0.6,
	'u': 0.9,
	'v': 0.8,
	'w': 1.2,
	'x': 0.8,
	'y': 0.8,
	'z': 0.8,
	' ': 0.5,
	'.': 0.4,
	',': 0.4,
	'!': 0.4,
	'?': 0.6,
	':': 0.4,
	';': 0.4,
	'-': 0.5,
	'_': 0.9,
	'+': 0.9,
	'=': 0.9,
	'/': 0.8,
	'\\': 0.8,
	'|': 0.4,
	'(': 0.5,
	')': 0.5,
	'[': 0.5,
	']': 0.5,
	'{': 0.6,
	'}': 0.6,
	'<': 0.9,
	'>': 0.9,
	'@': 1.3,
	'#': 1,
	'$': 0.9,
	'%': 1.3,
	'^': 0.7,
	'&': 1,
	'*': 0.6,
	'~': 0.7,
	'`': 0.4,
	'1': 0.7,
	'2': 0.7,
	'3': 0.7,
	'4': 0.7,
	'5': 0.7,
	'6': 0.7,
	'7': 0.7,
	'8': 0.7,
	'9': 0.7,
	'0': 0.7
}

class ApiError extends Error {
	constructor(status, message) {
		super(message)
		this.status = status
	}
}

class NoDeviceError extends Error {
	constructor(message) {
		super(message)
	}
}

export default {
	CHARACTER_WIDTH_MAP,
	CONNECTOR_DEFAULT_SCOPES,
	API_EMPTY_RESPONSE,
	API_NOT_FOUND_RESPONSE,
	VOLUME_PERCENT_MUTE_RESTORE,
	INTERVAL_CHECK_UPDATE_PLAYBACK_STATE,
	BUTTON_MARQUEE_INTERVAL,
	BUTTON_MARQUEE_SPACING,
	BUTTON_MARQUEE_INTERVAL_INITIAL,
	BUTTON_MARQUEE_SPACING_MULTIPLIER,
	INTERVAL_UPDATE_PLAYBACK_STATE,
	SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP,
	SONG_CHANGE_FORCE_UPDATE_PLAYBACK_TIME_SLEEP,
	CONNECTOR_DEFAULT_PORT,
	WRAPPER_RESPONSE_SUCCESS,
	WRAPPER_RESPONSE_API_ERROR,
	WRAPPER_RESPONSE_FATAL_ERROR,
	WRAPPER_RESPONSE_BUSY,
	BUTTON_HOLD_DELAY,
	BUTTON_HOLD_REPEAT_INTERVAL,
	LONG_FLASH_DURATION,
	LONG_FLASH_TIMES,
	SHORT_FLASH_DURATION,
	SHORT_FLASH_TIMES,
	INTERVAL_CHECK_UPDATE_SONG_TIME,
	VOLUME_STEP_SIZE,
	SEEK_STEP_SIZE,
	DIAL_MARQUEE_INTERVAL,
	DIAL_MARQUEE_INTERVAL_INITIAL,
	WRAPPER_RESPONSE_NOT_AVAILABLE,
	WRAPPER_RESPONSE_SUCCESS_INDICATIVE,
	WRAPPER_RESPONSE_NO_DEVICE_ERROR,
	WRAPPER_RESPONSE_API_RATE_LIMITED,
	WRAPPER_PLAYLISTS_PER_PAGE,
	SETUP_HTML,
	ApiError,
	NoDeviceError
}
