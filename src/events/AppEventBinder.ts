// events/AppEventBinder.ts - Enlazador Central de Eventos DOM e Interfaz de Usuario
import type { 
    HeroId, 
    RogueliteDifficulty, 
    BoardShape, 
    BoardSize, 
    AIDifficulty 
} from '../types';
import { ThemeManager } from '../ui/ThemeManager';
import { ScreenManager } from '../ui/ScreenManager';
import { ModalManager } from '../ui/ModalManager';
import { HUDController } from '../ui/HUDController';
import { GameController } from '../controllers/GameController';
import { RoguelikeController } from '../controllers/RoguelikeController';
import { OnlineController } from '../controllers/OnlineController';
import { NetworkManager } from '../network/NetworkManager';
import { SoundFX } from '../audio/SoundFX';
import { BGMGenerator } from '../audio/BGMGenerator';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { SandboxController, type SandboxBrush, type PresetScenario } from '../controllers/SandboxController';
import { TutorialManager } from '../tutorial/TutorialManager';
import { KeyboardController } from './KeyboardController';
import { StoryController } from '../story/StoryController';
import { DevModeManager } from '../core/DevModeManager';
import { setLanguage } from '../i18n/i18n';

export class AppEventBinder {
    public static init() {
        this.setupNavigationEvents();
        this.setupGameEvents();
        this.setupSetupModalEvents();
        this.setupRoguelikeModalEvents();
        this.setupOnlineModalEvents();
        this.setupOptionsModalEvents();
        this.setupSandboxEvents();
        this.setupGlobalKeyboardEvents();
    }

    private static setupNavigationEvents() {
        // Botones de cambio de tema
        document.querySelectorAll('.btn-theme-toggle').forEach(el => {
            el.addEventListener('click', () => {
                const nextTheme = ThemeManager.toggleTheme();
                HUDController.showAlert(`Tema: ${nextTheme === 'light' ? 'Modo Claro ☀️ (Madera Kaya)' : 'Modo Oscuro 🌙 (Pizarra)'}`);
            });
        });

        // Menú Principal
        document.getElementById('btn-menu-roguelike')?.addEventListener('click', () => {
            RoguelikeController.openRoguelikeOrResume();
            SoundFX.playPlaceStone();
        });

        // Modal de Elección Roguelike (Continuar o Nueva Run)
        document.getElementById('btn-rogue-resume-active')?.addEventListener('click', () => {
            RoguelikeController.resumeActiveRun();
        });

        document.getElementById('btn-rogue-start-fresh')?.addEventListener('click', () => {
            RoguelikeController.startFreshRunPrompt();
        });

        document.getElementById('btn-rogue-choice-cancel')?.addEventListener('click', () => {
            ModalManager.closeRogueChoiceModal();
            SoundFX.playPlaceStone();
        });

        const openFreeSetup = () => {
            ModalManager.openNewGameModal();
            ModalManager.updateSetupModalUI(GameController.config);
            SoundFX.playPlaceStone();
        };
        document.getElementById('btn-menu-free')?.addEventListener('click', openFreeSetup);
        document.getElementById('btn-menu-sandbox')?.addEventListener('click', () => {
            SandboxController.startSandboxFromMenu((cfg) => GameController.initGame(cfg));
        });

        document.getElementById('btn-game-sandbox')?.addEventListener('click', () => {
            SandboxController.openInGameSandbox();
        });

        document.getElementById('btn-menu-online')?.addEventListener('click', () => {
            OnlineController.openOnlineModal();
            SoundFX.playPlaceStone();
        });

        // Botón de Modo Historia
        document.getElementById('btn-menu-story')?.addEventListener('click', () => {
            ScreenManager.showGameScreen();
            StoryController.startCampaign();
            SoundFX.playSpecial();
        });

        document.getElementById('btn-menu-dojo')?.addEventListener('click', () => {
            const dojoModal = document.getElementById('dojo-modal');
            const listContainer = document.getElementById('dojo-chapter-list');
            if (dojoModal && listContainer) {
                listContainer.innerHTML = '';
                import('../tutorial/TutorialSteps').then(m => {
                    m.TUTORIAL_CHAPTERS.forEach((chapter, index) => {
                        const numStr = (index + 1).toString();
                        const btn = document.createElement('button');
                        btn.className = 'dojo-card-btn';
                        btn.innerHTML = `
                            <div class="dojo-num-badge">${numStr}</div>
                            <div class="dojo-card-content">
                                <h3 class="dojo-card-title">${chapter.title}</h3>
                            </div>
                        `;
                        btn.addEventListener('click', () => {
                            dojoModal.classList.add('hidden');
                            import('../ui/ScreenManager').then(sm => sm.ScreenManager.showGameScreen());
                            import('../tutorial/TutorialManager').then(tm => {
                                tm.TutorialManager.initTutorial(chapter.id);
                            });
                            SoundFX.playSpecial();
                        });
                        listContainer.appendChild(btn);
                    });
                });
                dojoModal.classList.remove('hidden');
            }
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-cancel-dojo')?.addEventListener('click', () => {
            const dojoModal = document.getElementById('dojo-modal');
            if (dojoModal) dojoModal.classList.add('hidden');
            SoundFX.playPlaceStone();
        });

        // Botones del Modal de Lección Completada
        document.getElementById('btn-tutorial-replay')?.addEventListener('click', () => {
            document.getElementById('modal-tutorial-complete')?.classList.add('hidden');
            if (TutorialManager.currentChapter) {
                TutorialManager.initTutorial(TutorialManager.currentChapter.id);
            }
            SoundFX.playSpecial();
        });

        document.getElementById('btn-tutorial-list')?.addEventListener('click', () => {
            document.getElementById('modal-tutorial-complete')?.classList.add('hidden');
            TutorialManager.stopTutorial();
            ScreenManager.showMainMenu();
            document.getElementById('btn-menu-dojo')?.click();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-menu-options')?.addEventListener('click', () => {
            ModalManager.openOptionsModal();
            SoundFX.playPlaceStone();
        });

        // Botones de volver al menú o mapa
        document.getElementById('btn-game-back')?.addEventListener('click', () => {
            if (TutorialManager.isActive) {
                TutorialManager.stopTutorial();
                ScreenManager.showMainMenu();
            } else if (SandboxController.isSandboxActive) {
                SandboxController.isSandboxActive = false;
                SandboxController.isBrushActive = false;
                ModalManager.closeSandboxModal();
                ScreenManager.showMainMenu();
            } else if (RoguelikeRunManager.isRunActive) {
                RoguelikeController.resumeMap();
            } else {
                ScreenManager.showMainMenu();
            }
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-abandon-run')?.addEventListener('click', () => {
            RoguelikeController.abandonRun();
        });

        document.getElementById('btn-game-reset')?.addEventListener('click', () => {
            GameController.initGame();
            SoundFX.playPlaceStone();
            HUDController.showAlert("🔄 Partida reiniciada.");
        });

        document.getElementById('btn-back-menu')?.addEventListener('click', () => {
            ScreenManager.showMainMenu();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-header-home')?.addEventListener('click', () => {
            ScreenManager.showMainMenu();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-map-back-menu')?.addEventListener('click', () => {
            ScreenManager.showMainMenu();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-map-view-deck')?.addEventListener('click', () => {
            ModalManager.openDeckModal();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-deck-close')?.addEventListener('click', () => {
            ModalManager.closeDeckModal();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-map-view-hero')?.addEventListener('click', () => {
            ModalManager.openDeckModal();
            SoundFX.playPlaceStone();
        });
    }

