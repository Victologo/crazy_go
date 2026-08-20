// controllers/SandboxController.ts - Laboratorio de Pruebas, Editor de Situaciones y Troubleshooter en Vivo
import { GraphBoard } from '../core/GraphBoard';
import type { PlayerId } from '../core/GraphBoard';
import { GameState } from '../core/GameState';
import { BoardGenerators, type BoardShape, type BoardSize } from '../graphics/BoardGenerators';
import { RogueliteManager } from '../core/RogueliteManager';
import { ChampionManager } from '../core/ChampionManager';
import { PolyominoManager } from '../core/PolyominoManager';
import { SoundFX } from '../audio/SoundFX';
import { HUDController } from '../ui/HUDController';
import { ModalManager } from '../ui/ModalManager';
import { ScreenManager } from '../ui/ScreenManager';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { BossManager } from '../core/BossManager';
import { VFXManager } from '../graphics/VFXManager';
import { RoninVFX } from '../graphics/vfx/RoninVFX';
import { RulesEngine } from '../core/RulesEngine';
import type { HeroId } from '../types';

export type SandboxBrush = 
    | 'none'
    | 'stone_black'
    | 'stone_white'
    | 'stone_green'
    | 'stone_purple'
    | 'stone_sacred'
    | 'poly_sprouting'
    | 'poly_domino'
    | 'poly_monolith'
    | 'terrain_normal'
    | 'terrain_portal'
    | 'terrain_vortex'
    | 'terrain_sanctuary'
    | 'terrain_destroyed'
    | 'eraser';

export type PresetScenario = 'ko_test' | 'atari_chain' | 'sacred_test' | 'islands_sprout' | 'two_eyes_alive' | 'ronin_slash_demo' | 'empty_clean';

export class SandboxController {
    public static isSandboxActive: boolean = false;
    public static isBrushActive: boolean = false;
    public static currentBrush: SandboxBrush = 'stone_black';
    public static brushPlayer: PlayerId = 1;

    // Referencias al juego actual
    public static currentBoardRef: GraphBoard | null = null;
    public static currentStateRef: GameState | null = null;
    public static onRefreshCallback: (() => void) | null = null;

    public static register(board: GraphBoard, state: GameState, onRefresh: () => void) {
        this.currentBoardRef = board;
        this.currentStateRef = state;
        this.onRefreshCallback = onRefresh;
    }

    /**
     * Inicia el modo Sandbox desde el Menú Principal
     */
    public static startSandboxFromMenu(gameInitCallback: (config: any) => void) {
        this.isSandboxActive = true;
        this.isBrushActive = true;
        this.currentBrush = 'stone_black';

        gameInitCallback({
            ruleStyle: 'roguelite',
            gameMode: '1v1',
            playerCount: 2,
            humanColor: 1,
            difficulty: 'easy',
            komi: 6.5,
            shape: 'square',
            size: 9,
            heroId: 'tengu'
        });

        // Dar cargas de todos los hechizos y poliminós
        this.grantInfiniteResources();
        ScreenManager.showGameScreen();
        ModalManager.openSandboxModal();
        HUDController.showAlert("🧪 Laboratorio de Pruebas Activo. ¡Modifica cualquier tablero o situación!");
        SoundFX.playPlaceStone();
    }

    /**
     * Abre el modal de herramientas Sandbox durante cualquier partida (in-game o en run)
     */
    public static openInGameSandbox() {
        this.isSandboxActive = true;
        ModalManager.openSandboxModal();
        this.updateModalUI();
        SoundFX.playPlaceStone();
    }

    public static setBrush(brush: SandboxBrush) {
        this.currentBrush = brush;
        this.isBrushActive = brush !== 'none';
        this.updateModalUI();
        SoundFX.playPlaceStone();
        HUDController.showAlert(`🖌️ Pincel seleccionado: ${this.getBrushName(brush)}`);
    }

