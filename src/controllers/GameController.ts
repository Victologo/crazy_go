// controllers/GameController.ts - Orquestador Central de Partidas (Motor, IA, Turnos, Hechizos y Renderizado)
import type { 
    GameSetupConfig, 
    PlayerId, 
    SpellId,
    PolyominoType,
    HeroId
} from '../types';
import { GraphBoard, type BoardNode } from '../core/GraphBoard';
import { GameState } from '../core/GameState';
import { StoryController } from '../story/StoryController';
import { BoardGenerators } from '../graphics/BoardGenerators';
import { SVGRenderer } from '../graphics/SVGRenderer';
import { GoAI } from '../ai/GoAI';
import { TerritoryScorer } from '../core/TerritoryScorer';
import { RogueliteManager } from '../core/RogueliteManager';
import { ChampionManager } from '../core/ChampionManager';
import { PolyominoManager } from '../core/PolyominoManager';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { BossManager } from '../core/BossManager';
import { SandboxController } from './SandboxController';
import { SoundFX } from '../audio/SoundFX';
import { HUDController } from '../ui/HUDController';
import { ModalManager } from '../ui/ModalManager';
import { VFXManager } from '../graphics/VFXManager';
import { RulesEngine } from '../core/RulesEngine';
import { RoguelikeController } from './RoguelikeController';
import { TutorialManager } from '../tutorial/TutorialManager';

export class GameController {
    public static board: GraphBoard;
    public static state: GameState;
    public static renderer: SVGRenderer;
    public static aiHeroId: HeroId | null = null;
    public static aiActiveChargesLeft: number = 0;
    public static aiPassiveAvailable: boolean = true;
    public static aiRyujinEarnedBurns: number = 0;

    private static timerInterval: any = null;

    public static config: GameSetupConfig = {
        ruleStyle: 'classic',
        gameMode: '1via',
        playerCount: 2,
        humanColor: 1,
        difficulty: 'medium',
        komi: 6.5,
        shape: 'square',
        size: 9
    };

    public static localOnlineColor: PlayerId = 1;
    private static aiTurnTimeout: number | null = null;
    private static onOnlineMoveCallback: ((nodeId: string) => void) | null = null;
    private static onOnlinePassCallback: (() => void) | null = null;
    public static onOnlineSkillCallback: ((skillType: string, targetNodeId: string) => void) | null = null;

    public static setOnlineCallbacks(
        onMove: (nodeId: string) => void, 
        onPass: () => void, 
        onSkill?: (skillType: string, targetNodeId: string) => void
    ) {
        this.onOnlineMoveCallback = onMove;
        this.onOnlinePassCallback = onPass;
        if (onSkill) this.onOnlineSkillCallback = onSkill;
    }

