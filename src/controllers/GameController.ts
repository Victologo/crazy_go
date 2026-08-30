// controllers/GameController.ts - Orquestador Central de Partidas (Motor, IA, Turnos, Hechizos y Renderizado)
import type { 
    GameSetupConfig, 
    PlayerId, 
    HeroId,
    SpellId,
    PolyominoType,
    BoardBackground
} from '../types';
import { GraphBoard, type BoardNode } from '../core/GraphBoard';
import { GameState } from '../core/GameState';
import { StoryController } from '../story/StoryController';
import { StoryModeController } from '../story/StoryModeController';
import { BoardGenerators } from '../graphics/BoardGenerators';
import { SVGRenderer } from '../graphics/SVGRenderer';
import { GoAI } from '../ai/GoAI';
import { TerritoryScorer } from '../core/TerritoryScorer';
import { RogueliteManager } from '../core/RogueliteManager';
import { ChampionManager } from '../core/ChampionManager';
import { PolyominoManager } from '../core/PolyominoManager';
import { SeededRandom } from '../core/SeededRandom';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { BossManager } from '../core/BossManager';
import { SandboxController } from './SandboxController';
import { SoundFX } from '../audio/SoundFX';
import { HUDController } from '../ui/HUDController';
import { ModalManager } from '../ui/ModalManager';
import { VFXManager } from '../graphics/VFXManager';
import { TenguVFX } from '../graphics/vfx/TenguVFX';
import { DevModeManager } from '../core/DevModeManager';
import { RulesEngine } from '../core/RulesEngine';
import { TimeManager } from './TimeManager';
import { RoguelikeController } from './RoguelikeController';
import { TutorialManager } from '../tutorial/TutorialManager';
import { GameEventBus } from '../events/GameEventBus';
import { getLanguage } from '../i18n/i18n';
import { CombatLogManager } from '../core/CombatLogManager';
import { StageHazardManager } from '../core/StageHazardManager';


export class GameController {
    public static board: GraphBoard;
    public static state: GameState;
    public static renderer: SVGRenderer;
    public static aiHeroId: HeroId | null = null;
    public static aiActiveChargesLeft: number = 0;
    public static aiPassiveAvailable: boolean = true;
    public static aiRyujinEarnedBurns: number = 0;
    /** Imagen/nombre/icóno del rival no-campeón (monje o sabio) resuelto al iniciar partida */
    public static resolvedRivalImage: string | null = null;
    public static resolvedRivalName: string | null = null;
    public static resolvedRivalIcon: string | null = null;

    public static config: GameSetupConfig = {
        ruleStyle: 'classic',
        gameMode: '1via',
        playerCount: 2,
        humanColor: 1,
        difficulty: 'medium',
        komi: 6.5,
        shape: 'square',
        size: 9,
        heroId: 'normal',
        enemyHeroId: 'random',
        enemyHeroIds: { 2: 'normal', 3: 'normal', 4: 'normal' }
    };

    public static localOnlineColor: PlayerId = 1;
    private static aiTurnTimeout: number | null = null;
    private static isAITurnProcessing: boolean = false;
    private static onOnlineMoveCallback: ((nodeId: string) => void) | null = null;
    private static onOnlinePassCallback: (() => void) | null = null;
    public static onOnlineSkillCallback: ((skillType: string, targetNodeId: string) => void) | null = null;
    public static onOnlineUndoCallback: (() => void) | null = null;

    public static setOnlineCallbacks(
        onMove: (nodeId: string) => void, 
        onPass: () => void, 
        onSkill?: (skillType: string, targetNodeId: string) => void,
        onUndo?: () => void
    ) {
        this.onOnlineMoveCallback = onMove;
        this.onOnlinePassCallback = onPass;
        if (onSkill) this.onOnlineSkillCallback = onSkill;
        if (onUndo) this.onOnlineUndoCallback = onUndo;
    }

    public static stopGame() {
        this.isAITurnProcessing = false;
        if (this.aiTurnTimeout) {
            clearTimeout(this.aiTurnTimeout);
            this.aiTurnTimeout = null;
        }
        if (this.state) {
            this.state.isGameOver = true;
        }
        HUDController.setAIBadge(false);
    }

