/**
 * ConfigManager - Centralized configuration management for Jungle Arkanoid
 *
 * This class handles loading, caching, and providing access to game configuration
 * from the level-difficulty.json file with proper fallbacks and validation.
 */
export class ConfigManager {
    constructor() {
        this.config = null;
        this.globalDefaults = null;
        this.currentLevelConfig = null;
        this.difficultyPreset = 'normal';
        this.initialized = false;
        this.loadingPromise = null;
        this.cache = new Map();
        this.lastLoadTime = 0;
        this.cacheTimeout = 300000; // 5 minutes cache timeout
    }

    /**
     * Initialize the configuration manager
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        // If already loading, return the existing promise
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this.loadConfig();
        return this.loadingPromise;
    }

    /**
     * Load configuration from JSON file
     * @returns {Promise<void>}
     */
    async loadConfig() {
        try {
            const currentTime = Date.now();

            // Check if we have cached config that's still valid
            if (this.config && (currentTime - this.lastLoadTime) < this.cacheTimeout) {
                this.initialized = true;
                return;
            }

            const response = await fetch('./config/level-difficulty.json');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.config = await response.json();
            this.globalDefaults = this.config.global?.defaults || {};
            this.lastLoadTime = currentTime;
            this.initialized = true;

            console.log('Configuration loaded successfully');
            console.log(`Loaded ${Object.keys(this.config.levels || {}).length} level configurations`);

        } catch (error) {
            console.error('Failed to load configuration:', error);
            console.warn('Using hardcoded fallback values');

            // Use minimal fallback configuration
            this.config = this.getFallbackConfig();
            this.globalDefaults = this.config.global?.defaults || {};
            this.initialized = true;
        } finally {
            this.loadingPromise = null;
        }
    }

    /**
     * Get fallback configuration when config file is not available
     * @returns {Object} Minimal fallback configuration
     */
    getFallbackConfig() {
        return {
            global: {
                defaults: {
                    presentSystem: {
                        spawnDelay: 800,
                        maxPresentsBase: 3,
                        maxPresentsIncrement: 2,
                        presentCountModifier: 0.05,
                        minimumSpawnChance: 0.05,
                        durationRefreshEnabled: true
                    },
                    brickSystem: {
                        width: 75,
                        height: 25,
                        padding: 4,
                        durabilityBonusChance: 0.3,
                        maxDurabilityBonus: 2,
                        levelBonusMultiplier: 1,
                        specialBrickBonusMultiplier: 50
                    },
                    energySystem: {
                        baseConsumptionRate: 0.08,
                        maxRecoveryRate: 0.12,
                        recoveryCurveSteepness: 4,
                        speedPenaltyThreshold: 0.30,
                        speedPenaltyAmount: 0.50,
                        consumptionReductionThreshold: 0.70,
                        tiredConsumptionPenalty: 0.15,
                        highEnergyEfficiency: 0.35
                    },
                    gameBalance: {
                        baseBallSpeed: 4.0,
                        ballSpeedIncrement: 0.5,
                        maxBallSpeed: 15.0,
                        paddleBaseWidth: 120,
                        paddleMaxWidth: 240,
                        paddleExpansionFactor: 1.4,
                        maxExpansions: 2,
                        baseLives: 3,
                        scoreMultiplier: 1.0
                    }
                }
            },
            levels: {
                "1": {
                    name: "Tutorial",
                    difficulty: "beginner",
                    presentSystem: {
                        spawnProbability: 0.30,
                        maxPresents: 3,
                        rarityModifiers: {
                            MULTI_BALL: 1.2,
                            EXPAND_PADDLE: 1.5,
                            SLOW_BALL: 1.3,
                            SHIELD: 1.1,
                            ENERGY_BOOST: 1.2,
                            ENERGY_FREE: 1.1
                        }
                    },
                    gameBalance: {
                        ballSpeed: 3.0,
                        scoreMultiplier: 1.0
                    }
                }
            }
        };
    }

    /**
     * Check if configuration manager is initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Set difficulty preset
     * @param {string} preset - Difficulty preset name
     */
    setDifficultyPreset(preset) {
        if (this.config?.difficultyPresets?.[preset]) {
            this.difficultyPreset = preset;
            this.clearCache();
            console.log(`Difficulty preset set to: ${preset}`);
        } else {
            console.warn(`Unknown difficulty preset: ${preset}`);
        }
    }

    /**
     * Get current difficulty preset
     * @returns {string}
     */
    getDifficultyPreset() {
        return this.difficultyPreset;
    }