    public static toggleBrush() {
        this.isBrushActive = !this.isBrushActive;
        this.updateModalUI();
        HUDController.showAlert(this.isBrushActive ? `🖌️ Pincel activado (${this.getBrushName(this.currentBrush)})` : "🖌️ Pincel desactivado (Modo juego normal)");
    }

    /**
     * Aplica el pincel actual a un nodo al hacer clic
     */
    public static applyBrush(
        nodeId: string, 
        board: GraphBoard, 
        state: GameState, 
        onRender: () => void,
        onAlert: (msg: string) => void
    ) {
        const node = board.nodes.get(nodeId);
        if (!node) return;

        state.recordSnapshot(board);

        switch (this.currentBrush) {
            case 'eraser':
                if (node.stone) {
                    state.entityManager.destroyEntity(node.stone.id);
                    node.stone = null;
                }
                node.terrain = 'NORMAL';
                SoundFX.playCapture();
                break;

            case 'stone_black':
                this.placeCustomStone(node, board, state, 1, false, 'single');
                break;

            case 'stone_white':
                this.placeCustomStone(node, board, state, 2, false, 'single');
                break;

            case 'stone_green':
                this.placeCustomStone(node, board, state, 3, false, 'single');
                break;

            case 'stone_purple':
                this.placeCustomStone(node, board, state, 4, false, 'single');
                break;

            case 'stone_sacred':
                this.placeCustomStone(node, board, state, state.currentPlayer, true, 'single');
                break;

            case 'poly_sprouting':
                this.placeCustomStone(node, board, state, state.currentPlayer, false, 'sprouting', state.currentTurn);
                break;

            case 'poly_domino': {
                const targetNodeIds = PolyominoManager.getPolyominoTargetNodes(board, nodeId, 'domino', PolyominoManager.orientation);
                for (const tid of targetNodeIds) {
                    const tn = board.nodes.get(tid);
                    if (tn) this.placeCustomStone(tn, board, state, state.currentPlayer, false, 'domino');
                }
                break;
            }

            case 'poly_monolith': {
                const targetNodeIds = PolyominoManager.getPolyominoTargetNodes(board, nodeId, 'monolith', 'horizontal');
                for (const tid of targetNodeIds) {
                    const tn = board.nodes.get(tid);
                    if (tn) this.placeCustomStone(tn, board, state, state.currentPlayer, false, 'monolith');
                }
                break;
            }

            case 'terrain_portal':
            case 'terrain_vortex':
            case 'terrain_sanctuary':
                node.terrain = 'QUICKSAND';
                SoundFX.playPlaceStone();
                break;

            case 'terrain_destroyed':
                node.terrain = 'DESTROYED';
                if (node.stone) {
                    state.entityManager.destroyEntity(node.stone.id);
                    node.stone = null;
                }
                SoundFX.playPlaceStone();
                break;

            case 'terrain_normal':
                node.terrain = 'NORMAL';
                SoundFX.playPlaceStone();
                break;

            default:
                break;
        }

        onRender();
        onAlert(`Nodo ${nodeId} modificado con ${this.getBrushName(this.currentBrush)}`);
    }

    public static clearAllStones(board: GraphBoard, state: GameState) {
        for (const node of board.nodes.values()) {
            if (node.stone) {
                state.entityManager.destroyEntity(node.stone.id);
                node.stone = null;
            }
        }
    }

    private static placeCustomStone(
        node: any, 
        _board: GraphBoard, 
        state: GameState, 
        playerId: PlayerId, 
        isIndestructible: boolean,
        stoneType: 'single' | 'sprouting' | 'domino' | 'monolith',
        sproutBirthTurn?: number
    ) {
        if (node.stone) {
            state.entityManager.destroyEntity(node.stone.id);
        }
        const newEntityId = state.entityManager.createEntity();
        node.stone = {
            id: newEntityId,
            playerId: playerId,
            isInvisible: false,
            isIndestructible: isIndestructible,
            isFrozen: false,
            stoneType: stoneType,
            sproutBirthTurn: sproutBirthTurn
        };
        SoundFX.playPlaceStone();
    }