    private static setupGameEvents() {
        const passHandler = () => {
            GameController.handlePass(true);
        };
        document.getElementById('btn-pass')?.addEventListener('click', passHandler);
        document.getElementById('btn-action-pass')?.addEventListener('click', passHandler);

        document.getElementById('btn-game-undo')?.addEventListener('click', () => {
            GameController.handleUndo();
        });

        document.getElementById('btn-game-redo')?.addEventListener('click', () => {
            GameController.handleRedo();
        });

        document.getElementById('btn-duel-champion-skill')?.addEventListener('click', () => {
            GameController.toggleChampionActiveSkill();
        });

        // Botones de hechizos en barra inferior (4 Hechizos Místicos)
        document.getElementById('spell-btn-rewind')?.addEventListener('click', () => {
            GameController.selectSpell('rewind');
        });
        document.getElementById('spell-btn-meteor')?.addEventListener('click', () => {
            GameController.selectSpell('meteor');
        });
        document.getElementById('spell-btn-shield')?.addEventListener('click', () => {
            GameController.selectSpell('shield');
        });
        document.getElementById('spell-btn-convert')?.addEventListener('click', () => {
            GameController.selectSpell('convert');
        });

        // Botones de Fichas Poliminó en barra táctica
        document.getElementById('poly-btn-sprouting')?.addEventListener('click', () => {
            GameController.selectPolyomino('sprouting');
        });
        document.getElementById('poly-btn-domino')?.addEventListener('click', () => {
            GameController.selectPolyomino('domino');
        });
        document.getElementById('poly-btn-monolith')?.addEventListener('click', () => {
            GameController.selectPolyomino('monolith');
        });

        document.getElementById('btn-modal-rematch')?.addEventListener('click', () => {
            RoguelikeController.handleRematchOrRewardButton();
        });

        document.getElementById('btn-modal-inspect')?.addEventListener('click', () => {
            ModalManager.inspectBoard();
        });

        document.getElementById('btn-modal-close')?.addEventListener('click', () => {
            ModalManager.inspectBoard();
        });

        document.getElementById('floating-inspect-btn')?.addEventListener('click', () => {
            ModalManager.restoreScoreModal();
        });
    }

