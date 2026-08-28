// BGMGenerator.ts - Reproductor de Banda Sonora Tradicional Japonesa Acústica
// Carga y reproduce de forma fluida y sin cortes pistas temáticas y capas ambientales adaptativas para cada escenario de combate

export type BGMTrack = 'menu' | 'map' | 'combat' | 'dojo' | 'meadow' | 'sunset' | 'night' | 'void' | 'zen' | 'volcano' | 'boss' | 'tutorial' | 'story' | 'online' | 'oni' | 'sky';

export class BGMGenerator {
    private static audioInstances: Map<string, HTMLAudioElement> = new Map();
    
    private static currentTrack: BGMTrack = 'menu';
    private static currentFilePath: string | null = null;
    private static isPlaying: boolean = false;
    private static isEnabled: boolean = true;
    private static volume: number = 0.6;
    private static initialized: boolean = false;

    private static readonly TRACK_MAP: Record<BGMTrack, string> = {
        menu: './audio/bgm_zen.wav',
        map: './audio/bgm_zen.wav',
        combat: './audio/bgm_battle.wav',
        dojo: './audio/bgm_battle.wav',
        meadow: './audio/bgm_zen.wav',
        sunset: './audio/bgm_zen.wav',
        night: './audio/bgm_zen.wav',
        void: './audio/bgm_battle.wav',
        zen: './audio/bgm_zen.wav',
        volcano: './audio/bgm_battle.wav',
        boss: './audio/bgm_battle.wav',
        oni: './audio/bgm_battle.wav',
        sky: './audio/bgm_battle.wav',
        tutorial: './audio/bgm_zen.wav',
        story: './audio/bgm_battle.wav',
        online: './audio/bgm_battle.wav'
    };

    // Sintetizador ambiental procedural Web Audio por escenario
    private static ambientCtx: AudioContext | null = null;
    private static ambientMasterGain: GainNode | null = null;
    private static ambientNodes: { stop: () => void }[] = [];
    private static ambientIntervalId: number | null = null;

    private static getOrCreateAudio(filePath: string): HTMLAudioElement | null {
        if (typeof window === 'undefined') return null;
        let audio = this.audioInstances.get(filePath);
        if (!audio) {
            audio = new Audio(filePath);
            audio.loop = true;
            audio.preload = 'auto';
            audio.volume = this.volume;
            audio.addEventListener('error', (e) => {
                console.warn(`[BGMGenerator] Audio load notice for ${filePath}:`, e);
            });
            this.audioInstances.set(filePath, audio);
        }
        return audio;
    }

    private static initAudio() {
        if (this.initialized || typeof window === 'undefined') return;
        this.initialized = true;

        // Desbloquear en primera interacción de usuario
        const unlock = () => {
            if (this.isEnabled && this.isPlaying) {
                const currentAudio = this.getCurrentAudio();
                if (currentAudio && currentAudio.paused) {
                    currentAudio.play().catch(() => {});
                }
                this.startAmbientLayer(this.currentTrack);
            }
        };
        window.addEventListener('click', unlock, { capture: true, passive: true });
        window.addEventListener('keydown', unlock, { capture: true, passive: true });
        window.addEventListener('touchstart', unlock, { capture: true, passive: true });
    }

    private static getCurrentAudio(): HTMLAudioElement | null {
        if (!this.currentFilePath) return null;
        return this.audioInstances.get(this.currentFilePath) || null;
    }

