import { Present, PRESENT_TYPES } from './Present.js';
import { Ball } from './Ball.js';
import { configManager } from './ConfigManager.js';

export class PresentSystem {
    constructor(game) {
        this.game = game;
        this.activePresents = [];
        this.effectTimers = new Map();
        this.currentLevel = 1;
        this.lastSpawnTime = 0;
        this.spawnDelay = 800; // Will be updated from config
        this.configManager = configManager;
        this.levelConfig = null;

        // Effect tracking
        this.activeEffects = {
            expandedPaddle: { level: 0, duration: 0 },
            slowBall: { active: false, duration: 0 },
            powerShot: { active: false },
            shield: { active: false, duration: 0 },
            energyBoost: { active: false, duration: 0 },
            energyFree: { active: false, duration: 0 }
        };

        // Statistics
        this.stats = {
            presentsSpawned: 0,
            presentsCaught: 0,
            pointsFromPresents: 0
        };

        // Initialize configuration
        this.initializeConfig();
    }

    async initializeConfig() {
        await this.configManager.initialize();
        this.updateLevelConfig();
    }

    updateLevelConfig() {
        if (this.configManager.isInitialized()) {
            this.levelConfig = this.configManager.getLevelConfig(this.currentLevel, 'presentSystem');
            const globalDefaults = this.configManager.getGlobalDefaults('presentSystem');

            // Use level-specific config or fall back to global defaults
            this.spawnDelay = this.levelConfig?.spawnDelay || globalDefaults?.spawnDelay || 800;
        }
    }

    // Calculate maximum presents for current level from configuration
    getMaxPresents() {
        if (this.configManager.isInitialized() && this.levelConfig) {
            // Use configured max presents or calculate from formula
            if (this.levelConfig.maxPresents) {
                return this.levelConfig.maxPresents;
            }

            // Use global defaults formula
            const globalDefaults = this.configManager.getGlobalDefaults('presentSystem');
            if (globalDefaults) {
                return globalDefaults.maxPresentsBase + globalDefaults.maxPresentsIncrement * (this.currentLevel - 1);
            }
        }

        // Fallback to original formula
        return 3 + 2 * (this.currentLevel - 1);
    }

    // Get duration from configuration
    getEffectDuration(effectType) {
        if (this.configManager.isInitialized() && this.levelConfig) {
            const effectDurations = this.levelConfig.effectDurations;
            if (effectDurations && effectDurations[effectType]) {
                return effectDurations[effectType];
            }
        }

        // Fallback to present type duration or default
        if (!PRESENT_TYPES || Object.keys(PRESENT_TYPES).length === 0) return 15000;
        const presentType = Object.values(PRESENT_TYPES).find(type => type.effect === effectType);
        return presentType && presentType.duration ? presentType.duration : 15000;
    }

    // Calculate spawn probability based on level and current presents
    getSpawnProbability() {
        if (this.configManager.isInitialized() && this.levelConfig) {
            const baseProbability = this.levelConfig.spawnProbability || 0.20;
            const globalDefaults = this.configManager.getGlobalDefaults('presentSystem');
            const presentCountModifier = globalDefaults?.presentCountModifier || 0.05;
            const minimumSpawnChance = globalDefaults?.minimumSpawnChance || 0.05;

            // Reduce chance as screen fills
            const modifier = 1 - (this.activePresents.length * presentCountModifier);
            return Math.max(minimumSpawnChance, baseProbability * modifier);
        }

        // Fallback to hardcoded values
        const baseRates = [0.30, 0.25, 0.20, 0.15, 0.20]; // Levels 1-5
        const levelIndex = Math.min(this.currentLevel - 1, baseRates.length - 1);
        const presentCountModifier = 1 - (this.activePresents.length * 0.05);
        return Math.max(0.05, baseRates[levelIndex] * presentCountModifier);
    }

    spawnPresent(x, y) {
        const currentTime = Date.now();

        // Check spawn delay
        if (currentTime - this.lastSpawnTime < this.spawnDelay) {
            return false;
        }

        // Check if we can spawn more presents
        if (this.activePresents.length >= this.getMaxPresents()) {
            return false;
        }

        // Check spawn probability
        if (Math.random() > this.getSpawnProbability()) {
            return false;
        }

        // Weighted random selection
        const type = this.selectPresentType();
        const present = new Present(x, y, type);
        this.activePresents.push(present);
        this.lastSpawnTime = currentTime;
        this.stats.presentsSpawned++;

        return true;
    }

