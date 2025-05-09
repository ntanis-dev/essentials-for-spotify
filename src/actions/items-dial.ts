import {
	action,
	WillDisappearEvent
} from '@elgato/streamdeck'

import {
	Dial
} from './dial.js'

import constants from './../library/constants.js'
import images from './../library/images.js'
import wrapper from './../library/wrapper.js'

@action({ UUID: 'com.ntanis.essentials-for-spotify.items-dial' })
export default class ItemsDial extends Dial {
	#currentItems: any = {}
	#itemsPage: any = {}
	#items: any = []
	#lastTotal: number = 0

	async #refreshItems(context: string) {
		if (this.#itemsPage[context] === undefined)
			this.#itemsPage[context] = 1

		const apiCall = await this.fetchItems(this.#itemsPage[context])

		if ((!apiCall) || typeof apiCall !== 'object' || (apiCall.status !== constants.WRAPPER_RESPONSE_SUCCESS && apiCall.status !== constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)) {
			this.resetFeedbackLayout(context, {
				name: {
					opacity: 1.0
				},

				icon: {
					opacity: 1.0
				},

				count: {
					opacity: 1.0
				},

				extra: {
					opacity: 1.0
				}
			})

			const icon = this.getIconForStatus(typeof apiCall === 'object' ? apiCall.status : apiCall)

			if (icon)
				await this.flashIcon(context, icon)

			return
		}

		const lastTotal = this.#lastTotal

		delete apiCall.status

		this.#items = apiCall
		this.#lastTotal = this.#items.total <= constants.WRAPPER_ITEMS_PER_PAGE ? this.#items.items.length : this.#items.total

		return lastTotal !== this.#lastTotal
	}

	async #refreshPage(context: string) {
		const nameMarquee = this.getMarquee(context, 'name')

		if (nameMarquee)
			this.pauseMarquee(context, 'name')

		this.setIcon(context, 'images/icons/pending.png')
		this.#refreshCount(context)

		const refreshItems = await this.#refreshItems(context)

		if (refreshItems) {
			await this.#refreshLayout(true, context)
			return false
		}

		return true
	}

	async #refreshLayout(refreshItems = false, context: string): Promise<void> {
		const nameMarquee = this.getMarquee(context, 'name')

