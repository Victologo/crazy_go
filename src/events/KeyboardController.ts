// events/KeyboardController.ts - Navegación y Selección Universal con Teclado
import type { HeroId, RogueliteDifficulty } from '../types';
import { InteractionManager } from '../controllers/InteractionManager';
import { ChampionManager } from '../core/ChampionManager';
import { PolyominoManager } from '../core/PolyominoManager';
import { HUDController } from '../ui/HUDController';
import { ModalManager } from '../ui/ModalManager';
import { GameController } from '../controllers/GameController';
import { RoguelikeController } from '../controllers/RoguelikeController';
import { TutorialManager } from '../tutorial/TutorialManager';
import { StoryController } from '../story/StoryController';
import { SoundFX } from '../audio/SoundFX';
import { BGMGenerator } from '../audio/BGMGenerator';
import { CombatLogModalRenderer } from '../ui/modals/CombatLogModalRenderer';

export class KeyboardController {
    private static isInitialized: boolean = false;

    public static init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        window.addEventListener('keydown', (e: KeyboardEvent) => {
            // Permitir recarga nativa de Google Chrome (Ctrl+Shift+R, Ctrl+R, F5, Cmd+Shift+R) y DevTools (F12, Ctrl+Shift+I)
            if (
                ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R' || e.code === 'KeyR')) ||
                e.key === 'F5' || e.code === 'F5' ||
                e.key === 'F12' || e.code === 'F12' ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.code === 'KeyI'))
            ) {
                return; // Dejar que el navegador ejecute la recarga forzada o inspección sin bloquearla
            }

            const key = e.key;
            const code = e.code;

