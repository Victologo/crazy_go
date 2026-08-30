import { SoundFX } from './SoundFX';

// BGMGenerator.ts - Reproductor de Banda Sonora Tradicional Japonesa Acústica
// Carga y reproduce de forma fluida y sin cortes pistas temáticas y un motor de composición procedural WebAudio para cada escenario

export type BGMTrack = 'menu' | 'map' | 'combat' | 'dojo' | 'meadow' | 'sunset' | 'night' | 'void' | 'zen' | 'volcano' | 'boss' | 'tutorial' | 'story' | 'online' | 'oni' | 'sky';

export class BGMGenerator {
    private static audioInstances: Map<string, HTMLAudioElement> = new Map();
    
    private static currentTrack: BGMTrack = 'menu';
    private static currentFilePath: string | null = null;
    private static isPlaying: boolean = false;
    private static isEnabled: boolean = true;
    private static _masterVolume: number = 0.85;
    private static _bgmVolume: number = 1.0;
    private static initialized: boolean = false;

    static {
        try {
            const savedVol = localStorage.getItem('crazygo_audio_volume');
            if (savedVol !== null) this._masterVolume = Math.max(0, Math.min(1, parseFloat(savedVol)));

            const savedBgmVol = localStorage.getItem('crazygo_audio_bgm_vol');
            if (savedBgmVol !== null) this._bgmVolume = Math.max(0, Math.min(1, parseFloat(savedBgmVol)));

            const savedBgm = localStorage.getItem('crazygo_audio_bgm');
            if (savedBgm !== null) this.isEnabled = savedBgm === 'true';
        } catch (_) {}
    }

    private static get volume(): number {
        return this.isEnabled ? this._masterVolume * this._bgmVolume : 0;
    }

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

    // Sintetizador acústico procedural Web Audio por escenario
    private static ambientMasterGain: GainNode | null = null;
    private static ambientNodes: { stop: () => void }[] = [];
    private static ambientIntervalId: number | null = null;
    private static sequenceStep: number = 0;