    selectPresentType() {
        // Use configuration-based rarity adjustments
        if (this.configManager.isInitialized() && this.levelConfig) {
            const rarityModifiers = this.levelConfig.rarityModifiers || {};
            return this.weightedRandomSelection(rarityModifiers);
        }

        // Fallback to hardcoded rarity modifiers
        const rarityModifiers = {
            1: { MULTI_BALL: 1.2, EXPAND_PADDLE: 1.5, SLOW_BALL: 1.3, SHIELD: 1.1, ENERGY_BOOST: 1.2, ENERGY_FREE: 1.1 }, // Tutorial: helpful presents
            2: { MULTI_BALL: 1.1, EXPAND_PADDLE: 1.2, SLOW_BALL: 1.1, SHIELD: 1.0, ENERGY_BOOST: 1.1, ENERGY_FREE: 1.0 }, // Level 2: balanced
            3: { POWER_SHOT: 1.3, SHIELD: 1.2, ENERGY_BOOST: 1.0, ENERGY_FREE: 1.1 }, // Level 3: defensive presents
            4: { POWER_SHOT: 1.5, BONUS_POINTS: 1.3, ENERGY_BOOST: 1.1, ENERGY_FREE: 1.2 }, // Level 4: offensive presents
            5: { BONUS_POINTS: 1.5, MULTI_BALL: 1.4, ENERGY_BOOST: 1.3, ENERGY_FREE: 1.4 } // Boss level: high-value presents
        };

        return this.weightedRandomSelection(rarityModifiers[this.currentLevel] || {});
    }

    weightedRandomSelection(modifiers = {}) {
        // Apply level modifiers to base rarity
        if (!PRESENT_TYPES || Object.keys(PRESENT_TYPES).length === 0) {
            return 'BONUS_POINTS'; // Safe fallback
        }
        
        const adjustedTypes = {};
        Object.entries(PRESENT_TYPES).forEach(([key, config]) => {
            adjustedTypes[key] = {
                ...config,
                rarity: config.rarity * (modifiers[key] || 1.0)
            };
        });

        // Weighted random selection logic
        const totalWeight = Object.values(adjustedTypes).reduce((sum, type) => sum + type.rarity, 0);
        let random = Math.random() * totalWeight;

        for (const [key, type] of Object.entries(adjustedTypes)) {
            random -= type.rarity;
            if (random <= 0) return key;
        }

        return Object.keys(adjustedTypes)[0]; // Fallback
    }

    update(deltaTime, paddle, balls, canvas) {
        // Update active presents
        this.activePresents = this.activePresents.filter(present => {
            present.update(deltaTime, canvas);

            // Check collision with paddle
            if (present.checkCollision(paddle)) {
                this.applyEffect(present, paddle, balls);
                this.stats.presentsCaught++;
                
                // Play multiplier percussion sound
                if (this.game.audioManager) {
                    this.game.audioManager.playPercussionMultiplier();
                }
                
                return false; // Remove caught present
            }

            return !present.destroyed; // Remove destroyed presents
        });

        // Update effect timers
        this.updateEffectTimers(deltaTime);
    }

    updateEffectTimers(deltaTime) {
        // Update expanded paddle effect
        if (this.activeEffects.expandedPaddle.level > 0) {
            this.activeEffects.expandedPaddle.duration -= deltaTime;
            if (this.activeEffects.expandedPaddle.duration <= 0) {
                this.removeExpandedPaddle();
            }
        }

        // Update slow ball effect
        if (this.activeEffects.slowBall.active) {
            this.activeEffects.slowBall.duration -= deltaTime;
            if (this.activeEffects.slowBall.duration <= 0) {
                this.removeSlowBall();
            } else {
                // Clean up velocity tracking for balls that no longer exist
                this.cleanupSlowBallVelocityTracking();
            }
        }

        // Update shield effect
        if (this.activeEffects.shield.active) {
            this.activeEffects.shield.duration -= deltaTime;
            if (this.activeEffects.shield.duration <= 0) {
                this.removeShield();
            }
        }

        // Update energy boost effect
        if (this.activeEffects.energyBoost.active) {
            this.activeEffects.energyBoost.duration -= deltaTime;
            if (this.activeEffects.energyBoost.duration <= 0) {
                this.activeEffects.energyBoost.active = false;
            }
        }

        // Update energy free effect
        if (this.activeEffects.energyFree.active) {
            this.activeEffects.energyFree.duration -= deltaTime;
            if (this.activeEffects.energyFree.duration <= 0) {
                this.activeEffects.energyFree.active = false;
            }
        }
    }

