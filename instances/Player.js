import { Card } from './Card.js'
import User from './User.js'

// 玩家类
class Player extends User {
	game = null
	cards = []
	isUno = false // 是否喊了Uno
	
	constructor(user) {
		super(user)
	}
	
	setGame(game) {
		this.game = game
	}
	
	removeCards(cards) {
		// 移除手牌
		const removeOne = (card) => {
			if (card instanceof Card) {
				this.cards.map((currentCard, currentCardi) => {
					if (currentCard === card) {
						this.cards.splice(currentCardi, 1)
					}
				})
			}
		}
		
		if (cards instanceof Array && cards.length > 0) {
			Array.from(cards, card => {
				removeOne(card)
			})
		} else {
			removeOne(cards)
		}
		return this.cards
	}
	
	addCards(cards) {
		// 加n张手牌
		// 判断若为单个Card对象，则直接添加至数组
		// 判断若为Card对象数组，则需遍历数组
		const pushOne = (card) => {
			if (card instanceof Card) {
				this.cards.push(card)
			}
		}
		
		if (cards instanceof Array && cards.length > 0) {
			Array.from(cards, card => {
				pushOne(card)
			})
		} else {
			pushOne(cards)
		}
		
		// 只要手牌增加, 就要重新喊uno
		this.isUno = false
		
		return this.cards
	}
	
	get cards() {
		return this.cards
	}
	
	play(options) {
		if (!this.cards.includes(options.card)) {
			throw new Error('请选择要出的牌')
			return
		}
		
		if (!this.game.canIPlay(options.card)) {
			throw new Error('必须要同颜色或同牌型才能出')
			return
		}
		
		if (this.game.state.currentPlayer !== this) {
			throw new Error('还没轮到你的回合')
			return
		}
		
		this.game.playAction(options).then(() => {
			// 将要出的牌从手牌中移除
			this.removeCards(options.card)
			
			// 将要出的牌放入已出牌堆
			this.game.addPass(options.card)
			
			// 若手牌打完，则清除计时器并执行游戏结束动作
			if (this.cards.length === 0) {
				clearInterval(this.game.gameClock)
				this.game.gameEndAction()
				return
			}
			
			// 如果手牌剩下一张，没有喊uno的话抽2张
			if (this.cards.length === 1 && !this.isUno) {
				// 发送没喊uno广播
				this.game.boardcast({
					to: this.game.players,
					event: 'no-uno-draw',
					data: this
				})
			
				this.addCards(this.game.deckCards.draw(2))
			}
			
			this.game.nextPlayerRound()
		})
	}
	
	draw() {
		if (this.game.state.currentPlayer !== this) {
			throw new Error('还没轮到你的回合')
			return
		}
		
		const [card] = this.game.deckCards.draw()
		this.addCards(card)
		
		if (this.game.canIPlay(card)) {
			// 返回is-replay-callback事件且类型为noreplay，则选择保留，结束回合（若类型为replay 选择打出,则交由play事件处理）
			this.once('is-replay-callback', (type) => {
				if (type === 'noreplay') {
					this.game.nextPlayerRound()
				}
			})
			
			// 如果抽回来的牌能打 则让玩家选择保留或打出
			this.game.boardcast({
				to: this,
				event: 'is-replay',
				data: card
			})
			return
		}
				
		this.game.nextPlayerRound()
	}
	
	uno() {
		// 喊uno
		if (this.game.state.currentPlayer !== this) {
			throw new Error('还没轮到你的回合')
		}
		
		this.isUno = true
	}
}

export default Player