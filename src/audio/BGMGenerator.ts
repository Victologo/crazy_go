// BGMGenerator.ts - Reproductor de Banda Sonora Tradicional Japonesa Acústica
// Carga y reproduce de forma fluida y sin cortes las pistas de ambiente zen y combate japonés (Koto, Shō y Shakuhachi)

export type BGMTrack = 'map' | 'battle';

export class BGMGenerator {
    private static audioMap: HTMLAudioElement | null = null;
    private static audioBattle: HTMLAudioElement | null = null;
    private static currentTrack: BGMTrack = 'map';
    private static isPlaying: boolean = false;
    private static isEnabled: boolean = true;
    private static volume: number = 0.55;
    private static initialized: boolean = false;

    private static initAudio() {
        if (this.initialized || typeof window === 'undefined') return;
        this.initialized = true;

        this.audioMap = new Audio('/audio/bgm_zen.wav');
        this.audioMap.loop = true;
        this.audioMap.volume = this.volume;

        this.audioBattle = new Audio('/audio/bgm_battle.wav');
        this.audioBattle.loop = true;
        this.audioBattle.volume = this.volume;

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
        return this.currentTrack === 'battle' ? this.audioBattle : this.audioMap;
    }


    public static setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.audioMap) this.audioMap.volume = this.volume;
        if (this.audioBattle) this.audioBattle.volume = this.volume;
    }

    public static setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        if (!this.isEnabled) {
            this.stop();
        } else {
            this.start();
        }
    }

    public static playMap() {
        this.setTrack('map');
    }

    public static playBattle() {
        this.setTrack('battle');
    }

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
        if (this.audioMap) {
            this.audioMap.pause();
            this.audioMap.currentTime = 0;
        }
        if (this.audioBattle) {
            this.audioBattle.pause();
            this.audioBattle.currentTime = 0;
        }
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