    applyEffect(present, paddle, balls) {
        const effect = present.getEffect();

        switch (effect) {
            case 'spawnBalls':
                this.spawnBalls(balls);
                break;
            case 'expandPaddle':
                this.expandPaddle(paddle);
                break;
            case 'slowBall':
                this.applySlowBall(balls);
                break;
            case 'powerShot':
                this.applyPowerShot(balls);
                break;
            case 'addShield':
                this.addShield();
                break;
            case 'addPoints':
                this.addBonusPoints();
                break;
            case 'energyBoost':
                this.addEnergyBoost();
                break;
            case 'energyFree':
                this.addEnergyFree();
                break;
        }

        // Show effect notification
        this.showEffectNotification(present.getDescription(), present.config.color);
    }

    spawnBalls(balls) {
        if (balls.length === 0) return;

        const mainBall = balls[0];
        
        // Check if main ball is launched (has velocity)
        const mainBallLaunched = mainBall.dx !== 0 || mainBall.dy !== 0;
        
        if (mainBallLaunched) {
            // Normal multi-ball behavior for launched balls
            const angle1 = Math.PI / 4; // 45 degrees
            const angle2 = -Math.PI / 4; // -45 degrees

            // Calculate new ball velocities based on the original speed if slow effect is active
            let speed = Math.sqrt(mainBall.dx * mainBall.dx + mainBall.dy * mainBall.dy);

            // If slow ball effect is active, get the original speed from the stored velocity
            if (this.activeEffects.slowBall.active && this.activeEffects.slowBall.originalVelocities) {
                const originalVelocity = this.activeEffects.slowBall.originalVelocities.get(mainBall.id);
                if (originalVelocity) {
                    speed = Math.sqrt(originalVelocity.dx * originalVelocity.dx + originalVelocity.dy * originalVelocity.dy);
                }
            }

            // Create ball 1
            const ball1 = new Ball(mainBall.x, mainBall.y, mainBall.radius, '#FF69B4', 120);
            ball1.dx = Math.cos(angle1) * speed;
            ball1.dy = Math.sin(angle1) * speed;

            // Create ball 2
            const ball2 = new Ball(mainBall.x, mainBall.y, mainBall.radius, '#87CEEB', 240);
            ball2.dx = Math.cos(angle2) * speed;
            ball2.dy = Math.sin(angle2) * speed;

            balls.push(ball1, ball2);

            // If slow ball effect is active, immediately apply the slow effect to the new balls
            if (this.activeEffects.slowBall.active) {
                this.applySlowBall([ball1, ball2]);
            }
        } else {
            // Ball is not launched - attach new balls to paddle sides
            const paddle = this.game.paddle;
            
            // Create ball 1 (left side of paddle)
            const ball1 = new Ball(paddle.x + paddle.width * 0.25, mainBall.y, mainBall.radius, '#FF69B4', 120);
            ball1.dx = 0;
            ball1.dy = 0;

            // Create ball 2 (right side of paddle)
            const ball2 = new Ball(paddle.x + paddle.width * 0.75, mainBall.y, mainBall.radius, '#87CEEB', 240);
            ball2.dx = 0;
            ball2.dy = 0;

            balls.push(ball1, ball2);
        }
    }

    expandPaddle(paddle) {
        // Max 2 expansions allowed
        if (this.activeEffects.expandedPaddle.level >= 2) return;

        // Reset duration to full 15 seconds when catching new expand paddle present
        // This refreshes the timer even if paddle is already expanded
        this.activeEffects.expandedPaddle.level++;
        const expansionFactor = 1.4; // 40% increase
        paddle.width *= expansionFactor;
        paddle.width = Math.min(paddle.width, 240); // Max width limit

        // Reset duration to full time (15 seconds)
        this.activeEffects.expandedPaddle.duration = this.getEffectDuration('expandPaddle');

        // Show refresh notification if already expanded
        if (this.activeEffects.expandedPaddle.level > 1) {
            this.showEffectNotification('Paddle Extended! Timer Reset!', '#7ED321');
        }
    }