    public static initGame(newConfig?: Partial<GameSetupConfig>) {
        if (this.aiTurnTimeout) {
            clearTimeout(this.aiTurnTimeout);
            this.aiTurnTimeout = null;
        }

        if (newConfig) {
            this.config = { ...this.config, ...newConfig };
        }
        
        import('./AITurnManager').then(m => {
            m.AITurnManager.initWorker(this.config);
        });

        // Si no estamos cargando explícitamente el Modo Historia, asegurar que cualquier estado o zoom cósmico previo quede 100% reseteado
        const isStoryMode = this.config.gameMode === 'story' || (typeof window !== 'undefined' && !!(window as any).__isStoryLoading);
        if (!isStoryMode) {
            StoryModeController.stopCampaign();
            StoryModeController.resetWorld();
            if (this.config.background === 'story') {
                this.config.background = 'combat';
            }
        }
        if (this.config.isRoguelikeMatch === true) {
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
        this.state = new GameState(this.config.komi, this.config.playerCount, this.config.playerKomis);

        // Asegurar que la semilla de generación se comparte con el AI Worker
        if (this.config.seed === undefined) {
            this.config.seed = Math.floor(Math.random() * 999999);
        }

        SeededRandom.setSeed(this.config.seed);

        // Generar topología seleccionada
        BoardGenerators.generate(this.board, this.config.shape, this.config.size);

        // Inicializar el Registro de Combate y Repetición (Paso 0)
        CombatLogManager.resetForNewMatch(this.config, this.board, this.state);

        document.body.dataset.playerCount = this.config.playerCount.toString();

        // Configurar Roguelite / Clásico / Campeón en Modo Local
        const selectedHero = this.config.heroId || (!TutorialManager.isActive && this.config.ruleStyle === 'roguelite' ? (this.config.isRoguelikeMatch === true ? RoguelikeRunManager.selectedHero : 'normal') : 'normal');
        const isBoss = (this.config.isRoguelikeMatch === true && RoguelikeRunManager.getCurrentNode()?.type === 'boss');
        BossManager.resetForMatch(isBoss);

        const heroOwner = this.config.humanColor || (this.config.gameMode === 'online' ? this.localOnlineColor : 1);

        if (!TutorialManager.isActive && this.config.ruleStyle === 'roguelite') {
            RogueliteManager.isRogueliteMode = true;
            ChampionManager.resetForMatch(selectedHero || 'normal', this.board, heroOwner);

            if (this.config.isRoguelikeMatch !== true) {
                if (selectedHero === 'normal') {
                    RogueliteManager.initSpells({ rewind: 2, meteor: 0, shield: 0, convert: 0 });
                } else {
                    RogueliteManager.resetSpells();
                }
            }
        } else {
            RogueliteManager.isRogueliteMode = false;
            ChampionManager.resetForMatch(selectedHero, this.board, heroOwner);
            if (selectedHero === 'normal') {
                RogueliteManager.initSpells({ rewind: 2, meteor: 0, shield: 0, convert: 0 });
            } else {
                RogueliteManager.initSpells({ rewind: 0, meteor: 0, shield: 0, convert: 0 });
            }
        }

        // Configurar Campeón del rival IA en dificultad Dan/Maestro, en partidas Roguelite o si se especificó enemyHeroId (ej: Modo Historia)
        // Resolver random_monk / random_sage a un monje/sabio concreto
        const monkList: [string, string, string][] = [
            ['Monje Sabio', './enemies/sage_1.png', '📜']
        ];
        const sageList: [string, string, string][] = [
            ['Monje Sabio', './enemies/sage_1.png', '📜']
        ];

        let resolvedEnemyImage: string | null = null;
        let resolvedEnemyName: string | null = null;
        let resolvedEnemyIcon: string | null = null;

        if (this.config.enemyHeroId === 'random_monk') {
            const pick = monkList[0];
            [resolvedEnemyName, resolvedEnemyImage, resolvedEnemyIcon] = pick;
            this.config.enemyHeroId = 'sage' as HeroId; // asignamos 'sage'
        } else if (this.config.enemyHeroId === 'random_sage') {
            const pick = sageList[0];
            [resolvedEnemyName, resolvedEnemyImage, resolvedEnemyIcon] = pick;
            this.config.enemyHeroId = 'sage' as HeroId;
        } else if (this.config.enemyHeroId === 'story_sage') {
            resolvedEnemyName = 'Monje Sabio';
            resolvedEnemyImage = './enemies/sage_1.png';
            resolvedEnemyIcon = '📜';
            this.config.enemyHeroId = 'sage' as HeroId;
        }

        // Si es modo 4 jugadores y faltan los rivales, generamos por defecto
        if (this.config.playerCount === 4) {
            if (!this.config.enemyHeroIds) {
                this.config.enemyHeroIds = {};
            }
            [2, 3, 4].forEach(pid => {
                if (!this.config.enemyHeroIds![pid]) {
                    this.config.enemyHeroIds![pid] = 'normal';
                }
            });
        }

        const hasExplicitEnemyHero = !TutorialManager.isActive && !!this.config.enemyHeroId && this.config.enemyHeroId !== 'normal' && this.config.enemyHeroId !== 'random';
        const isMasterOrDan = this.config.difficulty === 'dan' || (this.config.isRoguelikeMatch === true && RoguelikeRunManager.runDifficulty === 'extreme');
        if (!TutorialManager.isActive && (hasExplicitEnemyHero || (this.config.gameMode === '1via' && isMasterOrDan && !isBoss))) {
            const availableAIHeroes: HeroId[] = ['tengu', 'himiko', 'kitsune', 'ronin', 'ryujin'];
            this.aiHeroId = (this.config.enemyHeroId && this.config.enemyHeroId !== 'random') 
                ? this.config.enemyHeroId as HeroId 
                : availableAIHeroes[Math.floor(Math.random() * availableAIHeroes.length)];
            this.aiPassiveAvailable = true;
            this.aiRyujinEarnedBurns = 0;
            if (this.aiHeroId === 'kitsune') {
                this.aiActiveChargesLeft = ChampionManager.getKitsuneShieldCharges(this.board);
            } else if (this.aiHeroId === 'alchemist') {
                this.aiActiveChargesLeft = ChampionManager.getAlchemistInversionCount(this.board);
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

        // Guardar imagen/nombre del rival no-campeón para el HUD (monje o sabio)
        this.resolvedRivalImage = resolvedEnemyImage;
        this.resolvedRivalName = resolvedEnemyName;
        this.resolvedRivalIcon = resolvedEnemyIcon;


        HUDController.updateDuelists(
            !TutorialManager.isActive && this.config.ruleStyle === 'roguelite',
            selectedHero || 'normal',
            (this.config.isRoguelikeMatch === true) ? (RoguelikeRunManager.getCurrentNode() || undefined) : undefined,
            this.config.gameMode,
            this.config.difficulty,
            this.state,
            this.aiHeroId,
            this.resolvedRivalImage || undefined,
            this.resolvedRivalName || undefined,
            this.resolvedRivalIcon || undefined,
            this.config.enemyHeroIds
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
                // Para modos con IA (1vIA, custom con slots IA, story), disparar el turno de la IA
                // después de que la habilidad haya avanzado el turno (ej: Alquimista en 4P).
                // Sin este llamado, isInteractive queda en false y el juego se bloquea.
                if (this.config.gameMode === '1via' || this.config.gameMode === 'aivsai' || this.config.gameMode === 'story') {
                    if (!this.state.isGameOver) {
                        this.checkAITurn();
                    }
                } else if (this.config.gameMode === 'custom' && this.config.slots) {
                    // Modo custom (incluye partidas 4P con slots mixtos humano+IA)
                    if (!this.state.isGameOver) {
                        this.checkAITurn();
                    }
                } else if (this.config.gameMode === '1v1') {
                    // En 1v1 puro (humanos locales, sin IA), simplemente restablecer interactividad
                    if (!this.state.isGameOver) {
                        this.renderer.isInteractive = this.isLocalPlayerTurn();
                        this.updateInGameUI();
                    }
                }
            },
            () => GameController.isLocalPlayerTurn()
        );

        this.renderer.onCaptiveDevClick = (captive, capturerId) => {
            this.handleCaptiveCapture(captive, capturerId);
        };

        this.renderer.onPassiveBurnCompleted = () => {
            if (this.config.gameMode === '1via' || this.config.gameMode === 'aivsai' || this.config.gameMode === 'story' || (this.config.gameMode === 'custom' && this.config.slots)) {
                if (!this.state.isGameOver) {
                    this.checkAITurn();
                }
            } else if (this.config.gameMode === '1v1') {
                if (!this.state.isGameOver) {
                    this.renderer.isInteractive = this.isLocalPlayerTurn();
                    this.updateInGameUI();
                }
            }
        };

        this.renderer.background = this.config.background;
        StageHazardManager.reset();

        this.renderer.render();
        SandboxController.register(this.board, this.state, () => this.updateInGameUI());
        this.updateInGameUI();
        HUDController.hideAlert();
        ModalManager.closeScoreModal();

        // Anuncio Cinematográfico de Komi (Roguelike, 1 vs 1 Local, 4P Local y 1vIA)
        // Se omite en: Tutorial, Modo Historia con komi = 0
        let skipKomiSplash = TutorialManager.isActive && (!TutorialManager.currentChapter || !TutorialManager.currentChapter.id.includes('komi'));
        const isStoryMatch = this.config.gameMode === 'story' || (window as any).StoryModeController?.isStoryActive || this.config.background === 'story';
        if (isStoryMatch) skipKomiSplash = true;

        if (this.config.gameMode !== 'online' && !skipKomiSplash && this.config.gameMode !== 'aivsai') {
            const isEn = getLanguage() === 'en';
            if (this.config.playerCount === 4) {
                let badgeText = isEn ? '⚫ PLAYING AS BLACK (P1) • 4-PLAYER BATTLE' : '⚫ JUEGAS CON NEGRAS (P1) • BATALLA 4 BANDOS';
                if (this.config.gameMode === '1v1') {
                    badgeText = isEn ? '⚫ P1 (BLACK) • ⚪ P2 • 🟢 P3 • 🟣 P4' : '⚫ P1 (NEGRAS) • ⚪ P2 • 🟢 P3 • 🟣 P4';
                }
                const pKomis = this.config.playerKomis || { 2: 2.5, 3: 4.5, 4: 6.5 };
                HUDController.showRogueKomiAnnouncement(
                    { komi: this.config.komi, playerKomis: pKomis, playerCount: 4 },
                    2600,
                    badgeText
                );
            } else {
                let badgeText = isEn ? '⚫ PLAYING AS BLACK • FIRST TURN' : '⚫ JUEGAS CON NEGRAS • PRIMER TURNO';
                if (this.config.gameMode === '1v1') {
                    badgeText = isEn ? '⚫ PLAYER 1 (BLACK) VS ⚪ PLAYER 2 (WHITE)' : '⚫ JUGADOR 1 (NEGRAS) VS ⚪ JUGADOR 2 (BLANCAS)';
                } else if (this.config.humanColor === 2) {
                    badgeText = isEn ? '⚪ PLAYING AS WHITE • SECOND TURN' : '⚪ JUEGAS CON BLANCAS • SEGUNDO TURNO';
                }
                HUDController.showRogueKomiAnnouncement(
                    { komi: this.config.komi, playerCount: 2 },
                    2200,
                    badgeText
                );
            }
        }

        // Las entidades y objetos especiales capturables (rehenes, cofres, pergaminos) se reservan para el Modo Historia
        this.state.captives = [];
        this.initTimers();

        // Determinar fondo visual y atmósfera sonora del tablero según la selección o modo
        let activeBg: BoardBackground = (this.config.background as BoardBackground) || 'combat';
        if (TutorialManager.isActive) {
            activeBg = 'tutorial';
        } else if (this.config.gameMode === 'story') {
            activeBg = 'story';
        } else if (!TutorialManager.isActive && this.config.ruleStyle === 'roguelite' && this.config.isRoguelikeMatch === true) {
            activeBg = isBoss ? 'boss' : 'combat';
        } else if (this.config.background) {
            activeBg = this.config.background;
        } else if (this.board.shape === 'volcano') {
            activeBg = 'boss';
        }
        HUDController.setBoardBackground(activeBg);

        this.renderer.isInteractive = this.isLocalPlayerTurn();

        // Si es 1vIA y el humano eligió Blancas/otro color no inicial, la IA abre
        if (this.config.gameMode === '1via' || this.config.gameMode === 'aivsai' || this.isAISlot(this.state.currentPlayer)) {
            this.checkAITurn();
        }
    }

    public static isAISlot(playerId: PlayerId): boolean {
        if (!this.config || !this.config.slots) return false;
        return this.config.slots[playerId]?.type === 'ai';
    }

    public static isLocalPlayerTurn(): boolean {
        if (!this.state || this.state.isGameOver) return false;
        if (TutorialManager.isActive) return true;

        if (this.config.gameMode === 'custom' && this.config.slots && this.config.slots[this.state.currentPlayer]) {
            const slot = this.config.slots[this.state.currentPlayer];
            // En online, si somos el Host controlamos los 'human_local'
            // Si somos Guest, controlamos la ranura que coincida con nuestro localOnlineColor
            if (this.localOnlineColor !== 1) { // We are guest (Host is always 1)
                return this.state.currentPlayer === this.localOnlineColor;
            } else {
                return slot.type === 'human_local';
            }
        }

        if (this.config.gameMode === '1v1') return true;
        if (this.config.isCoopRogue) {
            if (this.state.currentPlayer !== 1) return false;
            const currentSub = this.config.coopSubTurn || 1;
            return this.localOnlineColor === currentSub;
        }
        if (this.config.gameMode === '1via' || this.config.gameMode === 'story') return this.state.currentPlayer === this.config.humanColor;
        if (this.config.gameMode === 'online') return this.state.currentPlayer === this.localOnlineColor;
        if (this.config.gameMode === 'aivsai') return false; // AI always plays
        return false;
    }

    private static initTimers() {
        TimeManager.init(
            this.config,
            this.state,
            () => {
                this.state.passTurn(this.board);
                this.updateInGameUI();
                this.renderer.render();
                if (this.config.gameMode === '1via' || this.config.gameMode === 'aivsai') this.checkAITurn();
            },
            () => {
                this.showFinalScoreModal();
            }
        );
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

        const currentHero = this.config.heroId || (this.config.isRoguelikeMatch === true ? RoguelikeRunManager.selectedHero : 'normal');
        HUDController.updateDuelists(
            !TutorialManager.isActive && this.config.ruleStyle === 'roguelite',
            currentHero as HeroId,
            (this.config.isRoguelikeMatch === true) ? (RoguelikeRunManager.getCurrentNode() || undefined) : undefined,
            this.config.gameMode,
            this.config.difficulty,
            this.state,
            this.aiHeroId,
            this.resolvedRivalImage || undefined,
            this.resolvedRivalName || undefined,
            this.resolvedRivalIcon || undefined,
            this.config.enemyHeroIds
        );

        if (this.state.isGameOver && !this.state.scoreReport) {
            this.showFinalScoreModal();
        }
    }

    private static onNodeClicked(nodeId: string, isLocal: boolean) {
        if (TutorialManager.isActive) {
            TutorialManager.advanceStep();
            return;
        }

        if (this.state.isScoringPhase) {
            if (isLocal) {
                // Alternar vida/muerte de la cadena entera
                const node = this.board.nodes.get(nodeId);
                if (node && node.stone) {
                    const chainNodes = this.board.getChain(nodeId);
                    const currentlyForced = this.state.manualDeadStones.get(nodeId);
                    
                    // Toggle cíclico: (nada -> forzado muerto -> forzado vivo -> nada)
                    let nextState: boolean | undefined;
                    if (currentlyForced === undefined) {
                        nextState = true;
                    } else if (currentlyForced === true) {
                        nextState = false;
                    } else {
                        nextState = undefined;
                    }

                    for (const cid of chainNodes) {
                        if (nextState === undefined) {
                            this.state.manualDeadStones.delete(cid);
                        } else {
                            this.state.manualDeadStones.set(cid, nextState);
                        }
                    }
                    this.state.scoreReport = TerritoryScorer.calculateScore(this.board, this.state); // Actualizar predicción
                    this.updateInGameUI();
                    this.renderer.render();
                    
                    if (this.config.gameMode === 'online' && this.onOnlineMoveCallback) {
                        // Enviar evento custom para online (reutilizamos MOVE para simplificar)
                        // TODO: un nuevo tipo de mensaje 'MARK_DEAD' sería mejor
                        // Para evitar romper, no sincronizaremos la disputa online aún o lo haremos a través de MAP_CLICK.
                    }
                }
            }
            return;
        }

        if (ChampionManager.currentTargetingMode !== 'none') {
            this.renderer.isInteractive = true;
            return;
        }

        if (isLocal) {
            const previousPlayerId = (this.state.currentPlayer === 1 ? this.config.playerCount : (this.state.currentPlayer - 1)) as PlayerId;

            // Comprobar captura de entidades neutrales (objetos/rehenes)
            RulesEngine.resolveCaptiveCaptures(this.board, this.state, previousPlayerId, (captive, capturerId) => {
                this.handleCaptiveCapture(captive, capturerId);
            });

            if (this.config.isCoopRogue) {
                this.config.coopSubTurn = (this.config.coopSubTurn === 1 ? 2 : 1);
            }

            // Notificar al TimeManager para reiniciar Byo-yomi o añadir Fischer
            TimeManager.onMovePlaced(this.config, this.state, previousPlayerId);

            if (this.config.gameMode === 'online' && this.onOnlineMoveCallback) {
                this.onOnlineMoveCallback(nodeId);
                this.updateInGameUI();
                this.renderer.isInteractive = this.isLocalPlayerTurn();
            } else if (this.config.gameMode === '1via' || this.config.gameMode === 'aivsai' || this.config.gameMode === 'story') {
                this.checkAITurn();
            } else {
                this.updateInGameUI();
                this.renderer.isInteractive = this.isLocalPlayerTurn();
            }
        } else {
            // Movimiento realizado por IA o rival remoto
            this.updateInGameUI();
            this.renderer.isInteractive = this.isLocalPlayerTurn();
            if (this.isLocalPlayerTurn()) {
                HUDController.setAIBadge(false);
            }
        }
    }

    public static checkAITurn() {
        if (TutorialManager.isActive) return; // La IA es controlada por el tutorial
        if (this.isAITurnProcessing) return;

        // Comprobar si el jugador actual debe ser controlado por IA (Slots)
        let isAI = false;
        if (this.config.gameMode === 'aivsai') {
            isAI = true;
        } else if (this.config.slots && this.config.slots[this.state.currentPlayer]) {
            isAI = this.config.slots[this.state.currentPlayer].type === 'ai';
        } else {
            // Comportamiento clásico (compatibilidad hacia atrás)
            isAI = (this.config.gameMode === '1via' || this.config.gameMode === 'story') && this.state.currentPlayer !== this.config.humanColor;
        }

        if (!isAI || this.state.isGameOver) {
            this.renderer.isInteractive = this.isLocalPlayerTurn() || ChampionManager.currentTargetingMode !== 'none' || this.state.isScoringPhase;
            HUDController.setAIBadge(false);
            return;
        }

        if (this.state.isScoringPhase) {
            // La IA acepta cualquier puntuación inmediatamente
            this.state.isScoringPhase = false;
            this.state.isGameOver = true;
            this.updateInGameUI();
            return;
        }



        // Si el jugador humano está en modo apuntado de habilidad...
        // la IA DEBE esperar a que el humano termine su selección.
        if (ChampionManager.currentTargetingMode !== 'none') {
            this.renderer.isInteractive = true;
            HUDController.setAIBadge(false);
            return;
        }

        const activePlayer = this.state.currentPlayer;
        // Sólo abotar si es humano y NO está forzado a IA por slots
        if (!isAI && activePlayer === this.config.humanColor) {
            this.renderer.isInteractive = true;
            HUDController.setAIBadge(false);
            return;
        }

        // Bloquear interacción mientras la IA calcula
        this.renderer.isInteractive = false;
        HUDController.setAIBadge(true);

        const isTurbo = (window as any).AI_TURBO_MODE === true;
        const thinkDelay = isTurbo ? 0 : 20;

        if (this.aiTurnTimeout) {
            clearTimeout(this.aiTurnTimeout);
            this.aiTurnTimeout = null;
        }

        this.aiTurnTimeout = window.setTimeout(async () => {
            if (this.state.isGameOver) return;
            this.isAITurnProcessing = true;
            try {

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
                    this.state.passTurn(this.board);
                    this.updateInGameUI();

                    if (!this.state.isGameOver && (this.config.gameMode === 'aivsai' || this.isAISlot(this.state.currentPlayer) || (!this.config.slots && this.state.currentPlayer !== this.config.humanColor))) {
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
            let activeAiHeroId = this.aiHeroId;
            if (this.config.playerCount === 4 && this.config.enemyHeroIds) {
                activeAiHeroId = (this.config.enemyHeroIds[activePlayer] as HeroId | null) || null;
            }

            if (activeAiHeroId) {
                const aiPlayerId = activePlayer;
                const humanPlayerId = this.config.humanColor;

                // A. Himiko (Pasiva en Turno 15 personal de la IA)
                if (activeAiHeroId === 'himiko' && this.aiPassiveAvailable) {
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
                                CombatLogManager.logPassiveTrigger(this.board, this.state, 'himiko', 'Lluvia Pétrea', shuffled.map(n => n.id), aiPlayerId);
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
                if (activeAiHeroId === 'ryujin') {
                    const livingGroups = this.board.getLivingGroupsInfo(aiPlayerId).filter(g => g.eyesCount >= 2);
                    const totalNodes = this.board.nodes.size;
                    let burnsToTrigger = 0;

                    const is19x19Scale = this.board.shape === 'oni' || totalNodes > 220;

                    if (!is19x19Scale && totalNodes <= 100) {
                        if (livingGroups.length >= 1 && this.aiPassiveAvailable) {
                            this.aiPassiveAvailable = false;
                            burnsToTrigger = 2;
                        }
                    } else if (!is19x19Scale && totalNodes <= 220) {
                        const has3Eyes = livingGroups.some(g => g.eyesCount >= 3);
                        if (has3Eyes && this.aiPassiveAvailable) {
                            this.aiPassiveAvailable = false;
                            burnsToTrigger = 4;
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
                                RulesEngine.destroyStoneAndPolyGroup(this.board, this.state, targetNode.id);
                            }
                            CombatLogManager.logPassiveTrigger(this.board, this.state, 'ryujin', 'Furia del Dragón', stonesToBurn.map(n => n.id), aiPlayerId);
                            HUDController.showAlert(`🐉🔥 ¡Furia del Dragón del rival! Ha consolidado territorio y ha calcinado ${stonesToBurn.length} de tus piedras.`);
                            this.renderer.render();
                            this.updateInGameUI();
                        }
                    }
                }

                // C. Tengu (Lluvia Meteórica de la IA)
                if (activeAiHeroId === 'tengu' && this.aiActiveChargesLeft > 0) {
                    let bestCenterNode: BoardNode | null = null;
                    let maxEnemyStonesInZone = 0;

                    for (const node of this.board.nodes.values()) {
                        if (node.terrain === 'DESTROYED' || node.terrain === 'OBSTACLE') continue;
                        const zone = ChampionManager.getMeteorZoneNodes(this.board, node.id);
                        if (zone.length === 0) continue;
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
                                RulesEngine.destroyStoneAndPolyGroup(this.board, this.state, n.id);
                            }
                        };

                        const onFinishedMeteors = () => {
                            CombatLogManager.logChampionSkill(this.board, this.state, 'tengu', 'Lluvia Meteórica', bestCenterNode.id, impactNodes.map(n => n.id), aiPlayerId);
                            HUDController.showAlert(`☄️ ¡El rival ha invocado la Lluvia Meteórica de Tengu sobre tus piedras!`);
                            this.renderer.render();
                            this.updateInGameUI();
                        };

                        if (svgElement) {
                            VFXManager.triggerMeteorShower(impactCoords, svgElement, onImpactNode, onFinishedMeteors, this.renderer.currentStoneRadius);
                        } else {
                            impactNodes.forEach((_, idx) => onImpactNode(idx));
                            onFinishedMeteors();
                        }
                    }
                }

                // D. Kitsune (Escudo Divino de la IA)
                if (activeAiHeroId === 'kitsune' && this.aiActiveChargesLeft > 0) {
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
                            CombatLogManager.logChampionSkill(this.board, this.state, 'kitsune', 'Escudo Divino', unprotectedStoneId, [unprotectedStoneId], aiPlayerId);
                            SoundFX.playUndo();
                            HUDController.showAlert(`🛡️✨ ¡El rival ha protegido una piedra clave con el Escudo Divino de Kitsune!`);
                            this.renderer.render();
                            this.updateInGameUI();
                        }
                    }
                }

                // E. Ronin / Alquimista (Inversión Cromática de la IA)
                if ((activeAiHeroId === 'ronin' || activeAiHeroId === 'alchemist') && this.aiActiveChargesLeft > 0) {
                    const humanStones = Array.from(this.board.nodes.values())
                        .filter(n => n.stone && n.stone.playerId === humanPlayerId && !n.stone.isIndestructible);
                    
                    let bestInversionNode: typeof humanStones[0] | null = null;
                    let maxCaptureGain = 0;

                    // IMPORTANTE: Usar lectura segura sin mutar el tablero
                    // resolveBoardCaptures() modifica el estado real, NO usarlo aquí para simular
                    for (const candNode of humanStones) {
                        // Contar cuántas piedras enemigas quedarían en atari si invertimos esta ficha,
                        // sin modificar el tablero real
                        candNode.stone!.playerId = aiPlayerId;
                        const captCount = RulesEngine.countPotentialCaptures(this.board, candNode.id, aiPlayerId);
                        candNode.stone!.playerId = humanPlayerId; // Revertir SIEMPRE antes de continuar

                        if (captCount > maxCaptureGain) {
                            maxCaptureGain = captCount;
                            bestInversionNode = candNode;
                        }
                    }

                    // Si no hay captura posible pero tenemos turno suficiente, elegir la piedra más conectada
                    if (!bestInversionNode && humanStones.length > 0 && this.state.currentTurn >= 12) {
                        bestInversionNode = humanStones[0]; // La primera disponible como fallback
                    }

                    if (bestInversionNode) {
                        this.aiActiveChargesLeft--;
                        const inversionCount = ChampionManager.getRoninInversionCount(this.board);
                        const chosenToInvert = [bestInversionNode, ...humanStones.filter(n => n !== bestInversionNode)].slice(0, inversionCount);

                        for (const targetNode of chosenToInvert) {
                            if (svgElement) {
                                VFXManager.triggerWindSlash({ x: targetNode.x, y: targetNode.y }, svgElement);
                            }
                            targetNode.stone!.playerId = aiPlayerId;
                        }

                        const totalCaptured = RulesEngine.resolveBoardCaptures(this.board, this.state, aiPlayerId);
                        if (totalCaptured > 0) SoundFX.playCapture();
                        
                        CombatLogManager.logChampionSkill(this.board, this.state, (activeAiHeroId || 'ronin') as HeroId, 'Inversión Cromática', bestInversionNode.id, chosenToInvert.map(n => n.id), aiPlayerId, totalCaptured);
                        HUDController.showAlert(`🌪️ ¡El rival ha ejecutado la Inversión Cromática de Ronin, transmutando ${chosenToInvert.length} piedra(s) y pasando turno!`);
                        this.renderer.render();
                        this.state.passTurn(this.board);
                        this.updateInGameUI();

                        if (!this.state.isGameOver && (this.config.gameMode === 'aivsai' || this.isAISlot(this.state.currentPlayer) || (!this.config.slots && this.state.currentPlayer !== this.config.humanColor))) {
                            this.checkAITurn();
                        } else {
                            this.renderer.isInteractive = this.isLocalPlayerTurn();
                            HUDController.setAIBadge(false);
                        }
                        return; // Alquimista/Ronin pasa turno inmediatamente
                    }
                }
            }

            const activePlayerDifficulty = this.config.slots?.[activePlayer]?.aiDifficulty || this.config.difficulty;
            const meta = TerritoryScorer.PLAYER_META[activePlayer];
            
            let aiChoice: import('../ai/GoAI').AIMoveChoice;
            try {
                const { AITurnManager } = await import('./AITurnManager');
                aiChoice = await AITurnManager.calculateMoveAsync(this.board, this.state, activePlayer, activePlayerDifficulty, this.state.komi, this.config);
                
                if (aiChoice.winRates) {
                    import('../core/AnalysisEngine').then(m => {
                        (m.AnalysisEngine as any).cachedNeuralWinRates = {
                            turn: this.state.currentTurn,
                            winRates: aiChoice.winRates!
                        };
                    });
                    HUDController.updateWinRates(aiChoice.winRates, this.state.playerCount);
                }
            } catch (err) {
                console.warn("[GameController] Neural Net Worker failed, falling back to heuristics:", err);
                aiChoice = GoAI.getBestMove(this.board, this.state, activePlayer, activePlayerDifficulty);
            }

            if (aiChoice.nodeId === null) {
                // La IA decide pasar
                SoundFX.playPass();
                this.state.passTurn(this.board);
                this.renderer.render();
                this.updateInGameUI();
                HUDController.showAlert(`🤖 IA (${meta.name} ${meta.icon}) ha pasado turno.`);

                if (this.state.isGameOver) {
                    this.showFinalScoreModal();
                } else if (this.config.gameMode === 'aivsai' || this.isAISlot(this.state.currentPlayer) || (!this.config.slots && this.state.currentPlayer !== this.config.humanColor)) {
                    this.checkAITurn();
                } else {
                    this.renderer.isInteractive = this.isLocalPlayerTurn();
                    HUDController.setAIBadge(false);
                }
            } else {
                // La IA ejecuta la jugada
                this.renderer.handleNodeClick(aiChoice.nodeId, false);

                // Comprobar si la jugada de la IA capturó alguna entidad neutral
                RulesEngine.resolveCaptiveCaptures(this.board, this.state, 2, (captive, capturerId) => {
                    if (this.config.gameMode === 'story') {
                        StoryController.onCaptiveCaptured(captive.id, capturerId);
                    } else {
                        HUDController.showAlert(`⚠️ ¡El rival ha asediado y absorbido ${captive.name}!`);
                    }
                    SoundFX.playSpecial();
                    this.renderer.render();
                });

                // Fallback de seguridad: Si por alguna razón la jugada no avanzó el turno, pasar turno
                if (this.state.currentPlayer === activePlayer) {
                    SoundFX.playPass();
                    this.state.passTurn(this.board);
                    this.renderer.render();
                    this.updateInGameUI();
                }

                // Render garantizado en el siguiente frame de animación para asegurar que
                // los VFX asíncronos o checkPassiveTriggers no sobreescriban la piedra de la IA
                window.requestAnimationFrame(() => {
                    setTimeout(() => {
                        this.renderer.render();
                        this.updateInGameUI();
                        if (!this.state.isGameOver && (this.config.gameMode === 'aivsai' || this.isAISlot(this.state.currentPlayer) || (!this.config.slots && this.state.currentPlayer !== this.config.humanColor))) {
                            this.checkAITurn();
                        } else {
                            this.renderer.isInteractive = this.isLocalPlayerTurn();
                            HUDController.setAIBadge(false);
                        }
                    }, isTurbo ? 0 : 10);
                });
            }

            } finally {
                this.isAITurnProcessing = false;
            }
        }, thinkDelay);
    }

    public static handlePass(isLocal: boolean = true) {
        if (!this.state || this.state.isGameOver) return;

        if (this.config.gameMode === 'online' && !isLocal) {
            // Recibido pase remoto desde WebRTC
            const activeBefore = this.state.currentPlayer;
            SoundFX.playPass();
            const passed = this.state.passTurn(this.board);
            if (passed) {
                CombatLogManager.logPassTurn(this.board, this.state, activeBefore);
                TimeManager.onMovePlaced(this.config, this.state, activeBefore);
                this.renderer.render();
                this.updateInGameUI();
                const meta = TerritoryScorer.PLAYER_META[activeBefore];
                HUDController.showAlert(`${meta.name} ${meta.icon} ha pasado turno.`);
                if (this.state.consecutivePasses >= this.state.playerCount) {
                    this.showFinalScoreModal();
                } else {
                    this.renderer.isInteractive = this.isLocalPlayerTurn();
                }
            }
            return;
        }

        const activeBefore = this.state.currentPlayer;
        SoundFX.playPass();
        const passed = this.state.passTurn(this.board);
        if (passed) {
            CombatLogManager.logPassTurn(this.board, this.state, activeBefore);
            TimeManager.onMovePlaced(this.config, this.state, activeBefore);
            this.renderer.render();
            this.updateInGameUI();

            if (isLocal && this.config.isCoopRogue) {
                this.config.coopSubTurn = (this.config.coopSubTurn === 1 ? 2 : 1);
            }

            const meta = TerritoryScorer.PLAYER_META[activeBefore];
            HUDController.showAlert(`${meta.name} ${meta.icon} ha pasado turno.`);

            if (isLocal && this.config.gameMode === 'online' && this.onOnlinePassCallback) {
                this.onOnlinePassCallback();
            }

            if (TutorialManager.isActive) {
                TutorialManager.advanceStep();
                return;
            }

            // Comprobar peligros ambientales (Erupción Volcánica, Caída Celestial, Inhalación del Oni)
            const executePostPassFlow = () => {
                if (this.state.isGameOver) {
                    this.showFinalScoreModal();
                } else {
                    if (this.config.gameMode === '1via') {
                        this.checkAITurn();
                    } else {
                        this.renderer.isInteractive = this.isLocalPlayerTurn();
                    }
                }
            };

            const hazardTriggered = StageHazardManager.checkStageHazards(
                this.board,
                this.state,
                this.renderer?.svgElement || null,
                () => {
                    this.renderer?.render();
                    this.updateInGameUI();
                },
                () => {
                    this.renderer?.render();
                    this.updateInGameUI();
                    executePostPassFlow();
                }
            );

            if (!hazardTriggered) {
                executePostPassFlow();
            }
        }
    }

    public static handleUndo() {
        if (!DevModeManager.isUndoRedoAllowed(this.config.gameMode)) {
            HUDController.showAlert("⏪ Deshacer no está permitido en este modo (Usa el pergamino 'Rebobinar' ⏳ o activa el Modo Desarrollador en Opciones).");
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
                // Guardar coordenadas de piedras antes de deshacer
                const stonesBefore = new Map<string, { x: number; y: number; playerId: import('../core/GraphBoard').PlayerId }>();
                for (const [id, node] of this.board.nodes.entries()) {
                    if (node.stone) {
                        stonesBefore.set(id, { x: node.x, y: node.y, playerId: node.stone.playerId });
                    }
                }

                this.state.undo(this.board);
                this.state.undo(this.board);
                CombatLogManager.onUndo(2);

                // Identificar piedras que desaparecieron
                const removedStones: Array<{ x: number; y: number; playerId: import('../core/GraphBoard').PlayerId }> = [];
                for (const [id, data] of stonesBefore.entries()) {
                    const nodeAfter = this.board.nodes.get(id);
                    if (!nodeAfter || !nodeAfter.stone) {
                        removedStones.push(data);
                    }
                }
                
                SoundFX.playUndo();
                this.renderer.render();
                
                if (removedStones.length > 0) {
                    removedStones.forEach(stone => {
                        this.renderer.triggerRewindStoneLift(stone.x, stone.y, stone.playerId);
                    });
                }
            } else {
                this.executeUndoWithVFX();
            }
        } else {
            this.executeUndoWithVFX();
        }

        StageHazardManager.onTurnRolledBack(this.state.currentTurn);

        this.updateInGameUI();
        HUDController.showAlert("⏪ Jugada deshecha (Rebobinado).");
    }

    private static executeUndoWithVFX() {
        const stonesBefore = new Map<string, { x: number; y: number; playerId: import('../core/GraphBoard').PlayerId }>();
        for (const [id, node] of this.board.nodes.entries()) {
            if (node.stone) {
                stonesBefore.set(id, { x: node.x, y: node.y, playerId: node.stone.playerId });
            }
        }

        this.state.undo(this.board);
        CombatLogManager.onUndo(1);

        const removedStones: Array<{ x: number; y: number; playerId: import('../core/GraphBoard').PlayerId }> = [];
        for (const [id, data] of stonesBefore.entries()) {
            const nodeAfter = this.board.nodes.get(id);
            if (!nodeAfter || !nodeAfter.stone) {
                removedStones.push(data);
            }
        }
        
        SoundFX.playUndo();
        this.renderer.render();
        
        if (removedStones.length > 0) {
            removedStones.forEach(stone => {
                this.renderer.triggerRewindStoneLift(stone.x, stone.y, stone.playerId);
            });
        }
    }

    public static handleRedo() {
        if (!DevModeManager.isUndoRedoAllowed(this.config.gameMode)) {
            HUDController.showAlert("⏩ Rehacer no está permitido en este modo.");
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
            },
            _skillType
        );
        SoundFX.playSpecial();
        this.renderer.render();
        this.updateInGameUI();
    }

    public static selectSpell(spellId: SpellId) {
        if (!this.isLocalPlayerTurn()) {
            const isEn = getLanguage() === 'en';
            if (this.config.isCoopRogue && this.config.localCoopRole && this.config.localCoopRole !== this.config.coopSubTurn && this.state.currentPlayer === 1) {
                HUDController.showAlert(isEn ? '⏳ Wait for your partner to play.' : '⏳ Espera a que tu compañero juegue.');
            } else {
                HUDController.showAlert(isEn ? "You can only cast spells during your turn." : "Solo puedes lanzar hechizos durante tu turno.");
            }
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
            (msg, removedStones) => {
                const spellNames: Record<SpellId, string> = {
                    rewind: 'Rebobinar',
                    meteor: 'Meteorito',
                    shield: 'Escudo Divino',
                    convert: 'Inversión Yin-Yang'
                };
                CombatLogManager.logSpellCast(
                    this.board,
                    this.state,
                    spellId,
                    spellNames[spellId] || 'Hechizo Místico',
                    removedStones ? removedStones.map(s => `${s.x},${s.y}`) : [],
                    this.config.humanColor
                );

                this.renderer.render();
                
                if (spellId === 'rewind') {
                    // Cancelar cualquier turno pendiente de IA para que no juegue a destiempo
                    if (this.aiTurnTimeout) {
                        clearTimeout(this.aiTurnTimeout);
                        this.aiTurnTimeout = null;
                    }
                    HUDController.setAIBadge(false);
                    ChampionManager.currentTargetingMode = 'none';
                    PolyominoManager.activePolyomino = null;
                    this.renderer.isInteractive = this.isLocalPlayerTurn();

                    if (removedStones && removedStones.length > 0) {
                        removedStones.forEach(stone => {
                            this.renderer.triggerRewindStoneLift(stone.x, stone.y, stone.playerId);
                        });
                    }

                    if (this.config.gameMode === 'online' && this.onOnlineUndoCallback) {
                        this.onOnlineUndoCallback();
                    }
                }
                
                this.updateInGameUI();
                HUDController.showAlert(msg);

                if (TutorialManager.isActive) {
                    TutorialManager.advanceStep();
                }
            },
            (err) => {
                HUDController.showAlert(err);
            },
            (effectType, payload, onComplete) => {
                if (effectType === 'meteor' && this.renderer.svgElement) {
                    const node = this.board.nodes.get(payload.nodeId);
                    if (node) {
                        const theme = payload.isAlly ? 'blue' : 'red';
                        TenguVFX.triggerMeteorShower(
                            [{ x: node.x, y: node.y }], 
                            this.renderer.svgElement, 
                            () => {}, 
                            onComplete, 
                            this.renderer.currentStoneRadius, 
                            theme
                        );
                        return;
                    }
                }
                // Fallback si no hay efectos o algo falla
                onComplete();
            }
        );
    }

    public static selectPolyomino(type: PolyominoType) {
        const isEn = getLanguage() === 'en';
        if (!this.isLocalPlayerTurn()) {
            HUDController.showAlert(isEn ? "You can only deploy polyomino stones during your turn." : "Solo puedes desplegar fichas poliminó durante tu turno.");
            SoundFX.playIllegal();
            return;
        }

        // Cancelar targeting de campeón si estaba activo
        if (ChampionManager.currentTargetingMode !== 'none') {
            ChampionManager.currentTargetingMode = 'none';
        }

        // Si ya está seleccionada la Duplicidad y se vuelve a pulsar el botón en el HUD, rotarla fluidamente
        if (type === 'domino' && PolyominoManager.activePolyomino === 'domino') {
            this.rotatePolyomino();
            return;
        }

        PolyominoManager.selectPolyomino(type);
        if (PolyominoManager.activePolyomino) {
            const card = PolyominoManager.polyominoCards.get(type);
            SoundFX.playPlaceStone();
            if (type === 'domino') {
                HUDController.showAlert(isEn 
                    ? `🎯 ${card?.name || 'Duplicity'} (2x1): Hover to position. Press [R] or click icon to rotate (⇄/⇅).`
                    : `🎯 ${card?.name || 'Duplicidad'} (2x1): Pasa el cursor para posicionar. Pulsa [R] o clica el icono para rotar (⇄/⇅).`
                );
            } else if (type === 'monolith') {
                HUDController.showAlert(isEn
                    ? `🎯 ${card?.name || 'Monolith'} (2x2): Colossal 4-stone block. Click on the Goban to deploy.`
                    : `🎯 ${card?.name || 'Monolito'} (2x2): Bloque titánico de 4 piedras. Haz clic en el Goban para desplegar.`
                );
            } else {
                HUDController.showAlert(isEn 
                    ? `🎯 ${card?.name || 'Stone'}: Hover over the Goban and click to place.`
                    : `🎯 ${card?.name || 'Ficha'}: Pasa el cursor sobre el Goban y haz clic para colocarla.`
                );
            }
        } else {
            HUDController.showAlert(isEn ? "Stone deployment cancelled." : "Despliegue de ficha cancelado.");
        }

        this.renderer.render();
        this.updateInGameUI();
    }

    public static rotatePolyomino() {
        const isEn = getLanguage() === 'en';
        if (!this.isLocalPlayerTurn()) {
            HUDController.showAlert(isEn ? "You can only rotate stones during your turn." : "Solo puedes rotar piedras durante tu turno.");
            SoundFX.playIllegal();
            return;
        }

        const dominoCard = PolyominoManager.polyominoCards.get('domino');

        if (PolyominoManager.activePolyomino !== 'domino') {
            if (dominoCard && dominoCard.usesLeft > 0) {
                PolyominoManager.selectPolyomino('domino');
                PolyominoManager.toggleRotation();
                HUDController.showAlert(isEn
                    ? `🀄 Duplicity selected (${PolyominoManager.orientation === 'horizontal' ? 'Horizontal ⇄' : 'Vertical ⇅'}) • Press [R] to rotate`
                    : `🀄 Duplicidad seleccionada (${PolyominoManager.orientation === 'horizontal' ? 'Horizontal ⇄' : 'Vertical ⇅'}) • Pulsa [R] para rotar`
                );
            } else {
                HUDController.showAlert(isEn ? "You have no Duplicity stones available." : "No tienes fichas de Duplicidad disponibles.");
                SoundFX.playIllegal();
                return;
            }
        } else {
            PolyominoManager.toggleRotation();
            HUDController.showAlert(isEn
                ? `🀄 Duplicity Orientation: ${PolyominoManager.orientation === 'horizontal' ? 'Horizontal ⇄' : 'Vertical ⇅'} [R]`
                : `🀄 Orientación de Duplicidad: ${PolyominoManager.orientation === 'horizontal' ? 'Horizontal ⇄' : 'Vertical ⇅'} [R]`
            );
        }

        if (this.renderer) {
            this.renderer.refreshCurrentHoverGhost();
        }
        this.updateInGameUI();
    }

    public static handleRemoteUndo(_senderColor?: PlayerId) {
        if (!this.board || !this.state) return;
        const steps = (this.state.historyStack.length >= 2 && this.state.playerCount === 2) ? 2 : 1;
        for (let s = 0; s < steps; s++) {
            if (this.state.canUndo()) this.state.undo(this.board);
        }
        CombatLogManager.onUndo(steps);
        SoundFX.playUndo();
        const isEn = getLanguage() === 'en';
        HUDController.showAlert(isEn ? "⏩ Opponent rewound time." : "⏩ El rival rebobinó el tiempo.");
        this.renderer.render();
        this.updateInGameUI();
    }

    public static forceVictory() {
        if (!this.state || this.state.isGameOver) return;
        this.state.isGameOver = true;
        
        const report = TerritoryScorer.calculateScore(this.board, this.state);
        // Forzamos victoria de negras para testeo
        report.winner = 'black';
        this.state.scoreReport = report;

        this.renderer.render();
        GameEventBus.emit('MATCH_ENDED', { report, gameMode: this.config.gameMode });
        
        const isEn = getLanguage() === 'en';
        HUDController.showAlert(isEn ? "🏆 Victory forced by Dev tools." : "🏆 Victoria forzada por Dev tools.");
        setTimeout(() => {
            ModalManager.showFinalScoreModal(
                report,
                this.state.playerCount,
                this.config.isRoguelikeMatch === true,
                report.winner === 'black',
                this.config.humanColor
            );
        }, 1000);
    }

    public static showFinalScoreModal() {
        this.state.isGameOver = true;
        const report = TerritoryScorer.calculateScore(this.board, this.state);
        this.state.scoreReport = report;

        this.renderer.render();

        if (this.config.gameMode === 'story') {
            const winnerId = report.winner === 'black' ? 1 : 2;
            StoryController.onMatchEnded(winnerId);
        }

        const isRoguelike = this.config.isRoguelikeMatch === true;
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
            this.config.gameMode,
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

    public static handleCaptiveCapture(captive: any, capturerId: number) {
        const pId = capturerId as import('../core/GraphBoard').PlayerId;
        CombatLogManager.logCaptiveCaptured(this.board, this.state, captive.name, captive.nodeId, pId);
        
        if (this.config.gameMode === 'story') {
            StoryController.onCaptiveCaptured(captive.id, pId);
        } else if (capturerId === 1) {
            // Human player
            if (captive.type === 'chest') {
                RoguelikeRunManager.addPolyomino('domino', 1);
                RoguelikeRunManager.addPolyomino('sprouting', 1);
                HUDController.showAlert("🎁 ¡Has liberado el Cofre! (+1 Dominó y +1 Germinante)");
            } else if (captive.type === 'hostage') {
                ChampionManager.activeChargesLeft += 1;
                RogueliteManager.addSpell('shield', 1);
                const isEn = getLanguage() === 'en';
                HUDController.showAlert(isEn ? "🧙 You rescued the Monk! (+1 Skill Charge & +1 Divine Shield)" : "🧙 ¡Has rescatado al Monje! (+1 Carga de Habilidad y +1 Escudo Divino)");
            } else if (captive.type === 'scroll_relic') {
                RogueliteManager.addSpell('rewind', 1);
                const isEn = getLanguage() === 'en';
                HUDController.showAlert(isEn ? "📜 You obtained the Sacred Scroll of Rewind (+1)!" : "📜 ¡Has obtenido el Pergamino Sagrado de Rebobinar (+1)!");
            } else if (captive.type === 'spirit') {
                RoguelikeRunManager.addPolyomino('monolith', 1);
                RogueliteManager.addSpell('convert', 1);
                const isEn = getLanguage() === 'en';
                HUDController.showAlert(isEn ? "✨ You freed the Guardian Spirit! (+1 Monolith Tile 2x2 & +1 Yin-Yang Inversion)" : "✨ ¡Has liberado al Espíritu Guardián! (+1 Ficha Monolito 2x2 y +1 Inversión Yin-Yang)");
            }
        } else {
            // AI player
            HUDController.showAlert(`⚠️ ¡El rival ha asediado y absorbido ${captive.name}!`);
        }
        
        SoundFX.playSpecial();
        this.renderer.render();
    }
}

if (typeof window !== 'undefined') {
    (window as any).GameController = GameController;
}