    /**
     * Genera un escenario de prueba prediseñado
     */
    public static loadPreset(preset: PresetScenario, board: GraphBoard, state: GameState, onRefresh: () => void) {
        state.recordSnapshot(board);

        switch (preset) {
            case 'ko_test':
                this.setupKoScenario(board, state);
                HUDController.showAlert("🔄 Escenario de Ko cargado: Juega con Negras en (4,4) para capturar. ¡Comprueba que Blancas no pueden recapturar inmediatamente!");
                break;

            case 'ronin_slash_demo':
                this.setupRoninSlashScenario(board, state);
                HUDController.showAlert("🗡️ Escenario de Ronin cargado: Pulsa '🗡️ Probar Tajo de Ronin' o juega en el tablero para ver la animación.");
                break;

            case 'atari_chain':
                this.setupAtariScenario(board, state);
                HUDController.showAlert("💥 Escenario de Atari Múltiple cargado: Juega en el hueco libre para capturar el grupo enemigo en cadena.");
                break;

            case 'sacred_test':
                this.setupSacredScenario(board, state);
                HUDController.showAlert("🛡️ Escenario de Piedra Sagrada cargado: La piedra dorada tiene 0 libertades pero no puede ser capturada.");
                break;

            case 'islands_sprout':
                BoardGenerators.generate(board, 'islands', 9);
                this.clearAllStones(board, state);
                this.placeCustomStone(board.nodes.get('1,1'), board, state, 1, false, 'sprouting', 1);
                HUDController.showAlert("🌿 Escenario de Islas y Piedra Germinante cargado.");
                break;

            case 'two_eyes_alive':
                this.setupTwoEyesScenario(board, state);
                HUDController.showAlert("🏰 Escenario de 2 Ojos Vivos cargado: Cuenta puntos con [📊 Contar Puntos] para ver el territorio.");
                break;

            case 'empty_clean':
                this.clearAllStones(board, state);
                for (const node of board.nodes.values()) {
                    node.terrain = 'NORMAL';
                }
                HUDController.showAlert("🧹 Tablero vaciado por completo.");
                SoundFX.playCapture();
                break;
        }

        onRefresh();
        ModalManager.closeSandboxModal();
    }

    /**
     * Regenera el tablero actual con una forma y tamaño seleccionados en caliente
     */
    public static changeBoardShape(shape: BoardShape, size: BoardSize, board: GraphBoard, state: GameState, onRefresh: () => void) {
        state.recordSnapshot(board);
        BoardGenerators.generate(board, shape, size);
        this.clearAllStones(board, state);
        onRefresh();
        HUDController.showAlert(`🗺️ Tablero regenerado: ${shape.toUpperCase()} ${size}x${size}`);
        SoundFX.playPlaceStone();
    }

    /**
     * Otorga recursos infinitos para probar hechizos
     */
    public static grantInfiniteResources() {
        RogueliteManager.isRogueliteMode = true;
        RogueliteManager.playerSpells.forEach(card => {
            card.usesLeft = 99;
        });
        PolyominoManager.polyominoCards.forEach(card => {
            card.usesLeft = 99;
        });
        ChampionManager.activeChargesLeft = 99;
        if (this.onRefreshCallback) this.onRefreshCallback();
        HUDController.showAlert("⚡ Recursos infinitos otorgados: 99 cargas de Hechizos, Poliminós y Habilidad de Campeón.");
        SoundFX.playPlaceStone();
    }

    /**
     * Cambia el campeón activo en vivo
     */
    public static changeChampion(heroId: HeroId, onRefresh: () => void) {
        ChampionManager.resetForMatch(heroId);
        ChampionManager.activeChargesLeft = 99;
        ChampionManager.isPassiveSkillAvailable = true;
        HUDController.updateDuelists(true, heroId);
        onRefresh();
        const hero = RoguelikeRunManager.HEROES[heroId];
        HUDController.showAlert(`🧙‍♂️ Campeón cambiado en vivo a: ${hero ? hero.name : heroId}`);
        SoundFX.playPlaceStone();
    }

