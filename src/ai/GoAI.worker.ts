import { GraphBoard } from '../core/GraphBoard';
import { GameState } from '../core/GameState';
import { BoardGenerators } from '../graphics/BoardGenerators';
import { RulesEngine } from '../core/RulesEngine';
import { GoAI, type AIDifficulty, type AIMoveChoice } from './GoAI';
import { NeuralNetAdapter } from './NeuralNetAdapter';
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

                // Parse Kyu/Dan string
                let isNeural = false;
                let isEasy = false;
                let isMedium = false;
                let isHard = false;
                let temperature = 0; // 0 = argmax

                const diffStr = msg.difficulty as string;
                if (diffStr.endsWith('k')) {
                    const k = parseInt(diffStr);
                    if (k >= 20) {
                        isEasy = true;
                    } else if (k >= 10) {
                        isMedium = true;
                    } else {
                        isHard = true;
                    }
                } else if (diffStr.endsWith('d')) {
                    isNeural = true;
                    const d = parseInt(diffStr);
                    // 1d to 9d
                    if (d <= 3) {
                        temperature = 0.6; // High randomness
                    } else if (d <= 6) {
                        temperature = 0.3; // Low randomness
                    } else {
                        temperature = 0; // Argmax (Max strength)
                    }
                } else {
                    // Fallbacks for old strings
                    if (diffStr === 'easy') isEasy = true;
                    else if (diffStr === 'medium') isMedium = true;
                    else if (diffStr === 'hard') isHard = true;
                    else if (diffStr === 'dan') { isNeural = true; temperature = 0.1; }
                }

                const heuristicDiff = isEasy ? 'easy' : (isMedium ? 'medium' : (isHard ? 'hard' : 'dan'));

                if (isNeural) {
                    NeuralNetAdapter.evaluate(board, state, msg.aiPlayerId).then((neuralResult) => {
                        if (neuralResult) {
                            let chosenMoveId = neuralResult.bestMoveId;
                            let chosenProb = neuralResult.bestMoveProb;

                            // Apply temperature if needed
                            if (temperature > 0 && neuralResult.policyProbabilities) {
                                let total = 0;
                                const legalMoves: {id: string, w: number}[] = [];
                                
                                for (const [id, prob] of neuralResult.policyProbabilities.entries()) {
                                    if (id === 'PASS') continue;
                                    const node = board!.nodes.get(id);
                                    if (node && node.stone === null && node.terrain !== 'DESTROYED' && node.terrain !== 'OBSTACLE') {
                                        // Aumentar el peso de jugadas subóptimas basado en la temperatura
                                        const weight = Math.pow(prob, 1 / temperature);
                                        legalMoves.push({ id, w: weight });
                                        total += weight;
                                    }
                                }

                                if (total > 0 && legalMoves.length > 0) {
                                    let rand = Math.random() * total;
                                    for (const m of legalMoves) {
                                        rand -= m.w;
                                        if (rand <= 0) {
                                            chosenMoveId = m.id;
                                            chosenProb = neuralResult.policyProbabilities.get(m.id) || 0;
                                            break;
                                        }
                                    }
                                }
                            }

                            const response: AIWorkerOutgoingMessage = {
                                type: 'MOVE_RESULT',
                                payload: {
                                    nodeId: chosenMoveId !== undefined ? chosenMoveId : null,
                                    reason: `CrazyGoNet Neural (P=${Math.round(chosenProb * 100)}%, Win=${neuralResult.winRates[msg.aiPlayerId]}%, Temp=${temperature})`,
                                    score: Math.round(chosenProb * 1000)
                                }
                            };
                            self.postMessage(response);
                        } else {
                            // Fallback if neural net fails
                            const bestMove = GoAI.getBestMove(board!, state!, msg.aiPlayerId, heuristicDiff);
                            const response: AIWorkerOutgoingMessage = { type: 'MOVE_RESULT', payload: bestMove };
                            self.postMessage(response);
                        }
                    }).catch(() => {
                        const bestMove = GoAI.getBestMove(board!, state!, msg.aiPlayerId, heuristicDiff);
                        const response: AIWorkerOutgoingMessage = { type: 'MOVE_RESULT', payload: bestMove };
                        self.postMessage(response);
                    });
                } else {
                    // Use standard Heuristics/Minimax for Kyu levels
                    const bestMove = GoAI.getBestMove(board!, state!, msg.aiPlayerId, heuristicDiff);
                    const response: AIWorkerOutgoingMessage = { type: 'MOVE_RESULT', payload: bestMove };
                    self.postMessage(response);
                }
                break;
        }
    } catch (err: any) {
        self.postMessage({ type: 'ERROR', message: err.message });
    }
};
