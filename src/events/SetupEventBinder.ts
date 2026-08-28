import type { HeroId, RogueliteDifficulty, BoardShape, BoardSize, GameSetupConfig } from '../types';
import { ModalManager } from '../ui/ModalManager';
import { HUDController } from '../ui/HUDController';
import { GameController } from '../controllers/GameController';
import { RoguelikeController } from '../controllers/RoguelikeController';
import { ScreenManager } from '../ui/ScreenManager';
import { SoundFX } from '../audio/SoundFX';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { SetupModalRenderer } from '../ui/modals/SetupModalRenderer';

export class SetupEventBinder {
    // Config temporal del wizard (antes en AppEventBinder.tempSetupConfig)
    public static tempSetupConfig: GameSetupConfig = { 
        ...GameController.config,
        isRoguelikeMatch: false,
        background: 'combat'
    };

    public static init() {
        SetupEventBinder.tempSetupConfig = { 
            ...GameController.config,
            isRoguelikeMatch: false,
            background: 'combat'
        };
        this.setupSetupModalEvents();
        this.setupRoguelikeModalEvents();
    }

    private static setupSetupModalEvents() {
        const tempConfig = SetupEventBinder.tempSetupConfig;
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

        document.getElementById('setup-mode-aivsai')?.addEventListener('click', () => {
            tempConfig.gameMode = 'aivsai';
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

        const shapes: BoardShape[] = ['square', 'volcano', 'sky', 'oni', 'triangle', 'hex', 'eroded', 'islands_v1', 'islands_v2', 'islands', 'cross', 'hourglass', 'geode', 'spiral', 'rings', 'star_5', 'star_6', 'procedural'];
        shapes.forEach(sh => {
            document.getElementById(`setup-shape-${sh}`)?.addEventListener('click', () => {
                tempConfig.shape = sh;
                if (sh === 'procedural') {
                    tempConfig.seed = Math.floor(Math.random() * 9999999);
                }
                refreshUI();
                SoundFX.playPlaceStone();
            });
        });

        const setupRerollBtn = document.getElementById('setup-shape-procedural-reroll');
        setupRerollBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            tempConfig.shape = 'procedural';
            tempConfig.seed = Math.floor(Math.random() * 9999999);
            setupRerollBtn.classList.add('spin-anim');
            setTimeout(() => setupRerollBtn.classList.remove('spin-anim'), 400);
            refreshUI();
            SoundFX.playPlaceStone();
        });

        // Escenarios / Fondos de Combate
        document.querySelectorAll('.btn-setup-bg').forEach(btn => {
            btn.addEventListener('click', () => {
                const bg = btn.getAttribute('data-bg') as any;
                if (bg) {
                    tempConfig.background = bg;
                    refreshUI();
                    SoundFX.playPlaceStone();
                }
            });
        });

        // Selector de slot 4P (P2, P3, P4)
        document.querySelectorAll('.btn-rival-slot').forEach(btn => {
            btn.addEventListener('click', () => {
                const slot = parseInt(btn.getAttribute('data-slot') || '2', 10);
                SetupModalRenderer.current4PSlot = slot;
                SetupModalRenderer.updateRivalStage6(tempConfig);
                SoundFX.playPlaceStone();
            });
        });

        // Selector de Campeón Rival
        document.querySelectorAll('.btn-setup-rival').forEach(btn => {
            btn.addEventListener('click', () => {
                const rival = (btn.getAttribute('data-rival') || 'random') as any;
                if (tempConfig.playerCount === 4) {
                    if (!tempConfig.enemyHeroIds) tempConfig.enemyHeroIds = {};
                    tempConfig.enemyHeroIds[SetupModalRenderer.current4PSlot] = rival;
                } else {
                    tempConfig.enemyHeroId = rival;
                }
                // Actualizar el stage del paso 6 inmediatamente
                SetupModalRenderer.updateRivalStage6(tempConfig);
                refreshUI();
                SoundFX.playPlaceStone();
            });
        });

        // Clic en el standee del rival (paso 6) para ciclar entre rivales disponibles
        document.getElementById('wizard-stage-rival-combatant')?.addEventListener('click', () => {
            const rivalList: (HeroId | 'random')[] = ['random', 'normal', 'tengu', 'himiko', 'kitsune', 'ronin', 'alchemist', 'ryujin'];
            const current = (tempConfig.enemyHeroId || 'random') as HeroId | 'random';
            let idx = rivalList.indexOf(current);
            if (idx === -1) idx = 0;
            const nextIdx = (idx + 1) % rivalList.length;
            tempConfig.enemyHeroId = rivalList[nextIdx];
            SetupModalRenderer.updateRivalStage6(tempConfig);
            refreshUI();
            SoundFX.playPlaceStone();
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

        // --- SELECTORES DE DIFICULTAD DE IA ---
        const getKyuDanString = (val: number): string => {
            if (val <= 30) return `${31 - val}k`;
            return `${val - 30}d`;
        };

        // Estado del toggle pack/granular
        let isGranularAI = false;

        document.getElementById('btn-toggle-ai-granular')?.addEventListener('click', () => {
            isGranularAI = !isGranularAI;
            const btn = document.getElementById('btn-toggle-ai-granular');
            const label = document.getElementById('label-toggle-ai-granular');
            if (btn) {
                btn.setAttribute('data-enabled', isGranularAI ? 'true' : 'false');
                btn.classList.toggle('active', isGranularAI);
            }
            if (label) label.innerText = isGranularAI ? 'Granular ⚙️' : 'Pack Mode 📦';
            
            document.getElementById('ai-pack-mode-box')?.classList.toggle('hidden', isGranularAI);
            document.getElementById('ai-granular-mode-box')?.classList.toggle('hidden', !isGranularAI);
            
            if (isGranularAI) {
                if (!tempConfig.slots) tempConfig.slots = {} as any;
                [1, 2, 3, 4].forEach(p => {
                    const playerId = p as import('../core/GraphBoard').PlayerId;
                    if (!tempConfig.slots![playerId]) {
                        tempConfig.slots![playerId] = { slotId: playerId, teamId: (p%2===0?2:1) as import('../types').TeamId, type: 'ai', aiDifficulty: tempConfig.difficulty };
                    } else if (!tempConfig.slots![playerId].aiDifficulty) {
                        tempConfig.slots![playerId].aiDifficulty = tempConfig.difficulty;
                    }
                });
            }

            refreshUI();
            SoundFX.playPlaceStone();
        });

        // Evento Slider Maestro (Pack)
        document.getElementById('ai-master-slider')?.addEventListener('input', (e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            const str = getKyuDanString(val);
            document.getElementById('ai-master-display')!.innerText = str;
            tempConfig.difficulty = str;

            // Actualizar todos los slots
            if (!tempConfig.slots) tempConfig.slots = {} as any;
            [1, 2, 3, 4].forEach(p => {
                const playerId = p as import('../core/GraphBoard').PlayerId;
                if (!tempConfig.slots![playerId]) {
                    tempConfig.slots![playerId] = { slotId: playerId, teamId: (p%2===0?2:1) as import('../types').TeamId, type: 'ai', aiDifficulty: str };
                } else {
                    tempConfig.slots![playerId].aiDifficulty = str;
                }
            });
            refreshUI();
        });

        // Eventos Sliders Individuales
        [1, 2, 3, 4].forEach(p => {
            document.getElementById(`ai-granular-p${p}-slider`)?.addEventListener('input', (e) => {
                const val = parseInt((e.target as HTMLInputElement).value, 10);
                const str = getKyuDanString(val);
                document.getElementById(`ai-granular-p${p}-display`)!.innerText = str;
                
                const playerId = p as import('../core/GraphBoard').PlayerId;
                if (!tempConfig.slots) tempConfig.slots = {} as any;
                if (!tempConfig.slots![playerId]) {
                    tempConfig.slots![playerId] = { slotId: playerId, teamId: (p%2===0?2:1) as import('../types').TeamId, type: 'ai', aiDifficulty: str };
                } else {
                    tempConfig.slots![playerId].aiDifficulty = str;
                }
                
                refreshUI();
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

        document.querySelectorAll('.btn-setup-handicap').forEach(btn => {
            btn.addEventListener('click', () => {
                const count = parseInt(btn.getAttribute('data-handicap') || '0', 10);
                tempConfig.handicap = count;
                if (count >= 2) {
                    tempConfig.komi = 0.5; // Komi canónico con hándicap
                } else if (tempConfig.komi === 0.5) {
                    tempConfig.komi = 6.5; // Restaurar komi estándar si se quita el hándicap
                }
                refreshUI();
                SoundFX.playPlaceStone();
            });
        });

        document.getElementById('setup-handicap-input')?.addEventListener('input', (e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(val) && val >= 0) {
                tempConfig.handicap = val;
                if (val >= 2 && tempConfig.komi === 6.5) {
                    tempConfig.komi = 0.5;
                } else if (val < 2 && tempConfig.komi === 0.5) {
                    tempConfig.komi = 6.5;
                }
                refreshUI();
            }
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

        // --- CONTROLES DE KOMI PARA 4 JUGADORES (P2, P3, P4) ---
        // P2 White (2º Turno)
        document.querySelectorAll('.btn-setup-komi-p2').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!tempConfig.playerKomis) tempConfig.playerKomis = { 2: 2.5, 3: 4.5, 4: 6.5 };
                tempConfig.playerKomis[2] = parseFloat(btn.getAttribute('data-komi') || '2.5');
                refreshUI();
                SoundFX.playPlaceStone();
            });
        });
        document.getElementById('setup-komi-p2-input')?.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(val) && val >= 0) {
                if (!tempConfig.playerKomis) tempConfig.playerKomis = { 2: 2.5, 3: 4.5, 4: 6.5 };
                tempConfig.playerKomis[2] = val;
                refreshUI();
            }
        });

