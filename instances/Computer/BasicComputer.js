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
	
	listen() {
		this.on('currentplayer-changed', options => {
			if (options.currentPlayer.uid === this.uid) {
				if (options.actionState !== 'normal' && options.actionState !== 'play') return
				
				setTimeout(() => {
					for(let i = 0; i < this.cards.length; i++) {
						if (this.game.validateRules(this.cards[i])) {
							this.game.uno({ player: this })
							this.game.play({ player: this, card: this.cards[i] })
							return
						} else {
							continue
						}
					}
					this.game.draw({ player: this })
				}, getRandomNumber(5, 15) * 100)
			}
		})
		
		this.on('select-color', () => {
			const color = ['red', 'yellow', 'blue', 'green'][getRandomNumber(0, 3)]
			setTimeout(() => {
				this.game.selectColor({
					player: this,
					color
				})
			}, getRandomNumber(5, 15) * 100)
		})
		
		this.on('replay', () => {
			setTimeout(() => {
				this.game.replay({
					player: this,
					isReplay: true
				})
			}, getRandomNumber(5, 15) * 100)
		})
		
		this.on('doubt', () => {
			setTimeout(() => {
				this.game.doubt({
					player: this,
					isDoubt: getRandomNumber(0, 100) > 50 ? true : false
				})
			}, getRandomNumber(5, 15) * 100)
		})

		this.on('overlay-doubt', () => {
			setTimeout(() => {
				if (this.cards.some(c => c.symbol === 'WD')) {
					this.game.overlayDoubt({ player: this, doubtType: 'hit' })
				} else {
					this.game.overlayDoubt({ player: this, doubtType: getRandomNumber(0, 100) > 50 ? 'doubt' : 'draw' })
				}
			}, getRandomNumber(5, 15) * 100)
		})

	}
}

export default BasicComputer