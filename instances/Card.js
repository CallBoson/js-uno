// 一张牌
export class Card {
	constructor(options) {
	    this.color = options.color
		this.symbol = options.symbol
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

let cardPool = [] // 剩余牌堆
let cardPin = 0 // 牌堆游标

// 一副牌(deck of cards)
export class DeckCards {
	constructor(options) {
		cardPool = Array.from(options.cards, card => new Card(card))
		
		// 洗牌
		shuffle(cardPool)
	}
	
	// 抽牌
	draw(count = 1) {
		const drawOne = () => {
			// 抽一张
			// 判断游标(cardPin)是否在最后，若是 即牌堆为空，洗牌；若否 则获取一张牌，游标+1
			if (cardPin > cardPool.length - 1) {
				shuffle(cardPool)
				cardPin = 0
				drawOne()
			} else {
				const card = cardPool[cardPin]
				cardPin ++
				return card
			}
		}
		
		const cardArr = []
		for (let i = 0; i < count; i++) {
			cardArr.push(drawOne())
		}
		return cardArr
	}
}
