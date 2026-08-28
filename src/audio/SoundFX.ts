// SoundFX.ts
// Sintetizador acústico de efectos de sonido realistas para Go (Pachik de pizarra/concha, resonancia de kaya, captura y rebobinado)

export class SoundFX {
    private static ctx: AudioContext | null = null;
    private static masterVolume: number = 0.85;
    private static sfxEnabled: boolean = true;
    private static bgmEnabled: boolean = true;

    private static isUnlockListenerAttached: boolean = false;

    static {
        try {
            const savedVol = localStorage.getItem('crazygo_audio_volume');
            if (savedVol !== null) this.masterVolume = Math.max(0, Math.min(1, parseFloat(savedVol)));

            const savedSfx = localStorage.getItem('crazygo_audio_sfx');
            if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';

            const savedBgm = localStorage.getItem('crazygo_audio_bgm');
            if (savedBgm !== null) this.bgmEnabled = savedBgm === 'true';
        } catch (_) {}

        if (typeof window !== 'undefined') {
            this.attachUnlockListeners();
        }
    }

    public static unlockAudio(): void {
        if (typeof window === 'undefined') return;
        try {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
        } catch (_) {}
    }

    public static attachUnlockListeners(): void {
        if (this.isUnlockListenerAttached || typeof window === 'undefined') return;
        this.isUnlockListenerAttached = true;
        const unlock = () => {
            SoundFX.unlockAudio();
        };
        window.addEventListener('click', unlock, { capture: true, passive: true });
        window.addEventListener('keydown', unlock, { capture: true, passive: true });
        window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
        window.addEventListener('touchstart', unlock, { capture: true, passive: true });
    }

    private static saveSettings() {
        try {
            localStorage.setItem('crazygo_audio_volume', this.masterVolume.toString());
            localStorage.setItem('crazygo_audio_sfx', this.sfxEnabled.toString());
            localStorage.setItem('crazygo_audio_bgm', this.bgmEnabled.toString());
        } catch (_) {}
    }

    public static getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        this.attachUnlockListeners();

        if (!this.ctx) {
            try {
                const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            } catch (_) {}
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    public static setMasterVolume(val: number) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        this.saveSettings();
    }

    public static getMasterVolume(): number {
        return this.masterVolume;
    }

    public static setSFXEnabled(val: boolean) {
        this.sfxEnabled = val;
        this.saveSettings();
    }

    public static toggleSFX(): boolean {
        this.sfxEnabled = !this.sfxEnabled;
        this.saveSettings();
        return this.sfxEnabled;
    }

    public static isSFXEnabled(): boolean {
        return this.sfxEnabled;
    }

    public static setBGMEnabled(val: boolean) {
        this.bgmEnabled = val;
        this.saveSettings();
    }

    public static toggleBGM(): boolean {
        this.bgmEnabled = !this.bgmEnabled;
        this.saveSettings();
        return this.bgmEnabled;
    }

    public static isBGMEnabled(): boolean {
        return this.bgmEnabled;
    }

    /**
     * Sonido "Pachik!" auténtico: Impacto seco de la piedra mineral (concha de almeja/pizarra)
     * sobre el tablero de madera de Kaya con resonancia percusiva rica y cálida.
     */
    static playPlaceStone() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const vol = this.masterVolume;

