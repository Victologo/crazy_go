import type { PlayerId } from '../types';
import { SetupModalRenderer } from './modals/SetupModalRenderer';
import { OnlineModalRenderer } from './modals/OnlineModalRenderer';
import { OptionsModalRenderer } from './modals/OptionsModalRenderer';
import { SandboxModalRenderer } from './modals/SandboxModalRenderer';
import { ScoreModalRenderer } from './modals/ScoreModalRenderer';
import { RogueModalRenderer } from './modals/RogueModalRenderer';
import { CombatLogModalRenderer } from './modals/CombatLogModalRenderer';

export class ModalManager {
    public static closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(el => el.classList.add('hidden'));
    }

    // ==================== 1. WIZARD LOCAL (SETUP) ====================
    public static get currentWizardStep(): number { return SetupModalRenderer.currentWizardStep; }
    public static set currentWizardStep(v: number) { SetupModalRenderer.currentWizardStep = v; }

    public static openNewGameModal() { SetupModalRenderer.openNewGameModal(); }
    public static closeNewGameModal() { SetupModalRenderer.closeNewGameModal(); }
    public static setWizardStep(...args: Parameters<typeof SetupModalRenderer.setWizardStep>) { SetupModalRenderer.setWizardStep(...args); }
    public static updateWizardSummary(...args: Parameters<typeof SetupModalRenderer.updateWizardSummary>) { SetupModalRenderer.updateWizardSummary(...args); }
    public static updateSetupModalUI(...args: Parameters<typeof SetupModalRenderer.updateSetupModalUI>) { SetupModalRenderer.updateSetupModalUI(...args); }
    public static renderHeroShowcaseElements(...args: Parameters<typeof SetupModalRenderer.renderHeroShowcaseElements>) { SetupModalRenderer.renderHeroShowcaseElements(...args); }

    // ==================== 2. WIZARD ONLINE ====================
    public static get currentOnlineWizardStep(): number { return OnlineModalRenderer.currentOnlineWizardStep; }
    public static set currentOnlineWizardStep(v: number) { OnlineModalRenderer.currentOnlineWizardStep = v; }
    public static setOnlineWizardStep(...args: Parameters<typeof OnlineModalRenderer.setOnlineWizardStep>) { OnlineModalRenderer.setOnlineWizardStep(...args); }

    public static openOnlineModal() { OnlineModalRenderer.openOnlineModal(); }
    public static closeOnlineModal() { OnlineModalRenderer.closeOnlineModal(); }
    public static switchOnlineTab(...args: Parameters<typeof OnlineModalRenderer.switchOnlineTab>) { OnlineModalRenderer.switchOnlineTab(...args); }
    public static updateOnlineModalUI(...args: Parameters<typeof OnlineModalRenderer.updateOnlineModalUI>) { OnlineModalRenderer.updateOnlineModalUI(...args); }
    public static updateOnlineGuestHeroUI(...args: Parameters<typeof OnlineModalRenderer.updateOnlineGuestHeroUI>) { OnlineModalRenderer.updateOnlineGuestHeroUI(...args); }
    public static renderOnlineLobbySlots(...args: Parameters<typeof OnlineModalRenderer.renderOnlineLobbySlots>) { OnlineModalRenderer.renderOnlineLobbySlots(...args); }
    public static updateOnlineLobbyStatus(...args: Parameters<typeof OnlineModalRenderer.updateOnlineLobbyStatus>) { OnlineModalRenderer.updateOnlineLobbyStatus(...args); }

    // ==================== 0. GESTIÓN DE ZOOM GLOBAL ====================
    private static _currentZoom: number = 100;

    public static get currentZoom(): number {
        return this._currentZoom;
    }

    public static initZoom() {
        const saved = localStorage.getItem('crazygo_ui_zoom');
        if (saved) {
            const parsed = parseInt(saved, 10);
            if (!isNaN(parsed) && parsed >= 50 && parsed <= 200) {
                this.setZoom(parsed, false);
                return;
            }
        }
        this.setZoom(100, false);
    }

    public static setZoom(zoomPercent: number, showNotice: boolean = false) {
        const clamped = Math.max(60, Math.min(160, zoomPercent));
        this._currentZoom = clamped;
        localStorage.setItem('crazygo_ui_zoom', clamped.toString());

        const appEl = document.getElementById('app');
        if (appEl) {
            if (clamped === 100) {
                appEl.style.transform = '';
                appEl.style.transformOrigin = '';
                appEl.style.width = '';
                appEl.style.height = '';
            } else {
                const scale = clamped / 100;
                appEl.style.transform = `scale(${scale})`;
                appEl.style.transformOrigin = 'top left';
                appEl.style.width = `${100 / scale}vw`;
                appEl.style.height = `${100 / scale}vh`;
            }
        }

        if (showNotice) {
            import('./HUDController').then(({ HUDController }) => {
                HUDController.showAlert(`🔍 Zoom UI: ${clamped}%`, 1200);
            });
        }
    }

    // ==================== 3. OPCIONES Y MODALES ====================
    public static openOptionsModal() { OptionsModalRenderer.openOptionsModal(); }
    public static closeOptionsModal() { OptionsModalRenderer.closeOptionsModal(); }
    public static updateOptionsModalUI() { OptionsModalRenderer.updateOptionsModalUI(); }
    public static openFeedbackModal() { OptionsModalRenderer.openFeedbackModal(); }
    public static closeFeedbackModal() { OptionsModalRenderer.closeFeedbackModal(); }
    

    
    // ==================== 4. PUNTUACIÓN ====================
    public static showFinalScoreModal(...args: Parameters<typeof ScoreModalRenderer.showFinalScoreModal>) { ScoreModalRenderer.showFinalScoreModal(...args); }
    public static inspectBoard() { ScoreModalRenderer.inspectBoard(); }
    public static restoreScoreModal() { ScoreModalRenderer.restoreScoreModal(); }
    public static closeScoreModal() { ScoreModalRenderer.closeScoreModal(); }

    // ==================== 5. ROGUELIKE ====================
    public static openRoguelikeSetupModal() { RogueModalRenderer.openRoguelikeSetupModal(); }
    public static closeRoguelikeSetupModal() { RogueModalRenderer.closeRoguelikeSetupModal(); }
    public static openRogueChoiceModal() { RogueModalRenderer.openRogueChoiceModal(); }
    public static closeRogueChoiceModal() { RogueModalRenderer.closeRogueChoiceModal(); }
    public static updateRoguelikeSetupModalUI(...args: Parameters<typeof RogueModalRenderer.updateRoguelikeSetupModalUI>) { RogueModalRenderer.updateRoguelikeSetupModalUI(...args); }
    public static showRewardModal(...args: Parameters<typeof RogueModalRenderer.showRewardModal>) { RogueModalRenderer.showRewardModal(...args); }
    public static closeRewardModal() { RogueModalRenderer.closeRewardModal(); }
    public static showEventModal(...args: Parameters<typeof RogueModalRenderer.showEventModal>) { RogueModalRenderer.showEventModal(...args); }
    public static closeEventModal() { RogueModalRenderer.closeEventModal(); }
    public static openDeckModal() { RogueModalRenderer.openDeckModal(); }
    public static closeDeckModal() { RogueModalRenderer.closeDeckModal(); }

    // ==================== 6. SANDBOX ====================
    public static openSandboxModal() { SandboxModalRenderer.openSandboxModal(); }
    public static closeSandboxModal() { SandboxModalRenderer.closeSandboxModal(); }
    public static switchSandboxTab(...args: Parameters<typeof SandboxModalRenderer.switchSandboxTab>) { SandboxModalRenderer.switchSandboxTab(...args); }

    // ==================== 7. REGISTRO DE COMBATE & REPLAY ====================
    public static openCombatLogModal(...args: Parameters<typeof CombatLogModalRenderer.openCombatLogModal>) { CombatLogModalRenderer.openCombatLogModal(...args); }
    public static closeCombatLogModal() { CombatLogModalRenderer.closeCombatLogModal(); }

    // ==================== 8. COLOR PICKER ====================
    public static openColorPickerModal(): Promise<PlayerId | null> {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-color-picker');
            // console.log('🎯 [ModalManager] openColorPickerModal called, modal element:', modal);
            if (!modal) {
                console.error("modal-color-picker not found in DOM");
                resolve(null);
                return;
            }
            
            modal.classList.remove('hidden');
            // Forzar visibilidad absoluta
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.style.pointerEvents = 'all';
            
            import('../i18n/i18n').then(({ applyTranslationsToDOM }) => {
                applyTranslationsToDOM();
            });

            let isResolved = false;

            const cleanup = () => {
                if (isResolved) return;
                isResolved = true;
                modal.classList.add('hidden');
                modal.style.display = '';
                modal.style.visibility = '';
                modal.style.opacity = '';
                modal.style.pointerEvents = '';
                document.querySelectorAll('.color-picker-btn').forEach(btn => btn.removeEventListener('click', onColorSelect));
                document.getElementById('btn-cancel-color-picker')?.removeEventListener('click', onCancel);
                modal.removeEventListener('click', onBackdropClick);
            };

            const onColorSelect = (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
                const targetElement = e.target instanceof Element ? e.target : (e.target as Node).parentElement;
                const target = targetElement?.closest('.color-picker-btn') as HTMLElement;
                const colorStr = target?.getAttribute('data-color');
                // console.log('🎯 [ModalManager] onColorSelect clicked, target:', target, 'colorStr:', colorStr);
                if (colorStr) {
                    cleanup();
                    resolve(parseInt(colorStr, 10) as PlayerId);
                }
            };

            const onCancel = (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
                // console.log('🎯 [ModalManager] onCancel clicked');
                cleanup();
                resolve(null);
            };

            const onBackdropClick = (e: Event) => {
                if (e.target === modal) {
                    // console.log('🎯 [ModalManager] onBackdropClick triggered');
                    cleanup();
                    resolve(null);
                }
            };

            document.querySelectorAll('.color-picker-btn').forEach(btn => btn.addEventListener('click', onColorSelect));
            document.getElementById('btn-cancel-color-picker')?.addEventListener('click', onCancel);
            modal.addEventListener('click', onBackdropClick);
        });
    }
}

