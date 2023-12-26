const API_EMPTY_RESPONSE = Symbol('API_EMPTY_RESPONSE')
const API_NOT_FOUND_RESPONSE = Symbol('API_NOT_FOUND_RESPONSE')

const WRAPPER_RESPONSE_SUCCESS = Symbol('WRAPPER_RESPONSE_SUCCESS')
const WRAPPER_RESPONSE_ERROR = Symbol('WRAPPER_RESPONSE_ERROR')
const WRAPPER_RESPONSE_PENDING = Symbol('WRAPPER_RESPONSE_PENDING')

const TITLE_MARQUEE_SPACING = 8
const TITLE_MARQUEE_SPACING_MULTIPLIER = 2
const TITLE_MARQUEE_INTERVAL = 350
const TITLE_MARQUEE_INTERVAL_INITIAL = 750
const VOLUME_PERCENT_MUTE_RESTORE = 50
const INTERVAL_CHECK_UPDATE_PLAYBACK_STATE = 500
const SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP = 750
const INTERVAL_UPDATE_PLAYBACK_STATE = 5000
const BUTTON_HOLD_DELAY = 500
const BUTTON_HOLD_REPEAT_INTERVAL = 250
const CONNECTOR_DEFAULT_PORT = 4202
const LONG_FLASH_DURATION = 3000
const LONG_FLASH_TIMES = 1
const SHORT_FLASH_DURATION = 1500
const SHORT_FLASH_TIMES = 1

const CONNECTOR_DEFAULT_SCOPES = [
	'user-read-playback-state',
	'user-modify-playback-state',
	'user-library-modify'
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
	'1': 0.6,
	'2': 0.9,
	'3': 0.9,
	'4': 0.9,
	'5': 0.9,
	'6': 0.9,
	'7': 0.9,
	'8': 0.9,
	'9': 0.9,
	'0': 0.9
}

export default {
	CHARACTER_WIDTH_MAP,
	TITLE_MARQUEE_SPACING,
	CONNECTOR_DEFAULT_SCOPES,
	API_EMPTY_RESPONSE,
	API_NOT_FOUND_RESPONSE,
	VOLUME_PERCENT_MUTE_RESTORE,
	INTERVAL_CHECK_UPDATE_PLAYBACK_STATE,
	TITLE_MARQUEE_INTERVAL,
	TITLE_MARQUEE_INTERVAL_INITIAL,
	TITLE_MARQUEE_SPACING_MULTIPLIER,
	INTERVAL_UPDATE_PLAYBACK_STATE,
	SONG_CHANGE_FORCE_UPDATE_PLAYBACK_STATE_SLEEP,
	CONNECTOR_DEFAULT_PORT,
	WRAPPER_RESPONSE_SUCCESS,
	WRAPPER_RESPONSE_ERROR,
	WRAPPER_RESPONSE_PENDING,
	BUTTON_HOLD_DELAY,
	BUTTON_HOLD_REPEAT_INTERVAL,
	LONG_FLASH_DURATION,
	LONG_FLASH_TIMES,
	SHORT_FLASH_DURATION,
	SHORT_FLASH_TIMES
}
