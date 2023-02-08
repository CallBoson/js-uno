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
				console.log(`${this.nickname} 的回合，状态：${options.actionState}`);
				if (options.actionState !== 'normal') return
				
				setTimeout(() => {
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

	}
}

export default BasicComputer