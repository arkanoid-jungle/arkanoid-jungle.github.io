export class EnergyAnimation {
    constructor() {
        this.particles = [];
        this.enabled = true;
        this.energyWaves = [];
        this.maxParticles = 20;
        this.time = 0;
        this.fieldIntensity = 0;
        this.fieldPulse = 0;
    }

    update(deltaTime, paddle, energySystem) {
        if (!this.enabled) {
            this.clearParticles();
            return;
        }

        this.time += deltaTime;

        // Update field animation
        this.fieldPulse += deltaTime * 0.002;
        const energyRatio = energySystem.getEnergyPercentage();
        this.fieldIntensity = energyRatio > 0.3 ? Math.min(1.0, this.fieldIntensity + deltaTime * 0.001) : Math.max(0, this.fieldIntensity - deltaTime * 0.002);

        // Update existing particles
        this.updateParticles(deltaTime);

        // Update energy waves
        this.updateEnergyWaves(deltaTime);

        // Generate new particles based on energy level (reduced since we have field effect)
        if (Math.random() < 0.05) { // Much less frequent particles
            this.generateParticles(deltaTime, paddle, energySystem);
        }

        // Generate energy waves when moving
        if (Math.abs(paddle.velocity) > 0.5 && energySystem.getEnergyPercentage() > 0.3) {
            this.generateEnergyWave(paddle, energySystem);
        }
    }

    generateParticles(deltaTime, paddle, energySystem) {
        const energyRatio = energySystem.getEnergyPercentage();
        const particleCount = energySystem.getParticleCount();

        if (this.particles.length < this.maxParticles && Math.random() < particleCount * 0.1) {
            const particle = this.createParticle(paddle, energySystem);
            this.particles.push(particle);
        }
    }

    createParticle(paddle, energySystem) {
        const energyRatio = energySystem.getEnergyPercentage();
        const energyColor = energySystem.getEnergyColor();

        // Position particles under and around the paddle
        const spreadX = paddle.width * 0.8;
        const spreadY = 30;

        return {
            x: paddle.x + paddle.width / 2 + (Math.random() - 0.5) * spreadX,
            y: paddle.y + paddle.height + Math.random() * spreadY,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            size: Math.random() * 4 + 2,
            life: 1.0,
            maxLife: 1.0,
            color: energyColor,
            glow: energyRatio > 0.6,
            fadeRate: 0.02,
            type: energyRatio > 0.6 ? 'energized' : 'normal'
        };
    }

    generateEnergyWave(paddle, energySystem) {
        if (this.energyWaves.length < 3 && Math.random() < 0.1) {
            this.energyWaves.push({
                x: paddle.x + paddle.width / 2,
                y: paddle.y + paddle.height,
                radius: 0,
                maxRadius: 50,
                life: 1.0,
                color: energySystem.getEnergyColor(),
                expansionSpeed: 2
            });
        }
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Apply physics
            particle.vy += 0.1; // Gravity
            particle.vx *= 0.99; // Friction

            // Update life
            particle.life -= particle.fadeRate;

            // Update size
            if (particle.type === 'energized') {
                particle.size = Math.max(1, particle.size + Math.sin(this.time * 0.01) * 0.2);
            }

            return particle.life > 0 && particle.size > 0.5;
        });
    }

    updateEnergyWaves(deltaTime) {
        this.energyWaves = this.energyWaves.filter(wave => {
            wave.radius += wave.expansionSpeed;
            wave.life -= 0.03;

            return wave.life > 0 && wave.radius < wave.maxRadius;
        });
    }

    draw(ctx, paddle, energySystem) {
        if (!this.enabled) return;

        // Draw energy field effect first (background)
        this.drawEnergyField(ctx, paddle, energySystem);

        // Draw energy waves (midground)
        this.drawEnergyWaves(ctx);

        // Draw particles (foreground)
        this.drawParticles(ctx);
    }

    drawParticles(ctx) {
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;

            if (particle.glow) {
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 15;
            }

            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            // Add inner glow for energized particles
            if (particle.type === 'energized') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });
    }

    drawEnergyField(ctx, paddle, energySystem) {
        const energyRatio = energySystem.getEnergyPercentage();
        if (energyRatio <= 0.3 || this.fieldIntensity <= 0) return;

        ctx.save();

        // Get canvas dimensions for clipping
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Create clipping region to prevent drawing outside canvas
        ctx.beginPath();
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.clip();

        // Get energy color with pulsing intensity
        const pulseIntensity = Math.sin(this.fieldPulse) * 0.2 + 0.8;
        const energyColor = energySystem.getEnergyColor();

        // Create large gradient field emanating from under the paddle
        const fieldX = paddle.x + paddle.width / 2;
        const fieldY = paddle.y + paddle.height + 20; // Start from under the paddle
        const fieldWidth = paddle.width * 2.5; // Wide field
        const fieldHeight = 150; // Tall field

        // Create radial gradient that emanates upward from the paddle
        const gradient = ctx.createRadialGradient(
            fieldX, fieldY, 0,                    // Center point
            fieldX, fieldY, fieldHeight           // Maximum radius
        );

        // Parse the energy color to create gradient
        const rgb = energyColor.match(/\d+/g);
        if (rgb) {
            const [r, g, b] = rgb;
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.4 * this.fieldIntensity * pulseIntensity})`);
            gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${0.25 * this.fieldIntensity * pulseIntensity})`);
            gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${0.15 * this.fieldIntensity * pulseIntensity})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        }

        // Draw the main field
        ctx.fillStyle = gradient;
        ctx.globalAlpha = this.fieldIntensity * 0.6;
        ctx.fillRect(fieldX - fieldWidth/2, fieldY - fieldHeight, fieldWidth, fieldHeight);

        // Draw energy tendrils/whisps rising from the paddle
        if (this.fieldIntensity > 0.5) {
            ctx.globalAlpha = this.fieldIntensity * 0.3 * pulseIntensity;
            ctx.strokeStyle = energyColor;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            // Draw multiple energy tendrils
            for (let i = 0; i < 5; i++) {
                const tendrilX = fieldX + (Math.random() - 0.5) * paddle.width * 1.5;
                const tendrilHeight = 50 + Math.random() * 80;

                ctx.beginPath();
                ctx.moveTo(tendrilX, fieldY);

                // Create wavy tendril path
                const waveAmplitude = 10 + Math.random() * 15;
                const waveFrequency = 0.05 + Math.random() * 0.03;

                for (let y = 0; y < tendrilHeight; y += 5) {
                    const x = tendrilX + Math.sin((y * waveFrequency) + this.fieldPulse + i) * waveAmplitude * (1 - y/tendrilHeight);
                    ctx.lineTo(x, fieldY - y);
                }

                ctx.stroke();
            }
        }

        // Draw glowing aura directly under paddle (bounded)
        const auraGradient = ctx.createRadialGradient(
            fieldX, paddle.y + paddle.height/2, 0,
            fieldX, paddle.y + paddle.height/2, paddle.width
        );

        if (rgb) {
            const [r, g, b] = rgb;
            auraGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.3 * this.fieldIntensity})`);
            auraGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        }

        ctx.fillStyle = auraGradient;
        ctx.globalAlpha = this.fieldIntensity * 0.8;

        // Calculate bounded aura rectangle
        const auraX = Math.max(0, fieldX - paddle.width);
        const auraY = Math.max(0, paddle.y - 62)  +100;
        const auraWidth = Math.min(canvasWidth - auraX, paddle.width * 2);
        const auraHeight = Math.min(canvasHeight - auraY, paddle.height + 40);

        ctx.fillRect(auraX, auraY, auraWidth, auraHeight);

        ctx.restore();
    }

    drawEnergyWaves(ctx) {
        this.energyWaves.forEach(wave => {
            ctx.save();
            ctx.globalAlpha = wave.life * 0.3;
            ctx.strokeStyle = wave.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });
    }

    clearParticles() {
        this.particles = [];
        this.energyWaves = [];
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearParticles();
        }
    }

    reset() {
        this.clearParticles();
        this.time = 0;
    }
}