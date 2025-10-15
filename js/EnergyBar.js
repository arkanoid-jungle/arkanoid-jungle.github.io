export class EnergyBar {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.enabled = true;
        this.targetEnergy = 100;
        this.currentDisplayEnergy = 100;
        this.pulseAnimation = 0;
        this.showWarning = false;
    }

    update(deltaTime, energySystem) {
        if (!this.enabled) return;

        // Smooth energy display transition
        const targetPercentage = energySystem.getEnergyPercentage() * 100;
        this.currentDisplayEnergy += (targetPercentage - this.currentDisplayEnergy) * 0.1;

        // Update warning state
        this.showWarning = energySystem.getEnergyPercentage() <= 0.15;
        this.pulseAnimation += deltaTime * 0.005;
    }

    draw(ctx, energySystem) {
        if (!this.enabled) return;

        const energyPercentage = this.currentDisplayEnergy / 100;
        const energyColor = energySystem.getEnergyColor();

        ctx.save();

        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Draw energy fill
        const fillWidth = (this.width - 4) * energyPercentage;

        if (fillWidth > 0) {
            // Add glow effect for high energy
            if (energyPercentage > 0.6) {
                ctx.shadowColor = energyColor;
                ctx.shadowBlur = 10;
            }

            ctx.fillStyle = energyColor;
            ctx.fillRect(this.x + 2, this.y + 2, fillWidth, this.height - 4);

            // Add warning pulse effect
            if (this.showWarning) {
                const pulseAlpha = Math.sin(this.pulseAnimation * 8) * 0.3 + 0.7;
                ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha * 0.3})`;
                ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            }

            ctx.shadowBlur = 0;
        }

        // Draw energy percentage text
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(this.currentDisplayEnergy)}%`, this.x + this.width / 2, this.y + this.height / 2);

        // Draw energy state indicator
        const stateText = this.getEnergyStateText(energySystem.energyState);
        ctx.font = '10px Arial';
        ctx.fillStyle = '#CCC';
        ctx.fillText(stateText, this.x + this.width / 2, this.y + this.height + 15);

        // Draw speed penalty indicator if active
        if (energySystem.getEnergyPercentage() <= 0.15) {
            ctx.fillStyle = '#FF6B6B';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('SLOW', this.x + this.width / 2, this.y - 10);
        }

        ctx.restore();
    }

    getEnergyStateText(state) {
        const stateMap = {
            'struggling': 'Struggling',
            'tired': 'Tired',
            'normal': 'Normal',
            'energized': 'Energized'
        };
        return stateMap[state] || 'Unknown';
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
    }
}