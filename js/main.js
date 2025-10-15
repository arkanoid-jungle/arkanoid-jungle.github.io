
// Import all game modules
import { Game } from './Game.js';
import { Paddle } from './Paddle.js';
import { Ball } from './Ball.js';
import { Brick } from './Brick.js';
import { Score } from './Score.js';
import { Lives } from './Lives.js';
import { PresentSystem } from './PresentSystem.js';
import { LevelManager } from './LevelManager.js';
import { VisualEffects } from './VisualEffects.js';
import { SettingsManager } from './SettingsManager.js';
import  './utils.js';

// Import debug configuration
let DEBUG_MODE = false;
let DEBUG_START_LEVEL = 1;
let DEBUG_LEVELS = [];

try {
    const debugConfig = await import('../.env.js');
    DEBUG_MODE = debugConfig.DEBUG_MODE;
    DEBUG_START_LEVEL = debugConfig.DEBUG_START_LEVEL;
    DEBUG_LEVELS = debugConfig.DEBUG_LEVELS;
    console.log('Debug mode:', DEBUG_MODE ? 'ENABLED' : 'DISABLED');
} catch (error) {
    console.log('No debug configuration found, using defaults');
}

// Initialize and start game
async function startGame() {
    // Initialize the game instance
    const game = new Game();

    // Set debug configuration
    game.setDebugConfig({
        enabled: DEBUG_MODE,
        startLevel: DEBUG_START_LEVEL,
        availableLevels: DEBUG_LEVELS
    });

    // Initialize settings manager
    const settingsManager = new SettingsManager();

    // Connect settings manager to game
    game.setSettingsManager(settingsManager);

    // Set up event listeners for keyboard input
    document.addEventListener('keydown', (event) => {
        // Handle settings menu input
        settingsManager.handleKeyDown(event.key, game);

        // Handle game input
        game.handleKeyDown(event);
    });

    document.addEventListener('keyup', (event) => {
        game.handleKeyUp(event);
    });

    // Handle window resize events
    window.addEventListener('resize', () => {
        game.handleResize();
    });

    // Start the game loop
    game.startGameLoop();
}

// Start the game
startGame();
