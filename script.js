import { Game } from './jsClass/game.js'
// находим элемент по селектору
const canvas = document.querySelector('canvas')

const game = new Game(canvas)
game.loadAssets().then(() => game.start())
