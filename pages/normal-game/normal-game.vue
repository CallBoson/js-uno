<template>
	<view class="container">
		<!-- <button type="primary" @click="startGame()">重新开始</button> -->
		<view class="game-state-wrap">
			<view class="rate">{{ rate }}倍场</view>
			<view class="seconds">{{ gameSeconds }}</view>
		</view>
		<image class="arrow-image" :class="direction === 'cw' ? 'arrow-cw' : 'arrow-acw'" src="../../static/images/arrow.png" mode="aspectFit"></image>
		<view class="card-pool-wrap">
			<view class="card" v-for="(card, cardIndex) in passCardPool" :class="card.color">{{ symbol(card.symbol) }}</view>
		</view>
		
		<view class="players-wrap">
			<view v-for="(player, playerIndex) in players" class="player" :class="current_player === player ? 'current-user' : ''">
				<view class="info-wrap">{{ player.nickname }}</view>
				<view class="cards-wrap">
					<template v-if="player.uid === self_user.uid">
						<view @click="selectCard(current_player === player, card)" class="card" :class="[card.color, current_select === card ? 'selected' : '']" v-for="(card, cardIndex) in player.cards">
							{{ symbol(card.symbol) }}
						</view>
					</template>
					
					<template v-else>
						<view class="back-card" v-for="(card, cardIndex) in player.cards"></view>
					</template>
				</view>
			</view>
		</view>
		
		<view class="btns-wrap">
			<button type="warn" @click="play()">出牌</button>
			<button type="warn" @click="draw()">抽牌</button>
			<button type="warn" @click="uno()">UNO</button>
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
	page {
		background-color: rgb(17,129,238);
	}
	
	.container {
		position: relative;
		height: 100vh;
		box-sizing: border-box;
		overflow: hidden;
	}
	
	.game-state-wrap {
		position: absolute;
		right: 80rpx;
		top: 50rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		.rate {
			color: rgb(231,208,4);
			font-size: 50rpx;
		}
		
		.seconds {
			width: 150rpx;
			height: 150rpx;
			border-radius: 50%;
			border: 10rpx solid rgba(255,255,255,.8);
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: 60rpx;
			font-weight: bold;
			color: rgb(231,208,4);
		}
	}
	
	.arrow-image {
		position: absolute;
		width: 800rpx;
		height: 800rpx;
		left: 50%;
		top: 50%;
		opacity: .5;
	}
	
	.arrow-cw {
		animation: rotatecw 5s infinite linear;
		
		@keyframes rotatecw {
			from {
				transform: translate(-50%, -50%) rotate(0deg) scaleX(-1);
			}
			to {
				transform: translate(-50%, -50%) rotate(360deg) scaleX(-1);
			}
		}
	}
	
	.arrow-acw {
		animation: rotateacw 5s infinite linear;
		
		@keyframes rotateacw {
			from {
				transform: translate(-50%, -50%) rotate(360deg);
			}
			to {
				transform: translate(-50%, -50%) rotate(0deg);
			}
		}
	}
	
	.btns-wrap {
		position: absolute;
		display: flex;
		flex-direction: column;
		right: 100rpx;
		bottom: 50rpx;
		display: flex;
		button {
			margin-bottom: 10rpx;
		}
	}
	
	.players-wrap {
		position: relative;
		height: 100%;
		.player {
			position: absolute;
			display: flex;
			align-items: center;
			
			&:nth-child(1) {
				left: 50%;
				bottom: 0;
				transform: translateX(-50%);
			}
			
			&:nth-child(2) {
				left: 0;
				top: 50%;
				transform: translateY(-50%);
			}
			
			&:nth-child(3) {
				left: 50%;
				top: 0;
				transform: translateX(-50%);
			}
			
			&:nth-child(4) {
				right: 0;
				top: 50%;
				transform: translateY(-50%);
			}
			
			&:nth-child(2), &:nth-child(3), &:nth-child(4) {
				.cards-wrap {
					// transform: rotateY(70deg);
				}
			}
			
			.info-wrap {
				width: 230rpx;
				height: 230rpx;
				box-sizing: border-box;
				border-radius: 25rpx;
				font-size: 36rpx;
				padding: 10rpx;
				background-color: skyblue;
				word-break: break-all;
			}
			
			.cards-wrap {
				display: flex;
				margin-left: 30rpx;
				
				.back-card {
					position: relative;
					width: 100rpx;
					height: 150rpx;
					box-sizing: border-box;
					background-color: rgba(255, 255, 255, .8);
					border: 5rpx solid;
					border-radius: 15rpx;
					@for $i from 1 through 500 {
						&:nth-child(#{$i}) {
							left: -#{($i - 1) * 60}rpx;
						}
					}
				}
				.card {
					position: relative;
					width: 200rpx;
					height: 300rpx;
					color: #FFF;
					display: flex;
					justify-content: center;
					align-items: center;
					font-size: 100rpx;
					font-weight: bold;
					margin-right: 30rpx;
					border: 10rpx solid #fff;
					border-radius: 25rpx;
					box-shadow: 0rpx 0rpx 15rpx rgba(0,0,0,.5);
					transition: all .3s;
					box-sizing: border-box;
				}
				
				@for $i from 1 through 500 {
					.card:nth-child(#{$i}) {
						left: -#{($i - 1) * 100}rpx;
					}
				}
			}
		}
	}
	.current-user {
		.info-wrap {
			animation: shine .8s infinite linear alternate;
		}
		
		@keyframes shine {
			from {
				box-shadow: 0 0 0 30rpx rgba(231,208,4,0);
			}
			to {
				box-shadow: 0 0 0 30rpx rgba(231,208,4,1);
			}
		}
	}
	
	.selected {
		transform: translateY(-50rpx);
	}
	
	.card-pool-wrap {
		position: absolute;
		left: 50%;
		top: 50%;
		
		.card {
			position: absolute;
			left: 0;
			width: 200rpx;
			height: 300rpx;
			color: #FFF;
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: 120rpx;
			font-weight: bold;
			margin-right: 30rpx;
			border: 10rpx solid #fff;
			border-radius: 25rpx;
			box-shadow: 0rpx 0rpx 15rpx rgba(0,0,0,.5);
			filter: brightness(80%);
			
			&:last-child {
				filter: brightness(100%);
			}
		}
		
		@for $i from 1 through 500 {
			.card:nth-child(#{$i}) {
				transform: translate(-50%, -50%) rotateX(35deg) rotateZ(#{random(90) - 45}deg);
			}
		}
	}
	
	.green {
		background-color: rgb(48,139,15);
	}
	
	.red {
		background-color: rgb(195,11,0);
	}
	
	.blue {
		background-color: rgb(4,74,166);
	}
	
	.yellow {
		background-color: rgb(231,208,4);
	}
	
	.any {
		background-color: black;
	}
</style>
