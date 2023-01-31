import BasicGame from './BasicGame.js'
import { Card, DeckCards } from '../Card.js'
import Player from '../Player.js'
import $Cards from '../../constants/cards.js'
import Computer from '../Computer/BasicComputer.js'

// 经典模式
class NormalGame extends BasicGame {
	rate = 200 // 倍率
	mode = 'single' // single / couple 单人模式/双人模式
	
	constructor(options) {
		if (options.users.length !== 4) {
			throw new Error('玩家人数不等于4')
		}
		const deckCards = new DeckCards({ cards: $Cards.normal }) // 新建普通模式牌堆
		const players = Array.from(options.users, user => {
			if (user.isComputer) {
				return new Computer(user)
			} else {
				return new Player(user)
			}
		}) // 用户转换成玩家
	    super({
			players,
			deckCards
		})
	}
	
	start() {
		super.start()
	}
	
	/**
	 * @param {Object} options
	 * @property {Player} player
	 * @property {Card} card
	 * @property {String} color 若为万能牌 则要传递转换的颜色 
	 */
	play(options) {
		const player = options.player
		const card = options.card
		
		let needDoubt = false
		
		if (!player.cards.includes(card)) {
			throw new Error('请选择要出的牌')
		}
		
		if (!this.canIPlay(card)) {
			throw new Error('必须要同颜色或同牌型才能出')
		}
		
		if (player !== this.state.currentPlayer) {
			throw new Error('还没轮到你的回合')
		}
		
		if (card.symbol === 'S') {
			this.skipPlayer()
		}
		
		if (card.symbol === 'R') {
			this.returnDirection()
		}
		
		if (card.symbol === 'D') {
			this.drawCardsTo({
				player: this.getNextPlayer(),
				count: 2
			})
			this.skipPlayer()
		}
		
		if (card.symbol === 'WD') {
			const playSidePlayer = this.state.currentPlayer // 打出+4方
			const doubtSidePlayer = this.getNextPlayer() // 质疑方

			if (playSidePlayer.cards.length === 1) {
				// 若手上只剩一张+4，则不发送质疑事件
				this.drawCardsTo({
					player: doubtSidePlayer,
					count: 4
				})
			} else {
				needDoubt = true
				const lastPassCard = this.getLastPassPool()
				// 发送是否质疑+4事件
				this.boardcast({
					to: doubtSidePlayer,
					event: 'is-query-wd',
					data: {
						player: playSidePlayer,
						doubtFunc: (isDoubt) => {
							if (isDoubt) {
								// 质疑则判断打出+4的玩家有没有与牌堆最后一只相同颜色的手牌，有则质疑成功（打出+4方加6只），否则失败（质疑方加6只)
								if (playSidePlayer.cards.some(c => c.color === lastPassCard.color)) {
									this.drawCardsTo({
										player: playSidePlayer,
										count: 4
									})
									
									// 若质疑成功，向全部玩家通知
									this.boardcast({
										to: this.players,
										event: 'is-query-wd-result',
										data: {
											type: 'success',
											player: doubtSidePlayer
										}
									})
									
									this.endRound()
								} else {
									this.drawCardsTo({
										player: doubtSidePlayer,
										count: 6
									})
									this.skipPlayer()
									this.endRound()
									
									// 质疑失败，与质疑成功同理
									this.boardcast({
										to: this.players,
										event: 'is-query-wd-result',
										data: {
											type: 'fail',
											player: doubtSidePlayer
										}
									})
								}
							} else {
								// 接受加牌
								doubtSidePlayer.addCards(this.deckCards.draw(4))
								this.skipPlayer()
								this.endRound()
							}
						}
					}
				})
			}
		}
		
		// 将要出的牌从手牌中移除
		player.removeCards(card)
		
		// 将要出的牌放入已出牌堆
		this.addPass(card)
		
		// 若手牌打完，则清除计时器并执行游戏结束动作
		if (player.cards.length === 0) {
			clearInterval(this.gameClock)
			this.gameEndAction()
			return
		}
		
		// 如果手牌剩下一张，没有喊uno的话抽2张
		if (player.cards.length === 1 && !player.isUno) {
			// 发送没喊uno广播
			this.boardcast({
				to: this.players,
				event: 'no-uno-draw',
				data: player
			})
		
			this.drawCardsTo({
				player,
				count: 2
			})
		}
		
		if (!needDoubt) {
			// 若是质疑牌 则不结束回合
			this.endRound()
		}
	}
	
	/**
	 * @param {Object} options
	 * @property {Player} player 
	 */
	draw(options) {
		const player = options.player
		if (player !== this.state.currentPlayer) {
			throw new Error('还没轮到你的回合')
		}
		
		const [card] = this.drawCardsTo({
			player,
			count: 1
		})
		
		// 如果抽回来的牌能打，return一个回调函数，若不能 结束回合
		if (this.canIPlay(card)) {
			return {
				card,
				noreplay: () => {
					this.endRound()
				},
				replay: (replayCard) => {
					// 抽回来的牌再打出自动喊uno
					try {
						this.uno({ player })
					} catch(err) {
						throw err
					}
					
					this.play({
						player,
						card: replayCard
					})
				}
			}
		} else {
			this.endRound()
			return false
		}				
	}
	
	/**
	 * @param {Object} options
	 * @property {Player} player 
	 */
	uno(options) {
		const player = options.player
		if (player !== this.state.currentPlayer) {
			throw new Error('还没轮到你的回合')
		}
		
		player.isUno = true
		this.boardcast({
			to: this.players,
			event: 'someone-uno',
			data: player
		})
	}
	
	canIPlay(card) {
		// 出牌规则
		const referCard = this.getLastPassPool() // 牌堆最后一张牌
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
	
	gameEndAction() {
		// 计算手牌分数
		const getScore = (card) => {
			// 获取该手牌分数
			if (card.color === 'any') {
				return 50 // 万能牌+50
			} else if (card.symbol === 'D' || card.symbol === 'S' || card.symbol === 'R') {
				return 20 // 功能牌+20
			} else {
				return Number(card.symbol) // 数字牌+牌面分
			}
		}
		
		if (this.mode === 'single') {
			const scores = []
			
			this.players.forEach(player => {
				const playerScore = player.cards.reduce((totalScore, currentCard) => totalScore + getScore(currentCard), 0) // 手牌分数累加
				scores.push({
					player,
					score: -playerScore,
				})
			})
			
			scores.sort((a, b) => a.score - b.score) // 从小到大排列
			
			let totalCoins = (Math.abs(scores[0].score) + Math.abs(scores[1].score)) * this.rate // 总赢金币数
			scores.forEach((current, currentIndex) => {
				const rank = 4 - currentIndex // 排名
				let coins
				if (rank === 4 || rank === 3) {
					coins = current.score * this.rate // 排名第三或第四，则输 手牌分*倍率
				} else if (rank === 2) {
					coins = Math.floor(totalCoins * 0.25) // 排名第二，分得25%
					totalCoins -= coins
				} else {
					coins = totalCoins // 排名第一，则获取剩余所有金币
				}
				
				// 增减金币
				current.player.changeCoins(coins)
				
				Object.assign(scores[currentIndex], {
					rank,
					coins
				})
			})
			
			this.boardcast({
				to: this.players,
				event: 'game-end',
				data: scores
			})
		}
	}
}

export default NormalGame