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
        
        this.img = new Image();
        this.img.src = 'images/platform.png';
    }

    update(leftPressed, rightPressed) {
        if (leftPressed) {
            this.velocity -= this.acceleration;
        } else if (rightPressed) {
            this.velocity += this.acceleration;
        } else {
            this.velocity *= this.friction;
        }

        this.velocity = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocity));
        this.x += this.velocity;

        if (this.x < 10) this.x = 10;
        if (this.x > 790 - this.width) this.x = 790 - this.width;
    }

    reset() {
        this.x = 350;
        this.leftPressed = false;
        this.rightPressed = false;
    }

    draw(ctx) {
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
