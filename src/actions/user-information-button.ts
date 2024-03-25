
import {
	action,
	WillDisappearEvent
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import constants from '../library/constants.js'
import images from '../library/images.js'
import wrapper from '../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.user-information-button' })
export default class UserInformationButton extends Button {
	static readonly STATABLE = true
	static readonly ACTIONLESS = true

	constructor() {
		super()
		this.setStatelessImage('images/states/user-information-unknown')
	}

	async marqueeTitle(id: string, title: string, context: string) {
		const isInitial = !this.marquees[context]

		const marqueeData = this.marquees[context] || {
			timeout: null,

			id,

			title: {
				original: title,
				render: `${title}${' '.repeat(constants.SONG_MARQUEE_SPACING * constants.SONG_MARQUEE_SPACING_MULTIPLIER)}`,
				frame: null,
				totalFrames: null
			}
		}

		if (this.marquees[context] && this.marquees[context].id !== id)
			return

		this.marquees[context] = marqueeData

		if (marqueeData.title.frame === null)
			marqueeData.title.frame = (marqueeData.title.original.length / 2) + constants.SONG_MARQUEE_SPACING

		if (marqueeData.title.totalFrames === null)
			marqueeData.title.totalFrames = marqueeData.title.render.length

		this.setTitle(context, `${this.getTextSpacingWidth(marqueeData.title.original) > constants.SONG_MARQUEE_SPACING ? `${marqueeData.title.render.slice(marqueeData.title.frame)}${marqueeData.title.render.slice(0, marqueeData.title.frame)}` : marqueeData.title.original}}`)

		if ((!this.marquees[context]) || this.marquees[context].id !== id)
			return

		marqueeData.title.frame++

		if (marqueeData.title.frame >= marqueeData.title.totalFrames)
			marqueeData.title.frame = 0

		marqueeData.timeout = setTimeout(() => this.marqueeTitle(id, marqueeData.title.original, context), isInitial ? constants.SONG_MARQUEE_INTERVAL_INITIAL : constants.SONG_MARQUEE_INTERVAL)
	}

	async #refreshUser(context: string) {
		this.setImage(context, 'images/states/pending')

		const user = await wrapper.getUser()

		if (!user) {
			this.setImage(context, 'images/states/user-information')
			this.clearMarquee(context)
			this.setTitle(context, '')
			return
		}

		const image = await images.getRaw(user.images[0]?.url)

		if (!image)
			this.setImage(context, 'images/states/user-information')
		else
			this.setImage(context, `data:image/jpeg;base64,${image}`)

		this.marqueeTitle(user.id, user.display_name, context)
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id)
	}

	onStateSettled(context: string) {
		super.onStateSettled(context)
		this.#refreshUser(context)
	}

	onStateLoss(context: string) {
		super.onStateLoss(context)
		this.clearMarquee(context)
		this.setTitle(context, '')
	}
}