    removeExpandedPaddle() {
        const paddle = this.game.paddle;
        paddle.width = 120; // Reset to original width
        this.activeEffects.expandedPaddle.level = 0;
    }

    applySlowBall(balls) {
        // Reset duration to full 30 seconds when catching new slow ball present
        // This refreshes the timer even if slow ball effect is already active
        const wasAlreadyActive = this.activeEffects.slowBall.active;

        this.activeEffects.slowBall.active = true;

        // Store original velocities for restoration using ball IDs
        if (!this.activeEffects.slowBall.originalVelocities) {
            this.activeEffects.slowBall.originalVelocities = new Map();
        }

        balls.forEach(ball => {
            // Only store original velocities and apply slow effect if we haven't done so yet
            if (!this.activeEffects.slowBall.originalVelocities.has(ball.id)) {
                // Store original velocity
                this.activeEffects.slowBall.originalVelocities.set(ball.id, {
                    dx: ball.dx,
                    dy: ball.dy
                });
                
                // Apply 30% velocity reduction
                ball.dx = ball.dx * 0.7;
                ball.dy = ball.dy * 0.7;
            }
            // If ball already has stored velocity, it's already slowed - don't apply again
        });

        // Reset duration to full time (30 seconds)
        this.activeEffects.slowBall.duration = this.getEffectDuration('slowBall');

        // Show refresh notification if effect was already active
        if (wasAlreadyActive) {
            this.showEffectNotification('Slow Ball Refreshed! Timer Reset!', '#9013FE');
        }
    }

    removeSlowBall() {
        this.activeEffects.slowBall.active = false;

        // Restore original velocities for all current balls using their IDs
        if (this.activeEffects.slowBall.originalVelocities) {
            this.game.balls.forEach(ball => {
                const originalVelocity = this.activeEffects.slowBall.originalVelocities.get(ball.id);
                if (originalVelocity) {
                    // Restore exact original velocity - this preserves direction perfectly
                    ball.dx = originalVelocity.dx;
                    ball.dy = originalVelocity.dy;
                }
                // If a ball doesn't have stored original velocity, it means:
                // 1. It was created after the slow effect was active
                // 2. It already has the correct velocity (no changes needed)
            });

            // Clean up stored velocities
            this.activeEffects.slowBall.originalVelocities.clear();
        }
    }

    cleanupSlowBallVelocityTracking() {
        if (!this.activeEffects.slowBall.originalVelocities) return;

        const currentBallIds = new Set(this.game.balls.map(ball => ball.id));
        const trackedBallIds = this.activeEffects.slowBall.originalVelocities.keys();

        // Remove tracking for balls that no longer exist
        for (const ballId of trackedBallIds) {
            if (!currentBallIds.has(ballId)) {
                this.activeEffects.slowBall.originalVelocities.delete(ballId);
            }
        }
    }

    applyPowerShot(balls) {
        // Apply to all balls, effect lasts until next collision
        balls.forEach(ball => {
            ball.powerShot = true;
        });
    }

    addShield() {
        // Reset duration to full 10 seconds when catching new shield present
        // This refreshes the timer even if shield is already active
        const wasAlreadyActive = this.activeEffects.shield.active;

        this.activeEffects.shield.active = true;
        // Reset duration to full time (10 seconds)
        this.activeEffects.shield.duration = this.getEffectDuration('addShield');

        // Show refresh notification if shield was already active
        if (wasAlreadyActive) {
            this.showEffectNotification('Shield Refreshed! Timer Reset!', '#50E3C2');
        }
    }

    removeShield() {
        this.activeEffects.shield.active = false;
    }

    addBonusPoints() {
        const points = 500;
        this.game.score.addPoints(points);
        this.stats.pointsFromPresents += points;
    }

    addEnergyBoost() {
        // Restore 50% of max energy immediately
        if (this.game.energySystem && this.game.energySystem.config) {
            const maxEnergy = this.game.energySystem.config.maxEnergy;
            const boostAmount = maxEnergy * 0.5;
            this.game.energySystem.addEnergy(boostAmount);
        }
        
        this.activeEffects.energyBoost.active = true;
        this.activeEffects.energyBoost.duration = this.getEffectDuration('energyBoost');
    }

