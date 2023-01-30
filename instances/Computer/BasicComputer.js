import Player from '../Player.js'

class BasicComputer extends Player {
	constructor(options) {
	    super(options)
		
		this.on('your-round', () => {
			console.log(`${this.nickname}：到我的回合了`);
			setTimeout(() => {
				for(let i = 0; i < this.cards.length; i++) {
					const cardObj = {
						card: this.cards[i]
					}
					if (this.cards[i].symbol === 'W' || this.cards[i].symbol === 'WD') {
						cardObj['turnToColor'] = 'red'
					}
					
					console.log(`${this.nickname}：尝试打出第${i + 1}张牌`);
					try {
						this.play(cardObj)
						console.log(`${this.nickname}：成功打出`);
						return
					} catch (err) {
						continue
					}
				}
				
				console.log(`${this.nickname}：没有可出的牌，尝试抽牌`);
				this.draw()
			}, 1000)
		})
		
		this.on('is-replay', (card) => {
			// 抽回来的牌能打出 默认打出
			console.log(`${this.nickname}：抽牌后打出`);
			this.emit('is-replay-callback', 'replay')
			
			// 抽牌后再选择打出，则自动喊uno，再打出一只
			if (this.cards.length === 2) {
				this.uno()
			}
			
			if (card.symbol === 'W' || card.symbol === 'WD') {
				this.play({
					card,
					turnToColor: 'red'
				})
			} else {
				this.play({
					card
				})
			}
			
		})
		
		this.on('no-uno-draw', (who) => {
			// 没有喊uno
			console.log(`${this.nickname}：我没有喊uno`);
		})
		
		this.on('is-query-wd', () => {
			console.log(`${this.nickname}：我收到质疑广播 默认质疑他`);
			this.emit('is-query-wd-doubt')
		})
	}
}

export default BasicComputer