        // 1. Golpe transitorio seco inicial (Impacto de piedra mineral de alta resolución)
        const bufferSize = Math.floor(ctx.sampleRate * 0.02);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.12));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2600 + Math.random() * 400, now);
        noiseFilter.Q.setValueAtTime(3.8, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(Math.max(0.0001, 0.75 * vol), now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // 2. Resonancia percusiva del bloque de madera maciza (Kaya Goban)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Variación sutil de tono natural de madera (entre 290Hz y 350Hz)
        const woodTone = 320 + (Math.random() * 40 - 20);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(woodTone, now);
        osc.frequency.exponentialRampToValueAtTime(85, now + 0.1);

        const baseGain = Math.max(0.0001, 0.65 * vol);
        gain.gain.setValueAtTime(baseGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        // 3. Golpe sordo grave de fondo (thump de masa)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(140, now);
        subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.06);

        subGain.gain.setValueAtTime(Math.max(0.0001, 0.45 * vol), now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);

        try {
            noise.start(now);
            osc.start(now);
            osc.stop(now + 0.1);
            subOsc.start(now);
            subOsc.stop(now + 0.06);
        } catch (_) {}
    }

    /**
     * Sonido de colocación de bloque poliminó (🌿 Germinante, 🀄 Duplicidad 2x1 o 🧱 Monolito 2x2)
     * Impacto macizo con resonancia pesada de piedra tallada.
     */
    static playPolyominoPlace(type: 'sprouting' | 'domino' | 'monolith' = 'domino') {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const vol = this.masterVolume;

        // Doble impacto o impacto colosal según tipo
        const isMonolith = type === 'monolith';
        const duration = isMonolith ? 0.22 : 0.14;

        // 1. Ruido de piedra maciza y mortero
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(isMonolith ? 1800 : 2400, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(300, now + duration);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(Math.max(0.0001, (isMonolith ? 0.85 : 0.7) * vol), now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // 2. Retumbar subsónico pesado
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(isMonolith ? 90 : 160, now);
        subOsc.frequency.exponentialRampToValueAtTime(40, now + duration);

        subGain.gain.setValueAtTime(Math.max(0.0001, (isMonolith ? 0.8 : 0.55) * vol), now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);

        try {
            noise.start(now);
            noise.stop(now + duration);
            subOsc.start(now);
            subOsc.stop(now + duration);
        } catch (_) {}
    }

    /**
     * Sonido de Activación de Habilidad Activa (Qi Surge / Campana Mística)
     */
    static playSkillActivate() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const vol = this.masterVolume;

        // Arpegio místico pentatónico ascendente
        [440.0, 554.37, 659.25, 880.0].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const st = now + idx * 0.04;
            const dur = 0.35;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, st);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, st + dur);

            gain.gain.setValueAtTime(0.0001, st);
            gain.gain.linearRampToValueAtTime(Math.max(0.0001, 0.35 * vol), st + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, st + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            try {
                osc.start(st);
                osc.stop(st + dur);
            } catch (_) {}
        });
    }

    /**
     * Sonido de Cancelación / Desactivación de Modo Apuntar Habilidad
     */
    static playSkillDeactivate() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

        gain.gain.setValueAtTime(Math.max(0.0001, 0.25 * this.masterVolume), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        try {
            osc.start(now);
            osc.stop(now + 0.12);
        } catch (_) {}
    }

    /**
     * Sonido de captura de piedras (Chime de madera y cuenco cerámico)
     */
    static playCapture() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // Dos notas armonizadas en intervalo de quinta ascendente
        [587.33, 880.00].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            const baseGain = 0.35 * this.masterVolume;
            gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(baseGain, now + idx * 0.06 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.3);
        });
    }

    /**
     * Sonido de Rebobinar / Deshacer (Whoosh de viento bambú suave)
     */
    static playUndo() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.15);

        gain.gain.setValueAtTime(0.28 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Sonido de Rehacer (Swish ascendente)
     */
    static playRedo() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.15);

        gain.gain.setValueAtTime(0.28 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Sonido de Pasar Turno ("Bong" resonante de campana zen / gong budista tradicional)
     */
    static playPass() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Golpe transitorio suave de mazo acolchado (Thump inicial)
        const malletOsc = ctx.createOscillator();
        const malletGain = ctx.createGain();
        malletOsc.type = 'sine';
        malletOsc.frequency.setValueAtTime(95, now);
        malletOsc.frequency.exponentialRampToValueAtTime(45, now + 0.045);

        malletGain.gain.setValueAtTime(0.4 * this.masterVolume, now);
        malletGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        malletOsc.connect(malletGain);
        malletGain.connect(ctx.destination);
        malletOsc.start(now);
        malletOsc.stop(now + 0.045);

        // 2. Tono fundamental grave resonante ("Bong" en Sol / 196Hz)
        const fundOsc = ctx.createOscillator();
        const fundGain = ctx.createGain();
        fundOsc.type = 'sine';
        fundOsc.frequency.setValueAtTime(196, now);
        fundOsc.frequency.exponentialRampToValueAtTime(186, now + 0.85);

        const baseGain = 0.48 * this.masterVolume;
        fundGain.gain.setValueAtTime(0.001, now);
        fundGain.gain.linearRampToValueAtTime(baseGain, now + 0.012);
        fundGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        fundOsc.connect(fundGain);
        fundGain.connect(ctx.destination);
        fundOsc.start(now);
        fundOsc.stop(now + 0.85);

        // 3. Primer armónico (Quinta / 293.66Hz) con calidez y decaimiento medio
        const harm1Osc = ctx.createOscillator();
        const harm1Gain = ctx.createGain();
        harm1Osc.type = 'sine';
        harm1Osc.frequency.setValueAtTime(293.66, now);
        harm1Osc.frequency.exponentialRampToValueAtTime(288, now + 0.6);

        harm1Gain.gain.setValueAtTime(0.001, now);
        harm1Gain.gain.linearRampToValueAtTime(0.24 * this.masterVolume, now + 0.01);
        harm1Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        harm1Osc.connect(harm1Gain);
        harm1Gain.connect(ctx.destination);
        harm1Osc.start(now);
        harm1Osc.stop(now + 0.6);

        // 4. Segundo armónico metálico sutil (Octava superior / 523.25Hz)
        const harm2Osc = ctx.createOscillator();
        const harm2Gain = ctx.createGain();
        harm2Osc.type = 'triangle';
        harm2Osc.frequency.setValueAtTime(523.25, now);

        harm2Gain.gain.setValueAtTime(0.001, now);
        harm2Gain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 0.008);
        harm2Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        harm2Osc.connect(harm2Gain);
        harm2Gain.connect(ctx.destination);
        harm2Osc.start(now);
        harm2Osc.stop(now + 0.35);
    }

    /**
     * Sonido de error o movimiento ilegal
     */
    static playIllegal() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.setValueAtTime(95, now + 0.08);

        const baseGain = 0.22 * this.masterVolume;
        gain.gain.setValueAtTime(baseGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    /**
     * Sonido de recompensa especial o rescate de entidad
     */
    static playSpecial() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

        gain.gain.setValueAtTime(0.35 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    /**
     * Sonido de Katana / Filo del Samurai de Ronin: Corte veloz de viento con resonancia de acero templado
     */
    static playKatanaSlash() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Ráfaga de viento cortante (Ruido filtrado que corta el aire)
        const bufferSize = Math.floor(ctx.sampleRate * 0.22);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3200, now);
        filter.frequency.exponentialRampToValueAtTime(600, now + 0.18);
        filter.Q.setValueAtTime(3.5, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.45 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start(now);

        // 2. Tajo metálico brillante (Acero afilado de katana)
        const metalOsc = ctx.createOscillator();
        const metalGain = ctx.createGain();
        metalOsc.type = 'sawtooth';
        metalOsc.frequency.setValueAtTime(2400, now);
        metalOsc.frequency.exponentialRampToValueAtTime(800, now + 0.15);

        metalGain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        metalOsc.connect(metalGain);
        metalGain.connect(ctx.destination);
        metalOsc.start(now);
        metalOsc.stop(now + 0.15);
    }

    /**
     * Sonido de rotación de ficha poliminó / Duplicidad: Giro suave y nítido de madera mineral (Click/Swish)
     */
    static playRotate() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Pequeño golpe de contacto ligero de madera
        const bufferSize = Math.floor(ctx.sampleRate * 0.04);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1400, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(2800, now + 0.04);
        noiseFilter.Q.setValueAtTime(4.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.28 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);

        // 2. Tono suave resonante con sweep ascendente de giro
        const toneOsc = ctx.createOscillator();
        const toneGain = ctx.createGain();
        toneOsc.type = 'sine';
        toneOsc.frequency.setValueAtTime(420, now);
        toneOsc.frequency.exponentialRampToValueAtTime(740, now + 0.07);

        toneGain.gain.setValueAtTime(0.22 * this.masterVolume, now);
        toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        toneOsc.connect(toneGain);
        toneGain.connect(ctx.destination);
        toneOsc.start(now);
        toneOsc.stop(now + 0.08);
    }

    /**
     * Pulso acústico para cuenta atrás del reloj de Go / Byo-yomi (para los últimos 5 segundos).
     */
    static playClockTick(isUrgent: boolean = false) {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = isUrgent ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(isUrgent ? 920 : 680, now);
        osc.frequency.exponentialRampToValueAtTime(isUrgent ? 460 : 340, now + 0.04);

        gain.gain.setValueAtTime((isUrgent ? 0.26 : 0.15) * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.045);
    }

    /**
     * Efecto sonoro de ráfaga y vendaval místico para la Inhalación del Oni (Vórtice Gravitacional).
     */
    static playWind() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 1.2;

        // Ruido filtrado para el viento
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Filtro paso bajo suave (Brownian/Pinkish noise)
            data[i] = (lastOut + 0.04 * white) / 1.04;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(180, now);
        filter.frequency.exponentialRampToValueAtTime(850, now + 0.45);
        filter.frequency.exponentialRampToValueAtTime(220, now + duration);
        filter.Q.setValueAtTime(3.5, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.45 * this.masterVolume, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Resonancia grave de vacío/vórtice
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(65, now);
        subOsc.frequency.exponentialRampToValueAtTime(110, now + 0.4);
        subOsc.frequency.exponentialRampToValueAtTime(45, now + duration);

        subGain.gain.setValueAtTime(0.001, now);
        subGain.gain.exponentialRampToValueAtTime(0.35 * this.masterVolume, now + 0.3);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + duration);
        subOsc.start(now);
        subOsc.stop(now + duration);
    }

    /**
     * Rugido demoníaco y destello de poder místico para el Festín de Almas (Turno Extra Consecutivo).
     */
    static playDemonicRoar() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 0.9;

        // Sub-oscilador gutural potente
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(80, now);
        subOsc.frequency.exponentialRampToValueAtTime(130, now + 0.15);
        subOsc.frequency.exponentialRampToValueAtTime(40, now + duration);

        const subFilter = ctx.createBiquadFilter();
        subFilter.type = 'lowpass';
        subFilter.frequency.setValueAtTime(320, now);
        subFilter.frequency.exponentialRampToValueAtTime(160, now + duration);

        subGain.gain.setValueAtTime(0.001, now);
        subGain.gain.linearRampToValueAtTime(0.38 * this.masterVolume, now + 0.08);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        subOsc.connect(subFilter);
        subFilter.connect(subGain);
        subGain.connect(ctx.destination);

        // Campana carmesí resonante
        const bellOsc = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(520, now);
        bellOsc.frequency.exponentialRampToValueAtTime(260, now + duration);

        bellGain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        bellOsc.connect(bellGain);
        bellGain.connect(ctx.destination);

        subOsc.start(now);
        subOsc.stop(now + duration);
        bellOsc.start(now);
        bellOsc.stop(now + duration);
    }

    /**
     * Efecto de impacto y explosión de meteorito ígneo (Tengu / Hechizo Meteorito).
     */
    static playMeteorImpact() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 0.65;

        // 1. Silbido y explosión de fuego
        const bufferSize = Math.floor(ctx.sampleRate * 0.45);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1600, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 0.35);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.55 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);

        // 2. Onda expansiva grave subsónica
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(140, now);
        subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.5);

        const subFilter = ctx.createBiquadFilter();
        subFilter.type = 'lowpass';
        subFilter.frequency.setValueAtTime(280, now);
        subFilter.frequency.exponentialRampToValueAtTime(60, now + 0.5);

        subGain.gain.setValueAtTime(0.6 * this.masterVolume, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        subOsc.connect(subFilter);
        subFilter.connect(subGain);
        subGain.connect(ctx.destination);

        subOsc.start(now);
        subOsc.stop(now + duration);
    }

    /**
     * Efecto de llamarada ígnea y calcinación del dragón (Ryūjin / Furia del Dragón).
     */
    static playDragonFlame() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 0.85;

        // 1. Rugido de fuego continuo
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99 * b0 + white * 0.05;
            b1 = 0.96 * b1 + white * 0.11;
            b2 = 0.86 * b2 + white * 0.25;
            data[i] = (b0 + b1 + b2) * 0.6;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const bandFilter = ctx.createBiquadFilter();
        bandFilter.type = 'bandpass';
        bandFilter.frequency.setValueAtTime(450, now);
        bandFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
        bandFilter.frequency.exponentialRampToValueAtTime(300, now + duration);
        bandFilter.Q.setValueAtTime(2.2, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.01, now);
        noiseGain.gain.linearRampToValueAtTime(0.48 * this.masterVolume, now + 0.1);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(bandFilter);
        bandFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);

        // 2. Tono térmico resonante
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + duration);

        gain.gain.setValueAtTime(0.32 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Efecto de cometa astral y polvo estelar celestial (Himiko / Lluvia Pétrea).
     */
    static playCelestialDrop() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // Arpegio pentatónico astral reluciente
        const freqs = [880.0, 1318.5, 1760.0, 2637.0];
        freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + idx * 0.04;
            const duration = 0.45;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.92, startTime + duration);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(0.22 * this.masterVolume, startTime + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });

        // Chime cristalino sutil
        const shimmerOsc = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmerOsc.type = 'triangle';
        shimmerOsc.frequency.setValueAtTime(2093.0, now);
        shimmerOsc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.35);

        shimmerGain.gain.setValueAtTime(0.18 * this.masterVolume, now);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        shimmerOsc.connect(shimmerGain);
        shimmerGain.connect(ctx.destination);
        shimmerOsc.start(now);
        shimmerOsc.stop(now + 0.35);
    }

    /**
     * Efecto de pincel mágico y transmutación efervescente (Alquimista / Inversión Yin-Yang).
     */
    static playAlchemicalTransmute() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Trazo suave de pincel caligráfico
        const bufferSize = Math.floor(ctx.sampleRate * 0.2);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.frequency.exponentialRampToValueAtTime(700, now + 0.2);
        filter.Q.setValueAtTime(3.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);

        // 2. Acorde brillante de transmutación mágica
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const st = now + 0.05 + idx * 0.035;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq * 0.8, st);
            osc.frequency.exponentialRampToValueAtTime(freq, st + 0.06);

            gain.gain.setValueAtTime(0.001, st);
            gain.gain.linearRampToValueAtTime(0.24 * this.masterVolume, st + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(st);
            osc.stop(st + 0.35);
        });
    }

    /**
     * Efecto de invocación de Escudo Divino Sagrado (Kitsune / Pergamino de Escudo).
     */
    static playDivineShieldCast() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 0.95;

        // Campana tibetana sacrosanta (armónicos puros)
        [440.0, 880.0, 1320.0, 2200.0].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            const baseGain = (0.35 / (idx + 1)) * this.masterVolume;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(baseGain, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        });
    }

    /**
     * Efecto de rotura cristalina de Escudo Divino (Kitsune / Rotura de protección).
     */
    static playDivineShieldShatter() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Crujido de cristal roto
        const bufferSize = Math.floor(ctx.sampleRate * 0.15);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const highFilter = ctx.createBiquadFilter();
        highFilter.type = 'highpass';
        highFilter.frequency.setValueAtTime(3500, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.45 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noise.connect(highFilter);
        highFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);

        // 2. Fragmentos descendentes
        [1567.98, 1174.66, 783.99].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const st = now + idx * 0.03;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, st);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, st + 0.25);

            gain.gain.setValueAtTime(0.25 * this.masterVolume, st);
            gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(st);
            osc.stop(st + 0.25);
        });
    }

    /**
     * Efecto de erupción volcánica y retumbar de magma (Tablero Volcánico).
     */
    static playVolcanoEruption() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 1.1;

        // 1. Retumbar sísmico subterráneo
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(65, now);
        subOsc.frequency.exponentialRampToValueAtTime(30, now + duration);

        const subFilter = ctx.createBiquadFilter();
        subFilter.type = 'lowpass';
        subFilter.frequency.setValueAtTime(140, now);
        subFilter.frequency.exponentialRampToValueAtTime(45, now + duration);

        subGain.gain.setValueAtTime(0.65 * this.masterVolume, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        subOsc.connect(subFilter);
        subFilter.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + duration);

        // 2. Detonación de magma ardiente
        const bufferSize = Math.floor(ctx.sampleRate * 0.6);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(250, now);
        filter.frequency.exponentialRampToValueAtTime(900, now + 0.15);
        filter.frequency.exponentialRampToValueAtTime(180, now + 0.6);
        filter.Q.setValueAtTime(2.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.55 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
    }

    /**
     * Efecto de bramido y calcinación del Gran Dragón Sabio Gris (Jefe Final).
     */
    static playBossDragonBreath() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 1.3;

        // 1. Bramido de dragón colosal
        const roarOsc = ctx.createOscillator();
        const roarGain = ctx.createGain();
        roarOsc.type = 'sawtooth';
        roarOsc.frequency.setValueAtTime(95, now);
        roarOsc.frequency.exponentialRampToValueAtTime(175, now + 0.2);
        roarOsc.frequency.exponentialRampToValueAtTime(35, now + duration);

        const roarFilter = ctx.createBiquadFilter();
        roarFilter.type = 'lowpass';
        roarFilter.frequency.setValueAtTime(380, now);
        roarFilter.frequency.exponentialRampToValueAtTime(160, now + duration);

        roarGain.gain.setValueAtTime(0.001, now);
        roarGain.gain.linearRampToValueAtTime(0.55 * this.masterVolume, now + 0.08);
        roarGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        roarOsc.connect(roarFilter);
        roarFilter.connect(roarGain);
        roarGain.connect(ctx.destination);
        roarOsc.start(now);
        roarOsc.stop(now + duration);

        // 2. Furia de plasma ardiente
        this.playDragonFlame();
    }

    /**
     * Efecto de aterrizaje de bloque celestial (Tablero del Cielo).
     */
    static playSkyBlockLand() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 0.5;

        // Golpe gravitacional etéreo
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + duration);

        gain.gain.setValueAtTime(0.38 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);

        // Campana celestial flotante
        const bellOsc = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bellOsc.type = 'triangle';
        bellOsc.frequency.setValueAtTime(659.25, now);
        bellGain.gain.setValueAtTime(0.2 * this.masterVolume, now);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        bellOsc.connect(bellGain);
        bellGain.connect(ctx.destination);
        bellOsc.start(now);
        bellOsc.stop(now + 0.35);
    }

    /**
     * Fanfarria triunfal de victoria en el Goban (Taiko + campanas armónicas tradicionales).
     */
    static playVictoryFanfare() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Doble golpe Taiko inicial
        [0, 0.22].forEach((offset) => {
            const st = now + offset;
            const taikoOsc = ctx.createOscillator();
            const taikoGain = ctx.createGain();
            taikoOsc.type = 'sine';
            taikoOsc.frequency.setValueAtTime(110, st);
            taikoOsc.frequency.exponentialRampToValueAtTime(45, st + 0.18);

            taikoGain.gain.setValueAtTime(0.55 * this.masterVolume, st);
            taikoGain.gain.exponentialRampToValueAtTime(0.001, st + 0.18);

            taikoOsc.connect(taikoGain);
            taikoGain.connect(ctx.destination);
            taikoOsc.start(st);
            taikoOsc.stop(st + 0.18);
        });

        // 2. Acorde tradicional de Koto / campanas celestiales (escala Hirajōshi)
        const notes = [440.0, 523.25, 659.25, 880.0, 1046.5];
        notes.forEach((freq, idx) => {
            const st = now + 0.4 + idx * 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, st);

            gain.gain.setValueAtTime(0.001, st);
            gain.gain.linearRampToValueAtTime(0.32 * this.masterVolume, st + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.85);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(st);
            osc.stop(st + 0.85);
        });
    }

    /**
     * Gong solemne de derrota / fin de expedición.
     */
    static playDefeatGong() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 1.8;

        // Tono fundamental sombrío
        const fundOsc = ctx.createOscillator();
        const fundGain = ctx.createGain();
        fundOsc.type = 'sine';
        fundOsc.frequency.setValueAtTime(110, now);
        fundOsc.frequency.exponentialRampToValueAtTime(98, now + duration);

        fundGain.gain.setValueAtTime(0.001, now);
        fundGain.gain.linearRampToValueAtTime(0.52 * this.masterVolume, now + 0.02);
        fundGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        fundOsc.connect(fundGain);
        fundGain.connect(ctx.destination);
        fundOsc.start(now);
        fundOsc.stop(now + duration);

        // Armónico menor disonante
        const dissonantOsc = ctx.createOscillator();
        const dissonantGain = ctx.createGain();
        dissonantOsc.type = 'triangle';
        dissonantOsc.frequency.setValueAtTime(146.83, now);

        dissonantGain.gain.setValueAtTime(0.001, now);
        dissonantGain.gain.linearRampToValueAtTime(0.28 * this.masterVolume, now + 0.03);
        dissonantGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

        dissonantOsc.connect(dissonantGain);
        dissonantGain.connect(ctx.destination);
        dissonantOsc.start(now);
        dissonantOsc.stop(now + duration * 0.7);
    }
}
