<template>
	<view class="main-container">
		<view class="top-wrap">
			<view class="info-wrap">
				<view class="avatar"></view>
				<view class="name">{{ user_info.nickname }}</view>
			</view>
			<view class="coins-wrap">{{ user_info.coins }}</view>
			<view class="achieve-wrap"></view>
		</view>
		<view class="center-wrap">
			<button type="primary" @click="startGame('normal-single')">经典单人模式</button>
			<button type="primary" @click="startGame('normal-couple')">经典双人模式</button>
			<button type="primary" @click="startGame('happy-single')">欢乐单人模式</button>
			<button type="primary" @click="startGame('happy-couple')">欢乐双人模式</button>
		</view>
		<view class="bottom-wrap"></view>
	</view>
</template>

<script>
	import User from '../../instances/User.js'
	export default {
		data() {
			return {
				user_info: {}
			}
		},
		onShow() {
			this.user_info = uni.user
		},
		methods: {
			startGame(mode) {
				let url = ""
				switch (mode) {
					case 'normal-single':
						url = '../normal-game/normal-game'
						break
				}
				
				uni.navigateTo({
					url
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
.main-container {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 30rpx 80rpx;
	height: 100vh;
	box-sizing: border-box;
	overflow: hidden;
}

.top-wrap {
	display: flex;
	justify-content: space-between;
	height: 150rpx;
	
	.info-wrap {
		display: flex;
		align-items: center;
		
		.avatar {
			width: 150rpx;
			height: 100%;
			border: 5rpx solid purple;
			border-radius: 20rpx;
			margin-right: 20rpx;
			box-sizing: border-box;
			background-color: skyblue;
		}
		
		.name {
			width: 400rpx;
			height: 100%;
			border: 5rpx solid black;
			border-radius: 20rpx;
			padding: 15rpx;
			box-sizing: border-box;
			font-size: 36rpx;
		}
	}
	
	.coins-wrap {
		width: 300rpx;
		height: 70%;
		border: 5rpx solid black;
		border-radius: 20rpx;
		padding: 15rpx;
		box-sizing: border-box;
		font-size: 40rpx;
	}
	
	.achieve-wrap {
		width: 500rpx;
		height: 100%;
		border: 5rpx solid black;
		border-radius: 20rpx;
		padding: 15rpx;
		box-sizing: border-box;
		font-size: 28rpx;
	}
}

.center-wrap {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-grow: 1;
	
	button {
		width: 450rpx;
		height: 700rpx;
		font-size: 100rpx;
	}
}

.bottom-wrap {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	border: 5rpx solid black;
	height: 100rpx;
}
</style>
