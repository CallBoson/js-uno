import { Card } from './Card.js'
import User from './User.js'

// 玩家类
class Player extends User {
	cards = []
	isUno = false // 是否喊了Uno
	actionState = 'normal' // 回合状态 normal为正常状态
	
	constructor(user) {
		super(user)
	}
	
	removeCards(cards) {
		// 移除手牌
		const removeOne = (card) => {
			if (card instanceof Card) {
				this.cards.map((currentCard, currentCardi) => {
					if (currentCard.id === card.id) {
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
}

export default Player