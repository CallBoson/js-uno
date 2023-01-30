import { Card } from '../Card.js'
import Player from '../Player.js'

// 游戏基类
class BasicGame {
	_config = {
		initCardCount: 6,
		gameTime: 180
	}
	
	gameClock = null // 游戏时钟
	
	players = [] // 玩家
	deckCards = undefined // 一副牌对象
	passCardPool = [] // 已出牌堆
	
	state = {
		direction: 'cw', // 随机取逆时针/顺时针
		currentPlayer: undefined, // 当前出牌玩家
		seconds: 0 ,// 剩余游戏秒数
	}
	
	constructor(options) {
		this.players = options.players
		this.deckCards = options.deckCards
		this._config.initCardCount = options.initCardCount || 6
		this._config.gameTime = options.gameTime || 180
		
		this.players.forEach(player => {
			player.setGame(this)
		})
	}
	
	boardcast(options) {
		/**
		 * 给玩家发送事件广播 接受单个玩家对象或玩家对象数组
		 * @param {Object} options
		 * @property {Player或Player[]} to 要发送的目标玩家
		 * @property {String} event 事件名称
		 * @property {any} data 携带的数据
		 */
		const emitOne = (player) => {
			if (player instanceof Player) {
				player.emit(options.event, options.data)
			}
		}
		
		if (options.to instanceof Array) {
			options.to.forEach(player => {
				emitOne(player)
			})
		} else {
			emitOne(options.to)
		}
	}
	
	nextPlayerRound() {
		// 通知下一家可以出牌
		this.setState({
			currentPlayer: this.getNextPlayer()
		})
		
		this.boardcast({
			to: this.state.currentPlayer,
			event: 'your-round'
		})
	}
	
	getNextPlayer() {
		const currentIndex = this.players.findIndex(player => player === this.state.currentPlayer)
		if (this.state.direction === 'cw') {
			if (currentIndex === this.players.length - 1) {
				return this.players[0]
			} else {
				return this.players[currentIndex + 1]
			}
			return
		}
		
		if (this.state.direction === 'acw') {
			if (currentIndex === 0) {
				return this.players[this.players.length - 1]
			} else {
				return this.players[currentIndex - 1]
			}
			return
		}
	}
	
	start(options) {
		// 每人抽n张牌
		Array.from(this.players, player => player.addCards(this.deckCards.draw(this._config.initCardCount)))
		
		// 给所有人发送玩家数据广播(用户信息、手牌)
		this.boardcast({
			to: this.players,
			event: 'players-changed',
			data: this.players
		})
		
		this.setState({
			direction: Math.random() < 0.5 ? 'cw' : 'acw', // 随机取逆时针/顺时针
			currentPlayer: this.players[Math.floor(Math.random() * this.players.length)], // 随机取出牌玩家
			seconds: this._config.gameTime
		})
		
		// 开局随机抽一张牌并放入已出牌堆
		let [randomCard] = this.deckCards.draw()
		while (randomCard.color === 'any') {
			randomCard = this.deckCards.draw()[0]
		}
		this.addPass(randomCard)
		
		// 游戏开始计时间
		const endTime = new Date().getTime() + (Number(this.state.seconds) * 1000)
		this.gameClock = setInterval(() => {
			this.setState({
				seconds: Math.abs(((endTime - new Date().getTime()) / 1000).toFixed(0))
			})
			
			if (new Date().getTime() > endTime) {
				clearInterval(this.gameClock)
				this.gameEndAction()
				return
			}
		}, 800)
		
		this.nextPlayerRound()
	}
	
	setState(state) {
		const result = Object.assign(this.state, state)
		this.boardcast({
			to: this.players,
			event: 'state-changed',
			data: {
				currentPlayer: result.currentPlayer,
				seconds: this.state.seconds
			}
		})
		return result
	}
	
	addPass(cards) {
		// 加n张牌至已出牌堆
		// 判断若为单个Card对象，则直接添加至数组
		// 判断若为Card对象数组，则需遍历数组
		const pushOne = (card) => {
			if (card instanceof Card) {
				this.passCardPool.push(card)
			}
		}
		
		if (cards instanceof Array && cards.length > 0) {
			Array.from(cards, card => {
				pushOne(card)
			})
		} else {
			pushOne(cards)
		}
		
		// 牌堆发生变化 向所有玩家推送牌堆变化事件
		this.boardcast({
			to: this.players,
			event: 'passcardpool-changed',
			data: this.passCardPool
		})
		
		return this.passCardPool
	}
	
	
	canIPlay() {
		// 父类重写规则
		throw new Error('请重写出牌规则')
	}
	
	playAction() {
		// 父类重写出牌动作
		throw new Error('请重写出牌动作')
	}
	
	gameEndAction() {
		// 父类重写游戏结束动作
	}
}

export default BasicGame