    private static getOrCreateAudio(filePath: string): HTMLAudioElement | null {
        if (typeof window === 'undefined') return null;
        let audio = this.audioInstances.get(filePath);
        if (!audio) {
            audio = new Audio(filePath);
            audio.loop = true;
            audio.preload = 'auto';
            audio.volume = this.volume;
            audio.addEventListener('error', () => {
                // Fallback automático si la ruta relativa falla en Vite dev server vs Electron
                const altPath = filePath.startsWith('./') ? filePath.replace(/^\.\//, '/') : (filePath.startsWith('/') ? '.' + filePath : filePath);
                if (audio && audio.src !== altPath) {
                    audio.src = altPath;
                }
            });
            this.audioInstances.set(filePath, audio);
        }
        return audio;
    }

    private static initAudio() {
        if (this.initialized || typeof window === 'undefined') return;
        this.initialized = true;

        SoundFX.attachUnlockListeners();

        // Desbloquear en primera interacción de usuario (garantiza superar la Autoplay Policy del navegador)
        const unlock = () => {
            SoundFX.unlockAudio();
            const ctx = SoundFX.getContext();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
            if (this.isEnabled && this.isPlaying) {
                const currentAudio = this.getCurrentAudio();
                if (currentAudio && currentAudio.paused) {
                    currentAudio.play().catch(() => {});
                }
                this.startAmbientLayer(this.currentTrack);
            }
            window.removeEventListener('click', unlock, { capture: true } as any);
            window.removeEventListener('keydown', unlock, { capture: true } as any);
            window.removeEventListener('pointerdown', unlock, { capture: true } as any);
            window.removeEventListener('touchstart', unlock, { capture: true } as any);
        };
        window.addEventListener('click', unlock, { capture: true, passive: true });
        window.addEventListener('keydown', unlock, { capture: true, passive: true });
        window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
        window.addEventListener('touchstart', unlock, { capture: true, passive: true });
    }

    private static getCurrentAudio(): HTMLAudioElement | null {
        if (!this.currentFilePath) return null;
        return this.audioInstances.get(this.currentFilePath) || null;
    }

    private static getAmbientContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        const ctx = SoundFX.getContext();
        if (!ctx) return null;

        if (!this.ambientMasterGain) {
            try {
                this.ambientMasterGain = ctx.createGain();
                this.ambientMasterGain.gain.setValueAtTime(this.volume * 0.95, ctx.currentTime);
                this.ambientMasterGain.connect(ctx.destination);
            } catch (_) {}
        }
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    public static setMasterVolume(vol: number) {
        this._masterVolume = Math.max(0, Math.min(1, vol));
        this.updateVolume();
    }

    public static setBGMVolume(vol: number) {
        this._bgmVolume = Math.max(0, Math.min(1, vol));
        this.updateVolume();
    }

    private static updateVolume() {
        this.audioInstances.forEach(audio => {
            if (audio) audio.volume = this.volume;
        });
        const ctx = SoundFX.getContext();
        if (this.ambientMasterGain && ctx) {
            try {
                this.ambientMasterGain.gain.setValueAtTime(this.volume * 0.95, ctx.currentTime);
            } catch (_) {}
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

    private static getPlaybackRateForTrack(track: BGMTrack): number {
        switch (track) {
            case 'night': return 0.78; // Noche mística y relajante
            case 'sunset': return 0.88; // Atardecer crepuscular cálido
            case 'void': return 0.70; // Vacío cósmico abisal y etéreo
            case 'volcano': return 1.18; // Volcán de lava y adrenalina acelerada
            case 'dojo': return 1.08; // Combate marcial y kendo ágil
            case 'zen': return 0.92; // Meditación zen equilibrada
            case 'meadow': return 1.02; // Naturaleza pura
            case 'boss': return 1.15;
            case 'oni': return 0.80;
            default: return 1.0;
        }
    }

    public static setTrack(track: BGMTrack) {
        this.initAudio();
        const nextFilePath = this.TRACK_MAP[track] || './audio/bgm_battle.wav';
        const isSameFile = this.currentFilePath === nextFilePath;
        const targetRate = this.getPlaybackRateForTrack(track);
        
        this.currentTrack = track;

        // Modular velocidad/tono del archivo base y arrancar la orquesta procedural del escenario inmediatamente
        if (isSameFile && this.isPlaying) {
            const currentAudio = this.getCurrentAudio();
            if (currentAudio) {
                currentAudio.playbackRate = targetRate;
                if (currentAudio.paused && this.isEnabled) {
                    currentAudio.play().catch(() => {});
                }
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
                this.fadeOut(previousAudio, 300, () => {
                    previousAudio.pause();
                    previousAudio.currentTime = 0;
                });
            }
            if (nextAudio) {
                nextAudio.playbackRate = targetRate;
                nextAudio.volume = 0;
                nextAudio.play().then(() => {
                    this.fadeIn(nextAudio, this.volume, 400);
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
            active.playbackRate = this.getPlaybackRateForTrack(this.currentTrack);
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
     * Inicia el secuenciador generativo tradicional japonés con instrumentos y escalas exclusivas de cada escenario
     */
    private static startAmbientLayer(track: BGMTrack) {
        this.stopAmbientLayer();
        if (!this.isEnabled) return;

        const ctx = this.getAmbientContext();
        if (!ctx || !this.ambientMasterGain) return;

        const dest = this.ambientMasterGain;
        this.sequenceStep = 0;

        // 1. Drones y Fondos Atmosféricos Continuos por Escenario
        switch (track) {
            case 'volcano': {
                // Drone magma abrasador continuo
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(55, ctx.currentTime);
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(120, ctx.currentTime);
                gain.gain.setValueAtTime(0.001, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.0);
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(dest);
                osc.start();
                this.ambientNodes.push({
                    stop: () => {
                        try {
                            gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
                            setTimeout(() => { try { osc.stop(); } catch (_) {} }, 400);
                        } catch (_) {}
                    }
                });
                break;
            }
            case 'oni':
            case 'void': {
                // Drone abisal místico en quinta justa profunda
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(65.41, ctx.currentTime); // C2
                gain.gain.setValueAtTime(0.001, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 1.2);
                osc.connect(gain);
                gain.connect(dest);
                osc.start();
                this.ambientNodes.push({
                    stop: () => {
                        try {
                            gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
                            setTimeout(() => { try { osc.stop(); } catch (_) {} }, 400);
                        } catch (_) {}
                    }
                });
                break;
            }
            case 'zen':
            case 'tutorial': {
                // Drone de meditación en 432 Hz
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(108, ctx.currentTime);
                gain.gain.setValueAtTime(0.001, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.5);
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
            default:
                break;
        }

        // 2. Secuenciador Melódico y Rítmico en Tiempo Real (Step Clock)
        // Desactivado a petición del usuario por resultar repetitivo
        // const intervalTimeMs = (track === 'volcano' || track === 'boss' || track === 'dojo') ? 480 : 950;
        // this.stepSequencer(track, ctx, dest);
        // this.ambientIntervalId = window.setInterval(() => {
        //     if (!this.isPlaying) return;
        //     this.stepSequencer(track, ctx, dest);
        // }, intervalTimeMs);
    }

    private static stopAmbientLayer() {
        if (this.ambientIntervalId !== null) {
            window.clearInterval(this.ambientIntervalId);
            this.ambientIntervalId = null;
        }
        this.ambientNodes.forEach(node => node.stop());
        this.ambientNodes = [];
    }

    /**
     * Secuenciador por pasos que ejecuta la melodía y rítmica distintiva de cada escenario
     */
    // @ts-ignore
    private static stepSequencer(track: BGMTrack, ctx: AudioContext, dest: GainNode) {
        const step = this.sequenceStep++;
        const now = ctx.currentTime;

        switch (track) {
            case 'volcano': {
                // 🌋 Volcán: Taiko de guerra acelerado (Don-Don-Ka-Don) + Brasas
                const beat = step % 8;
                if (beat === 0 || beat === 3 || beat === 6) {
                    this.playTaikoDrum(ctx, dest, 'bass', now, 1.2);
                } else if (beat === 2 || beat === 7) {
                    this.playTaikoDrum(ctx, dest, 'rim', now, 0.9);
                }
                if (step % 5 === 0) {
                    this.playAmbientEmber(ctx, dest);
                }
                break;
            }
            case 'dojo': {
                // 🥋 Dojo: Ritmo marcial de Kendo + Shamisen en escala Insen (D, Eb, G, A, C)
                const beat = step % 8;
                if (beat === 0 || beat === 4) {
                    this.playTaikoDrum(ctx, dest, 'bass', now, 0.9);
                } else if (beat === 2 || beat === 6) {
                    this.playTaikoDrum(ctx, dest, 'rim', now, 0.7);
                }
                // Shamisen melódico
                const insenScale = [293.66, 311.13, 392.0, 440.0, 523.25, 587.33];
                const note = insenScale[step % insenScale.length];
                this.playKotoPluck(ctx, dest, note, now, 0.45);
                break;
            }
            case 'night': {
                // 🌙 Noche: Escala Iwato (B, C, E, F, A) lenta y meditativa + Campanillas de Viento
                const iwatoScale = [246.94, 261.63, 329.63, 349.23, 440.0, 493.88];
                if (step % 2 === 0) {
                    const note = iwatoScale[(step / 2) % iwatoScale.length];
                    this.playKotoPluck(ctx, dest, note, now, 1.4);
                }
                if (step % 3 === 0) {
                    this.playAmbientWindChime(ctx, dest);
                }
                break;
            }
            case 'sunset': {
                // 🌅 Atardecer: Escala Kokinjoshi (D, Eb, G, A, Bb) cálida + Flauta Shakuhachi
                const kokinScale = [293.66, 311.13, 392.0, 440.0, 466.16, 587.33];
                const note = kokinScale[step % kokinScale.length];
                this.playKotoPluck(ctx, dest, note, now, 1.1);
                if (step % 4 === 0) {
                    this.playShakuhachiTrill(ctx, dest, kokinScale[(step + 2) % kokinScale.length], now);
                }
                break;
            }
            case 'meadow': {
                // 🍃 Pradera: Escala Hirajoshi (C, D, Eb, G, Ab) viva y pastoral + Flauta Shinobue
                const hiraScale = [261.63, 293.66, 311.13, 392.0, 415.3, 523.25];
                const note = hiraScale[step % hiraScale.length];
                this.playKotoPluck(ctx, dest, note, now, 0.7);
                if (step % 3 === 0) {
                    this.playAmbientMeadowBreeze(ctx, dest);
                }
                break;
            }
            case 'zen':
            case 'tutorial': {
                // 🧘 Templo Zen: Cuencos tibetanos sagrados (432Hz) + Gota de agua Suikinkutsu
                if (step % 3 === 0) {
                    this.playAmbientSingingBowl(ctx, dest);
                } else if (step % 2 === 1) {
                    this.playSuikinkutsuWaterDrop(ctx, dest, now);
                }
                break;
            }
            case 'void':
            case 'oni': {
                // 🌌 Vacío / Oni: Gong de bronce oscuro + Campanas abisales
                if (step % 4 === 0) {
                    this.playBronzeGong(ctx, dest, now);
                } else {
                    this.playAmbientVoidChime(ctx, dest);
                }
                break;
            }
            case 'sky': {
                // ☁️ Cielo: Arpegios celestiales cristalinos flotantes
                this.playAmbientSkyArpeggio(ctx, dest);
                break;
            }
            case 'boss': {
                // 🐉 Dragón Boss: Tambor de guerra + Gong + Melodía dramática de Koto
                const beat = step % 8;
                if (beat === 0 || beat === 2 || beat === 4 || beat === 6) {
                    this.playTaikoDrum(ctx, dest, 'bass', now, 1.4);
                } else {
                    this.playTaikoDrum(ctx, dest, 'rim', now, 1.0);
                }
                if (beat === 0 && step % 16 === 0) {
                    this.playBronzeGong(ctx, dest, now);
                }
                const bossScale = [220.0, 246.94, 261.63, 329.63, 349.23, 440.0];
                this.playKotoPluck(ctx, dest, bossScale[step % bossScale.length], now, 0.4);
                break;
            }
            default: {
                // Combate estándar
                if (step % 4 === 0) {
                    this.playTaikoDrum(ctx, dest, 'bass', now, 0.8);
                }
                break;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SINTETIZADORES DE INSTRUMENTOS TRADICIONALES JAPONESES (WebAudio Acústico)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Tambor Taiko Tradicional Japonés (O-Daiko grave y Shime-Daiko agudo)
     */
    private static playTaikoDrum(ctx: AudioContext, dest: GainNode, type: 'bass' | 'rim', time: number, intensity: number = 1.0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        if (type === 'bass') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, time);
            osc.frequency.exponentialRampToValueAtTime(42, time + 0.35);
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.38 * intensity, time + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, time);
            osc.frequency.exponentialRampToValueAtTime(90, time + 0.18);
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.24 * intensity, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
        }

        osc.connect(gain);
        gain.connect(dest);
        try {
            osc.start(time);
            osc.stop(time + (type === 'bass' ? 0.45 : 0.22));
        } catch (_) {}
    }

    /**
     * Cítara Koto / Shamisen Japonesa (Síntesis armónica pulsada con decay de madera)
     */
    private static playKotoPluck(ctx: AudioContext, dest: GainNode, freq: number, time: number, duration: number = 1.0) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, time);
        osc1.frequency.exponentialRampToValueAtTime(freq * 0.99, time + duration);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, time); // 2º armónico brillante

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.28, time + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(dest);

        try {
            osc1.start(time);
            osc2.start(time);
            osc1.stop(time + duration);
            osc2.stop(time + duration);
        } catch (_) {}
    }

    /**
     * Flauta de Bambú Shakuhachi con inflexión expresiva y vibrato
     */
    private static playShakuhachiTrill(ctx: AudioContext, dest: GainNode, freq: number, time: number) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.04, time); // Ataque con flexión tradicional
        osc.frequency.linearRampToValueAtTime(freq, time + 0.15);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.22, time + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);

        osc.connect(gain);
        gain.connect(dest);
        try {
            osc.start(time);
            osc.stop(time + 1.2);
        } catch (_) {}
    }

    /**
     * Cuenco Tibetano de Meditación (Singing Bowl) en 432 Hz
     */
    private static playAmbientSingingBowl(ctx: AudioContext, dest: GainNode) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(432.0, now);

        oscHarmonic.type = 'sine';
        oscHarmonic.frequency.setValueAtTime(864.0, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.26, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(dest);
        try {
            osc.start(now);
            oscHarmonic.start(now);
            osc.stop(now + 3.2);
            oscHarmonic.stop(now + 3.2);
        } catch (_) {}
    }

    /**
     * Gota de Agua Suikinkutsu (Jardín Zen)
     */
    private static playSuikinkutsuWaterDrop(ctx: AudioContext, dest: GainNode, time: number) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startF = 1400 + Math.random() * 400;
        osc.frequency.setValueAtTime(startF, time);
        osc.frequency.exponentialRampToValueAtTime(startF * 1.6, time + 0.08);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(0.18, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);

        osc.connect(gain);
        gain.connect(dest);
        try {
            osc.start(time);
            osc.stop(time + 0.25);
        } catch (_) {}
    }

    /**
     * Gran Gong de Bronce Sagrado (Templo y Vacío)
     */
    private static playBronzeGong(ctx: AudioContext, dest: GainNode, time: number) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(82.41, time); // E2
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(164.81, time);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + 2.5);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.32, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.8);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        try {
            osc1.start(time);
            osc2.start(time);
            osc1.stop(time + 2.8);
            osc2.stop(time + 2.8);
        } catch (_) {}
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
        const freqs = [329.63, 440.0, 587.33];
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
        gain.gain.linearRampToValueAtTime(0.16, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        osc.connect(gain);
        gain.connect(dest);
        try {
            osc.start(now);
            osc.stop(now + 1.4);
        } catch (_) {}
    }

    private static playAmbientMeadowBreeze(ctx: AudioContext, dest: GainNode) {
        const now = ctx.currentTime;
        const notes = [523.25, 587.33, 659.25, 783.99, 880.0];
        const f = notes[Math.floor(Math.random() * notes.length)];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.linearRampToValueAtTime(f * 1.03, now + 0.15);
        osc.frequency.linearRampToValueAtTime(f, now + 0.35);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.20, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc.connect(gain);
        gain.connect(dest);
        try {
            osc.start(now);
            osc.stop(now + 0.85);
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
