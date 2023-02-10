import Basic from './Basic.js'
import $Cards from '../../constants/cards.js'
import { delay } from '../../utils/common.js'
import GameRules from './GameRules.js'

// 游戏具体实现类
class GameActions extends GameRules {
	basic = null
	selectingColorPromise = null
	doubtPromise = null
	replayPromise = null
	overlayDoubtPromise = null
	overlayCards = [] // 叠加牌池

	constructor() {
		super()
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