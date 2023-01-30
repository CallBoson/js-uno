import Player from '../Player.js'

class BasicComputer extends Player {
	constructor(options) {
	    super(options)

		this.on('is-replay', (card) => {
			// 抽回来的牌能打出 询问是否需要打出
			this.current_select = card
			this.$refs['replay-popup'].open()
		})
		
		this.on('is-query-wd', () => {
			console.log(`${player.nickname} 收到质疑广播`);
			uni.showModal({
				content: '对方打出了+4牌，是否接受加牌/质疑',
				cancelText: '接受加牌',
				confirmText: '质疑',
				success: (res) => {
					if (res.cancel) {
						// 接受加牌
						player.emit('is-query-wd-draw')
					} else {
						// 质疑
						player.emit('is-query-wd-doubt')
					}
				}
			})
		})
	}
}

export default BasicComputer