<template>
	<view class="container">
		<bg></bg>
		<view class="game-state-wrap">
			<view class="rate">{{ rate }}倍场</view>
			<view class="seconds">{{ gameSeconds }}</view>
		</view>
		
		<view class="state-wrap"></view>
		
		<view class="draws-wrap" @click="draw()" :class="current_player.uid === self_user.uid ? 'active' : ''">
			<view class="cones">
				<view class="box1"></view>
				<view class="box2"></view>
				<view class="box3"></view>
				<view class="box4"></view>
				<view class="box5"></view>
			</view>
			
			<image src="../../static/images/back-card.png" 
				mode="aspectFill"
				v-for="item in 10"></image>
			<image class="fake-b-card"
				src="../../static/images/back-card.png"
				mode="aspectFill"></image>
		</view>
		<image class="arrow-image" src="../../static/images/arrow.png" mode="aspectFit"></image>
		
		<view class="showing-card-wrap">
			<view class="showing-card" v-for="(card, cardIndex) in showingCards" :class="card.color">{{ symbol(card.symbol) }}</view>
		</view>
		
		<view class="card-pool-wrap">
			<view class="card" v-for="(card, cardIndex) in passCardPool" :class="card.color">{{ symbol(card.symbol) }}</view>
		</view>
		
		<view class="players-wrap" @click.self="cancelSelectCard">
			<view v-for="(player, playerIndex) in players" 
					class="player" 
					:class="current_player.uid === player.uid ? 'current-user' : ''"
					:id="`player-${playerIndex}`">
				<view class="info-wrap">{{ player.nickname }}</view>
				<template v-if="player.uid === self_user.uid">
					<view class="cards-wrap">
						<view @click="selectCard($event, card, player.cards.length)"
								:id="`card-${cardIndex}`"
								class="m-card" :class="[card.color, current_select === card ? 'selected' : '', adviceCards.includes(card) && current_player.uid === self_user.uid ? 'advice' : '']" 
								v-for="(card, cardIndex) in player.cards"
								:style="{ left: `${player.cards.length < 7 ? cardIndex * 45 : (cardIndex * 300 / player.cards.length)}rem` }">
							{{ symbol(card.symbol) }}
						</view>
					</view>
				</template>
				
				<template v-else>
					<view class="back-cards-wrap">
						<view class="back-card"></view>
						<view class="count">x{{ player.cards.length }}</view>
					</view>
					<view class="uno-text"
							:style="{ opacity: player.isUno ? '1' : '0' }">UNO</view>
				</template>
			</view>
		</view>
		
		<image class="uno-btn"
				:class="players[0] && players[0].isUno ? 'uno' : ''"
				src="../../static/images/uno-btn.png"
				mode="aspectFit"
				@click="uno()"></image>
		
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
import Game from './game.js'
export default Game;
</script>

<style scoped lang="scss">
@import './game.scss';
</style>
