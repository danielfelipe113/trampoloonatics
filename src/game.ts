import * as Phaser from 'phaser';

interface DeviceOrientationEvent {
	requestPermission?: () => Promise<string>;
  }
  
export default class TiltGame extends Phaser.Scene {
	private score = 0;
	private startTime = 0;

	private bg1: Phaser.GameObjects.Image;
	private bg2: Phaser.GameObjects.Image;
	private bg3: Phaser.GameObjects.Image;
	private bg4: Phaser.GameObjects.Image;
	private bg5: Phaser.GameObjects.Image;
	
	private scoreText: Phaser.GameObjects.Text;
	private maxScoreText: Phaser.GameObjects.Text;
	private buttonText: Phaser.GameObjects.Text;
	
	private trampoline: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private ball: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private isGameOver: boolean = false;
	private rightKeyPressed: boolean = false;
	private leftKeyPressed: boolean = false;

	private ballVelocityY: number = 200;
	private topQuarter = 0;
	// TODO: Set levels based on seconds, create the array dynamically. Give more points, increase ball speed and add more dynamic obstacles
	private activeBg: number = 1;
    private playedTime = 0;

	constructor() {
		super('TiltGame');
	}

	preload() {
		this.load.spritesheet('trampoline', 'assets/trampoloonatics/trampoline.png', {
			frameWidth: 32,
			frameHeight: 32
		});
		this.load.spritesheet('ball', 'assets/trampoloonatics/balli.png', {
			frameWidth: 32,
			frameHeight: 32
		});
		this.load.image('1-bg1', 'assets/trampoloonatics/m3/1.png');
  		this.load.image('1-bg2', 'assets/trampoloonatics/m3/2.png');
  		this.load.image('1-bg3', 'assets/trampoloonatics/m3/3.png');
  		this.load.image('1-bg4', 'assets/trampoloonatics/m3/4.png');
  		this.load.image('1-bg5', 'assets/trampoloonatics/m3/5.png');

		this.load.image('2-bg1', 'assets/trampoloonatics/m1/1.png');
  		this.load.image('2-bg2', 'assets/trampoloonatics/m1/2.png');
  		this.load.image('2-bg3', 'assets/trampoloonatics/m1/3.png');
  		this.load.image('2-bg4', 'assets/trampoloonatics/m1/4.png');
  		this.load.image('2-bg5', 'assets/trampoloonatics/m1/5.png');

		this.load.image('3-bg1', 'assets/trampoloonatics/m6/1.png');
  		this.load.image('3-bg2', 'assets/trampoloonatics/m6/2.png');
  		this.load.image('3-bg3', 'assets/trampoloonatics/m6/3.png');
  		this.load.image('3-bg4', 'assets/trampoloonatics/m6/4.png');
  		this.load.image('3-bg5', 'assets/trampoloonatics/m6/5.png');

		this.scene.scene.scale.on('resize', () => {
			const gameContainer = document.getElementById('game-container');
			
			
			const header = document.querySelector('#site-header');
			// Set the game containers to 100% of the visible viewport height minus the height of the header
			gameContainer.style.height = `${window.innerHeight - header.clientHeight}px`;
			gameContainer.style.width = '100%';
			
			const parentDimensions = {
				width: gameContainer.getBoundingClientRect().width,
				height: gameContainer.getBoundingClientRect().height
			};
				
			const width = parentDimensions.width;
			const height = parentDimensions.height;
			if(
				this.scene.scene.scale.width !== width ||
				this.scene.scene.scale.height !== height
			) {
				this.scene.scene.scale.setGameSize(width, height);
                if(this.scoreText) {
                    this.scoreText.setPosition(10, 10);
                }
				if(this.maxScoreText) {
                    this.maxScoreText.setPosition(this.scene.scene.scale.width - 275, 10);
                }
				this.topQuarter = this.scene.scene.scale.height * 0.25;
				this.setupBackground();
			}
		});
	}

