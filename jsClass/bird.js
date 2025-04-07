import { loadImage } from './utils.js'

export class Bird {
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
