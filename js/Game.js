
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
        this.canvas.width = 900;
        this.canvas.height = 900;

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

        // Debug configuration
        this.debugConfig = {
            enabled: false,
            startLevel: 1,
            availableLevels: []
        };

        // Core game objects (use relative positioning)
        const paddleY = this.canvas.height * 0.93; // 93% from top (lower position)
        const paddleX = this.canvas.width * 0.39; // 39% from left
        const paddleWidth = this.canvas.width * 0.13; // 13% of canvas width
        const ballX = this.canvas.width * 0.44; // 44% from left (center of paddle)
        const ballY = this.canvas.height * 0.85; // 85% from top (just above paddle)
        const ballRadius = this.canvas.width * 0.011; // 1.1% of canvas width

        this.paddle = new Paddle(paddleX, paddleY, paddleWidth, 18, this.config);
        this.balls = [new Ball(ballX, ballY, ballRadius, '#0095DD', 0)];
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
        this.score = new Score(0, 50, 20, this.canvas.width, this.canvas.height);
        this.lives = new Lives(3, this.canvas.width, this.canvas.height);
        this.lastFrameTime = 0;

        this.init();
    }

    async init() {
        // Initialize configuration manager first
        await this.configManager.initialize();
        
        // Load energy config
        try {
            const response = await fetch('config/energy-config.json');
            this.config = await response.json();
        } catch (error) {
            console.warn('Could not load energy-config.json, using defaults:', error);
            this.config = {};
        }

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
            this.mouseX = relativeX;
        });

        document.addEventListener('click', () => {
            if (this.gameState === 'playing' && !this.ballLaunched && this.balls.length > 0) {
                this.ballLaunched = true;
                const ballSpeed = this.config?.ball?.baseSpeed || 2.5;
                
                // Launch all balls
                this.balls.forEach((ball, index) => {
                    if (index === 0) {
                        // Main ball goes straight up
                        ball.dx = ballSpeed;
                        ball.dy = -ballSpeed;
                    } else {
                        // Additional balls go at angles
                        const angle = index === 1 ? Math.PI / 4 : -Math.PI / 4;
                        ball.dx = Math.cos(angle) * ballSpeed;
                        ball.dy = Math.sin(angle) * ballSpeed;
                    }
                });
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.key === ' ' || e.key === 'Enter') && this.gameState === 'playing' && !this.ballLaunched && this.balls.length > 0) {
                this.ballLaunched = true;
                const ballSpeed = this.config?.ball?.baseSpeed || 2.5;
                
                // Launch all balls
                this.balls.forEach((ball, index) => {
                    if (index === 0) {
                        // Main ball goes straight up
                        ball.dx = ballSpeed;
                        ball.dy = -ballSpeed;
                    } else {
                        // Additional balls go at angles
                        const angle = index === 1 ? Math.PI / 4 : -Math.PI / 4;
                        ball.dx = Math.cos(angle) * ballSpeed;
                        ball.dy = Math.sin(angle) * ballSpeed;
                    }
                });
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

    // Set debug configuration (called from main.js)
    setDebugConfig(debugConfig) {
        this.debugConfig = debugConfig;
        if (debugConfig.enabled) {
            console.log(`Debug mode enabled - Press 1-${debugConfig.availableLevels.length} to start at specific level`);
        }
    }

    // Start debug level
    startDebugLevel(level) {
        console.log(`Starting debug level: ${level}`);

        // Reset game state
        this.gameState = 'playing';
        this.ballLaunched = false;
        this.score.score = 0;
        this.lives.lives = 3;

        // Reset and initialize game systems
        this.resetBall();
        this.visualEffects.reset();
        this.presentSystem.reset();
        this.energySystem.reset();
        this.energyAnimation.reset();
        this.activeBonusUI.reset();

        // Start at specific level
        this.levelManager.startAtLevel(level);

        // Apply settings
        if (this.settingsManager) {
            this.settingsManager.applySettings(this);
        }

        // Start random music
        if (this.audioManager) {
            this.audioManager.playRandomMusic();
        }

        // Add event listeners
        this.addEventListeners();
    }

    // Set settings manager (called from main.js)
    setSettingsManager(settingsManager) {
        this.settingsManager = settingsManager;
        // Apply initial settings
        this.settingsManager.applySettings(this);
    }

    handleKeyDown(event) {
        this.keys[event.key] = true;

        // Handle debug mode level selection (keys 1-9 and 0 for level 10)
        if (this.debugConfig.enabled && this.gameState === 'start') {
            const key = event.key;
            if (key >= '1' && key <= '9') {
                const level = parseInt(key);
                if (this.debugConfig.availableLevels.includes(level)) {
                    this.startDebugLevel(level);
                    event.preventDefault();
                    return;
                }
            } else if (key === '0') {
                if (this.debugConfig.availableLevels.includes(10)) {
                    this.startDebugLevel(10);
                    event.preventDefault();
                    return;
                }
            }
        }

        if (event.key === ' ') {
            if (this.gameState === 'start') {
                this.start();
            } else if (this.gameState === 'gameOver') {
                this.restart();
            } else if (this.gameState === 'playing' && !this.ballLaunched && this.balls.length > 0) {
                this.ballLaunched = true;
                // Launch all balls
                const ballSpeed = this.config?.ball?.baseSpeed || 2.5;
                
                this.balls.forEach((ball, index) => {
                    if (index === 0) {
                        // Main ball goes straight up
                        ball.dx = ballSpeed;
                        ball.dy = -ballSpeed;
                    } else {
                        // Additional balls go at angles
                        const angle = index === 1 ? Math.PI / 4 : -Math.PI / 4;
                        ball.dx = Math.cos(angle) * ballSpeed;
                        ball.dy = Math.sin(angle) * ballSpeed;
                    }
                });
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
        const targetX = this.mouseX - this.paddle.width / 2;
        const distanceToTarget = targetX - this.paddle.x;

        // Calculate valid movement range (considering walls)
        const wallThickness = this.canvas.width * 0.011;
        const minValidX = wallThickness;
        const maxValidX = this.canvas.width - wallThickness - this.paddle.width;

        // Check if paddle is currently against a wall
        const paddleAtLeftWall = this.paddle.x <= minValidX;
        const paddleAtRightWall = this.paddle.x >= maxValidX;

        // Check if mouse is trying to push paddle into wall
        const mousePushingLeft = paddleAtLeftWall && targetX < this.paddle.x;
        const mousePushingRight = paddleAtRightWall && targetX > this.paddle.x;

        // Apply mouse force unless trying to push paddle into wall
        if (!mousePushingLeft && !mousePushingRight) {
            const mouseForce = distanceToTarget * 0.15; // Gentle attraction to mouse
            this.paddle.velocity += mouseForce;
            this.mouseMovementAmount = Math.abs(distanceToTarget);
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

        const wallThickness = this.canvas.width * 0.011; // 1.1% of canvas width (was 10px at 900px)
        const minValidX = wallThickness;
        const maxValidX = this.canvas.width - wallThickness - this.paddle.width;

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
        if (this.paddle.x + this.paddle.width > this.canvas.width - wallThickness) {
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

        // Don't update game systems if level is not properly initialized yet
        if (!this.levelManager.levelInitialized) {
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
        this.paddle.update(leftPressed, rightPressed, this.energySystem, this.canvas.width);

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
            // Keep all balls with paddle
            if (this.balls.length > 0) {
                const ballSpacing = this.canvas.height * 0.006; // 5px at 900px = 0.6%
                
                this.balls.forEach((ball, index) => {
                    if (index === 0) {
                        // Main ball in center
                        ball.x = this.paddle.x + this.paddle.width / 2;
                    } else if (index === 1) {
                        // Second ball on left side
                        ball.x = this.paddle.x + this.paddle.width * 0.25;
                    } else {
                        // Third ball on right side
                        ball.x = this.paddle.x + this.paddle.width * 0.75;
                    }
                    ball.y = this.paddle.y - ball.radius - ballSpacing;
                });
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
            // Don't remove unlaunched balls - they have dx=0, dy=0 which is normal
            // Dead balls are handled by the updateBalls() method
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
        const wallThickness = this.canvas.width * 0.011;
        if (ball.x - ball.radius <= wallThickness || ball.x + ball.radius >= this.canvas.width - wallThickness) {
            ball.dx = -ball.dx;
            ball.x = ball.x - ball.radius <= wallThickness ? wallThickness + ball.radius : this.canvas.width - wallThickness - ball.radius;
            // Play percussion sound
            if (this.audioManager) {
                this.audioManager.playPercussionHit();
            }
        }

        // Wall collision (top)
        const topWallMargin = this.canvas.height * 0.033; // 30px at 900px = 3.3%
        if (ball.y - ball.radius <= topWallMargin) {
            ball.dy = -ball.dy;
            ball.y = topWallMargin + ball.radius;
            // Play percussion sound
            if (this.audioManager) {
                this.audioManager.playPercussionHit();
            }
        }

        // Shield collision (before bottom wall)
        const bottomShieldMargin = this.canvas.height * 0.022; // 20px at 900px = 2.2%
        if (this.presentSystem.activeEffects.shield.active && ball.y + ball.radius >= this.canvas.height - bottomShieldMargin) {
            ball.dy = -Math.abs(ball.dy); // Bounce ball upward
            ball.y = this.canvas.height - bottomShieldMargin - ball.radius;
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
        return ball.y - ball.radius > this.canvas.height;


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
        const ballX = this.canvas.width * 0.44;
        const ballY = this.canvas.height * 0.85; // Same as initial position
        const ballRadius = this.canvas.width * 0.011;
        this.balls = [new Ball(ballX, ballY, ballRadius, '#0095DD', 0)];
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
            const wallThickness = this.canvas.width * 0.011;
            this.ctx.fillRect(0, 0, wallThickness, this.canvas.height);
            this.ctx.fillRect(this.canvas.width - wallThickness, 0, wallThickness, this.canvas.height);

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
                const fontSize = this.canvas.width * 0.018; // 16px at 900px = 1.8%
                const launchTextY = this.canvas.height * 0.944; // 50px from bottom at 900px
                this.ctx.font = `${fontSize}px Arial`;
                this.ctx.fillStyle = '#FFD700';
                this.ctx.textAlign = 'center';
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText('Press SPACE or ENTER to launch', this.canvas.width / 2, launchTextY);
                this.ctx.fillText('Press SPACE or ENTER to launch', this.canvas.width / 2, launchTextY);
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
            const fontSize = this.canvas.width * 0.016; // 14px at 900px = 1.6%
            const tipY = this.canvas.height * 0.978; // 20px from bottom at 900px
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(levelConfig.description, this.canvas.width / 2, tipY);
            this.ctx.restore();
        }
    }

    drawJungleBackground() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // Draw trees
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(canvasWidth * 0.056, canvasHeight * 0.444, canvasWidth * 0.022, canvasHeight * 0.222); // Left tree
        this.ctx.fillRect(canvasWidth * 0.811, canvasHeight * 0.389, canvasWidth * 0.028, canvasHeight * 0.278); // Right tree

        // Draw tree tops
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(canvasWidth * 0.067, canvasHeight * 0.444, canvasWidth * 0.044, 0, Math.PI * 2); // Left top
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(canvasWidth * 0.824, canvasHeight * 0.389, canvasWidth * 0.056, 0, Math.PI * 2); // Right top
        this.ctx.fill();

        // Draw hanging vines
        this.ctx.strokeStyle = '#32CD32';
        this.ctx.lineWidth = canvasWidth * 0.003; // 3px at 900px = 0.3%
        this.ctx.beginPath();
        this.ctx.moveTo(canvasWidth * 0.167, 0);
        this.ctx.quadraticCurveTo(canvasWidth * 0.178, canvasHeight * 0.111, canvasWidth * 0.161, canvasHeight * 0.222);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(canvasWidth * 0.722, 0);
        this.ctx.quadraticCurveTo(canvasWidth * 0.711, canvasHeight * 0.089, canvasWidth * 0.728, canvasHeight * 0.178);
        this.ctx.stroke();

        // Draw scattered leaves
        this.ctx.fillStyle = '#90EE90';
        const leafCount = 8;
        for (let i = 0; i < leafCount; i++) {
            const x = canvasWidth * 0.111 + (i * canvasWidth * 0.089); // 100px + spacing
            const y = canvasHeight * 0.056 + (Math.sin(i) * canvasHeight * 0.022); // 50px + variation
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, canvasWidth * 0.009, canvasHeight * 0.004, i * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    
    restart() {
        this.gameState = 'start';
        this.ballLaunched = false;
        this.shakeEffect = 0;
        this.paddle.x = this.canvas.width * 0.39;
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
        const titleFontSize = this.canvas.width * 0.053; // 48px at 900px = 5.3%
        const titleY = this.canvas.height * 0.222; // 200px at 900px = 22.2%

        this.ctx.font = `${titleFontSize}px Arial`;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText('JUNGLE ARKANOID', this.canvas.width / 2, titleY);
        this.ctx.fillText('JUNGLE ARKANOID', this.canvas.width / 2, titleY);

        const buttonFontSize = this.canvas.width * 0.027; // 24px at 900px = 2.7%
        const startY = this.canvas.height * 0.333; // 300px at 900px = 33.3%

        this.ctx.font = `${buttonFontSize}px Arial`;
        this.ctx.fillStyle = '#90EE90';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText('Press SPACE to Start', this.canvas.width / 2, startY);
        this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, startY);

        const instructionFontSize = this.canvas.width * 0.02; // 18px at 900px = 2%
        const instructionSpacing = this.canvas.height * 0.056; // 50px at 900px = 5.6%

        this.ctx.font = `${instructionFontSize}px Arial`;
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.strokeText('Use ← → arrows or mouse to move', this.canvas.width / 2, startY + instructionSpacing);
        this.ctx.fillText('Use ← → arrows or mouse to move', this.canvas.width / 2, startY + instructionSpacing);

        this.ctx.strokeText('Press SPACE or ENTER to launch ball', this.canvas.width / 2, startY + instructionSpacing * 2);
        this.ctx.fillText('Press SPACE or ENTER to launch ball', this.canvas.width / 2, startY + instructionSpacing * 2);

        this.ctx.strokeText('Press S for Settings', this.canvas.width / 2, startY + instructionSpacing * 3);
        this.ctx.fillText('Press S for Settings', this.canvas.width / 2, startY + instructionSpacing * 3);

        // Show debug mode instructions if enabled
        if (this.debugConfig.enabled) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.strokeText(`DEBUG MODE: Press 1-${this.debugConfig.availableLevels.length} to start at specific level`,
                              this.canvas.width / 2, startY + instructionSpacing * 4);
            this.ctx.fillText(`DEBUG MODE: Press 1-${this.debugConfig.availableLevels.length} to start at specific level`,
                            this.canvas.width / 2, startY + instructionSpacing * 4);
        }
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
        const titleFontSize = this.canvas.width * 0.04; // 36px at 900px = 4%
        const titleY = this.canvas.height * 0.444; // 50px from center at 900px = 5.6%

        this.ctx.font = `${titleFontSize}px Arial`;
        this.ctx.fillStyle = '#FF4500';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText('Game Over', this.canvas.width / 2, titleY);
        this.ctx.fillText('Game Over', this.canvas.width / 2, titleY);

        const scoreFontSize = this.canvas.width * 0.027; // 24px at 900px = 2.7%
        this.ctx.font = `${scoreFontSize}px Arial`;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeText(`Final Score: ${this.score.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Final Score: ${this.score.score}`, this.canvas.width / 2, this.canvas.height / 2);

        const restartFontSize = this.canvas.width * 0.02; // 18px at 900px = 2%
        this.ctx.font = `${restartFontSize}px Arial`;
        this.ctx.fillStyle = '#90EE90';
        this.ctx.strokeText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + this.canvas.height * 0.044);
        this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + this.canvas.height * 0.044);
    }

    showWinScreen() {
        this.gameState = 'gameOver';
        const titleFontSize = this.canvas.width * 0.04; // 36px at 900px = 4%
        const titleY = this.canvas.height * 0.444; // 50px from center at 900px = 5.6%

        this.ctx.font = `${titleFontSize}px Arial`;
        this.ctx.fillStyle = '#32CD32';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText('Victory!', this.canvas.width / 2, titleY);
        this.ctx.fillText('Victory!', this.canvas.width / 2, titleY);

        const scoreFontSize = this.canvas.width * 0.027; // 24px at 900px = 2.7%
        this.ctx.font = `${scoreFontSize}px Arial`;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeText(`Final Score: ${this.score.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Final Score: ${this.score.score}`, this.canvas.width / 2, this.canvas.height / 2);

        const restartFontSize = this.canvas.width * 0.02; // 18px at 900px = 2%
        this.ctx.font = `${restartFontSize}px Arial`;
        this.ctx.fillStyle = '#90EE90';
        this.ctx.strokeText('Press SPACE to play again', this.canvas.width / 2, this.canvas.height / 2 + this.canvas.height * 0.044);
        this.ctx.fillText('Press SPACE to play again', this.canvas.width / 2, this.canvas.height / 2 + this.canvas.height * 0.044);
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
