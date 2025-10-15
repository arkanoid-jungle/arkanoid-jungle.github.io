import { configManager } from './ConfigManager.js';

export class EnergySystem {
    constructor() {
        // Configuration file reference
        this.configFile = null;

        // Initialize configuration loading flag
        this.initialized = false;

        // Energy configuration (will be loaded from config file)
        this.config = {
            maxEnergy: 100,
            currentEnergy: 100,
            baseConsumptionRate: 0.08,
            maxRecoveryRate: 0.12,
            recoveryCurveSteepness: 4,
            speedPenaltyThreshold: 0.30,
            speedPenaltyAmount: 0.50,
            consumptionReductionThreshold: 0.70,
            tiredConsumptionPenalty: 0.15,
            highEnergyEfficiency: 0.35,
            energyBarEnabled: true,
            animationEnabled: true
        };

        // Level configuration
        this.currentLevel = 1;
        this.levelConfig = null;
        this.configManager = configManager;

        // Load configuration asynchronously
        this.initializeConfig();

        // State tracking
        this.isMoving = false;
        this.movementStartTime = 0;
        this.lastUpdateTime = 0;
        this.currentSpeedMultiplier = 1.0;
        this.energyState = 'energized';

        // Debug tracking for wall collisions
        this.debugInfo = {
            lastWallHitTime: 0,
            wallHitCount: 0,
            totalEnergyConsumed: 0,
            totalEnergyRecovered: 0,
            lastMouseBlockTime: 0,
            mouseBlockCount: 0
        };

        // Animation state
        this.particleIntensity = 0;
        this.animationPhase = 0;
        this.warningPulse = 0;

        // Energy history for smoothing
        this.energyHistory = [];
        this.maxHistoryLength = 10;
    }

    async initializeConfig() {
        try {
            await this.configManager.initialize();
            this.updateLevelConfig();

            // Also try to load the legacy energy config for backward compatibility
            await this.loadLegacyConfig();

            this.initialized = true;
            console.log('Energy configuration loaded successfully');
        } catch (error) {
            console.warn('Failed to load energy config:', error);
            this.initialized = true;
        }
    }

    async loadLegacyConfig() {
        try {
            const response = await fetch('./config/energy-config.json');
            if (response.ok) {
                this.configFile = await response.json();
                this.applyConfigFromFile();
            }
        } catch (error) {
            // Ignore legacy config loading errors
        }
    }

    updateLevelConfig() {
        if (this.configManager.isInitialized()) {
            this.levelConfig = this.configManager.getLevelConfig(this.currentLevel, 'energySystem');
            this.applyLevelConfig();
        }
    }

    setLevel(level) {
        this.currentLevel = level;
        this.updateLevelConfig();
    }

    applyLevelConfig() {
        if (this.levelConfig) {
            // Apply level-specific multipliers
            const globalDefaults = this.configManager.getGlobalDefaults('energySystem') || {};

            if (this.levelConfig.consumptionRateMultiplier) {
                this.config.baseConsumptionRate = (globalDefaults.baseConsumptionRate || 0.08) * this.levelConfig.consumptionRateMultiplier;
            }

            if (this.levelConfig.recoveryRateMultiplier) {
                this.config.maxRecoveryRate = (globalDefaults.maxRecoveryRate || 0.12) * this.levelConfig.recoveryRateMultiplier;
            }

            // Apply level-specific thresholds if available
            if (this.levelConfig.thresholds) {
                this.config.speedPenaltyThreshold = this.levelConfig.thresholds.speedPenalty || this.config.speedPenaltyThreshold;
                this.config.consumptionReductionThreshold = this.levelConfig.thresholds.consumptionReduction || this.config.consumptionReductionThreshold;
            }
        }
    }

    isInitialized() {
        return this.initialized;
    }

