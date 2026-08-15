// SoundFX.ts
// Sintetizador acústico de efectos de sonido realistas para Go (Pachik de pizarra/concha, resonancia de kaya, captura y rebobinado)

export class SoundFX {
    private static ctx: AudioContext | null = null;
    private static masterVolume: number = 0.8;
    private static sfxEnabled: boolean = true;
    private static bgmEnabled: boolean = true;

    static {
        try {
            const savedVol = localStorage.getItem('crazygo_audio_volume');
            if (savedVol !== null) this.masterVolume = Math.max(0, Math.min(1, parseFloat(savedVol)));

            const savedSfx = localStorage.getItem('crazygo_audio_sfx');
            if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';

            const savedBgm = localStorage.getItem('crazygo_audio_bgm');
            if (savedBgm !== null) this.bgmEnabled = savedBgm === 'true';
        } catch (_) {}
    }

    private static saveSettings() {
        try {
            localStorage.setItem('crazygo_audio_volume', this.masterVolume.toString());
            localStorage.setItem('crazygo_audio_sfx', this.sfxEnabled.toString());
            localStorage.setItem('crazygo_audio_bgm', this.bgmEnabled.toString());
        } catch (_) {}
    }

    private static getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
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
     * Sonido "Pachik!" auténtico: Impacto seco de la piedra sobre el tablero de madera de Kaya con resonancia de cuerpo
     */
    static playPlaceStone() {
        if (!this.sfxEnabled || this.masterVolume <= 0) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Golpe transitorio seco inicial (Click de piedra mineral)
        const bufferSize = Math.floor(ctx.sampleRate * 0.015);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2400 + Math.random() * 400, now);
        noiseFilter.Q.setValueAtTime(3.5, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // 2. Resonancia del bloque de madera maciza (Goban de Kaya)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Variación sutil de tono (entre 280Hz y 340Hz) para evitar sonido robótico
        const woodTone = 310 + (Math.random() * 40 - 20);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(woodTone, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.09);

        const baseGain = 0.55 * this.masterVolume;
        gain.gain.setValueAtTime(baseGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        osc.start(now);
        osc.stop(now + 0.09);
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
}
