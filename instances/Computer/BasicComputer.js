import Player from '../Player.js'
import { getRandomNumber } from '../../utils/common.js'

class BasicComputer extends Player {
	game = null
	
	constructor(options) {
	    super(options)
	}
	
	setGame(game) {
		this.game = game
		this.listen()
	}
	
	transformCard(card) {
		// 判断卡牌是不是万能牌 若是，变颜色，最后返回卡牌
		if (card.symbol === 'W' || card.symbol === 'WD') {
			const colors = ['red', 'yellow', 'blue', 'green']
			const index = getRandomNumber(0, colors.length - 1)
			card.color = colors[index]
		}
		return card
	}
	
	listen() {
		this.on('your-round', () => {
			setTimeout(() => {
				const doUno = () => {
					if (this.cards.length === 2) {
						if (getRandomNumber(1, 10) <= 8) {
							// 有2成机会不喊uno
							this.game.uno({ player: this })
						}	
					}
				}

				// 先判断是否有数字牌
				const normalCard = this.cards.find(c => c.symbol !== 'W' && c.symbol !== 'WD' && this.game.canIPlay(c))
				if (normalCard) {
					doUno()
					this.game.play({
						player: this,
						card: normalCard
					})
					console.log(`${this.nickname}：成功打出`);
					return
				}
				
				// 再判断是否有万能牌
				const anyCard = this.cards.find(c => c.symbol === 'W' || c.symbol === 'WD')
				if (anyCard) {
					doUno()
					this.game.play({
						player: this,
						card: this.transformCard(anyCard)
					})
					console.log(`${this.nickname}：成功打出`);
					return
				}
				
				console.log(`${this.nickname}：没有可出的牌，尝试抽牌`);
				
				const drawed = this.game.draw({ player: this })
				if (drawed) {
					// 抽牌后默认打出
					const card = this.transformCard(drawed.card)
					drawed.replay(card)
				}
			}, 1200)
		})
		
		this.on('is-query-wd', (options) => {
			// 随机质疑或不质疑
			const threshold = getRandomNumber(1,2)
			let isDoubt = false
			if (threshold === 1) {
				isDoubt = true
			}
			
			setTimeout(() => {
				options.doubtFunc(isDoubt)
				console.log(`${this.nickname}：${options.player.nickname}给我打出了+4`);
			}, 1500)
		})
	}
}

export default BasicComputer