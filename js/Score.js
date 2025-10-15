export class Score {
    constructor(score, x, y, canvasWidth = 800, canvasHeight = 800) {
        this.score = score;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
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
        const fontSize = this.canvasWidth * 0.02; // 18px at 900px = 2%
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeText('Score: ' + this.score, this.x, this.y);
        ctx.fillText('Score: ' + this.score, this.x, this.y);
    }
}