    applyConfigFromFile() {
        if (!this.configFile || !this.configFile.energySystem) return;

        const config = this.configFile.energySystem;

        // Apply thresholds
        if (config.thresholds) {
            this.config.speedPenaltyThreshold = config.thresholds.speedPenaltyThreshold || this.config.speedPenaltyThreshold;
            this.config.consumptionReductionThreshold = config.thresholds.consumptionReductionThreshold || this.config.consumptionReductionThreshold;
        }

        // Apply penalties
        if (config.penalties) {
            this.config.speedPenaltyAmount = config.penalties.speedPenaltyAmount || this.config.speedPenaltyAmount;
            this.config.tiredConsumptionPenalty = config.penalties.tiredConsumptionPenalty || this.config.tiredConsumptionPenalty;
        }

        // Apply bonuses
        if (config.bonuses) {
            this.config.highEnergyEfficiency = config.bonuses.highEnergyEfficiency || this.config.highEnergyEfficiency;
        }

        // Apply base config
        if (config.baseConfig) {
            this.config.maxEnergy = config.baseConfig.maxEnergy || this.config.maxEnergy;
            this.config.baseConsumptionRate = config.baseConfig.baseConsumptionRate || this.config.baseConsumptionRate;
            this.config.maxRecoveryRate = config.baseConfig.maxRecoveryRate || this.config.maxRecoveryRate;
            this.config.recoveryCurveSteepness = config.baseConfig.recoveryCurveSteepness || this.config.recoveryCurveSteepness;
        }

        // Apply UI settings
        if (config.ui) {
            this.config.energyBarEnabled = config.ui.energyBarEnabled !== undefined ? config.ui.energyBarEnabled : this.config.energyBarEnabled;
            this.config.animationEnabled = config.ui.animationEnabled !== undefined ? config.ui.animationEnabled : this.config.animationEnabled;
        }

        console.log('Energy configuration loaded from file');
    }

    reset() {
        this.config.currentEnergy = this.config.maxEnergy;
        this.isMoving = false;
        this.movementStartTime = 0;
        this.currentSpeedMultiplier = 1.0;
        this.energyState = 'energized';
        this.particleIntensity = 0;
        this.animationPhase = 0;
        this.warningPulse = 0;
        this.energyHistory = [];
        this.resetDebugInfo();
    }

    update(deltaTime, paddleVelocity, mouseInfluence = 0, isHittingWall = false, mouseInputBlocked = false) {
        const currentTime = performance.now();

        // Update energy history for smoothing
        this.updateEnergyHistory();

        // Debug tracking
        if (isHittingWall) {
            this.debugInfo.lastWallHitTime = currentTime;
            this.debugInfo.wallHitCount++;
        }
        if (mouseInputBlocked) {
            this.debugInfo.lastMouseBlockTime = currentTime;
            this.debugInfo.mouseBlockCount++;
        }

        // ABSOLUTE WALL COLLISION PROTECTION
        // This is the critical fix - completely prevent energy consumption during wall collisions
        if (isHittingWall || mouseInputBlocked) {
            // Force recovery mode during any wall collision
            this.isMoving = false;
            this.recoverEnergy(deltaTime);
            this.updateEnergyState();
            this.updateSpeedMultiplier();
            this.updateAnimations(deltaTime);
            return; // Exit immediately - skip all consumption logic
        }

        // Calculate total movement intensity (keyboard + mouse)
        const keyboardMovement = Math.abs(paddleVelocity);
        const mouseMovement = Math.abs(mouseInfluence) * 0.5; // Scale down mouse influence
        let totalMovement = Math.max(keyboardMovement, mouseMovement);

        // Additional safeguard: if paddle has any velocity but is supposed to be stopped
        if (Math.abs(paddleVelocity) > 0.1 && (isHittingWall || mouseInputBlocked)) {
            totalMovement = 0;
        }

        // Determine if paddle is moving
        this.isMoving = totalMovement > 0.1;

        if (this.isMoving) {
            this.consumeEnergy(deltaTime, totalMovement);
            this.movementStartTime = currentTime;
        } else {
            this.recoverEnergy(deltaTime);
        }

        // Update energy state and speed multiplier
        this.updateEnergyState();
        this.updateSpeedMultiplier();

        // Update animations
        this.updateAnimations(deltaTime);
    }