            // Si el usuario está en un input/textarea/select y pulsa Escape, permitir cerrar modales
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
                if (e.key === 'Escape') {
                    const fbModal = document.getElementById('feedback-modal') || document.getElementById('modal-feedback');
                    if (fbModal && !fbModal.classList.contains('hidden')) {
                        e.preventDefault();
                        (document.activeElement as HTMLElement)?.blur();
                        ModalManager.closeFeedbackModal();
                        SoundFX.playPlaceStone();
                        return;
                    }
                    const optModal = document.getElementById('options-modal');
                    if (optModal && !optModal.classList.contains('hidden')) {
                        e.preventDefault();
                        (document.activeElement as HTMLElement)?.blur();
                        ModalManager.closeOptionsModal();
                        return;
                    }
                    (document.activeElement as HTMLElement)?.blur();
                } else {
                    return; // Ignorar otras teclas mientras se escribe
                }
            }

            // =========================================================
            // MODAL DE FEEDBACK / SUGERENCIAS (PRIORIDAD ALTA)
            // =========================================================
            const fbModal = document.getElementById('feedback-modal') || document.getElementById('modal-feedback');
            if (fbModal && !fbModal.classList.contains('hidden')) {
                if (key === 'Escape') {
                    e.preventDefault();
                    ModalManager.closeFeedbackModal();
                    SoundFX.playPlaceStone();
                    return;
                }
                return;
            }

            // =========================================================
            // ATAJO PERSONALIZABLE PARA FEEDBACK MODAL
            // =========================================================
            const savedFeedbackKey = localStorage.getItem('crazygo_feedback_key') || 'F10';
            let normalizedKey = key;
            if (normalizedKey === ' ') normalizedKey = 'Space';
            else if (normalizedKey.length === 1) normalizedKey = normalizedKey.toUpperCase();

            if (normalizedKey === savedFeedbackKey) {
                e.preventDefault();
                ModalManager.openFeedbackModal();
                SoundFX.playPlaceStone();
                return;
            }



            // =========================================================
            // ATAJO PARA MODO ZEN (H)
            // =========================================================
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && (key === 'h' || key === 'H')) {
                // Solo si no estamos en un diálogo de historia que requiera escribir o similar
                if (!StoryController.isDialogueActive || TutorialManager.isActive === false) {
                    e.preventDefault();
                    // Importamos HUDController dinámicamente si hay referencia cruzada,
                    // pero podemos llamarlo usando import estático
                    import('../ui/HUDController').then(m => {
                        m.HUDController.toggleZenMode();
                        SoundFX.playPlaceStone();
                    });
                    return;
                }
            }

            // 0. DIÁLOGOS DE MODO HISTORIA (Avance rápido con Espacio, Enter, Flecha Derecha o Escape)
            if (StoryController.isDialogueActive) {
                if (key === 'Enter' || key === ' ' || key === 'Escape' || key === 'ArrowRight' || key === 'd' || key === 'D') {
                    e.preventDefault();
                    StoryController.advanceDialogue();
                    return;
                }
            }

            // =========================================================
            // 0. AVANCE RÁPIDO DE CUADROS EXPLICATIVOS EN TUTORIAL
            // =========================================================
            if (TutorialManager.isActive && TutorialManager.getExpectedAction()?.type === 'dialog_only') {
                if (key === 'Enter' || key === ' ' || code === 'Space') {
                    e.preventDefault();
                    const continueBtn = document.getElementById('btn-tutorial-continue-step') as HTMLButtonElement | null;
                    if (continueBtn && !continueBtn.disabled) {
                        continueBtn.click();
                    }
                    return;
                }
            }

            // =========================================================
            // 0b. MODAL DE LECCIÓN DE TUTORIAL COMPLETADA
            // =========================================================
            const tutorialCompleteModal = document.getElementById('modal-tutorial-complete');
            if (tutorialCompleteModal && !tutorialCompleteModal.classList.contains('hidden')) {
                if (key === 'Enter' || key === ' ' || code === 'Space') {
                    e.preventDefault();
                    document.getElementById('btn-tutorial-next')?.click();
                    return;
                }
                if (key === 'r' || key === 'R') {
                    e.preventDefault();
                    document.getElementById('btn-tutorial-replay')?.click();
                    return;
                }
                if (key === 'Escape' || key === 'l' || key === 'L') {
                    e.preventDefault();
                    document.getElementById('btn-tutorial-list')?.click();
                    return;
                }
                return;
            }

            // =========================================================
            // 0b2. MODAL DE REGISTRO DE COMBATE Y REPETICIÓN (COMBAT LOG)
            // =========================================================
            const clModal = document.getElementById('modal-combat-log');
            if (clModal && !clModal.classList.contains('hidden')) {
                if (key === 'Escape' || ((key === 'l' || key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey)) {
                    e.preventDefault();
                    ModalManager.closeCombatLogModal();
                    SoundFX.playPlaceStone();
                    return;
                }
                if (key === ' ' || code === 'Space') {
                    e.preventDefault();
                    CombatLogModalRenderer.toggleAutoPlay();
                    return;
                }
                if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                    e.preventDefault();
                    CombatLogModalRenderer.pauseAutoPlay();
                    CombatLogModalRenderer.prevStep();
                    return;
                }
                if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                    e.preventDefault();
                    CombatLogModalRenderer.pauseAutoPlay();
                    CombatLogModalRenderer.nextStep();
                    return;
                }
                if (key === 'Home') {
                    e.preventDefault();
                    CombatLogModalRenderer.pauseAutoPlay();
                    CombatLogModalRenderer.firstStep();
                    return;
                }
                if (key === 'End') {
                    e.preventDefault();
                    CombatLogModalRenderer.pauseAutoPlay();
                    CombatLogModalRenderer.lastStep();
                    return;
                }
                // Prevenir que otras teclas pasen turno, lancen hechizos o interfieran en la partida de fondo
                return;
            }

            // =========================================================
            // 0c. MODAL DOJO (LISTA DE CAPÍTULOS)
            // =========================================================
            const dojoModal = document.getElementById('dojo-modal');
            if (dojoModal && !dojoModal.classList.contains('hidden')) {
                const dojoCards = Array.from(document.querySelectorAll('#dojo-chapter-list .dojo-card-btn')) as HTMLElement[];
                if (/^[1-9]$/.test(key)) {
                    const idx = parseInt(key, 10) - 1;
                    if (dojoCards[idx]) {
                        e.preventDefault();
                        dojoCards[idx].click();
                        return;
                    }
                }
                if (key === 'Escape') {
                    e.preventDefault();
                    document.getElementById('btn-cancel-dojo')?.click();
                    return;
                }
                return;
            }

            // =========================================================
            // 0d. MODAL MODO HISTORIA
            // =========================================================
            const storyModal = document.getElementById('modal-story-mode');
            if (storyModal && !storyModal.classList.contains('hidden')) {
                if (key === 'Escape' || key === 'Enter' || key === ' ' || code === 'Space') {
                    e.preventDefault();
                    document.getElementById('btn-story-modal-close')?.click();
                    return;
                }
                return;
            }

            // =========================================================
            // 0. MODAL DE OPCIONES / CONFIGURACIÓN DE AUDIO (PRIORIDAD MÁXIMA EN ESCAPE)
            // =========================================================
            const optionsModal = document.getElementById('options-modal') || document.getElementById('modal-options');
            if (optionsModal && !optionsModal.classList.contains('hidden')) {
                if (key === 'Escape' || key === 'Enter') {
                    e.preventDefault();
                    ModalManager.closeOptionsModal();
                    return;
                }
                if (key === 'm' || key === 'M' || key === 'b' || key === 'B') {
                    e.preventDefault();
                    SoundFX.toggleBGM();
                    ModalManager.updateOptionsModalUI();
                    return;
                }
                if (key === 's' || key === 'S') {
                    e.preventDefault();
                    SoundFX.toggleSFX();
                    ModalManager.updateOptionsModalUI();
                    return;
                }
                if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                    e.preventDefault();
                    const newVol = Math.max(0, SoundFX.getMasterVolume() - 0.1);
                    SoundFX.setMasterVolume(newVol);
                    BGMGenerator.setVolume(newVol);
                    ModalManager.updateOptionsModalUI();
                    return;
                }
                if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                    e.preventDefault();
                    const newVol = Math.min(1, SoundFX.getMasterVolume() + 0.1);
                    SoundFX.setMasterVolume(newVol);
                    BGMGenerator.setVolume(newVol);
                    ModalManager.updateOptionsModalUI();
                    return;
                }
                return;
            }

            // =========================================================
            // 1. MODAL DE RECOMPENSAS ROGUELIKE (Elección de Ítems / Cartas)
            // =========================================================
            const rewardModal = document.getElementById('rogue-reward-modal');
            if (rewardModal && !rewardModal.classList.contains('hidden')) {
                const cards = Array.from(document.querySelectorAll('#reward-cards-grid .reward-card-choice, #reward-cards-grid .btn-reward-card, #reward-cards-container .reward-card-choice')) as HTMLElement[];
                if (cards.length > 0) {
                    const currentIndex = cards.findIndex(c => c.classList.contains('active') || c.classList.contains('selected'));

                    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                        e.preventDefault();
                        const nextIdx = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1;
                        cards[nextIdx].click();
                        return;
                    }
                    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                        e.preventDefault();
                        const nextIdx = currentIndex === -1 || currentIndex >= cards.length - 1 ? 0 : currentIndex + 1;
                        cards[nextIdx].click();
                        return;
                    }
                    if (['1', '2', '3', '4'].includes(key)) {
                        const idx = parseInt(key, 10) - 1;
                        if (cards[idx]) {
                            e.preventDefault();
                            cards[idx].click();
                            return;
                        }
                    }
                }

                if (key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    document.getElementById('btn-claim-reward')?.click();
                    return;
                }
                if (key === 'Escape') {
                    e.preventDefault();
                    ModalManager.openOptionsModal();
                    return;
                }
                return;
            }

            // =========================================================
            // 2. MODAL DE EVENTOS / SANTUARIO / TIENDA ROGUELIKE
            // =========================================================
            const eventModal = document.getElementById('rogue-event-modal');
            if (eventModal && !eventModal.classList.contains('hidden')) {
                const options = Array.from(document.querySelectorAll('#event-modal-actions .btn-event-action, #event-modal-actions .btn-event-option')) as HTMLElement[];
                if (options.length > 0) {
                    let focusedIdx = options.findIndex(opt => opt === document.activeElement);
                    if (key === 'ArrowDown' || key === 's' || key === 'S') {
                        e.preventDefault();
                        focusedIdx = (focusedIdx + 1) % options.length;
                        options[focusedIdx].focus();
                        return;
                    }
                    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                        e.preventDefault();
                        focusedIdx = focusedIdx <= 0 ? options.length - 1 : focusedIdx - 1;
                        options[focusedIdx].focus();
                        return;
                    }
                    if (/^[1-9]$/.test(key)) {
                        const idx = parseInt(key, 10) - 1;
                        if (options[idx]) {
                            e.preventDefault();
                            options[idx].click();
                            return;
                        }
                    }
                }

                if (key === 'Enter' || key === ' ') {
                    if (document.activeElement && options.includes(document.activeElement as HTMLElement)) {
                        // Deja que el botón enfocado maneje el clic
                        return;
                    }
                    const leaveBtn = document.getElementById('btn-event-leave');
                    if (leaveBtn && !leaveBtn.classList.contains('hidden')) {
                        e.preventDefault();
                        leaveBtn.click();
                        return;
                    }
                }
                if (key === 'Escape') {
                    e.preventDefault();
                    ModalManager.openOptionsModal();
                    return;
                }
                return;
            }

            // =========================================================
            // 3. MODAL DE SETUP ROGUELIKE (Elección de Campeón y Dificultad)
            // =========================================================
            const rogueSetupModal = document.getElementById('roguelike-setup-modal') || document.getElementById('modal-rogue-setup');
            if (rogueSetupModal && !rogueSetupModal.classList.contains('hidden')) {
                if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                    e.preventDefault();
                    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                    RoguelikeController.prevHero();
                    return;
                }
                if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                    e.preventDefault();
                    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                    RoguelikeController.nextHero();
                    return;
                }

                // Dificultades con flechas Arriba/Abajo o W/S
                const diffs: RogueliteDifficulty[] = ['easy', 'normal', 'hard', 'extreme'];
                if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                    e.preventDefault();
                    const curIdx = diffs.indexOf(RoguelikeController.tempRogueDifficulty);
                    const nextIdx = curIdx <= 0 ? diffs.length - 1 : curIdx - 1;
                    RoguelikeController.setDifficulty(diffs[nextIdx]);
                    return;
                }
                if (key === 'ArrowDown' || key === 's' || key === 'S') {
                    e.preventDefault();
                    const curIdx = diffs.indexOf(RoguelikeController.tempRogueDifficulty);
                    const nextIdx = (curIdx + 1) % diffs.length;
                    RoguelikeController.setDifficulty(diffs[nextIdx]);
                    return;
                }

                // Números 1..7 para Campeones (1: Normal, 2: Tengu, 3: Himiko, 4: Kitsune, 5: Ronin, 6: Alquimista, 7: Ryūjin)
                const heroKeys: HeroId[] = ['normal', 'tengu', 'himiko', 'kitsune', 'ronin', 'alchemist', 'ryujin'];
                if (['1', '2', '3', '4', '5', '6', '7'].includes(key)) {
                    const idx = parseInt(key, 10) - 1;
                    if (heroKeys[idx]) {
                        e.preventDefault();
                        RoguelikeController.setHero(heroKeys[idx]);
                        return;
                    }
                }

                if (key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    RoguelikeController.startNewExpedition();
                    return;
                }
                if (key === 'Escape') {
                    e.preventDefault();
                    ModalManager.closeRoguelikeSetupModal();
                    return;
                }
                return;
            }

            // =========================================================
            // 4. MODAL DE ELECCIÓN ROGUELIKE (Continuar o Nueva Run)
            // =========================================================
            const rogueChoiceModal = document.getElementById('modal-rogue-choice');
            if (rogueChoiceModal && !rogueChoiceModal.classList.contains('hidden')) {
                if (key === '1' || key === 'ArrowLeft' || key === 'ArrowUp') {
                    e.preventDefault();
                    RoguelikeController.resumeActiveRun();
                    return;
                }
                if (key === '2' || key === 'ArrowRight' || key === 'ArrowDown') {
                    e.preventDefault();
                    RoguelikeController.startFreshRunPrompt();
                    return;
                }
                if (key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    RoguelikeController.resumeActiveRun();
                    return;
                }
                if (key === 'Escape') {
                    e.preventDefault();
                    ModalManager.openOptionsModal();
                    return;
                }
                return;
            }

            // =========================================================
            // 5. MODAL DE CONFIGURACIÓN DE MODO LIBRE (Wizard Paso a Paso)
            // =========================================================
            const newGameModal = document.getElementById('new-game-modal');
            if (newGameModal && !newGameModal.classList.contains('hidden')) {
                const currentStep = ModalManager.currentWizardStep;

                if (key === 'Escape') {
                    e.preventDefault();
                    ModalManager.closeNewGameModal();
                    return;
                }
                if (key === 'Backspace') {
                    e.preventDefault();
                    document.getElementById('btn-wizard-prev')?.click();
                    return;
                }

                // Paso 1: Jugadores (2 o 4)
                if (currentStep === 1) {
                    if (key === '1' || key === 'ArrowLeft' || key === 'a' || key === 'A') {
                        e.preventDefault();
                        document.getElementById('setup-players-2')?.click();
                        return;
                    }
                    if (key === '2' || key === 'ArrowRight' || key === 'd' || key === 'D') {
                        e.preventDefault();
                        document.getElementById('setup-players-4')?.click();
                        return;
                    }
                }

                // Paso 2: Modo de Juego (1vIA o 1v1 Local)
                if (currentStep === 2) {
                    if (key === '1' || key === 'ArrowLeft' || key === 'a' || key === 'A') {
                        e.preventDefault();
                        document.getElementById('setup-mode-1via')?.click();
                        return;
                    }
                    if (key === '2' || key === 'ArrowRight' || key === 'd' || key === 'D') {
                        e.preventDefault();
                        document.getElementById('setup-mode-1v1')?.click();
                        return;
                    }
                }

                // Paso 3: Tablero y Topología
                if (currentStep === 3) {
                    if (key === '1') {
                        e.preventDefault();
                        document.getElementById('setup-size-9')?.click();
                        return;
                    }
                    if (key === '2') {
                        e.preventDefault();
                        document.getElementById('setup-size-13')?.click();
                        return;
                    }
                    if (key === '3') {
                        e.preventDefault();
                        document.getElementById('setup-size-19')?.click();
                        return;
                    }

                    const shapeBtns = Array.from(document.querySelectorAll('.btn-shape-choice')) as HTMLElement[];
                    if (shapeBtns.length > 0 && (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'a' || key === 'd')) {
                        e.preventDefault();
                        const curIdx = shapeBtns.findIndex(b => b.classList.contains('active'));
                        const delta = (key === 'ArrowLeft' || key === 'a') ? -1 : 1;
                        const nextIdx = (curIdx + delta + shapeBtns.length) % shapeBtns.length;
                        shapeBtns[nextIdx].click();
                        return;
                    }
                }

                // Paso 4: Selección de Campeón Místico
                if (currentStep === 4) {
                    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                        e.preventDefault();
                        document.getElementById('btn-setup-hero-prev')?.click();
                        return;
                    }
                    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                        e.preventDefault();
                        document.getElementById('btn-setup-hero-next')?.click();
                        return;
                    }
                    const heroThumbs = Array.from(document.querySelectorAll('#setup-hero-thumb-strip .hero-thumb-btn')) as HTMLElement[];
                    if (['1', '2', '3', '4', '5', '6', '7'].includes(key)) {
                        const idx = parseInt(key, 10) - 1;
                        if (heroThumbs[idx]) {
                            e.preventDefault();
                            heroThumbs[idx].click();
                            return;
                        }
                    }
                }

                // Paso 5: Escenario y Entorno de Combate
                if (currentStep === 5) {
                    const bgBtns = Array.from(document.querySelectorAll('#setup-bgs-grid .btn-setup-bg')) as HTMLElement[];
                    if (['1', '2', '3', '4', '5', '6', '7'].includes(key)) {
                        const idx = parseInt(key, 10) - 1;
                        if (bgBtns[idx]) {
                            e.preventDefault();
                            bgBtns[idx].click();
                            return;
                        }
                    }
                    if (bgBtns.length > 0 && (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'a' || key === 'd')) {
                        e.preventDefault();
                        const curIdx = bgBtns.findIndex(b => b.classList.contains('active'));
                        const delta = (key === 'ArrowLeft' || key === 'a') ? -1 : 1;
                        const nextIdx = (curIdx + delta + bgBtns.length) % bgBtns.length;
                        bgBtns[nextIdx].click();
                        return;
                    }
                }

                // Paso 6: Ajustes Finales (Color y Dificultad)
                if (currentStep === 6) {
                    if (key === 'ArrowLeft' || key === 'ArrowRight') {
                        e.preventDefault();
                        if (key === 'ArrowLeft') document.getElementById('setup-color-black')?.click();
                        else document.getElementById('setup-color-white')?.click();
                        return;
                    }
                    const diffBtns = Array.from(document.querySelectorAll('.setup-diff-grid .btn-choice')) as HTMLElement[];
                    if (['1', '2', '3', '4'].includes(key)) {
                        const idx = parseInt(key, 10) - 1;
                        if (diffBtns[idx]) {
                            e.preventDefault();
                            diffBtns[idx].click();
                            return;
                        }
                    }
                }

                if (key === 'Enter') {
                    e.preventDefault();
                    if (currentStep === 6) {
                        document.getElementById('btn-setup-start')?.click();
                    } else {
                        document.getElementById('btn-wizard-next')?.click();
                    }
                    return;
                }
                return;
            }

            // =========================================================
            // 6. MODAL DE INSPECCIÓN DE MAZO / RELIQUIAS
            // =========================================================
            const deckModal = document.getElementById('modal-deck');
            if (deckModal && !deckModal.classList.contains('hidden')) {
                if (key === 'Escape' || key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    ModalManager.closeDeckModal();
                    return;
                }
                return;
            }

            // =========================================================
            // 6b. MODAL DE MODO SANDBOX / LABORATORIO DE PRUEBAS
            // =========================================================
            const sandboxModal = document.getElementById('sandbox-modal');
            if (sandboxModal && !sandboxModal.classList.contains('hidden')) {
                if (key === 'Escape') {
                    e.preventDefault();
                    ModalManager.closeSandboxModal();
                    return;
                }
            }

            // =========================================================
            // 6c. MODAL MULTIJUGADOR ONLINE (Wizard Host / Join Guest)
            // =========================================================
            const onlineModal = document.getElementById('online-modal');
            if (onlineModal && !onlineModal.classList.contains('hidden')) {
                const isJoinTab = document.getElementById('view-join-room')?.classList.contains('active') || !document.getElementById('view-join-room')?.classList.contains('hidden');
                const isHostTab = document.getElementById('view-create-room')?.classList.contains('active') || !document.getElementById('view-create-room')?.classList.contains('hidden');

                if (key === 'Escape') {
                    e.preventDefault();
                    ModalManager.closeOnlineModal();
                    return;
                }

                if (isHostTab) {
                    const onlineStep = ModalManager.currentOnlineWizardStep;

                    if (key === 'Backspace') {
                        e.preventDefault();
                        document.getElementById('btn-online-wizard-prev')?.click();
                        return;
                    }

                    if (onlineStep === 1) {
                        if (key === '1') {
                            e.preventDefault();
                            document.getElementById('online-mode-standard')?.click();
                            return;
                        }
                        if (key === '2') {
                            e.preventDefault();
                            document.getElementById('online-mode-coop')?.click();
                            return;
                        }
                    }

                    if (onlineStep === 2) {
                        if (key === '1') {
                            e.preventDefault();
                            document.getElementById('online-size-9')?.click();
                            return;
                        }
                        if (key === '2') {
                            e.preventDefault();
                            document.getElementById('online-size-13')?.click();
                            return;
                        }
                        if (key === '3') {
                            e.preventDefault();
                            document.getElementById('online-size-19')?.click();
                            return;
                        }
                    }

                    if (onlineStep === 3) {
                        if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                            e.preventDefault();
                            document.getElementById('btn-online-host-hero-prev')?.click();
                            return;
                        }
                        if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                            e.preventDefault();
                            document.getElementById('btn-online-host-hero-next')?.click();
                            return;
                        }
                        const hostThumbs = Array.from(document.querySelectorAll('#online-host-hero-thumb-strip .hero-thumb-btn')) as HTMLElement[];
                        if (['1', '2', '3', '4', '5', '6', '7'].includes(key)) {
                            const idx = parseInt(key, 10) - 1;
                            if (hostThumbs[idx]) {
                                e.preventDefault();
                                hostThumbs[idx].click();
                                return;
                            }
                        }
                    }

                    if (onlineStep === 4) {
                        const bgBtns = Array.from(document.querySelectorAll('#online-bgs-grid .btn-online-bg')) as HTMLElement[];
                        if (['1', '2', '3', '4', '5', '6', '7'].includes(key)) {
                            const idx = parseInt(key, 10) - 1;
                            if (bgBtns[idx]) {
                                e.preventDefault();
                                bgBtns[idx].click();
                                return;
                            }
                        }
                    }

                    if (key === 'Enter') {
                        e.preventDefault();
                        if (onlineStep === 5) {
                            document.getElementById('btn-online-force-start')?.click();
                        } else {
                            document.getElementById('btn-online-wizard-next')?.click();
                        }
                        return;
                    }
                } else if (isJoinTab) {
                    const roomInput = document.getElementById('input-join-room-code');
                    if (document.activeElement !== roomInput) {
                        if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                            e.preventDefault();
                            document.getElementById('btn-online-guest-hero-prev')?.click();
                            return;
                        }
                        if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                            e.preventDefault();
                            document.getElementById('btn-online-guest-hero-next')?.click();
                            return;
                        }
                        const guestThumbs = Array.from(document.querySelectorAll('#online-guest-hero-thumb-strip .hero-thumb-btn')) as HTMLElement[];
                        if (['1', '2', '3', '4', '5', '6', '7'].includes(key)) {
                            const idx = parseInt(key, 10) - 1;
                            if (guestThumbs[idx]) {
                                e.preventDefault();
                                guestThumbs[idx].click();
                                return;
                            }
                        }
                    }
                }
                return;
            }

            // =========================================================
            // 8. MODAL DE PUNTUACIÓN Y FIN DE PARTIDA UNIFICADO
            // =========================================================
            const scoreModal = document.getElementById('score-modal');
            if (scoreModal && !scoreModal.classList.contains('hidden')) {
                const cards = Array.from(document.querySelectorAll('#modal-reward-cards-container .reward-card-choice')) as HTMLElement[];
                if (cards.length > 0) {
                    const currentIndex = cards.findIndex(c => c.classList.contains('active') || c.classList.contains('selected'));

                    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                        e.preventDefault();
                        const nextIdx = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1;
                        cards[nextIdx].click();
                        return;
                    }
                    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                        e.preventDefault();
                        const nextIdx = currentIndex === -1 || currentIndex >= cards.length - 1 ? 0 : currentIndex + 1;
                        cards[nextIdx].click();
                        return;
                    }
                    if (['1', '2', '3', '4'].includes(key)) {
                        const idx = parseInt(key, 10) - 1;
                        if (cards[idx]) {
                            e.preventDefault();
                            cards[idx].click();
                            return;
                        }
                    }
                }
                if (key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    document.getElementById('btn-modal-rematch')?.click();
                    return;
                }
                if (key === 'Escape' || key === 'Tab' || key === 'i' || key === 'I') {
                    e.preventDefault();
                    document.getElementById('btn-modal-inspect')?.click();
                    return;
                }
                return;
            }

            // Atajo para reabrir modal cuando el botón flotante está activo
            const floatingInspect = document.getElementById('floating-inspect-btn');
            if (floatingInspect && !floatingInspect.classList.contains('hidden')) {
                if (key === 'Escape' || key === 'Enter' || key === ' ' || key === 'i' || key === 'I') {
                    e.preventDefault();
                    floatingInspect.click();
                    return;
                }
            }

            // =========================================================
            // 9. NAVEGACIÓN EN PANTALLA DEL MAPA ROGUELIKE
            // =========================================================
            const mapScreen = document.getElementById('roguelike-map-screen');
            if (mapScreen && !mapScreen.classList.contains('hidden')) {
                // Atajo para ver mazo/reliquias (D o I)
                if (key === 'd' || key === 'D' || key === 'i' || key === 'I') {
                    e.preventDefault();
                    document.getElementById('btn-map-deck')?.click();
                    return;
                }
                // Atajo para abrir menú de opciones / pausa (Escape)
                if (key === 'Escape') {
                    e.preventDefault();
                    ModalManager.openOptionsModal();
                    return;
                }
                // Selección y entrada a nodos disponibles (1, 2, 3, Enter, Espacio)
                const availableNodes = Array.from(document.querySelectorAll('.map-node.available')) as HTMLElement[];
                if (availableNodes.length > 0) {
                    if (['1', '2', '3', '4'].includes(key)) {
                        const idx = parseInt(key, 10) - 1;
                        if (availableNodes[idx]) {
                            e.preventDefault();
                            availableNodes[idx].click();
                            return;
                        }
                    }
                    if (key === 'Enter' || key === ' ') {
                        e.preventDefault();
                        availableNodes[0].click();
                        return;
                    }
                }
                return;
            }

            // =========================================================
            // 10. TECLADO EN PARTIDA / ACCIONES DE COMBATE (Goban Activo)
            // =========================================================
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen && !gameScreen.classList.contains('hidden')) {
                // Hechizos Místicos en dock inferior (1, 2, 3, 4)
                const spellCards = Array.from(document.querySelectorAll('#spellbar-cards .btn-spell-card')) as HTMLElement[];
                if (['1', '2', '3', '4'].includes(key)) {
                    const idx = parseInt(key, 10) - 1;
                    if (spellCards[idx]) {
                        e.preventDefault();
                        spellCards[idx].click();
                        return;
                    }
                }

                // Fallbacks para accesos directos por ID
                if (key === '1') {
                    const el = document.getElementById('spell-btn-rewind');
                    if (el) {
                        e.preventDefault();
                        el.click();
                        return;
                    }
                }
                if (key === '2') {
                    const el = document.getElementById('spell-btn-meteor');
                    if (el) {
                        e.preventDefault();
                        el.click();
                        return;
                    }
                }
                if (key === '3') {
                    const el = document.getElementById('spell-btn-shield');
                    if (el) {
                        e.preventDefault();
                        el.click();
                        return;
                    }
                }
                if (key === '4') {
                    const el = document.getElementById('spell-btn-convert');
                    if (el) {
                        e.preventDefault();
                        el.click();
                        return;
                    }
                }

                // Fichas Poliminó Tácticas (Z, X, V o teclas numéricas 5, 6, 7)
                if (key === '5' || key === 'z' || key === 'Z') {
                    e.preventDefault();
                    GameController.selectPolyomino('sprouting');
                    return;
                }
                if (key === '6' || key === 'x' || key === 'X') {
                    e.preventDefault();
                    GameController.selectPolyomino('domino');
                    return;
                }
                if (key === '7' || key === 'v' || key === 'V') {
                    e.preventDefault();
                    GameController.selectPolyomino('monolith');
                    return;
                }

                // Rotar Poliminó (R)
                if ((key === 'r' || key === 'R' || code === 'KeyR') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    InteractionManager.rotatePolyomino();
                    return;
                }

                // Habilidad Activa del Campeón (C o E)
                if (key === 'c' || key === 'C' || key === 'e' || key === 'E') {
                    e.preventDefault();
                    document.getElementById('btn-duel-champion-skill')?.click();
                    return;
                }

                // Pasar Turno (P o Barra Espaciadora)
                if (key === 'p' || key === 'P' || code === 'Space') {
                    e.preventDefault();
                    GameController.handlePass(true);
                    return;
                }

                // Deshacer / Rehacer (U, Ctrl+Z, Ctrl+Y)
                if ((key === 'z' && e.ctrlKey) || key === 'u' || key === 'U') {
                    e.preventDefault();
                    GameController.handleUndo();
                    return;
                }
                if ((key === 'y' && e.ctrlKey) || (key === 'z' && e.ctrlKey && e.shiftKey)) {
                    e.preventDefault();
                    GameController.handleRedo();
                    return;
                }

                // Sugerencia / Ojo del Maestro y Proyección Astral (H)
                if (key === 'h' || key === 'H') {
                    e.preventDefault();
                    InteractionManager.triggerBestMoveHint();
                    return;
                }

                // Registro de Combate y Repetición (L)
                if ((key === 'l' || key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    const clModal = document.getElementById('modal-combat-log');
                    if (clModal && !clModal.classList.contains('hidden')) {
                        ModalManager.closeCombatLogModal();
                    } else {
                        ModalManager.openCombatLogModal();
                    }
                    return;
                }

                // Cancelar modos activos o abrir menú de opciones / pausa (Escape)
                if (key === 'Escape') {
                    // 1. Si el registro de combate está abierto, cerrarlo
                    const clModal = document.getElementById('modal-combat-log');
                    if (clModal && !clModal.classList.contains('hidden')) {
                        e.preventDefault();
                        ModalManager.closeCombatLogModal();
                        return;
                    }

                    // 2. Si el selector de color del Alquimista está abierto, cerrarlo
                    const colorPickerModal = document.getElementById('modal-color-picker');
                    if (colorPickerModal && !colorPickerModal.classList.contains('hidden')) {
                        e.preventDefault();
                        document.getElementById('btn-cancel-color-picker')?.click();
                        return;
                    }

                    // 3. Si hay una habilidad de campeón activa apuntando, cancelarla
                    if (ChampionManager.currentTargetingMode !== 'none') {
                        e.preventDefault();
                        InteractionManager.toggleChampionActiveSkill();
                        return;
                    }

                    // 4. Si hay un poliminó seleccionado (Duplicidad, Monolito, Germinante), cancelarlo
                    if (PolyominoManager.activePolyomino !== null) {
                        e.preventDefault();
                        PolyominoManager.activePolyomino = null;
                        GameController.updateInGameUI();
                        if (GameController.renderer) {
                            GameController.renderer.isInteractive = GameController.isLocalPlayerTurn();
                            GameController.renderer.render();
                        }
                        SoundFX.playPlaceStone();
                        return;
                    }

                    // 5. Si hay una pista de mejor jugada activa, quitarla
                    if (GameController.renderer && GameController.renderer.activeHintNodeId) {
                        e.preventDefault();
                        GameController.renderer.clearHint();
                        HUDController.setHintButtonActive(false);
                        return;
                    }

                    // 6. Si el menú de opciones ya está abierto, cerrarlo
                    const optModal = document.getElementById('options-modal');
                    if (optModal && !optModal.classList.contains('hidden')) {
                        e.preventDefault();
                        ModalManager.closeOptionsModal();
                        return;
                    }

                    // 7. Si no hay nada especial activo, abrir menú de opciones / pausa
                    e.preventDefault();
                    ModalManager.openOptionsModal();
                    return;
                }
            }

            // =========================================================
            // 11. MENÚ PRINCIPAL
            // =========================================================
            const mainMenuScreen = document.getElementById('main-menu-screen');
            if (mainMenuScreen && !mainMenuScreen.classList.contains('hidden')) {
                // En el menú principal, Escape no realiza ninguna acción invasiva.
                return;
            }
        });
    }
}
