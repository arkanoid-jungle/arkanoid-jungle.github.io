export class SettingsManager {
    constructor() {
        this.settings = {
            energyBarEnabled: true,
            energyAnimationEnabled: true,
            soundEnabled: true,
            musicEnabled: true,
            musicVolume: 60,
            particlesEnabled: true
        };

        this.menuState = 'main'; // 'main', 'energy', 'back'
        this.selectedOption = 0;
        this.menuOptions = {
            main: ['Energy Settings', 'Sound Settings', 'Bonuses Guide', 'Back'],
            energy: ['Energy Bar: ON', 'Energy Animation: ON', 'Back'],
            sound: ['Sound Effects: ON', 'Music: ON', 'Music Volume: 60%', 'Back'],
            bonuses: ['Back']
        };

        this.loadSettings();
        this.updateMenuText();
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('arkanoidSettings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('arkanoidSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }

    handleKeyDown(key, game) {
        if (game.gameState !== 'settings') return;

        switch (key) {
            case 'ArrowUp':
                this.selectedOption = (this.selectedOption - 1 + this.getCurrentMenuOptions().length) % this.getCurrentMenuOptions().length;
                break;
            case 'ArrowDown':
                this.selectedOption = (this.selectedOption + 1) % this.getCurrentMenuOptions().length;
                break;
            case ' ':
            case 'Enter':
                this.selectOption(game);
                break;
            case 'Escape':
                this.menuState = 'main';
                this.selectedOption = 0;
                game.gameState = 'start';
                break;
        }
    }

    getCurrentMenuOptions() {
        return this.menuOptions[this.menuState] || this.menuOptions.main;
    }

    selectOption(game) {
        const options = this.getCurrentMenuOptions();
        const selectedOptionText = options[this.selectedOption];

        if (this.menuState === 'main') {
            switch (this.selectedOption) {
                case 0: // Energy Settings
                    this.menuState = 'energy';
                    this.selectedOption = 0;
                    break;
                case 1: // Sound Settings
                    this.menuState = 'sound';
                    this.selectedOption = 0;
                    break;
                case 2: // Bonuses Guide
                    this.menuState = 'bonuses';
                    this.selectedOption = 0;
                    break;
                case 3: // Back
                    game.gameState = 'start';
                    this.selectedOption = 0;
                    break;
            }
        } else if (this.menuState === 'energy') {
            switch (this.selectedOption) {
                case 0: // Energy Bar toggle
                    this.settings.energyBarEnabled = !this.settings.energyBarEnabled;
                    this.updateMenuText();
                    this.saveSettings();
                    break;
                case 1: // Energy Animation toggle
                    this.settings.energyAnimationEnabled = !this.settings.energyAnimationEnabled;
                    this.updateMenuText();
                    this.saveSettings();
                    break;
                case 2: // Back
                    this.menuState = 'main';
                    this.selectedOption = 0;
                    break;
            }
        } else if (this.menuState === 'sound') {
            switch (this.selectedOption) {
                case 0: // Sound Effects toggle
                    this.settings.soundEnabled = !this.settings.soundEnabled;
                    this.updateMenuText();
                    this.saveSettings();
                    break;
                case 1: // Music toggle
                    this.settings.musicEnabled = !this.settings.musicEnabled;
                    this.updateMenuText();
                    this.saveSettings();
                    break;
                case 2: // Music Volume
                    this.settings.musicVolume = (this.settings.musicVolume + 10) % 110;
                    if (this.settings.musicVolume === 0) this.settings.musicVolume = 10;
                    this.updateMenuText();
                    this.saveSettings();
                    break;
                case 3: // Back
                    this.menuState = 'main';
                    this.selectedOption = 0;
                    break;
            }
        } else if (this.menuState === 'bonuses') {
            switch (this.selectedOption) {
                case 0: // Back
                    this.menuState = 'main';
                    this.selectedOption = 0;
                    break;
            }
        }
    }

    updateMenuText() {
        this.menuOptions.energy[0] = `Energy Bar: ${this.settings.energyBarEnabled ? 'ON' : 'OFF'}`;
        this.menuOptions.energy[1] = `Energy Animation: ${this.settings.energyAnimationEnabled ? 'ON' : 'OFF'}`;
        this.menuOptions.sound[0] = `Sound Effects: ${this.settings.soundEnabled ? 'ON' : 'OFF'}`;
        this.menuOptions.sound[1] = `Music: ${this.settings.musicEnabled ? 'ON' : 'OFF'}`;
        this.menuOptions.sound[2] = `Music Volume: ${this.settings.musicVolume}%`;
    }

    applySettings(game) {
        if (game.energyBar) {
            game.energyBar.setEnabled(this.settings.energyBarEnabled);
        }
        if (game.energyAnimation) {
            game.energyAnimation.setEnabled(this.settings.energyAnimationEnabled);
        }
        if (game.audioManager) {
            game.audioManager.setMusicEnabled(this.settings.musicEnabled);
            game.audioManager.setSoundEnabled(this.settings.soundEnabled);
            game.audioManager.setVolume(this.settings.musicVolume);
        }
        if (game.visualEffects) {
            // Placeholder for particle settings
        }
    }

    draw(ctx, canvas) {
        // Draw semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.font = '36px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;

        const title = this.menuState === 'main' ? 'Settings' :
                     this.menuState === 'energy' ? 'Energy Settings' :
                     this.menuState === 'sound' ? 'Sound Settings' :
                     this.menuState === 'bonuses' ? 'Bonuses Guide' : 'Settings';

        ctx.strokeText(title, canvas.width / 2, 150);
        ctx.fillText(title, canvas.width / 2, 150);

        // Special handling for bonuses page
        if (this.menuState === 'bonuses') {
            this.drawBonusesGuide(ctx, canvas);
            return;
        }

        // Draw menu options
        const options = this.getCurrentMenuOptions();
        ctx.font = '24px Arial';

        options.forEach((option, index) => {
            const y = 250 + index * 60;
            const isSelected = index === this.selectedOption;

            // Highlight selected option
            if (isSelected) {
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;

                // Draw selection indicator
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2 - 150, y - 5);
                ctx.lineTo(canvas.width / 2 - 120, y - 5);
                ctx.lineTo(canvas.width / 2 - 125, y - 10);
                ctx.lineTo(canvas.width / 2 - 125, y);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
            }

            ctx.strokeText(option, canvas.width / 2, y);
            ctx.fillText(option, canvas.width / 2, y);
        });

        // Draw navigation hint
        ctx.font = '18px Arial';
        ctx.fillStyle = '#90EE90';
        ctx.textAlign = 'center';
        ctx.fillText('Use ↑↓ arrows to navigate, SPACE/ENTER to select', canvas.width / 2, canvas.height - 80);
        ctx.fillText('Press ESC to go back', canvas.width / 2, canvas.height - 50);
    }

    drawBonusesGuide(ctx, canvas) {
        // Load bonuses from PRESENT_TYPES config
        const bonuses = Object.values(window.PRESENT_TYPES || {}).map(bonus => ({
            emoji: bonus.emoji,
            name: bonus.effect.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            desc: bonus.description,
            time: bonus.duration === 0 ? 'Special' : `${bonus.duration / 1000}s`,
            level: bonus.level || 1
        }));

        // Fallback if config not loaded
        if (bonuses.length === 0) {
            bonuses.push(
                { emoji: '🎱', name: 'Multi Ball', desc: 'Spawns 2 additional balls', time: 'Until lost', level: 1 },
                { emoji: '📏', name: 'Expand Paddle', desc: 'Increases paddle width by 40%', time: '15s', level: 1 },
                { emoji: '🐌', name: 'Slow Ball', desc: 'Reduces ball velocity by 30%', time: '30s', level: 1 },
                { emoji: '🛡️', name: 'Shield', desc: 'Prevents ball loss for 1 collision', time: '10s', level: 1 },
                { emoji: '⚡', name: 'Power Shot', desc: 'Ball destroys bricks without bouncing', time: 'Next hit', level: 3 },
                { emoji: '💎', name: 'Bonus Points', desc: 'Instant 500 points', time: 'Instant', level: 4 },
                { emoji: '🔵', name: 'Energy Boost', desc: 'Reduces energy consumption by 40%', time: '40s', level: 1 },
                { emoji: '🔋', name: 'Energy Free', desc: 'No energy consumption for movement', time: '20s', level: 1 }
            );
        }

        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        
        bonuses.forEach((bonus, index) => {
            const y = 180 + index * 60;
            
            // Draw emoji
            ctx.font = '20px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.fillText(bonus.emoji, 30, y);
            
            // Draw name
            ctx.font = '18px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(bonus.name, 70, y);
            
            // Draw description
            ctx.font = '14px Arial';
            ctx.fillStyle = '#CCCCCC';
            ctx.fillText(bonus.desc, 70, y + 16);
            
            // Draw time and availability
            ctx.font = '12px Arial';
            ctx.fillStyle = '#90EE90';
            ctx.fillText(`Duration: ${bonus.time} | Level ${bonus.level}+`, 70, y + 32);
        });

        // Draw back option
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        const backY = canvas.height - 80;
        
        if (this.selectedOption === 0) {
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2 - 50, backY - 5);
            ctx.lineTo(canvas.width / 2 - 20, backY - 5);
            ctx.lineTo(canvas.width / 2 - 25, backY - 10);
            ctx.lineTo(canvas.width / 2 - 25, backY);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
        }
        
        ctx.strokeText('Back', canvas.width / 2, backY);
        ctx.fillText('Back', canvas.width / 2, backY);
        
        // Navigation hint
        ctx.font = '16px Arial';
        ctx.fillStyle = '#90EE90';
        ctx.fillText('Press SPACE/ENTER to go back', canvas.width / 2, canvas.height - 30);
    }

    reset() {
        this.menuState = 'main';
        this.selectedOption = 0;
        this.updateMenuText();
    }
}