        // P3 Emerald (3º Turno)
        document.querySelectorAll('.btn-setup-komi-p3').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!tempConfig.playerKomis) tempConfig.playerKomis = { 2: 2.5, 3: 4.5, 4: 6.5 };
                tempConfig.playerKomis[3] = parseFloat(btn.getAttribute('data-komi') || '4.5');
                refreshUI();
                SoundFX.playPlaceStone();
            });
        });
        document.getElementById('setup-komi-p3-input')?.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(val) && val >= 0) {
                if (!tempConfig.playerKomis) tempConfig.playerKomis = { 2: 2.5, 3: 4.5, 4: 6.5 };
                tempConfig.playerKomis[3] = val;
                refreshUI();
            }
        });

        // P4 Amethyst (4º Turno)
        document.querySelectorAll('.btn-setup-komi-p4').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!tempConfig.playerKomis) tempConfig.playerKomis = { 2: 2.5, 3: 4.5, 4: 6.5 };
                tempConfig.playerKomis[4] = parseFloat(btn.getAttribute('data-komi') || '6.5');
                refreshUI();
                SoundFX.playPlaceStone();
            });
        });
        document.getElementById('setup-komi-p4-input')?.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(val) && val >= 0) {
                if (!tempConfig.playerKomis) tempConfig.playerKomis = { 2: 2.5, 3: 4.5, 4: 6.5 };
                tempConfig.playerKomis[4] = val;
                refreshUI();
            }
        });

        // --- CONTROLES DE TEMPORIZADOR EN EL WIZARD ---
        if (!tempConfig.timer) {
            tempConfig.timer = {
                mode: 'none',
                byoYomiSeconds: 30,
                mainTimeSeconds: 300,
                incrementSeconds: 5,
                byoYomiPeriods: 3
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
                const mode = btn.getAttribute('data-mode') as 'per_move' | 'japanese' | 'fischer' | 'absolute';
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
                const byo = parseInt(btn.getAttribute('data-byo') || '30', 10);
                const periods = parseInt(btn.getAttribute('data-periods') || '3', 10);
                const inc = parseInt(btn.getAttribute('data-inc') || '5', 10);

                if (tempConfig.timer) {
                    if (tempConfig.timer.mode === 'per_move') {
                        tempConfig.timer.byoYomiSeconds = val;
                    } else if (tempConfig.timer.mode === 'japanese') {
                        tempConfig.timer.mainTimeSeconds = val;
                        tempConfig.timer.byoYomiSeconds = byo;
                        tempConfig.timer.byoYomiPeriods = periods;
                    } else if (tempConfig.timer.mode === 'fischer') {
                        tempConfig.timer.mainTimeSeconds = val;
                        tempConfig.timer.incrementSeconds = inc;
                    } else if (tempConfig.timer.mode === 'absolute') {
                        tempConfig.timer.mainTimeSeconds = val;
                    }
                    refreshUI();
                    SoundFX.playPlaceStone();
                }
            });
        });

        // Inputs personalizados de tiempo
        document.getElementById('setup-timer-byoyomi-input')?.addEventListener('input', (e) => {
            const v = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(v) && v > 0 && tempConfig.timer) {
                tempConfig.timer.byoYomiSeconds = v;
                SetupModalRenderer.updateWizardSummary(tempConfig);
            }
        });

        document.getElementById('setup-timer-japanese-main-input')?.addEventListener('input', (e) => {
            const v = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(v) && v > 0 && tempConfig.timer) {
                tempConfig.timer.mainTimeSeconds = v * 60;
                SetupModalRenderer.updateWizardSummary(tempConfig);
            }
        });

        document.getElementById('setup-timer-japanese-periods-input')?.addEventListener('input', (e) => {
            const v = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(v) && v > 0 && tempConfig.timer) {
                tempConfig.timer.byoYomiPeriods = v;
                SetupModalRenderer.updateWizardSummary(tempConfig);
            }
        });

        document.getElementById('setup-timer-japanese-byo-input')?.addEventListener('input', (e) => {
            const v = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(v) && v > 0 && tempConfig.timer) {
                tempConfig.timer.byoYomiSeconds = v;
                SetupModalRenderer.updateWizardSummary(tempConfig);
            }
        });

        document.getElementById('setup-timer-fischer-main-input')?.addEventListener('input', (e) => {
            const v = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(v) && v > 0 && tempConfig.timer) {
                tempConfig.timer.mainTimeSeconds = v * 60;
                SetupModalRenderer.updateWizardSummary(tempConfig);
            }
        });

        document.getElementById('setup-timer-fischer-inc-input')?.addEventListener('input', (e) => {
            const v = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(v) && v >= 0 && tempConfig.timer) {
                tempConfig.timer.incrementSeconds = v;
                SetupModalRenderer.updateWizardSummary(tempConfig);
            }
        });

        document.getElementById('setup-timer-absolute-input')?.addEventListener('input', (e) => {
            const v = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(v) && v > 0 && tempConfig.timer) {
                tempConfig.timer.mainTimeSeconds = v * 60;
                SetupModalRenderer.updateWizardSummary(tempConfig);
            }
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
            tempConfig.isRoguelikeMatch = false; // Aisla Modo Libre de Roguelike
            tempConfig.ruleStyle = 'classic';
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
            HUDController.showAlert('🗺️ Has proseguido tu ruta en el mapa.');
            SoundFX.playPlaceStone();
        });
    }
}


