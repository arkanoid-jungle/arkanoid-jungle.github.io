export class VisualEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animations = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.backgroundParticles = [];
        this.scorePopups = [];

        // Performance optimization
        this.maxParticles = 500;
        this.particlePool = [];
        this.animationPool = [];

        // Initialize background particles
        this.initBackgroundParticles();
    }

    initBackgroundParticles() {
        // Disabled background particles to prevent green glowing edge effects
        this.backgroundParticles = [];
    }

    createBrickExplosion(x, y, brickColor, brickType = 'standard') {
        const particleCount = brickType === 'explosive' ? 40 : 20;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.2;
            const speed = Math.random() * 6 + 2;

            const particle = this.getParticleFromPool();
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = Math.random() * 5 + 2;
            particle.life = 1;
            particle.color = brickColor;
            particle.gravity = 0.2;
            particle.fadeRate = 0.02;
            particle.type = 'explosion';

            this.particles.push(particle);
        }

        // Create screen shake for explosive bricks
        if (brickType === 'explosive') {
            this.addScreenShake(10, 300);
        } else {
            this.addScreenShake(5, 150);
        }

        // Create score popup
        this.createScorePopup(x, y, this.getBrickPoints(brickType));
    }

    createPresentTrail(present) {
        const particle = this.getParticleFromPool();
        particle.x = present.x + present.width / 2;
        particle.y = present.y + present.height / 2;
        particle.vx = (Math.random() - 0.5) * 1;
        particle.vy = Math.random() * 0.5 + 0.5;
        particle.size = Math.random() * 3 + 1;
        particle.life = 0.6;
        particle.color = present.config.color;
        particle.fadeRate = 0.03;
        particle.type = 'trail';

        this.particles.push(particle);
    }

    createPresentCatchEffect(x, y, color) {
        // Create burst of particles for catching presents
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25;
            const speed = Math.random() * 4 + 3;

            const particle = this.getParticleFromPool();
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = Math.random() * 4 + 2;
            particle.life = 1;
            particle.color = color;
            particle.gravity = 0.1;
            particle.fadeRate = 0.015;
            particle.type = 'catch';

            this.particles.push(particle);
        }

        this.addScreenShake(3, 100);
    }

    createPowerShotEffect(x, y) {
        // Create lightning trail effect
        const lightningBolts = 5;
        for (let i = 0; i < lightningBolts; i++) {
            const animation = this.getAnimationFromPool();
            animation.type = 'lightning';
            animation.startX = x;
            animation.startY = y;
            animation.endX = x + (Math.random() - 0.5) * 100;
            animation.endY = y + Math.random() * 50;
            animation.life = 0.3;
            animation.color = '#F5A623';
            animation.width = Math.random() * 3 + 1;

            this.animations.push(animation);
        }

        this.addScreenShake(8, 200);
    }

    createShieldEffect(x, y) {
        // Create shimmer barrier effect
        const shimmerCount = 20;
        for (let i = 0; i < shimmerCount; i++) {
            const angle = (Math.PI * 2 * i) / shimmerCount;
            const radius = 30;

            const particle = this.getParticleFromPool();
            particle.x = x + Math.cos(angle) * radius;
            particle.y = y + Math.sin(angle) * radius;
            particle.vx = -Math.cos(angle) * 2;
            particle.vy = -Math.sin(angle) * 2;
            particle.size = 3;
            particle.life = 0.8;
            particle.color = '#50E3C2';
            particle.fadeRate = 0.02;
            particle.type = 'shield';

            this.particles.push(particle);
        }
    }

    createMultiBallEffect(x, y, count = 2) {
        // Create swirling effect for multi-ball spawn
        for (let ball = 0; ball < count; ball++) {
            const particlesPerBall = 15;
            for (let i = 0; i < particlesPerBall; i++) {
                const angle = (Math.PI * 2 * i) / particlesPerBall + (ball * Math.PI / count);
                const radius = 25;

                const particle = this.getParticleFromPool();
                particle.x = x + Math.cos(angle) * radius;
                particle.y = y + Math.sin(angle) * radius;
                particle.vx = -Math.cos(angle) * 3;
                particle.vy = -Math.sin(angle) * 3;
                particle.size = 2;
                particle.life = 1;
                particle.color = ball === 0 ? '#FF69B4' : '#87CEEB';
                particle.fadeRate = 0.02;
                particle.type = 'multiball';

                this.particles.push(particle);
            }
        }
    }

    createExplosion(x, y, radius) {
        // Create large explosion effect
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * radius / 10 + 2;

            const particle = this.getParticleFromPool();
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = Math.random() * 8 + 4;
            particle.life = 1;
            particle.color = '#FF4500';
            particle.gravity = 0.3;
            particle.fadeRate = 0.025;
            particle.type = 'explosion';

            this.particles.push(particle);
        }

        // Create shockwave animation
        const animation = this.getAnimationFromPool();
        animation.type = 'shockwave';
        animation.x = x;
        animation.y = y;
        animation.radius = 0;
        animation.maxRadius = radius;
        animation.life = 0.5;
        animation.color = '#FF4500';

        this.animations.push(animation);

        this.addScreenShake(15, 400);
    }

    createScorePopup(x, y, points) {
        const popup = {
            x: x,
            y: y,
            text: `+${points}`,
            life: 1.5,
            velocity: -2,
            color: points >= 200 ? '#FFD700' : points >= 100 ? '#C0C0C0' : '#90EE90',
            size: points >= 200 ? 24 : points >= 100 ? 20 : 16
        };

        this.scorePopups.push(popup);
    }

    createLevelTransitionEffect(type, color) {
        if (type === 'level_complete') {
            // Create celebratory fireworks
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const x = Math.random() * this.canvas.width;
                    const y = Math.random() * this.canvas.height / 2;
                    this.createFirework(x, y, color);
                }, i * 200);
            }
        } else if (type === 'game_over') {
            // Create falling particles effect
            for (let i = 0; i < 100; i++) {
                const particle = this.getParticleFromPool();
                particle.x = Math.random() * this.canvas.width;
                particle.y = -10;
                particle.vx = (Math.random() - 0.5) * 2;
                particle.vy = Math.random() * 2 + 1;
                particle.size = Math.random() * 3 + 1;
                particle.life = 3;
                particle.color = '#666666';
                particle.gravity = 0.1;
                particle.fadeRate = 0.005;
                particle.type = 'fallout';

                this.particles.push(particle);
            }
        }
    }

    createFirework(x, y, color) {
        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 4 + 3;

            const particle = this.getParticleFromPool();
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = Math.random() * 4 + 2;
            particle.life = 1;
            particle.color = color || this.getRandomColor();
            particle.gravity = 0.15;
            particle.fadeRate = 0.02;
            particle.type = 'firework';

            this.particles.push(particle);
        }
    }

    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }

    update(deltaTime) {
        // Update background particles
        this.updateBackgroundParticles();

        // Update particles
        this.updateParticles(deltaTime);

        // Update animations
        this.updateAnimations(deltaTime);

        // Update screen shake
        this.updateScreenShake(deltaTime);

        // Update score popups
        this.updateScorePopups(deltaTime);

        // Performance cleanup
        this.cleanup();
    }

    updateBackgroundParticles() {
        this.backgroundParticles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Bounce off screen edges instead of wrapping
            if (particle.x <= 0 || particle.x >= this.canvas.width) {
                particle.speedX *= -1;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            }
            if (particle.y <= 0 || particle.y >= this.canvas.height) {
                particle.speedY *= -1;
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }

            // Subtle opacity animation
            particle.opacity = 0.05 + Math.sin(Date.now() * 0.001 + particle.x) * 0.05;
        });
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Apply physics
            if (particle.gravity) {
                particle.vy += particle.gravity;
            }

            // Apply friction
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Update life
            particle.life -= particle.fadeRate || 0.02;

            // Update size
            if (particle.shrink) {
                particle.size *= 0.98;
            }

            // Bounce off walls for certain particle types
            if (particle.type === 'trail' || particle.type === 'shield') {
                if (particle.x <= 0 || particle.x >= this.canvas.width) particle.vx *= -1;
                if (particle.y <= 0 || particle.y >= this.canvas.height) particle.vy *= -1;
            }

            return particle.life > 0 && particle.size > 0.1;
        });
    }

    updateAnimations(deltaTime) {
        this.animations = this.animations.filter(animation => {
            animation.life -= 0.02;

            if (animation.type === 'shockwave') {
                animation.radius += (animation.maxRadius - animation.radius) * 0.2;
            }

            return animation.life > 0;
        });
    }

    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;

            if (this.screenShake.duration <= 0) {
                this.screenShake.x = 0;
                this.screenShake.y = 0;
                this.screenShake.intensity = 0;
            }
        }
    }

    updateScorePopups(deltaTime) {
        this.scorePopups = this.scorePopups.filter(popup => {
            popup.y += popup.velocity;
            popup.velocity += 0.1; // gravity
            popup.life -= 0.02;
            return popup.life > 0;
        });
    }

    cleanup() {
        // Remove old particles to maintain performance
        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(-this.maxParticles);
        }

        // Return particles to pool
        this.particles.forEach(particle => {
            if (particle.life <= 0) {
                this.returnParticleToPool(particle);
            }
        });

        this.animations.forEach(animation => {
            if (animation.life <= 0) {
                this.returnAnimationToPool(animation);
            }
        });
    }

    render() {
        // Save context state
        this.ctx.save();

        // Apply screen shake
        this.ctx.translate(this.screenShake.x, this.screenShake.y);

        // Render background particles
        this.renderBackgroundParticles();

        // Render particles
        this.renderParticles();

        // Render animations
        this.renderAnimations();

        // Render score popups
        this.renderScorePopups();

        // Restore context state
        this.ctx.restore();
    }

    renderBackgroundParticles() {
        // Background particles disabled - no rendering
    }

    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;

            if (particle.type === 'lightning') {
                // Lightning bolt effect
                this.ctx.strokeStyle = particle.color;
                this.ctx.lineWidth = particle.width;
                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.moveTo(particle.startX, particle.startY);
                this.ctx.lineTo(particle.endX, particle.endY);
                this.ctx.stroke();
            } else {
                // Regular particle
                this.ctx.fillStyle = particle.color;

                if (particle.glow) {
                    this.ctx.shadowColor = particle.color;
                    this.ctx.shadowBlur = 10;
                }

                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    renderAnimations() {
        this.animations.forEach(animation => {
            this.ctx.save();
            this.ctx.globalAlpha = animation.life;

            if (animation.type === 'shockwave') {
                this.ctx.strokeStyle = animation.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(animation.x, animation.y, animation.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            this.ctx.restore();
        });
    }

    renderScorePopups() {
        this.scorePopups.forEach(popup => {
            this.ctx.save();
            this.ctx.globalAlpha = popup.life;
            this.ctx.fillStyle = popup.color;
            this.ctx.font = `bold ${popup.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(popup.text, popup.x, popup.y);
            this.ctx.fillText(popup.text, popup.x, popup.y);
            this.ctx.restore();
        });
    }

    // Object pooling for performance
    getParticleFromPool() {
        return this.particlePool.pop() || {
            x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 1, color: '#FFF',
            gravity: 0, fadeRate: 0.02, type: 'normal', glow: false
        };
    }

    returnParticleToPool(particle) {
        this.particlePool.push(particle);
    }

    getAnimationFromPool() {
        return this.animationPool.pop() || {
            type: 'normal', life: 1, color: '#FFF', x: 0, y: 0
        };
    }

    returnAnimationToPool(animation) {
        this.animationPool.push(animation);
    }

    // Utility methods
    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getBrickPoints(brickType) {
        const points = {
            'standard': 50,
            'metal': 100,
            'gold': 200,
            'explosive': 150,
            'regenerating': 125,
            'diamond': 500
        };
        return points[brickType] || 50;
    }

    reset() {
        this.particles = [];
        this.animations = [];
        this.scorePopups = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    }
}