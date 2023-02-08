import { Card, DeckCards } from '../Card.js'
import Player from '../Player.js'
import Computer from '../Computer/BasicComputer.js'
import EventEmitter from 'events'
import { getRandomNumber } from '../../utils/common.js'

// 游戏基类
class Basic extends EventEmitter {
	players = []
	currentPlayer = undefined
	direction = 'cw'
	gameClock = null // 游戏时钟
	deckCards = undefined // 一副牌对象
	passCardPool = [] // 已出牌堆
	
	findPlayer(player) {
		let resultp
		this.players.forEach(p => {
			if (p.uid === player.uid) {
				resultp = p
			}
		})
		
		if (resultp) {
			return resultp
		} else {
			throw new Error('玩家不存在')
		}
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
			this.findPlayer(player).emit(options.event, options.data)
		}
		
		if (options.to instanceof Array) {
			options.to.forEach(player => {
				emitOne(player)
			})
		} else {
			emitOne(options.to)
		}
	}
	
	/**
	 * 把用户转换成玩家或电脑
	 * @param {User} users 
	 */
	setPlayers(users) {
		this.players = Array.from(users, user => {
			if (user.isComputer) {
				return new Computer(user)
			} else {
				return new Player(user)
			}
		})
		return this.players
	}
	
	/**
	 * 设置当前出牌玩家
	 * @param {Player} player
	 */
	setCurrentPlayer(player) {
		if (player) {
			this.currentPlayer = this.findPlayer(player)
		} else {
			this.currentPlayer = this.players[getRandomNumber(0, this.players.length - 1)]
		}
		this.emit('currentplayer-changed', this.currentPlayer)
	}
	
	isCurrentPlayer(player) {
		return this.findPlayer(player) === this.currentPlayer
	}
	
	/**
	 * 获取基于某玩家的下一位玩家
	 * @property {Player} basePlayer 基于某玩家 不填则基于currentPlayer
	 */
	getNextPlayer(basePlayer) {
		const currentIndex = this.players.findIndex(player => player === (basePlayer ? this.findPlayer(basePlayer) : this.currentPlayer))
		if (this.direction === 'cw') {
			if (currentIndex === this.players.length - 1) {
				return this.players[0]
			} else {
				return this.players[currentIndex + 1]
			}
			return
		}
		
		if (this.direction === 'acw') {
			if (currentIndex === 0) {
				return this.players[this.players.length - 1]
			} else {
				return this.players[currentIndex - 1]
			}
			return
		}
	}
	
	/**
	 * 设置玩家回合状态
	 * @property {Player} player 玩家
	 * @property {String} state 状态
	 */
	setActionState(options) {
		this.findPlayer(options.player).actionState = options.state
	}
	
	getActionState(player) {
		return this.findPlayer(player).actionState
	}
	
	/**
	 * @param {String} direction 设置游戏方向 cw顺时针 acw逆时针
	 */
	setDirection(direction) {
		if (direction) {
			this.direction = direction === 'acw' ? 'acw' : 'cw'
		} else {
			this.direction = Math.random() < 0.5 ? 'cw' : 'acw' // 随机取逆时针/顺时针
		}
		this.emit('direction-changed', this.direction)
	}
	
	/**
	 * 反转游戏方向
	 */
	reverseDirection() {
		const direction = this.direction === 'cw' ? 'acw' : 'cw'
		this.setDirection(direction)
	}
	
	/**
	 * 游戏时间开始倒计时
	 * @property {Number} gameTime
	 * @property {Function} updated 时间发生变化
	 * @property {Function} end 倒计时结束 
	 */
	startCounting(options) {
		if (options.gameTime > 0) {
			// 游戏开始计时间
			const endTime = new Date().getTime() + (Number(options.gameTime) * 1000)
			this.gameClock = setInterval(() => {				
				if (new Date().getTime() > endTime) {
					clearInterval(this.gameClock)
					options.end()
				} else {
					const current = Math.abs(((endTime - new Date().getTime()) / 1000).toFixed(0))
					options.updated(current)
				}
			}, 800)
		}
	}
	
	/**
	 * 游戏时间停止倒计时
	 */
	stopCounting() {
		clearInterval(this.gameTime.gameClock)
		this.emit('gametime-counting-stop')
	}
	
	/**
	 * @param {DeckCards} deckCards 一副牌
	 */
	setDeckCards(cards) {
		this.deckCards = new DeckCards({ cards })
	}
	
	/**
	 * @param {Card} cards
	 */
	addPassCards(cards) {
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
		
		return this.passCardPool
	}
	
	/**
	 * @property {Player} from 要移除哪个玩家的牌
	 * @property {Card || Card[]} cards 牌
	 */
	removeCards(options) {
		this.findPlayer(options.from).removeCards(options.cards)
	}
	
	/**
	 * @property {Player} to 牌要加到哪个玩家
	 * @property {Card || Card[]} cards 牌
	 */
	addCards(options) {
		this.findPlayer(options.player).addCards(options.cards)
	}
	
	/**
	 * @param {Number} count 摸牌数量
	 * @return {Card[]}
	 */
	getRandomCards(count = 1) {
		return this.deckCards.draw(count)
	}
	
	getLastPassPool() {
		// 返回牌堆最后一张牌
		return this.passCardPool[this.passCardPool.length - 1] 
	}
}

export default Basic