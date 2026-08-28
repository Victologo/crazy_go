// controllers/AITurnManager.ts — Gestión del Turno de la IA con Mutex y Habilidades de Campeones
import type { GameSetupConfig, EnemyHeroId } from '../types';
import { GraphBoard, type BoardNode } from '../core/GraphBoard';
import { GameState } from '../core/GameState';
import { SVGRenderer } from '../graphics/SVGRenderer';
import { GoAI } from '../ai/GoAI';
import { TerritoryScorer } from '../core/TerritoryScorer';
import { RulesEngine } from '../core/RulesEngine';
import { BossManager } from '../core/BossManager';
import { ChampionManager } from '../core/ChampionManager';
import { VFXManager } from '../graphics/VFXManager';
import { HUDController } from '../ui/HUDController';
import { SoundFX } from '../audio/SoundFX';
import { StoryController } from '../story/StoryController';
import { TutorialManager } from '../tutorial/TutorialManager';
import { getLanguage } from '../i18n/i18n';
import { StageHazardManager } from '../core/StageHazardManager';
import type { AIWorkerIncomingMessage, AIWorkerOutgoingMessage } from '../ai/GoAI.worker';
import type { AIMoveChoice } from '../ai/GoAI';

export class AITurnManager {
    // Propiedades del campeón rival IA (movidas desde GameController)
    public static aiHeroId: EnemyHeroId | null = null;
    public static aiActiveChargesLeft: number = 0;
    public static aiPassiveAvailable: boolean = true;
    public static aiRyujinEarnedBurns: number = 0;

    // Mutex y timeout de turno
    private static isRunning: boolean = false;
    private static turnTimeout: number | null = null;
    
    // Web Worker
    private static aiWorker: Worker | null = null;

    /** Inicializa el Web Worker con la configuración actual */
    public static initWorker(config: GameSetupConfig) {
        if (this.aiWorker) {
            this.aiWorker.terminate();
        }
        this.aiWorker = new Worker(new URL('../ai/GoAI.worker.ts', import.meta.url), { type: 'module' });
        
        const msg: AIWorkerIncomingMessage = { type: 'INIT_BOARD', config };
        this.aiWorker.postMessage(msg);
    }

    public static notifyMove(nodeId: string, playerId: import('../core/GraphBoard').PlayerId) {
        if (!this.aiWorker) return;
        const msg: AIWorkerIncomingMessage = { type: 'SYNC_MOVE', nodeId, playerId };
        this.aiWorker.postMessage(msg);
    }

    public static notifyUndo() {
        if (!this.aiWorker) return;
        this.aiWorker.postMessage({ type: 'SYNC_UNDO' } as AIWorkerIncomingMessage);
    }
    
    public static notifyPass() {
        if (!this.aiWorker) return;
        this.aiWorker.postMessage({ type: 'SYNC_PASS' } as AIWorkerIncomingMessage);
    }

    private static calculateMoveAsync(board: GraphBoard, aiPlayerId: import('../core/GraphBoard').PlayerId, difficulty: import('../ai/GoAI').AIDifficulty, komi: number): Promise<AIMoveChoice> {
        return new Promise((resolve, reject) => {
            if (!this.aiWorker) {
                reject(new Error('AI Worker no inicializado'));
                return;
            }
            
            const handleMessage = (e: MessageEvent<AIWorkerOutgoingMessage>) => {
                const msg = e.data;
                if (msg.type === 'MOVE_RESULT') {
                    this.aiWorker!.removeEventListener('message', handleMessage);
                    resolve(msg.payload);
                } else if (msg.type === 'ERROR') {
                    this.aiWorker!.removeEventListener('message', handleMessage);
                    reject(new Error(msg.message));
                }
            };
            
            this.aiWorker.addEventListener('message', handleMessage);
            
            const nodesSnapshot: any[] = [];
            for (const [id, node] of board.nodes.entries()) {
                nodesSnapshot.push({
                    id,
                    stone: node.stone ? { ...node.stone } : null,
                    terrain: node.terrain
                });
            }
            
            const msg: AIWorkerIncomingMessage = { 
                type: 'CALCULATE_MOVE', 
                aiPlayerId, 
                difficulty, 
                komi,
                boardSnapshot: nodesSnapshot
            };
            this.aiWorker.postMessage(msg);
        });
    }

