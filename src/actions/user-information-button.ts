
import {
	action,
	WillDisappearEvent,
} from '@elgato/streamdeck'

import {
	Button
} from './button.js'

import images from '../library/images.js'
import wrapper from '../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.user-information-button' })
export default class UserInformationButton extends Button {
	static readonly STATABLE = true

	constructor() {
		super()
		wrapper.on('userChanged', this.#refreshUser.bind(this))
		this.setStatelessImage('images/states/user-information-unknown')
	}

	async #refreshUser(user: any, pending = false, contexts = this.contexts, force = false) {
		const promises = []

		for (const context of contexts)
			promises.push(new Promise(async (resolve) => {
				if ((!user) || typeof(user) !== 'object' || (this.marquees[context] && this.marquees[context].id !== user.id)) {
					images.clearRaw('userProfilePicture')
					this.clearMarquee(context)
					await this.setTitle(context, '')
				} else if (force) {
					this.clearMarquee(context)
					await this.setTitle(context, '')
				}

				if (!images.isRawCached('userProfilePicture'))
					await this.setImage(context, 'images/states/pending')

				if ((!user) || typeof user !== 'object') {
					if (!pending)
						await this.setImage(context, 'images/states/user-information')

					resolve(true)

					return
				}

				const imageUrl = user.images?.length > 0 ? user.images.sort((a: any, b: any) => a.width - b.width)[0]?.url : undefined
				const image = imageUrl ? await images.getRaw(imageUrl, 'userProfilePicture') : null

				if (!image)
					await this.setImage(context, 'images/states/user-information')
				else
					await this.setImage(context, `data:image/jpeg;base64,${image}`)

				if (this.settings[context].show?.includes('display_name'))
					if ((!this.marquees[context]) || this.marquees[context].id !== user.id || force)
						await this.marqueeTitle(user.id, [
							{
								key: 'display_name',
								value: user.display_name || user.id
							}
						], context)
					else
						this.resumeMarquee(context)

				resolve(true)
			}))

		await Promise.allSettled(promises)
	}

	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		await super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id)
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Button.TYPES.RELEASED)
			return

		await this.#refreshUser(null, true, [context])
		return await wrapper.updateUser()
	}

	async onSettingsUpdated(context: string, oldSettings: any): Promise<void> {
		await super.onSettingsUpdated(context, oldSettings)
		
		if (!this.settings[context].show)
			await this.setSettings(context, {
				show: ['display_name']
			})

		if (oldSettings.show?.length !== this.settings[context].show?.length || (oldSettings.show && this.settings[context].show && (!oldSettings.show.every((value: any, index: number) => value === this.settings[context].show[index]))))
			await this.#refreshUser(wrapper.user, false, [context], true)
	}

	async onStateSettled(context: string) {
		await super.onStateSettled(context, true)

		if (!wrapper.user)
			await wrapper.updateUser().then(() => this.#refreshUser(wrapper.user, false, [context]))
		else
			await this.#refreshUser(wrapper.user, false, [context])
	}

	async onStateLoss(context: string) {
		await super.onStateLoss(context)

		this.clearMarquee(context)
		
		await this.setTitle(context, '')
	}
}
