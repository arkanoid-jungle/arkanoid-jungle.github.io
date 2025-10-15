export class LevelDesign {
    static generateLevel(levelNumber) {
        const configs = {
            1: this.tutorialLevel(),
            2: this.mixedBricks(),
            3: this.movingTargets(),
            4: this.fortressPattern(),
            5: this.bossLevel(),
            6: this.proceduralLevel1(),
            7: this.proceduralLevel2(),
            8: this.proceduralLevel3(),
            9: this.proceduralLevel4(),
            10: this.finalChallenge()
        };

        return configs[levelNumber] || this.proceduralLevel(levelNumber);
    }

    static tutorialLevel() {
        return {
            rows: 6,
            columns: 10,
            brickPattern: 'solid',
            brickTypes: ['standard'],
            maxPresents: 3,
            presentSpawnRate: 0.30,
            ballSpeed: 3.0,
            difficulty: 'beginner',
            description: 'Learn the basics with simple bricks and helpful presents',
            specialFeatures: [],
            backgroundColor: '#1a4d2e',
            themeColor: '#90ee90'
        };
    }

    static mixedBricks() {
        return {
            rows: 7,
            columns: 10,
            brickPattern: 'checkerboard',
            brickTypes: ['standard', 'metal'],
            maxPresents: 5,
            presentSpawnRate: 0.25,
            ballSpeed: 4.0,
            difficulty: 'easy',
            description: 'Mixed brick types introduce strategy',
            specialFeatures: [],
            backgroundColor: '#2d5a2d',
            themeColor: '#32cd32'
        };
    }

    static movingTargets() {
        return {
            rows: 8,
            columns: 10,
            brickPattern: 'moving_rows',
            brickTypes: ['standard', 'metal', 'gold', 'regenerating'],
            maxPresents: 7,
            presentSpawnRate: 0.20,
            ballSpeed: 5.0,
            difficulty: 'medium',
            description: 'Moving rows and regenerating bricks challenge your skills',
            specialFeatures: ['row_movement', 'regenerating_bricks'],
            backgroundColor: '#4d7c4d',
            themeColor: '#228b22'
        };
    }

    static fortressPattern() {
        return {
            rows: 9,
            columns: 10,
            brickPattern: 'fortress',
            brickTypes: ['metal', 'gold', 'explosive'],
            maxPresents: 9,
            presentSpawnRate: 0.15,
            ballSpeed: 6.0,
            difficulty: 'hard',
            description: 'Fortress layout with explosive chain reactions',
            specialFeatures: ['explosive_chains', 'reinforced_corners'],
            backgroundColor: '#5d8a5d',
            themeColor: '#ff6347'
        };
    }

    static bossLevel() {
        return {
            rows: 10,
            columns: 12,
            brickPattern: 'boss_fortress',
            brickTypes: ['gold', 'explosive', 'regenerating', 'diamond'],
            maxPresents: 11,
            presentSpawnRate: 0.20,
            ballSpeed: 7.0,
            difficulty: 'extreme',
            description: 'Boss level with diamond core and multiple phases',
            specialFeatures: ['boss_brick', 'multi_phase', 'time_pressure'],
            backgroundColor: '#6d4c4d',
            themeColor: '#ffd700'
        };
    }

    static proceduralLevel1() {
        // Level 6: First procedural level
        const baseLevel = 1;
        return {
            rows: Math.min(10 + baseLevel, 15),
            columns: Math.min(12 + Math.floor(baseLevel / 2), 16),
            brickPattern: 'procedural_complex',
            brickTypes: ['gold', 'explosive', 'regenerating', 'diamond'],
            maxPresents: 3 + 2 * (6 - 1), // Continue +2 presents per level pattern = 13
            presentSpawnRate: Math.max(0.10, 0.20 - (baseLevel * 0.02)),
            ballSpeed: Math.min(7.0 + (baseLevel * 0.5), 12.0),
            difficulty: 'procedural_1',
            description: 'Procedural generation begins with complex patterns',
            specialFeatures: this.generateProceduralFeatures(baseLevel),
            backgroundColor: '#7a6a7a',
            themeColor: '#b19cd9'
        };
    }

    static proceduralLevel2() {
        // Level 7: Time pressure introduction
        const baseLevel = 2;
        return {
            rows: Math.min(10 + baseLevel, 15),
            columns: Math.min(12 + Math.floor(baseLevel / 2), 16),
            brickPattern: 'procedural_complex',
            brickTypes: ['gold', 'explosive', 'regenerating', 'diamond'],
            maxPresents: 3 + 2 * (7 - 1), // 15 presents
            presentSpawnRate: Math.max(0.10, 0.20 - (baseLevel * 0.02)),
            ballSpeed: Math.min(7.0 + (baseLevel * 0.5), 12.0),
            difficulty: 'procedural_2',
            description: 'Time pressure mechanics and faster regeneration',
            specialFeatures: this.generateProceduralFeatures(baseLevel),
            backgroundColor: '#8a7a8a',
            themeColor: '#da70d6'
        };
    }

    static proceduralLevel3() {
        // Level 8: Gravity zones and complex patterns
        const baseLevel = 3;
        return {
            rows: Math.min(10 + baseLevel, 15),
            columns: Math.min(12 + Math.floor(baseLevel / 2), 16),
            brickPattern: 'procedural_complex',
            brickTypes: ['gold', 'explosive', 'regenerating', 'diamond'],
            maxPresents: 3 + 2 * (8 - 1), // 17 presents
            presentSpawnRate: Math.max(0.10, 0.20 - (baseLevel * 0.02)),
            ballSpeed: Math.min(7.0 + (baseLevel * 0.5), 12.0),
            difficulty: 'procedural_3',
            description: 'Gravity zones affect ball physics',
            specialFeatures: this.generateProceduralFeatures(baseLevel),
            backgroundColor: '#9a8a9a',
            themeColor: '#ff69b4'
        };
    }

    static proceduralLevel4() {
        // Level 9: Multi-ball required challenges
        const baseLevel = 4;
        return {
            rows: Math.min(10 + baseLevel, 15),
            columns: Math.min(12 + Math.floor(baseLevel / 2), 16),
            brickPattern: 'procedural_complex',
            brickTypes: ['gold', 'explosive', 'regenerating', 'diamond'],
            maxPresents: 3 + 2 * (9 - 1), // 19 presents
            presentSpawnRate: Math.max(0.10, 0.20 - (baseLevel * 0.02)),
            ballSpeed: Math.min(7.0 + (baseLevel * 0.5), 12.0),
            difficulty: 'procedural_4',
            description: 'Strategic multi-ball challenges',
            specialFeatures: this.generateProceduralFeatures(baseLevel),
            backgroundColor: '#aa9aaa',
            themeColor: '#ff1493'
        };
    }

    static finalChallenge() {
        // Level 10: Ultimate challenge
        const baseLevel = 5;
        return {
            rows: 15,
            columns: 16,
            brickPattern: 'ultimate_fortress',
            brickTypes: ['gold', 'explosive', 'regenerating', 'diamond'],
            maxPresents: 3 + 2 * (10 - 1), // 21 presents
            presentSpawnRate: 0.12,
            ballSpeed: 12.0,
            difficulty: 'ultimate',
            description: 'The ultimate challenge with all mechanics combined',
            specialFeatures: [
                'complex_patterns',
                'variable_brick_health',
                'time_bombs',
                'gravity_zones',
                'multi_ball_required',
                'boss_brick',
                'explosive_chains',
                'regenerating_waves'
            ],
            backgroundColor: '#4a0e0e',
            themeColor: '#ff0000'
        };
    }

    static proceduralLevel(levelNumber) {
        // For levels beyond 10, continue the progression pattern
        const baseLevel = levelNumber - 5;
        return {
            rows: Math.min(15 + Math.floor(baseLevel / 2), 20),
            columns: Math.min(16 + Math.floor(baseLevel / 3), 20),
            brickPattern: 'procedural_extreme',
            brickTypes: ['gold', 'explosive', 'regenerating', 'diamond'],
            maxPresents: 3 + 2 * (levelNumber - 1), // Continue +2 presents per level
            presentSpawnRate: Math.max(0.05, 0.15 - (baseLevel * 0.01)),
            ballSpeed: Math.min(12.0 + (baseLevel * 0.3), 15.0),
            difficulty: 'endless',
            description: `Endless challenge level ${levelNumber}`,
            specialFeatures: this.generateProceduralFeatures(baseLevel),
            backgroundColor: this.getEndlessBackgroundColor(levelNumber),
            themeColor: this.getEndlessThemeColor(levelNumber)
        };
    }

    static generateProceduralFeatures(baseLevel) {
        const features = ['complex_patterns', 'variable_brick_health'];

        if (baseLevel >= 1) features.push('time_bombs');
        if (baseLevel >= 2) features.push('gravity_zones');
        if (baseLevel >= 3) features.push('multi_ball_required');
        if (baseLevel >= 4) features.push('boss_brick');
        if (baseLevel >= 5) features.push('chaos_mode');

        return features;
    }

    static getEndlessBackgroundColor(levelNumber) {
        const colors = [
            '#2c1810', '#1a1a2e', '#16213e', '#0f3460', '#533483',
            '#3d1e6d', '#2e1065', '#1e0342', '#0a0318', '#1a0033'
        ];
        return colors[(levelNumber - 11) % colors.length];
    }

    static getEndlessThemeColor(levelNumber) {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
            '#dfe6e9', '#a29bfe', '#fd79a8', '#fdcb6e', '#6c5ce7'
        ];
        return colors[(levelNumber - 11) % colors.length];
    }

    // Helper methods for level validation and balancing
    static validateLevelConfig(config) {
        const errors = [];

        // Check required fields
        const requiredFields = ['rows', 'columns', 'brickPattern', 'brickTypes', 'ballSpeed'];
        requiredFields.forEach(field => {
            if (config[field] === undefined) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Validate dimensions
        if (config.rows && (config.rows < 1 || config.rows > 20)) {
            errors.push('Rows must be between 1 and 20');
        }
        if (config.columns && (config.columns < 1 || config.columns > 20)) {
            errors.push('Columns must be between 1 and 20');
        }

        // Validate ball speed
        if (config.ballSpeed && (config.ballSpeed < 1 || config.ballSpeed > 20)) {
            errors.push('Ball speed must be between 1 and 20');
        }

        // Validate present spawn rate
        if (config.presentSpawnRate && (config.presentSpawnRate < 0 || config.presentSpawnRate > 1)) {
            errors.push('Present spawn rate must be between 0 and 1');
        }

        // Validate max presents
        if (config.maxPresents && (config.maxPresents < 0 || config.maxPresents > 50)) {
            errors.push('Max presents must be between 0 and 50');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    static calculateLevelDifficulty(config) {
        let difficultyScore = 0;

        // Ball speed contribution (0-30 points)
        difficultyScore += Math.min(config.ballSpeed * 3, 30);

        // Number of bricks (0-20 points)
        const brickCount = (config.rows || 0) * (config.columns || 0);
        difficultyScore += Math.min(brickCount / 5, 20);

        // Brick types complexity (0-20 points)
        if (config.brickTypes) {
            const typeComplexity = {
                'standard': 1,
                'metal': 2,
                'gold': 3,
                'explosive': 4,
                'regenerating': 4,
                'diamond': 5
            };

            const maxComplexity = Math.max(...config.brickTypes.map(type =>
                typeComplexity[type] || 1));
            difficultyScore += maxComplexity * 4;
        }

        // Special features (0-30 points)
        if (config.specialFeatures) {
            difficultyScore += config.specialFeatures.length * 5;
        }

        // Present spawn rate (lower is harder, 0-10 points)
        if (config.presentSpawnRate !== undefined) {
            difficultyScore += (1 - config.presentSpawnRate) * 10;
        }

        return {
            score: Math.round(difficultyScore),
            category: this.getDifficultyCategory(difficultyScore)
        };
    }

    static getDifficultyCategory(score) {
        if (score < 20) return 'tutorial';
        if (score < 40) return 'easy';
        if (score < 60) return 'medium';
        if (score < 80) return 'hard';
        if (score < 90) return 'extreme';
        return 'ultimate';
    }

    // Get level progression statistics
    static getProgressionStats() {
        return {
            totalLevels: 10,
            presentProgression: [3, 5, 7, 9, 11, 13, 15, 17, 19, 21],
            speedProgression: [3.0, 4.0, 5.0, 6.0, 7.0, 7.5, 8.0, 8.5, 9.0, 12.0],
            spawnRateProgression: [0.30, 0.25, 0.20, 0.15, 0.20, 0.18, 0.16, 0.14, 0.13, 0.12],
            difficultyCategories: [
                'beginner', 'easy', 'medium', 'hard', 'extreme',
                'procedural_1', 'procedural_2', 'procedural_3', 'procedural_4', 'ultimate'
            ]
        };
    }

    // Get level-specific tips
    static getLevelTip(levelNumber) {
        const tips = {
            1: "Focus on catching presents - they're very helpful in this tutorial level!",
            2: "Metal bricks take 2 hits to destroy. Plan your shots accordingly!",
            3: "Regenerating bricks will come back after 10 seconds. Destroy them quickly!",
            4: "Explosive bricks create chain reactions. Use them strategically!",
            5: "The diamond boss brick takes 4 hits. Aim carefully and use power-ups!",
            6: "Procedural levels introduce complex patterns. Study the layout before shooting!",
            7: "Time pressure means regenerating bricks respawn faster. Stay focused!",
            8: "Gravity zones will affect ball movement. Adapt your strategy!",
            9: "Some layouts require multi-ball to complete efficiently. Don't miss those presents!",
            10: "The ultimate challenge combines all mechanics. Use everything you've learned!"
        };

        return tips[levelNumber] || "Each level gets progressively more challenging. Good luck!";
    }
}