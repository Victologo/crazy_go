import type { PlayerId } from '../types';
import { SetupModalRenderer } from './modals/SetupModalRenderer';
import { OnlineModalRenderer } from './modals/OnlineModalRenderer';
import { OptionsModalRenderer } from './modals/OptionsModalRenderer';
import { SandboxModalRenderer } from './modals/SandboxModalRenderer';
import { ScoreModalRenderer } from './modals/ScoreModalRenderer';
import { RogueModalRenderer } from './modals/RogueModalRenderer';

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

    // ==================== 3. OPCIONES Y ZOOM ====================
    public static openOptionsModal() { OptionsModalRenderer.openOptionsModal(); }
    public static closeOptionsModal() { OptionsModalRenderer.closeOptionsModal(); }
    public static updateOptionsModalUI() { OptionsModalRenderer.updateOptionsModalUI(); }
    public static openFeedbackModal() { OptionsModalRenderer.openFeedbackModal(); }
    public static closeFeedbackModal() { OptionsModalRenderer.closeFeedbackModal(); }
    
    public static get currentZoom(): number { return OptionsModalRenderer.currentZoom; }
    public static set currentZoom(v: number) { OptionsModalRenderer.currentZoom = v; }
    public static setZoom(...args: Parameters<typeof OptionsModalRenderer.setZoom>) { OptionsModalRenderer.setZoom(...args); }
    public static initZoom() { OptionsModalRenderer.initZoom(); }
    
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
    // ==================== 8. COLOR PICKER ====================
    public static openColorPickerModal(): Promise<PlayerId | null> {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-color-picker');
            if (!modal) {
                resolve(null);
                return;
            }
            
            modal.classList.remove('hidden');

            const cleanup = () => {
                modal.classList.add('hidden');
                document.querySelectorAll('.color-picker-btn').forEach(btn => btn.removeEventListener('click', onColorSelect));
                document.getElementById('btn-cancel-color-picker')?.removeEventListener('click', onCancel);
            };

            const onColorSelect = (e: Event) => {
                const target = e.currentTarget as HTMLElement;
                const colorStr = target.getAttribute('data-color');
                if (colorStr) {
                    cleanup();
                    resolve(parseInt(colorStr) as PlayerId);
                }
            };

            const onCancel = () => {
                cleanup();
                resolve(null);
            };

            document.querySelectorAll('.color-picker-btn').forEach(btn => btn.addEventListener('click', onColorSelect));
            document.getElementById('btn-cancel-color-picker')?.addEventListener('click', onCancel);
        });
    }
}
