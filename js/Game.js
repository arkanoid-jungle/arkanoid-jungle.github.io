
import { Paddle } from './Paddle.js';
import { Ball } from './Ball.js';
import { Score } from './Score.js';
import { Lives } from './Lives.js';
import { PresentSystem } from './PresentSystem.js';
import { LevelManager } from './LevelManager.js';
import { VisualEffects } from './VisualEffects.js';
import { EnergySystem } from './EnergySystem.js';
import { EnergyBar } from './EnergyBar.js';
import { EnergyAnimation } from './EnergyAnimation.js';
import { SettingsManager } from './SettingsManager.js';
import { AudioManager } from './AudioManager.js';
import { ActiveBonusUI } from './ActiveBonusUI.js';
import { configManager } from './ConfigManager.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 800;

        // Set canvas size based on background image when it loads
        this.backImg = new Image();
        this.backImg.src = 'images/back.jpg';
        this.frontImg = new Image();
        this.frontImg.src = 'images/front.jpg';

        this.gameState = 'start';
        this.keys = {};
        this.mouseX = 0;
        this.mouseMovementAmount = 0;
        this.debugMode = false; // Debug mode toggle

        // Settings manager (will be injected from main.js)
        this.settingsManager = null;
        this.configManager = configManager;

        // Core game objects
        this.paddle = new Paddle(350, 750, 120, 18);
        this.balls = [new Ball(400, 700, 10, '#0095DD', 0)];
        this.ballLaunched = false;
        this.shakeEffect = 0;

        // Enhanced game systems (will be initialized asynchronously)
        this.visualEffects = new VisualEffects(this.canvas);
        this.presentSystem = new PresentSystem(this);
        this.levelManager = new LevelManager(this);
        this.audioManager = new AudioManager();
        this.activeBonusUI = new ActiveBonusUI(this.canvas, this.presentSystem);

        // Energy system (will load config asynchronously)
        this.energySystem = new EnergySystem();
        this.energyBar = new EnergyBar(20, 60, 150, 20);
        this.energyAnimation = new EnergyAnimation();
        this.energySystemInitialized = false;

        // Game state and scoring
        this.score = new Score(0, 50, 20);
        this.lives = new Lives(3);
        this.lastFrameTime = 0;

        this.init();
    }

    async init() {
        // Initialize configuration manager first
        await this.configManager.initialize();

        // Initialize game systems that depend on configuration
        // These will be initialized asynchronously in their constructors

        console.log('Game initialized with configuration system');
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
            if (this.gameState === 'playing' && !this.ballLaunched && this.balls.length > 0) {
                this.ballLaunched = true;
                this.balls[0].dx = 2.5;
                this.balls[0].dy = -2.5;
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.key === ' ' || e.key === 'Enter') && this.gameState === 'playing' && !this.ballLaunched && this.balls.length > 0) {
                this.ballLaunched = true;
                this.balls[0].dx = 2.5;
                this.balls[0].dy = -2.5;
            }
        });
    }

    start() {
        if (this.gameState === 'start') {
            this.gameState = 'playing';
            this.ballLaunched = false;
            this.addEventListeners();

            // Apply settings before starting game
            if (this.settingsManager) {
                this.settingsManager.applySettings(this);
            }

            // Start random music
            if (this.audioManager) {
                this.audioManager.playRandomMusic();
            }

            // Reset and initialize game systems
            this.visualEffects.reset();
            this.presentSystem.reset();
            this.levelManager.reset();
        }
    }

    // Set settings manager (called from main.js)
    setSettingsManager(settingsManager) {
        this.settingsManager = settingsManager;
        // Apply initial settings
        this.settingsManager.applySettings(this);
    }

    handleKeyDown(event) {
        this.keys[event.key] = true;

        if (event.key === ' ') {
            if (this.gameState === 'start') {
                this.start();
            } else if (this.gameState === 'gameOver') {
                this.restart();
            } else if (this.gameState === 'playing' && !this.ballLaunched && this.balls.length > 0) {
                this.ballLaunched = true;
                // Launch the main ball
                this.balls[0].dx = 2.5;
                this.balls[0].dy = -2.5;
            }
            event.preventDefault();
        }

        if (event.key === 'Escape') {
            if (this.gameState === 'playing') {
                this.gameState = 'start';
                this.restart();
            } else if (this.gameState === 'start') {
                this.gameState = 'settings';
                if (this.settingsManager) {
                    this.settingsManager.reset();
                }
            }
        }

        // Handle settings menu access from start screen
        if (event.key === 's' && this.gameState === 'start') {
            this.gameState = 'settings';
            if (this.settingsManager) {
                this.settingsManager.reset();
            }
        }

        // Toggle debug mode with 'D' key
        if (event.key === 'd' || event.key === 'D') {
            this.debugMode = !this.debugMode;
            if (this.debugMode) {
                console.log('Debug mode enabled - Press D to toggle');
                this.energySystem.resetDebugInfo();
            }
        }
    }

    handleKeyUp(event) {
        this.keys[event.key] = false;
    }

    processMouseInput() {
        if (this.mouseX > 0) {
            const targetX = this.mouseX - this.paddle.width / 2;
            const distanceToTarget = targetX - this.paddle.x;

            // Calculate valid movement range (considering walls)
            const minValidX = 10;
            const maxValidX = this.canvas.width - 10 - this.paddle.width;

            // Check if paddle is currently against a wall
            const paddleAtLeftWall = this.paddle.x <= minValidX;
            const paddleAtRightWall = this.paddle.x >= maxValidX;

            // Check if mouse is trying to push paddle into wall
            const mousePushingLeft = paddleAtLeftWall && targetX < this.paddle.x;
            const mousePushingRight = paddleAtRightWall && targetX > this.paddle.x;

            // Only apply mouse force if:
            // 1. Mouse target is within valid range, AND
            // 2. Not trying to push paddle into wall
            if (targetX >= minValidX && targetX <= maxValidX && !mousePushingLeft && !mousePushingRight) {
                const mouseForce = distanceToTarget * 0.15; // Gentle attraction to mouse
                this.paddle.velocity += mouseForce;
                this.mouseMovementAmount = Math.abs(distanceToTarget);
            } else {
                // Mouse is trying to push paddle into wall - completely block the force and movement
                this.mouseMovementAmount = 0;
                // Don't modify paddle.velocity here - let wall collision handle it
            }
        } else {
            this.mouseMovementAmount = 0;
        }
    }

    handleWallCollisions() {
        const wallState = {
            isHittingWall: false,
            mouseInputBlocked: false,
            hitLeftWall: false,
            hitRightWall: false,
            paddleVelocityBeforeCollision: this.paddle.velocity
        };

        const minValidX = 10;
        const maxValidX = this.canvas.width - 10 - this.paddle.width;

        // Check left wall collision
        if (this.paddle.x < minValidX) {
            this.paddle.x = minValidX;
            this.paddle.velocity = 0;
            wallState.isHittingWall = true;
            wallState.hitLeftWall = true;

            // Check if mouse is trying to push further left
            if (this.mouseX > 0 && this.mouseX < this.paddle.x + this.paddle.width / 2) {
                wallState.mouseInputBlocked = true;
            }
        }

        // Check right wall collision
        if (this.paddle.x + this.paddle.width > this.canvas.width - 10) {
            this.paddle.x = maxValidX;
            this.paddle.velocity = 0;
            wallState.isHittingWall = true;
            wallState.hitRightWall = true;

            // Check if mouse is trying to push further right
            if (this.mouseX > 0 && this.mouseX > this.paddle.x + this.paddle.width / 2) {
                wallState.mouseInputBlocked = true;
            }
        }

        // Ensure paddle velocity is zero when hitting wall (failsafe)
        if (wallState.isHittingWall) {
            this.paddle.velocity = 0;
        }

        return wallState;
    }

    handleResize() {
        // Handle canvas resize if needed
    }

    update() {
        if (this.gameState !== 'playing') {
            return;
        }

        // Calculate delta time
        const currentTime = performance.now();
        const deltaTime = this.lastFrameTime ? currentTime - this.lastFrameTime : 16;
        this.lastFrameTime = currentTime;

        // Update level manager
        this.levelManager.update(deltaTime);

        // Update present system
        this.presentSystem.update(deltaTime, this.paddle, this.balls, this.canvas);

        // Update visual effects
        this.visualEffects.update(deltaTime);

        // Move paddle with keyboard
        const leftPressed = this.keys['ArrowLeft'] || this.keys['a'];
        const rightPressed = this.keys['ArrowRight'] || this.keys['d'];

        // Apply energy effects to paddle
        this.paddle.applyEnergyEffects(this.energySystem);
        this.paddle.update(leftPressed, rightPressed);

        // Process mouse input with wall collision awareness
        this.processMouseInput();

        // Comprehensive wall collision detection and response
        const wallCollisionState = this.handleWallCollisions();

        // Update energy system with comprehensive wall state
        this.energySystem.update(
            deltaTime,
            this.paddle.velocity,
            this.mouseMovementAmount || 0,
            wallCollisionState.isHittingWall,
            wallCollisionState.mouseInputBlocked
        );
        this.energyBar.update(deltaTime, this.energySystem);
        this.energyAnimation.update(deltaTime, this.paddle, this.energySystem);

        // Update energy system with current level
        if (this.levelManager.currentLevel !== this.energySystem.currentLevel) {
            this.energySystem.setLevel(this.levelManager.currentLevel);
        }

        // Update balls
        if (this.ballLaunched) {
            this.updateBalls();
        } else {
            // Keep main ball with paddle
            if (this.balls.length > 0) {
                this.balls[0].x = this.paddle.x + this.paddle.width / 2;
                this.balls[0].y = this.paddle.y - this.balls[0].radius - 5;
            }
        }

        // Check lose condition
        if (this.balls.length === 0) {
            if (!this.presentSystem.checkShieldCollision()) {
                this.lives.loseLife();
                this.visualEffects.addScreenShake(15, 300);

                if (this.lives.lives > 0) {
                    this.resetBall();
                } else {
                    this.gameState = 'gameOver';
                    this.visualEffects.createLevelTransitionEffect('game_over');
                }
            }
        } else {
            // Remove dead balls only if we still have balls left
            this.balls = this.balls.filter(ball => !(ball.dy === 0 && ball.dx === 0));
        }
    }

    updateBalls() {
        const ballsToRemove = [];

        this.balls.forEach((ball, index) => {
            const lifeLost = this.updateBall(ball);

            if (lifeLost) {
                ballsToRemove.push(index);
            }
        });

        // Remove balls that were lost
        ballsToRemove.reverse().forEach(index => {
            this.balls.splice(index, 1);
        });
    }

    updateBall(ball) {
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collision (left/right)
        if (ball.x - ball.radius <= 10 || ball.x + ball.radius >= this.canvas.width - 10) {
            ball.dx = -ball.dx;
            ball.x = ball.x - ball.radius <= 10 ? 10 + ball.radius : this.canvas.width - 10 - ball.radius;
            // Play percussion sound
            if (this.audioManager) {
                this.audioManager.playPercussionHit();
            }
        }

        // Wall collision (top)
        if (ball.y - ball.radius <= 30) {
            ball.dy = -ball.dy;
            ball.y = 30 + ball.radius;
            // Play percussion sound
            if (this.audioManager) {
                this.audioManager.playPercussionHit();
            }
        }

        // Shield collision (before bottom wall)
        if (this.presentSystem.activeEffects.shield.active && ball.y + ball.radius >= this.canvas.height - 20) {
            ball.dy = -Math.abs(ball.dy); // Bounce ball upward
            ball.y = this.canvas.height - 20 - ball.radius;
            this.presentSystem.checkShieldCollision(); // Consume shield
            this.visualEffects.createShieldEffect(ball.x, ball.y);
            return false;
        }

        // Paddle collision
        if (this.checkPaddleCollision(ball)) {
            this.handlePaddleCollision(ball);
        }

        // Brick collision
        const hitBrick = this.checkBrickCollision(ball);
        if (hitBrick) {
            this.handleBrickCollision(ball, hitBrick);
        }

        // Bottom wall collision
        if (ball.y - ball.radius > this.canvas.height) {
            return true; // Signal ball lost
        }

        return false;
    }

    checkPaddleCollision(ball) {
        return ball.y + ball.radius > this.paddle.y &&
               ball.y < this.paddle.y + this.paddle.height &&
               ball.x > this.paddle.x &&
               ball.x < this.paddle.x + this.paddle.width &&
               ball.dy > 0;
    }

    handlePaddleCollision(ball) {
        // Calculate hit position (-1 to 1)
        const hitPos = (ball.x - this.paddle.x - this.paddle.width / 2) / (this.paddle.width / 2);

        // Set new velocity based on hit position
        let speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

        // Apply slow ball effect if active
        if (this.presentSystem.activeEffects.slowBall.active) {
            speed *= 0.7;
        }

        ball.dx = hitPos * speed * 0.8;
        ball.dy = -Math.abs(speed * Math.cos(hitPos * Math.PI / 4));

        // Play sound effect
        if (this.audioManager) {
            this.audioManager.playSound(400, 80);
        }

        // Remove power shot after paddle hit
        if (ball.powerShot) {
            ball.powerShot = false;
        }
    }

    checkBrickCollision(ball) {
        const bricks = this.levelManager.bricks;

        for (let c = 0; c < bricks.length; c++) {
            for (let r = 0; r < bricks[c].length; r++) {
                const brick = bricks[c][r];
                if (brick.destroyed) continue;

                if (ball.x + ball.radius > brick.x &&
                    ball.x - ball.radius < brick.x + brick.width &&
                    ball.y + ball.radius > brick.y &&
                    ball.y - ball.radius < brick.y + brick.height) {

                    return brick;
                }
            }
        }
        return null;
    }

    handleBrickCollision(ball, brick) {
        // Handle power shot effect
        if (ball.powerShot) {
            ball.powerShot = false;
            this.levelManager.onBrickDestroyed(brick);
            this.visualEffects.createPowerShotEffect(
                brick.x + brick.width / 2,
                brick.y + brick.height / 2
            );
            return;
        }

        // Proper collision detection and response
        const ballCenterX = ball.x;
        const ballCenterY = ball.y;
        const brickCenterX = brick.x + brick.width / 2;
        const brickCenterY = brick.y + brick.height / 2;

        // Calculate ball position relative to brick center
        const dx = ballCenterX - brickCenterX;
        const dy = ballCenterY - brickCenterY;

        // Calculate half dimensions
        const halfWidth = brick.width / 2 + ball.radius;
        const halfHeight = brick.height / 2 + ball.radius;

        // Determine which side of the brick the ball hit
        const overlapX = halfWidth - Math.abs(dx);
        const overlapY = halfHeight - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
            // We have a collision
            if (overlapX < overlapY) {
                // Hit was from the side
                ball.dx = -ball.dx;
                // Move ball outside of brick to prevent sticking
                if (dx > 0) {
                    ball.x = brick.x + brick.width + ball.radius;
                } else {
                    ball.x = brick.x - ball.radius;
                }
            } else {
                // Hit was from top or bottom
                ball.dy = -ball.dy;
                // Move ball outside of brick to prevent sticking
                if (dy > 0) {
                    ball.y = brick.y + brick.height + ball.radius;
                } else {
                    ball.y = brick.y - ball.radius;
                }
            }

            // Damage brick
            const destroyed = brick.hit();
            if (destroyed) {
                this.levelManager.onBrickDestroyed(brick);
                // Play sound effects
                if (this.audioManager) {
                    this.audioManager.playSound(800, 50);
                    this.audioManager.playPercussionHit();
                }
            }
        }
    }

    resetBall() {
        this.balls = [new Ball(400, 700, 10, '#0095DD', 0)];
        this.ballLaunched = false;
    }

    render() {
        // Clear canvas with background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        const img = (this.gameState === 'start' || this.gameState === 'gameOver') ? this.frontImg : this.backImg;
        if (img.complete) {
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

            // Add light tint during gameplay
            if (this.gameState === 'playing') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }

        // Render game elements
        if (this.gameState === 'start') {
            this.showStartScreen();
        } else if (this.gameState === 'settings') {
            this.showSettingsScreen();
        } else if (this.gameState === 'gameOver') {
            this.showGameOverScreen();
        } else {
            // Draw side walls
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(0, 0, 10, this.canvas.height);
            this.ctx.fillRect(this.canvas.width - 10, 0, 10, this.canvas.height);

            // Draw level and bricks
            this.levelManager.draw(this.ctx);

            // Draw energy animation (under paddle)
            this.energyAnimation.draw(this.ctx, this.paddle, this.energySystem);

            // Draw paddle
            this.paddle.draw(this.ctx);

            // Draw all balls
            this.balls.forEach(ball => ball.draw(this.ctx));

            // Draw presents
            this.presentSystem.draw(this.ctx);

            // Draw visual effects (particles, explosions, etc.)
            this.visualEffects.render();

            // Draw UI elements
            this.score.draw(this.ctx);
            this.lives.draw(this.ctx);
            this.energyBar.draw(this.ctx, this.energySystem);

            // Draw active bonus UI
            this.activeBonusUI.render();

            // Draw debug information (if enabled)
            this.drawDebugInfo();

            // Draw launch hint
            if (!this.ballLaunched && this.balls.length > 0) {
                this.ctx.font = '16px Arial';
                this.ctx.fillStyle = '#FFD700';
                this.ctx.textAlign = 'center';
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText('Press SPACE or ENTER to launch', this.canvas.width / 2, this.canvas.height - 50);
                this.ctx.fillText('Press SPACE or ENTER to launch', this.canvas.width / 2, this.canvas.height - 50);
            }

            // Draw level tip
            this.drawLevelTip();
        }
    }

    drawDebugInfo() {
        // Only show debug info if debug mode is enabled (press 'D' to toggle)
        if (!this.debugMode) return;

        const debugInfo = this.energySystem.getDebugInfo();
        const x = 20;
        let y = 100;
        const lineHeight = 15;
        const fontSize = 11;

        this.ctx.save();
        this.ctx.font = `${fontSize}px monospace`;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 5, y - 15, 250, 180);

        this.ctx.fillStyle = '#00FF00';
        this.ctx.textAlign = 'left';

        this.ctx.fillText('=== ENERGY DEBUG ===', x, y);
        y += lineHeight * 1.5;

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(`Energy: ${debugInfo.currentEnergy.toFixed(1)}% (${debugInfo.energyState})`, x, y);
        y += lineHeight;

        this.ctx.fillText(`Moving: ${debugInfo.isMoving ? 'YES' : 'NO'}`, x, y);
        y += lineHeight;

        this.ctx.fillText(`Wall Hits: ${debugInfo.wallHitCount}`, x, y);
        y += lineHeight;

        this.ctx.fillText(`Mouse Blocks: ${debugInfo.mouseBlockCount}`, x, y);
        y += lineHeight;

        this.ctx.fillText(`Total Consumed: ${debugInfo.totalEnergyConsumed.toFixed(2)}`, x, y);
        y += lineHeight;

        this.ctx.fillText(`Total Recovered: ${debugInfo.totalEnergyRecovered.toFixed(2)}`, x, y);
        y += lineHeight;

        this.ctx.fillText(`Paddle Velocity: ${this.paddle.velocity.toFixed(2)}`, x, y);
        y += lineHeight;

        this.ctx.fillText(`Mouse Movement: ${this.mouseMovementAmount.toFixed(2)}`, x, y);
        y += lineHeight;

        // Wall collision indicators
        const wallState = this.handleWallCollisions();
        this.ctx.fillStyle = wallState.isHittingWall ? '#FF0000' : '#00FF00';
        this.ctx.fillText(`Hitting Wall: ${wallState.isHittingWall ? 'YES' : 'NO'}`, x, y);
        y += lineHeight;

        this.ctx.fillStyle = wallState.mouseInputBlocked ? '#FFA500' : '#00FF00';
        this.ctx.fillText(`Mouse Blocked: ${wallState.mouseInputBlocked ? 'YES' : 'NO'}`, x, y);
        y += lineHeight;

        // Energy system protection status
        const protectionStatus = this.energySystem.getWallCollisionProtectionStatus();
        this.ctx.fillStyle = protectionStatus.isProtected ? '#00FFFF' : '#FF00FF';
        this.ctx.fillText(`Energy Protection: ${protectionStatus.isProtected ? 'ACTIVE' : 'INACTIVE'}`, x, y);

        this.ctx.restore();
    }

    drawLevelTip() {
        const levelConfig = this.levelManager.getLevelConfig();
        if (levelConfig && levelConfig.description) {
            this.ctx.save();
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(levelConfig.description, this.canvas.width / 2, this.canvas.height - 20);
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

    
    restart() {
        this.gameState = 'start';
        this.ballLaunched = false;
        this.shakeEffect = 0;
        this.paddle.x = 350;
        this.score.score = 0;
        this.lives.lives = 3;

        // Stop music and percussion
        if (this.audioManager) {
            this.audioManager.stopMusic();
            this.audioManager.stopPercussion();
        }

        // Reset all game systems
        this.resetBall();
        this.visualEffects.reset();
        this.presentSystem.reset();
        this.levelManager.reset();
        this.energySystem.reset();
        this.energyAnimation.reset();
        this.activeBonusUI.reset();
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

        this.ctx.strokeText('Press S for Settings', this.canvas.width / 2, 410);
        this.ctx.fillText('Press S for Settings', this.canvas.width / 2, 410);
    }

    showSettingsScreen() {
        if (this.settingsManager) {
            this.settingsManager.draw(this.ctx, this.canvas);
        } else {
            // Fallback if settings manager is not available
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.textAlign = 'center';
            this.ctx.strokeText('Settings', this.canvas.width / 2, 200);
            this.ctx.fillText('Settings', this.canvas.width / 2, 200);

            this.ctx.font = '18px Arial';
            this.ctx.fillStyle = '#90EE90';
            this.ctx.strokeText('Press ESC to go back', this.canvas.width / 2, 300);
            this.ctx.fillText('Press ESC to go back', this.canvas.width / 2, 300);
        }
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
