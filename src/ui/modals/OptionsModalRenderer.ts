import { SoundFX } from '../../audio/SoundFX';
import { DevModeManager } from '../../core/DevModeManager';
import { GlobalSettings } from '../../core/GlobalSettings';
import { getLanguage, t } from '../../i18n/i18n';

export class OptionsModalRenderer {
    // ==================== 3. MODAL DE OPCIONES / AUDIO ====================
    public static openOptionsModal() {
        document.getElementById('options-modal')?.classList.remove('hidden');
        this.updateOptionsModalUI();
    }

    public static closeOptionsModal() {
        document.getElementById('options-modal')?.classList.add('hidden');
        // Si estamos en la pantalla de juego, asegurar que el tablero esté listo e interactivo
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen && !gameScreen.classList.contains('hidden')) {
            import('../../controllers/GameController').then(({ GameController }) => {
                if (GameController.renderer) {
                    GameController.renderer.isInteractive = GameController.isLocalPlayerTurn();
                    GameController.renderer.render();
                    GameController.updateInGameUI();
                }
            });
        }
    }

    public static updateOptionsModalUI() {
        const lang = getLanguage();
        const btnLangEs = document.getElementById('opt-lang-es');
        const btnLangEn = document.getElementById('opt-lang-en');
        if (btnLangEs) btnLangEs.classList.toggle('active', lang === 'es');
        if (btnLangEn) btnLangEn.classList.toggle('active', lang === 'en');

        const volSlider = document.getElementById('opt-vol-slider') as HTMLInputElement | null;
        const volText = document.getElementById('opt-vol-text');
        const sfxSlider = document.getElementById('opt-sfx-slider') as HTMLInputElement | null;
        const sfxText = document.getElementById('opt-sfx-text');
        const bgmSlider = document.getElementById('opt-bgm-slider') as HTMLInputElement | null;
        const bgmText = document.getElementById('opt-bgm-text');

        const volPct = Math.round(SoundFX.getRawMasterVolume() * 100);
        if (volSlider) volSlider.value = volPct.toString();
        if (volText) volText.innerText = `${volPct}%`;

        const sfxPct = Math.round(SoundFX.getSFXVolume() * 100);
        if (sfxSlider) sfxSlider.value = sfxPct.toString();
        if (sfxText) sfxText.innerText = `${sfxPct}%`;

        // We use localStorage directly or BGMGenerator.getBGMVolume if it existed.
        const storedBgm = localStorage.getItem('crazygo_audio_bgm_vol');
        const bgmPct = storedBgm ? Math.round(parseFloat(storedBgm) * 100) : 100;
        if (bgmSlider) bgmSlider.value = bgmPct.toString();
        if (bgmText) bgmText.innerText = `${bgmPct}%`;

        const devBtn = document.getElementById('opt-dev-toggle');
        const isDev = DevModeManager.isDevMode();
        if (devBtn) {
            devBtn.innerText = isDev ? t('options.enabled') : t('options.disabled');
            devBtn.classList.toggle('active', isDev);
            devBtn.classList.toggle('inactive', !isDev);
        }

        const fps30 = document.getElementById('opt-fps-30');
        const fps60 = document.getElementById('opt-fps-60');
        if (fps30) fps30.classList.toggle('active', GlobalSettings.fpsLimit === 30);
        if (fps60) fps60.classList.toggle('active', GlobalSettings.fpsLimit === 60);

        const particlesBtn = document.getElementById('opt-particles-toggle');
        const isParticles = GlobalSettings.particlesEnabled;
        if (particlesBtn) {
            particlesBtn.innerText = isParticles ? t('options.enabled') : t('options.disabled');
            particlesBtn.classList.toggle('active', isParticles);
            particlesBtn.classList.toggle('inactive', !isParticles);
        }

        const winrateBtn = document.getElementById('opt-winrate-toggle');
        const isWinrate = GlobalSettings.winrateBarEnabled;
        if (winrateBtn) {
            winrateBtn.innerText = isWinrate ? t('options.enabled') : t('options.disabled');
            winrateBtn.classList.toggle('active', isWinrate);
            winrateBtn.classList.toggle('inactive', !isWinrate);
        }
    }

    // ==================== FEEDBACK MODAL ====================
    public static openFeedbackModal() {
        const feedbackContainer = document.querySelector('.modal-feedback')?.closest('.modal-backdrop');
        if (feedbackContainer) feedbackContainer.classList.remove('hidden');
    }

    public static closeFeedbackModal() {
        const feedbackContainer = document.querySelector('.modal-feedback')?.closest('.modal-backdrop');
        if (feedbackContainer) feedbackContainer.classList.add('hidden');
    }

}
