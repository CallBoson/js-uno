import EventEmitter from 'events'
import { Card } from '../Card.js'
import Player from '../Player.js'

// 游戏基类
class BasicGame extends EventEmitter {
	gameClock = null // 游戏时钟
	
	players = [] // 玩家
	deckCards = undefined // 一副牌对象
	passCardPool = [] // 已出牌堆
	
	state = {
		direction: 'cw', // 随机取逆时针/顺时针
		currentPlayerIndex: 0, // 当前出牌玩家index
		seconds: 0 // 剩余游戏秒数
	}
	
	constructor(options) {
		super()
		this.players = options.players
		this.deckCards = options.deckCards
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
				player.emit(event, data)
			}
		}
		
		if (options.to instanceof Array) {
			options.to.forEach(player => {
				emitOne(player)
			})
		}
	}
	
	start(options) {
		// 每人发n张牌
		Array.from(this.players, player => player.addCards(this.deckCards.draw(options.initCardCount || 6)))
		// this.boardcast({
		// 	to: this.players,
		// 	event: 'players-changed',
		// 	data: this.players
		// })
		this.emit('players-changed', this.players)
		
		this.setState({
			direction: Math.random() < 0.5 ? 'cw' : 'acw', // 随机取逆时针/顺时针
			currentPlayerIndex: Math.floor(Math.random() * this.players.length), // 随机取出牌玩家
			seconds: options.seconds || 180, // 默认180秒
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
	}
	
	setState(state) {
		const result = Object.assign(this.state, state)
		this.emit('state-changed', {
			currentPlayer: this.players[result.currentPlayerIndex],
			seconds: this.state.seconds
		})
		return result
	}
	
	draw() {
		const [card] = this.deckCards.draw()
		this.players[this.state.currentPlayerIndex].addCards(card)
		this.emit('players-changed', this.players)
		
		if (this.canIPlay(card)) {
			// 如果抽回来的牌能打 则让玩家选择保留或打出
			this.emit('is-replay', card)
			
			// 返回is-replay-callback事件且类型为noreplay，则选择保留，结束回合（若类型为replay 选择打出,则交由play事件处理）
			this.once('is-replay-callback', (type) => {
				if (type === 'noreplay') {
					this.setState({ currentPlayerIndex: this.getNextPlayerIndex() })
				}
			})
			return
		}
				
		this.setState({ currentPlayerIndex: this.getNextPlayerIndex() })
	}
	
	getNextPlayerIndex() {
		if (this.state.direction === 'cw') {
			if (this.state.currentPlayerIndex === this.players.length - 1) {
				return 0
			} else {
				return this.state.currentPlayerIndex + 1
			}
			return
		}
		
		if (this.state.direction === 'acw') {
			if (this.state.currentPlayerIndex === 0) {
				return this.players.length - 1
			} else {
				return this.state.currentPlayerIndex - 1
			}
			return
		}
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
		
		this.emit('passcardpool-changed', this.passCardPool)
		return this.passCardPool
	}
	
	play(options) {
		if (!this.canIPlay(options.card)) {
			throw new Error('此牌不能出')
		}
		this.playAction(options)
		
		// 将要出的牌从手牌中移除
		this.players.map((player) => {
			player.removeCards(options.card)
		})
		
		// 将要出的牌放入已出牌堆
		this.addPass(options.card)
		
		if (options.player.cards.length === 0) {
			clearInterval(this.gameClock)
			this.gameEndAction()
			return
		}
		
		// 如果手牌剩下一张，没有喊uno的话抽2张
		if (options.player.cards.length === 1 && !options.player.isUno) {
			this.emit('no-uno-draw', options.player)
			options.player.addCards(this.deckCards.draw(2))
		}
		
		this.setState({ currentPlayerIndex: this.getNextPlayerIndex() })
	}
	
	canIPlay() {
		// 父类重写规则
		throw new Error('请重写出牌规则')
	}
	
	playAction() {
		// 父类重写出牌动作
		throw new Error('请重写出牌动作')
	}
	
	uno(options) {
		// 喊uno
		options.player.isUno = true
	}
	
	gameEndAction() {
		// 父类重写游戏结束动作
	}
}

export default BasicGame