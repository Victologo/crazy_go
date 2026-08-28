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

                // Analizar la dificultad y convertirla puramente a "Temperatura" de la Red Neuronal
                let temperature = 0.3; // Default 
                const diffStr = msg.difficulty as string;

                if (diffStr.endsWith('k')) {
                    const k = parseInt(diffStr);
                    // Kyu levels (Beginners): High temperature (randomness, tactical mistakes)
                    if (k >= 30) temperature = 2.0;       // 30 Kyu: Caótico, juega en cualquier parte legal con algo de sentido
                    else if (k >= 20) temperature = 1.5;  // 20 Kyu: Entiende conceptos básicos, pero muy errático
                    else if (k >= 10) temperature = 1.0;  // 10 Kyu: Juega bien, pero comete errores tácticos ocasionales
                    else temperature = 0.8;               // 1 Kyu: Casi experto, ligera duda
                } else if (diffStr.endsWith('d')) {
                    const d = parseInt(diffStr);
                    // Dan levels (Experts): Low temperature (calculado, preciso)
                    if (d <= 3) temperature = 0.5;        // 1d-3d: Muy preciso, pequeña aleatoriedad
                    else if (d <= 6) temperature = 0.2;   // 4d-6d: Letal
                    else temperature = 0;                 // 7d-9d: Argmax puro (la jugada matemáticamente perfecta)
                } else {
                    // Fallbacks para strings viejos (Story mode, Roguelike)
                    if (diffStr === 'easy') temperature = 1.6;
                    else if (diffStr === 'medium') temperature = 1.0;
                    else if (diffStr === 'hard') temperature = 0.4;
                    else if (diffStr === 'dan' || diffStr === 'grandmaster') temperature = 0;
                }

                // Anti-Mirror Go (Mane-go) Symmetry Breaker:
                // Si estamos en Argmax puro, en los primeros 6 turnos el tablero es simétrico.
                // Aplicamos una mínima temperatura (0.03) para forzar aleatoriedad entre
                // probabilidades matemáticamente idénticas (ej. las 4 esquinas).
                if (temperature === 0 && state && ((state.boardHistory && state.boardHistory.length <= 6) || (state.currentTurn && state.currentTurn <= 6))) {
                    temperature = 0.03;
                }

                // SIEMPRE usar la Red Neuronal (CrazyGoNet) para todas las dificultades
                NeuralNetAdapter.evaluate(board, state, msg.aiPlayerId).then((neuralResult) => {
                    if (neuralResult) {
                        let chosenMoveId = neuralResult.bestMoveId;
                        let chosenProb = neuralResult.bestMoveProb;

                        // Apply temperature if needed (Si Temp = 0, nos quedamos con el bestMoveId por defecto)
                        if (temperature > 0 && neuralResult.policyProbabilities) {
                            let total = 0;
                            const legalMoves: {id: string, w: number}[] = [];
                            
                            for (const [id, prob] of neuralResult.policyProbabilities.entries()) {
                                if (id === 'PASS') continue;
                                const node = board!.nodes.get(id);
                                if (node && node.stone === null && node.terrain !== 'DESTROYED' && node.terrain !== 'OBSTACLE') {
                                    const simBoard = GoAI.cloneBoard(board!);
                                    const simState = GoAI.cloneState(state!);
                                    const isLegal = RulesEngine.tryPlaceStone(simBoard, simState, id, msg.aiPlayerId).success;
                                    if (isLegal) {
                                        // Aumentar el peso de jugadas subóptimas basado en la temperatura
                                        const weight = Math.pow(prob, 1 / temperature);
                                        legalMoves.push({ id, w: weight });
                                        total += weight;
                                    }
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

                        // Verificar si pasar turno es mejor (ej. final de partida)
                        const passProb = neuralResult.policyProbabilities?.get('PASS') || 0;
                        if (passProb > 0.15 && temperature === 0) {
                            chosenMoveId = null; 
                        }

                        const response: AIWorkerOutgoingMessage = {
                            type: 'MOVE_RESULT',
                            payload: {
                                nodeId: chosenMoveId !== undefined ? chosenMoveId : null,
                                reason: `Red Neuronal 450k (P=${Math.round(chosenProb * 100)}%, Temp=${temperature})`,
                                score: Math.round(chosenProb * 1000)
                            }
                        };
                        self.postMessage(response);
                    } else {
                        // Fallback extremo si ONNX falla
                        const response: AIWorkerOutgoingMessage = { type: 'MOVE_RESULT', payload: { nodeId: null, reason: "ONNX Error", score: 0 } };
                        self.postMessage(response);
                    }
                }).catch((err) => {
                    console.error("[Worker] ONNX Error:", err);
                    const response: AIWorkerOutgoingMessage = { type: 'MOVE_RESULT', payload: { nodeId: null, reason: "ONNX Fallback", score: 0 } };
                    self.postMessage(response);
                });
                break;
        }
    } catch (err: any) {
        self.postMessage({ type: 'ERROR', message: err.message });
    }
};
