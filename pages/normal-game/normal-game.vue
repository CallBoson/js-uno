<template>
	<view class="container">
		<!-- <button type="primary" @click="startGame()">重新开始</button> -->
		<button type="warn">游戏剩余时间：{{ gameSeconds }}秒</button>
		<view class="card-pool-wrap">
			<view class="card" v-for="(card, cardIndex) in passCardPool" :class="card.color" :style="{ left: cardIndex * 30 + 'rpx' }">{{ symbol(card.symbol) }}</view>
		</view>
		
		<view style="margin-top: 200rpx;">
			<view v-for="(player, playerIndex) in players" style="display: flex;margin-bottom: 20rpx;align-items: center;" :class="current_player === player ? 'current-user' : ''">
				<view>{{ player.nickname }}{{ player.uid === self_user.uid ? '(自己)' : '' }}：</view>
				<view @click="selectCard(current_player === player, card)" class="card" :class="[card.color, current_select === card ? 'selected' : '']" v-for="(card, cardIndex) in player.cards">
					{{ symbol(card.symbol) }}
				</view>
				
				<template v-if="current_player === player">
					<button type="primary" @click="play()">出牌</button>
					<button type="primary" @click="draw()">抽牌</button>
					<button type="primary" @click="uno()">UNO</button>
				</template>
			</view>
		</view>
		
		<uni-popup ref="color-popup" type="center" :isMaskClick="false">
			<view class="color-select-wrap">
				<button type="default" @click="playWithColor('red')">red</button>
				<button type="default" @click="playWithColor('yellow')">yellow</button>
				<button type="default" @click="playWithColor('blue')">blue</button>
				<button type="default" @click="playWithColor('green')">green</button>
			</view>
		</uni-popup>
		
		<uni-popup ref="replay-popup" type="center" :isMaskClick="false">
			<view class="replay-wrap">
				<button type="default" @click="noreplay()">保留</button>
				<button type="default" @click="play({ type: 'replay' })">打出</button>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import Game from '../../instances/Game/NormalGame.js'
	import User from '../../instances/User.js'
	import Computer from '../../instances/Computer/BasicComputer.js'
	
	let game = null
	
	export default {
		data() {
			return {
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
				const user2 = new User({ nickname: 'Computer', coins: 100 })
				const user3 = new User({ nickname: 'test', coins: 100 })
				const user4 = new User({ nickname: 'Computer', coins: 100 })
				
				this.self_user = user1 // 自己
				
				game = new Game({
					users: [
						user1,
						user2,
						user3,
						user4
					]
				})
							
				game.on('players-changed', (players) => {
					this.players = players
				})
				
				game.on('passcardpool-changed', cards => {
					this.passCardPool = cards
				})
				
				game.on('state-changed', state => {
					this.current_player = state.currentPlayer
					this.gameSeconds = state.seconds
				})
				
				
				game.on('is-replay', (card) => {
					// 抽回来的牌能打出 询问是否需要打出
					this.current_select = card
					this.$refs['replay-popup'].open()
				})
				
				game.on('no-uno-draw', () => {
					// 没有喊uno
					uni.showToast({
						icon: 'none',
						title: '没有喊uno哦~'
					})
				})
				
				game.on('is-query-wd-success', () => {
					// 质疑成功
					uni.showToast({
						icon: 'success',
						title: '质疑成功'
					})
				})
				
				game.on('is-query-wd-fail', () => {
					// 质疑失败
					uni.showToast({
						icon: 'error',
						title: '质疑失败'
					})
				})
				
				game.on('is-query-wd', () => {
					uni.showModal({
						content: '对方打出了+4牌，是否接受加牌/质疑',
						cancelText: '接受加牌',
						confirmText: '质疑',
						success: (res) => {
							if (res.cancel) {
								// 接受加牌
								game.emit('is-query-wd-draw')
							} else {
								// 质疑
								game.emit('is-query-wd-doubt')
							}
						}
					})
				})
				
				game.on('game-end', options => {
					if (options.winner.uid === this.self_user.uid) {
						uni.showToast({
							title: '胜利啦！！',
							icon: 'none'
						});
					} else {
						uni.showToast({
							title: '失败～',
							icon: 'none'
						});
					}
				})
				
			},
			
			startGame() {
				this.init()
				game.start()
				
			},
			
			play(options) {
				if (options?.type === 'replay') {
					// 抽牌后再选择打出
					this.$refs['replay-popup'].close()
					
					game.emit('is-replay-callback', 'replay') // 返回保留事件
					
					// 抽牌后再选择打出，则自动喊uno，再打出一只
					if (this.current_player.cards.length === 2) {
						this.uno()
					}
				}
				
				if (this.current_select.symbol === 'W' || this.current_select.symbol === 'WD') {
					this.$refs['color-popup'].open()
					return
				}
				
				try {
					game.play({
						player: this.current_player,
						card: this.current_select,
					})
				} catch(err) {
					uni.showToast({
						icon: 'none',
						title: err.toString()
					})
				}
				
				
			},
			
			noreplay() {
				game.emit('is-replay-callback', 'noreplay') // 返回保留事件
				this.$refs['replay-popup'].close()
			},
						
			playWithColor(color) {
				this.$refs['color-popup'].close()
				game.play({
					player: this.current_player,
					card: this.current_select,
					turnToColor: color
				})
			},
			
			selectCard(isSelf, card) {
				if (!isSelf) {
					uni.showToast({
						icon: 'none',
						title: '还没轮到你出牌呢~'
					})
					return
				}
				
				this.current_select = card				
			},
			
			draw() {
				game.draw({
					player: this.current_player
				})
			},
			
			uno() {
				game.uno({
					player: this.current_player
				})
				uni.showToast({
					icon: 'none',
					title: 'UNO~~~~~'
				})
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