    /**
     * Activa la habilidad activa del campeón actual con 99 cargas
     */
    public static triggerActiveSkill(board: GraphBoard, state: GameState, onRefresh: () => void) {
        ChampionManager.activeChargesLeft = 99;
        const hero = (ChampionManager.currentHero || 'tengu') as string;

        if (hero === 'tengu') {
            ChampionManager.currentTargetingMode = 'meteor_5x5';
            HUDController.showAlert("☄️ [Lluvia Meteórica de Tengu]: Haz clic en cualquier casilla para impactar el área.");
        } else if (hero === 'kitsune') {
            ChampionManager.currentTargetingMode = 'shield_target';
            HUDController.showAlert("🛡️ [Escudo Divino de Kitsune]: Haz clic en una piedra aliada para otorgarle 3 turnos de protección sagrada.");
        } else if (hero === 'ronin') {
            ChampionManager.currentTargetingMode = 'convert_enemy';
            HUDController.showAlert("🌪️ [Inversión Cromática de Ronin]: Haz clic en una piedra enemiga para convertirla a tu bando.");
        } else if (hero === 'ryujin') {
            ChampionManager.dragonBurnKillsRemaining = 2;
            ChampionManager.currentTargetingMode = 'dragon_burn_2';
            HUDController.showAlert("🐉🔥 [Llamas de Ryūjin]: Haz clic en 2 piedras enemigas para calcinarlas.");
        } else if (hero === 'grey_dragon_boss') {
            this.forceDragonCornerBurn(board, state, onRefresh);
            return;
        } else if (hero === 'himiko') {
            this.forceStoneRain(board, state, onRefresh);
            return;
        } else {
            ChampionManager.currentTargetingMode = 'meteor_5x5';
            HUDController.showAlert("⚔️ Habilidad activa activada. Haz clic en el tablero.");
        }

        this.isBrushActive = false;
        ModalManager.closeSandboxModal();
        onRefresh();
        SoundFX.playPlaceStone();
    }

    /**
     * Dispara forzadamente la habilidad pasiva del campeón actual
     */
    public static triggerPassiveSkill(board: GraphBoard, state: GameState, onRefresh: () => void) {
        ChampionManager.isPassiveSkillAvailable = true;
        const hero = (ChampionManager.currentHero || 'himiko') as string;

        if (hero === 'himiko') {
            this.forceStoneRain(board, state, onRefresh);
        } else if (hero === 'ryujin') {
            ChampionManager.dragonBurnKillsRemaining = 2;
            ChampionManager.currentTargetingMode = 'dragon_burn_2';
            this.isBrushActive = false;
            ModalManager.closeSandboxModal();
            onRefresh();
            HUDController.showAlert("🐉🔥 [Furia del Dragón Forzada]: Selecciona 2 piedras enemigas en el tablero para calcinarlas.");
            SoundFX.playPlaceStone();
        } else if (hero === 'grey_dragon_boss') {
            this.forceDragonCornerBurn(board, state, onRefresh);
        } else if (hero === 'ronin') {
            this.forceRoninSlash(board, state, onRefresh);
        } else if (hero === 'kitsune') {
            this.forceDivineShieldTarget(onRefresh);
        } else {
            this.forceStoneRain(board, state, onRefresh);
        }
    }

