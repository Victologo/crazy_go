// GameState.ts - Estado central de la partida con soporte completo de Historial, Deshacer (Undo) y Rehacer (Redo)
import { GraphBoard, type PlayerId, type StoneInfo, type TerrainType } from './GraphBoard';
import { EntityManager } from './ECS';
import type { ScoreReport } from './TerritoryScorer';
import type { CaptiveEntity, TimerConfig, PlayerTimerState } from '../types';

export type PlayerStatus = 'READY' | 'WAITING_PRE_CARGA' | 'STUNNED_POST_CARGA';

export interface GameEvent {
    turnTrigger: number;
    execute: (state: GameState) => void;
}

export interface BoardNodeSnapshot {
    id: string;
    stone: StoneInfo | null;
    terrain: TerrainType;
}

export interface GameSnapshot {
    nodes: BoardNodeSnapshot[];
    currentTurn: number;
    currentRound: number;
    playerTurnCounts: Record<PlayerId, number>;
    currentPlayer: PlayerId;
    blackCaptures: number;
    whiteCaptures: number;
    greenCaptures: number;
    purpleCaptures: number;
    lastMoveNodeId: string | null;
    consecutivePasses: number;
    isGameOver: boolean;
    boardHistory: string[];
}

export class GameState {
    public currentTurn: number = 1;
    public currentRound: number = 1;
    public playerTurnCounts: Record<PlayerId, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    public playerCount: 2 | 4 = 2; // 2 Jugadores (1v1) o 4 Jugadores (Go Cuádruple)
    public currentPlayer: PlayerId = 1; // 1 = Negras (Empieza siempre), 2 = Blancas, 3 = Esmeralda, 4 = Amatista
    public eventQueue: GameEvent[] = [];
    
    // Capturas / Prisioneros por jugador
    public blackCaptures: number = 0;
    public whiteCaptures: number = 0;
    public greenCaptures: number = 0;
    public purpleCaptures: number = 0;
    public komi: number = 6.5;

    // Entidades y Objetos Capturables en el Goban (Modo Roguelike / Historia)
    public captives: CaptiveEntity[] = [];

    // Temporizadores de Jugadores
    public timerConfig?: TimerConfig;
    public playerTimers: Record<PlayerId, PlayerTimerState> = {
        1: { timeRemainingSeconds: 0, movesCount: 0, isFlagFallen: false },
        2: { timeRemainingSeconds: 0, movesCount: 0, isFlagFallen: false },
        3: { timeRemainingSeconds: 0, movesCount: 0, isFlagFallen: false },
        4: { timeRemainingSeconds: 0, movesCount: 0, isFlagFallen: false }
    };

    // Historial secuencial de jugadas
    public moveHistory: { playerId: PlayerId; nodeId: string | null; isPass?: boolean }[] = [];

    // Estados especiales de jugador
    public player1Status: PlayerStatus = 'READY';
    public player2Status: PlayerStatus = 'READY';
    public player1WaitTurns: number = 0;
    public player2WaitTurns: number = 0;

    // Reglas de Go clásicas
    public consecutivePasses: number = 0;
    public isGameOver: boolean = false;
    public lastMoveNodeId: string | null = null;
    public boardHistory: string[] = []; // Historial de estados para regla de Ko
    public scoreReport: ScoreReport | null = null;

    // Pila de Deshacer (Undo) y Rehacer (Redo)
    public historyStack: GameSnapshot[] = [];
    public redoStack: GameSnapshot[] = [];

    public entityManager: EntityManager;

    constructor(komi: number = 6.5, playerCount: 2 | 4 = 2) {
        this.komi = komi;
        this.playerCount = playerCount;
        this.entityManager = new EntityManager();
        this.playerTurnCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        this.captives = [];
        this.moveHistory = [];
    }

    public getTurnLabel(): string {
        const subturnLetters = ['a', 'b', 'c', 'd'];
        const letter = subturnLetters[this.currentPlayer - 1] || 'a';
        return `${this.currentRound}${letter}`;
    }

    public getPlayerTurnCount(playerId: PlayerId): number {
        return this.playerTurnCounts[playerId] || 0;
    }

