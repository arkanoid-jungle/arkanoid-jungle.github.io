/**
 * ActiveBonusUI - Visual system for displaying active power-ups
 * with countdown timers and animations
 */
export class ActiveBonusUI {
    constructor(canvas, presentSystem) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.presentSystem = presentSystem;

        // UI Configuration
        this.config = {
            iconSize: 48,
            spacing: 10,
            padding: 8,
            borderWidth: 3,
            yPosition: 20
        };

        // Active bonus management
        this.activeBonuses = new Map();
        this.bonusOrder = []; // Track activation order

        // Animation properties
        this.animationFrame = null;
        this.pulseAnimations = new Map();

        // Event system integration
        this.eventListeners = [];
        this.setupEventListeners();
    }

    /**
     * Setup event listeners to track PresentSystem changes
     */
    setupEventListeners() {
        // Listen for PresentSystem effect changes
        if (this.presentSystem) {
            // Override PresentSystem methods to emit events
            this.wrapPresentSystemMethods();
        }
    }

    /**
     * Wrap PresentSystem methods to track effect changes
     */
    wrapPresentSystemMethods() {
        const originalApplyEffect = this.presentSystem.applyEffect.bind(this.presentSystem);
        this.presentSystem.applyEffect = (present, paddle, balls) => {
            const result = originalApplyEffect(present, paddle, balls);
            this.onEffectActivated(present.getEffect(), present.config);
            return result;
        };

        // Monitor timer updates
        const originalUpdateEffectTimers = this.presentSystem.updateEffectTimers.bind(this.presentSystem);
        this.presentSystem.updateEffectTimers = (deltaTime) => {
            originalUpdateEffectTimers(deltaTime);
            this.updateActiveBonuses();
        };
    }

    /**
     * Handle effect activation
     */
    onEffectActivated(effectType, config) {
        const bonusData = this.createBonusData(effectType, config);
        this.activeBonuses.set(effectType, bonusData);

        // Update order if not already present
        if (!this.bonusOrder.includes(effectType)) {
            this.bonusOrder.push(effectType);
        }

        // Start animations
        this.startActivationAnimation(effectType);
    }

    /**
     * Create bonus data object
     */
    createBonusData(effectType, config) {
        const effectData = this.presentSystem.activeEffects[this.getEffectKey(effectType)];
        const duration = effectData?.duration || 0;
        const maxDuration = this.getMaxDuration(effectType);

        return {
            type: effectType,
            emoji: config.emoji,
            color: config.color,
            description: config.description,
            duration: duration,
            maxDuration: maxDuration,
            level: effectData?.level || 1,
            isActive: true,
            animationProgress: 0
        };
    }

    /**
     * Map effect types to PresentSystem keys
     */
    getEffectKey(effectType) {
        const keyMap = {
            'spawnBalls': 'powerShot', // Instant effect
            'expandPaddle': 'expandedPaddle',
            'slowBall': 'slowBall',
            'powerShot': 'powerShot',
            'addShield': 'shield',
            'addPoints': 'powerShot', // Instant effect
            'energyBoost': 'energyBoost',
            'energyFree': 'energyFree'
        };
        return keyMap[effectType] || effectType;
    }

    /**
     * Get maximum duration for effect type from config
     */
    getMaxDuration(effectType) {
        if (window.PRESENT_TYPES) {
            const presentType = Object.values(window.PRESENT_TYPES).find(type => type.effect === effectType);
            if (presentType && presentType.duration) {
                return presentType.duration;
            }
        }
        
        // Fallback for instant effects or if config not loaded
        const instantEffects = ['powerShot', 'spawnBalls', 'addPoints'];
        return instantEffects.includes(effectType) ? 0 : 15000;
    }

    /**
     * Update active bonuses based on PresentSystem state
     */
    updateActiveBonuses() {
        // Check each bonus type
        this.activeBonuses.forEach((bonus, effectType) => {
            const effectKey = this.getEffectKey(effectType);
            const effectData = this.presentSystem.activeEffects[effectKey];

            if (!effectData || !this.isEffectActive(effectData, effectType)) {
                // Effect expired
                this.deactivateBonus(effectType);
            } else {
                // Update duration
                bonus.duration = effectData.duration || 0;
                bonus.level = effectData.level || 1;

                // Check for critical time (less than 3 seconds)
                if (bonus.duration > 0 && bonus.duration < 3000) {
                    this.startPulseAnimation(effectType);
                }
            }
        });
    }

    /**
     * Check if effect is still active
     */
    isEffectActive(effectData, effectType) {
        if (effectType === 'spawnBalls' || effectType === 'addPoints') {
            return false; // Instant effects
        }

        if (effectType === 'powerShot') {
            return effectData.active;
        }

        if (effectType === 'expandPaddle') {
            return effectData.level > 0 && effectData.duration > 0;
        }

        return effectData.active && effectData.duration > 0;
    }

    /**
     * Deactivate a bonus effect
     */
    deactivateBonus(effectType) {
        const bonus = this.activeBonuses.get(effectType);
        if (bonus) {
            bonus.isActive = false;
            this.startDeactivationAnimation(effectType);
        }
    }

    /**
     * Start activation animation
     */
    startActivationAnimation(effectType) {
        const bonus = this.activeBonuses.get(effectType);
        if (bonus) {
            bonus.animationProgress = 0;
            this.animateBonusActivation(effectType);
        }
    }

    /**
     * Animate bonus activation
     */
    animateBonusActivation(effectType) {
        const bonus = this.activeBonuses.get(effectType);
        if (!bonus || bonus.animationProgress >= 1) return;

        bonus.animationProgress += 0.1;

        if (bonus.animationProgress < 1) {
            requestAnimationFrame(() => this.animateBonusActivation(effectType));
        }
    }

    /**
     * Start pulse animation for critical time
     */
    startPulseAnimation(effectType) {
        if (!this.pulseAnimations.has(effectType)) {
            this.pulseAnimations.set(effectType, {
                startTime: Date.now(),
                intensity: 0
            });
        }
    }

    /**
     * Start deactivation animation
     */
    startDeactivationAnimation(effectType) {
        const bonus = this.activeBonuses.get(effectType);
        if (bonus) {
            const deanimationDuration = 500; // 0.5 seconds
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / deanimationDuration, 1);

                bonus.animationProgress = 1 - progress;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.activeBonuses.delete(effectType);
                    this.bonusOrder = this.bonusOrder.filter(type => type !== effectType);
                    this.pulseAnimations.delete(effectType);
                }
            };

            animate();
        }
    }

    /**
     * Main render method
     */
    render() {
        if (this.activeBonuses.size === 0) return;

        this.ctx.save();

        // Calculate layout
        const layout = this.calculateLayout();

        // Draw background panel
        this.drawBackgroundPanel(layout);

        // Draw active bonuses
        this.bonusOrder.forEach((effectType, index) => {
            const bonus = this.activeBonuses.get(effectType);
            if (bonus && bonus.isActive) {
                const position = this.getIconPosition(index, layout);
                this.drawBonusIcon(bonus, position);
            }
        });

        this.ctx.restore();
    }

    /**
     * Calculate layout dimensions
     */
    calculateLayout() {
        const activeCount = this.bonusOrder.filter(type => {
            const bonus = this.activeBonuses.get(type);
            return bonus && bonus.isActive;
        }).length;

        const totalWidth = activeCount * this.config.iconSize +
                          (activeCount - 1) * this.config.spacing +
                          2 * this.config.padding;

        const startX = (this.canvas.width - totalWidth) / 2;

        return {
            startX,
            width: totalWidth,
            height: this.config.iconSize + 2 * this.config.padding,
            activeCount
        };
    }

    /**
     * Get icon position for given index
     */
    getIconPosition(index, layout) {
        const x = layout.startX + this.config.padding +
                  index * (this.config.iconSize + this.config.spacing);
        const y = this.config.yPosition + this.config.padding;

        return { x, y };
    }

    /**
     * Draw background panel
     */
    drawBackgroundPanel(layout) {
        const { startX, width, height } = layout;
        const y = this.config.yPosition;

        // Semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(startX - 5, y - 5, width + 10, height + 10);

        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(startX - 5, y - 5, width + 10, height + 10);
    }

    /**
     * Draw individual bonus icon
     */
    drawBonusIcon(bonus, position) {
        const { x, y } = position;
        const size = this.config.iconSize;
        const borderWidth = this.config.borderWidth;

        // Apply scale for animation
        const scale = 0.5 + bonus.animationProgress * 0.5;

        this.ctx.save();
        this.ctx.translate(x + size/2, y + size/2);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-size/2, -size/2);

        // Draw countdown border
        this.drawCountdownBorder(bonus, 0, 0, size, borderWidth);

        // Draw emoji (no tinted background)
        this.ctx.font = `${size * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(bonus.emoji, size/2, size/2);

        // Draw level indicator if applicable
        if (bonus.level > 1) {
            this.drawLevelIndicator(bonus, 0, 0, size);
        }

        // Draw countdown text
        if (bonus.duration > 0) {
            this.drawCountdownText(bonus, 0, 0, size);
        }

        // Draw pulse effect if critical
        if (this.pulseAnimations.has(bonus.type)) {
            this.drawPulseEffect(bonus, 0, 0, size);
        }

        this.ctx.restore();
    }

    /**
     * Draw countdown border animation
     */
    drawCountdownBorder(bonus, x, y, size, borderWidth) {
        if (bonus.duration <= 0 || bonus.maxDuration <= 0) return;

        const progress = bonus.duration / bonus.maxDuration;
        const angle = (1 - progress) * Math.PI * 2; // Clockwise from top

        this.ctx.save();
        this.ctx.translate(x + size/2, y + size/2);

        // Background circle (full)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = borderWidth;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        this.ctx.stroke();

        // Progress arc (countdown)
        const gradient = this.ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        if (progress < 0.3) {
            gradient.addColorStop(0, '#FFFF00'); // Yellow when critical
            gradient.addColorStop(1, '#FF8800');
        } else {
            gradient.addColorStop(0, '#00FF00'); // Green when normal
            gradient.addColorStop(1, '#00AA00');
        }

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = borderWidth;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size/2, -Math.PI/2, -Math.PI/2 + angle);
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Draw level indicator
     */
    drawLevelIndicator(bonus, x, y, size) {
        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`×${bonus.level}`, x + size - 2, y + 2);
        this.ctx.restore();
    }

    /**
     * Draw countdown text
     */
    drawCountdownText(bonus, x, y, size) {
        const seconds = Math.ceil(bonus.duration / 1000);

        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(`${seconds}s`, x + size/2, y + size - 2);
        this.ctx.restore();
    }

    /**
     * Draw pulse effect for critical time
     */
    drawPulseEffect(bonus, x, y, size) {
        const pulseData = this.pulseAnimations.get(bonus.type);
        if (!pulseData) return;

        const elapsed = Date.now() - pulseData.startTime;
        const pulseProgress = (Math.sin(elapsed * 0.01) + 1) / 2; // 0 to 1

        this.ctx.save();
        this.ctx.strokeStyle = `rgba(255, 255, 0, ${pulseProgress * 0.5})`;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
        this.ctx.restore();
    }

    /**
     * Reset all active bonuses
     */
    reset() {
        this.activeBonuses.clear();
        this.bonusOrder = [];
        this.pulseAnimations.clear();
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.reset();
        this.eventListeners = [];
    }
}