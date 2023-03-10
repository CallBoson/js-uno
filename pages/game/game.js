import Game from '../../instances/Game/Game.js'
import User from '../../instances/User.js'
import bg from '../../components/background/background.vue'
import gsap from 'gsap'

let game = null
let selectedColorPromise = undefined
const marginChangedEls = []
let directionAnimation = undefined
const positions = []

export default {
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
			direction: '',
			showingCards: [],
		}
	},
	components: {
		bg
	},
	mounted() {
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
			]
		})

		const players = game.getPlayers()
		this.players = JSON.parse(JSON.stringify(players))
		players.forEach(player => {
			if (player.uid === this.self_user.uid) {
				this.$nextTick(() => {
					this.initEmitter(player)
					this.initPlayerPosition()
				})
			} else if (player.isComputer) {
				player.setGame(game)
			}
		})
		
		this.$nextTick(() => {
			game.start()
		})
		
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
		initPlayerPosition() {
			this.players.forEach((player, playerIndex) => {
				const targetEl = document.querySelector(`#player-${playerIndex}`)
				positions.push({
					x: targetEl.getBoundingClientRect().left,
					y: targetEl.getBoundingClientRect().top
				})
			})
		},
		initEmitter(player) {
			player.on('deal', options => {
				const p = this.findPlayer(options.to)
				const node = document.querySelector('.draws-wrap').appendChild(document.querySelector('.fake-b-card').cloneNode(true))
				gsap.to(node, {
					x: positions[p.index].x,
					y: positions[p.index].y,
					rotateX: 0,
					rotateZ: 0,
					duration: 0.8,
					onComplete: () => {
						p.player.cards.push(options.card)
						this.sortCards()
						const pn = node.parentNode
						pn.removeChild(node)
					}
				})
			})
			
			player.on('hit', (options) => {
				const addToPool = () => {
					options.cards.forEach(c => {
						this.passCardPool.push(c)
					})
				}
				if (options.from) {
					const spliceFromHand = (player) => {
						options.cards.forEach(card => {
							const cardIndex = player.cards.findIndex(c => card.id === c.id)
							if (cardIndex > -1) {
								player.cards.splice(cardIndex, 1)
							}
						})
					}
					
					const p = this.findPlayer(options.from)
					spliceFromHand(p.player)
					this.showingCards = options.cards
					const ani = gsap.fromTo('.showing-card-wrap', {
						opacity: 1,
						x: positions[p.index].x,
						y: positions[p.index].y,
					}, {
						x: '45vw',
						y: '45vh',
						opacity: 1,
						duration: 1,
						onComplete: () => {
							ani.revert()
							addToPool()
						}
					})
				} else {
					addToPool()
				}
			})
			
			player.on('gametime-changed', (seconds) => {
				this.gameSeconds = seconds
			})
			
			player.on('direction-changed', (direction) => {
				this.direction = direction
				if (directionAnimation) {
					directionAnimation.kill()
				}
				const tl = gsap.timeline()
				directionAnimation = tl
				tl.fromTo('.arrow-image', {
					opacity: 0,
					zoom: '0%'
				}, {
					opacity: 1,
					zoom: '150%',
					duration: 0.8,
					ease: 'elastic'
				})
				
				tl.to('.arrow-image', {
					rotateY: direction === 'cw' ? 0 : 180,
					// scaleX: direction === 'cw' ? 1 : -1,
					duration: 0.5,
				})
				
				tl.to('.arrow-image', {
					zoom: '100%',
					opacity: 0.4,
					duration: 1
				})
				
				tl.fromTo('.arrow-image', {
					rotateZ: direction === 'cw' ? 0 : 360,
				}, {
					rotateZ: direction === 'cw' ? 360 : 0,
					repeat: -1,
					duration: 5,
					ease: 'linear'
				})
				
			})
			
			player.on('currentplayer-changed', (options) => {
				this.current_player = this.findPlayer(options.currentPlayer).player
			})
			
			player.on('doubt-success', targetPlayer => {
				const p = this.findPlayer(targetPlayer)
				this.showStateText({
					x: positions[p.index].x,
					y: positions[p.index].y,
					text: '质疑成功',
					color: 'rgb(48,139,15)'
				})
			})
			player.on('doubt-fail', targetPlayer => {
				const p = this.findPlayer(targetPlayer)
				this.showStateText({
					x: positions[p.index].x,
					y: positions[p.index].y,
					text: '质疑失败',
					color: 'rgb(195,11,0)'
				})
			})

			player.on('overlay-doubt', () => {
				const p = this.findPlayer(player)
				const isDoubt = () => {
					uni.showModal({
						content: '对方打出了+4，是否质疑',
						cancelText: '接受加牌',
						confirmText: '质疑',
						success: (res) => {
							if (res.cancel) {
								game.overlayDoubt({
									player,
									doubtType: 'draw'
								})
							} else {
								game.overlayDoubt({
									player,
									doubtType: 'doubt'
								})
							}
						}
					})
				}
				if (p.player.cards.some(c => c.symbol === 'WD')) {
					uni.showModal({
						content: '对方打出了+4，是否打出+4？',
						cancelText: '不打出',
						confirmText: '打出+4',
						success: (res) => {
							if (res.cancel) {
								isDoubt()
							} else {
								game.overlayDoubt({ player, doubtType: 'hit' })
							}
						}
					})
				} else {
					isDoubt()
				}
				
			})
			
			player.on('skiped', targetPlayer => {
				const p = this.findPlayer(targetPlayer)
				this.showStateText({
					x: positions[p.index].x,
					y: positions[p.index].y,
					text: '🈲',
					color: '#FFF'
				})
			})
			
			player.on('drawed', options => {
				const p = this.findPlayer(options.targetPlayer)
				this.showStateText({
					x: positions[p.index].x,
					y: positions[p.index].y,
					text: `+${options.count}`,
					color: '#FFF'
				})
			})
			
			player.on('uno-state-changed', options => {
				const p = this.findPlayer(options.player)
				p.player.isUno = options.isUno
			})
			
			player.on('hint', text => {
				uni.showToast({
					icon: 'none',
					title: text
				})
			})

			player.on('reciprocal-request', state => {
				switch(state) {
					case 'select-color': 
						this.selectColor().then((color) => {
							game.responseReciprocal({ player, state, option: color })
						})
						break;

					case 'doubt': 
						uni.showModal({
							content: '对方打出了+4，是否质疑',
							cancelText: '接受加牌',
							confirmText: '质疑',
							success: (res) => {
								if (res.cancel) {
									game.responseReciprocal({ player, state, option: 'false' })
								} else {
									game.responseReciprocal({ player, state, option: 'true' })
								}
							}
						})
						break;

					case 'replay': 
						uni.showModal({
							content: '该牌能打出，是否重新打出',
							cancelText: '保留',
							confirmText: '打出',
							success: (res) => {
								if (res.cancel) {
									game.responseReciprocal({ player, state, option: 'false' })
								} else {
									game.responseReciprocal({ player, state, option: 'true' })
								}
							}
						})
						break;

					case 'overlay-doubt': 
						const p = this.findPlayer(player)
						const isDoubt = () => {
							uni.showModal({
								content: '对方打出了+4，是否质疑',
								cancelText: '接受加牌',
								confirmText: '质疑',
								success: (res) => {
									if (res.cancel) {
										game.responseReciprocal({ player, state, option: 'draw' })
									} else {
										game.responseReciprocal({ player, state, option: 'doubt' })
									}
								}
							})
						}
						if (p.player.cards.some(c => c.symbol === 'WD')) {
							uni.showModal({
								content: '对方打出了+4，是否打出+4？',
								cancelText: '不打出',
								confirmText: '打出+4',
								success: (res) => {
									if (res.cancel) {
										isDoubt()
									} else {
										game.responseReciprocal({ player, state, option: 'hit' })
									}
								}
							})
						} else {
							isDoubt()
						}
						break;
				}
			})
			
		},
		findPlayer(targetPlayer) {
			for(let i = 0; i < this.players.length; i++) {
				if (this.players[i].uid === targetPlayer.uid) {
					return {
						player: this.players[i],
						index: i
					}
				}
			}
		},
		showStateText(options) {
			const x = options.x
			const y = options.y
			const text = options.text
			const color = options.color
			gsap.set('.state-wrap', {
				x,
				y: Number(y) - 50,
				opacity: 0
			})
			document.querySelector('.state-wrap').innerText = text
			
			gsap.to('.state-wrap', {
				x,
				y,
				color,
				opacity: 1,
				duration: 1,
				ease: 'elastic',
				onComplete: () => {
					document.querySelector('.state-wrap').innerText = ''
					gsap.set('.state-wrap', { x: -500, y: -500, opacity: 0 })
				}
			})
		},
		sortCards() {
			this.players.forEach(player => {
				player.cards.sort((a,b) => b.rank - a.rank)
			})
			
			// const tl = gsap.timeline()
			// const temp = []
			// tl.to('.m-card', {
			// 	left: (l,e) => {
			// 		temp.push(e.style.left)
			// 		return 0
			// 	},
			// 	duration: 0.3
			// })
			// tl.to('.m-card', {
			// 	left: (l) => {
			// 		return temp[l]
			// 	},
			// 	duration: 0.3,
			// 	delay: 0.3,
			// 	onComplete: () => {
			// 		this.players.forEach(player => {
			// 			player.cards.sort((a,b) => b.rank - a.rank)
			// 		})
			// 	}
			// })
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
		
		play() {			
			game.play({
				player: this.players.find(p => p.uid === this.self_user.uid),
				card: this.current_select
			})
			this.recoverMarginChangedEls()
		},
		
		draw() {
			game.draw({
				player: this.players.find(p => p.uid === this.self_user.uid),
			})
		},
		
		uno() {
			game.uno({
				player: this.players.find(p => p.uid === this.self_user.uid)
				
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
	}
}