import BasicGame from './BasicGame.js'
import { Card, DeckCards } from '../Card.js'
import Player from '../Player.js'
import $Cards from '../../constants/cards.js'

// 经典模式
class NormalGame extends BasicGame {
	constructor(options) {
		if (options.users.length !== 4) {
			throw new Error('玩家人数不等于4')
		}
		const deckCards = new DeckCards({ cards: $Cards.normal }) // 新建普通模式牌堆
		const players = Array.from(options.users, user => new Player(user)) // 用户转换成玩家
	    super({
			players,
			deckCards
		})
	}
	
	start() {
		super.start({
			initCardCount: 6,
			seconds: 180
		})
	}
	
	canIPlay(card) {
		// 出牌规则
		const referCard = this.passCardPool[this.passCardPool.length - 1] //牌堆最后一张牌
		if (card.symbol === 'W') {
			return true
		}
		
		if (card.symbol === 'WD') {
			return true
		}
		
		if (card.color === referCard.color || card.symbol === referCard.symbol) {
			return true
		}
		
		return false
	}
	
	playAction(options) {
		//出牌动作
		const referCard = this.passCardPool[this.passCardPool.length - 1] //牌堆最后一张牌
		if (options.card.symbol === 'W') {
			options.card.color = options.turnToColor
			return
		}
		
		if (options.card.symbol === 'WD') {
			options.card.color = options.turnToColor
			
			const playSidePlayer = this.players[this.state.currentPlayerIndex] // 打出+4方
			const doubtSidePlayer = this.players[this.getNextPlayerIndex()] // 质疑方
			
			if (playSidePlayer.cards.length === 1) {
				// 若手上只剩一张+4，则不发送质疑事件
				doubtSidePlayer.addCards(this.deckCards.draw(4))
				return
			}
			
			// 发送是否质疑+4事件
			this.boardcast({
				to: doubtSidePlayer,
				event: 'is-query-wd'
			})
			
			const drawFunc = () => {
				// 接受加牌
				doubtSidePlayer.addCards(this.deckCards.draw(4))
				this.setState({ currentPlayerIndex: this.getNextPlayerIndex() })
				doubtSidePlayer.removeListener('is-query-wd-doubt', doubtFunc)
			}
			
			const doubtFunc = () => {
				// 质疑
				// 质疑则判断打出+4的玩家有没有与牌堆最后一只相同颜色的手牌，有则质疑成功（打出+4方加6只），否则失败（质疑方加6只）
				if (playSidePlayer.cards.some(card => card.color === referCard.color)) {
					playSidePlayer.addCards(this.deckCards.draw(4))
					
					// 若质疑成功，向全部玩家通知
					this.boardcast({
						to: this.players,
						event: 'is-query-wd-success',
						data: doubtSidePlayer
					})
				} else {
					doubtSidePlayer.addCards(this.deckCards.draw(6))
					this.setState({ currentPlayerIndex: this.getNextPlayerIndex() })
					
					// 质疑失败，与质疑成功同理
					this.boardcast({
						to: this.players,
						event: 'is-query-wd-fail',
						data: doubtSidePlayer
					})
				}
				doubtSidePlayer.removeListener('is-query-wd-draw', drawFunc)
			}
			
			doubtSidePlayer.once('is-query-wd-draw', drawFunc)
			doubtSidePlayer.once('is-query-wd-doubt', doubtFunc)
			return
		}
		
		if (options.card.symbol === 'S') {
			this.setState({ currentPlayerIndex: this.getNextPlayerIndex() })
			return
		}
		
		if (options.card.symbol === 'R') {
			this.setState({
				direction: this.state.direction === 'cw' ? 'acw' : 'cw'
			})
			return
		}
		
		if (options.card.symbol === 'D') {
			const nextPlayer = this.players[this.getNextPlayerIndex()]
			nextPlayer.addCards(this.deckCards.draw(2))
			this.setState({ currentPlayerIndex: this.getNextPlayerIndex() })
			return
		}
	}
	
	gameEndAction() {
		const hasPlayerFinish = this.players.find(player => player.cards.length === 0)
		
		if (hasPlayerFinish) {
			// 有玩家的手牌已经出完
			hasPlayerFinish.changeCoins(3000)
			this.boardcast({
				to: this.players,
				event: 'game-end'
			})
		} else {
			// 倒计时结束
			console.log('倒计时结束');
		}
	}
}

export default NormalGame