    consumeEnergy(deltaTime, paddleVelocity) {
        // Check for energy free effect
        if (this.game && this.game.presentSystem && this.game.presentSystem.activeEffects.energyFree.active) {
            return; // No energy consumption
        }

        // Calculate consumption based on movement intensity
        const movementIntensity = Math.min(Math.abs(paddleVelocity) / 8, 1); // Normalize to max speed
        let baseConsumption = this.config.baseConsumptionRate * movementIntensity;

        // Check for energy boost effect (40% reduction)
        if (this.game && this.game.presentSystem && this.game.presentSystem.activeEffects.energyBoost.active) {
            baseConsumption *= 0.6; // 40% reduction
        }

        // Apply energy efficiency bonus at threshold or higher
        const energyRatio = this.config.currentEnergy / this.config.maxEnergy;
        let efficiencyMultiplier = 1.0;

        if (energyRatio >= this.config.consumptionReductionThreshold) {
            // Apply high energy efficiency bonus from config
            efficiencyMultiplier = 1.0 - this.config.highEnergyEfficiency;
        }

        // Apply energy penalty if in tired state
        if (energyRatio <= this.config.speedPenaltyThreshold) {
            // Apply tired consumption penalty from config
            efficiencyMultiplier *= (1.0 - this.config.tiredConsumptionPenalty);
        }

        const consumption = baseConsumption * deltaTime * efficiencyMultiplier;
        this.config.currentEnergy = Math.max(0, this.config.currentEnergy - consumption);

        // Debug tracking
        this.debugInfo.totalEnergyConsumed += consumption;
    }

    recoverEnergy(deltaTime) {
        // Logistic recovery curve
        const energyRatio = this.config.currentEnergy / this.config.maxEnergy;
        const recoveryRate = this.config.maxRecoveryRate * Math.pow(1 - energyRatio, this.config.recoveryCurveSteepness);

        const recovery = recoveryRate * deltaTime;
        this.config.currentEnergy = Math.min(this.config.maxEnergy, this.config.currentEnergy + recovery);

        // Debug tracking
        this.debugInfo.totalEnergyRecovered += recovery;
    }

    updateEnergyState() {
        const energyRatio = this.config.currentEnergy / this.config.maxEnergy;

        if (energyRatio <= this.config.speedPenaltyThreshold) { // 30%
            this.energyState = 'tired';
        } else if (energyRatio <= 0.60) { // 31-60%
            this.energyState = 'normal';
        } else if (energyRatio <= this.config.consumptionReductionThreshold) { // 61-70%
            this.energyState = 'energized';
        } else { // Above 70%
            this.energyState = 'peak';
        }
    }

    updateSpeedMultiplier() {
        const energyRatio = this.config.currentEnergy / this.config.maxEnergy;

        if (energyRatio <= this.config.speedPenaltyThreshold) { // 30% or less
            // Apply 50% speed penalty (20% more than before)
            this.currentSpeedMultiplier = this.config.speedPenaltyAmount; // 0.50 (50% slower)
        } else {
            // Smooth transition back to normal speed
            const targetMultiplier = 1.0;
            this.currentSpeedMultiplier += (targetMultiplier - this.currentSpeedMultiplier) * 0.05;
        }
    }

    updateAnimations(deltaTime) {
        this.animationPhase += deltaTime * 0.003; // Slow, steady animation

        const energyRatio = this.config.currentEnergy / this.config.maxEnergy;

        // Particle intensity based on energy level
        if (energyRatio > 0.6) {
            this.particleIntensity = Math.min(1.0, this.particleIntensity + deltaTime * 0.002);
        } else {
            this.particleIntensity = Math.max(0.2, this.particleIntensity - deltaTime * 0.001);
        }

        // Warning pulse when low energy
        if (energyRatio <= 0.15) {
            this.warningPulse = Math.sin(this.animationPhase * 10) * 0.5 + 0.5;
        } else {
            this.warningPulse = Math.max(0, this.warningPulse - deltaTime * 0.003);
        }
    }

