// events/KeyboardController.ts - Navegación y Selección Universal con Teclado
import type { HeroId, RogueliteDifficulty } from '../types';
import { ScreenManager } from '../ui/ScreenManager';
import { ModalManager } from '../ui/ModalManager';
import { GameController } from '../controllers/GameController';
import { RoguelikeController } from '../controllers/RoguelikeController';
import { TutorialManager } from '../tutorial/TutorialManager';
import { StoryController } from '../story/StoryController';
import { SoundFX } from '../audio/SoundFX';
import { BGMGenerator } from '../audio/BGMGenerator';

export class KeyboardController {
    public static init() {
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

            // Ignorar si el usuario está escribiendo en una caja de texto
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
                return;
            }

            const key = e.key;
            const code = e.code;

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
                    ModalManager.closeRewardModal();
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
                    document.getElementById('btn-event-leave')?.click();
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
                    ModalManager.closeRogueChoiceModal();
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

                // Paso 5: Ajustes Finales (Color y Dificultad)
                if (currentStep === 5) {
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
                    if (currentStep === 5) {
                        document.getElementById('btn-wizard-start')?.click();
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
            // 6c. MODAL MULTIJUGADOR ONLINE (Selección de Campeón Host / Guest)
            // =========================================================
            const onlineModal = document.getElementById('online-modal');
            if (onlineModal && !onlineModal.classList.contains('hidden')) {
                const isJoinTab = document.getElementById('view-join-room')?.classList.contains('active');
                const isHostTab = document.getElementById('view-create-room')?.classList.contains('active');

                if (isHostTab) {
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

                if (key === 'Escape') {
                    e.preventDefault();
                    document.getElementById('btn-online-cancel')?.click();
                    return;
                }
                return;
            }

            // =========================================================
            // 7. MODAL DE OPCIONES / CONFIGURACIÓN DE AUDIO
            // =========================================================
            const optionsModal = document.getElementById('modal-options');
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
                // Atajo para volver al menú principal (Escape)
                if (key === 'Escape') {
                    e.preventDefault();
                    ScreenManager.showMainMenu();
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
                if (key === 'z' || key === 'Z' || key === '5') {
                    e.preventDefault();
                    document.getElementById('poly-btn-sprouting')?.click();
                    return;
                }
                if (key === 'x' || key === 'X' || key === '6') {
                    e.preventDefault();
                    document.getElementById('poly-btn-domino')?.click();
                    return;
                }
                if (key === 'v' || key === 'V' || key === '7') {
                    e.preventDefault();
                    document.getElementById('poly-btn-monolith')?.click();
                    return;
                }

                // Rotar Poliminó (R)
                if ((key === 'r' || key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    GameController.rotatePolyomino();
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

                // Salir / Pausar (Escape)
                if (key === 'Escape') {
                    e.preventDefault();
                    document.getElementById('btn-game-back')?.click();
                    return;
                }
            }
        });
    }
}