    public getCaptures(playerId: PlayerId): number {
        switch (playerId) {
            case 1: return this.blackCaptures;
            case 2: return this.whiteCaptures;
            case 3: return this.greenCaptures;
            case 4: return this.purpleCaptures;
        }
    }

    public addCaptures(playerId: PlayerId, count: number) {
        switch (playerId) {
            case 1: this.blackCaptures += count; break;
            case 2: this.whiteCaptures += count; break;
            case 3: this.greenCaptures += count; break;
            case 4: this.purpleCaptures += count; break;
        }
    }

    addEvent(event: GameEvent) {
        this.eventQueue.push(event);
        this.eventQueue.sort((a, b) => a.turnTrigger - b.turnTrigger);
    }

    /**
     * Guarda una instantánea completa del tablero y estado actual antes de un movimiento
     */
    public recordSnapshot(board: GraphBoard) {
        const nodesSnapshot: BoardNodeSnapshot[] = [];
        for (const [id, node] of board.nodes.entries()) {
            nodesSnapshot.push({
                id,
                stone: node.stone ? { ...node.stone } : null,
                terrain: node.terrain
            });
        }

        this.historyStack.push({
            nodes: nodesSnapshot,
            currentTurn: this.currentTurn,
            currentRound: this.currentRound,
            playerTurnCounts: { ...this.playerTurnCounts },
            currentPlayer: this.currentPlayer,
            blackCaptures: this.blackCaptures,
            whiteCaptures: this.whiteCaptures,
            greenCaptures: this.greenCaptures,
            purpleCaptures: this.purpleCaptures,
            lastMoveNodeId: this.lastMoveNodeId,
            consecutivePasses: this.consecutivePasses,
            isGameOver: this.isGameOver,
            boardHistory: [...this.boardHistory]
        });

        // Limpiar pila de rehacer tras un nuevo movimiento
        this.redoStack = [];
    }

    public canUndo(): boolean {
        return this.historyStack.length > 0;
    }

    public canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * Deshace el último movimiento registrado
     */
    public undo(board: GraphBoard): boolean {
        if (!this.canUndo()) return false;

        // Guardar estado actual en la pila de rehacer
        const currentNodesSnapshot: BoardNodeSnapshot[] = [];
        for (const [id, node] of board.nodes.entries()) {
            currentNodesSnapshot.push({
                id,
                stone: node.stone ? { ...node.stone } : null,
                terrain: node.terrain
            });
        }

        this.redoStack.push({
            nodes: currentNodesSnapshot,
            currentTurn: this.currentTurn,
            currentRound: this.currentRound,
            playerTurnCounts: { ...this.playerTurnCounts },
            currentPlayer: this.currentPlayer,
            blackCaptures: this.blackCaptures,
            whiteCaptures: this.whiteCaptures,
            greenCaptures: this.greenCaptures,
            purpleCaptures: this.purpleCaptures,
            lastMoveNodeId: this.lastMoveNodeId,
            consecutivePasses: this.consecutivePasses,
            isGameOver: this.isGameOver,
            boardHistory: [...this.boardHistory]
        });

        // Restaurar estado anterior
        const prevSnapshot = this.historyStack.pop()!;
        this.applySnapshot(board, prevSnapshot);
        return true;
    }

    /**
     * Rehace el movimiento deshecho
     */
    public redo(board: GraphBoard): boolean {
        if (!this.canRedo()) return false;

        // Guardar estado actual en la pila de deshacer
        const currentNodesSnapshot: BoardNodeSnapshot[] = [];
        for (const [id, node] of board.nodes.entries()) {
            currentNodesSnapshot.push({
                id,
                stone: node.stone ? { ...node.stone } : null,
                terrain: node.terrain
            });
        }

        this.historyStack.push({
            nodes: currentNodesSnapshot,
            currentTurn: this.currentTurn,
            currentRound: this.currentRound,
            playerTurnCounts: { ...this.playerTurnCounts },
            currentPlayer: this.currentPlayer,
            blackCaptures: this.blackCaptures,
            whiteCaptures: this.whiteCaptures,
            greenCaptures: this.greenCaptures,
            purpleCaptures: this.purpleCaptures,
            lastMoveNodeId: this.lastMoveNodeId,
            consecutivePasses: this.consecutivePasses,
            isGameOver: this.isGameOver,
            boardHistory: [...this.boardHistory]
        });

        // Restaurar estado rehacer
        const nextSnapshot = this.redoStack.pop()!;
        this.applySnapshot(board, nextSnapshot);
        return true;
    }