    public static initGame(newConfig?: Partial<GameSetupConfig>) {
        if (this.aiTurnTimeout) {
            clearTimeout(this.aiTurnTimeout);
            this.aiTurnTimeout = null;
        }

        if (newConfig) {
            this.config = { ...this.config, ...newConfig };
        }

        // Si es expedición roguelike activa Y estamos explícitamente en modo roguelite (no en online ni libre ni tutorial ni historia)
        if (!TutorialManager.isActive && this.config.gameMode !== 'online' && this.config.gameMode !== 'story' && this.config.ruleStyle === 'roguelite' && RoguelikeRunManager.isRunActive) {
            this.config.playerCount = 2;
            const node = RoguelikeRunManager.getCurrentNode();
            if (node && node.battleConfig) {
                this.config.shape = node.battleConfig.shape;
                this.config.size = node.battleConfig.size;
                this.config.difficulty = node.battleConfig.aiDifficulty;
                this.config.komi = RoguelikeRunManager.getTotalKomi();
            }
            this.config.ruleStyle = 'roguelite';
            this.config.gameMode = '1via';
            this.config.humanColor = 1;

            HUDController.updateStageBadge(
                true, 
                node?.title, 
                node?.battleConfig?.enemyName, 
                node?.battleConfig?.rankLabel
            );
            HUDController.updateDuelists(
                true, 
                RoguelikeRunManager.selectedHero, 
                node, 
                this.config.gameMode, 
                this.config.difficulty
            );
        } else {
            HUDController.updateStageBadge(false);
            HUDController.updateDuelists(
                false, 
                this.config.heroId || undefined, 
                undefined, 
                this.config.gameMode, 
                this.config.difficulty
            );
        }

        this.board = new GraphBoard();
        this.state = new GameState(this.config.komi, this.config.playerCount);

        // Generar topología seleccionada
        BoardGenerators.generate(this.board, this.config.shape, this.config.size);

        // Configurar Roguelite / Clásico / Campeón en Modo Local
        const selectedHero = this.config.heroId || (!TutorialManager.isActive && this.config.ruleStyle === 'roguelite' ? (RoguelikeRunManager.isRunActive ? RoguelikeRunManager.selectedHero : 'tengu') : null);
        const isBoss = (!TutorialManager.isActive && this.config.ruleStyle === 'roguelite' && RoguelikeRunManager.isRunActive && RoguelikeRunManager.getCurrentNode()?.type === 'boss');
        BossManager.resetForMatch(isBoss);

        if (!TutorialManager.isActive && this.config.ruleStyle === 'roguelite') {
            RogueliteManager.isRogueliteMode = true;
            ChampionManager.resetForMatch(selectedHero || 'tengu', this.board);

            if (!RoguelikeRunManager.isRunActive) {
                RogueliteManager.resetSpells();
            }
        } else {
            RogueliteManager.isRogueliteMode = false;
            ChampionManager.resetForMatch(selectedHero, this.board);
        }

        // Configurar Campeón del rival IA en dificultad Dan/Maestro o en partidas Roguelite difíciles
        const isMasterOrDan = this.config.difficulty === 'dan' || (RoguelikeRunManager.isRunActive && RoguelikeRunManager.runDifficulty === 'extreme');
        if (!TutorialManager.isActive && this.config.gameMode === '1via' && isMasterOrDan && !isBoss) {
            const availableAIHeroes: HeroId[] = ['tengu', 'himiko', 'kitsune', 'ronin', 'ryujin'];
            this.aiHeroId = this.config.enemyHeroId || availableAIHeroes[Math.floor(Math.random() * availableAIHeroes.length)];
            this.aiPassiveAvailable = true;
            this.aiRyujinEarnedBurns = 0;
            if (this.aiHeroId === 'kitsune') {
                this.aiActiveChargesLeft = ChampionManager.getKitsuneShieldCharges(this.board);
            } else if (this.aiHeroId === 'tengu' || this.aiHeroId === 'ronin') {
                this.aiActiveChargesLeft = 1;
            } else {
                this.aiActiveChargesLeft = 0;
            }
        } else {
            this.aiHeroId = null;
            this.aiActiveChargesLeft = 0;
            this.aiPassiveAvailable = false;
            this.aiRyujinEarnedBurns = 0;
        }

        HUDController.updateDuelists(
            !TutorialManager.isActive && this.config.ruleStyle === 'roguelite',
            selectedHero || undefined,
            (!TutorialManager.isActive && RoguelikeRunManager.isRunActive) ? (RoguelikeRunManager.getCurrentNode() || undefined) : undefined,
            this.config.gameMode,
            this.config.difficulty
        );

        PolyominoManager.resetForMatch(this.config.ruleStyle === 'roguelite', this.config);

        this.renderer = new SVGRenderer(
            'game-svg',
            this.board,
            this.state,
            () => this.updateInGameUI(),
            (msg) => HUDController.showAlert(msg),
            (nodeId, isLocal) => this.onNodeClicked(nodeId, isLocal),
            (skillType, nodeId) => {
                if (this.config.gameMode === 'online' && this.onOnlineSkillCallback) {
                    this.onOnlineSkillCallback(skillType, nodeId);
                }
            }
        );

        this.renderer.render();
        SandboxController.register(this.board, this.state, () => this.updateInGameUI());
        this.updateInGameUI();
        HUDController.hideAlert();
        ModalManager.closeScoreModal();

        // Anuncio Cinematográfico de Komi (Roguelike, 1 vs 1 Local y 1vIA)
        let skipKomiSplash = TutorialManager.isActive && (!TutorialManager.currentChapter || !TutorialManager.currentChapter.id.includes('komi'));

        if (this.config.playerCount === 2 && this.config.gameMode !== 'online' && !skipKomiSplash) {
            let badgeText = '⚫ JUEGAS CON NEGRAS • PRIMER TURNO';
            if (this.config.gameMode === '1v1') {
                badgeText = '⚫ JUGADOR 1 (NEGRAS) VS ⚪ JUGADOR 2 (BLANCAS)';
            } else if (this.config.humanColor === 2) {
                badgeText = '⚪ JUEGAS CON BLANCAS • SEGUNDO TURNO';
            }
            HUDController.showRogueKomiAnnouncement(this.config.komi, 2200, badgeText);
        }

        // Las entidades y objetos especiales capturables (rehenes, cofres, pergaminos) se reservan para el Modo Historia
        this.state.captives = [];

        this.initTimers();

        this.renderer.isInteractive = this.isLocalPlayerTurn();

        // Si es 1vIA y el humano eligió Blancas/otro color no inicial, la IA abre
        if (this.config.gameMode === '1via') {
            this.checkAITurn();
        }
    }

