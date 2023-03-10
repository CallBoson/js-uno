import GameActions from './GameActions.js'
import { delay } from '../../utils/common.js'

// 游戏类
class Game extends GameActions {
	
	settings = {
		gameTime: 0, // 游戏时长
		roundTime: 0, // 玩家出牌时间
		playersCount: 0, // 玩家人数
		initCardsCount: 6, // 初始牌数量
		isSingleMode: true, // 单人模式/双人模式
		gameRules: {
			isOverlay: true, // 加牌叠加
			isExchangeCards: false, // 0或7换牌
			isForcePlay: false, // 摸牌后强制打出
			isOptionCards: false, // 自选牌
		},
		specialCards: {
			sameColorAll: false, // 同色全出
			twoColorAll: false, // 双色全出
			joker: false, // 小丑牌
			ballon: false, // 爆炸气球
			rebound: false, // 反弹牌
			colorful: false, // 多彩挑战
		}
	}
	
	constructor(options) {
		super()
		// this.settings = options
		this.transformUsers(options.users)
	}
	
	getPlayers() {
		return this.basic.players
	}
	
	async start() {
		// 每人发n张牌
		await super.startGameDeal(this.settings.initCardsCount)
		
		// 随机取游戏方向
		this.basic.setDirection()
		
		// 抽一张有颜色的牌到牌堆
		this.drawStartCard()
		
		// 开始倒计时
		// this.startCounting(360)
		
		// 随机取一位玩家出牌
		this.basic.setCurrentPlayer()
	}
	
	async play(options) {
		// 出牌动作
		const player = options.player
		const card = options.card
		
		if (!this.basic.isCurrentPlayer(player)) {
			throw new Error('还未轮到你的回合')
		}
		
		if (this.basic.getActionState(player) !== 'normal' && this.basic.getActionState(player) !== 'play') {
			throw new Error('该玩家不能出牌')
		}
		
		if (!this.validateRules(card)) {
			throw new Error('必须同牌型才能出')
		}
		
		// 出牌具体操作
		await this.playRules(options)
	}
	
	async draw(options) {
		// 抽牌动作
		const player = options.player
		if (!this.basic.isCurrentPlayer(player)) {
			throw new Error('还未轮到你的回合')
		}
		
		if (this.basic.getActionState(player) !== 'normal') {
			throw new Error('该玩家不能抽牌')
		}
		
		const [card] = this.basic.getRandomCards(1)
		await this.deal({
			to: player,
			cards: [card]
		})
		
		await delay(800) 
		
		if (this.validateRules(card)) {
			// 能打出
			if (this.settings.gameRules.isForcePlay) {
				// 强制打出
				this.uno({ player })
				this.play({
					player,
					card
				})
				this.hint({ player, text: '当前为强制出牌模式，摸牌后自动打出' })
			} else {
				const isReplay = await this.waitResponse({ to: player, state: 'replay' })
				
				if (isReplay === 'true') {
					this.uno({ player })
					this.playRules({ player, card })
				} else {
					// 保留 结束回合
					this.nextRound({ player: this.basic.getNextPlayer() })
				}
			}
		} else {
			// 不能打出 结束回合
			this.nextRound({ player: this.basic.getNextPlayer() })
		}
	}
	
	uno(options) {
		// 喊uno动作
		const player = options.player
		if (!this.basic.isCurrentPlayer(player)) {
			throw new Error('还未轮到你的回合')
		}
		
		if (this.basic.findPlayer(player).cards.length === 2) {
			this.setUnoState({ player, isUno: true })
		}
		
	}
	
	/**
	 * 回复交互请求
	 * @property {Player} player 回复人
	 * @property {String} state 哪一个交互状态
	 * @property {String} option 回复的值
	 */
	responseReciprocal(options) {
		const player = options.player
		const state = options.state
		const option = options.option

		if (!this.basic.isCurrentPlayer(player)) {
			throw new Error('还未轮到你的回合')
		}
		
		if (this.basic.getActionState(player) !== state) {
			throw new Error('回复的交互类型错误')
		}
		
		if (!this.waitResponsePromises[state]['options'].includes(option)) {
			throw new Error('回复的可选交互参数不存在')
		}

		this.waitResponsePromises[state]['promise'].resolve(option)
	}
	
}

export default Game