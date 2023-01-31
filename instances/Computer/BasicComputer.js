import Player from '../Player.js'

class BasicComputer extends Player {
	game = null
	
	constructor(options) {
	    super(options)
	}
	
	setGame(game) {
		this.game = game
		this.listen()
	}
	
	listen() {
		this.on('your-round', () => {
			setTimeout(() => {
				if (this.cards.length === 2) {
					this.game.uno({ player: this })
				}
				for(let i = 0; i < this.cards.length; i++) {
					if (this.cards[i].symbol === 'W' || this.cards[i].symbol === 'WD') {
						this.cards[i].color = 'red'
					}
					
					try {
						this.game.play({
							player: this,
							card: this.cards[i]
						})
						console.log(`${this.nickname}：成功打出`);
						return
					} catch (err) {
						continue
					}
				}
				
				console.log(`${this.nickname}：没有可出的牌，尝试抽牌`);
				
				const drawed = this.game.draw({ player: this })
				if (drawed) {
					// 抽牌后默认保留
					drawed.noreplay()
				}
			}, 1200)
		})
		
		this.on('no-uno-draw', (who) => {
			// 没有喊uno
			console.log(`${this.nickname}：我没有喊uno`);
		})
		
		this.on('is-query-wd', (options) => {
			console.log(`${this.nickname}：${options.player.nickname}给我打出了+4 默认质疑他`);
			setTimeout(() => {
				options.doubtFunc(true)
			}, 1500)
		})
	}
}

export default BasicComputer