    private applySnapshot(board: GraphBoard, snapshot: GameSnapshot) {
        // Restaurar piedras y terrenos en el tablero
        for (const nodeSnap of snapshot.nodes) {
            const boardNode = board.nodes.get(nodeSnap.id);
            if (boardNode) {
                boardNode.stone = nodeSnap.stone ? { ...nodeSnap.stone } : null;
                boardNode.terrain = nodeSnap.terrain;
            }
        }

        this.currentTurn = snapshot.currentTurn;
        this.currentRound = snapshot.currentRound || Math.floor((snapshot.currentTurn - 1) / this.playerCount) + 1;
        this.playerTurnCounts = snapshot.playerTurnCounts ? { ...snapshot.playerTurnCounts } : { 1: 0, 2: 0, 3: 0, 4: 0 };
        this.currentPlayer = snapshot.currentPlayer;
        this.blackCaptures = snapshot.blackCaptures;
        this.whiteCaptures = snapshot.whiteCaptures;
        this.greenCaptures = snapshot.greenCaptures;
        this.purpleCaptures = snapshot.purpleCaptures;
        this.lastMoveNodeId = snapshot.lastMoveNodeId;
        this.consecutivePasses = snapshot.consecutivePasses;
        this.isGameOver = snapshot.isGameOver;
        this.boardHistory = snapshot.boardHistory ? [...snapshot.boardHistory] : [...this.boardHistory];
        this.scoreReport = null;
    }

    passTurn(board?: GraphBoard): boolean {
        if (this.isGameOver) return false;
        
        this.consecutivePasses++;
        this.lastMoveNodeId = null;

        if (this.consecutivePasses >= this.playerCount) {
            this.isGameOver = true;
            return true;
        }

        this.advanceTurn(board);
        return true;
    }

    advanceTurn(board?: GraphBoard) {
        // Reducir duración del escudo divino (3 turnos) para las piedras del jugador actual
        if (board) {
            for (const node of board.nodes.values()) {
                if (node.stone && node.stone.isIndestructible && node.stone.playerId === this.currentPlayer) {
                    if (node.stone.shieldTurnsLeft !== undefined) {
                        node.stone.shieldTurnsLeft--;
                        if (node.stone.shieldTurnsLeft <= 0) {
                            node.stone.isIndestructible = false;
                            node.stone.shieldTurnsLeft = undefined;
                        }
                    }
                }
            }
        }

        // Registrar que el jugador que acaba de actuar completó su turno individual
        this.playerTurnCounts[this.currentPlayer] = (this.playerTurnCounts[this.currentPlayer] || 0) + 1;
        this.currentTurn++;
        
        // Ejecutar eventos pendientes
        const eventsToRun = this.eventQueue.filter(e => e.turnTrigger === this.currentTurn);
        this.eventQueue = this.eventQueue.filter(e => e.turnTrigger !== this.currentTurn);
        
        for (const event of eventsToRun) {
            event.execute(this);
        }

        // Manejar esperas de precarga / postcarga
        if (this.player1WaitTurns > 0) {
            this.player1WaitTurns--;
            if (this.player1WaitTurns === 0) this.player1Status = 'READY';
        }

        if (this.player2WaitTurns > 0) {
            this.player2WaitTurns--;
            if (this.player2WaitTurns === 0) this.player2Status = 'READY';
        }

        // Rotación de jugador (Round-Robin según playerCount):
        const nextPlayer = ((this.currentPlayer % this.playerCount) + 1) as PlayerId;
        if (nextPlayer === 1) {
            this.currentRound++;
        }
        this.currentPlayer = nextPlayer;
        
        // Saltar turno si el siguiente jugador está aturdido/en postcarga (para jugadores 1 y 2)
        if (this.currentPlayer === 1 && this.player1Status !== 'READY') {
            this.advanceTurn();
        } else if (this.currentPlayer === 2 && this.player2Status !== 'READY') {
            this.advanceTurn();
        }
    }
}
