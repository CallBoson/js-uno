import App from './App'
import Vue from 'vue'
import User from './instances/User.js'

Vue.config.productionTip = false

App.mpType = 'app'

// 登录，获取用户数据
if (!uni.getStorageSync('user')) {
	uni.user = new User({
		nickname: '游客',
		coins: '200'
	})
	uni.setStorageSync('user', JSON.stringify(uni.user))
} else {
	uni.user = new User(JSON.parse(uni.getStorageSync('user')))
}

const app = new Vue({
    ...App
})
app.$mount()
