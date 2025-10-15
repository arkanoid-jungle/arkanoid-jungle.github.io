export class Paddle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocity = 0;
        this.acceleration = 0.8;
        this.friction = 0.85;
        this.maxSpeed = 8;

        // Energy system integration
        this.baseMaxSpeed = 8;
        this.baseAcceleration = 0.8;

        this.img = new Image();
        this.img.src = 'images/platform.png';
    }

    update(leftPressed, rightPressed, energySystem = null) {
        // Check if paddle is against walls before applying forces
        const minValidX = 10;
        const maxValidX = 790 - this.width;
        const paddleAtLeftWall = this.x <= minValidX;
        const paddleAtRightWall = this.x >= maxValidX;

        // Apply keyboard input with wall collision awareness
        if (leftPressed && !paddleAtLeftWall) {
            this.velocity -= this.acceleration;
        } else if (rightPressed && !paddleAtRightWall) {
            this.velocity += this.acceleration;
        } else {
            this.velocity *= this.friction;
        }

        // Clamp velocity
        this.velocity = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocity));

        // Apply movement
        this.x += this.velocity;

        // Wall boundary enforcement (safety net)
        if (this.x < minValidX) {
            this.x = minValidX;
            this.velocity = 0;
        }
        if (this.x > maxValidX) {
            this.x = maxValidX;
            this.velocity = 0;
        }
    }

    // Apply energy system effects to paddle movement
    applyEnergyEffects(energySystem) {
        if (!energySystem) return;

        const speedMultiplier = energySystem.getSpeedMultiplier();

        // Apply speed penalty
        this.maxSpeed = this.baseMaxSpeed * speedMultiplier;
        this.acceleration = this.baseAcceleration * speedMultiplier;

        // Visual feedback for energy state
        if (energySystem.getEnergyPercentage() <= 0.15) {
            // Struggling state - subtle visual indication
            this.energyEffectIntensity = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        } else {
            this.energyEffectIntensity = 0;
        }
    }

    reset() {
        this.x = 350;
        this.leftPressed = false;
        this.rightPressed = false;
        this.maxSpeed = this.baseMaxSpeed;
        this.acceleration = this.baseAcceleration;
        this.energyEffectIntensity = 0;
    }

    draw(ctx) {
        // Apply energy-based visual effects
        if (this.energyEffectIntensity > 0) {
            ctx.save();
            ctx.globalAlpha = this.energyEffectIntensity * 0.3;
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            ctx.restore();
        }

        if (this.img.complete) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#8B4513';
            ctx.fill();
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
    }
}
