export class Score {
    constructor(score, x, y) {
        this.score = score;
        this.x = x;
        this.y = y;
    }

    addPoints(points) {
        this.score += points;
    }

    reset() {
        this.score = 0;
    }

    draw(ctx) {
        ctx.font = '18px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeText('Score: ' + this.score, this.x, this.y);
        ctx.fillText('Score: ' + this.score, this.x, this.y);
    }
}
