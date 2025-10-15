export class Brick {
    constructor(x, y, width, height, type = 'standard', row = 0, currentLevel = 1, brickConfig = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.row = row;
        this.currentLevel = currentLevel;
        this.destroyed = false;
        this.damaged = false;

        // Apply config-based durability bonus
        if (brickConfig && brickConfig.durabilityBonusChance && Math.random() < brickConfig.durabilityBonusChance) {
            this.durabilityBonus = Math.random() < 0.5 ? 1 : 2; // 50% chance for +1, 50% chance for +2
        } else {
            this.durabilityBonus = 0;
        }

        // Initialize brick properties based on type
        this.initializeType();

        // Visual effects
        this.crackLevel = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.particles = [];
        this.regenerateTimer = 0;
    }

    initializeType() {
        // Jungle-style color palette
        const jungleColors = [
            '#2D5016', // Dark Forest Green
            '#3A5F0B', // Jungle Green
            '#4A7C59', // Moss Green
            '#6B8E23', // Olive Drab
            '#556B2F', // Dark Olive Green
            '#8FBC8F', // Dark Sea Green
            '#228B22', // Forest Green
            '#006400', // Dark Green
            '#355E3B', // Rich Green
            '#4F7942', // Fern Green
            '#8A9A5B', // Sage Green
            '#6B8E23', // Army Green
            '#556B2F', // Flat Green
            '#3CB371', // Medium Sea Green
            '#2E8B57', // Sea Green
            '#90EE90' // Light Green
        ];

        const brickTypes = {
            standard: {
                durability: 1,
                points: 50,
                baseColor: this.getRandomJungleColor(jungleColors),
                special: false
            },
            metal: {
                durability: 2,
                points: 100,
                baseColor: '#8B7355', // Bronze/Bark color
                special: false
            },
            gold: {
                durability: 3,
                points: 200,
                baseColor: '#DAA520', // Goldenrod (jungle treasure)
                special: false
            },
            explosive: {
                durability: 1,
                points: 150,
                baseColor: '#CD5C5C', // Indian Red (volcanic)
                special: true,
                explosionRadius: 80
            },
            regenerating: {
                durability: 2,
                points: 125,
                baseColor: '#228B22', // Forest Green (life)
                special: true,
                regenerateTime: 10000 // 10 seconds
            },
            diamond: {
                durability: 4,
                points: 500,
                baseColor: '#E0FFFF', // Light Cyan (jungle water)
                special: true,
                sparkle: true
            }
        };

        const config = brickTypes[this.type] || brickTypes.standard;
        Object.assign(this, config);

        // Apply durability bonus from config (if any)
        this.durability += this.durabilityBonus;

        // Enforce max durability from config
        if (brickConfig && brickConfig.maxDurability) {
            this.durability = Math.min(this.durability, brickConfig.maxDurability);
        }

        // Make bonus bricks more noticeable
        if (this.special) {
            this.points += 50 * this.currentLevel; // Bonus points increase with level
        }

        // Set initial health
        this.maxDurability = this.durability;
        this.currentDurability = this.durability;

        // Darken color for bonus durability
        if (this.durabilityBonus > 0) {
            this.baseColor = this.darkenColor(this.baseColor, this.durabilityBonus * 20);
        }
    }

    getRandomJungleColor(colors) {
        return colors[Math.floor(Math.random() * colors.length)];
    }

    darkenColor(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) - amount;
        let g = ((num >> 8) & 0x00FF) - amount;
        let b = (num & 0x0000FF) - amount;
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        g = g > 255 ? 255 : g < 0 ? 0 : g;
        b = b > 255 ? 255 : b < 0 ? 0 : b;

        return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
    }

    getJungleColor(tier) {
        const jungleColors = [
            '#228B22', // Forest Green
            '#32CD32', // Lime Green
            '#90EE90', // Light Green
            '#006400', // Dark Green
            '#9ACD32', // Yellow Green
            '#556B2F', // Dark Olive Green
            '#6B8E23', // Olive Drab
            '#8FBC8F'  // Dark Sea Green
        ];
        return jungleColors[Math.floor(tier) % jungleColors.length];
    }

    hit() {
        if (this.destroyed) return false;

        this.currentDurability--;
        this.damaged = true;

        // Create hit particles
        this.createHitParticles();

        if (this.currentDurability <= 0) {
            this.destroy();
            return true;
        }

        // Update visual state based on remaining durability
        this.crackLevel = Math.floor((1 - this.currentDurability / this.maxDurability) * 3);
        return false;
    }

    destroy() {
        this.destroyed = true;
        this.createDestructionParticles();

        // Special effects for different brick types
        if (this.type === 'explosive') {
            return { explosive: true, x: this.x + this.width / 2, y: this.y + this.height / 2, radius: this.explosionRadius };
        }
        return null;
    }

    createHitParticles() {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 2 + 1;

            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                life: 1,
                color: this.baseColor
            });
        }
    }

    createDestructionParticles() {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;

            this.particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 2,
                life: 1,
                color: this.baseColor,
                gravity: 0.2
            });
        }
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.gravity) {
                particle.vy += particle.gravity;
            }

            particle.life -= 0.02;
            particle.size *= 0.98;

            return particle.life > 0;
        });
    }

    update(deltaTime) {
        // Update pulse animation for special bricks
        if (this.special) {
            this.pulsePhase += 0.05;
        }

        // Update regeneration timer
        if (this.type === 'regenerating' && this.destroyed) {
            this.regenerateTimer += deltaTime;
            if (this.regenerateTimer >= this.regenerateTime) {
                this.regenerate();
            }
        }

        // Update particles
        this.updateParticles(deltaTime);
    }

    regenerate() {
        this.destroyed = false;
        this.currentDurability = this.maxDurability;
        this.crackLevel = 0;
        this.damaged = false;
        this.regenerateTimer = 0;
        this.createRegenerationEffect();
    }

    createRegenerationEffect() {
        // Create swirling particles for regeneration
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const radius = 30;

            this.particles.push({
                x: this.x + this.width / 2 + Math.cos(angle) * radius,
                y: this.y + this.height / 2 + Math.sin(angle) * radius,
                vx: -Math.cos(angle) * 2,
                vy: -Math.sin(angle) * 2,
                size: 4,
                life: 1,
                color: '#32CD32',
                swirl: true
            });
        }
    }

    draw(ctx) {
        if (this.destroyed && this.type !== 'regenerating') return;

        // Draw particles first (behind brick)
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        if (this.destroyed) return;

        // Calculate opacity based on durability
        const opacity = 0.5 + (this.currentDurability / this.maxDurability) * 0.5;

        // Draw 3D brick effect
        this.draw3DBrick(ctx, opacity);

        // Draw durability indicator
        this.drawDurabilityIndicator(ctx);

        // Draw cracks based on damage
        if (this.crackLevel > 0) {
            this.drawCracks(ctx);
        }

        // Draw special effects
        if (this.special) {
            this.drawSpecialEffects(ctx);
        }
    }

    draw3DBrick(ctx, opacity) {
        // Draw shadow
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x + 4, this.y + 4, this.width, this.height);

        // Draw main brick face with gradient for 3D effect
        const faceGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);

        if (this.type === 'gold') {
            faceGradient.addColorStop(0, this.adjustColorBrightness(this.baseColor, 40, opacity));
            faceGradient.addColorStop(0.5, this.baseColor);
            faceGradient.addColorStop(1, this.adjustColorBrightness(this.baseColor, -30, opacity));
        } else if (this.type === 'metal') {
            faceGradient.addColorStop(0, this.adjustColorBrightness(this.baseColor, 60, opacity));
            faceGradient.addColorStop(0.3, this.baseColor);
            faceGradient.addColorStop(0.7, this.adjustColorBrightness(this.baseColor, -20, opacity));
            faceGradient.addColorStop(1, this.adjustColorBrightness(this.baseColor, -40, opacity));
        } else if (this.type === 'diamond') {
            faceGradient.addColorStop(0, this.adjustColorBrightness(this.baseColor, 50, opacity));
            faceGradient.addColorStop(0.5, this.baseColor);
            faceGradient.addColorStop(1, this.adjustColorBrightness(this.baseColor, -30, opacity));
        } else {
            faceGradient.addColorStop(0, this.adjustColorBrightness(this.baseColor, 30, opacity));
            faceGradient.addColorStop(0.5, this.baseColor);
            faceGradient.addColorStop(1, this.adjustColorBrightness(this.baseColor, -25, opacity));
        }

        ctx.fillStyle = faceGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw top edge for 3D effect
        const topGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + 8);
        topGradient.addColorStop(0, this.adjustColorBrightness(this.baseColor, 70, opacity));
        topGradient.addColorStop(1, this.adjustColorBrightness(this.baseColor, 20, opacity));

        ctx.fillStyle = topGradient;
        ctx.fillRect(this.x, this.y, this.width, 8);

        // Draw left edge for 3D effect
        const leftGradient = ctx.createLinearGradient(this.x, this.y, this.x + 8, this.y);
        leftGradient.addColorStop(0, this.adjustColorBrightness(this.baseColor, 50, opacity));
        leftGradient.addColorStop(1, this.adjustColorBrightness(this.baseColor, 10, opacity));

        ctx.fillStyle = leftGradient;
        ctx.fillRect(this.x, this.y, 8, this.height);

        // Draw bottom edge for depth
        ctx.fillStyle = this.adjustColorBrightness(this.baseColor, -40, opacity);
        ctx.fillRect(this.x, this.y + this.height - 4, this.width, 4);

        // Draw right edge for depth
        ctx.fillStyle = this.adjustColorBrightness(this.baseColor, -30, opacity);
        ctx.fillRect(this.x + this.width - 4, this.y, 4, this.height);

        // Draw border
        ctx.strokeStyle = this.adjustColorBrightness(this.baseColor, -50, opacity);
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.restore();
    }

    drawDurabilityIndicator(ctx) {
        if (this.maxDurability <= 1 && this.durabilityBonus <= 0) return; // No indicator for basic 1-hit bricks

        ctx.save();
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Draw durability number with bonus indication
        let displayText = this.currentDurability.toString();
        if (this.durabilityBonus > 0) {
            displayText = `${this.currentDurability}+${this.durabilityBonus}`;
        }

        // Background for number - larger for bonus bricks
        const bgSize = this.durabilityBonus > 0 ? 20 : 16;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(centerX - bgSize/2, centerY - bgSize/2, bgSize, bgSize);

        // Number color based on remaining durability and bonus
        let color;
        if (this.durabilityBonus > 0) {
            // Gold for bonus durability bricks
            color = '#FFD700';
        } else if (this.currentDurability === this.maxDurability) {
            color = '#FFFFFF'; // White for full health
        } else if (this.currentDurability > this.maxDurability / 2) {
            color = '#FFFF00'; // Yellow for damaged
        } else {
            color = '#FF0000'; // Red for critical
        }

        // Enhanced text rendering for bonus bricks
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = this.durabilityBonus > 0 ? 3 : 2;
        ctx.font = this.durabilityBonus > 0 ? 'bold 14px Arial' : 'bold 12px Arial';

        ctx.strokeText(displayText, centerX, centerY);
        ctx.fillText(displayText, centerX, centerY);

        // Draw bonus indicator
        if (this.durabilityBonus > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '10px Arial';
            ctx.fillText('★', centerX + 12, centerY - 12);
        }

        ctx.restore();
    }

    adjustColorBrightness(color, amount, opacity = 1) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) + amount;
        let g = ((num >> 8) & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        g = g > 255 ? 255 : g < 0 ? 0 : g;
        b = b > 255 ? 255 : b < 0 ? 0 : b;

        const result = (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
        return opacity < 1 ? result + Math.floor(opacity * 255).toString(16).padStart(2, '0') : result;
    }

    drawJunglePattern(ctx, opacity) {
        ctx.save();
        ctx.globalAlpha = opacity * 0.3;

        // Draw tribal/leaf patterns
        ctx.strokeStyle = this.adjustBrightness(this.baseColor, -30, 1);
        ctx.lineWidth = 1;

        // Simple leaf pattern
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Draw leaf veins
        ctx.beginPath();
        ctx.moveTo(centerX, this.y + 5);
        ctx.lineTo(centerX, this.y + this.height - 5);
        ctx.moveTo(this.x + 5, centerY);
        ctx.lineTo(this.x + this.width - 5, centerY);
        ctx.stroke();

        // Draw decorative tribal marks
        const markSize = 4;
        ctx.fillStyle = this.adjustBrightness(this.baseColor, -40, opacity);

        // Corner decorations
        [
            [this.x + markSize, this.y + markSize],
            [this.x + this.width - markSize, this.y + markSize],
            [this.x + markSize, this.y + this.height - markSize],
            [this.x + this.width - markSize, this.y + this.height - markSize]
        ].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - markSize/2, y);
            ctx.lineTo(x, y - markSize/2);
            ctx.closePath();
            ctx.fill();
        });

        ctx.restore();
    }

    drawCracks(ctx) {
        ctx.save();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;

        const crackPatterns = [
            // Crack level 1
            () => {
                ctx.beginPath();
                ctx.moveTo(this.x + this.width * 0.3, this.y);
                ctx.lineTo(this.x + this.width * 0.4, this.y + this.height);
                ctx.stroke();
            },
            // Crack level 2
            () => {
                ctx.beginPath();
                ctx.moveTo(this.x + this.width * 0.2, this.y);
                ctx.lineTo(this.x + this.width * 0.3, this.y + this.height);
                ctx.moveTo(this.x + this.width * 0.7, this.y);
                ctx.lineTo(this.x + this.width * 0.6, this.y + this.height);
                ctx.stroke();
            },
            // Crack level 3
            () => {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.height * 0.5);
                ctx.lineTo(this.x + this.width, this.y + this.height * 0.5);
                ctx.moveTo(this.x + this.width * 0.3, this.y);
                ctx.lineTo(this.x + this.width * 0.7, this.y + this.height);
                ctx.moveTo(this.x + this.width * 0.7, this.y);
                ctx.lineTo(this.x + this.width * 0.3, this.y + this.height);
                ctx.stroke();
            }
        ];

        // Draw cracks based on crack level
        for (let i = 0; i < this.crackLevel && i < crackPatterns.length; i++) {
            crackPatterns[i]();
        }

        ctx.restore();
    }

    drawSpecialEffects(ctx) {
        ctx.save();

        if (this.type === 'explosive') {
            // Enhanced pulsing red glow with warning effect
            const pulseIntensity = Math.sin(this.pulsePhase * 1.5) * 0.4 + 0.6;
            ctx.shadowColor = '#FF4500';
            ctx.shadowBlur = 15 * pulseIntensity;

            // Draw warning border
            ctx.strokeStyle = '#FF6347';
            ctx.lineWidth = 3;
            ctx.globalAlpha = pulseIntensity;
            ctx.strokeRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);

            // Inner glow
            ctx.fillStyle = `rgba(255, 69, 0, ${pulseIntensity * 0.4})`;
            ctx.fillRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);

        } else if (this.type === 'regenerating') {
            // Enhanced regeneration indicator with multiple effects
            if (this.regenerateTimer > 0) {
                const progress = this.regenerateTimer / this.regenerateTime;

                // Pulsing green border
                const pulseIntensity = Math.sin(this.pulsePhase * 2) * 0.3 + 0.7;
                ctx.strokeStyle = '#32CD32';
                ctx.lineWidth = 2;
                ctx.globalAlpha = pulseIntensity;
                ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

                // Regeneration progress bar
                ctx.fillStyle = `rgba(50, 205, 50, ${progress * 0.7})`;
                ctx.fillRect(this.x, this.y - 5, this.width * progress, 3);

                // Life particles
                for (let i = 0; i < 2; i++) {
                    const particleX = this.x + this.width * (0.25 + i * 0.5);
                    const particleY = this.y - 8 + Math.sin(this.pulsePhase + i * Math.PI) * 3;

                    ctx.fillStyle = '#90EE90';
                    ctx.globalAlpha = pulseIntensity;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

        } else if (this.type === 'diamond' && this.sparkle) {
            // Enhanced sparkle effect with rainbow colors
            const sparkleIntensity = Math.sin(this.pulsePhase * 2) * 0.6 + 0.4;
            ctx.shadowColor = '#E0FFFF';
            ctx.shadowBlur = 20 * sparkleIntensity;

            // Rainbow sparkle colors
            const sparkleColors = ['#FFFFFF', '#E0FFFF', '#B0E0E6', '#ADD8E6', '#87CEEB'];

            // Draw multiple sparkles
            for (let i = 0; i < 4; i++) {
                const sparkleX = this.x + (this.width / 5) * (i + 1);
                const sparkleY = this.y + this.height / 2 + Math.sin(this.pulsePhase * 1.5 + i * 0.5) * 6;

                ctx.fillStyle = sparkleColors[i % sparkleColors.length];
                ctx.globalAlpha = sparkleIntensity;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Special diamond border
            ctx.strokeStyle = '#E0FFFF';
            ctx.lineWidth = 2;
            ctx.globalAlpha = sparkleIntensity * 0.8;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }

        // Extra glow for high durability bricks
        if (this.durabilityBonus > 0) {
            const bonusIntensity = Math.sin(this.pulsePhase * 0.8) * 0.2 + 0.3;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 8 * bonusIntensity;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1;
            ctx.globalAlpha = bonusIntensity;
            ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        }

        ctx.restore();
    }

    adjustBrightness(color, amount, opacity = 1) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) + amount;
        let g = ((num >> 8) & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        g = g > 255 ? 255 : g < 0 ? 0 : g;
        b = b > 255 ? 255 : b < 0 ? 0 : b;

        const result = (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
        return opacity < 1 ? result + Math.floor(opacity * 255).toString(16).padStart(2, '0') : result;
    }

    getBorderColor(opacity) {
        if (this.type === 'gold') {
            return `rgba(184, 134, 11, ${opacity})`;
        } else if (this.type === 'metal') {
            return `rgba(169, 169, 169, ${opacity})`;
        } else if (this.type === 'diamond') {
            return `rgba(100, 149, 237, ${opacity})`;
        } else {
            return this.adjustBrightness(this.baseColor, -50, opacity);
        }
    }

    getPoints() {
        return this.points;
    }

    getType() {
        return this.type;
    }

    isSpecial() {
        return this.special;
    }
}
