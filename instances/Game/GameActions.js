import Basic from './Basic.js'
import $Cards from '../../constants/cards.js'
import { delay } from '../../utils/common.js'

// 游戏具体实现类
class GameActions {
	basic = null
	selectingColorPromise = null
	doubtPromise = null
	replayPromise = null
	overlayCards = [] // 叠加牌池

	constructor() {
		this.basic = new Basic()
		this.basic.setDeckCards($Cards.normal)
		this.initEmitter()
	}

	initEmitter() {
		this.basic.on('direction-changed', (direction) => {
			this.basic.boardcast({
				to: this.basic.players,
				event: 'direction-changed',
				data: direction
			})
		})

		this.basic.on('currentplayer-changed', (currentPlayer) => {
			this.basic.boardcast({
				to: this.basic.players,
				event: 'currentplayer-changed',
				data: {
					currentPlayer,
					actionState: this.basic.getActionState(currentPlayer)
				}
			})
		})
	}

	transformUsers(users) {
		// 用户转换成玩家
		this.basic.setPlayers(users)
	}

	startGameDeal(initCardsCount) {
		// 开局发牌
		return new Promise(async (resolve) => {
			const players = this.basic.players
			for (let i = 0; i < players.length; i++) {
				await this.deal({
					to: players[i],
					cards: this.basic.getRandomCards(initCardsCount)
				})
			}

			await delay(1000)

			return resolve()
		})
	}

	// 开局抽一张
	drawStartCard() {
		let randomCard
		do {
			[randomCard] = this.basic.getRandomCards(1)
		} while (randomCard.color === 'any')
		this.hit({ cards: randomCard })
	}

	/**
	 * 给某个玩家发一张牌
	 * @property {Player} to 接收玩家
	 * @property {Card[]} cards 要发的牌 
	 */
	async deal(options) {
		this.basic.addCards({
			player: options.to,
			cards: options.cards
		})

		// 一旦摸牌就取消uno状态
		this.setUnoState({ player: options.to, isUno: false })

		for (let i = 0; i < options.cards.length; i++) {
			// 给全部玩家通知要发牌给谁
			this.basic.boardcast({
				to: this.basic.players,
				event: 'deal',
				data: {
					to: options.to,
					card: options.cards[i],
				}
			})
			await delay(200)
		}
	}

	/**
	 * 某玩家打出牌
	 * @property {Player} from 出牌玩家
	 * @property {Card[]} cards 要出的牌 
	 */
	async hit(options) {
		if (options.from) {
			this.basic.removeCards({
				from: options.from,
				cards: options.cards
			})
		}

		this.basic.addPassCards(options.cards)

		this.basic.boardcast({
			to: this.basic.players,
			event: 'hit',
			data: {
				from: options.from,
				cards: options.cards instanceof Array ? options.cards : [options.cards]
			}
		})

		await delay(1000)
	}

	/**
	 * 开始计时
	 */
	startCounting(gameTime) {
		this.basic.startCounting({
			gameTime,
			updated: (current) => {
				this.basic.boardcast({
					to: this.basic.players,
					event: 'gametime-changed',
					data: current
				})
			},
			end: () => {
				console.log('倒计时结束');
			}
		})
	}

	validateRules(card) {
		if (this.settings.gameRules.isOverlay && this.overlayCards.length > 0) {
			// 开启加牌叠加模式且处于加牌中
			if (this.overlayCards.find(overlayCard => overlayCard.symbol === 'WD')) {
				// 若存在+4则只能出+4
				if (card.symbol === 'WD') {
					return true
				} else {
					return false
				}
			} else if (card.symbol === 'WD' || card.symbol === 'D') {
				return true
			} else {
				return false
			}
		}

		const referCard = this.basic.getLastPassPool() // 牌堆最后一张牌

		if (card.symbol.indexOf('W') != -1) {
			// 包含W即为万能牌
			return true
		}

		if (card.color === referCard.color || card.symbol === referCard.symbol) {
			// 同色或同数字
			return true
		}

		if (this.settings.twoColorAll) {
			// 双色全出

		}

		return false
	}