    /** Resetea el mutex al iniciar una nueva partida. */
    public static resetMutex(): void {
        if (this.turnTimeout) {
            clearTimeout(this.turnTimeout);
            this.turnTimeout = null;
        }
        this.isRunning = false;
    }

    /**
     * Comprueba si es el turno de la IA y lo ejecuta si procede.
     * Las dependencias se pasan explícitamente para evitar acoplamiento circular.
     */
    public static check(
        board: GraphBoard,
        state: GameState,
        config: GameSetupConfig,
        renderer: SVGRenderer,
        onUIUpdate: () => void,
        onAITurnFinished: () => void,
        onGameOver: () => void,
        isLocalPlayerTurn: () => boolean
    ): void {
        if (TutorialManager.isActive) return;
        if (config.gameMode === 'story' && StoryController.isCurrentChapterSolo()) return;
        if (config.gameMode === 'story' && StoryController.isDialogueActive) return;

        if (
            (config.gameMode !== '1via' && config.gameMode !== 'coop' && config.gameMode !== 'story') ||
            state.isGameOver
        ) {
            renderer.isInteractive = isLocalPlayerTurn() || ChampionManager.currentTargetingMode !== 'none';
            HUDController.setAIBadge(false);
            return;
        }

        if (ChampionManager.currentTargetingMode !== 'none') {
            renderer.isInteractive = true;
            HUDController.setAIBadge(false);
            return;
        }

        const activePlayer = state.currentPlayer;
        
        let isHuman = false;
        if (config.slots && config.slots[activePlayer]) {
            isHuman = config.slots[activePlayer].type === 'human_local' || config.slots[activePlayer].type === 'human_remote';
        } else {
            isHuman = activePlayer === config.humanColor;
        }

        if (isHuman) {
            renderer.isInteractive = true;
            HUDController.setAIBadge(false);
            return;
        }

        // MUTEX: Evitar concurrencia de turnos de IA
        if (this.isRunning) return;
        this.isRunning = true;

        renderer.isInteractive = false;
        HUDController.setAIBadge(true);

        // Demora adaptativa constante (entre 0.6s y 1.2s para no ser instantánea pero tampoco bloquear)
        const thinkDelay = Math.floor(600 + Math.random() * 600);

        this.turnTimeout = window.setTimeout(() => {
            if (state.isGameOver) {
                this.isRunning = false;
                return;
            }

            const svgElement = document.querySelector('#board-container svg') as SVGSVGElement | null;

            // 1. Comprobar si el Jefe Final debe desatar su Aliento Calcinante
            const bossTriggered = BossManager.checkAIBossTrigger(
                board,
                state,
                activePlayer,
                svgElement,
                (msg) => { HUDController.showAlert(msg, 4500); },
                () => {
                    renderer.render();
                    state.passTurn();
                    onUIUpdate();
                    if (!state.isGameOver && state.currentPlayer !== config.humanColor) {
                        this.isRunning = false;
                        this.check(board, state, config, renderer, onUIUpdate, onAITurnFinished, onGameOver, isLocalPlayerTurn);
                    } else {
                        renderer.isInteractive = isLocalPlayerTurn();
                        HUDController.setAIBadge(false);
                        this.isRunning = false;
                    }
                }
            );

            if (bossTriggered) return;

            // Función interna para continuar el turno tras resolver habilidades
            const executeCoreAITurn = async () => {
                // Trigger passive devastation (no consume el turno)
                BossManager.checkAIPassiveDevastation(board, state, activePlayer, svgElement, () => {
                    // Se ejecuta de fondo asíncronamente o antes de calcular el movimiento
                    renderer.render();
                    onUIUpdate();
                });

                try {
                    const aiChoice = await this.calculateMoveAsync(board, activePlayer, config.difficulty, state.komi);
                    const meta = TerritoryScorer.PLAYER_META[activePlayer];

                    if (aiChoice.nodeId === null) {
                        // La IA decide pasar
                        SoundFX.playPass();
                        state.passTurn();
                        renderer.render();
                        onUIUpdate();
                        const isEnNow = getLanguage() === 'en';
                        HUDController.showAlert(
                            isEnNow
                                ? `🤖 AI (${meta.name} ${meta.icon}) passed turn.`
                                : `🤖 IA (${meta.name} ${meta.icon}) ha pasado turno.`
                        );

                        // Comprobar peligros ambientales (Erupción Volcánica o Caída Celestial)
                        StageHazardManager.checkStageHazards(
                            board,
                            state,
                            renderer?.svgElement || null,
                            () => {
                                renderer?.render();
                                onUIUpdate();
                            }
                        );

                        this.isRunning = false;
                        if (state.isGameOver) {
                            onGameOver();
                        } else if (state.currentPlayer !== config.humanColor) {
                            this.check(board, state, config, renderer, onUIUpdate, onAITurnFinished, onGameOver, isLocalPlayerTurn);
                        } else {
                            renderer.isInteractive = true;
                            HUDController.setAIBadge(false);
                            onAITurnFinished();
                        }
                    } else {
                        // La IA ejecuta la jugada
                        renderer.handleNodeClick(aiChoice.nodeId, false);

                        // Comprobar si la jugada de la IA capturó alguna entidad neutral
                        RulesEngine.resolveCaptiveCaptures(board, state, 2, (captive, capturerId) => {
                            if (config.gameMode === 'story') {
                                StoryController.onCaptiveCaptured(captive.id, capturerId);
                            } else {
                                const isEnNow2 = getLanguage() === 'en';
                                HUDController.showAlert(
                                    isEnNow2
                                        ? `⚠️ Rival besieged and absorbed ${captive.name}!`
                                        : `⚠️ ¡El rival ha asediado y absorbido ${captive.name}!`
                                );
                            }
                            SoundFX.playSpecial();
                            renderer.render();
                        });

                        window.requestAnimationFrame(() => {
                            setTimeout(() => {
                                this.isRunning = false;
                                if (!StageHazardManager.isHazardInProgress) {
                                    if (!state.isGameOver && state.currentPlayer !== config.humanColor) {
                                        this.check(board, state, config, renderer, onUIUpdate, onAITurnFinished, onGameOver, isLocalPlayerTurn);
                                    } else {
                                        renderer.isInteractive = isLocalPlayerTurn();
                                        HUDController.setAIBadge(false);
                                        onAITurnFinished();
                                    }
                                }
                            }, 50);
                        });
                    }
                } catch (err: any) {
                    console.error("AI Error en executeCoreAITurn:", err);
                    state.passTurn();
                    this.isRunning = false;
                    if (state.isGameOver) {
                        onGameOver();
                    } else if (state.currentPlayer !== config.humanColor) {
                        this.check(board, state, config, renderer, onUIUpdate, onAITurnFinished, onGameOver, isLocalPlayerTurn);
                    } else {
                        renderer.isInteractive = isLocalPlayerTurn();
                        HUDController.setAIBadge(false);
                        onAITurnFinished();
                    }
                }
            };

            // 2. Comprobar Habilidades de Campeón de la IA
            if (this.aiHeroId && this.aiHeroId !== 'normal') {
                const aiPlayerId = activePlayer;
                const humanPlayerId = config.humanColor;
                let vfxIsPlaying = false;

                // A. Himiko (Pasiva en Turno 15 personal de la IA)
                if (this.aiHeroId === 'himiko' && this.aiPassiveAvailable) {
                    const aiTurns = state.getPlayerTurnCount(aiPlayerId);
                    if (aiTurns >= 15) {
                        this.aiPassiveAvailable = false;
                        HUDController.triggerStandeeSkillFX(aiPlayerId, false);
                        const emptyNodes = Array.from(board.nodes.values()).filter(
                            n => n.stone === null && n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE'
                        );
                        if (emptyNodes.length > 0) {
                            vfxIsPlaying = true;
                            const count = ChampionManager.getStoneRainCount(board);
                            const shuffled = [...emptyNodes].sort(() => Math.random() - 0.5).slice(0, count);
                            const coords = shuffled.map(n => ({ x: n.x, y: n.y }));
                            const placeAIStone = (idx: number) => {
                                const n = shuffled[idx];
                                if (n) {
                                    n.stone = {
                                        id: state.entityManager.createEntity(),
                                        playerId: aiPlayerId,
                                        isInvisible: false,
                                        isIndestructible: false,
                                        isFrozen: false,
                                        stoneType: 'single'
                                    };
                                    RulesEngine.resolveBoardCaptures(board, state, aiPlayerId);
                                    renderer.render();
                                }
                            };
                            const onFinishedRain = () => {
                                const isEnNow = getLanguage() === 'en';
                                HUDController.showAlert(
                                    isEnNow
                                        ? `🌧️✨ Rival's Celestial Stone Rain! ${shuffled.length} enemy stones descended.`
                                        : `🌧️✨ ¡Lluvia Pétrea de Himiko del rival! Han descendido ${shuffled.length} piedras enemigas.`
                                );
                                renderer.render();
                                onUIUpdate();
                                executeCoreAITurn();
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
                if (this.aiHeroId === 'ryujin' && !vfxIsPlaying) {
                    const livingGroups = board.getLivingGroupsInfo(aiPlayerId).filter(g => g.eyesCount >= 2);
                    const totalNodes = board.nodes.size;
                    let burnsToTrigger = 0;

                    const is19x19Scale = board.shape === 'oni' || totalNodes > 220;

                    if (!is19x19Scale && totalNodes <= 100) {
                        if (livingGroups.length >= 1 && this.aiPassiveAvailable) {
                            this.aiPassiveAvailable = false;
                            HUDController.triggerStandeeSkillFX(aiPlayerId, false);
                            burnsToTrigger = 2;
                        }
                    } else if (!is19x19Scale && totalNodes <= 220) {
                        const has3Eyes = livingGroups.some(g => g.eyesCount >= 3);
                        if (has3Eyes && this.aiPassiveAvailable) {
                            this.aiPassiveAvailable = false;
                            HUDController.triggerStandeeSkillFX(aiPlayerId, false);
                            burnsToTrigger = 4;
                        }
                    } else {
                        let totalPotential = 0;
                        for (const g of livingGroups) totalPotential += (g.eyesCount - 1);
                        const delta = totalPotential - this.aiRyujinEarnedBurns;
                        if (delta > 0) {
                            this.aiRyujinEarnedBurns = totalPotential;
                            HUDController.triggerStandeeSkillFX(aiPlayerId, false);
                            burnsToTrigger = delta;
                        }
                    }

                    if (burnsToTrigger > 0) {
                        const humanStones = Array.from(board.nodes.values()).filter(
                            n => n.stone && n.stone.playerId === humanPlayerId && !n.stone.isIndestructible
                        );
                        if (humanStones.length > 0) {
                            vfxIsPlaying = true;
                            const stonesToBurn = humanStones.slice(0, burnsToTrigger);
                            const doBurn = () => {
                                for (const targetNode of stonesToBurn) {
                                    if (svgElement) {
                                        VFXManager.triggerDragonFlame({ x: targetNode.x, y: targetNode.y }, svgElement);
                                    }
                                    RulesEngine.destroyStoneAndPolyGroup(board, state, targetNode.id);
                                }
                                const isEnNow = getLanguage() === 'en';
                                HUDController.showAlert(
                                    isEnNow
                                        ? `🐉🔥 Rival's Dragon Fury! Secured territory and incinerated ${stonesToBurn.length} of your stones.`
                                        : `🐉🔥 ¡Furia del Dragón del rival! Ha consolidado territorio y ha calcinado ${stonesToBurn.length} de tus piedras.`
                                );
                                renderer.render();
                                onUIUpdate();
                                setTimeout(() => { executeCoreAITurn(); }, 1000);
                            };
                            doBurn();
                        }
                    }
                }

                // C. Tengu (Lluvia Meteórica de la IA)
                if (this.aiHeroId === 'tengu' && this.aiActiveChargesLeft > 0 && !vfxIsPlaying) {
                    let bestCenterNode: BoardNode | null = null;
                    let maxEnemyStonesInZone = 0;

                    for (const node of board.nodes.values()) {
                        if (node.terrain === 'DESTROYED' || node.terrain === 'OBSTACLE') continue;
                        const zone = ChampionManager.getMeteorZoneNodes(board, node.id);
                        if (zone.length === 0) continue;
                        const enemyCount = zone.filter(
                            n => n.stone && n.stone.playerId === humanPlayerId && !n.stone.isIndestructible
                        ).length;
                        if (enemyCount > maxEnemyStonesInZone) {
                            maxEnemyStonesInZone = enemyCount;
                            bestCenterNode = node;
                        }
                    }

                    const threshold = board.nodes.size > 100 ? 3 : 2;
                    if (bestCenterNode && maxEnemyStonesInZone >= threshold) {
                        this.aiActiveChargesLeft--;
                        HUDController.triggerStandeeSkillFX(aiPlayerId, false);
                        vfxIsPlaying = true;
                        const zone = ChampionManager.getMeteorZoneNodes(board, bestCenterNode.id);
                        const count = ChampionManager.getMeteorCount(board);
                        const impactNodes = Array.from({ length: count }, () => zone[Math.floor(Math.random() * zone.length)]);
                        const impactCoords = impactNodes.map(n => ({ x: n.x, y: n.y }));

                        const onImpactNode = (idx: number) => {
                            const n = impactNodes[idx];
                            if (n && n.stone && !n.stone.isIndestructible) {
                                RulesEngine.destroyStoneAndPolyGroup(board, state, n.id);
                            }
                        };

                        const onFinishedMeteors = () => {
                            const isEnNow = getLanguage() === 'en';
                            HUDController.showAlert(
                                isEnNow
                                    ? `☄️ Rival invoked Tengu's Meteor Strike on your stones!`
                                    : `☄️ ¡El rival ha invocado la Lluvia Meteórica de Tengu sobre tus piedras!`
                            );
                            renderer.render();
                            onUIUpdate();
                            executeCoreAITurn();
                        };

                        if (svgElement) {
                            VFXManager.triggerMeteorShower(
                                impactCoords, svgElement, onImpactNode, onFinishedMeteors,
                                renderer.currentStoneRadius
                            );
                        } else {
                            impactNodes.forEach((_, idx) => onImpactNode(idx));
                            onFinishedMeteors();
                        }
                    }
                }

                // D. Kitsune (Escudo Divino de la IA)
                if (this.aiHeroId === 'kitsune' && this.aiActiveChargesLeft > 0 && !vfxIsPlaying) {
                    const aiChainsInAtari = GoAI.getChainsWithLiberties(board, aiPlayerId, 1);
                    const aiChainsWeak = GoAI.getChainsWithLiberties(board, aiPlayerId, 2);
                    const threatenedChains = aiChainsInAtari.length > 0 ? aiChainsInAtari : (aiChainsWeak.length > 0 ? aiChainsWeak : []);

                    if (threatenedChains.length > 0) {
                        const targetChain = threatenedChains[0];
                        const unprotectedStoneId = Array.from(targetChain).find(id => {
                            const n = board.nodes.get(id);
                            return n && n.stone && !n.stone.isIndestructible;
                        });

                        if (unprotectedStoneId) {
                            const node = board.nodes.get(unprotectedStoneId)!;
                            this.aiActiveChargesLeft--;
                            HUDController.triggerStandeeSkillFX(aiPlayerId, false);
                            node.stone!.isIndestructible = true;
                            node.stone!.shieldTurnsLeft = 2;
                            if (svgElement) {
                                VFXManager.triggerDivineShieldAura({ x: node.x, y: node.y }, svgElement);
                            }
                            SoundFX.playUndo();
                            vfxIsPlaying = true;
                            const isEnNow = getLanguage() === 'en';
                            HUDController.showAlert(
                                isEnNow
                                    ? `🛡️✨ Rival protected a key stone with Kitsune's Divine Shield!`
                                    : `🛡️✨ ¡El rival ha protegido una piedra clave con el Escudo Divino de Kitsune!`
                            );
                            renderer.render();
                            onUIUpdate();
                            setTimeout(() => {
                                executeCoreAITurn();
                            }, 1000);
                        }
                    }
                }

                // E. Alquimista / Ronin (Inversión Cromática o Tajo del Samurai de la IA)
                if ((this.aiHeroId === 'alchemist' || this.aiHeroId === 'ronin') && this.aiActiveChargesLeft > 0 && !vfxIsPlaying) {
                    const humanStones = Array.from(board.nodes.values()).filter(
                        n => n.stone && n.stone.playerId === humanPlayerId && !n.stone.isIndestructible
                    );

                    if (humanStones.length > 0) {
                        this.aiActiveChargesLeft--;
                        HUDController.triggerStandeeSkillFX(aiPlayerId, false);
                        const invertLimit = (board.shape === 'oni' || board.nodes.size > 200) ? 4 : (board.nodes.size > 100 ? 2 : 1);
                        const chosenToInvert = humanStones.slice(0, invertLimit);

                        vfxIsPlaying = true;

                        for (const node of chosenToInvert) {
                            node.stone!.playerId = aiPlayerId;
                            if (svgElement) {
                                if (this.aiHeroId === 'ronin') {
                                    VFXManager.triggerWindSlash({ x: node.x, y: node.y }, svgElement);
                                } else {
                                    VFXManager.triggerTransmuteSlash({ x: node.x, y: node.y }, svgElement);
                                }
                            }
                        }

                        const totalCaptured = RulesEngine.resolveBoardCaptures(board, state, aiPlayerId);
                        if (totalCaptured > 0) SoundFX.playCapture();

                        const isEnNow = getLanguage() === 'en';
                        HUDController.showAlert(
                            isEnNow
                                ? `🌪️ Rival executed ${this.aiHeroId === 'ronin' ? "Samurai Slash" : "Chromatic Inversion"}, transmuting ${chosenToInvert.length} stone(s) and passing turn!`
                                : `🌪️ ¡El rival ha ejecutado ${this.aiHeroId === 'ronin' ? "el Tajo del Samurai" : "la Inversión Cromática"}, transmutando ${chosenToInvert.length} piedra(s) y pasando turno!`
                        );
                        renderer.render();
                        onUIUpdate();

                        setTimeout(() => {
                            state.passTurn();
                            this.isRunning = false;
                            if (state.isGameOver) {
                                onGameOver();
                            } else if (state.currentPlayer !== config.humanColor) {
                                this.check(board, state, config, renderer, onUIUpdate, onAITurnFinished, onGameOver, isLocalPlayerTurn);
                            } else {
                                renderer.isInteractive = isLocalPlayerTurn();
                                HUDController.setAIBadge(false);
                                onAITurnFinished();
                            }
                        }, 1200);
                    }
                }

                // F. Gran Dragón Sabio Gris (Jefe Final - Aliento Calcinante del 25% del tablero)
                if (this.aiHeroId === 'boss' && !vfxIsPlaying) {
                    const didTrigger = BossManager.checkAIBossTrigger(
                        board,
                        state,
                        aiPlayerId,
                        svgElement,
                        (msg: string) => {
                            HUDController.triggerStandeeSkillFX(aiPlayerId, false);
                            HUDController.showAlert(msg, 4000);
                        },
                        () => {
                            renderer.render();
                            onUIUpdate();
                            setTimeout(() => {
                                executeCoreAITurn();
                            }, 1200);
                        }
                    );
                    if (didTrigger) {
                        vfxIsPlaying = true;
                    }
                }

                if (!vfxIsPlaying) {
                    executeCoreAITurn();
                }
            } else {
                // Sin héroe de la IA o héroe 'normal'
                executeCoreAITurn();
            }
        }, thinkDelay);
    }
}
