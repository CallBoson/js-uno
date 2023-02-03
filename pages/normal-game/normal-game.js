import bg from '../../components/background/background.vue'
import Game from '../../instances/Game/NormalGame.js'
import User from '../../instances/User.js'

let game = null
let selectedColorPromise = undefined

const marginChangedEls = []
let animeObj = {}

export default {
	components: {
		bg
	},
	data() {
		return {
			rate: 0,
			self_user: {},
			players: [],
			current_player: {},
			current_select: {},
			passCardPool: [],
			gameSeconds: 0,
			adviceCards: [],
			direction: ''
		}
	},
	onLoad() {
		this.startGame()
	},
	mounted() {
		// 设置高度为可见屏幕高度，预防内容溢出
		const containerEl = document.querySelector('.container')
		containerEl.style.height = window.innerHeight + 'px'
	},
	computed: {
		symbol() {
			return function(str) {
				if (str === 'WD') {
					return '+4'
				}
				if (str === 'W') {
					return '转色'
				}
				if (str === 'R') {
					return '↩️'
				}
				if (str === 'D') {
					return '+2'
				}
				if (str === 'S') {
					return '🈲️'
				}
				return str
			}
		}
	},
	methods: {
		init() {
			const user1 = uni.user
			const user2 = new User({ nickname: 'Computer1', coins: 100, isComputer: true })
			const user3 = new User({ nickname: 'Computer2', coins: 100, isComputer: true })
			const user4 = new User({ nickname: 'Computer3', coins: 100, isComputer: true })
			
			this.self_user = user1 // 自己
			
			game = new Game({
				users: [
					user1,
					user2,
					user3,
					user4
				],
				initCardCount: 6,
				gameTime: 180
			})
			
			this.rate = game.rate
			
			let player = null
			game.players.forEach(p => {
				if (p.uid === this.self_user.uid) {
					player = p
				} else {
					// 若为电脑，把游戏对象传入
					p.setGame(game)
				}	
			})
			
			player.on('players-changed', (players) => {
				this.players = players
			})
			
			player.on('passcardpool-changed', cards => {
				this.passCardPool = cards
			})
			
			player.on('your-round', (options) => {
				this.cancelSelectCard()
				this.adviceCards = options.adviceCards
			})
			
			player.on('state-changed', state => {
				this.current_player = state.currentPlayer
				this.gameSeconds = state.seconds
				this.direction = state.direction
			})
			
			player.on('someone-uno', who => {
				uni.showToast({
					icon: 'none',
					title: `${who.nickname} 喊了UNO`
				})
			})
			
		
			
			player.on('no-uno-draw', (who) => {
				// 没有喊uno
				uni.showToast({
					icon: 'none',
					title: `${who.nickname} 没有喊UNO，+2张`
				})
			})
			
			player.on('is-query-wd-result', (options) => {
				// 质疑结果
				const str = options.type === 'success' ? '成功' : '失败'
				uni.showToast({
					icon: options.type === 'success' ? 'success' : 'error',
					title: `${options.player.nickname}：质疑${str}`
				})
			})
			
			player.on('is-query-wd', (options) => {
				console.log(`${player.nickname} 收到质疑广播`);
				uni.showModal({
					content: `${options.player.nickname} 打出了+4牌，是否接受加牌/质疑`,
					cancelText: '接受加牌',
					confirmText: '质疑',
					success: (res) => {
						if (res.cancel) {
							// 接受加牌
							options.doubtFunc(false)
						} else {
							// 质疑
							options.doubtFunc(true)
						}
					}
				})
			})
			
			player.on('game-end', scores => {
				let str = ''
				for(let i = scores.length - 1; i >= 0; i--) {
					str += `第${scores[i].rank}名：${scores[i].player.nickname} 手牌分数：${scores[i].score} 金币：${scores[i].coins}\n`
				}

				uni.showModal({
					showCancel: false,
					content: str
				})
			})

		},
		
		startGame() {
			this.init()
			game.start()
			
		},
		
		play() {
			if (this.current_player.uid !== this.self_user.uid) {
				uni.showToast({
					icon: 'none',
					title: '还没轮到你的回合哦'
				})
				return
			}
			
			const playFunc = (options) => {
				try {
					game.play(options)
					this.recoverMarginChangedEls()
				} catch(err) {
					uni.showToast({
						icon: 'none',
						title: err.toString()
					})
				}
			}
			
			if (this.current_select.symbol === 'W' || this.current_select.symbol === 'WD') {
				this.selectColor().then(color => {
					this.current_select.color = color
					playFunc({
						player: this.current_player,
						card: this.current_select,
					})
				})
				return
			}
			
			playFunc({
				player: this.current_player,
				card: this.current_select,
			})
		},
		
		resolveSelectColor(color) {
			selectedColorPromise.resolve(color)
			this.$refs['color-popup'].close()
		},
					
		selectColor() {
			this.$refs['color-popup'].open()
			const promise = new Promise((resolve) => {
				selectedColorPromise = { resolve }
			})
			return promise
		},
		
		selectCard(event, card, cardsLength) {
			// 若已选中，则直接出牌
			if (this.current_select === card) {
				this.play()
				return
			}
			
			this.current_select = card
			
			// 将上一次选择被拉开了距离的所有元素恢复
			this.recoverMarginChangedEls()
			
			// 若选择的不是最后一张牌，则将选择的之后所有牌拉开与选择的牌的距离
			let nextEl = document.querySelector(`#${event.currentTarget.id}`)
			do {
				nextEl = nextEl.nextSibling
				if (nextEl) {
					nextEl.style.marginLeft = 3 * cardsLength + 'rem'
					marginChangedEls.push(nextEl)
				}
			} while (nextEl)
		},
		
		recoverMarginChangedEls() {
			// 将上一次选择被拉开了距离的所有元素恢复
			marginChangedEls.forEach(e => {
				e.style.marginLeft = '0rem'
			})
		},
		
		cancelSelectCard() {
			this.current_select = {}
			this.recoverMarginChangedEls()
		},
		
		draw() {
			if (this.current_player.uid !== this.self_user.uid) {
				uni.showToast({
					icon: 'none',
					title: '还没轮到你的回合哦'
				})
				return
			}
			
			try {
				const drawed = game.draw({ player: this.current_player })
				if (drawed) {
					// 抽回来的牌能打出 询问是否需要打出
					uni.showModal({
						content: '是否继续打出',
						cancelText: '保留',
						confirmText: '打出',
						success: (res) => {
							if (res.cancel) {
								drawed.noreplay()
							} else {
								if (drawed.card.symbol === 'W' || drawed.card.symbol === 'WD') {
									this.selectColor().then(color => {
										drawed.card.color = color
										drawed.replay(drawed.card)
									})
								} else {
									drawed.replay(drawed.card)
								}
							}
						}
					})
				}
			} catch(err) {
				uni.showToast({
					icon: 'none',
					title: err.toString()
				})
			}
		},
		
		uno() {
			if (this.current_player.uid !== this.self_user.uid) {
				uni.showToast({
					icon: 'none',
					title: '还没轮到你的回合哦'
				})
				return
			}
			
			try {
				game.uno({ player: this.current_player })
			} catch (err) {
				uni.showToast({
					icon: 'none',
					title: err.toString()
				})
			}
		}
	}
}