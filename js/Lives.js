export class Lives {
    constructor(lives) {
        this.lives = lives;
        this.x = 700;
        this.y = 20;
    }

    loseLife() {
        this.lives--;
    }

    reset() {
        this.lives = 3;
    }

    draw(ctx) {
        ctx.font = '18px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeText('Lives: ' + this.lives, this.x, this.y);
        ctx.fillText('Lives: ' + this.lives, this.x, this.y);
    }
}
