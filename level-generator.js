#!/usr/bin/env node

/**
 * Level Generator Script for Jungle Arkanoid
 * Generates procedural levels from a single base configuration
 */

const fs = require('fs');
const path = require('path');

// Base level configuration - this will be the only level stored in JSON
const BASE_LEVEL_CONFIG = {
  "name": "Tutorial",
  "difficulty": "beginner",
  "description": "Learn the basics with simple bricks and helpful presents",
  "brickSystem": {
    "rows": 4,
    "columns": 8,
    "pattern": "solid",
    "types": ["standard"],
    "oneShotPercentage": 0.90,
    "maxDurability": 1,
    "durabilityBonusChance": 0.1
  },
  "presentSystem": {
    "spawnProbability": 0.30,
    "maxPresents": 3,
    "rarityModifiers": {
      "MULTI_BALL": 1.2,
      "EXPAND_PADDLE": 1.5,
      "SLOW_BALL": 1.3,
      "SHIELD": 1.1,
      "ENERGY_BOOST": 1.2,
      "ENERGY_FREE": 1.1,
      "POWER_SHOT": 0.5,
      "BONUS_POINTS": 0.8
    },
    "effectDurations": {
      "expandPaddle": 15000,
      "slowBall": 30000,
      "shield": 10000,
      "energyBoost": 20000,
      "energyFree": 15000
    }
  },
  "energySystem": {
    "consumptionRateMultiplier": 0.8,
    "recoveryRateMultiplier": 1.2,
    "thresholds": {
      "speedPenalty": 0.25,
      "consumptionReduction": 0.65
    }
  },
  "gameBalance": {
    "ballSpeed": 3.5,
    "scoreMultiplier": 1.0,
    "lives": 3
  },
  "visualTheme": {
    "backgroundColor": "#1a4d2e",
    "themeColor": "#90ee90",
    "specialEffects": []
  }
};

// Global defaults configuration
const GLOBAL_DEFAULTS = {
  "presentSystem": {
    "spawnDelay": 800,
    "maxPresentsBase": 3,
    "maxPresentsIncrement": 2,
    "presentCountModifier": 0.05,
    "minimumSpawnChance": 0.05,
    "durationRefreshEnabled": true
  },
  "brickSystem": {
    "durabilityBonusChance": 0.3,
    "maxDurabilityBonus": 2,
    "levelBonusMultiplier": 1,
    "specialBrickBonusMultiplier": 50
  },
  "energySystem": {
    "baseConsumptionRate": 0.08,
    "maxRecoveryRate": 0.12,
    "recoveryCurveSteepness": 4,
    "speedPenaltyThreshold": 0.30,
    "speedPenaltyAmount": 0.50,
    "consumptionReductionThreshold": 0.70,
    "tiredConsumptionPenalty": 0.15,
    "highEnergyEfficiency": 0.35
  },
  "gameBalance": {
    "baseBallSpeed": 4.0,
    "ballSpeedIncrement": 0.25,  // Reduced from 0.5 for smoother progression
    "maxBallSpeed": 12.0,        // Reduced from 15.0
    "paddleBaseWidth": 120,
    "paddleMaxWidth": 240,
    "paddleExpansionFactor": 1.4,
    "maxExpansions": 2,
    "baseLives": 3,
    "scoreMultiplier": 1.0
  },
  "visualEffects": {
    "particleIntensityBase": 0.5,
    "particleIntensityMax": 1.0,
    "warningPulseThreshold": 0.15,
    "glowIntensityBase": 0.7,
    "glowIntensityVariation": 0.3
  }
};

