export class AudioManager {
    constructor() {
        this.musicFiles = [
            'sound/ambient-01_junglehillswav.mp3',
            'sound/jungle-01.mp3',
            'sound/adventure-beat-effect.mp3',
            'sound/jungleparrottambopata.mp3'
        ];
        this.currentMusic = null;
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.volume = 0.6;
        
        // Percussion loop config
        this.percussionConfig = {
            file: 'sound/beat_afro-percussion-loop.mp3',
            hitDuration: 0, // ms for single hit - 0 - NO SOUND NOW
            multiplierDuration: 2000, // ms for multiplier catch
            fadeTime: 50 // ms fade in/out
        };
        
        this.percussionAudio = null;
        this.percussionTimeout = null;
        this.percussionFadeTimeout = null;
    }

    playRandomMusic() {
        if (!this.musicEnabled) return;
        
        this.stopMusic();
        const randomIndex = Math.floor(Math.random() * this.musicFiles.length);
        this.currentMusic = new Audio(this.musicFiles[randomIndex]);
        this.currentMusic.loop = true;
        this.currentMusic.volume = this.volume;
        this.currentMusic.play().catch(() => {});
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic = null;
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        if (!enabled) {
            this.stopPercussion();
        }
    }

    setVolume(volumePercent) {
        this.volume = volumePercent / 100;
        if (this.currentMusic) {
            this.currentMusic.volume = this.volume;
        }
        if (this.percussionAudio) {
            this.percussionAudio.volume = this.volume * 0.7;
        }
    }

    playSound(frequency = 440, duration = 100) {
        if (!this.soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    }

    playPercussionHit() {
        if (!this.soundEnabled) return;
        this.startPercussion(this.percussionConfig.hitDuration);
    }

    playPercussionMultiplier() {
        if (!this.soundEnabled) return;
        this.startPercussion(this.percussionConfig.multiplierDuration);
    }

    startPercussion(duration) {
        if (!this.percussionAudio) {
            this.percussionAudio = new Audio(this.percussionConfig.file);
            this.percussionAudio.loop = true;
            this.percussionAudio.volume = 0;
        }

        // Clear existing timeouts
        if (this.percussionTimeout) clearTimeout(this.percussionTimeout);
        if (this.percussionFadeTimeout) clearTimeout(this.percussionFadeTimeout);

        // Start playing and fade in
        this.percussionAudio.play().catch(() => {});
        this.fadeIn();

        // Schedule fade out and stop
        this.percussionTimeout = setTimeout(() => {
            this.fadeOut();
        }, duration - this.percussionConfig.fadeTime);
    }

    fadeIn() {
        const targetVolume = this.volume * 0.7;
        const steps = this.percussionConfig.fadeTime / 5;
        const volumeStep = targetVolume / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            if (currentStep >= steps || !this.percussionAudio) {
                clearInterval(fadeInterval);
                if (this.percussionAudio) this.percussionAudio.volume = targetVolume;
                return;
            }
            this.percussionAudio.volume = volumeStep * currentStep;
            currentStep++;
        }, 5);
    }

    fadeOut() {
        if (!this.percussionAudio) return;
        
        const startVolume = this.percussionAudio.volume;
        const steps = this.percussionConfig.fadeTime / 5;
        const volumeStep = startVolume / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            if (currentStep >= steps || !this.percussionAudio) {
                clearInterval(fadeInterval);
                this.stopPercussion();
                return;
            }
            this.percussionAudio.volume = startVolume - (volumeStep * currentStep);
            currentStep++;
        }, 5);
    }

    stopPercussion() {
        if (this.percussionTimeout) {
            clearTimeout(this.percussionTimeout);
            this.percussionTimeout = null;
        }
        if (this.percussionFadeTimeout) {
            clearTimeout(this.percussionFadeTimeout);
            this.percussionFadeTimeout = null;
        }
        if (this.percussionAudio) {
            this.percussionAudio.pause();
            this.percussionAudio.volume = 0;
        }
    }
}
