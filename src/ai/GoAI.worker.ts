import { GraphBoard } from '../core/GraphBoard';
import { GameState } from '../core/GameState';
import { BoardGenerators } from '../graphics/BoardGenerators';
import { RulesEngine } from '../core/RulesEngine';
import { GoAI, type AIDifficulty, type AIMoveChoice } from './GoAI';
import type { PlayerId } from '../core/GraphBoard';

// Internal mirror state
let board: GraphBoard | null = null;
let state: GameState | null = null;

// Messages from UI to Worker
export type AIWorkerIncomingMessage = 
    | { type: 'INIT_BOARD'; config: any }
    | { type: 'SYNC_MOVE'; nodeId: string; playerId: PlayerId }
    | { type: 'SYNC_UNDO' }
    | { type: 'SYNC_PASS' }
    | { type: 'CALCULATE_MOVE'; aiPlayerId: PlayerId; difficulty: AIDifficulty; komi: number; boardSnapshot?: any[] };

// Messages from Worker to UI
export type AIWorkerOutgoingMessage = 
    | { type: 'MOVE_RESULT'; payload: AIMoveChoice }
    | { type: 'ERROR'; message: string };

self.onmessage = (e: MessageEvent<AIWorkerIncomingMessage>) => {
    const msg = e.data;

    try {
        switch (msg.type) {
            case 'INIT_BOARD':
                // Reconstruct GraphBoard and GameState from scratch based on the config
                board = new GraphBoard();
                const seedToUse = msg.config.seed || Math.floor(Math.random() * 999999);
                BoardGenerators.generate(board, msg.config.shape, msg.config.size, seedToUse);
                
                state = new GameState(msg.config.komi, msg.config.playerCount);
                break;

            case 'SYNC_MOVE':
                if (!board || !state) throw new Error("Worker NO está inicializado");
                const result = RulesEngine.tryPlaceStone(board, state, msg.nodeId, msg.playerId);
                if (result.success) {
                    state.advanceTurn();
                } else {
                    console.warn("[Worker] SYNC_MOVE falló (movimiento ilegal o ko)", msg);
                }
                break;

            case 'SYNC_UNDO':
                if (!board || !state) throw new Error("Worker NO está inicializado");
                state.undo(board);
                break;
                
            case 'SYNC_PASS':
                if (!board || !state) throw new Error("Worker NO está inicializado");
                state.consecutivePasses++;
                state.advanceTurn();
                break;

            case 'CALCULATE_MOVE':
                if (!board || !state) throw new Error("Worker NO está inicializado");
                
                // Sincronizar estado exacto del tablero (resuelve desincronizaciones por Poliminós y Habilidades)
                if (msg.boardSnapshot) {
                    for (const nodeSnap of msg.boardSnapshot) {
                        const boardNode = board.nodes.get(nodeSnap.id);
                        if (boardNode) {
                            boardNode.stone = nodeSnap.stone ? { ...nodeSnap.stone } : null;
                            boardNode.terrain = nodeSnap.terrain;
                        }
                    }
                }

                // Update komi in case it changed (handicap, items, etc.)
                state.komi = msg.komi;
                
                const bestMove = GoAI.getBestMove(board, state, msg.aiPlayerId, msg.difficulty);
                
                const response: AIWorkerOutgoingMessage = { type: 'MOVE_RESULT', payload: bestMove };
                self.postMessage(response);
                break;
        }
    } catch (err: any) {
        self.postMessage({ type: 'ERROR', message: err.message });
    }
};
