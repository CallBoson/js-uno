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
					case 'normal-couple':
						url = '../game/game'
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
	padding: 5rem 8rem;
	height: 100vh;
	box-sizing: border-box;
	overflow: hidden;
}

.top-wrap {
	display: flex;
	justify-content: space-between;
	height: 70rem;
	
	.info-wrap {
		display: flex;
		align-items: center;
		
		.avatar {
			width: 70rem;
			height: 70rem;
			border: 5rem solid purple;
			border-radius: 10rem;
			margin-right: 20rem;
			box-sizing: border-box;
			background-color: skyblue;
		}
		
		.name {
			width: 150rem;
			height: 100%;
			border: 5rem solid black;
			border-radius: 10rem;
			padding: 8rem;
			box-sizing: border-box;
			font-size: 20rem;
		}
	}
	
	.coins-wrap {
		width: 130rem;
		height: 70%;
		border: 5rem solid black;
		border-radius: 10rem;
		padding: 8rem;
		box-sizing: border-box;
		font-size: 16rem;
	}
	
	.achieve-wrap {
		width: 150rem;
		height: 100%;
		border: 5rem solid black;
		border-radius: 10rem;
		padding: 8rem;
		box-sizing: border-box;
		font-size: 20rem;
	}
}

.center-wrap {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-grow: 1;
	
	button {
		width: 150rem;
		height: 200rem;
		font-size: 30rem;
		border-radius: 10rem;
	}
}

.bottom-wrap {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	border: 5rem solid black;
	height: 48rem;
}
</style>
