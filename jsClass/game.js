import { Pipe } from './pipe.js'
import { loadImage } from './utils.js'
import { Ground } from './ground.js'
import { Bird } from './bird.js'
import { checkCollision } from './collision.js'

export class Game {
	SPEED = 3 // скорость движения элементов
	DISTANCE_BETWEEN_PIPES = 3.5 * Pipe.width
	frameCount = 0
	score = 0
	localScore = localStorage.getItem('number')
	imgBird = './img/bg.png'
	isGameStarted = false

	constructor(canvas) {
		// принятый элемент
		this.canvas = canvas
		// контекст канваса
		this.ctx = this.canvas.getContext('2d')
		this.canvas.height = 900 // высота поля (холста)
		this.canvas.width = 900 // ширина (сделал по шире, чтоб больше труб выводилось на экран)
		this.BG_IMG = new Image()
		this.pipes = [new Pipe(this.canvas)] //
		this.ground = new Ground(this.canvas) // экземпляр класса земли
		this.bird = new Bird(this.canvas) // экземпляр класса птички
	}

	async loadAssets() {
		await Promise.all([
			loadImage(this.BG_IMG, this.imgBird), // грузим фоновое изображение
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
	//
	start() {
		this.initializeControls() // управление птичкой
		// с интервалом в 10 милли сек вызываем метод draw
		this.intervalId = setInterval(() => this.draw(), 10)
	}

	stop() {
		clearInterval(this.intervalId)
	}

	draw() {
		this.ctx.drawImage(this.BG_IMG, 0, 0, this.canvas.width, this.canvas.height)

		// рисуем птичку при начале игры
		if (!this.isGameStarted) {
			this.ground.update(this.SPEED)
			this.bird.draw()
			this.displayScore()
			this.displayLocalScore()
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
		this.displayLocalScore()
		// проверка на столкновение
		if (checkCollision(this.bird, this.pipes, this.ground)) this.stop()
		this.updatePipes() // метод отрисовки труб
		this.frameCount++
	}
	// метод отрисовки труб
	updatePipes() {
		for (let i = 0; i < this.pipes.length; i++) {
			this.pipes[i].update(this.SPEED)
			if (this.pipes[i].isOffscreen()) {
				this.pipes.shift()
				i--
				this.score++
				this.localScore = localStorage.setItem('number', this.score)
				this.localScore = localStorage.getItem('number')
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

	styleDisplay() {
		// стили для очков
		this.ctx.font = '60px Arial'
		this.ctx.fillStyle = 'white'
		this.ctx.textAlign = 'center'

		this.ctx.lineWidth = 8
		this.ctx.strokeStyle = '#533846'
		this.ctx.textBaseline = 'top'
	}

	displayScore() {
		// рисуем поле с количеством очков
		this.styleDisplay()
		this.ctx.strokeText(this.score, this.canvas.width / 2, 15)
		this.ctx.fillText(this.score, this.canvas.width / 2, 15)
	}

	displayLocalScore() {
		// рисуем поле с количеством очков в истории
		this.styleDisplay()
		this.ctx.strokeText(this.localScore, this.canvas.width / 2, 95)
		this.ctx.fillText(this.localScore, this.canvas.width / 2, 95)
	}
}
