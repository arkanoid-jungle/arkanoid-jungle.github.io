// Present types loaded from configuration
export let PRESENT_TYPES = {};

// Load bonuses configuration
async function loadBonusesConfig() {
    try {
        const response = await fetch('config/bonuses-config.json');
        PRESENT_TYPES = await response.json();
        // Make globally accessible
        window.PRESENT_TYPES = PRESENT_TYPES;
    } catch (error) {
        console.warn('Failed to load bonuses config, using defaults:', error);
        // Fallback to hardcoded config
        PRESENT_TYPES = {
            MULTI_BALL: {
                emoji: '🎱',
                color: '#4A90E2',
                effect: 'spawnBalls',
                rarity: 0.15,
                description: 'Spawns 2 additional balls'
            },
            EXPAND_PADDLE: {
                emoji: '📏',
                color: '#7ED321',
                effect: 'expandPaddle',
                rarity: 0.20,
                description: 'Increases paddle width by 40%'
            },
            SLOW_BALL: {
                emoji: '🐌',
                color: '#9013FE',
                effect: 'slowBall',
                rarity: 0.15,
                description: 'Reduces ball velocity by 30%'
            },
            POWER_SHOT: {
                emoji: '⚡',
                color: '#F5A623',
                effect: 'powerShot',
                rarity: 0.10,
                description: 'Ball destroys bricks without bouncing'
            },
            SHIELD: {
                emoji: '🛡️',
                color: '#50E3C2',
                effect: 'addShield',
                rarity: 0.20,
                description: 'Prevents ball loss for 1 collision'
            },
            BONUS_POINTS: {
                emoji: '💎',
                color: '#FF6B6B',
                effect: 'addPoints',
                rarity: 0.20,
                description: 'Instant 500 points'
            },
            ENERGY_BOOST: {
                emoji: '🔵',
                color: '#4A90E2',
                effect: 'energyBoost',
                rarity: 0.15,
                description: 'Reduces energy consumption by 40%'
            },
            ENERGY_FREE: {
                emoji: '🔋',
                color: '#00FF00',
                effect: 'energyFree',
                rarity: 0.10,
                description: 'No energy consumption for movement'
            }
        };
        // Make globally accessible
        window.PRESENT_TYPES = PRESENT_TYPES;
    }
}

// Initialize configuration
loadBonusesConfig();

export class Present {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = PRESENT_TYPES[type] || {
            emoji: '❓',
            color: '#FFFFFF',
            effect: 'addPoints',
            rarity: 0.1,
            description: 'Unknown bonus'
        };

        // Physics properties
        this.velocity = 2.5; // 2.5 pixels per frame as specified
        this.rotation = 0;
        this.rotationSpeed = 0.05;
        this.width = 30;
        this.height = 30;
        this.caught = false;
        this.destroyed = false;

        // Visual effects
        this.particles = [];
        this.glowIntensity = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;

        // Trail effect
        this.trail = [];
        this.maxTrailLength = 8;
    }

    update(deltaTime, canvas) {
        if (this.caught || this.destroyed) return;

        // Update position
        this.y += this.velocity;
        this.rotation += this.rotationSpeed;

        // Update trail
        this.trail.push({ x: this.x, y: this.y, opacity: 1 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Fade trail
        this.trail.forEach((point, index) => {
            point.opacity = (index + 1) / this.maxTrailLength * 0.5;
        });

        // Update visual effects
        this.pulsePhase += 0.1;
        this.glowIntensity = Math.sin(this.pulsePhase) * 0.3 + 0.7;

        // Update particles
        this.updateParticles();

        // Check if present is out of bounds
        if (this.y > canvas.height + this.height) {
            this.destroyed = true;
        }
    }

    updateParticles() {
        // Create new particles occasionally
        if (Math.random() < 0.3) {
            this.particles.push({
                x: this.x + Math.random() * this.width - this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * -1 - 0.5,
                size: Math.random() * 3 + 1,
                life: 1,
                color: this.config.color
            });
        }

        // Update existing particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life -= 0.02;
            particle.size *= 0.98;

            return particle.life > 0;
        });
    }

    checkCollision(paddle) {
        if (this.caught || this.destroyed) return false;

        const presentBottom = this.y + this.height;
        const presentRight = this.x + this.width;
        const paddleBottom = paddle.y + paddle.height;
        const paddleRight = paddle.x + paddle.width;

        // AABB collision detection
        if (this.x < paddleRight &&
            presentRight > paddle.x &&
            this.y < paddleBottom &&
            presentBottom > paddle.y) {

            this.caught = true;
            this.createCatchEffect();
            return true;
        }

        return false;
    }

    createCatchEffect() {
        // Create explosion of particles when caught
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 3 + 2;

            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                life: 1,
                color: this.config.color
            });
        }
    }

    draw(ctx) {
        if (this.destroyed) return;

        // Draw trail
        this.trail.forEach(point => {
            ctx.save();
            ctx.globalAlpha = point.opacity;
            ctx.fillStyle = this.config.color;
            ctx.beginPath();
            ctx.arc(point.x + this.width / 2, point.y + this.height / 2,
                   this.width / 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw particles
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw glow effect
        if (!this.caught) {
            ctx.save();
            ctx.shadowColor = this.config.color;
            ctx.shadowBlur = 15 * this.glowIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Draw present background
        ctx.fillStyle = this.config.color;
        ctx.globalAlpha = this.caught ? 0.5 : 1;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw present border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Draw emoji/icon
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.emoji, 0, 0);
        ctx.restore();

        if (!this.caught) {
            ctx.restore();
        }
    }

    getEffect() {
        return this.config.effect;
    }

    getDescription() {
        return this.config.description;
    }
}