
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
import constants from '../library/constants.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.user-information-button' })
export default class UserInformationButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		wrapper.on('userChanged', this.#refreshUser.bind(this))
		this.setStatelessImage('images/states/user-information-unknown')
	}

	async #refreshUser(user: any, pending = false, contexts = this.contexts) {
		for (const context of contexts) {
			if ((!user) || typeof(user) !== 'object' || (this.marquees[context] && this.marquees[context].id !== user.id)) {
				images.clearRaw('userProfilePicture')
				this.clearMarquee(context)
				this.setTitle(context, '')
			}

			if (!images.isRawCached('userProfilePicture'))
				this.setImage(context, 'images/states/pending')

			if ((!user) || typeof user !== 'object') {
				if (!pending)
					this.setImage(context, 'images/states/user-information')

				return
			}

			const image = await images.getRaw(user.images.sort((a: any, b: any) => a.width - b.width)[0]?.url, 'userProfilePicture')

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

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id)
	}

	async invokeWrapperAction(context: string) {
		await this.#refreshUser(null, true, [context])
		return await wrapper.updateUser()
	}

	onStateSettled(context: string) {
		super.onStateSettled(context, true)

		if (!wrapper.user)
			wrapper.updateUser().then(() => this.#refreshUser(wrapper.user, false, [context]))
		else
			this.#refreshUser(wrapper.user, false, [context])
	}

	onStateLoss(context: string) {
		super.onStateLoss(context)
		this.clearMarquee(context)
		this.setTitle(context, '')
	}
}