    /**
     * Fuerza la Lluvia Pétrea Celestial de Himiko (4 piedras aliadas bendecidas)
     */
    public static forceStoneRain(board: GraphBoard, state: GameState, onRefresh: () => void) {
        const playerId = state.currentPlayer;
        const emptyNodes = Array.from(board.nodes.values()).filter(n => n.stone === null && n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE');
        if (emptyNodes.length === 0) {
            HUDController.showAlert("No hay casillas libres para la lluvia pétrea.");
            return;
        }

        const stoneCount = ChampionManager.getStoneRainCount(board);

        const shuffled = [...emptyNodes];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const chosen = shuffled.slice(0, Math.min(stoneCount, shuffled.length));
        const coords = chosen.map(n => ({ x: n.x, y: n.y }));

        const placeStoneAt = (idx: number) => {
            const node = chosen[idx];
            if (node) {
                node.stone = {
                    id: state.entityManager.createEntity(),
                    playerId: playerId,
                    isInvisible: false,
                    isIndestructible: false,
                    isFrozen: false,
                    stoneType: 'single'
                };
                RulesEngine.resolveBoardCaptures(board, state, playerId);
                onRefresh();
            }
        };

        const onAllFinished = () => {
            HUDController.showAlert(`🌧️✨ ¡Lluvia Pétrea Celestial de Himiko! Han impactado ${chosen.length} piedras aliadas bendecidas.`);
            onRefresh();
        };

        const svgElement = document.getElementById('board-svg') as unknown as SVGSVGElement | null;
        ModalManager.closeSandboxModal();

        if (svgElement) {
            VFXManager.triggerStoneRainBeams(coords, svgElement, placeStoneAt, onAllFinished);
        } else {
            chosen.forEach((_, idx) => placeStoneAt(idx));
            onAllFinished();
        }
    }

    /**
     * Fuerza el Tajo de Katana / Filo del Samurai de Ronin sobre una piedra enemiga (o aleatoria)
     */
    public static forceRoninSlash(board: GraphBoard, state: GameState, onRefresh: () => void) {
        const playerId = state.currentPlayer;
        const enemyNodes: { id: string; x: number; y: number }[] = [];
        const allOccupied: { id: string; x: number; y: number }[] = [];

        board.nodes.forEach((node, id) => {
            if (node.stone) {
                allOccupied.push({ id, x: node.x, y: node.y });
                if (node.stone.playerId !== playerId && !node.stone.isIndestructible) {
                    enemyNodes.push({ id, x: node.x, y: node.y });
                }
            }
        });

        let target = enemyNodes.length > 0
            ? enemyNodes[Math.floor(Math.random() * enemyNodes.length)]
            : (allOccupied.length > 0 ? allOccupied[Math.floor(Math.random() * allOccupied.length)] : null);

        // Si el tablero está completamente vacío, colocar una piedra enemiga en el centro para poder cortarla
        if (!target) {
            const centerNode = Array.from(board.nodes.values())[Math.floor(board.nodes.size / 2)];
            if (centerNode) {
                centerNode.stone = {
                    id: state.entityManager.createEntity(),
                    playerId: playerId === 1 ? 2 : 1,
                    isInvisible: false,
                    isIndestructible: false,
                    isFrozen: false,
                    stoneType: 'single'
                };
                target = { id: centerNode.id, x: centerNode.x, y: centerNode.y };
            }
        }

        if (!target) {
            HUDController.showAlert("No se encontró ninguna posición para ejecutar el tajo.");
            return;
        }

        const targetNode = board.nodes.get(target.id);
        if (targetNode) {
            targetNode.stone = null;
            state.addCaptures(playerId, 1);
        }

        const svgElement = document.getElementById('board-svg') as unknown as SVGSVGElement | null;
        ModalManager.closeSandboxModal();
        onRefresh();

        if (svgElement) {
            RoninVFX.triggerWindSlash({ x: target.x, y: target.y }, svgElement);
        }

        HUDController.showAlert(`🗡️💨 ¡Filo del Samurai de Ronin! La katana rebanó la piedra en [${target.id}].`);
    }

    /**
     * Fuerza el Aliento Calcinante del Dragón Sabio (Calcinar esquina del 25%)
     */
    public static forceDragonCornerBurn(board: GraphBoard, state: GameState, onRefresh: () => void) {
        const quadrants = BossManager.getCornerQuadrants(board, state.currentPlayer);
        if (quadrants.length === 0) return;

        // Seleccionar el cuadrante con mayor cantidad de piedras
        const bestQuadrant = quadrants.reduce((prev, curr) => (curr.nodes.filter(n => n.stone).length > prev.nodes.filter(n => n.stone).length) ? curr : prev, quadrants[0]);

        BossManager.bossChargesLeft = 99;
        const svgElement = document.getElementById('board-svg') as unknown as SVGSVGElement | null;
        ModalManager.closeSandboxModal();

        BossManager.executeDragonBreath(
            board,
            state,
            state.currentPlayer,
            bestQuadrant,
            svgElement,
            (msg: string) => HUDController.showAlert(msg),
            () => onRefresh()
        );
    }

    /**
     * Activa el modo de objetivo para Escudo Divino de Kitsune
     */
    public static forceDivineShieldTarget(onRefresh: () => void) {
        ChampionManager.activeChargesLeft = 99;
        ChampionManager.currentTargetingMode = 'shield_target';
        this.isBrushActive = false;
        ModalManager.closeSandboxModal();
        onRefresh();
        HUDController.showAlert("🛡️ [Escudo Divino]: Haz clic en una piedra aliada para otorgarle 3 turnos de protección.");
        SoundFX.playPlaceStone();
    }

    /**
     * Activa el modo de objetivo para Inversión Cromática de Ronin
     */
    public static forceChromaticConversion(onRefresh: () => void) {
        ChampionManager.activeChargesLeft = 99;
        ChampionManager.currentTargetingMode = 'convert_enemy';
        this.isBrushActive = false;
        ModalManager.closeSandboxModal();
        onRefresh();
        HUDController.showAlert("🌪️ [Inversión Cromática]: Haz clic en una piedra enemiga para convertirla a tu bando.");
        SoundFX.playPlaceStone();
    }

    /**
     * Fuerza el turno al jugador indicado
     */
    public static forceCurrentPlayer(playerId: PlayerId, state: GameState, onRefresh: () => void) {
        state.currentPlayer = playerId;
        onRefresh();
        HUDController.showAlert(`👑 Turno forzado al Jugador ${playerId}`);
        SoundFX.playPlaceStone();
    }

    // ==================== GENERADORES DE ESCENARIOS DE PRUEBA ====================

    private static setupKoScenario(board: GraphBoard, state: GameState) {
        BoardGenerators.generate(board, 'square', 9);
        this.clearAllStones(board, state);
        state.boardHistory = [];

        // Piedras Blancas formando el nido de Ko
        this.placeCustomStone(board.nodes.get('3,4'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('4,3'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('4,5'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('5,4'), board, state, 2, false, 'single');

        // Piedras Negras listas para capturar en (4,4)
        this.placeCustomStone(board.nodes.get('2,4'), board, state, 1, false, 'single');
        this.placeCustomStone(board.nodes.get('3,3'), board, state, 1, false, 'single');
        this.placeCustomStone(board.nodes.get('3,5'), board, state, 1, false, 'single');

        // Estado inicial de historia para verificación de Ko
        state.boardHistory.push(board.serializeState());
        state.currentPlayer = 1;
    }

    private static setupAtariScenario(board: GraphBoard, state: GameState) {
        BoardGenerators.generate(board, 'square', 9);
        this.clearAllStones(board, state);

        // Cadena de 4 piedras blancas
        this.placeCustomStone(board.nodes.get('3,3'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('3,4'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('3,5'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('4,3'), board, state, 2, false, 'single');

        // Negras rodeando dejando 1 sola libertad en 4,4
        this.placeCustomStone(board.nodes.get('2,3'), board, state, 1, false, 'single');
        this.placeCustomStone(board.nodes.get('2,4'), board, state, 1, false, 'single');
        this.placeCustomStone(board.nodes.get('2,5'), board, state, 1, false, 'single');
        this.placeCustomStone(board.nodes.get('3,2'), board, state, 1, false, 'single');
        this.placeCustomStone(board.nodes.get('3,6'), board, state, 1, false, 'single');
        this.placeCustomStone(board.nodes.get('4,2'), board, state, 1, false, 'single');
        this.placeCustomStone(board.nodes.get('5,3'), board, state, 1, false, 'single');
        this.placeCustomStone(board.nodes.get('4,5'), board, state, 1, false, 'single');

        state.currentPlayer = 1;
    }

    private static setupSacredScenario(board: GraphBoard, state: GameState) {
        BoardGenerators.generate(board, 'square', 9);
        this.clearAllStones(board, state);

        // Piedra Sagrada Negra en (4,4)
        this.placeCustomStone(board.nodes.get('4,4'), board, state, 1, true, 'single');

        // Rodeada por 4 piedras Blancas (0 libertades)
        this.placeCustomStone(board.nodes.get('3,4'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('5,4'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('4,3'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('4,5'), board, state, 2, false, 'single');

        state.currentPlayer = 2;
    }

    private static setupRoninSlashScenario(board: GraphBoard, state: GameState) {
        BoardGenerators.generate(board, 'square', 9);
        this.clearAllStones(board, state);

        ChampionManager.currentHero = 'ronin';
        state.currentPlayer = 1;

        // Piedras enemigas blancas dispersas
        this.placeCustomStone(board.nodes.get('2,2'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('2,6'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('4,4'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('6,2'), board, state, 2, false, 'single');
        this.placeCustomStone(board.nodes.get('6,6'), board, state, 2, false, 'single');

        // Piedras aliadas negras
        this.placeCustomStone(board.nodes.get('3,3'), board, state, 1, false, 'single');
        this.placeCustomStone(board.nodes.get('5,5'), board, state, 1, false, 'single');
    }

    private static setupTwoEyesScenario(board: GraphBoard, state: GameState) {
        BoardGenerators.generate(board, 'square', 9);
        this.clearAllStones(board, state);

        // Estructura de 2 ojos vivos en la esquina superior izquierda
        const blackNodes = ['0,0', '0,2', '0,3', '1,0', '1,3', '2,0', '2,1', '2,2', '2,3'];
        for (const n of blackNodes) {
            const nd = board.nodes.get(n);
            if (nd) this.placeCustomStone(nd, board, state, 1, false, 'single');
        }

        // Dejando (0,1) y (1,1) como ojos vivos
        state.currentPlayer = 1;
    }

    public static updateModalUI() {
        document.querySelectorAll('.btn-sandbox-brush').forEach(btn => {
            const b = btn.getAttribute('data-brush');
            btn.classList.toggle('active', b === this.currentBrush && this.isBrushActive);
        });

        const toggleBtn = document.getElementById('btn-toggle-sandbox-brush');
        if (toggleBtn) {
            toggleBtn.innerText = this.isBrushActive ? "🖌️ Desactivar Pincel (Volver a Juego)" : "🖌️ Activar Pincel Libre";
            toggleBtn.classList.toggle('active', this.isBrushActive);
        }

        // Sincronizar badge visual del botón sandbox en el topbar
        const topbarSandboxBtn = document.getElementById('btn-game-sandbox');
        if (topbarSandboxBtn) {
            topbarSandboxBtn.classList.toggle('brush-on', this.isBrushActive);
            const badge = topbarSandboxBtn.querySelector('.sandbox-dev-badge');
            if (badge) badge.textContent = this.isBrushActive ? '●' : 'DEV';
        }
    }

    private static getBrushName(brush: SandboxBrush): string {
        switch (brush) {
            case 'stone_black': return '⚫ Piedra Negra';
            case 'stone_white': return '⚪ Piedra Blanca';
            case 'stone_green': return '🟢 Piedra Esmeralda';
            case 'stone_purple': return '🟣 Piedra Amatista';
            case 'stone_sacred': return '🛡️ Piedra Sagrada';
            case 'poly_sprouting': return '🌿 Ficha Germinante';
            case 'poly_domino': return '🀄 Ficha Dominó';
            case 'poly_monolith': return '🧱 Ficha Monolito';
            case 'terrain_portal': return '🌌 Portal Espacial';
            case 'terrain_vortex': return '🌀 Vórtice Dimensional';
            case 'terrain_sanctuary': return '⛩️ Santuario Sagrado';
            case 'terrain_destroyed': return '🪨 Terreno Destruido';
            case 'terrain_normal': return '⏹️ Casilla Normal';
            case 'eraser': return '🧹 Borrador';
            default: return 'Ninguno';
        }
    }
}
