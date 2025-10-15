
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

// Initialize the game instance
const game = new Game();

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
