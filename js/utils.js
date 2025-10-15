
// Utility functions for the Arkanoid game

// Generate a random integer between min (inclusive) and max (inclusive)
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random float between min (inclusive) and max (inclusive)
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Check if two rectangles intersect
export function collisionDetection(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Check if a circle and a rectangle intersect
export function circleRectangleCollision(circle, rect) {
    // Find the closest point to the circle within the rectangle
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Calculate the distance between the circle's center and this closest point
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;

    // If the distance is less than the circle's radius, an intersection occurs
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (circle.radius * circle.radius);
}

// Calculate the distance between two points
export function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Calculate the angle between two points (in radians)
export function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Game constants
export const GAME_CONSTANTS = {
    // Screen dimensions
    SCREEN_WIDTH: 800,
    SCREEN_HEIGHT: 600,
    
    // Colors
    COLORS: {
        BACKGROUND: '#000000',
        PADDLE: '#00ff00',
        BALL: '#ffffff',
        BRICK: '#ff0000',
        TEXT: '#ffffff'
    },
    
    // Speeds
    PADDLE_SPEED: 8,
    BALL_SPEED: 5
};

// Input handling utilities
export const INPUT = {
    keys: {},
    
    // Initialize input handling
    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    },
    
    // Check if a key is pressed
    isPressed(key) {
        return this.keys[key] || false;
    }
};