    public static isLocalPlayerTurn(): boolean {
        if (!this.state || this.state.isGameOver) return false;
        if (TutorialManager.isActive) return true;
        if (this.config.gameMode === '1v1') return true;
        if (this.config.isCoopRogue) {
            if (this.state.currentPlayer !== 1) return false;
            const currentSub = this.config.coopSubTurn || 1;
            return this.localOnlineColor === currentSub;
        }
        if (this.config.gameMode === '1via') return this.state.currentPlayer === this.config.humanColor;
        if (this.config.gameMode === 'story') {
            if (StoryController.isCurrentChapterSolo()) return true;
            return this.state.currentPlayer === this.config.humanColor;
        }
        if (this.config.gameMode === 'online') return this.state.currentPlayer === this.localOnlineColor;
        return false;
    }

    private static initTimers() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        const timer = this.config.timer;
        if (!timer || timer.mode === 'none') {
            HUDController.updateTimers(this.state.playerTimers, this.state.currentPlayer, 'none');
            return;
        }

        for (let p = 1; p <= this.config.playerCount; p++) {
            const pid = p as PlayerId;
            const initialSecs = timer.mode === 'per_move' ? timer.byoYomiSeconds : timer.mainTimeSeconds;
            this.state.playerTimers[pid] = {
                timeRemainingSeconds: initialSecs,
                movesCount: 0,
                isFlagFallen: false
            };
        }

        HUDController.updateTimers(this.state.playerTimers, this.state.currentPlayer, timer.mode);

