import { loadImage } from './utils.js'
import { checkCollision } from './collision.js'

const canvas = document.querySelector('canvas');

class Game {
	SPEED = 3
	DISTANCE_BETWEEN_PIPES = 3.5 * Pipe.width
	frameCount = 0
	score = 0
	isGameStarted = false 

	constructor(canvas) {
		this.canvas = canvas
		this.ctx = this.canvas.getContext('2d')
		const height = window.visualViewport
			? window.visualViewport.height
			: window.innerHeight
		const width = window.visualViewport
			? Math.min(window.visualViewport.width, height * 0.6)
			: Math.min(window.innerWidth, height * 0.6)
		this.canvas.height = 900
		this.canvas.width = (900 * width) / height

		this.BG_IMG = new Image()
		this.pipes = [new Pipe(this.canvas)]
		this.ground = new Ground(this.canvas) // экземпляр класса земли
		this.bird = new Bird(this.canvas) // экземпляр класса птички
	}

	async loadAssets() {
		// await loadImage(this.BG_IMG, './img/bg.png')
		await Promise.all([
			loadImage(this.BG_IMG, './img/bg.png'), // грузим фоновое изображение
			Pipe.preloadImages(), // грузим трубы
			Ground.preloadImage(), // грузим землю
			Bird.preloadImage(), // грузим птичку
		])
	}
	loadImage(img, src) {
		return new Promise((resolve, reject) => {
			img.onload = resolve
			img.onerror = reject
			img.src = src
		})
	}

	start() {
		this.initializeControls() // управление птичкой      
		this.intervalId = setInterval(() => this.draw(), 10)
	}

	stop() {
		clearInterval(this.intervalId)
	}

	draw() {
		// this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

		this.ctx.drawImage(this.BG_IMG, 0, 0, this.canvas.width, this.canvas.height)

		// рисуем птичку при начале игры
			if (!this.isGameStarted) {
				this.ground.update(this.SPEED)
				this.bird.draw()
				this.displayScore()
				return
			}

		if (this.frameCount * this.SPEED > this.DISTANCE_BETWEEN_PIPES) {
			this.pipes.push(new Pipe(this.canvas))
			this.frameCount = 0
		}

		// this.updatePipes()
		this.ground.update(this.SPEED)
		this.bird.update()
		this.displayScore() //для отображения очков
		// проверка на столкновение
		if (checkCollision(this.bird, this.pipes, this.ground)) this.stop()
		this.updatePipes()
		this.frameCount++
	}

	updatePipes() {
		for (let i = 0; i < this.pipes.length; i++) {
			this.pipes[i].update(this.SPEED)
			if (this.pipes[i].isOffscreen()) {
				this.pipes.shift()
				i--
					this.score++
			}
		}
	}

	// для полёта птички
	initializeControls() {
		if ('ontouchstart' in window) {
			document.addEventListener('touchstart', this.handleFlap)
		} else {
			document.addEventListener('mousedown', this.handleFlap)
		}
		document.addEventListener('keydown', this.handleFlap)
	}

	handleFlap = event => {
		if (event.type === 'keydown' && event.code !== 'Space') return
		// начало иры по клику
		if (!this.isGameStarted) this.isGameStarted = true
		this.bird.flap()
	}

	displayScore() { // рисуем поле с количеством очков
		this.ctx.font = '60px Arial'
		this.ctx.fillStyle = 'white'
		this.ctx.textAlign = 'center'

		this.ctx.lineWidth = 8
		this.ctx.strokeStyle = '#533846'
		this.ctx.textBaseline = 'top'
		this.ctx.strokeText(this.score, this.canvas.width / 2, 15)
		this.ctx.fillText(this.score, this.canvas.width / 2, 15)
	}
}



class Pipe {
	static width = 100
	// трубы
	static topPipeImg
	static bottomPipeImg
	width = Pipe.width
	spacing = 220

	static async preloadImages() {
		Pipe.topPipeImg = new Image()
		Pipe.bottomPipeImg = new Image()
		await Promise.all([
			loadImage(Pipe.topPipeImg, './img/top-pipe.png'),
			loadImage(Pipe.bottomPipeImg, './img/bottom-pipe.png'),
		])
	}

	constructor(canvas) {
		this.canvas = canvas
		this.ctx = canvas.getContext('2d')
		this.canvasHeight = canvas.height
		this.top =
			this.canvasHeight / 10 +
			Math.round(Math.random() * (this.canvasHeight / 3))
		this.bottom = this.top + this.spacing
		this.x = canvas.width
	}

	draw() {
		// this.ctx.fillStyle = 'blue'
		// this.ctx.fillRect(this.x, 0, this.width, this.top)
		// this.ctx.fillRect(
		// 	this.x,
		// 	this.bottom,
		// 	this.width,
		// 	this.canvasHeight - this.bottom
		// )

		this.ctx.drawImage(
			Pipe.topPipeImg,
			this.x,
			this.top - Pipe.topPipeImg.height
		)

		this.ctx.drawImage(Pipe.bottomPipeImg, this.x, this.bottom)
	}

	update(speed = 3) {
		this.x -= speed
		this.draw()
	}

	isOffscreen() {
		return this.x < -this.width
	}
}


class Ground {
	static groundImg
	width = 2000
	height = 100

	static async preloadImage() {
		Ground.groundImg = new Image()
		await loadImage(Ground.groundImg, './img/ground.png')
	}

	constructor(canvas) {
		this.canvas = canvas
		this.ctx = canvas.getContext('2d')
		this.x = 0
		this.y = canvas.height - this.height
	}

	draw() {
		this.ctx.drawImage(Ground.groundImg, this.x, this.y)
	}

	update(speed = 3) {
		this.x -= speed
		if (this.x <= -this.width / 2) this.x = 0
		this.draw()
	}
}
// 

class Bird {
	static birdImg // для хранения изображения
	width = 66 // размер птички
	height = 47 // размер птички
	hitboxWidth = 55
	hitboxHeight = 35
	flapPower = 4 // скорость взмахов крыльев
	gravity = 0.15 // скорость падения

	static async preloadImage() {
		Bird.birdImg = new Image() // новый экземпляр птички
		await loadImage(Bird.birdImg, './img/bird.png')
	}

	constructor(canvas) {
		this.canvas = canvas
		this.ctx = canvas.getContext('2d')
		this.x = canvas.width / 10 // расположение птички
		this.y = canvas.height / 4 // расположение птички
		this.velocity = 0 // начальная скорость
	}

	draw() {
		this.ctx.drawImage(
			Bird.birdImg,
			this.x - this.width / 2,
			this.y - this.height / 2
		)
	}

	flap() {
		this.velocity = -this.flapPower
	}

	update() {
		this.velocity += this.gravity
		this.y += this.velocity

		this.draw()
	}
}



const game = new Game(canvas);
game.loadAssets().then(() => game.start());





// Задание 1 (17.5.1)
// принимаем строку
function ff(str){
    // if(typeof(str)!=='string'){
			// разбиваем строку на массив
			// реверс элементов в массиве
			// объединяем все элементы массива в одно строковое значение
			let backway = str.split('').reverse().join('')
			return backway
		// }
}
// ff('Виктор');
console.log(ff('Виктор'))
// console.log(typeof(str));