	async playRules(options) {
		// 出牌具体操作
		const player = options.player
		const card = options.card

		const hit = async () => {
			// 做把牌打出去的动作
			await this.hit({
				from: player,
				cards: card
			})

			// 没有喊uno+2
			if (this.basic.findPlayer(player).cards.length === 1 && !this.basic.hasUno(player)) {
				this.basic.boardcast({
					to: this.basic.players,
					event: 'drawed-two',
					data: player
				})
				await this.deal({
					to: player,
					cards: this.basic.getRandomCards(2)
				})

				this.hint({ player: this.basic.players, text: `${player.nickname} 没有喊UNO` })
			}
		}

		if (card.symbol.indexOf('W') != -1 && card.color === 'any') {
			// 打出任意牌并且未转色
			this.basic.setActionState({
				player,
				state: 'select-color'
			})

			this.basic.boardcast({
				to: player,
				event: 'select-color'
			})

			card.color = await new Promise(resolve => {
				this.selectingColorPromise = { resolve }
			})

		}

		if (card.symbol === 'R') {
			// 转向
			await hit()
			this.basic.reverseDirection()
			await delay(2000)
			this.nextRound({ player: this.basic.getNextPlayer() })

		} else if (card.symbol === 'S') {
			// 跳过
			await hit()
			this.basic.boardcast({
				to: this.basic.players,
				event: 'skiped',
				data: this.basic.getNextPlayer()
			})
			await delay(1000)
			this.nextRound({ player: this.basic.getNextPlayer(this.basic.getNextPlayer()) })

		} else if (card.symbol === 'D') {
			// +2
			if (this.settings.gameRules.isOverlay) {
				// 加牌叠加
				await this.hit()
				this.overlayCards.push(card)
			} else {
				await hit()
				this.basic.boardcast({
					to: this.basic.players,
					event: 'drawed',
					data: { targetPlayer: this.basic.getNextPlayer(), count: 2 }
				})
				await this.deal({
					to: this.basic.getNextPlayer(),
					cards: this.basic.getRandomCards(2)
				})
				this.nextRound({ player: this.basic.getNextPlayer(this.basic.getNextPlayer()) })
			}
		} else if (card.symbol === 'WD') {
			// +4
			if (this.settings.gameRules.isOverlay) {
				// 加牌叠加
			} else {
				const lastCard = this.basic.getLastPassPool()
				const playSide = this.basic.currentPlayer
				const doubtSide = this.basic.getNextPlayer()

				await hit()
				this.nextRound({ player: doubtSide, state: 'doubt' })
				this.basic.boardcast({
					to: doubtSide,
					event: 'doubt'
				})
				const isDoubt = await new Promise(resolve => {
					this.doubtPromise = { resolve }
				})

				if (isDoubt) {
					if (playSide.cards.some(c => c.color.indexOf('W') === -1 && lastCard.color === c.color)) {
						// 质疑成功
						this.basic.boardcast({
							to: this.basic.players,
							event: 'doubt-success',
							data: doubtSide
						})
						await this.deal({
							to: playSide,
							cards: this.basic.getRandomCards(4)
						})
						await delay(800)
						this.nextRound({ player: doubtSide })
					} else {
						// 质疑失败
						this.basic.boardcast({
							to: this.basic.players,
							event: 'doubt-fail',
							data: doubtSide
						})
						await this.deal({
							to: doubtSide,
							cards: this.basic.getRandomCards(6)
						})
						await delay(800)
						this.nextRound({ player: this.basic.getNextPlayer(doubtSide) })
					}

				} else {
					// 接受加牌
					await this.deal({
						to: doubtSide,
						cards: this.basic.getRandomCards(4)
					})
					await delay(800)
					this.nextRound({ player: this.basic.getNextPlayer(doubtSide) })
				}
			}
		} else {
			// 普通同色或同数字牌
			await hit()
			this.nextRound({ player: this.basic.getNextPlayer() })
		}
	}

	/**
	 * 开始一个新的回合
	 * @property {Player} player 哪个玩家的回合
	 * @property {String} state 玩家回合状态
	 */
	nextRound(options) {
		this.basic.setActionState({
			player: options.player,
			state: options.state ?? 'normal'
		})
		this.basic.setCurrentPlayer(options.player)
	}

	/**
	 * 发送提示
	 * @property {Player或Player[]} player
	 * @property {String} text 
	 */
	hint(options) {
		this.basic.boardcast({
			to: options.player,
			event: 'hint',
			data: options.text
		})
	}

	/**
	 * 调用该函数后，若玩家uno状态产生变化，则发送广播
	 * @property {Player} player
	 * @property {Boolean} isUno 
	 */
	setUnoState(options) {
		const player = options.player
		const isUno = options.isUno
		if ((isUno && !this.basic.hasUno(player)) || (!isUno && this.basic.hasUno(player))) {
			this.basic.setUno({ player, isUno })
			this.basic.boardcast({
				to: this.basic.players,
				event: 'uno-state-changed',
				data: { player, isUno }
			})
		}
	}

}

export default GameActions