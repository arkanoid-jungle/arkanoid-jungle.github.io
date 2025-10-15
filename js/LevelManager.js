import { Brick } from './Brick.js';
import { configManager } from './ConfigManager.js';

export class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 1;
        this.maxLevel = 50; // Can be extended with procedural generation
        this.bricks = [];
        this.levelConfig = null;
        this.bricksDestroyed = 0;
        this.totalBricks = 0;
        this.levelStartTime = 0;
        this.levelCompletedTime = 0;
        this.specialBrickEffects = [];
        this.configManager = configManager;

        // Level progression state
        this.levelState = 'playing'; // 'playing', 'completed', 'failed', 'transitioning'
        this.transitionTimer = 0;
        this.nextLevelDelay = 2000; // 2 seconds before next level

        // Statistics
        this.stats = {
            levelsCompleted: 0,
            totalBricksDestroyed: 0,
            totalTimeSpent: 0,
            perfectLevels: 0 // Levels completed without losing lives
        };

        // Initialize first level after configuration is loaded
        this.levelInitialized = false;
    }

    async initializeLevel(levelNumber) {
        await this.configManager.initialize();
        this.loadLevel(levelNumber);
    }

    loadLevel(levelNumber) {
        this.currentLevel = Math.min(levelNumber, this.maxLevel);
        this.levelConfig = this.configManager.getLevelConfig(this.currentLevel);

        // If level config is still null, wait and retry
        if (!this.levelConfig) {
            console.warn('Level config not loaded yet, retrying...');
            setTimeout(() => this.loadLevel(levelNumber), 100);
            return;
        }

        this.bricks = [];
        this.bricksDestroyed = 0;
        this.levelStartTime = Date.now();
        this.levelState = 'playing';
        this.specialBrickEffects = [];
        this.transitionTimer = 0;

        // Generate bricks based on level configuration
        this.generateBricks();

        // Update present system with new level
        if (this.game.presentSystem) {
            this.game.presentSystem.setLevel(this.currentLevel);
        }

        // Update ball speed based on level
        this.updateBallSpeed();

        // Show level introduction
        this.showLevelIntro();
    }

    generateBricks() {
        const config = this.levelConfig;
        const brickSystemConfig = config.brickSystem || {};
        const globalDefaults = this.configManager.getGlobalDefaults('brickSystem') || {};

        // Use relative sizing based on canvas dimensions
        const canvasWidth = this.game.canvas.width;
        const canvasHeight = this.game.canvas.height;
        const wallThickness = canvasWidth * 0.011; // Same as in Game.js

        // Use configuration values or fall back to defaults (with relative sizing)
        const gameConfig = this.game.config?.brickSystem || {};
        const maxBrickWidth = brickSystemConfig.maxWidth || gameConfig.maxWidth || (canvasWidth * 0.083); // 75px at 900px = 8.3%
        const brickHeight = brickSystemConfig.height || gameConfig.height || (canvasHeight * 0.028); // 25px at 900px = 2.8%
        const brickPadding = brickSystemConfig.padding || gameConfig.padding || (canvasWidth * 0.004); // 4px at 900px = 0.4%
        const columns = brickSystemConfig.columns || 10;
        const rows = brickSystemConfig.rows || 6;

        // Calculate layout with consistent spacing
        const availableWidth = canvasWidth - (wallThickness * 2); // Account for walls
        const totalPaddingWidth = (columns + 1) * brickPadding; // Include left and right margins
        const availableBrickWidth = availableWidth - totalPaddingWidth;
        
        // Calculate brick width: use smaller of maxWidth or stretched width
        const stretchedBrickWidth = availableBrickWidth / columns;
        const brickWidth = Math.min(maxBrickWidth, stretchedBrickWidth);
        
        // Left offset includes wall thickness plus one padding unit
        const brickOffsetLeft = wallThickness + brickPadding;
        const brickOffsetTop = canvasHeight * 0.111; // 100px at 900px = 11.1%

        // Create brick grid
        for (let c = 0; c < columns; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < rows; r++) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;

                // Determine brick type based on pattern and configuration
                const brickType = this.determineBrickType(c, r, config);

                const brick = new Brick(brickX, brickY, brickWidth, brickHeight, brickType, r, this.currentLevel, brickSystemConfig);
                this.bricks[c][r] = brick;

                if (!brick.destroyed) {
                    this.totalBricks++;
                }
            }
        }
    }

    determineBrickType(column, row, config) {
        const brickSystemConfig = config.brickSystem || {};
        // Get available brick types for this level
        const availableTypes = brickSystemConfig.types || ['standard'];
        const pattern = brickSystemConfig.pattern || 'solid';

        // Apply pattern-based placement
        switch (pattern) {
            case 'solid':
                return this.getBrickTypeByRow(row, availableTypes);

            case 'checkerboard':
                return (column + row) % 2 === 0 ?
                    this.getBrickTypeByRow(row, availableTypes) : 'standard';

            case 'fortress':
                return this.getFortressBrickType(column, row, config);

            case 'moving_rows':
                return this.getMovingRowBrickType(row, availableTypes);

            case 'boss_fortress':
                return this.getBossFortressBrickType(column, row, config);

            case 'procedural_complex':
                return this.getProceduralBrickType(column, row, config);

            case 'procedural_extreme':
                return this.getProceduralBrickType(column, row, config);

            case 'ultimate_fortress':
                return this.getUltimateFortressBrickType(column, row, config);

            default:
                return availableTypes[Math.floor(Math.random() * availableTypes.length)];
        }
    }

    getBrickTypeByRow(row, availableTypes) {
        // Higher rows have stronger bricks
        const tier = Math.floor(row / 2);
        if (tier >= availableTypes.length) {
            return availableTypes[availableTypes.length - 1];
        }
        return availableTypes[tier];
    }

    getFortressBrickType(column, row, config) {
        const brickSystemConfig = config.brickSystem || {};
        const { columns, rows } = brickSystemConfig;

        // Corners are reinforced
        if ((column === 0 || column === columns - 1) &&
            (row === 0 || row === rows - 1)) {
            return 'gold';
        }

        // Edges are metal
        if (column === 0 || column === columns - 1 ||
            row === 0 || row === rows - 1) {
            return 'metal';
        }

        // Some explosive bricks in strategic positions
        if (column % 3 === 1 && row % 2 === 1) {
            return 'explosive';
        }

        // Standard bricks fill the rest
        return 'standard';
    }

    getMovingRowBrickType(row, availableTypes) {
        // Alternating rows with different properties
        if (row % 3 === 0) return 'regenerating';
        if (row % 3 === 1) return 'metal';
        return this.getBrickTypeByRow(row, availableTypes);
    }

    getBossFortressBrickType(column, row, config) {
        const brickSystemConfig = config.brickSystem || {};
        const { columns, rows } = brickSystemConfig;
        const bossPosition = brickSystemConfig.bossBrickPosition || { row: Math.floor(rows / 2), column: Math.floor(columns / 2) };

        // Center boss brick
        if (column === bossPosition.column && row === bossPosition.row) {
            return 'diamond';
        }

        // Guard layers around boss
        const distance = Math.abs(column - bossPosition.column) + Math.abs(row - bossPosition.row);
        if (distance <= 2) {
            return 'gold';
        }

        // Explosive perimeter
        if (distance === 3) {
            return 'explosive';
        }

        // Metal walls
        if (column === 0 || column === columns - 1 ||
            row === 0 || row === rows - 1) {
            return 'metal';
        }

        // Standard fill
        return 'standard';
    }

    getProceduralBrickType(column, row, config) {
        const brickSystemConfig = config.brickSystem || {};
        // Use noise or patterns for procedural generation
        const noise = this.simplexNoise(column * 0.1, row * 0.1);
        const types = brickSystemConfig.types || ['standard', 'metal', 'gold'];

        if (noise > 0.7) return types[types.length - 1] || 'gold';
        if (noise > 0.4) return types[1] || 'metal';
        if (noise < -0.5 && Math.random() < 0.3) return 'explosive';

        return types[0] || 'standard';
    }

    simplexNoise(x, y) {
        // Simple pseudo-random noise function
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    getUltimateFortressBrickType(column, row, config) {
        const brickSystemConfig = config.brickSystem || {};
        const { columns, rows } = brickSystemConfig;
        const bossPosition = brickSystemConfig.bossBrickPosition || { row: Math.floor(rows / 2), column: Math.floor(columns / 2) };

        // Center boss brick (enhanced diamond)
        if (column === bossPosition.column && row === bossPosition.row) {
            return 'diamond';
        }

        // Inner guard layer (closest to boss)
        const distance = Math.abs(column - bossPosition.column) + Math.abs(row - bossPosition.row);
        if (distance <= 1) {
            return 'gold';
        }

        // Middle guard layer
        if (distance === 2) {
            return 'explosive';
        }

        // Outer guard layer
        if (distance === 3) {
            return Math.random() < 0.7 ? 'gold' : 'metal';
        }

        // Corner and edge reinforcement
        if ((column === 0 || column === columns - 1) &&
            (row === 0 || row === rows - 1)) {
            return 'gold';
        }

        // Walls with some explosive bricks
        if (column === 0 || column === columns - 1 ||
            row === 0 || row === rows - 1) {
            return Math.random() < 0.8 ? 'metal' : 'explosive';
        }

        // Strategic explosive placements
        if ((column % 4 === 2 && row % 3 === 1) ||
            (column % 4 === 1 && row % 3 === 2)) {
            return 'explosive';
        }

        // Diamond bricks in higher rows
        if (row < rows / 3 && Math.random() < 0.3) {
            return 'diamond';
        }

        // Standard bricks fill the rest
        return 'standard';
    }

    updateBallSpeed() {
        if (this.game.balls && this.game.balls.length > 0) {
            const gameBalanceConfig = this.levelConfig.gameBalance || {};
            const globalDefaults = this.configManager.getGlobalDefaults('gameBalance') || {};
            const baseSpeed = globalDefaults.baseBallSpeed || 4.0;
            const ballSpeed = gameBalanceConfig.ballSpeed || baseSpeed;

            const speedMultiplier = ballSpeed / baseSpeed;

            this.game.balls.forEach(ball => {
                const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                if (currentSpeed > 0) {
                    const targetSpeed = baseSpeed * speedMultiplier;
                    ball.dx = (ball.dx / currentSpeed) * targetSpeed;
                    ball.dy = (ball.dy / currentSpeed) * targetSpeed;
                }
            });
        }
    }

    update(deltaTime) {
        // Initialize level if not done yet
        if (!this.levelInitialized) {
            this.initializeLevel(1).then(() => {
                this.levelInitialized = true;
            });
            return; // Skip update until level is initialized
        }

        // Update all bricks
        let activeBricks = 0;
        for (let c = 0; c < this.bricks.length; c++) {
            for (let r = 0; r < this.bricks[c].length; r++) {
                const brick = this.bricks[c][r];
                brick.update(deltaTime);

                if (!brick.destroyed) {
                    activeBricks++;
                }
            }
        }

        // Update special brick effects
        this.updateSpecialEffects(deltaTime);

        // Check win condition
        if (activeBricks === 0 && this.levelState === 'playing') {
            this.completeLevel();
        }

        // Handle level transitions
        if (this.levelState === 'transitioning') {
            this.transitionTimer += deltaTime;
            if (this.transitionTimer >= this.nextLevelDelay) {
                this.loadNextLevel();
            }
        }

        // Update moving patterns if applicable
        if (this.levelConfig.specialFeatures &&
            this.levelConfig.specialFeatures.includes('row_movement')) {
            this.updateMovingRows(deltaTime);
        }
    }

    updateSpecialEffects(deltaTime) {
        // Handle explosive chain reactions
        this.specialBrickEffects = this.specialBrickEffects.filter(effect => {
            if (effect.type === 'explosion') {
                // Check for bricks in explosion radius
                for (let c = 0; c < this.bricks.length; c++) {
                    for (let r = 0; r < this.bricks[c].length; r++) {
                        const brick = this.bricks[c][r];
                        if (brick.destroyed || brick.type === 'explosive') continue;

                        const dx = (brick.x + brick.width / 2) - effect.x;
                        const dy = (brick.y + brick.height / 2) - effect.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance <= effect.radius) {
                            const destroyed = brick.hit();
                            if (destroyed) {
                                this.onBrickDestroyed(brick);

                                // Chain reaction for explosive bricks
                                if (brick.type === 'explosive') {
                                    this.createExplosion(brick.x + brick.width / 2,
                                                       brick.y + brick.height / 2);
                                }
                            }
                        }
                    }
                }
                return false; // Remove explosion effect after processing
            }
            return true;
        });
    }

    updateMovingRows(deltaTime) {
        const moveSpeed = 0.5; // pixels per frame
        const moveDirection = Math.sin(Date.now() * 0.001) > 0 ? 1 : -1;

        for (let c = 0; c < this.bricks.length; c++) {
            for (let r = 0; r < this.bricks[c].length; r++) {
                const brick = this.bricks[c][r];
                if (!brick.destroyed) {
                    brick.x += moveSpeed * moveDirection;

                    // Bounce off walls
                    if (brick.x <= 10 || brick.x + brick.width >= this.game.canvas.width - 10) {
                        brick.x = Math.max(10, Math.min(this.game.canvas.width - 10 - brick.width, brick.x));
                    }
                }
            }
        }
    }

    onBrickDestroyed(brick) {
        this.bricksDestroyed++;
        this.stats.totalBricksDestroyed++;

        // Chance to spawn present when brick is destroyed
        if (this.game.presentSystem) {
            this.game.presentSystem.spawnPresent(
                brick.x + brick.width / 2 - 15,
                brick.y + brick.height / 2
            );
        }

        // Add score
        this.game.score.addPoints(brick.getPoints());

        // Check for special effects
        const specialEffect = brick.destroy();
        if (specialEffect) {
            if (specialEffect.explosive) {
                this.createExplosion(specialEffect.x, specialEffect.y, specialEffect.radius);
            }
        }
    }

    createExplosion(x, y, radius = 80) {
        this.specialBrickEffects.push({
            type: 'explosion',
            x: x,
            y: y,
            radius: radius
        });

        // Create visual explosion effect
        if (this.game.visualEffects) {
            this.game.visualEffects.createExplosion(x, y, radius);
        }
    }

    completeLevel() {
        this.levelState = 'completed';
        this.levelCompletedTime = Date.now();
        const levelTime = this.levelCompletedTime - this.levelStartTime;
        this.stats.totalTimeSpent += levelTime;
        this.stats.levelsCompleted++;

        // Check for perfect level (no lives lost)
        if (this.game.lives.lives === this.game.lives.maxLives) {
            this.stats.perfectLevels++;
            // Bonus points for perfect level
            this.game.score.addPoints(1000 * this.currentLevel);
        }

        // Level completion bonus
        const completionBonus = 500 * this.currentLevel;
        this.game.score.addPoints(completionBonus);

        // Start transition to next level
        this.levelState = 'transitioning';
        this.transitionTimer = 0;

        // Show level complete message
        this.showLevelComplete();
    }

    loadNextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.loadLevel(this.currentLevel + 1);
        } else {
            // Game completed
            this.completeGame();
        }
    }

    completeGame() {
        this.levelState = 'game_completed';
        this.game.gameState = 'gameOver';

        // Calculate final score bonuses
        const timeBonus = Math.max(0, 10000 - this.stats.totalTimeSpent);
        const perfectBonus = this.stats.perfectLevels * 2000;

        this.game.score.addPoints(timeBonus + perfectBonus);

        // Show victory screen
        this.showGameComplete();
    }

    showLevelIntro() {
        // Create level introduction notification
        const levelName = this.levelConfig.name || `Level ${this.currentLevel}`;
        const introText = `${levelName}: ${this.levelConfig.difficulty ? this.levelConfig.difficulty.charAt(0).toUpperCase() + this.levelConfig.difficulty.slice(1) : 'Normal'}`;

        if (this.game.presentSystem) {
            this.game.presentSystem.showEffectNotification(introText, '#FFD700');
        }
    }

    showLevelComplete() {
        const completeText = `Level ${this.currentLevel} Complete!`;
        const bonusText = `+${500 * this.currentLevel} bonus points`;

        if (this.game.presentSystem) {
            this.game.presentSystem.showEffectNotification(completeText, '#32CD32');
            setTimeout(() => {
                this.game.presentSystem.showEffectNotification(bonusText, '#FFD700');
            }, 500);
        }
    }

    showGameComplete() {
        const victoryText = 'Congratulations! All Levels Complete!';
        const scoreText = `Final Score: ${this.game.score.score}`;

        // Display on game canvas
        setTimeout(() => {
            if (this.game.presentSystem) {
                this.game.presentSystem.showEffectNotification(victoryText, '#FFD700');
                setTimeout(() => {
                    this.game.presentSystem.showEffectNotification(scoreText, '#32CD32');
                }, 1000);
            }
        }, 1000);
    }

    draw(ctx) {
        // Don't draw anything if level is not initialized yet
        if (!this.levelInitialized || this.bricks.length === 0) {
            return;
        }

        // Draw all bricks
        for (let c = 0; c < this.bricks.length; c++) {
            for (let r = 0; r < this.bricks[c].length; r++) {
                const brick = this.bricks[c][r];
                brick.draw(ctx);
            }
        }

        // Draw special effects
        this.drawSpecialEffects(ctx);

        // Draw level information
        this.drawLevelInfo(ctx);

        // Draw transition effects
        if (this.levelState === 'transitioning') {
            this.drawTransitionEffect(ctx);
        }
    }

    drawSpecialEffects(ctx) {
        // Draw explosion effects
        this.specialBrickEffects.forEach(effect => {
            if (effect.type === 'explosion') {
                this.drawExplosion(ctx, effect.x, effect.y, effect.radius);
            }
        });
    }

    drawExplosion(ctx, x, y, radius) {
        const canvasWidth = this.game.canvas.width;
        ctx.save();

        // Draw expanding circle
        ctx.strokeStyle = '#FF4500';
        const lineWidth = canvasWidth * 0.003; // 3px at 900px = 0.3%
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw explosion particles
        const particleCount = 20;
        const particleRadius = canvasWidth * 0.003; // 3px at 900px = 0.3%
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = Math.random() * radius;
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;

            ctx.fillStyle = '#FF6347';
            ctx.globalAlpha = 1 - (distance / radius);
            ctx.beginPath();
            ctx.arc(px, py, particleRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawLevelInfo(ctx) {
        const canvasWidth = this.game.canvas.width;
        const canvasHeight = this.game.canvas.height;

        ctx.save();
        const fontSize = canvasWidth * 0.022; // 20px at 900px = 2.2%
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'left';
        const levelX = canvasWidth * 0.022; // 20px at 900px = 2.2%
        const levelY = canvasHeight * 0.033; // 30px at 900px = 3.3%
        ctx.fillText(`Level: ${this.currentLevel}`, levelX, levelY);

        // Draw progress bar
        const progress = this.bricksDestroyed / this.totalBricks;
        const barWidth = canvasWidth * 0.222; // 200px at 900px = 22.2%
        const barHeight = canvasHeight * 0.011; // 10px at 900px = 1.1%
        const barX = canvasWidth * 0.022; // 20px at 900px = 2.2%
        const barY = canvasHeight * 0.044; // 40px at 900px = 4.4%

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progress
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Progress text
        const progressFontSize = canvasWidth * 0.013; // 12px at 900px = 1.3%
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${progressFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(progress * 100)}%`, barX + barWidth / 2, barY + canvasHeight * 0.009);

        ctx.restore();
    }

    drawTransitionEffect(ctx) {
        const canvasWidth = this.game.canvas.width;
        const canvasHeight = this.game.canvas.height;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const titleFontSize = canvasWidth * 0.04; // 36px at 900px = 4%
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${titleFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Level Complete!', canvasWidth / 2, canvasHeight / 2);

        const subtitleFontSize = canvasWidth * 0.022; // 20px at 900px = 2.2%
        ctx.font = `${subtitleFontSize}px Arial`;
        ctx.fillText(`Preparing Level ${this.currentLevel + 1}...`,
                    canvasWidth / 2, canvasHeight / 2 + canvasHeight * 0.044);

        ctx.restore();
    }

    getCurrentLevel() {
        return this.currentLevel;
    }

    getLevelConfig() {
        return this.levelConfig;
    }

    getStats() {
        return this.stats;
    }

    // Start at specific level (for debug mode)
    async startAtLevel(levelNumber) {
        console.log(`Starting at level ${levelNumber}`);
        this.currentLevel = Math.min(levelNumber, this.maxLevel);
        this.bricks = [];
        this.bricksDestroyed = 0;
        this.totalBricks = 0;
        this.levelState = 'playing';
        this.specialBrickEffects = [];
        this.levelInitialized = false;

        // Initialize the specific level
        await this.initializeLevel(this.currentLevel);
        this.levelInitialized = true;

        console.log(`Level ${levelNumber} initialized successfully`);
    }

    reset() {
        this.currentLevel = 1;
        this.bricks = [];
        this.bricksDestroyed = 0;
        this.totalBricks = 0;
        this.levelState = 'playing';
        this.specialBrickEffects = [];
        this.levelInitialized = false;
        this.stats = {
            levelsCompleted: 0,
            totalBricksDestroyed: 0,
            totalTimeSpent: 0,
            perfectLevels: 0
        };

        // Load level 1 asynchronously
        this.initializeLevel(1).then(() => {
            this.levelInitialized = true;
        });
    }
}