    /**
     * Get configuration for a specific level
     * @param {number} levelNumber - Level number
     * @param {string} section - Configuration section (optional)
     * @returns {*} Configuration value or object
     */
    getLevelConfig(levelNumber, section = null) {
        if (!this.initialized) {
            console.warn('ConfigManager not initialized, returning null');
            return null;
        }

        const cacheKey = `level_${levelNumber}_${section || 'full'}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const levelKey = levelNumber.toString();
        let levelConfig = this.config.levels?.[levelKey];

        // If level doesn't exist, try to generate it using procedural template
        if (!levelConfig && levelNumber > 10) {
            levelConfig = this.generateProceduralLevel(levelNumber);
        }

        // If still no config, use level 1 as fallback
        if (!levelConfig) {
            console.warn(`Level ${levelNumber} configuration not found, using level 1 as fallback`);
            levelConfig = this.config.levels?.["1"] || {};
        }

        // Apply difficulty preset modifiers
        const modifiedConfig = this.applyDifficultyModifiers(levelConfig);

        // Get specific section if requested
        const result = section ? modifiedConfig[section] : modifiedConfig;

        // Cache the result
        this.cache.set(cacheKey, result);

        return result;
    }

    /**
     * Get global default configuration
     * @param {string} section - Configuration section (optional)
     * @returns {*} Configuration value or object
     */
    getGlobalDefaults(section = null) {
        if (!this.initialized) {
            console.warn('ConfigManager not initialized, returning null');
            return null;
        }

        const cacheKey = `global_${section || 'full'}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const result = section ? this.globalDefaults[section] : this.globalDefaults;

        // Cache the result
        this.cache.set(cacheKey, result);

        return result;
    }

    /**
     * Apply difficulty preset modifiers to configuration
     * @param {Object} config - Base configuration
     * @returns {Object} Modified configuration
     */
    applyDifficultyModifiers(config) {
        const preset = this.config.difficultyPresets?.[this.difficultyPreset];
        if (!preset) {
            return config;
        }

        const modifiers = preset.modifiers;
        const modifiedConfig = JSON.parse(JSON.stringify(config)); // Deep clone

        // Apply game balance modifiers
        if (modifiedConfig.gameBalance && modifiers) {
            if (modifiers.ballSpeedMultiplier) {
                modifiedConfig.gameBalance.ballSpeed = (modifiedConfig.gameBalance.ballSpeed || 1) * modifiers.ballSpeedMultiplier;
            }
            if (modifiers.scoreMultiplier) {
                modifiedConfig.gameBalance.scoreMultiplier = (modifiedConfig.gameBalance.scoreMultiplier || 1) * modifiers.scoreMultiplier;
            }
            if (modifiers.extraLives) {
                modifiedConfig.gameBalance.lives = (modifiedConfig.gameBalance.lives || 3) + modifiers.extraLives;
            }
        }

        // Apply present system modifiers
        if (modifiedConfig.presentSystem && modifiers) {
            if (modifiers.presentSpawnRateMultiplier) {
                modifiedConfig.presentSystem.spawnProbability = (modifiedConfig.presentSystem.spawnProbability || 0.1) * modifiers.presentSpawnRateMultiplier;
            }
        }

        // Apply energy system modifiers
        if (modifiedConfig.energySystem && modifiers) {
            if (modifiers.energyConsumptionMultiplier) {
                modifiedConfig.energySystem.consumptionRateMultiplier = (modifiedConfig.energySystem.consumptionRateMultiplier || 1) * modifiers.energyConsumptionMultiplier;
            }
        }

        return modifiedConfig;
    }