    private static setupSetupModalEvents() {
        let tempConfig = { ...GameController.config };

        const refreshUI = () => ModalManager.updateSetupModalUI(tempConfig);

        // --- PASO 1: NÚMERO DE JUGADORES (Con Auto-avance) ---
        document.getElementById('setup-players-2')?.addEventListener('click', () => {
            tempConfig.playerCount = 2;
            refreshUI();
            SoundFX.playPlaceStone();
            setTimeout(() => ModalManager.setWizardStep(2, tempConfig), 160);
        });

        document.getElementById('setup-players-4')?.addEventListener('click', () => {
            tempConfig.playerCount = 4;
            refreshUI();
            SoundFX.playPlaceStone();
            setTimeout(() => ModalManager.setWizardStep(2, tempConfig), 160);
        });

        // --- PASO 2: MODO DE JUEGO (Con Auto-avance) ---
        document.getElementById('setup-mode-1via')?.addEventListener('click', () => {
            tempConfig.gameMode = '1via';
            refreshUI();
            SoundFX.playPlaceStone();
            setTimeout(() => ModalManager.setWizardStep(3, tempConfig), 160);
        });

        document.getElementById('setup-mode-1v1')?.addEventListener('click', () => {
            tempConfig.gameMode = '1v1';
            refreshUI();
            SoundFX.playPlaceStone();
            setTimeout(() => ModalManager.setWizardStep(3, tempConfig), 160);
        });

        // --- PASO 3: TABLERO Y FORMA (Selección libre sin auto-avance involuntario) ---
        const sizes: BoardSize[] = [9, 13, 19];
        sizes.forEach(sz => {
            document.getElementById(`setup-size-${sz}`)?.addEventListener('click', () => {
                tempConfig.size = sz;
                refreshUI();
                SoundFX.playPlaceStone();
            });
        });

        const shapes: BoardShape[] = ['square', 'triangle', 'hex', 'eroded', 'islands', 'cross', 'procedural'];
        shapes.forEach(sh => {
            document.getElementById(`setup-shape-${sh}`)?.addEventListener('click', () => {
                tempConfig.shape = sh;
                refreshUI();
                SoundFX.playPlaceStone();
            });
        });

        // --- PASO 4: CAMPEÓN MÍSTICO ---
        const heroes: HeroId[] = ['normal', 'tengu', 'himiko', 'kitsune', 'ronin', 'alchemist', 'ryujin'];

        document.getElementById('btn-setup-hero-prev')?.addEventListener('click', () => {
            const currentHero = tempConfig.heroId || 'normal';
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            const prevIdx = (idx - 1 + heroes.length) % heroes.length;
            tempConfig.heroId = heroes[prevIdx];
            refreshUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-setup-hero-next')?.addEventListener('click', () => {
            const currentHero = tempConfig.heroId || 'normal';
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            const nextIdx = (idx + 1) % heroes.length;
            tempConfig.heroId = heroes[nextIdx];
            refreshUI();
            SoundFX.playPlaceStone();
        });

        document.querySelectorAll('#setup-hero-thumb-strip .hero-thumb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const h = btn.getAttribute('data-hero') as HeroId;
                if (h) {
                    tempConfig.heroId = h;
                    refreshUI();
                    SoundFX.playPlaceStone();
                }
            });
        });

        // --- PASO 5: AJUSTES FINALES (Color, Dificultad, Komi, Temporizador) ---
        document.getElementById('setup-color-black')?.addEventListener('click', () => {
            tempConfig.humanColor = 1;
            refreshUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById('setup-color-white')?.addEventListener('click', () => {
            tempConfig.humanColor = 2;
            refreshUI();
            SoundFX.playPlaceStone();
        });

        const diffs: AIDifficulty[] = ['easy', 'medium', 'hard', 'dan'];
        diffs.forEach(diff => {
            document.getElementById(`setup-diff-${diff}`)?.addEventListener('click', () => {
                tempConfig.difficulty = diff;
                refreshUI();
                SoundFX.playPlaceStone();
            });
        });

        // --- CONFIGURACIÓN DE PIEDRAS ESPECIALES / POLIMINÓS ---
        if (!tempConfig.specialStones) {
            tempConfig.specialStones = {
                enabled: false,
                playerSprouting: 2,
                playerDomino: 2,
                playerMonolith: 1,
                aiEnabled: false,
                aiSprouting: 2,
                aiDomino: 2,
                aiMonolith: 1
            };
        }

        document.getElementById('btn-toggle-special-stones')?.addEventListener('click', () => {
            if (!tempConfig.specialStones) return;
            tempConfig.specialStones.enabled = !tempConfig.specialStones.enabled;
            refreshUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-toggle-ai-special')?.addEventListener('click', () => {
            if (!tempConfig.specialStones) return;
            tempConfig.specialStones.aiEnabled = !tempConfig.specialStones.aiEnabled;
            refreshUI();
            SoundFX.playPlaceStone();
        });

        document.querySelectorAll('.btn-counter-adj').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = (e.currentTarget as HTMLElement).getAttribute('data-target');
                const delta = parseInt((e.currentTarget as HTMLElement).getAttribute('data-delta') || '0', 10);
                if (target && tempConfig.specialStones) {
                    const st = tempConfig.specialStones as Record<string, any>;
                    if (typeof st[target] === 'number') {
                        const current = st[target] as number;
                        const next = Math.max(0, Math.min(10, current + delta));
                        st[target] = next;
                        refreshUI();
                        SoundFX.playPlaceStone();
                    }
                }
            });
        });

        document.querySelectorAll('.btn-setup-komi').forEach(btn => {
            btn.addEventListener('click', () => {
                tempConfig.komi = parseFloat(btn.getAttribute('data-komi') || '6.5');
                refreshUI();
                SoundFX.playPlaceStone();
            });
        });

        document.getElementById('setup-komi-input')?.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(val) && val >= 0) {
                tempConfig.komi = val;
                refreshUI();
            }
        });

        // --- CONTROLES DE TEMPORIZADOR EN EL WIZARD ---
        if (!tempConfig.timer) {
            tempConfig.timer = {
                mode: 'none',
                byoYomiSeconds: 30,
                mainTimeSeconds: 300,
                incrementSeconds: 5
            };
        }

        document.getElementById('btn-toggle-timer')?.addEventListener('click', () => {
            if (!tempConfig.timer) return;
            tempConfig.timer.mode = tempConfig.timer.mode === 'none' ? 'per_move' : 'none';
            refreshUI();
            SoundFX.playPlaceStone();
        });

        document.querySelectorAll('.btn-timer-mode').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode') as 'per_move' | 'absolute' | 'fischer';
                if (mode && tempConfig.timer) {
                    tempConfig.timer.mode = mode;
                    refreshUI();
                    SoundFX.playPlaceStone();
                }
            });
        });

        document.querySelectorAll('.btn-timer-val').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseInt(btn.getAttribute('data-val') || '30', 10);
                const inc = parseInt(btn.getAttribute('data-inc') || '5', 10);
                if (tempConfig.timer) {
                    if (tempConfig.timer.mode === 'per_move') {
                        tempConfig.timer.byoYomiSeconds = val;
                    } else if (tempConfig.timer.mode === 'absolute') {
                        tempConfig.timer.mainTimeSeconds = val;
                    } else if (tempConfig.timer.mode === 'fischer') {
                        tempConfig.timer.mainTimeSeconds = val;
                        tempConfig.timer.incrementSeconds = inc;
                    }
                    refreshUI();
                    SoundFX.playPlaceStone();
                }
            });
        });

        // --- NAVEGACIÓN DEL WIZARD (Atrás / Siguiente / Stepper) ---
        document.getElementById('btn-wizard-prev')?.addEventListener('click', () => {
            if (ModalManager.currentWizardStep === 1) {
                ModalManager.closeNewGameModal();
            } else {
                ModalManager.setWizardStep(ModalManager.currentWizardStep - 1, tempConfig);
            }
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-wizard-next')?.addEventListener('click', () => {
            ModalManager.setWizardStep(ModalManager.currentWizardStep + 1, tempConfig);
            SoundFX.playPlaceStone();
        });

        document.querySelectorAll('#wizard-stepper .wizard-step-node').forEach(node => {
            node.addEventListener('click', () => {
                const targetStep = parseInt(node.getAttribute('data-step') || '1', 10);
                ModalManager.setWizardStep(targetStep, tempConfig);
                SoundFX.playPlaceStone();
            });
        });

        document.getElementById('btn-setup-start')?.addEventListener('click', () => {
            ModalManager.closeNewGameModal();
            ScreenManager.showGameScreen();
            GameController.initGame(tempConfig);
            SoundFX.playPlaceStone();
        });
    }

    private static setupRoguelikeModalEvents() {
        const diffs: RogueliteDifficulty[] = ['easy', 'normal', 'hard', 'extreme'];
        diffs.forEach(d => {
            document.getElementById(`rogue-diff-${d}`)?.addEventListener('click', () => {
                RoguelikeController.setDifficulty(d);
            });
        });

        document.getElementById('btn-hero-prev')?.addEventListener('click', () => {
            RoguelikeController.prevHero();
        });

        document.getElementById('btn-hero-next')?.addEventListener('click', () => {
            RoguelikeController.nextHero();
        });

        document.querySelectorAll('#rogue-hero-thumb-strip .hero-thumb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const h = btn.getAttribute('data-hero') as HeroId | null;
                if (h) RoguelikeController.setHero(h);
            });
        });

        document.getElementById('btn-rogue-cancel')?.addEventListener('click', () => {
            ModalManager.closeRoguelikeSetupModal();
        });

        document.getElementById('btn-rogue-start')?.addEventListener('click', () => {
            RoguelikeController.startNewExpedition();
        });

        document.getElementById('btn-reward-confirm')?.addEventListener('click', () => {
            RoguelikeController.claimReward();
        });
        document.getElementById('btn-claim-reward')?.addEventListener('click', () => {
            RoguelikeController.claimReward();
        });

        // Botón 'Continuar Ruta ➔' del modal de eventos
        document.getElementById('btn-event-leave')?.addEventListener('click', () => {
            const current = RoguelikeRunManager.getCurrentNode();
            if (current) {
                RoguelikeRunManager.completeNode(current.id);
            }
            ModalManager.closeEventModal();
            RoguelikeController.renderMap();
            HUDController.showAlert("🗺️ Has proseguido tu ruta en el mapa.");
            SoundFX.playPlaceStone();
        });
    }

    private static setupOnlineModalEvents() {
        document.getElementById('tab-btn-create-room')?.addEventListener('click', () => {
            ModalManager.switchOnlineTab('create');
            OnlineController.startHostingRoom();
            SoundFX.playPlaceStone();
        });

        document.getElementById('tab-btn-join-room')?.addEventListener('click', () => {
            ModalManager.switchOnlineTab('join');
            SoundFX.playPlaceStone();
            const input = document.getElementById('input-join-room-code') as HTMLInputElement | null;
            if (input) {
                setTimeout(() => input.focus(), 60);
            }
        });

        document.getElementById('btn-copy-room-link')?.addEventListener('click', () => {
            OnlineController.copyRoomLink();
            SoundFX.playPlaceStone();
        });

        document.getElementById('online-mode-standard')?.addEventListener('click', () => {
            OnlineController.onlineGameType = 'standard';
            document.getElementById('online-mode-standard')?.classList.add('active');
            document.getElementById('online-mode-coop')?.classList.remove('active');
            document.getElementById('online-players-count-section')?.classList.remove('hidden');
            OnlineController.startHostingRoom();
            SoundFX.playPlaceStone();
        });

        document.getElementById('online-mode-coop')?.addEventListener('click', () => {
            OnlineController.onlineGameType = 'coop_rogue';
            OnlineController.onlinePlayerCount = 2;
            document.getElementById('online-mode-coop')?.classList.add('active');
            document.getElementById('online-mode-standard')?.classList.remove('active');
            document.getElementById('online-players-count-section')?.classList.add('hidden');
            OnlineController.startHostingRoom();
            SoundFX.playPlaceStone();
        });

        document.getElementById('online-players-2')?.addEventListener('click', () => {
            OnlineController.onlinePlayerCount = 2;
            ModalManager.updateOnlineModalUI(
                OnlineController.onlineHostColor, 
                OnlineController.onlineShape, 
                OnlineController.onlineSize, 
                OnlineController.onlineKomi,
                OnlineController.onlinePlayerCount
            );
            OnlineController.startHostingRoom();
            SoundFX.playPlaceStone();
        });

        document.getElementById('online-players-4')?.addEventListener('click', () => {
            OnlineController.onlinePlayerCount = 4;
            ModalManager.updateOnlineModalUI(
                OnlineController.onlineHostColor, 
                OnlineController.onlineShape, 
                OnlineController.onlineSize, 
                OnlineController.onlineKomi,
                OnlineController.onlinePlayerCount
            );
            OnlineController.startHostingRoom();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-online-force-start')?.addEventListener('click', () => {
            OnlineController.forceStartOnlineGame();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-online-modal-start')?.addEventListener('click', () => {
            OnlineController.forceStartOnlineGame();
            SoundFX.playPlaceStone();
        });

        document.getElementById('online-color-black')?.addEventListener('click', () => {
            OnlineController.onlineHostColor = 1;
            ModalManager.updateOnlineModalUI(
                OnlineController.onlineHostColor, 
                OnlineController.onlineShape, 
                OnlineController.onlineSize, 
                OnlineController.onlineKomi,
                OnlineController.onlinePlayerCount
            );
            OnlineController.startHostingRoom();
            SoundFX.playPlaceStone();
        });

        document.getElementById('online-color-white')?.addEventListener('click', () => {
            OnlineController.onlineHostColor = 2;
            ModalManager.updateOnlineModalUI(
                OnlineController.onlineHostColor, 
                OnlineController.onlineShape, 
                OnlineController.onlineSize, 
                OnlineController.onlineKomi,
                OnlineController.onlinePlayerCount
            );
            OnlineController.startHostingRoom();
            SoundFX.playPlaceStone();
        });

        const shapes: BoardShape[] = ['square', 'triangle', 'hex', 'eroded', 'islands', 'cross', 'procedural'];
        shapes.forEach(sh => {
            document.getElementById(`online-shape-${sh}`)?.addEventListener('click', () => {
                OnlineController.onlineShape = sh;
                ModalManager.updateOnlineModalUI(
                    OnlineController.onlineHostColor, 
                    OnlineController.onlineShape, 
                    OnlineController.onlineSize, 
                    OnlineController.onlineKomi,
                    OnlineController.onlinePlayerCount
                );
                OnlineController.startHostingRoom();
                SoundFX.playPlaceStone();
            });
        });

        const sizes: BoardSize[] = [9, 13, 19];
        sizes.forEach(sz => {
            document.getElementById(`online-size-${sz}`)?.addEventListener('click', () => {
                OnlineController.onlineSize = sz;
                ModalManager.updateOnlineModalUI(
                    OnlineController.onlineHostColor, 
                    OnlineController.onlineShape, 
                    OnlineController.onlineSize, 
                    OnlineController.onlineKomi,
                    OnlineController.onlinePlayerCount
                );
                OnlineController.startHostingRoom();
                SoundFX.playPlaceStone();
            });
        });

        document.querySelectorAll('.btn-online-komi').forEach(btn => {
            btn.addEventListener('click', () => {
                OnlineController.onlineKomi = parseFloat(btn.getAttribute('data-komi') || '6.5');
                ModalManager.updateOnlineModalUI(
                    OnlineController.onlineHostColor, 
                    OnlineController.onlineShape, 
                    OnlineController.onlineSize, 
                    OnlineController.onlineKomi,
                    OnlineController.onlinePlayerCount
                );
                OnlineController.startHostingRoom();
                SoundFX.playPlaceStone();
            });
        });

        document.getElementById('online-komi-input')?.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(val) && val >= 0) {
                OnlineController.onlineKomi = val;
                ModalManager.updateOnlineModalUI(
                    OnlineController.onlineHostColor, 
                    OnlineController.onlineShape, 
                    OnlineController.onlineSize, 
                    OnlineController.onlineKomi,
                    OnlineController.onlinePlayerCount
                );
                OnlineController.startHostingRoom();
            }
        });

        const handleJoinAction = () => {
            const input = document.getElementById('input-join-room-code') as HTMLInputElement | null;
            if (input && input.value) {
                OnlineController.joinOnlineRoom(input.value);
            } else {
                HUDController.showAlert("Por favor, introduce el código de la sala.");
                SoundFX.playIllegal();
            }
        };

        document.getElementById('btn-submit-join-room')?.addEventListener('click', () => {
            handleJoinAction();
        });

        const inputJoin = document.getElementById('input-join-room-code') as HTMLInputElement | null;
        inputJoin?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleJoinAction();
            }
        });

        inputJoin?.addEventListener('paste', () => {
            setTimeout(() => {
                if (inputJoin.value) {
                    inputJoin.value = OnlineController.sanitizeRoomCode(inputJoin.value);
                }
            }, 20);
        });

        const heroes: HeroId[] = ['normal', 'tengu', 'himiko', 'kitsune', 'ronin', 'alchemist', 'ryujin'];

        // Navegación de héroe para el Anfitrión (Host)
        document.getElementById('btn-online-host-hero-prev')?.addEventListener('click', () => {
            const currentHero = OnlineController.onlineHostHero || 'normal';
            let idx = heroes.indexOf(currentHero as HeroId);
            if (idx === -1) idx = 0;
            const prevIdx = (idx - 1 + heroes.length) % heroes.length;
            OnlineController.onlineHostHero = heroes[prevIdx];
            ModalManager.updateOnlineModalUI(
                OnlineController.onlineHostColor, 
                OnlineController.onlineShape, 
                OnlineController.onlineSize, 
                OnlineController.onlineKomi, 
                OnlineController.onlinePlayerCount,
                OnlineController.onlineHostHero
            );
            NetworkManager.sendHeroSelect(OnlineController.onlineHostHero);
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-online-host-hero-next')?.addEventListener('click', () => {
            const currentHero = OnlineController.onlineHostHero || 'normal';
            let idx = heroes.indexOf(currentHero as HeroId);
            if (idx === -1) idx = 0;
            const nextIdx = (idx + 1) % heroes.length;
            OnlineController.onlineHostHero = heroes[nextIdx];
            ModalManager.updateOnlineModalUI(
                OnlineController.onlineHostColor, 
                OnlineController.onlineShape, 
                OnlineController.onlineSize, 
                OnlineController.onlineKomi, 
                OnlineController.onlinePlayerCount,
                OnlineController.onlineHostHero
            );
            NetworkManager.sendHeroSelect(OnlineController.onlineHostHero);
            SoundFX.playPlaceStone();
        });

        document.querySelectorAll('#online-host-hero-thumb-strip .hero-thumb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const h = btn.getAttribute('data-hero') as HeroId | null;
                if (h) {
                    OnlineController.onlineHostHero = h;
                    ModalManager.updateOnlineModalUI(
                        OnlineController.onlineHostColor, 
                        OnlineController.onlineShape, 
                        OnlineController.onlineSize, 
                        OnlineController.onlineKomi, 
                        OnlineController.onlinePlayerCount,
                        OnlineController.onlineHostHero
                    );
                    NetworkManager.sendHeroSelect(OnlineController.onlineHostHero);
                    SoundFX.playPlaceStone();
                }
            });
        });

        // Navegación de héroe para el Invitado (Guest)
        document.getElementById('btn-online-guest-hero-prev')?.addEventListener('click', () => {
            const currentHero = OnlineController.onlineGuestHero || 'normal';
            let idx = heroes.indexOf(currentHero as HeroId);
            if (idx === -1) idx = 0;
            const prevIdx = (idx - 1 + heroes.length) % heroes.length;
            OnlineController.onlineGuestHero = heroes[prevIdx];
            ModalManager.updateOnlineGuestHeroUI(OnlineController.onlineGuestHero);
            NetworkManager.sendHeroSelect(OnlineController.onlineGuestHero);
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-online-guest-hero-next')?.addEventListener('click', () => {
            const currentHero = OnlineController.onlineGuestHero || 'normal';
            let idx = heroes.indexOf(currentHero as HeroId);
            if (idx === -1) idx = 0;
            const nextIdx = (idx + 1) % heroes.length;
            OnlineController.onlineGuestHero = heroes[nextIdx];
            ModalManager.updateOnlineGuestHeroUI(OnlineController.onlineGuestHero);
            NetworkManager.sendHeroSelect(OnlineController.onlineGuestHero);
            SoundFX.playPlaceStone();
        });

        document.querySelectorAll('#online-guest-hero-thumb-strip .hero-thumb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const h = btn.getAttribute('data-hero') as HeroId | null;
                if (h) {
                    OnlineController.onlineGuestHero = h;
                    ModalManager.updateOnlineGuestHeroUI(OnlineController.onlineGuestHero);
                    NetworkManager.sendHeroSelect(OnlineController.onlineGuestHero);
                    SoundFX.playPlaceStone();
                }
            });
        });

        document.getElementById('btn-online-cancel')?.addEventListener('click', () => {
            ModalManager.closeOnlineModal();
            NetworkManager.disconnect();
            SoundFX.playPlaceStone();
        });
    }

    private static setupOptionsModalEvents() {
        const volSlider = document.getElementById('opt-vol-slider') as HTMLInputElement | null;
        volSlider?.addEventListener('input', (e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            SoundFX.setMasterVolume(val / 100);
            BGMGenerator.setVolume(val / 100);
            const volText = document.getElementById('opt-vol-text');
            if (volText) volText.innerText = `${val}%`;
        });

        volSlider?.addEventListener('change', () => {
            SoundFX.playPlaceStone();
        });

        document.getElementById('opt-sfx-toggle')?.addEventListener('click', () => {
            SoundFX.toggleSFX();
            ModalManager.updateOptionsModalUI();
        });

        document.getElementById('opt-bgm-toggle')?.addEventListener('click', () => {
            SoundFX.toggleBGM();
            ModalManager.updateOptionsModalUI();
        });

        // Selector de Idioma (Español / Inglés)
        document.getElementById('opt-lang-es')?.addEventListener('click', () => {
            setLanguage('es');
            ModalManager.updateOptionsModalUI();
            if (GameController.state) GameController.updateInGameUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById('opt-lang-en')?.addEventListener('click', () => {
            setLanguage('en');
            ModalManager.updateOptionsModalUI();
            if (GameController.state) GameController.updateInGameUI();
            SoundFX.playPlaceStone();
        });

        // Selector de Modo Desarrollador
        document.getElementById('opt-dev-toggle')?.addEventListener('click', () => {
            DevModeManager.toggleDevMode();
            ModalManager.updateOptionsModalUI();
            if (GameController.state) GameController.updateInGameUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-options-header-close')?.addEventListener('click', () => {
            ModalManager.closeOptionsModal();
            SoundFX.playPlaceStone();
        });
    }

    private static setupSandboxEvents() {
        // 1. Cerrar Modal Sandbox
        document.getElementById('btn-sandbox-close')?.addEventListener('click', () => {
            ModalManager.closeSandboxModal();
            SoundFX.playPlaceStone();
        });

        // 2. Conmutar Pincel Libre
        document.getElementById('btn-toggle-sandbox-brush')?.addEventListener('click', () => {
            SandboxController.toggleBrush();
        });

        // 3. Pestañas del Panel Sandbox
        document.querySelectorAll('.sandbox-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                if (tabId) {
                    ModalManager.switchSandboxTab(tabId);
                    SoundFX.playPlaceStone();
                }
            });
        });

        // 4. Selección de Pinceles
        document.querySelectorAll('.btn-sandbox-brush').forEach(btn => {
            btn.addEventListener('click', () => {
                const brush = btn.getAttribute('data-brush') as SandboxBrush;
                if (brush) {
                    SandboxController.setBrush(brush);
                }
            });
        });

        // 5. Botón Limpiar Tablero
        document.getElementById('btn-sandbox-clear-board')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.loadPreset('empty_clean', GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        // 6. Topología y Tamaño en Vivo
        let selectedShape: BoardShape = 'square';
        let selectedSize: BoardSize = 9;

        document.querySelectorAll('.btn-sandbox-shape').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-sandbox-shape').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedShape = (btn.getAttribute('data-shape') || 'square') as BoardShape;
                SoundFX.playPlaceStone();
            });
        });

        document.querySelectorAll('.btn-sandbox-size').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-sandbox-size').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedSize = parseInt(btn.getAttribute('data-size') || '9', 10) as BoardSize;
                SoundFX.playPlaceStone();
            });
        });

        document.getElementById('btn-sandbox-apply-topology')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.changeBoardShape(selectedShape, selectedSize, GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        // 7. Escenarios Predefinidos (Tests de Reglas)
        document.querySelectorAll('.sandbox-preset-card').forEach(card => {
            card.addEventListener('click', () => {
                const preset = card.getAttribute('data-preset') as PresetScenario;
                if (preset && GameController.board && GameController.state) {
                    SandboxController.loadPreset(preset, GameController.board, GameController.state, () => GameController.updateInGameUI());
                }
            });
        });

        // 8. Hechizos y Campeones
        document.getElementById('btn-sandbox-infinite-spells')?.addEventListener('click', () => {
            SandboxController.grantInfiniteResources();
        });

        document.getElementById('btn-sandbox-trigger-active')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.triggerActiveSkill(GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        document.getElementById('btn-sandbox-trigger-passive')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.triggerPassiveSkill(GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        document.getElementById('btn-sandbox-force-stone-rain')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.forceStoneRain(GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        document.getElementById('btn-sandbox-force-dragon-burn')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.forceDragonCornerBurn(GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        document.getElementById('btn-sandbox-force-shield')?.addEventListener('click', () => {
            SandboxController.forceDivineShieldTarget(() => GameController.updateInGameUI());
        });

        document.getElementById('btn-sandbox-force-convert')?.addEventListener('click', () => {
            SandboxController.forceChromaticConversion(() => GameController.updateInGameUI());
        });

        document.querySelectorAll('.btn-sandbox-hero').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-sandbox-hero').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const heroId = btn.getAttribute('data-hero') as HeroId;
                if (heroId) {
                    SandboxController.changeChampion(heroId, () => GameController.updateInGameUI());
                }
            });
        });

        document.querySelectorAll('.btn-sandbox-turn').forEach(btn => {
            btn.addEventListener('click', () => {
                const turn = parseInt(btn.getAttribute('data-turn') || '1', 10) as any;
                if (GameController.state) {
                    SandboxController.forceCurrentPlayer(turn, GameController.state, () => GameController.updateInGameUI());
                }
            });
        });
    }


    /**
     * Navegación y Selección Universal con Teclado (Delegado a KeyboardController)
     */
    private static setupGlobalKeyboardEvents() {
        KeyboardController.init();
    }
}
