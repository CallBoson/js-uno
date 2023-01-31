<template>
	<view class="container">
		<!-- <button type="primary" @click="startGame()">重新开始</button> -->
		<button type="warn">{{ rate }}倍场 游戏剩余时间：{{ gameSeconds }}秒</button>
		<view class="card-pool-wrap">
			<view class="card" v-for="(card, cardIndex) in passCardPool" :class="card.color" :style="{ left: cardIndex * 30 + 'rpx' }">{{ symbol(card.symbol) }}</view>
		</view>
		
		<view style="margin-top: 200rpx;">
			<view v-for="(player, playerIndex) in players" style="display: flex;margin-bottom: 20rpx;align-items: center;" :class="current_player === player ? 'current-user' : ''">
				<view>{{ player.nickname }}{{ player.uid === self_user.uid ? '(自己)' : '' }}：</view>
				<view @click="selectCard(current_player === player, card)" class="card" :class="[card.color, current_select === card ? 'selected' : '']" v-for="(card, cardIndex) in player.cards">
					{{ symbol(card.symbol) }}
				</view>
			</view>
		</view>
		
		<view style="display: flex;margin-top: 50rpx;">
			<button type="primary" @click="play()">出牌</button>
			<button type="primary" @click="draw()">抽牌</button>
			<button type="primary" @click="uno()">UNO</button>
		</view>
		
		<uni-popup ref="color-popup" type="center" :isMaskClick="false">
			<view class="color-select-wrap">
				<button type="default" @click="resolveSelectColor('red')">red</button>
				<button type="default" @click="resolveSelectColor('yellow')">yellow</button>
				<button type="default" @click="resolveSelectColor('blue')">blue</button>
				<button type="default" @click="resolveSelectColor('green')">green</button>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import Game from '../../instances/Game/NormalGame.js'
	import User from '../../instances/User.js'
	
	let game = null
	let selectedColorPromise = undefined
	
	export default {
		data() {
			return {
				rate: 0,
				self_user: {},
				players: [],
				current_player: {},
				current_select: {},
				passCardPool: [],
				gameSeconds: 0
			}
		},
		onLoad() {
			this.startGame()
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
				
				player.on('your-round', () => {
				})
				
				player.on('state-changed', state => {
					this.current_player = state.currentPlayer
					this.gameSeconds = state.seconds
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
				
				player.on('is-query-wd-success', (player) => {
					// 质疑成功
					uni.showToast({
						icon: 'success',
						title: `${player.nickname}：质疑成功`
					})
				})
				
				player.on('is-query-wd-fail', () => {
					// 质疑失败
					uni.showToast({
						icon: 'error',
						title: `${player.nickname}：质疑失败`
					})
				})
				
				player.on('is-query-wd', (isDoubtFunc) => {
					console.log(`${player.nickname} 收到质疑广播`);
					uni.showModal({
						content: '对方打出了+4牌，是否接受加牌/质疑',
						cancelText: '接受加牌',
						confirmText: '质疑',
						success: (res) => {
							if (res.cancel) {
								// 接受加牌
								isDoubtFunc(false)
							} else {
								// 质疑
								isDoubtFunc(true)
							}
						}
					})
				})
				
				player.on('game-end', scores => {
					scores.forEach(playerScore => {
						console.log(`第${playerScore.rank}名：${playerScore.player.nickname} 手牌分数：${playerScore.score} 金币：${playerScore.coins}`);
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
			
			selectCard(isSelf, card) {
				if (!isSelf) {
					return
				}
				
				this.current_select = card				
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
										return
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
</script>

<style lang="scss" scoped>
	.current-user {
		background-color: rgba(0,0,0,.3);
	}
	
	.selected {
		border: 10rpx solid purple !important;
		box-sizing: border-box;
	}
	
	.card-pool-wrap {
		position: relative;
		
		.card {
			position: absolute;
			left: 0;
			
		}
	}
	
	.card {
		width: 100rpx;
		height: 150rpx;
		color: #FFF;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 60rpx;
		font-weight: bold;
		margin-right: 30rpx;
		border: 1rpx solid #000;
	}
	
	.green {
		background-color: green;
	}
	
	.red {
		background-color: red;
	}
	
	.blue {
		background-color: blue;
	}
	
	.yellow {
		background-color: yellow;
	}
	
	.any {
		background-color: black;
	}
</style>