	create() {
		this.topQuarter = this.scene.scene.scale.height * 0.25;
		this.isGameOver = false;
		this.startTime = this.game.getTime();
		
		this.setupBackground();
		
		// Set device motion (This also sets up the trampoline)
		this.setupDeviceMotion();

		
		this.setUpMenu();

		// Physics
		// Add a collider between the ball and the game world
		this.physics.world.setBoundsCollision(true, true, true, true);
		

		

		// Define a bottom boundary for the game world
		this.physics.world.on("worldbounds", (body, up, down) => {
			if(!this.isGameOver && body.gameObject === this.ball && down) {
				this.gameOver();
			}
		});
		
		// UI
		const maxScore = Number(localStorage.getItem('maxScore')) || 0;
		this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', fontSize: '32px', color: '#fff' });
		this.scoreText.setDepth(5);
		this.maxScoreText = this.add.text(Number(this.scene.scene.scale.width) - 275, 10, `Max Score: ${maxScore}`, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', fontSize: '32px', color: '#fff' });
		this.maxScoreText.setDepth(5);
		// Set background
		
		const backgroundTimer = this.time.addEvent({
			delay: 10000,
			loop: true,
			callback: this.setupBackground.bind(this)
		});
	}

	speedIncrement = 0.01;
	
	update(time: number, delta: number) {
		
		if(this.ballVelocityY > 900) {
			this.ballVelocityY += this.speedIncrement * delta;
		}

		
		// if (this.ball.y <= this.topQuarter) {
		// 	// Apply a force to the ball to simulate wind
		// 	const windForce = 200; // Adjust the force as needed
		// 	const windDirection = Math.random() > 0.5 ? 1 : -1;
		// 	this.ball.body.setVelocityX(windForce*windDirection);
		// }



		// Score
		const scoreFactor = 10000;
		if(!this.isGameOver) {
            this.playedTime += 1000;
			this.updateScore(Math.floor(this.playedTime / scoreFactor));
		} else {
			return;
		}

		// random number between 1 and 2
		const parallaxSpeed = Math.random() + 0.1;
		if(this.rightKeyPressed) {
			this.trampoline.setVelocityX(300);
			if(this.bg2.x > -140) {
				this.bg2.x -= parallaxSpeed;
			}
			if(this.bg3.x < 10) {
				this.bg3.x += parallaxSpeed;
			}
		}
		if(this.leftKeyPressed) {
			this.trampoline.setVelocityX(-300);
			if(this.bg2.x < 140) {
				this.bg2.x += parallaxSpeed;
			}
			if(this.bg3.x > -10) {
				this.bg3.x -= parallaxSpeed;
			}
		}
	}

	setupColliders() {
		this.physics.add.collider(this.ball, this.trampoline, () => {
			const horizontalVelocity = this.ball.body.velocity.x + this.trampoline.body.velocity.x;
			const velocityFactor = Math.random() * 3 - 1.5;
			let finalVelocity = (horizontalVelocity || this.ballVelocityY) * velocityFactor;
			
			finalVelocity = this.ballVelocityY * velocityFactor;
		
			this.trampoline.anims.play('bouncing');
			this.ball.setVelocityX(finalVelocity);
		});
	}
	
	setupBackground() {
		const possibleValues = [1, 2, 3];
		const randomIndex = Phaser.Utils.Array.GetRandom(possibleValues);
		this.activeBg = randomIndex;
		
		if(this.bg1) {
			this.bg1.destroy();
			this.bg2.destroy();
			this.bg3.destroy();
			this.bg4.destroy();
			this.bg5.destroy();
			this.bg1 = undefined;
			this.bg2 = undefined;
			this.bg3 = undefined;
			this.bg4 = undefined;
			this.bg5 = undefined;
		}
		
		this.bg1 = this.add.image(0, 0, `${this.activeBg}-bg1`).setOrigin(0);
		this.bg2 = this.add.image(0, 0, `${this.activeBg}-bg2`).setOrigin(0);
		this.bg3 = this.add.image(0, 0, `${this.activeBg}-bg3`).setOrigin(0);
		this.bg4 = this.add.image(0, 0, `${this.activeBg}-bg4`).setOrigin(0);
		this.bg5 = this.add.image(0, 0, `${this.activeBg}-bg5`).setOrigin(0);
		
		this.bg1.setDepth(0);
		this.bg2.setDepth(1);
		this.bg3.setDepth(2);
		this.bg4.setDepth(3);
		this.bg5.setDepth(4);

		this.bg1.setScale(Number(this.scene.scene.scale.width) / this.bg1.width, Number(this.scene.scene.scale.height) / this.bg1.height);
  		this.bg2.setScale(Number(this.scene.scene.scale.width) / this.bg2.width, Number(this.scene.scene.scale.height) / this.bg2.height);
  		this.bg3.setScale(Number(this.scene.scene.scale.width) / this.bg3.width, Number(this.scene.scene.scale.height) / this.bg3.height);
  		this.bg4.setScale(Number(this.scene.scene.scale.width) / this.bg4.width, Number(this.scene.scene.scale.height) / this.bg4.height);
  		this.bg5.setScale(Number(this.scene.scene.scale.width) / this.bg5.width, Number(this.scene.scene.scale.height) / this.bg5.height);
	}

	setupBall() {
		this.ball = this.physics.add.sprite(Number(this.sys.game.config.width) / 2, 0, 'ball');;
		this.ball.anims.create({
			key: 'ballSpin',
			frames: this.anims.generateFrameNumbers('ball', { start: 0, end: 8 }),
			frameRate: 10,
			repeat: -1
		});
		this.ball.setDepth(6);
		this.ball.anims.play('ballSpin');
		this.ball.setBounce(1);
		this.ball.setDragY(0);
		this.ball.setGravityY(100);
		this.ball.setCollideWorldBounds(true);
		this.ball.body.onWorldBounds = true;

	}

	setupDeviceMotion() {
		//@ts-ignore
		if (window.DeviceMotionEvent !== undefined && typeof window.DeviceMotionEvent.requestPermission === 'function') {
			//@ts-ignore
			window.DeviceMotionEvent.requestPermission()
				.then(permissionState => {
					if (permissionState === 'granted') {
						this.setupTrampoline();
					}
				})
				.catch(this.requestDeviceMotionPermissions.bind(this));
		} else {
			this.setupTrampoline();
		}
	}
	
	setUpMenu() {
		// this.buttonText = this.add.text(100, 100, 'Click me!', {
		// 	font: '48px Arial',
		// 	color: '#ffffff'
		// });
		
		// // Make the text interactive
		// this.buttonText.setInteractive();
		
		// // Add a click event handler to the text
		// this.buttonText.on('pointerdown', () => {

			
		// });
	}
	
	gameOver() {

		this.isGameOver = true;
		this.trampoline.body.stop();
		this.ball.body.stop();
		this.ball.anims.stop();
		// Stop the game and show game over message
		
		// Create a graphics object
		const graphics = this.add.graphics();

		// Set the fill color and alpha for the backdrop
		const fillColor = 0x000000; // black color
		const alpha = 0.5; // opacity

		// Draw a rectangle that covers the entire screen
		graphics.fillStyle(fillColor, alpha);
		graphics.fillRect(0, 0, this.scale.width, this.scale.height);
		
		graphics.setDepth(6);
		
		const gameOverText = this.add.text(Number(this.scene.scene.scale.width) / 2, Number(this.scene.scene.scale.height) / 2, "Game Over", {
		  fontSize: "46px",
		  color: "#ffffff"
		});
		gameOverText.setOrigin(0.5).setDepth(7);

		const score = this.add.text(Number(this.scene.scene.scale.width) / 2, Number(this.scene.scene.scale.height) / 2 + 75, `You got ${this.score} points`, {
			fontSize: "52px",
			color: "#ffffff"
		});
		score.setOrigin(0.5).setDepth(7);
	  
		// Create a restart button
		const restartButton = this.add.text(Number(this.scene.scene.scale.width) / 2, Number(this.scene.scene.scale.height) / 2 + 150, "Restart", {
		  fontSize: "32px",
		  color: "#ffffff",
		  backgroundColor: "#000000",
		  padding: {
			x: 10,
			y: 5
		  }
		});
		
		restartButton.setOrigin(0.5);
		restartButton.setDepth(7);
		restartButton.setInteractive({ useHandCursor: true });
	  
		// Reset the scene when the restart button is clicked
		const currentMaxScore = Number(localStorage.getItem('maxScore'));
		if(this.score > currentMaxScore) {
			this.maxScoreText.setText(`Max Score: ${this.score}`);
			this.maxScoreText.updateText();
            localStorage.setItem('maxScore', this.score.toString());
		}
        this.score = 0;
		restartButton.on('pointerdown', () => {
            this.playedTime = 0;
			this.scene.restart();
            this.updateScore(0)
		});
	}

	updateScore(points: number) {
		// this.score += points;
		this.score = points;
		this.scoreText.setText('Score: ' + points);
		this.scoreText.updateText();
	}

	setupTrampoline() {
		this.trampoline = this.physics.add.sprite(Number(this.sys.game.config.width) / 2, Number(this.sys.game.config.height), 'trampoline');
		
		this.trampoline.anims.create({
			key: 'bouncing',
			frames: this.anims.generateFrameNumbers('trampoline', { start: 0, end: 2 }),
			frameRate: 32,
			repeat: 0
		});
		this.trampoline.setCollideWorldBounds(true);
		this.trampoline.setBounce(0);
		this.trampoline.setGravity(0);
		this.trampoline.setScale(5);
		this.trampoline.setDepth(5);
		this.trampoline.setDrag(0);
		// Add keyboard controls
		const cursors = this.input.keyboard.createCursorKeys();

		
		cursors.left.on('down', () => {
			this.leftKeyPressed = true;
		});
		cursors.left.on('up', () => {
			this.leftKeyPressed = false;
			this.trampoline.setVelocityX(0);
		});
		cursors.right.on('down', () => {
			this.rightKeyPressed = true;
		});
		cursors.right.on('up', () => {
			this.rightKeyPressed = false;
			this.trampoline.setVelocityX(0);
		});

		
		this.setMovement();
		// Set up the ball
		this.setupBall();
		// Colliders
		this.setupColliders();
	}

	
	setMovement() {
		// Add an event listener for a user gesture (e.g. click)
		if (window.DeviceMotionEvent) {
			// Variables to store motion data
			let accelerationX = 0;
			let previousAccelerationX = 0;

			// Scaling factor to adjust the sensitivity
			const scalingFactor = 100;

			// Threshold value to detect direction change
			const directionThreshold = 0.5;

			// Low-pass filter variables
			const alpha = 0.8;
			window.addEventListener('devicemotion', (event) => {
				 // Extract the raw acceleration values
				const rawAccelerationX = event.accelerationIncludingGravity.x * scalingFactor;

				// Apply the low-pass filter
				accelerationX = alpha * previousAccelerationX + (1 - alpha) * rawAccelerationX;

				// Determine the direction of motion
				let direction = '';
				if (accelerationX - previousAccelerationX > directionThreshold) {
					direction = 'right';
					this.rightKeyPressed = true;
					this.leftKeyPressed = false;
				} else if (previousAccelerationX - accelerationX > directionThreshold) {
					this.leftKeyPressed = true;
					this.rightKeyPressed = false;
					direction = 'left';
				}

				// Update the phaser object position based on direction
				if (direction === 'right') {
					// Move the phaser object to the right
					// Add your code here to update the position accordingly
				} else if (direction === 'left') {
					// Move the phaser object to the left
					// Add your code here to update the position accordingly
				}

				// Store the current acceleration as previous for the next iteration
				previousAccelerationX = accelerationX;
				console.log(accelerationX);
				this.trampoline.setVelocityX(accelerationX);
			});
		} else {
			console.warn("Device orientation not supported");
		}
	}

	requestDeviceMotionPermissions() {
		this.scene.pause();
		const backdrop = document.querySelector('#backdrop') as HTMLDivElement;
		backdrop.style.display = 'block';
		const setupBtn = document.querySelector('#btn') as HTMLButtonElement;
		setupBtn.style.display = 'block';
		setupBtn.addEventListener('click', () => {
			//@ts-ignore
			window.DeviceMotionEvent.requestPermission()
				.then(permissionState => {
					if (permissionState === 'granted') {
						this.scene.restart();
						this.setupTrampoline();
						setupBtn.style.display = 'none';
						backdrop.style.display = 'none';
					}
				})
				.catch(console.error);
			
		});
	}


	
}

const gameContainer = document.getElementById('game-container');


const header = document.querySelector('#site-header');
// Set the game containers to 100% of the visible viewport height minus the height of the header
gameContainer.style.height = `${window.innerHeight - header.clientHeight}px`;
gameContainer.style.width = '100%';


const parentDimensions = {
	width: gameContainer.getBoundingClientRect().width,
	height: gameContainer.getBoundingClientRect().height
};
const config: Phaser.Types.Core.GameConfig = {
    
    type: Phaser.AUTO,
    backgroundColor: '#125555',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: parentDimensions.width,
        height: parentDimensions.height,
    },
    
    scene: TiltGame,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    audio: {
        disableWebAudio: true
    },
    parent: gameContainer,
};

const game = new Phaser.Game(config);