// Level progression rules
const PROGRESSION_RULES = {
  // Brick system progression
  bricks: {
    rowIncrement: 1,           // Add 1 row every N levels
    rowIncrementFrequency: 2,  // Every 2 levels
    columnIncrement: 1,        // Add 1 column every N levels
    columnIncrementFrequency: 3, // Every 3 levels
    maxRows: 20,
    maxColumns: 20,

    // Durability progression - mathematical formulas
    maxDurability: 5,                    // Maximum possible durability
    durabilityStartLevel: 3,             // Level when 2-hit bricks first appear
    durabilityIncrement: 7,              // Levels between durability increases
    maxDurabilityBonusChance: 0.6,       // Maximum bonus chance for extra durability
    baseDurabilityBonusChance: 0.1,      // Starting bonus chance

    // Difficulty progression for brick types
    unlockMetalAt: 2,          // Level 2 unlocks metal bricks
    unlockGoldAt: 4,           // Level 4 unlocks gold bricks
    unlockExplosiveAt: 5,      // Level 5 unlocks explosive bricks
    unlockRegeneratingAt: 6,   // Level 6 unlocks regenerating bricks
    unlockDiamondAt: 10        // Level 10 unlocks diamond bricks
  },

  // Game balance progression
  gameBalance: {
    ballSpeedIncrement: 0.15,  // Increment ball speed by this amount
    speedIncrementFrequency: 1, // Every level
    maxBallSpeed: 12.0,

    scoreMultiplierIncrement: 0.05,
    scoreIncrementFrequency: 2, // Every 2 levels

    // Present spawn probability decreases over time
    presentSpawnDecrement: 0.02,
    presentSpawnDecrementFrequency: 3, // Every 3 levels
    minPresentSpawnProbability: 0.05
  },

  // Pattern progression
  patterns: [
    { level: 1, pattern: "solid" },
    { level: 2, pattern: "checkerboard" },
    { level: 3, pattern: "moving_rows" },
    { level: 4, pattern: "fortress" },
    { level: 5, pattern: "boss_fortress" },
    { level: 6, pattern: "procedural_complex" },
    { level: 8, pattern: "procedural_extreme" },
    { level: 10, pattern: "ultimate_fortress" }
  ],

  // Special effects unlock
  specialEffects: [
    { level: 3, effects: ["row_movement", "regenerating_bricks"] },
    { level: 4, effects: ["explosive_chains", "reinforced_corners"] },
    { level: 5, effects: ["boss_brick", "multi_phase", "time_pressure"] },
    { level: 6, effects: ["complex_patterns", "variable_brick_health", "time_bombs"] },
    { level: 7, effects: ["gravity_zones"] },
    { level: 8, effects: ["multi_ball_required"] },
    { level: 10, effects: ["regenerating_waves"] }
  ]
};

// Color themes for levels
const COLOR_THEMES = [
  { level: 1, bg: "#1a4d2e", theme: "#90ee90", difficulty: "beginner" },
  { level: 2, bg: "#2d5a2d", theme: "#32cd32", difficulty: "easy" },
  { level: 3, bg: "#4d7c4d", theme: "#228b22", difficulty: "medium" },
  { level: 4, bg: "#5d8a5d", theme: "#ff6347", difficulty: "hard" },
  { level: 5, bg: "#6d4c4d", theme: "#ffd700", difficulty: "extreme" },
  { level: 6, bg: "#7a6a7a", theme: "#b19cd9", difficulty: "procedural_1" },
  { level: 7, bg: "#8a7a8a", theme: "#da70d6", difficulty: "procedural_2" },
  { level: 8, bg: "#9a8a9a", theme: "#ff69b4", difficulty: "procedural_3" },
  { level: 9, bg: "#aa9aaa", theme: "#ff1493", difficulty: "procedural_4" },
  { level: 10, bg: "#4a0e0e", theme: "#ff0000", difficulty: "ultimate" }
];

class LevelGenerator {
  constructor() {
    this.maxLevel = 50;
    this.generatedLevels = {};
  }

  /**
   * Deep clone an object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Get available brick types for a given level
   */
  getBrickTypesForLevel(level) {
    const types = ["standard"];

    if (level >= PROGRESSION_RULES.bricks.unlockMetalAt) types.push("metal");
    if (level >= PROGRESSION_RULES.bricks.unlockGoldAt) types.push("gold");
    if (level >= PROGRESSION_RULES.bricks.unlockExplosiveAt) types.push("explosive");
    if (level >= PROGRESSION_RULES.bricks.unlockRegeneratingAt) types.push("regenerating");
    if (level >= PROGRESSION_RULES.bricks.unlockDiamondAt) types.push("diamond");

    return types;
  }

  /**
   * Get pattern for a given level
   */
  getPatternForLevel(level) {
    for (let i = PROGRESSION_RULES.patterns.length - 1; i >= 0; i--) {
      if (level >= PROGRESSION_RULES.patterns[i].level) {
        return PROGRESSION_RULES.patterns[i].pattern;
      }
    }
    return "solid";
  }

  /**
   * Get special effects for a given level
   */
  getSpecialEffectsForLevel(level) {
    const effects = [];

    PROGRESSION_RULES.specialEffects.forEach(unlock => {
      if (level >= unlock.level) {
        effects.push(...unlock.effects);
      }
    });

    // Remove duplicates
    return [...new Set(effects)];
  }

  /**
   * Get color theme for a given level
   */
  getColorThemeForLevel(level) {
    for (let i = COLOR_THEMES.length - 1; i >= 0; i--) {
      if (level >= COLOR_THEMES[i].level) {
        return COLOR_THEMES[i];
      }
    }
    return COLOR_THEMES[0];
  }

