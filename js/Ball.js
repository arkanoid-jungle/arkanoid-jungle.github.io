export class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = 0;
        this.dy = 0;
    }

    update(canvas, paddle, bricks, score, lives) {
        this.x += this.dx;
        this.y += this.dy;

        // Wall collision (left/right)
        if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
            this.dx = -this.dx;
            this.x = this.x - this.radius <= 0 ? this.radius : canvas.width - this.radius;
        }

        // Wall collision (top)
        if (this.y - this.radius <= 30) {
            this.dy = -this.dy;
            this.y = 30 + this.radius;
        }

        // Paddle collision
        if (this.y + this.radius > paddle.y &&
            this.y < paddle.y + paddle.height &&
            this.x > paddle.x &&
            this.x < paddle.x + paddle.width &&
            this.dy > 0) {
            
            // Calculate hit position (-1 to 1)
            const hitPos = (this.x - paddle.x - paddle.width / 2) / (paddle.width / 2);
            
            // Set new velocity based on hit position
            const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.dx = hitPos * speed * 0.8;
            this.dy = -Math.abs(speed * Math.cos(hitPos * Math.PI / 4));
        }

        // Brick collision
        for (let c = 0; c < bricks.length; c++) {
            for (let r = 0; r < bricks[c].length; r++) {
                const brick = bricks[c][r];
                if (brick.destroyed) continue;
                
                if (this.x + this.radius > brick.x &&
                    this.x - this.radius < brick.x + brick.width &&
                    this.y + this.radius > brick.y &&
                    this.y - this.radius < brick.y + brick.height) {
                    
                    // Determine collision side
                    const overlapLeft = (this.x + this.radius) - brick.x;
                    const overlapRight = (brick.x + brick.width) - (this.x - this.radius);
                    const overlapTop = (this.y + this.radius) - brick.y;
                    const overlapBottom = (brick.y + brick.height) - (this.y - this.radius);
                    
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    
                    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                        this.dx = -this.dx;
                    } else {
                        this.dy = -this.dy;
                    }
                    
                    brick.destroyed = true;
                    score.addPoints(10);
                    return;
                }
            }
        }

        // Bottom wall collision (lose life)
        if (this.y + this.radius > canvas.height) {
            lives.loseLife();
            this.dx = 0;
            this.dy = 0;
            return true; // Signal life lost
        }
        return false;
    }

    reset() {
        this.x = 400;
        this.y = 500;
        this.dx = 0;
        this.dy = 0;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}