        this.timerInterval = setInterval(() => {
            if (this.state.isGameOver) {
                clearInterval(this.timerInterval);
                return;
            }

            const cp = this.state.currentPlayer;
            const curTimer = this.state.playerTimers[cp];
            if (!curTimer) return;

            curTimer.timeRemainingSeconds = Math.max(0, curTimer.timeRemainingSeconds - 1);
            HUDController.updateTimers(this.state.playerTimers, cp, timer.mode);

            if (curTimer.timeRemainingSeconds <= 0) {
                if (timer.mode === 'per_move') {
                    curTimer.timeRemainingSeconds = timer.byoYomiSeconds;
                    HUDController.showAlert("⏰ ¡Tiempo por jugada agotado! Pase automático de turno.");
                    SoundFX.playIllegal();
                    this.state.passTurn();
                    this.updateInGameUI();
                    this.renderer.render();
                    if (this.config.gameMode === '1via') this.checkAITurn();
                } else {
                    curTimer.isFlagFallen = true;
                    clearInterval(this.timerInterval);
                    HUDController.showAlert("⏱️ ¡Bandera caída! Tiempo agotado.");
                    SoundFX.playIllegal();
                    this.showFinalScoreModal();
                }
            }
        }, 1000);
    }

    public static updateInGameUI() {
        if (!this.state) return;
        HUDController.updateInGameUI(
            this.state,
            this.config.gameMode,
            this.config.ruleStyle,
            this.config.humanColor,
            this.localOnlineColor,
            this.config.difficulty,
            this.isLocalPlayerTurn()
        );

        HUDController.updateSpellbarUI(
            this.config.ruleStyle,
            this.isLocalPlayerTurn(),
            this.state.isGameOver,
            (spellId) => this.selectSpell(spellId)
        );

        if (this.state.isGameOver && !this.state.scoreReport) {
            this.showFinalScoreModal();
        }
    }

    private static onNodeClicked(nodeId: string, isLocal: boolean) {
        if (isLocal) {
            if (TutorialManager.isActive) {
                TutorialManager.advanceStep();
                return;
            }

            if (ChampionManager.currentTargetingMode !== 'none') {
                this.renderer.isInteractive = true;
                return;
            }

            // Comprobar captura de entidades neutrales (objetos/rehenes)
            RulesEngine.resolveCaptiveCaptures(this.board, this.state, this.state.currentPlayer, (captive) => {
                if (this.config.gameMode === 'story') {
                    StoryController.onCaptiveCaptured(captive.id);
                } else {
                    if (captive.type === 'chest') {
                        RoguelikeRunManager.addPolyomino('domino', 1);
                        RoguelikeRunManager.addPolyomino('sprouting', 1);
                        HUDController.showAlert("🎁 ¡Has liberado el Cofre! (+1 Dominó y +1 Germinante)");
                    } else if (captive.type === 'hostage') {
                        ChampionManager.activeChargesLeft += 1;
                        RoguelikeRunManager.permanentKomiBonus += 1.0;
                        HUDController.showAlert("🧙 ¡Has rescatado al Monje! (+1 Carga de Habilidad y +1.0 Komi)");
                    } else if (captive.type === 'scroll_relic') {
                        RogueliteManager.addSpell('rewind', 1);
                        HUDController.showAlert("📜 ¡Has obtenido el Pergamino Sagrado de Rebobinar (+1)!");
                    } else if (captive.type === 'spirit') {
                        RoguelikeRunManager.permanentKomiBonus += 2.0;
                        HUDController.showAlert("✨ ¡Has liberado al Espíritu Guardián! (+2.0 Komi Permanente)");
                    }
                }
                SoundFX.playSpecial();
                this.renderer.render();
            });

            if (this.config.isCoopRogue) {
                this.config.coopSubTurn = (this.config.coopSubTurn === 1 ? 2 : 1);
            }

            if (this.config.gameMode === 'online' && this.onOnlineMoveCallback) {
                this.onOnlineMoveCallback(nodeId);
                this.updateInGameUI();
                this.renderer.isInteractive = this.isLocalPlayerTurn();
            } else if (this.config.gameMode === '1via') {
                if (TutorialManager.isActive) {
                    TutorialManager.advanceStep();
                } else {
                    this.checkAITurn();
                }
            } else if (this.config.gameMode === 'story') {
                if (StoryController.isCurrentChapterSolo()) {
                    this.state.currentPlayer = 1;
                    this.renderer.isInteractive = true;
                    this.updateInGameUI();
                } else {
                    this.checkAITurn();
                }
            }
        }
    }

    public static checkAITurn() {
        if (TutorialManager.isActive) return; // La IA es controlada por el tutorial
        if (this.config.gameMode === 'story' && StoryController.isCurrentChapterSolo()) return;

        if ((this.config.gameMode !== '1via' && this.config.gameMode !== 'story') || this.state.isGameOver) {
            this.renderer.isInteractive = this.isLocalPlayerTurn() || ChampionManager.currentTargetingMode !== 'none';
            HUDController.setAIBadge(false);
            return;
        }

        // Si el jugador humano está en modo apuntado de habilidad (Lluvia de Tengu, Escudo de Kitsune, Furia de Ryūjin, Ronin, etc.),
        // la IA DEBE esperar a que el humano termine su selección.
        if (ChampionManager.currentTargetingMode !== 'none') {
            this.renderer.isInteractive = true;
            HUDController.setAIBadge(false);
            return;
        }

        const activePlayer = this.state.currentPlayer;
        if (activePlayer === this.config.humanColor) {
            this.renderer.isInteractive = true;
            HUDController.setAIBadge(false);
            return;
        }

        // Bloquear interacción mientras la IA calcula
        this.renderer.isInteractive = false;
        HUDController.setAIBadge(true);

        const thinkDelay = this.config.difficulty === 'hard' ? 450 : this.config.difficulty === 'medium' ? 350 : 250;

        this.aiTurnTimeout = window.setTimeout(() => {
            if (this.state.isGameOver) return;

            // 1. Comprobar si el Jefe Final (Gran Dragón Sabio Gris) debe desatar su Aliento Calcinante
            const svgElement = document.querySelector('#board-container svg') as SVGSVGElement | null;
            const bossTriggered = BossManager.checkAIBossTrigger(
                this.board,
                this.state,
                activePlayer,
                svgElement,
                (msg) => {
                    HUDController.showAlert(msg, 4500);
                },
                () => {
                    this.renderer.render();
                    this.state.passTurn();
                    this.updateInGameUI();

                    if (!this.state.isGameOver && this.state.currentPlayer !== this.config.humanColor) {
                        this.checkAITurn();
                    } else {
                        this.renderer.isInteractive = this.isLocalPlayerTurn();
                        HUDController.setAIBadge(false);
                    }
                }
            );

            if (bossTriggered) {
                return;
            }

            // 2. Comprobar Habilidades de Campeón de la IA en Modo Maestro / Dan
            if (this.aiHeroId) {
                const aiPlayerId = activePlayer;
                const humanPlayerId = this.config.humanColor;

                // A. Himiko (Pasiva en Turno 15 personal de la IA)
                if (this.aiHeroId === 'himiko' && this.aiPassiveAvailable) {
                    const aiTurns = this.state.getPlayerTurnCount(aiPlayerId);
                    if (aiTurns >= 15) {
                        this.aiPassiveAvailable = false;
                        const emptyNodes = Array.from(this.board.nodes.values()).filter(n => n.stone === null && n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE');
                        if (emptyNodes.length > 0) {
                            const count = ChampionManager.getStoneRainCount(this.board);
                            const shuffled = [...emptyNodes].sort(() => Math.random() - 0.5).slice(0, count);
                            const coords = shuffled.map(n => ({ x: n.x, y: n.y }));
                            const placeAIStone = (idx: number) => {
                                const n = shuffled[idx];
                                if (n) {
                                    n.stone = {
                                        id: this.state.entityManager.createEntity(),
                                        playerId: aiPlayerId,
                                        isInvisible: false,
                                        isIndestructible: false,
                                        isFrozen: false,
                                        stoneType: 'single'
                                    };
                                    RulesEngine.resolveBoardCaptures(this.board, this.state, aiPlayerId);
                                    this.renderer.render();
                                }
                            };
                            const onFinishedRain = () => {
                                HUDController.showAlert(`🌧️✨ ¡Lluvia Pétrea de Himiko del rival! Han descendido ${shuffled.length} piedras enemigas.`);
                                this.renderer.render();
                                this.updateInGameUI();
                            };
                            if (svgElement) {
                                VFXManager.triggerStoneRainBeams(coords, svgElement, placeAIStone, onFinishedRain);
                            } else {
                                shuffled.forEach((_, idx) => placeAIStone(idx));
                                onFinishedRain();
                            }
                        }
                    }
                }

                // B. Ryūjin (Pasiva de Furia del Dragón de la IA)
                if (this.aiHeroId === 'ryujin') {
                    const livingGroups = this.board.getLivingGroupsInfo(aiPlayerId).filter(g => g.eyesCount >= 2);
                    const totalNodes = this.board.nodes.size;
                    let burnsToTrigger = 0;

                    if (totalNodes <= 100) {
                        if (livingGroups.length >= 1 && this.aiPassiveAvailable) {
                            this.aiPassiveAvailable = false;
                            burnsToTrigger = 2;
                        }
                    } else if (totalNodes <= 220) {
                        const has3Eyes = livingGroups.some(g => g.eyesCount >= 3);
                        const has2OrMore = livingGroups.length >= 2;
                        if ((has3Eyes || has2OrMore) && this.aiPassiveAvailable) {
                            this.aiPassiveAvailable = false;
                            burnsToTrigger = 3;
                        }
                    } else {
                        let totalPotential = 0;
                        for (const g of livingGroups) totalPotential += (g.eyesCount - 1);
                        const delta = totalPotential - this.aiRyujinEarnedBurns;
                        if (delta > 0) {
                            this.aiRyujinEarnedBurns = totalPotential;
                            burnsToTrigger = delta;
                        }
                    }

                    if (burnsToTrigger > 0) {
                        const humanStones = Array.from(this.board.nodes.values())
                            .filter(n => n.stone && n.stone.playerId === humanPlayerId && !n.stone.isIndestructible);
                        if (humanStones.length > 0) {
                            const stonesToBurn = humanStones.slice(0, burnsToTrigger);
                            for (const targetNode of stonesToBurn) {
                                if (svgElement) {
                                    VFXManager.triggerDragonFlame({ x: targetNode.x, y: targetNode.y }, svgElement);
                                }
                                targetNode.stone = null;
                            }
                            HUDController.showAlert(`🐉🔥 ¡Furia del Dragón del rival! Ha consolidado territorio y ha calcinado ${stonesToBurn.length} de tus piedras.`);
                            this.renderer.render();
                            this.updateInGameUI();
                        }
                    }
                }

                // C. Tengu (Lluvia Meteórica de la IA)
                if (this.aiHeroId === 'tengu' && this.aiActiveChargesLeft > 0) {
                    let bestCenterNode: BoardNode | null = null;
                    let maxEnemyStonesInZone = 0;

                    for (const node of this.board.nodes.values()) {
                        const zone = ChampionManager.getMeteorZoneNodes(this.board, node.id);
                        const enemyCount = zone.filter(n => n.stone && n.stone.playerId === humanPlayerId && !n.stone.isIndestructible).length;
                        if (enemyCount > maxEnemyStonesInZone) {
                            maxEnemyStonesInZone = enemyCount;
                            bestCenterNode = node;
                        }
                    }

                    const threshold = this.board.nodes.size > 100 ? 3 : 2;
                    if (bestCenterNode && maxEnemyStonesInZone >= threshold) {
                        this.aiActiveChargesLeft--;
                        const zone = ChampionManager.getMeteorZoneNodes(this.board, bestCenterNode.id);
                        const count = ChampionManager.getMeteorCount(this.board);
                        const impactNodes = Array.from({ length: count }, () => zone[Math.floor(Math.random() * zone.length)]);
                        const impactCoords = impactNodes.map(n => ({ x: n.x, y: n.y }));

                        const onImpactNode = (idx: number) => {
                            const n = impactNodes[idx];
                            if (n && n.stone && !n.stone.isIndestructible) {
                                n.stone = null;
                            }
                        };

                        const onFinishedMeteors = () => {
                            HUDController.showAlert(`☄️ ¡El rival ha invocado la Lluvia Meteórica de Tengu sobre tus piedras!`);
                            this.renderer.render();
                            this.updateInGameUI();
                        };

                        if (svgElement) {
                            VFXManager.triggerMeteorShower(impactCoords, svgElement, onImpactNode, onFinishedMeteors);
                        } else {
                            impactNodes.forEach((_, idx) => onImpactNode(idx));
                            onFinishedMeteors();
                        }
                    }
                }

                // D. Kitsune (Escudo Divino de la IA)
                if (this.aiHeroId === 'kitsune' && this.aiActiveChargesLeft > 0) {
                    const aiChainsInAtari = GoAI.getChainsWithLiberties(this.board, aiPlayerId, 1);
                    const aiChainsWeak = GoAI.getChainsWithLiberties(this.board, aiPlayerId, 2);
                    const threatenedChains = aiChainsInAtari.length > 0 ? aiChainsInAtari : (aiChainsWeak.length > 0 ? aiChainsWeak : []);

                    if (threatenedChains.length > 0) {
                        const targetChain = threatenedChains[0];
                        const unprotectedStoneId = Array.from(targetChain).find(id => {
                            const n = this.board.nodes.get(id);
                            return n && n.stone && !n.stone.isIndestructible;
                        });

                        if (unprotectedStoneId) {
                            const node = this.board.nodes.get(unprotectedStoneId)!;
                            this.aiActiveChargesLeft--;
                            node.stone!.isIndestructible = true;
                            node.stone!.shieldTurnsLeft = 2;
                            SoundFX.playUndo();
                            HUDController.showAlert(`🛡️✨ ¡El rival ha protegido una piedra clave con el Escudo Divino de Kitsune!`);
                            this.renderer.render();
                            this.updateInGameUI();
                        }
                    }
                }

                // E. Ronin (Inversión Cromática de la IA)
                if (this.aiHeroId === 'ronin' && this.aiActiveChargesLeft > 0) {
                    const humanStones = Array.from(this.board.nodes.values())
                        .filter(n => n.stone && n.stone.playerId === humanPlayerId && !n.stone.isIndestructible);
                    
                    let bestInversionNode: typeof humanStones[0] | null = null;
                    let maxCaptureGain = 0;

                    for (const candNode of humanStones) {
                        candNode.stone!.playerId = aiPlayerId;
                        const captCount = RulesEngine.resolveBoardCaptures(this.board, this.state, aiPlayerId);
                        candNode.stone!.playerId = humanPlayerId;

                        if (captCount > maxCaptureGain) {
                            maxCaptureGain = captCount;
                            bestInversionNode = candNode;
                        }
                    }

                    if (bestInversionNode && (maxCaptureGain >= 1 || this.state.currentTurn >= 12)) {
                        this.aiActiveChargesLeft--;
                        const inversionCount = ChampionManager.getRoninInversionCount(this.board);
                        const chosenToInvert = [bestInversionNode, ...humanStones.filter(n => n.id !== bestInversionNode!.id)].slice(0, inversionCount);

                        for (const targetNode of chosenToInvert) {
                            if (svgElement) {
                                VFXManager.triggerWindSlash({ x: targetNode.x, y: targetNode.y }, svgElement);
                            }
                            targetNode.stone!.playerId = aiPlayerId;
                        }

                        const totalCaptured = RulesEngine.resolveBoardCaptures(this.board, this.state, aiPlayerId);
                        if (totalCaptured > 0) SoundFX.playCapture();
                        
                        HUDController.showAlert(`🌪️ ¡El rival ha ejecutado la Inversión Cromática de Ronin, transmutando ${chosenToInvert.length} piedra(s) y pasando turno!`);
                        this.renderer.render();
                        this.state.passTurn();
                        this.updateInGameUI();

                        if (!this.state.isGameOver && this.state.currentPlayer !== this.config.humanColor) {
                            this.checkAITurn();
                        } else {
                            this.renderer.isInteractive = this.isLocalPlayerTurn();
                            HUDController.setAIBadge(false);
                        }
                        return; // Ronin pasa turno inmediatamente
                    }
                }
            }

            const aiChoice = GoAI.getBestMove(this.board, this.state, activePlayer, this.config.difficulty);
            const meta = TerritoryScorer.PLAYER_META[activePlayer];

            if (aiChoice.nodeId === null) {
                // La IA decide pasar
                SoundFX.playPlaceStone();
                this.state.passTurn();
                this.renderer.render();
                this.updateInGameUI();
                HUDController.showAlert(`🤖 IA (${meta.name} ${meta.icon}) ha pasado turno.`);

                if (this.state.isGameOver) {
                    this.showFinalScoreModal();
                } else if (this.state.currentPlayer !== this.config.humanColor) {
                    this.checkAITurn();
                } else {
                    this.renderer.isInteractive = true;
                    HUDController.setAIBadge(false);
                }
            } else {
                // La IA ejecuta la jugada
                this.renderer.handleNodeClick(aiChoice.nodeId, false);
                if (!this.state.isGameOver && this.state.currentPlayer !== this.config.humanColor) {
                    this.checkAITurn();
                } else {
                    this.renderer.isInteractive = this.isLocalPlayerTurn();
                    HUDController.setAIBadge(false);
                }
            }
        }, thinkDelay);
    }

    public static handlePass(isLocal: boolean = true) {
        if (this.state.isGameOver) return;
        if (isLocal && !this.isLocalPlayerTurn()) return;

        const activeBefore = this.state.currentPlayer;
        SoundFX.playPlaceStone();
        const passed = this.state.passTurn();
        if (passed) {
            this.renderer.render();
            this.updateInGameUI();

            const meta = TerritoryScorer.PLAYER_META[activeBefore];
            HUDController.showAlert(`${meta.name} ${meta.icon} ha pasado turno.`);

            if (isLocal && this.config.gameMode === 'online' && this.onOnlinePassCallback) {
                this.onOnlinePassCallback();
            }

            if (this.state.isGameOver) {
                this.showFinalScoreModal();
            } else {
                if (this.config.gameMode === '1via') {
                    this.checkAITurn();
                } else {
                    this.renderer.isInteractive = this.isLocalPlayerTurn();
                }
            }
        }
    }

    public static handleUndo() {
        if (this.config.gameMode === 'online') {
            HUDController.showAlert("No se permite rebobinar en partidas multijugador online.");
            SoundFX.playIllegal();
            return;
        }

        if (!this.state.canUndo()) {
            HUDController.showAlert("No hay más movimientos que deshacer.");
            SoundFX.playIllegal();
            return;
        }

        if (this.config.gameMode === '1via' && this.config.playerCount === 2) {
            if (this.state.historyStack.length >= 2) {
                this.state.undo(this.board);
                this.state.undo(this.board);
            } else {
                this.state.undo(this.board);
            }
        } else {
            this.state.undo(this.board);
        }

        SoundFX.playUndo();
        this.renderer.render();
        this.updateInGameUI();
        HUDController.showAlert("⏪ Jugada deshecha (Rebobinado).");
    }

    public static handleRedo() {
        if (this.config.gameMode === 'online') {
            HUDController.showAlert("No se permite rehacer en partidas multijugador online.");
            SoundFX.playIllegal();
            return;
        }

        if (!this.state.canRedo()) {
            HUDController.showAlert("No hay movimientos para rehacer.");
            SoundFX.playIllegal();
            return;
        }

        if (this.config.gameMode === '1via' && this.config.playerCount === 2) {
            if (this.state.redoStack.length >= 2) {
                this.state.redo(this.board);
                this.state.redo(this.board);
            } else {
                this.state.redo(this.board);
            }
        } else {
            this.state.redo(this.board);
        }

        SoundFX.playRedo();
        this.renderer.render();
        this.updateInGameUI();
        HUDController.showAlert("⏩ Jugada rehecha.");
    }

    public static toggleChampionActiveSkill() {
        if (!ChampionManager.isActiveSkillAvailable) {
            HUDController.showAlert("Ya has utilizado la habilidad activa de tu Campeón en esta partida.");
            SoundFX.playIllegal();
            return;
        }
        if (!this.isLocalPlayerTurn()) {
            HUDController.showAlert("Solo puedes activar habilidades durante tu turno.");
            SoundFX.playIllegal();
            return;
        }

        if (ChampionManager.currentTargetingMode !== 'none') {
            ChampionManager.currentTargetingMode = 'none';
            HUDController.showAlert("Selección de habilidad cancelada.");
        } else {
            const hero = ChampionManager.currentHero || 'tengu';
            const skill = ChampionManager.ACTIVE_SKILLS[hero];
            if (!skill) {
                HUDController.showAlert("Este héroe no posee habilidad activa.");
                return;
            }
            ChampionManager.currentTargetingMode = skill.targetingMode;
            ChampionManager.targetingPlayerId = (this.config.gameMode === 'online' ? this.localOnlineColor : this.state.currentPlayer);
            HUDController.showAlert(`🎯 ${skill.name}: Haz clic en el tablero para ejecutar la habilidad.`);
        }
        this.updateInGameUI();
        if (this.renderer) this.renderer.render();
    }

    public static handleRemoteSkill(_skillType: string, targetNodeId: string, senderColor?: PlayerId) {
        const svgElement = document.querySelector('#board-container svg') as SVGSVGElement | null;
        const actingPid = senderColor || (this.localOnlineColor === 1 ? 2 : 1);
        
        ChampionManager.executeTargetedSkill(
            this.board,
            this.state,
            targetNodeId,
            actingPid,
            svgElement,
            (msg) => HUDController.showAlert(msg),
            () => {},
            () => {
                this.renderer.render();
                this.updateInGameUI();
            }
        );
        SoundFX.playSpecial();
        this.renderer.render();
        this.updateInGameUI();
    }

    public static selectSpell(spellId: SpellId) {
        if (!this.isLocalPlayerTurn()) {
            HUDController.showAlert("Solo puedes lanzar hechizos durante tu turno.");
            SoundFX.playIllegal();
            return;
        }

        const spell = RogueliteManager.getSpells().find(s => s.id === spellId);
        if (!spell || spell.usesLeft <= 0) {
            HUDController.showAlert("No quedan cargas para este hechizo.");
            SoundFX.playIllegal();
            return;
        }

        if (TutorialManager.isActive) {
            const expected = TutorialManager.getExpectedAction();
            if (expected?.type !== 'use_spell' || expected.spellId !== spellId) {
                const spellName = spell.name;
                HUDController.showAlert(`🥋 Sensei: No uses ${spellName} ahora. Sigue las instrucciones del paso actual.`, 2800);
                SoundFX.playIllegal();
                return;
            }
        }

        RogueliteManager.castSpell(
            spellId,
            this.board,
            this.state,
            this.config.humanColor,
            (msg) => {
                this.renderer.render();
                this.updateInGameUI();
                HUDController.showAlert(msg);
                if (TutorialManager.isActive) {
                    TutorialManager.advanceStep();
                }
            },
            (err) => {
                HUDController.showAlert(err);
            }
        );
    }

    public static selectPolyomino(type: PolyominoType) {
        if (!this.isLocalPlayerTurn()) {
            HUDController.showAlert("Solo puedes desplegar fichas poliminó durante tu turno.");
            SoundFX.playIllegal();
            return;
        }

        // Cancelar targeting de campeón si estaba activo
        if (ChampionManager.currentTargetingMode !== 'none') {
            ChampionManager.currentTargetingMode = 'none';
        }

        PolyominoManager.selectPolyomino(type);
        if (PolyominoManager.activePolyomino) {
            const card = PolyominoManager.polyominoCards.get(type);
            SoundFX.playPlaceStone();
            HUDController.showAlert(`🎯 ${card?.name || 'Ficha'}: Pasa el cursor sobre el Goban y haz clic para colocarla.`);
        } else {
            HUDController.showAlert("Despliegue de ficha cancelado.");
        }

        this.renderer.render();
        this.updateInGameUI();
    }

    public static rotatePolyomino() {
        if (!this.isLocalPlayerTurn()) return;

        PolyominoManager.toggleRotation();
        this.renderer.render();
        this.renderer.refreshCurrentHoverGhost();
        this.updateInGameUI();
    }

    public static showFinalScoreModal() {
        this.state.isGameOver = true;
        const report = TerritoryScorer.calculateScore(this.board, this.state);
        this.state.scoreReport = report;

        this.renderer.render();

        const isRoguelike = RoguelikeRunManager.isRunActive;
        const humanWon = isRoguelike
            ? (this.config.humanColor === 1 && report.winner === 'black') || (this.config.humanColor === 2 && report.winner === 'white')
            : false;

        const node = isRoguelike ? RoguelikeRunManager.getCurrentNode() : null;

        let rewardOptions: { type: 'spell' | 'poly'; id: string; name: string; icon: string; desc: string }[] | undefined = undefined;
        let selectedRewardId: string | undefined = undefined;

        if (isRoguelike && humanWon) {
            rewardOptions = RoguelikeController.getRewardOptionsForBattle();
            selectedRewardId = RoguelikeController.selectedRewardItem?.id;
        }

        ModalManager.showFinalScoreModal(
            report,
            this.state.playerCount,
            isRoguelike,
            humanWon,
            this.config.humanColor,
            node?.title,
            node?.battleConfig?.enemyName,
            node?.battleConfig?.rankLabel,
            RoguelikeRunManager.selectedHero,
            rewardOptions,
            selectedRewardId,
            (chosenId) => {
                if (rewardOptions) {
                    const found = rewardOptions.find(opt => opt.id === chosenId);
                    if (found) {
                        RoguelikeController.selectedRewardItem = found;
                        SoundFX.playPlaceStone();
                    }
                }
            }
        );
    }
}
