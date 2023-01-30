import $CARDS from './cards.js'

export const $CW = 'cw' // 顺时针
export const $ACW = 'acw' // 逆时针

export const _config = {
	mode: {
		"normal-single": {
			cards: $CARDS.normal,
			init_card_count: 6,
			player_count: 4,
		},
		"happy-single": {
			cards: $CARDS.normal,
			init_card_count: 8,
			player_count: 4,
		},
		"normal-couple": {
			cards: $CARDS.normal,
			init_card_count: 6,
			player_count: 4,
		},
		"happy-couple": {
			cards: $CARDS.normal,
			init_card_count: 8,
			player_count: 4,
		}
	}
}