  /**
   * Calculate brick dimensions based on canvas size and grid
   */
  calculateBrickDimensions(rows, columns) {
    const canvasWidth = 800;
    const canvasHeight = 800;
    const availableWidth = canvasWidth - 40; // Account for walls
    const maxBrickWidth = 175;
    const brickHeight = 25;
    const padding = 4;

    // Calculate brick width to fit canvas
    const totalPadding = (columns - 1) * padding;
    const brickWidth = Math.min(maxBrickWidth, Math.floor((availableWidth - totalPadding) / columns));

    return { width: brickWidth, height: brickHeight, padding };
  }

  /**
   * Generate a level based on the previous level
   */
  generateLevel(levelNumber, previousLevel = null) {
    if (levelNumber === 1) {
      return this.deepClone(BASE_LEVEL_CONFIG);
    }

    // Start with previous level or base config
    const level = previousLevel ? this.deepClone(previousLevel) : this.deepClone(BASE_LEVEL_CONFIG);

    // Update level name and description
    level.name = `Level ${levelNumber}`;
    const colorTheme = this.getColorThemeForLevel(levelNumber);
    level.difficulty = colorTheme.difficulty;
    level.description = this.generateLevelDescription(levelNumber, colorTheme.difficulty);

    // Update brick system
    this.updateBrickSystem(level, levelNumber);

    // Update game balance
    this.updateGameBalance(level, levelNumber);

    // Update present system
    this.updatePresentSystem(level, levelNumber);

    // Update energy system
    this.updateEnergySystem(level, levelNumber);

    // Update visual theme
    this.updateVisualTheme(level, levelNumber, colorTheme);

    return level;
  }

  /**
   * Update brick system for a level
   */
  updateBrickSystem(level, levelNumber) {
    const rules = PROGRESSION_RULES.bricks;

    // Increment rows
    if (levelNumber % rules.rowIncrementFrequency === 0 && level.brickSystem.rows < rules.maxRows) {
      level.brickSystem.rows = Math.min(level.brickSystem.rows + rules.rowIncrement, rules.maxRows);
    }

    // Increment columns
    if (levelNumber % rules.columnIncrementFrequency === 0 && level.brickSystem.columns < rules.maxColumns) {
      level.brickSystem.columns = Math.min(level.brickSystem.columns + rules.columnIncrement, rules.maxColumns);
    }

    // Update brick types
    level.brickSystem.types = this.getBrickTypesForLevel(levelNumber);

    // Update pattern
    level.brickSystem.pattern = this.getPatternForLevel(levelNumber);

    // Increase difficulty slightly
    level.brickSystem.oneShotPercentage = Math.max(0.5, level.brickSystem.oneShotPercentage - 0.01);

    // Calculate durability using mathematical progression
    const durabilityStep = Math.max(0, Math.floor((levelNumber - rules.durabilityStartLevel) / rules.durabilityIncrement));
    level.brickSystem.maxDurability = Math.min(rules.maxDurability, 1 + durabilityStep);

    // Calculate durability bonus chance with gradual increase
    const bonusChanceProgress = Math.min(1, (levelNumber - 1) / 40); // Normalize to 0-1 over 40 levels
    level.brickSystem.durabilityBonusChance = Math.min(
      rules.maxDurabilityBonusChance,
      rules.baseDurabilityBonusChance + (rules.maxDurabilityBonusChance - rules.baseDurabilityBonusChance) * bonusChanceProgress
    );

    // Add special brick properties
    if (levelNumber >= 5 && level.brickSystem.pattern.includes("fortress")) {
      level.brickSystem.explosiveRadius = 80 + (levelNumber - 5) * 5;
    }

    if (levelNumber >= 6 && level.brickSystem.types.includes("regenerating")) {
      level.brickSystem.regenerationTime = Math.max(3000, 10000 - (levelNumber - 6) * 500);
    }

    // Boss brick position for certain patterns
    if (level.brickSystem.pattern === "boss_fortress" || level.brickSystem.pattern === "ultimate_fortress") {
      level.brickSystem.bossBrickPosition = {
        row: Math.floor(level.brickSystem.rows / 2),
        column: Math.floor(level.brickSystem.columns / 2)
      };
    }

    // Recalculate brick dimensions
    const dimensions = this.calculateBrickDimensions(level.brickSystem.rows, level.brickSystem.columns);
    level.brickSystem.width = dimensions.width;
    level.brickSystem.height = dimensions.height;
    level.brickSystem.padding = dimensions.padding;
  }