    updateEnergyHistory() {
        this.energyHistory.push(this.config.currentEnergy);
        if (this.energyHistory.length > this.maxHistoryLength) {
            this.energyHistory.shift();
        }
    }

    getSmoothedEnergy() {
        if (this.energyHistory.length === 0) return this.config.currentEnergy;

        const sum = this.energyHistory.reduce((acc, val) => acc + val, 0);
        return sum / this.energyHistory.length;
    }

    getSpeedMultiplier() {
        return this.currentSpeedMultiplier;
    }

    getEnergyPercentage() {
        return this.config.currentEnergy / this.config.maxEnergy;
    }

    getEnergyColor() {
        const energyRatio = this.getEnergyPercentage();

        if (energyRatio <= this.config.speedPenaltyThreshold) { // 30% or less - Tired
            return `rgb(255, ${Math.floor(50 + this.warningPulse * 150)}, 50)`; // Red with strong pulsing
        } else if (energyRatio <= 0.60) { // 31-60% - Normal
            return 'rgb(255, 165, 0)'; // Orange
        } else if (energyRatio <= this.config.consumptionReductionThreshold) { // 61-70% - Energized
            return 'rgb(255, 255, 0)'; // Yellow
        } else { // Above 70% - Peak
            return 'rgb(0, 255, 0)'; // Bright green
        }
    }

    getParticleCount() {
        return Math.floor(this.particleIntensity * 5);
    }

    setEnergyBarEnabled(enabled) {
        this.config.energyBarEnabled = enabled;
    }

    setAnimationEnabled(enabled) {
        this.config.animationEnabled = enabled;
    }

    // Get configuration for saving
    getConfig() {
        return {
            energyBarEnabled: this.config.energyBarEnabled,
            animationEnabled: this.config.animationEnabled
        };
    }

    // Load configuration from settings manager
    loadSettingsConfig(config) {
        if (config.energyBarEnabled !== undefined) {
            this.config.energyBarEnabled = config.energyBarEnabled;
        }
        if (config.animationEnabled !== undefined) {
            this.config.animationEnabled = config.animationEnabled;
        }
    }

    // Debug method to get wall collision statistics
    getDebugInfo() {
        return {
            ...this.debugInfo,
            currentEnergy: this.config.currentEnergy,
            energyPercentage: this.getEnergyPercentage(),
            isMoving: this.isMoving,
            energyState: this.energyState,
            lastUpdateTime: performance.now()
        };
    }

    // Enhanced method to check if paddle is in wall collision state
    isInWallCollisionState() {
        const currentTime = performance.now();
        const timeSinceLastWallHit = currentTime - this.debugInfo.lastWallHitTime;
        const timeSinceLastMouseBlock = currentTime - this.debugInfo.lastMouseBlockTime;

        // Consider paddle to be in wall collision state if recently hit wall or mouse was blocked
        const recentWallHit = timeSinceLastWallHit < 100; // Within last 100ms
        const recentMouseBlock = timeSinceLastMouseBlock < 100; // Within last 100ms

        return recentWallHit || recentMouseBlock;
    }

    // Method to get wall collision protection status
    getWallCollisionProtectionStatus() {
        return {
            isProtected: this.isInWallCollisionState(),
            lastWallHitTime: this.debugInfo.lastWallHitTime,
            lastMouseBlockTime: this.debugInfo.lastMouseBlockTime,
            wallHitCount: this.debugInfo.wallHitCount,
            mouseBlockCount: this.debugInfo.mouseBlockCount,
            protectionActive: this.debugInfo.lastWallHitTime > 0 || this.debugInfo.lastMouseBlockTime > 0
        };
    }

    // Debug method to reset statistics
    resetDebugInfo() {
        this.debugInfo = {
            lastWallHitTime: 0,
            wallHitCount: 0,
            totalEnergyConsumed: 0,
            totalEnergyRecovered: 0,
            lastMouseBlockTime: 0,
            mouseBlockCount: 0
        };
    }
}