// 生成一个随机id
export function GenNonDuplicateID(randomLength) {
  return Number(Math.random().toString().substr(3,randomLength) + Date.now()).toString(36)
}

//
export function getRandomNumber(min, max) {
	return Math.floor(Math.random() * (max + 1 - min) + min);
}