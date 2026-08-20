// BGMGenerator.ts - Reproductor de Banda Sonora Tradicional Japonesa Acústica
// Carga y reproduce de forma fluida y sin cortes las pistas de ambiente zen y combate japonés (Koto, Shō y Shakuhachi)

export type BGMTrack = 'menu' | 'map' | 'battle' | 'boss' | 'tutorial' | 'story' | 'online';

export class BGMGenerator {
    private static audioTracks: Record<BGMTrack, HTMLAudioElement | null> = {
        menu: null,
        map: null,
        battle: null,
        boss: null,
        tutorial: null,
        story: null,
        online: null
    };
    
    private static currentTrack: BGMTrack = 'menu';
    private static isPlaying: boolean = false;
    private static isEnabled: boolean = true;
    private static volume: number = 0.55;
    private static initialized: boolean = false;

    private static initAudio() {
        if (this.initialized || typeof window === 'undefined') return;
        this.initialized = true;

        const files: Record<BGMTrack, string> = {
            menu: './audio/bgm_zen.wav',
            map: './audio/bgm_zen.wav',
            battle: './audio/bgm_battle.wav',
            boss: './audio/bgm_battle.wav',
            tutorial: './audio/bgm_zen.wav',
            story: './audio/bgm_battle.wav',
            online: './audio/bgm_battle.wav'
        };

        for (const [key, path] of Object.entries(files)) {
            const track = key as BGMTrack;
            this.audioTracks[track] = new Audio(path);
            if (this.audioTracks[track]) {
                this.audioTracks[track]!.loop = true;
                this.audioTracks[track]!.volume = this.volume;
            }
        }

        // Desbloquear en primera interacción de usuario
        const unlock = () => {
            if (this.isEnabled && this.isPlaying) {
                this.getActiveAudio()?.play().catch(() => {});
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
    }

    private static getActiveAudio(): HTMLAudioElement | null {
        return this.audioTracks[this.currentTrack];
    }


    public static setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        Object.values(this.audioTracks).forEach(audio => {
            if (audio) audio.volume = this.volume;
        });
    }

    public static setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        if (!this.isEnabled) {
            this.stop();
        } else {
            this.start();
        }
    }

    public static playMap() { this.setTrack('map'); }
    public static playBattle() { this.setTrack('battle'); }
    public static playMenu() { this.setTrack('menu'); }
    public static playBoss() { this.setTrack('boss'); }
    public static playTutorial() { this.setTrack('tutorial'); }
    public static playStory() { this.setTrack('story'); }
    public static playOnline() { this.setTrack('online'); }

    public static setTrack(track: BGMTrack) {
        this.initAudio();
        if (this.currentTrack === track && this.isPlaying) return;

        const previousAudio = this.getActiveAudio();
        this.currentTrack = track;
        const nextAudio = this.getActiveAudio();

        if (this.isEnabled) {
            this.isPlaying = true;
            if (previousAudio && previousAudio !== nextAudio) {
                // Fade out previo
                this.fadeOut(previousAudio, 600, () => {
                    previousAudio.pause();
                    previousAudio.currentTime = 0;
                });
            }
            if (nextAudio) {
                nextAudio.volume = 0;
                nextAudio.play().then(() => {
                    this.fadeIn(nextAudio, this.volume, 800);
                }).catch(() => {
                    // Esperar interacción de usuario si el navegador bloquea autoplay
                });
            }
        }
    }

    public static start() {
        this.initAudio();
        if (!this.isEnabled) return;
        this.isPlaying = true;
        const active = this.getActiveAudio();
        if (active) {
            active.volume = this.volume;
            active.play().catch(() => {});
        }
    }

    public static stop() {
        this.isPlaying = false;
        Object.values(this.audioTracks).forEach(audio => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }

    private static fadeIn(audio: HTMLAudioElement, targetVol: number, durationMs: number) {
        const stepTime = 40;
        const steps = durationMs / stepTime;
        const delta = targetVol / steps;
        let cur = 0;

        const timer = window.setInterval(() => {
            cur += delta;
            if (cur >= targetVol) {
                audio.volume = targetVol;
                window.clearInterval(timer);
            } else {
                audio.volume = Math.min(targetVol, cur);
            }
        }, stepTime);
    }

    private static fadeOut(audio: HTMLAudioElement, durationMs: number, onComplete?: () => void) {
        const startVol = audio.volume;
        const stepTime = 40;
        const steps = durationMs / stepTime;
        const delta = startVol / steps;
        let cur = startVol;

        const timer = window.setInterval(() => {
            cur -= delta;
            if (cur <= 0.01) {
                audio.volume = 0;
                window.clearInterval(timer);
                if (onComplete) onComplete();
            } else {
                audio.volume = Math.max(0, cur);
            }
        }, stepTime);
    }
}
