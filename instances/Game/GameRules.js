import { delay } from "../../utils/common"

// 出牌具体操作
class GameRules {
    validateRules(card) {
		if (this.settings.gameRules.isOverlay && this.overlayCards.length > 0) {
			// 开启加牌叠加模式且处于加牌中
			if (this.overlayCards.find(overlayCard => overlayCard.symbol === 'WD')) {
				// 若存在+4则只能出+4
				if (card.symbol === 'WD') {
					return true
				} else {
					return false
				}
			} else if (card.symbol === 'WD' || card.symbol === 'D') {
				return true
			} else {
				return false
			}
		}

		const referCard = this.basic.getLastPassPool() // 牌堆最后一张牌

		if (card.symbol.indexOf('W') != -1) {
			// 包含W即为万能牌
			return true
		}

		if (card.color === referCard.color || card.symbol === referCard.symbol) {
			// 同色或同数字
			return true
		}

		if (this.settings.twoColorAll) {
			// 双色全出

		}

		return false
	}

    async playRules(options) {
		// 出牌具体操作
		const player = options.player
		const card = options.card

		const hit = async () => {
			// 做把牌打出去的动作
			await this.hit({
				from: player,
				cards: card
			})

			// 没有喊uno+2
			if (this.basic.findPlayer(player).cards.length === 1 && !this.basic.hasUno(player)) {
				this.basic.boardcast({
					to: this.basic.players,
					event: 'drawed-two',
					data: player
				})
				await this.deal({
					to: player,
					cards: this.basic.getRandomCards(2)
				})

				this.hint({ player: this.basic.players, text: `${player.nickname} 没有喊UNO` })
			}
		}

		if (card.symbol.indexOf('W') != -1 && card.color === 'any') {
			// 打出任意牌并且未转色
			card.color = await this.waitResponse({ to: player, state: 'select-color' })
		}

		if (card.symbol === 'R') {
			// 转向
			await hit()
			this.basic.reverseDirection()
			await delay(2000)
			this.nextRound({ player: this.basic.getNextPlayer() })

		} else if (card.symbol === 'S') {
			// 跳过
			await hit()
			this.basic.boardcast({
				to: this.basic.players,
				event: 'skiped',
				data: this.basic.getNextPlayer()
			})
			await delay(1000)
			this.nextRound({ player: this.basic.getNextPlayer(this.basic.getNextPlayer()) })

		} else if (card.symbol === 'D' || card.symbol === 'WD') {
			await this.handleDrawCard(options, hit)
		} else {
			// 普通同色或同数字牌
			await hit()
			this.nextRound({ player: this.basic.getNextPlayer() })
		}
	}

	async handleDrawCard(options, hit) {
		const player = options.player
		const card = options.card

		const settleOverlayCard = async (to) => {
			// 结算叠加数组
			const sumOverlay = this.overlayCards.reduce( (accumulator, currentCard) => accumulator + (currentCard.symbol === 'D' ? 2 : 4), 0 )
			this.basic.boardcast({
				to: this.basic.players,
				event: 'drawed',
				data: { targetPlayer: to, count: sumOverlay }
			})
			await this.deal({
				to,
				cards: this.basic.getRandomCards(sumOverlay)
			})

			// 清空叠加数组
			this.overlayCards = []
		}

		await hit()
		this.overlayCards.push(card)

		if (card.symbol === 'D') {
			// +2
			if (this.settings.gameRules.isOverlay) {
				// 加牌叠加模式

				// 判断下一家有没有+2或+4
				if (this.basic.getNextPlayer().cards.some(c => c.symbol === 'D' || c.symbol === 'WD')) {
					// 有则跳过回合
					this.nextRound({ player: this.basic.getNextPlayer(), state: 'play' })
				} else {
					// 没有则将叠加数组内牌全部加到下一玩家
					await settleOverlayCard(this.basic.getNextPlayer())

					// 跳过被加牌玩家
					this.nextRound({ player: this.basic.getNextPlayer(this.basic.getNextPlayer()) })
				}
			} else {
				// 非加牌叠加模式直接清空数组
				await settleOverlayCard(this.basic.getNextPlayer())
				this.nextRound({ player: this.basic.getNextPlayer(this.basic.getNextPlayer()) })
			}
		} else if (card.symbol === 'WD') {
			// +4
            const lastCard = this.basic.getLastPassPool()
            const playSide = this.basic.currentPlayer
            const doubtSide = this.basic.getNextPlayer()
			const handleDoubt = async () => {
				if (playSide.cards.some(c => c.color.indexOf('W') === -1 && lastCard.color === c.color)) {
					// 质疑成功
					this.basic.boardcast({
						to: this.basic.players,
						event: 'doubt-success',
						data: doubtSide
					})
					await this.deal({
						to: playSide,
						cards: this.basic.getRandomCards(4)
					})
					await delay(800)
					this.nextRound({ player: doubtSide })
				} else {
					// 质疑失败
					this.basic.boardcast({
						to: this.basic.players,
						event: 'doubt-fail',
						data: doubtSide
					})
					await this.deal({
						to: doubtSide,
						cards: this.basic.getRandomCards(6)
					})
					await delay(800)
					this.nextRound({ player: this.basic.getNextPlayer(doubtSide) })
				}
			}
			if (this.settings.gameRules.isOverlay) {
				// 加牌叠加

				// 判断叠加数组是否第一次打出+4
				if (this.overlayCards.length === 1) {
					// 若第一次打出+4，下一家可以选择接受加牌(draw)/质疑(doubt)/打出+4(hit)
					this.nextRound({ player: doubtSide })
					let doubtType = await this.waitResponse({ to: doubtSide, state: 'overlay-doubt' })

                    // 若选择打出+4但没有+4牌则选择加牌
                    if (doubtType === 'hit' && !doubtSide.cards.some(c => c.symbol === 'WD')) {
                        doubtType = 'draw'
                    }

					if (doubtType === 'draw') {
						// 接受加牌
						await settleOverlayCard(doubtSide)
                        await delay(800)
                        this.nextRound({ player: this.basic.getNextPlayer(doubtSide) })
					} else if (doubtType === 'doubt') {
						// 质疑
                        await handleDoubt()
                        this.overlayCards = []

					} else if (doubtType === 'hit') {
						// +4
                        this.basic.setActionState({ player: doubtSide, state: 'play' })
                        this.play({
                            player: doubtSide,
                            card: doubtSide.cards.find(c => c.symbol === 'WD')
                        })
					}
				} else {
					// 若叠加数组不为空，则判断下一家有没有+4
					if (this.basic.getNextPlayer().cards.some(c => c.symbol === 'WD')) {
						// 有则跳过回合
						this.nextRound({ player: this.basic.getNextPlayer(), state: 'play' })
					} else {
						// 没有则将叠加数组内牌全部加到下一玩家
						await settleOverlayCard(this.basic.getNextPlayer())
						// 跳过被加牌玩家
						this.nextRound({ player: this.basic.getNextPlayer(this.basic.getNextPlayer()) })
					}
				}
			} else {
				this.nextRound({ player: doubtSide })
				const isDoubt = await this.waitResponse({ to: player, state: 'doubt' })

				if (isDoubt === 'true') {
					await handleDoubt()
					this.overlayCards = []

				} else {
					// 接受加牌
					await settleOverlayCard(doubtSide)
					await delay(800)
					this.nextRound({ player: this.basic.getNextPlayer(doubtSide) })
				}
			}
		}
	}
}

export default GameRules