    private static getAmbientContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ambientCtx) {
            try {
                const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (AudioCtx) {
                    this.ambientCtx = new AudioCtx();
                    this.ambientMasterGain = this.ambientCtx.createGain();
                    this.ambientMasterGain.gain.setValueAtTime(this.volume * 0.45, this.ambientCtx.currentTime);
                    this.ambientMasterGain.connect(this.ambientCtx.destination);
                }
            } catch (_) {}
        }
        if (this.ambientCtx && this.ambientCtx.state === 'suspended') {
            this.ambientCtx.resume().catch(() => {});
        }
        return this.ambientCtx;
    }

    public static setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        this.audioInstances.forEach(audio => {
            if (audio) audio.volume = this.volume;
        });
        if (this.ambientMasterGain && this.ambientCtx) {
            this.ambientMasterGain.gain.setValueAtTime(this.volume * 0.45, this.ambientCtx.currentTime);
        }
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
    public static playCombat() { this.setTrack('combat'); }
    public static playMenu() { this.setTrack('menu'); }
    public static playBoss() { this.setTrack('boss'); }
    public static playTutorial() { this.setTrack('tutorial'); }
    public static playStory() { this.setTrack('story'); }
    public static playOnline() { this.setTrack('online'); }

    public static playBackground(bgId: string) {
        const cleanBgId = bgId.replace(/^bg_/, '');
        const validTracks: BGMTrack[] = ['dojo', 'meadow', 'sunset', 'night', 'void', 'zen', 'volcano', 'boss', 'tutorial', 'story', 'online', 'combat', 'oni', 'sky'];
        if (validTracks.includes(cleanBgId as BGMTrack)) {
            this.setTrack(cleanBgId as BGMTrack);
        } else {
            this.setTrack('combat');
        }
    }

    public static setTrack(track: BGMTrack) {
        this.initAudio();
        const nextFilePath = this.TRACK_MAP[track] || './audio/bgm_battle.wav';
        const isSameFile = this.currentFilePath === nextFilePath;
        
        this.currentTrack = track;

        // Si ya estamos reproduciendo la misma pista de audio, mantenerla continua sin cortes ni re-peticiones de red
        if (isSameFile && this.isPlaying) {
            const currentAudio = this.getCurrentAudio();
            if (currentAudio && currentAudio.paused && this.isEnabled) {
                currentAudio.play().catch(() => {});
            }
            this.startAmbientLayer(track);
            return;
        }

        const previousAudio = this.getCurrentAudio();
        this.currentFilePath = nextFilePath;
        const nextAudio = this.getOrCreateAudio(nextFilePath);

        if (this.isEnabled) {
            this.isPlaying = true;
            if (previousAudio && previousAudio !== nextAudio) {
                this.fadeOut(previousAudio, 500, () => {
                    previousAudio.pause();
                    previousAudio.currentTime = 0;
                });
            }
            if (nextAudio) {
                nextAudio.volume = 0;
                nextAudio.play().then(() => {
                    this.fadeIn(nextAudio, this.volume, 600);
                }).catch(() => {});
            }
            this.startAmbientLayer(track);
        }
    }

    public static start() {
        this.initAudio();
        if (!this.isEnabled) return;
        this.isPlaying = true;
        if (!this.currentFilePath) {
            this.currentFilePath = this.TRACK_MAP[this.currentTrack] || './audio/bgm_zen.wav';
        }
        const active = this.getOrCreateAudio(this.currentFilePath);
        if (active) {
            active.volume = this.volume;
            active.play().catch(() => {});
        }
        this.startAmbientLayer(this.currentTrack);
    }

    public static stop() {
        this.isPlaying = false;
        this.audioInstances.forEach(audio => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        this.stopAmbientLayer();
    }

    /**
     * Inicia una capa de sintetizador acústico ambiental generativo propio de cada escenario
     */
    private static startAmbientLayer(track: BGMTrack) {
        this.stopAmbientLayer();
        if (!this.isEnabled) return;

        const ctx = this.getAmbientContext();
        if (!ctx || !this.ambientMasterGain) return;

        const dest = this.ambientMasterGain;

        switch (track) {
            case 'volcano': {
                // Drone profundo de magma + pulsaciones de calor
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(55, ctx.currentTime);

                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(110, ctx.currentTime);

                gain.gain.setValueAtTime(0.001, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.2);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(dest);

                osc.start();
                this.ambientNodes.push({
                    stop: () => {
                        try {
                            gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
                            setTimeout(() => { try { osc.stop(); } catch (_) {} }, 600);
                        } catch (_) {}
                    }
                });

                // Crujidos y brasas periódicas suaves
                this.ambientIntervalId = window.setInterval(() => {
                    if (!this.isPlaying) return;
                    this.playAmbientEmber(ctx, dest);
                }, 3800);
                break;
            }
            case 'oni':
            case 'void': {
                // Drone abisal místico en quinta justa baja
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(65.41, ctx.currentTime); // Do2 grave

                gain.gain.setValueAtTime(0.001, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.0);

                osc.connect(gain);
                gain.connect(dest);
                osc.start();

                this.ambientNodes.push({
                    stop: () => {
                        try {
                            gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
                            setTimeout(() => { try { osc.stop(); } catch (_) {} }, 600);
                        } catch (_) {}
                    }
                });

                // Campana carmesí espectral periódica
                this.ambientIntervalId = window.setInterval(() => {
                    if (!this.isPlaying) return;
                    this.playAmbientVoidChime(ctx, dest);
                }, 5200);
                break;
            }
            case 'sky': {
                // Armónicos etéreos celestiales
                this.ambientIntervalId = window.setInterval(() => {
                    if (!this.isPlaying) return;
                    this.playAmbientSkyArpeggio(ctx, dest);
                }, 4200);
                break;
            }
            case 'boss': {
                // Tensión de tambor Taiko rítmico de fondo
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(45, ctx.currentTime);

                gain.gain.setValueAtTime(0.001, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 0.8);

                osc.connect(gain);
                gain.connect(dest);
                osc.start();

                this.ambientNodes.push({
                    stop: () => {
                        try {
                            gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
                            setTimeout(() => { try { osc.stop(); } catch (_) {} }, 500);
                        } catch (_) {}
                    }
                });
                break;
            }
            case 'night': {
                // Brisa y campanillas nocturnas sutiles
                this.ambientIntervalId = window.setInterval(() => {
                    if (!this.isPlaying) return;
                    this.playAmbientWindChime(ctx, dest);
                }, 4500);
                break;
            }
            case 'sunset': {
                // Koto crepuscular cálido
                this.ambientIntervalId = window.setInterval(() => {
                    if (!this.isPlaying) return;
                    this.playAmbientKotoPluck(ctx, dest);
                }, 5000);
                break;
            }
            case 'zen':
            case 'dojo':
            case 'tutorial': {
                // Cuenco tibetano de meditación
                this.ambientIntervalId = window.setInterval(() => {
                    if (!this.isPlaying) return;
                    this.playAmbientSingingBowl(ctx, dest);
                }, 6000);
                break;
            }
            default:
                // Escenario estándar de combate
                break;
        }
    }

    private static stopAmbientLayer() {
        if (this.ambientIntervalId !== null) {
            window.clearInterval(this.ambientIntervalId);
            this.ambientIntervalId = null;
        }
        this.ambientNodes.forEach(node => node.stop());
        this.ambientNodes = [];
    }

    private static playAmbientEmber(ctx: AudioContext, dest: GainNode) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        osc.connect(gain);
        gain.connect(dest);
        try {
            osc.start(now);
            osc.stop(now + 0.6);
        } catch (_) {}
    }

    private static playAmbientVoidChime(ctx: AudioContext, dest: GainNode) {
        const now = ctx.currentTime;
        const freqs = [329.63, 440.0];
        const f = freqs[Math.floor(Math.random() * freqs.length)];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.98, now + 1.8);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(gain);
        gain.connect(dest);
        try {
            osc.start(now);
            osc.stop(now + 1.8);
        } catch (_) {}
    }

    private static playAmbientSkyArpeggio(ctx: AudioContext, dest: GainNode) {
        const now = ctx.currentTime;
        const notes = [659.25, 880.0, 1174.66, 1567.98];
        notes.forEach((freq, idx) => {
            const st = now + idx * 0.12;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, st);

            gain.gain.setValueAtTime(0.0001, st);
            gain.gain.linearRampToValueAtTime(0.16, st + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.9);

            osc.connect(gain);
            gain.connect(dest);
            try {
                osc.start(st);
                osc.stop(st + 0.9);
            } catch (_) {}
        });
    }

    private static playAmbientWindChime(ctx: AudioContext, dest: GainNode) {
        const now = ctx.currentTime;
        const notes = [880.0, 987.77, 1318.51, 1760.0];
        const f = notes[Math.floor(Math.random() * notes.length)];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        osc.connect(gain);
        gain.connect(dest);
        try {
            osc.start(now);
            osc.stop(now + 1.4);
        } catch (_) {}
    }

    private static playAmbientKotoPluck(ctx: AudioContext, dest: GainNode) {
        const now = ctx.currentTime;
        const freqs = [440.0, 493.88, 554.37, 659.25, 739.99];
        const f = freqs[Math.floor(Math.random() * freqs.length)];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.97, now + 1.2);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(dest);
        try {
            osc.start(now);
            osc.stop(now + 1.2);
        } catch (_) {}
    }

    private static playAmbientSingingBowl(ctx: AudioContext, dest: GainNode) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432.0, now); // Frecuencia de meditación natural

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

        osc.connect(gain);
        gain.connect(dest);
        try {
            osc.start(now);
            osc.stop(now + 2.4);
        } catch (_) {}
    }

    private static fadeIn(audio: HTMLAudioElement, targetVol: number, durationMs: number) {
        if ((audio as any)._fadeTimer) {
            window.clearInterval((audio as any)._fadeTimer);
            (audio as any)._fadeTimer = null;
        }

        const stepTime = 40;
        const steps = Math.max(1, durationMs / stepTime);
        const delta = targetVol / steps;
        let cur = audio.volume;

        const timer = window.setInterval(() => {
            cur += delta;
            if (cur >= targetVol) {
                audio.volume = targetVol;
                window.clearInterval(timer);
                (audio as any)._fadeTimer = null;
            } else {
                audio.volume = Math.min(targetVol, cur);
            }
        }, stepTime);
        (audio as any)._fadeTimer = timer;
    }

    private static fadeOut(audio: HTMLAudioElement, durationMs: number, onComplete?: () => void) {
        if ((audio as any)._fadeTimer) {
            window.clearInterval((audio as any)._fadeTimer);
            (audio as any)._fadeTimer = null;
        }

        const startVol = audio.volume;
        const stepTime = 40;
        const steps = Math.max(1, durationMs / stepTime);
        const delta = startVol / steps;
        let cur = startVol;

        const timer = window.setInterval(() => {
            cur -= delta;
            if (cur <= 0.01) {
                audio.volume = 0;
                window.clearInterval(timer);
                (audio as any)._fadeTimer = null;
                if (onComplete) onComplete();
            } else {
                audio.volume = Math.max(0, cur);
            }
        }, stepTime);
        (audio as any)._fadeTimer = timer;
    }
}