  /**
   * Update game balance for a level
   */
  updateGameBalance(level, levelNumber) {
    const rules = PROGRESSION_RULES.gameBalance;

    // Increase ball speed
    if (levelNumber % rules.speedIncrementFrequency === 0) {
      level.gameBalance.ballSpeed = Math.min(
        rules.maxBallSpeed,
        level.gameBalance.ballSpeed + rules.ballSpeedIncrement
      );
    }

    // Increase score multiplier
    if (levelNumber % rules.scoreIncrementFrequency === 0) {
      level.gameBalance.scoreMultiplier = Math.min(
        5.0,
        level.gameBalance.scoreMultiplier + rules.scoreMultiplierIncrement
      );
    }
  }

  /**
   * Update present system for a level
   */
  updatePresentSystem(level, levelNumber) {
    const rules = PROGRESSION_RULES.gameBalance;

    // Decrease spawn probability
    if (levelNumber % rules.presentSpawnDecrementFrequency === 0) {
      level.presentSystem.spawnProbability = Math.max(
        rules.minPresentSpawnProbability,
        level.presentSystem.spawnProbability - rules.presentSpawnDecrement
      );
    }

    // Increase max presents slightly
    level.presentSystem.maxPresents = Math.min(30, level.presentSystem.maxPresents + 1);

    // Adjust rarity modifiers to make good presents slightly rarer over time
    Object.keys(level.presentSystem.rarityModifiers).forEach(present => {
      if (["EXPAND_PADDLE", "SLOW_BALL", "SHIELD"].includes(present)) {
        level.presentSystem.rarityModifiers[present] = Math.max(
          0.3,
          level.presentSystem.rarityModifiers[present] - 0.01
        );
      }
    });

    // Reduce effect durations slightly for higher levels
    if (levelNumber > 5) {
      const durationReduction = (levelNumber - 5) * 200;
      Object.keys(level.presentSystem.effectDurations).forEach(effect => {
        level.presentSystem.effectDurations[effect] = Math.max(
          5000,
          level.presentSystem.effectDurations[effect] - durationReduction
        );
      });
    }
  }

  /**
   * Update energy system for a level
   */
  updateEnergySystem(level, levelNumber) {
    // Make energy consumption slightly harder over time
    level.energySystem.consumptionRateMultiplier = Math.min(
      2.0,
      level.energySystem.consumptionRateMultiplier + 0.02
    );

    // Slightly reduce recovery rate
    level.energySystem.recoveryRateMultiplier = Math.max(
      0.5,
      level.energySystem.recoveryRateMultiplier - 0.01
    );

    // Make thresholds slightly stricter
    level.energySystem.thresholds.speedPenalty = Math.min(
      0.4,
      level.energySystem.thresholds.speedPenalty + 0.005
    );

    level.energySystem.thresholds.consumptionReduction = Math.min(
      0.8,
      level.energySystem.thresholds.consumptionReduction + 0.005
    );
  }

  /**
   * Update visual theme for a level
   */
  updateVisualTheme(level, levelNumber, colorTheme) {
    level.visualTheme.backgroundColor = colorTheme.bg;
    level.visualTheme.themeColor = colorTheme.theme;
    level.visualTheme.specialEffects = this.getSpecialEffectsForLevel(levelNumber);
  }

  /**
   * Generate a description for a level
   */
  generateLevelDescription(levelNumber, difficulty) {
    const descriptions = {
      beginner: "Learn the basics with simple bricks and helpful presents",
      easy: "Mixed brick types introduce strategy",
      medium: "Moving targets and regenerating bricks challenge your skills",
      hard: "Fortress patterns with explosive chain reactions",
      extreme: "Boss level with diamond core and multiple phases",
      procedural_1: "Procedural generation begins with complex patterns",
      procedural_2: "Time pressure mechanics and faster regeneration",
      procedural_3: "Gravity zones affect ball physics",
      procedural_4: "Strategic multi-ball challenges",
      ultimate: "The ultimate challenge with all mechanics combined"
    };

    return descriptions[difficulty] || "Increasing difficulty with new challenges";
  }

  /**
   * Generate all levels
   */
  generateAllLevels() {
    const levels = {};
    let previousLevel = null;

    console.log(`Generating levels 1 to ${this.maxLevel}...`);

    for (let i = 1; i <= this.maxLevel; i++) {
      const level = this.generateLevel(i, previousLevel);
      levels[i] = level;
      previousLevel = level;

      if (i % 10 === 0) {
        console.log(`Generated level ${i}...`);
      }
    }

    return levels;
  }

