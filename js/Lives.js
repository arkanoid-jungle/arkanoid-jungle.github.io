export class Lives {
    constructor(lives) {
        this.lives = lives;
        this.ballRadius = 12;
        this.ballSpacing = 35;
        this.startX = 750; // Position from right edge
        this.startY = 25;

        // Load ball image for lives display
        this.loadBallImage();
    }

    loadBallImage() {
        if (!Lives.ballImage) {
            Lives.ballImage = new Image();
            Lives.ballImage.onload = () => Lives.imageLoaded = true;
            Lives.ballImage.src = 'images/ball.png';
        }
    }

    loseLife() {
        this.lives--;
    }

    reset() {
        this.lives = 3;
    }

    draw(ctx) {
        // Draw red-hued ball icons for remaining lives
        for (let i = 0; i < this.lives; i++) {
            const x = this.startX + (i * this.ballSpacing);
            const y = this.startY;

            if (Lives.imageLoaded) {
                // Draw red-hued ball image
                ctx.save();
                ctx.filter = 'hue-rotate(-50deg) saturate(1.5)'; // Red hue adjustment
                const size = this.ballRadius * 2;
                ctx.drawImage(Lives.ballImage, x - this.ballRadius, y - this.ballRadius, size, size);
                ctx.restore();
            } else {
                // Fallback to red circle if image not loaded
                ctx.beginPath();
                ctx.arc(x, y, this.ballRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#FF3333';
                ctx.fill();
                ctx.strokeStyle = '#CC0000';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();
            }
        }

        // Draw faded/grayed out balls for lost lives
        for (let i = this.lives; i < 3; i++) {
            const x = this.startX + (i * this.ballSpacing);
            const y = this.startY;

            if (Lives.imageLoaded) {
                // Draw grayed out ball image
                ctx.save();
                ctx.filter = 'grayscale(1) opacity(0.3)';
                const size = this.ballRadius * 2;
                ctx.drawImage(Lives.ballImage, x - this.ballRadius, y - this.ballRadius, size, size);
                ctx.restore();
            } else {
                // Fallback to gray circle
                ctx.beginPath();
                ctx.arc(x, y, this.ballRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#666666';
                ctx.fill();
                ctx.strokeStyle = '#444444';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}
