
import { Paddle } from './Paddle.js';
import { Ball } from './Ball.js';
import { Score } from './Score.js';
import { Lives } from './Lives.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 800;
        
        // Set canvas size based on background image when it loads
        this.backImg = new Image();
        this.backImg.src = 'back.jpg';
        this.frontImg = new Image();
        this.frontImg.src = 'front.jpg';

        this.gameState = 'start';
        this.keys = {};
        this.mouseX = 0;

        this.paddle = new Paddle(350, 750, 120, 18);
        this.ball = new Ball(400, 735, 10, '#0095DD');
        this.ballLaunched = false;
        this.shakeEffect = 0;
        
        this.bricks = [];
        this.score = new Score(0, 50, 20);
        this.lives = new Lives(3);
        this.bricks = [];
        this.score = new Score(0, 50, 20);
        this.lives = new Lives(3);

        this.init();
    }

    init() {
        this.createBricks();
    }

    createBricks() {
        const brickRowCount = 5;
        const brickColumnCount = 8;
        const brickWidth = 90;
        const brickHeight = 25;
        const brickPadding = 5;
        const totalBricksWidth = brickColumnCount * brickWidth + (brickColumnCount - 1) * brickPadding;
        const brickOffsetLeft = (this.canvas.width - totalBricksWidth) / 2;
        const brickOffsetTop = 100;

        this.bricks = [];
        const colors = ['#228B22', '#32CD32', '#90EE90', '#006400', '#9ACD32'];
        
        for (let c = 0; c < brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                this.bricks[c][r] = {
                    x: brickX,
                    y: brickY,
                    width: brickWidth,
                    height: brickHeight,
                    destroyed: false,
                    color: colors[r]
                };
            }
        }
    }

    getRandomColor() {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    addEventListeners() {
        document.addEventListener('mousemove', (e) => {
            const relativeX = e.clientX - this.canvas.getBoundingClientRect().left;
            if (relativeX > 0 && relativeX < this.canvas.width) {
                this.mouseX = relativeX;
            }
        });

        document.addEventListener('click', () => {
            if (this.gameState === 'playing' && !this.ballLaunched) {
                this.ballLaunched = true;
                this.ball.dx = 4;
                this.ball.dy = -4;
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.key === ' ' || e.key === 'Enter') && this.gameState === 'playing' && !this.ballLaunched) {
                this.ballLaunched = true;
                this.ball.dx = 4;
                this.ball.dy = -4;
            }
        });
    }

    start() {
        if (this.gameState === 'start') {
            this.gameState = 'playing';
            this.ballLaunched = false;
            this.addEventListeners();
        }
    }

    handleKeyDown(event) {
        this.keys[event.key] = true;
        
        if (event.key === ' ') {
            if (this.gameState === 'start') {
                this.start();
            } else if (this.gameState === 'gameOver') {
                this.restart();
            } else if (this.gameState === 'playing' && !this.ballLaunched) {
                this.ballLaunched = true;
                this.ball.dx = 4;
                this.ball.dy = -4;
            }
            event.preventDefault();
        }
        
        if (event.key === 'Escape' && this.gameState === 'playing') {
            this.gameState = 'start';
            this.restart();
        }
    }

    handleKeyUp(event) {
        this.keys[event.key] = false;
    }

    handleResize() {
        // Handle canvas resize if needed
    }

    update() {
        if (this.gameState !== 'playing') {
            this.shakeEffect = 0;
            return;
        }

        if (this.shakeEffect > 0) this.shakeEffect--;

        // Move paddle with keyboard
        const leftPressed = this.keys['ArrowLeft'] || this.keys['a'];
        const rightPressed = this.keys['ArrowRight'] || this.keys['d'];
        this.paddle.update(leftPressed, rightPressed);

        // Move paddle with mouse (overrides keyboard)
        if (this.mouseX > 0) {
            this.paddle.x = this.mouseX - this.paddle.width / 2;
            this.paddle.velocity = 0;
        }

        // Keep paddle within canvas bounds
        if (this.paddle.x < 0) {
            this.paddle.x = 0;
        }
        if (this.paddle.x + this.paddle.width > this.canvas.width) {
            this.paddle.x = this.canvas.width - this.paddle.width;
        }

        // Update ball and check for collisions
        if (this.ballLaunched) {
            const lifeLost = this.ball.update(this.canvas, this.paddle, this.bricks, this.score, this.lives);
            if (lifeLost) {
                this.shakeEffect = 20;
            }
        } else {
            this.ball.x = this.paddle.x + this.paddle.width / 2;
            this.ball.y = this.paddle.y - this.ball.radius;
        }

        // Check win condition
        if (this.bricks.flat().every(brick => brick.destroyed)) {
            this.gameState = 'gameOver';
        }

        // Check lose condition
        if (this.lives.lives <= 0) {
            this.gameState = 'gameOver';
        } else if (this.ball.dx === 0 && this.ball.dy === 0 && this.ballLaunched) {
            this.ballLaunched = false;
        }
    }

    render() {
        // Clear canvas with background image using cover effect
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const img = (this.gameState === 'start' || this.gameState === 'gameOver') ? this.frontImg : this.backImg;
        
        if (img.complete) {
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            
            // Add light tint during gameplay
            if (this.gameState === 'playing') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
        
        // Apply shake effect
        if (this.shakeEffect > 0) {
            this.ctx.save();
            this.ctx.translate(
                (Math.random() - 0.5) * this.shakeEffect,
                (Math.random() - 0.5) * this.shakeEffect
            );
        }
        
        // Draw side walls
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, 0, 10, this.canvas.height);
        this.ctx.fillRect(this.canvas.width - 10, 0, 10, this.canvas.height);

        if (this.gameState === 'start') {
            this.showStartScreen();
        } else if (this.gameState === 'gameOver') {
            this.showGameOverScreen();
        } else {
            this.paddle.draw(this.ctx);
            this.ball.draw(this.ctx);
            this.drawBricks();
            this.score.draw(this.ctx);
            this.lives.draw(this.ctx);
            
            if (!this.ballLaunched) {
                this.ctx.font = '16px Arial';
                this.ctx.fillStyle = '#FFD700';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Press SPACE or ENTER to launch', this.canvas.width / 2, this.canvas.height - 50);
            }
        }
        
        if (this.shakeEffect > 0) {
            this.ctx.restore();
        }
    }

    drawJungleBackground() {
        // Draw trees
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(50, 400, 20, 200);
        this.ctx.fillRect(730, 350, 25, 250);
        
        // Draw tree tops
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(60, 400, 40, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(742, 350, 50, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw hanging vines
        this.ctx.strokeStyle = '#32CD32';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(150, 0);
        this.ctx.quadraticCurveTo(160, 100, 145, 200);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(650, 0);
        this.ctx.quadraticCurveTo(640, 80, 655, 160);
        this.ctx.stroke();
        
        // Draw scattered leaves
        this.ctx.fillStyle = '#90EE90';
        for (let i = 0; i < 8; i++) {
            const x = 100 + i * 80;
            const y = 50 + Math.sin(i) * 20;
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, 8, 4, i * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawBricks() {
        for (let c = 0; c < this.bricks.length; c++) {
            for (let r = 0; r < this.bricks[c].length; r++) {
                const brick = this.bricks[c][r];
                if (!brick.destroyed) {
                    this.ctx.beginPath();
                    this.ctx.rect(brick.x, brick.y, brick.width, brick.height);
                    this.ctx.fillStyle = brick.color;
                    this.ctx.fill();
                    this.ctx.closePath();
                }
            }
        }
    }

    restart() {
        this.gameState = 'start';
        this.ballLaunched = false;
        this.shakeEffect = 0;
        this.ball.x = 400;
        this.ball.y = 535;
        this.ball.dx = 0;
        this.ball.dy = 0;
        this.paddle.x = 350;
        this.score.score = 0;
        this.lives.lives = 3;
        this.createBricks();
    }

    showStartScreen() {
        this.ctx.font = '48px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText('JUNGLE ARKANOID', this.canvas.width / 2, 200);
        this.ctx.fillText('JUNGLE ARKANOID', this.canvas.width / 2, 200);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#90EE90';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText('Press SPACE to Start', this.canvas.width / 2, 300);
        this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, 300);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.strokeText('Use ← → arrows or mouse to move', this.canvas.width / 2, 350);
        this.ctx.fillText('Use ← → arrows or mouse to move', this.canvas.width / 2, 350);
        
        this.ctx.strokeText('Press SPACE or ENTER to launch ball', this.canvas.width / 2, 380);
        this.ctx.fillText('Press SPACE or ENTER to launch ball', this.canvas.width / 2, 380);
    }

    showGameOverScreen() {
        this.ctx.font = '36px Arial';
        this.ctx.fillStyle = '#FF4500';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 50);
        this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeText(`Final Score: ${this.score.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Final Score: ${this.score.score}`, this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#90EE90';
        this.ctx.strokeText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    showWinScreen() {
        this.gameState = 'gameOver';
        this.ctx.font = '36px Arial';
        this.ctx.fillStyle = '#32CD32';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText('Victory!', this.canvas.width / 2, this.canvas.height / 2 - 50);
        this.ctx.fillText('Victory!', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeText(`Final Score: ${this.score.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Final Score: ${this.score.score}`, this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#90EE90';
        this.ctx.strokeText('Press SPACE to play again', this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.fillText('Press SPACE to play again', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    startGameLoop() {
        // Start the game loop
        const gameLoop = () => {
            this.update();
            this.render();
            requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }
}