  /**
   * Save generated levels to JSON file
   */
  saveLevels(levels, filename) {
    const output = {
      "_comment": "Generated level configurations for Jungle Arkanoid game",
      "_version": "2.0.0",
      "_generated": new Date().toISOString(),
      "_generator": "level-generator.js",

      "global": {
        "description": "Global defaults and validation rules",
        "defaults": GLOBAL_DEFAULTS,
        "validation": {
          "maxLevel": this.maxLevel,
          "maxRows": 20,
          "maxColumns": 20,
          "maxBallSpeed": 20.0,
          "maxPresentSpawnRate": 1.0,
          "maxPresents": 50,
          "maxDurability": 10,
          "maxScoreMultiplier": 5.0
        }
      },

      "levels": levels,

      "proceduralTemplate": {
        "description": "Template for generating levels beyond maxLevel",
        "baseLevel": this.maxLevel,
        "progression": {
          "rows": {
            "base": levels[this.maxLevel].brickSystem.rows,
            "increment": 0.05,
            "max": 3
          },
          "columns": {
            "base": levels[this.maxLevel].brickSystem.columns,
            "increment": 1,
            "max": 20
          },
          "ballSpeed": {
            "base": levels[this.maxLevel].gameBalance.ballSpeed,
            "increment": 0.2,
            "max": 15.0
          },
          "maxDurability": {
            "base": levels[this.maxLevel].brickSystem.maxDurability,
            "increment": 0.1,
            "max": 3
          },
          "oneShotPercentage": {
            "base": levels[this.maxLevel].brickSystem.oneShotPercentage,
            "decrement": 0.01,
            "min": 0.50
          },
          "presentSpawnRate": {
            "base": levels[this.maxLevel].presentSystem.spawnProbability,
            "decrement": 0.005,
            "min": 0.05
          },
          "maxPresents": {
            "base": levels[this.maxLevel].presentSystem.maxPresents,
            "increment": 1,
            "max": 50
          },
          "scoreMultiplier": {
            "base": levels[this.maxLevel].gameBalance.scoreMultiplier,
            "increment": 0.1,
            "max": 5.0
          },
          "energyConsumptionMultiplier": {
            "base": levels[this.maxLevel].energySystem.consumptionRateMultiplier,
            "increment": 0.02,
            "max": 2.0
          },
          "effectDurationReduction": {
            "base": 1.0,
            "decrement": 0.02,
            "min": 0.5
          }
        }
      }
    };

    const jsonString = JSON.stringify(output, null, 2);
    fs.writeFileSync(filename, jsonString, 'utf8');
    console.log(`Levels saved to ${filename}`);
  }

  /**
   * Save base level configuration (template)
   */
  saveBaseLevel(filename) {
    const output = {
      "_comment": "Base level configuration for Jungle Arkanoid - level-generator.js",
      "_version": "2.0.0",
      "_description": "This file contains only the starting level. All other levels are generated procedurally.",
      "_generator": "level-generator.js",

      "baseLevel": BASE_LEVEL_CONFIG,
      "globalDefaults": GLOBAL_DEFAULTS,
      "progressionRules": PROGRESSION_RULES,
      "colorThemes": COLOR_THEMES
    };

    const jsonString = JSON.stringify(output, null, 2);
    fs.writeFileSync(filename, jsonString, 'utf8');
    console.log(`Base level configuration saved to ${filename}`);
  }
}

// Main execution
function main() {
  const generator = new LevelGenerator();

  console.log("🎮 Jungle Arkanoid Level Generator");
  console.log("=====================================");

  // Save base configuration
  generator.saveBaseLevel("base-level-config.json");

  // Generate all levels
  const levels = generator.generateAllLevels();

  // Save generated levels
  generator.saveLevels(levels, "config/level-difficulty.json");

  console.log("\n✅ Level generation complete!");
  console.log(`📁 Generated ${generator.maxLevel} levels`);
  console.log("📄 Files created:");
  console.log("   - base-level-config.json (template configuration)");
  console.log("   - generated-levels.json (full level set)");

  // Show some statistics
  console.log("\n📊 Generation Statistics:");
  console.log(`   Level 1 ball speed: ${levels[1].gameBalance.ballSpeed}`);
  console.log(`   Level ${generator.maxLevel} ball speed: ${levels[generator.maxLevel].gameBalance.ballSpeed}`);
  console.log(`   Level 1 bricks: ${levels[1].brickSystem.rows}x${levels[1].brickSystem.columns}`);
  console.log(`   Level ${generator.maxLevel} bricks: ${levels[generator.maxLevel].brickSystem.rows}x${levels[generator.maxLevel].brickSystem.columns}`);
}

// Run the generator
if (require.main === module) {
  main();
}

module.exports = LevelGenerator;