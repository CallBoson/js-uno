<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			document.oncontextmenu = function (evt) {
			   evt.preventDefault();
			};
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	html {
		font-size: calc(100vw / 750);
	}
</style>
