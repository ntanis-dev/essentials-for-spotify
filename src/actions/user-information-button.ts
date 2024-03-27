
import {
	action,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import connector from '../library/connector.js'
import images from '../library/images.js'
import wrapper from '../library/wrapper.js'

@action({ UUID: 'com.ntanis.spotify-essentials.user-information-button' })
export default class UserInformationButton extends Button {
	static readonly STATABLE = true
	static readonly ACTIONLESS = true

	constructor() {
		super()
		wrapper.on('userChanged', this.#refreshUser.bind(this))
		this.setStatelessImage('images/states/user-information-unknown')
	}

	async #refreshUser(user: any, contexts = this.contexts) {
		for (const context of contexts) {
			if ((!user) || typeof(user) !== 'object' || (this.marquees[context] && this.marquees[context].id !== user.id))
				images.clearRaw('userProfilePicture')

			if (!images.isRawCached('userProfilePicture'))
				this.setImage(context, 'images/states/pending')

			if ((!user) || typeof user !== 'object') {
				this.setImage(context, 'images/states/user-information')
				this.clearMarquee(context)
				this.setTitle(context, '')
				images.clearRaw('userProfilePicture')
				return
			}

			const image = await images.getRaw(user.images[0]?.url, 'userProfilePicture')

			if (!image)
				this.setImage(context, 'images/states/user-information')
			else
				this.setImage(context, `data:image/jpeg;base64,${image}`)

			if ((!this.marquees[context]) || this.marquees[context].id !== user.id)
				this.marqueeTitle(user.id, [
					{
						key: 'display_name',
						value: user.display_name || user.id
					}
				], context)
			else
				this.resumeMarquee(context)
		}
	}

	async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
		await super.onWillAppear(ev)

		if (connector.set)
			this.#refreshUser(wrapper.user, [ev.action.id])
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id)
	}

	onStateSettled(context: string) {
		super.onStateSettled(context)
		this.#refreshUser(wrapper.user, [context])
	}

	onStateLoss(context: string) {
		super.onStateLoss(context)
		this.clearMarquee(context)
		this.setTitle(context, '')
	}
}