    addEnergyFree() {
        // Activate energy-free mode (no consumption for duration)
        this.activeEffects.energyFree.active = true;
        this.activeEffects.energyFree.duration = this.getEffectDuration('energyFree');
    }

    checkShieldCollision() {
        if (this.activeEffects.shield.active) {
            this.removeShield();
            this.showEffectNotification('Shield Protected!', '#50E3C2');
            return true;
        }
        return false;
    }

    showEffectNotification(text, color) {
        // Create floating text effect
        const notification = {
            text: text,
            color: color,
            x: this.game.canvas.width / 2,
            y: this.game.canvas.height / 2,
            opacity: 1,
            scale: 0.5,
            velocity: -2
        };

        // Add to notifications array (would need to be implemented in game)
        if (!this.notifications) {
            this.notifications = [];
        }
        this.notifications.push(notification);
    }

    draw(ctx) {
        // Draw all active presents
        this.activePresents.forEach(present => present.draw(ctx));

        // Draw effect notifications
        if (this.notifications) {
            this.notifications = this.notifications.filter(notification => {
                notification.y += notification.velocity;
                notification.opacity -= 0.02;
                notification.scale += 0.01;

                if (notification.opacity > 0) {
                    ctx.save();
                    ctx.globalAlpha = notification.opacity;
                    ctx.fillStyle = notification.color;
                    ctx.font = `${24 * notification.scale}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText(notification.text, notification.x, notification.y);
                    ctx.restore();
                    return true;
                }
                return false;
            });
        }

        // Draw shield effect
        if (this.activeEffects.shield.active) {
            this.drawShield(ctx);
        }

        // Draw slow ball effect
        if (this.activeEffects.slowBall.active) {
            this.drawSlowBallEffect(ctx);
        }
    }

    drawShield(ctx) {
        ctx.save();

        const shieldY = this.game.canvas.height - 15;
        const shieldHeight = 10;

        // Draw main shield barrier with gradient
        const gradient = ctx.createLinearGradient(10, shieldY, this.game.canvas.width - 10, shieldY);
        gradient.addColorStop(0, '#50E3C2');
        gradient.addColorStop(0.5, '#7FFFD4');
        gradient.addColorStop(1, '#50E3C2');

        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.003) * 0.2;
        ctx.fillRect(10, shieldY, this.game.canvas.width - 20, shieldHeight);

        // Draw shield border
        ctx.strokeStyle = '#50E3C2';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.8;
        ctx.strokeRect(10, shieldY, this.game.canvas.width - 20, shieldHeight);

        // Draw shimmer particles
        for (let i = 0; i < 8; i++) {
            const x = (this.game.canvas.width / 8) * i + 15;
            const y = shieldY + shieldHeight / 2 + Math.sin(Date.now() * 0.008 + i * 0.5) * 3;
            const size = 2 + Math.sin(Date.now() * 0.01 + i) * 1;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.9;
            ctx.fill();
        }

        // Draw shield text indicator
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ SHIELD ACTIVE 🛡️', this.game.canvas.width / 2, shieldY - 10);

        ctx.restore();
    }

    drawSlowBallEffect(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.3;

        // Draw purple time-distortion particles around balls
        this.game.balls.forEach(ball => {
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6 + Date.now() * 0.002;
                const radius = 20 + Math.sin(Date.now() * 0.003 + i) * 5;
                const x = ball.x + Math.cos(angle) * radius;
                const y = ball.y + Math.sin(angle) * radius;

                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#9013FE';
                ctx.fill();
            }
        });

        ctx.restore();
    }

    setLevel(level) {
        this.currentLevel = level;
        // Update level configuration
        this.updateLevelConfig();
        // Clear all active presents when changing levels
        this.activePresents = [];
    }

    reset() {
        this.activePresents = [];
        this.effectTimers.clear();
        this.notifications = [];
        this.activeEffects = {
            expandedPaddle: { level: 0, duration: 0 },
            slowBall: { active: false, duration: 0 },
            powerShot: { active: false },
            shield: { active: false, duration: 0 },
            energyBoost: { active: false, duration: 0 },
            energyFree: { active: false, duration: 0 }
        };
        this.stats = {
            presentsSpawned: 0,
            presentsCaught: 0,
            pointsFromPresents: 0
        };
    }

    getStats() {
        return this.stats;
    }
}