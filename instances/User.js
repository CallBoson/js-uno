import { GenNonDuplicateID } from '../utils/common.js'
import EventEmitter from 'events'

// 用户类
class User extends EventEmitter {
	nickname = ''
	avatarUrl = ''
	coins = 0
	
	constructor(options) {
		super()
		if (options?.uid) {
			this.uid = options.uid
		} else {
			this.uid = GenNonDuplicateID() // 生成随机用户id
		}
	    this.nickname = options.nickname
		this.avatarUrl = options.avatarUrl
		this.coins = options.coins
	}
	
	get coins() {
		return this.coins
	}
	
	get nickname() {
		return this.nickname
	}
	
	get avatarUrl() {
		return this.avatarUrl
	}
	
	changeCoins(coins) {
		const preCoins = String(Number(this.coins) + Number(coins)) // 预估金币，若小于0，则=0
		this.coins = preCoins >= 0 ? preCoins : 0
		
		// 若增减金币时该用户存在于本地存储 则更新ls
		const ls = uni.getStorageSync('user')
		if (ls && JSON.parse(ls).uid === this.uid) {
			uni.user = {
				uid: this.uid,
				coins: this.coins,
				nickname: this.nickname
			}
			uni.setStorageSync('user', JSON.stringify(uni.user))
		}
	}
}

export default User