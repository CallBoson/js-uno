import { GenNonDuplicateID } from '../utils/common.js'

// 一张牌
export class Card {
	constructor(options) {
		this.id = GenNonDuplicateID()
	    this.color = options.color
		this.symbol = options.symbol
		this.rank = this.getCardRank()
	}
	
	getCardRank() {
		// 获取牌的权重，用于牌排序
		let colorRank = 0
		let symbolRank = 0
		if (this.color === 'any') {
			colorRank = 500
		} else if (this.color === 'red') {
			colorRank = 400
		} else if (this.color === 'yellow') {
			colorRank = 300
		} else if (this.color === 'blue') {
			colorRank = 200
		} else if (this.color === 'green') {
			colorRank = 100
		}
		
		if (this.symbol === 'WD') {
			symbolRank = 90
		} else if (this.symbol === 'W') {
			symbolRank = 80
		} else if (this.symbol === 'S') {
			symbolRank = 70
		} else if (this.symbol === 'D') {
			symbolRank = 60
		} else if (this.symbol === 'R') {
			symbolRank = 50
		} else {
			symbolRank = Number(this.symbol)
		}
		
		return colorRank + symbolRank
	}
}

// ----------------------------------------------------------

// 将数组打乱函数
function shuffle(arr) {
    let m = arr.length;
    while (m > 1){
        let index = Math.floor(Math.random() * m--);
        [arr[m] , arr[index]] = [arr[index] , arr[m]]
    }
    return arr;
}

let cardPool = [] // 牌堆
let cardPin = 0 // 牌堆游标

// 一副牌(deck of cards)
export class DeckCards {
	cards = undefined
	constructor(options) {
		this.cards = options.cards
		
		// 洗牌
		shuffle(this.createCardPool())
	}
	
	// 抽牌
	draw(count = 1) {
		const drawOne = () => {
			// 抽一张
			// 判断游标(cardPin)是否在最后，若是 即牌堆为空，新建一副牌并洗牌；若否 则获取一张牌，游标+1
			if (cardPin === cardPool.length) {
				shuffle(this.createCardPool())
				cardPin = 0
			}
			
			const card = cardPool[cardPin]
			cardPin ++
			return card
		}
		
		const cardArr = []
		for (let i = 0; i < count; i++) {
			cardArr.push(drawOne())
		}
		return cardArr
	}
	
	createCardPool() {
		// 新建一副牌
		cardPool = Array.from(this.cards, card => new Card(card))
		return cardPool
	}
}