    /**
     * Generate procedural level configuration
     * @param {number} levelNumber - Level number
     * @returns {Object} Generated level configuration
     */
    generateProceduralLevel(levelNumber) {
        const template = this.config.proceduralTemplate;
        if (!template) {
            return null;
        }

        const baseLevel = levelNumber - 10;
        const progression = template.progression;

        const generated = {
            name: `Procedural Level ${levelNumber}`,
            difficulty: "procedural_endless",
            description: `Generated level ${levelNumber}`,
            brickSystem: {
                rows: Math.min(progression.rows.base + Math.floor(baseLevel / progression.rows.increment), progression.rows.max),
                columns: Math.min(progression.columns.base + Math.floor(baseLevel / progression.columns.increment), progression.columns.max),
                pattern: "procedural_extreme",
                types: ["gold", "explosive", "regenerating", "diamond"],
                oneShotPercentage: Math.max(progression.oneShotPercentage.base - (baseLevel * progression.oneShotPercentage.decrement), progression.oneShotPercentage.min),
                maxDurability: Math.min(progression.maxDurability.base + Math.floor(baseLevel / progression.maxDurability.increment), progression.maxDurability.max)
            },
            presentSystem: {
                spawnProbability: Math.max(progression.presentSpawnRate.base - (baseLevel * progression.presentSpawnRate.decrement), progression.presentSpawnRate.min),
                maxPresents: Math.min(progression.maxPresents.base + (baseLevel * progression.maxPresents.increment), progression.maxPresents.max),
                rarityModifiers: {
                    MULTI_BALL: 1.2,
                    EXPAND_PADDLE: 0.8,
                    SLOW_BALL: 0.6,
                    SHIELD: 0.8,
                    ENERGY_BOOST: 1.0,
                    ENERGY_FREE: 1.1,
                    POWER_SHOT: 1.5,
                    BONUS_POINTS: 1.5
                }
            },
            energySystem: {
                consumptionRateMultiplier: Math.min(progression.energyConsumptionMultiplier.base + (baseLevel * progression.energyConsumptionMultiplier.increment), progression.energyConsumptionMultiplier.max)
            },
            gameBalance: {
                ballSpeed: Math.min(progression.ballSpeed.base + (baseLevel * progression.ballSpeed.increment), progression.ballSpeed.max),
                scoreMultiplier: Math.min(progression.scoreMultiplier.base + (baseLevel * progression.scoreMultiplier.increment), progression.scoreMultiplier.max)
            },
            visualTheme: {
                backgroundColor: this.getEndlessBackgroundColor(levelNumber),
                themeColor: this.getEndlessThemeColor(levelNumber),
                specialEffects: this.generateProceduralFeatures(baseLevel)
            }
        };

        return generated;
    }

    /**
     * Get background color for endless levels
     * @param {number} levelNumber - Level number
     * @returns {string} Color hex code
     */
    getEndlessBackgroundColor(levelNumber) {
        const colors = [
            '#2c1810', '#1a1a2e', '#16213e', '#0f3460', '#533483',
            '#3d1e6d', '#2e1065', '#1e0342', '#0a0318', '#1a0033'
        ];
        return colors[(levelNumber - 11) % colors.length];
    }

    /**
     * Get theme color for endless levels
     * @param {number} levelNumber - Level number
     * @returns {string} Color hex code
     */
    getEndlessThemeColor(levelNumber) {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
            '#dfe6e9', '#a29bfe', '#fd79a8', '#fdcb6e', '#6c5ce7'
        ];
        return colors[(levelNumber - 11) % colors.length];
    }

    /**
     * Generate procedural features for level
     * @param {number} baseLevel - Base level for procedural generation
     * @returns {Array} Array of special features
     */
    generateProceduralFeatures(baseLevel) {
        const features = ['complex_patterns', 'variable_brick_health'];

        if (baseLevel >= 1) features.push('time_bombs');
        if (baseLevel >= 2) features.push('gravity_zones');
        if (baseLevel >= 3) features.push('multi_ball_required');
        if (baseLevel >= 4) features.push('boss_brick');
        if (baseLevel >= 5) features.push('chaos_mode');

        return features;
    }

    /**
     * Clear configuration cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Validate configuration against constraints
     * @returns {Object} Validation result
     */
    validateConfig() {
        if (!this.config) {
            return { valid: false, errors: ['Configuration not loaded'] };
        }

        const validation = this.config.global?.validation;
        const errors = [];

        if (!validation) {
            return { valid: true, errors: [] };
        }

        // Validate levels
        const levels = this.config.levels || {};
        Object.keys(levels).forEach(levelKey => {
            const level = levels[levelKey];

            if (level.gameBalance?.ballSpeed && level.gameBalance.ballSpeed > validation.maxBallSpeed) {
                errors.push(`Level ${levelKey}: Ball speed exceeds maximum`);
            }

            if (level.presentSystem?.spawnProbability && level.presentSystem.spawnProbability > validation.maxPresentSpawnRate) {
                errors.push(`Level ${levelKey}: Present spawn rate exceeds maximum`);
            }

            if (level.presentSystem?.maxPresents && level.presentSystem.maxPresents > validation.maxPresents) {
                errors.push(`Level ${levelKey}: Max presents exceeds maximum`);
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get configuration statistics
     * @returns {Object} Configuration statistics
     */
    getStats() {
        if (!this.initialized) {
            return { initialized: false };
        }

        return {
            initialized: true,
            totalLevels: Object.keys(this.config.levels || {}).length,
            difficultyPresets: Object.keys(this.config.difficultyPresets || {}).length,
            currentPreset: this.difficultyPreset,
            lastLoadTime: this.lastLoadTime,
            cacheSize: this.cache.size,
            validation: this.validateConfig()
        };
    }

    /**
     * Reload configuration from file
     * @returns {Promise<void>}
     */
    async reloadConfig() {
        this.clearCache();
        this.initialized = false;
        await this.initialize();
    }
}

// Create singleton instance
export const configManager = new ConfigManager();