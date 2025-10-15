
// Import all game modules
import { Game } from './Game.js';
import { Paddle } from './Paddle.js';
import { Ball } from './Ball.js';
import { Brick } from './Brick.js';
import { Score } from './Score.js';
import { Lives } from './Lives.js';
import  './utils.js';

// Initialize the game instance
const game = new Game();

// Set up event listeners for keyboard input
document.addEventListener('keydown', (event) => {
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