		if (refreshItems) {
			this.resetFeedbackLayout(context, {
				name: {
					opacity: 1.0
				},

				icon: {
					opacity: 1.0
				},

				count: {
					opacity: 1.0
				},

				opacity: {
					opacity: 1.0
				}
			})

			this.setIcon(context, 'images/icons/pending.png')

			this.#itemsPage = {}
			this.#currentItems = {}
			this.#items = {}

			await this.#refreshItems(context)

			if (this.#lastTotal === 0) {
				this.setIcon(context, this.originalIcon)

				this.setFeedback(context, {
					count: {
						value: '0 / 0'
					}
				})

				return
			}

			if (this.#currentItems[context] === undefined)
				this.#currentItems[context] = 0
		}

		if (!this.#items.items[this.#currentItems[context]])
			if (!refreshItems)
				return this.#refreshLayout(true, context)

		if (!images.isItemCached(this.#items.items[this.#currentItems[context]]))
			this.setIcon(context, 'images/icons/pending.png')

		this.setFeedback(context, {
			name: {
				opacity: 1.0
			},

			extra: {
				opacity: 1.0,
				value: this.#items.items[this.#currentItems[context]].extra ?? ''
			},

			icon: {
				opacity: 1.0
			},

			count: {
				opacity: 1.0
			}
		})

		this.#refreshCount(context)

		if (nameMarquee) {
			if (nameMarquee.original !== this.#items.items[this.#currentItems[context]].name)
				this.updateMarquee(context, 'name', this.#items.items[this.#currentItems[context]].name, this.#items.items[this.#currentItems[context]].name)

			this.resumeMarquee(context, 'name')
		} else
			this.marquee(context, 'name', this.#items.items[this.#currentItems[context]].name, this.#items.items[this.#currentItems[context]].name, 11, context)

		const image = await images.getForItem(this.#items.items[this.#currentItems[context]])

		if (image)
			this.setIcon(context, `data:image/jpeg;base64,${image}`)
		else
			this.setIcon(context, this.originalIcon)
	}

	async #refreshCount(context: string) {
		this.setFeedback(context, {
			count: {
				value: `${((this.#itemsPage[context] - 1) * constants.WRAPPER_ITEMS_PER_PAGE) + this.#currentItems[context] + 1} / ${this.#lastTotal}`
			}
		})
	}

	async invokeWrapperAction(context: string, type: symbol) {
		if (type === Dial.TYPES.ROTATE_CLOCKWISE) {
			if (this.#lastTotal <= 1)
				return constants.WRAPPER_RESPONSE_SUCCESS

			this.pauseMarquee(context, 'name')
			this.#currentItems[context]++

			if (this.#currentItems[context] >= this.#items.items.length) {
				this.#currentItems[context] = 0

				const lastPage = this.#itemsPage[context]

				if (this.#itemsPage[context] < Math.ceil(this.#lastTotal / constants.WRAPPER_ITEMS_PER_PAGE))
					this.#itemsPage[context]++
				else
					this.#itemsPage[context] = 1

				if (lastPage !== this.#itemsPage[context]) {
					this.setFeedback(context, {
						name: {
							value: '?????'
						}
					})

					if (!(await this.#refreshPage(context)))
						return constants.WRAPPER_RESPONSE_API_ERROR
				}
			}

			this.#refreshCount(context)

			await this.#refreshLayout(false, context)
		} else if (type === Dial.TYPES.ROTATE_COUNTERCLOCKWISE) {
			if (this.#lastTotal <= 1)
				return constants.WRAPPER_RESPONSE_SUCCESS

			this.pauseMarquee(context, 'name')
			this.#currentItems[context]--

			if (this.#currentItems[context] < 0) {
				const lastPage = this.#itemsPage[context]

				if (this.#itemsPage[context] > 1) {
					this.#itemsPage[context]--
					this.#currentItems[context] = constants.WRAPPER_ITEMS_PER_PAGE - 1
				} else {
					this.#itemsPage[context] = Math.ceil(this.#lastTotal / constants.WRAPPER_ITEMS_PER_PAGE)
					this.#currentItems[context] = this.#lastTotal - ((this.#itemsPage[context] - 1) * constants.WRAPPER_ITEMS_PER_PAGE) - 1
				}

				if (lastPage !== this.#itemsPage[context]) {
					this.setFeedback(context, {
						name: {
							value: '?????'
						}
					})

					if (!(await this.#refreshPage(context)))
						return constants.WRAPPER_RESPONSE_API_ERROR
				}
			}

			this.#refreshCount(context)

			await this.#refreshLayout(false, context)
		} else if (type === Dial.TYPES.TAP) {
			await this.#refreshLayout(true, context)
			return constants.WRAPPER_RESPONSE_SUCCESS
		} else if (type === Dial.TYPES.DOWN)
			return constants.WRAPPER_RESPONSE_SUCCESS
		else if (type === Dial.TYPES.UP) {
			if (this.#lastTotal === 0)
				return constants.WRAPPER_RESPONSE_NOT_AVAILABLE

			if (this.#currentItems[context] !== undefined)
				if (this.#items.items[this.#currentItems[context]]) {
					const apiCall = await wrapper.playItem(this.#items.items[this.#currentItems[context]])

					if (apiCall !== constants.WRAPPER_RESPONSE_SUCCESS && apiCall !== constants.WRAPPER_RESPONSE_SUCCESS_INDICATIVE)
						await this.#refreshLayout(true, context)
					else
						return constants.WRAPPER_RESPONSE_SUCCESS
				} else
					await this.#refreshLayout(true, context)

				return constants.WRAPPER_RESPONSE_API_ERROR
		} else
			return constants.WRAPPER_RESPONSE_NOT_AVAILABLE
	}

	async resetFeedbackLayout(context: string, feedback = {}): Promise<void> {
		super.resetFeedbackLayout(context, Object.assign({
			icon: this.originalIcon
		}, feedback))
	}

	async fetchItems(page: number): Promise<any> {
        throw new Error('The fetchItems method must be implemented in a subclass.')
	}


	async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
		await super.onWillDisappear(ev)
		this.pauseMarquee(ev.action.id, 'name')
	}

	updateFeedback(context: string): void {
		super.updateFeedback(context)
		this.#refreshLayout(this.#lastTotal === 0, context)
	}
}
