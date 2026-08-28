// core/GlobalSettings.ts - Gestor de configuraciones globales persistentes
export class GlobalSettings {
    private static _fpsLimit: 30 | 60 = 60;
    private static _particlesEnabled: boolean = true;
    private static _winrateBarEnabled: boolean = true;

    public static init() {
        const storedFps = localStorage.getItem('crazyGo_fps');
        if (storedFps === '30' || storedFps === '60') {
            this._fpsLimit = parseInt(storedFps) as 30 | 60;
        }

        const storedParticles = localStorage.getItem('crazyGo_particles');
        if (storedParticles === 'false') {
            this._particlesEnabled = false;
        }

        const storedWinrate = localStorage.getItem('crazyGo_winrateBar');
        if (storedWinrate === 'false') {
            this._winrateBarEnabled = false;
        }
    }

    public static get fpsLimit(): 30 | 60 {
        return this._fpsLimit;
    }

    public static set fpsLimit(val: 30 | 60) {
        this._fpsLimit = val;
        localStorage.setItem('crazyGo_fps', val.toString());
    }

    public static get particlesEnabled(): boolean {
        return this._particlesEnabled;
    }

    public static set particlesEnabled(val: boolean) {
        this._particlesEnabled = val;
        localStorage.setItem('crazyGo_particles', val ? 'true' : 'false');
    }

    public static get winrateBarEnabled(): boolean {
        return this._winrateBarEnabled;
    }

    public static set winrateBarEnabled(val: boolean) {
        this._winrateBarEnabled = val;
        localStorage.setItem('crazyGo_winrateBar', val ? 'true' : 'false');
    }
}
