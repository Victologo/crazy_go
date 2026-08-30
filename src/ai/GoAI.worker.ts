import { GraphBoard } from '../core/GraphBoard';
import { GameState } from '../core/GameState';
import { BoardGenerators } from '../graphics/BoardGenerators';
import { RulesEngine } from '../core/RulesEngine';
import { GoAI, type AIMoveChoice, type AIDifficulty } from './GoAI';
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
    | { type: 'EVAL_BOARD'; tempMoves: {nodeId: string, playerId: PlayerId}[] }
    | { 
        type: 'CALCULATE_MOVE'; 
        aiPlayerId: PlayerId; 
        difficulty: AIDifficulty; 
        komi: number; 
        boardSnapshot?: any[];
        currentTurn?: number;
        lastMoveNodeId?: string | null;
      };

// Messages from Worker to UI
export type AIWorkerOutgoingMessage = 
    | { type: 'MOVE_RESULT'; payload: AIMoveChoice }
    | { type: 'EVAL_RESULT'; payload: { winRate: number } }
    | { type: 'ERROR'; message: string };

self.onmessage = (e: MessageEvent<AIWorkerIncomingMessage>) => {
    const msg = e.data;

    try {
        switch (msg.type) {
            case 'INIT_BOARD':
                // Reconstruct GraphBoard and GameState from scratch based on the config
                board = new GraphBoard();

                BoardGenerators.generate(board, msg.config.shape, msg.config.size);
                
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

            case 'EVAL_BOARD': {
                if (!board || !state) throw new Error("Worker NO está inicializado");
                
                // 1. Guardar estado del tablero
                const savedBoard = new Map();
                for (const [id, node] of board.nodes) {
                    savedBoard.set(id, node.stone ? { ...node.stone } : null);
                }

                // 2. Aplicar movimientos temporales (magia / hechizos)
                for (const tempMove of msg.tempMoves) {
                    const node = board.nodes.get(tempMove.nodeId);
                    if (node) {
                        // En lugar de groupId, usamos la interfaz correcta de Crazy Go
                        node.stone = {
                            id: 'temp',
                            playerId: tempMove.playerId,
                            isInvisible: false,
                            isIndestructible: false,
                            isFrozen: false,
                            stoneType: 'single'
                        };
                    }
                }

                // 3. Evaluar
                NeuralNetAdapter.evaluate(board, state, state.currentPlayer)
                    .then(evalResult => {
                        let winRate = 50;
                        if (evalResult) {
                            winRate = evalResult.winRates[state!.currentPlayer] ?? 50;
                        }
                        
                        // 4. Restaurar estado
                        for (const [id, stoneData] of savedBoard) {
                            board!.nodes.get(id)!.stone = stoneData;
                        }

                        self.postMessage({ type: 'EVAL_RESULT', payload: { winRate } });
                    })
                    .catch(err => {
                        console.error('Eval error:', err);
                        
                        // Restaurar por si acaso
                        for (const [id, stoneData] of savedBoard) {
                            board!.nodes.get(id)!.stone = stoneData;
                        }
                        
                        self.postMessage({ type: 'EVAL_RESULT', payload: { winRate: 50 } });
                    });
                
                break;
            }

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
                if (msg.currentTurn !== undefined) state.currentTurn = msg.currentTurn;
                if (msg.lastMoveNodeId !== undefined) state.lastMoveNodeId = msg.lastMoveNodeId;
                state.currentPlayer = msg.aiPlayerId;

                // Analizar la dificultad y convertirla a Temperatura calibrada de la Red Neuronal
                let temperature = 0.25; 
                const diffStr = (msg.difficulty as string || 'dan').toLowerCase().trim();

                if (diffStr.endsWith('k')) {
                    const k = parseInt(diffStr);
                    const clampedK = Math.max(1, Math.min(k, 30));
                    // 30 Kyu -> 0.95 (Alta exploración pero sin suicidio)
                    // 20 Kyu -> 0.75
                    // 10 Kyu -> 0.50
                    // 1 Kyu  -> 0.25
                    if (clampedK >= 20) {
                        temperature = 0.75 + ((clampedK - 20) / 10) * 0.20;
                    } else if (clampedK >= 10) {
                        temperature = 0.50 + ((clampedK - 10) / 10) * 0.25;
                    } else {
                        temperature = 0.25 + ((clampedK - 1) / 9) * 0.25;
                    }
                } else if (diffStr.endsWith('d')) {
                    const d = parseInt(diffStr);
                    const clampedD = Math.max(1, Math.min(d, 10));
                    // 1 Dan -> 0.20
                    // 5 Dan -> 0.10
                    // 9 Dan / 10 Dan -> 0.00 (Argmax puro)
                    if (clampedD >= 9) {
                        temperature = 0.0;
                    } else {
                        temperature = 0.20 * (1 - ((clampedD - 1) / 8));
                    }
                } else {
                    if (diffStr === 'easy') temperature = 0.85;
                    else if (diffStr === 'medium' || diffStr === 'normal') temperature = 0.50;
                    else if (diffStr === 'hard') temperature = 0.25;
                    else if (diffStr === 'dan' || diffStr === 'grandmaster' || diffStr === 'extreme') temperature = 0.0;
                }

                // Anti-Mirror Go (Mane-go) Symmetry Breaker:
                // Si estamos en Argmax puro, en los primeros 6 turnos el tablero es simétrico.
                // Aplicamos una mínima temperatura (0.03) para forzar aleatoriedad entre
                // probabilidades matemáticamente idénticas (ej. las 4 esquinas).
                if (temperature === 0 && state && ((state.boardHistory && state.boardHistory.length <= 6) || (state.currentTurn && state.currentTurn <= 6))) {
                    temperature = 0.03;
                }

                // SIEMPRE usar la Red Neuronal (CrazyGoNet) para todas las dificultades
                console.log("[Worker] Starting NeuralNetAdapter.evaluate for Turn", state.currentTurn, "Difficulty:", diffStr, "Temp:", temperature);
                NeuralNetAdapter.evaluate(board, state, msg.aiPlayerId).then((neuralResult) => {
                    console.log("[Worker] NeuralNetAdapter.evaluate resolved:", neuralResult ? "SUCCESS" : "NULL");
                    if (neuralResult) {
                        let chosenMoveId = neuralResult.bestMoveId;
                        let chosenProb = neuralResult.bestMoveProb;

                        // Apply temperature sampling if needed (Si Temp = 0, nos quedamos con el bestMoveId por defecto)
                        if (temperature > 0 && neuralResult.policyProbabilities) {
                            let total = 0;
                            const candidateMoves: { id: string | null; w: number; prob: number }[] = [];
                            
                            // 1. Validar nodos del tablero
                            for (const [id, prob] of neuralResult.policyProbabilities.entries()) {
                                if (id === 'PASS') continue;
                                const node = board!.nodes.get(id);
                                if (node && node.stone === null && node.terrain !== 'DESTROYED' && node.terrain !== 'OBSTACLE') {
                                    const isLegal = RulesEngine.isMoveLegal(board!, state!, id, msg.aiPlayerId);
                                    const isSelfEye = board!.isTrueEye(id, msg.aiPlayerId);
                                    
                                    // Nunca jugar dentro de un ojo propio cerrado
                                    if (isLegal && !isSelfEye) {
                                        if (prob >= 0.0005) {
                                            const weight = Math.pow(prob, 1 / Math.max(temperature, 0.05));
                                            candidateMoves.push({ id, w: weight, prob });
                                            total += weight;
                                        }
                                    }
                                }
                            }

                            // 2. Incluir PASAR en el pool de decisiones proporcionales
                            const passProb = neuralResult.policyProbabilities.get('PASS') || 0;
                            if (passProb >= 0.005) {
                                const passWeight = Math.pow(passProb, 1 / Math.max(temperature, 0.05));
                                candidateMoves.push({ id: null, w: passWeight, prob: passProb });
                                total += passWeight;
                            }

                            if (total > 0 && candidateMoves.length > 0) {
                                let rand = Math.random() * total;
                                for (const m of candidateMoves) {
                                    rand -= m.w;
                                    if (rand <= 0) {
                                        chosenMoveId = m.id;
                                        chosenProb = m.prob;
                                        break;
                                    }
                                }
                            } else {
                                chosenMoveId = null;
                            }
                        }

                        // Si la probabilidad de pasar es dominante (> 25%) y es mayor que la jugada elegida, pasar
                        const passProb = neuralResult.policyProbabilities?.get('PASS') || 0;
                        if (passProb > 0.25 && (chosenMoveId === null || passProb > chosenProb)) {
                            chosenMoveId = null; 
                        }

                        const response: AIWorkerOutgoingMessage = {
                            type: 'MOVE_RESULT',
                            payload: {
                                nodeId: chosenMoveId !== undefined ? chosenMoveId : null,
                                reason: `Red Neuronal 750k (P=${Math.round(chosenProb * 100)}%, Temp=${temperature.toFixed(2)})`,
                                score: Math.round(chosenProb * 1000),
                                winRates: neuralResult.winRates
                            }
                        };
                        console.log("[Worker] Sending response:", response);
                        self.postMessage(response);
                    } else {
                        // Fallback Heurístico Clásico si el modelo no está disponible o el tablero no es 9x9
                        console.log("[Worker] Falling back to GoAI.getBestMove (neuralResult is null)");
                        const fallbackMove = GoAI.getBestMove(board!, state!, msg.aiPlayerId, msg.difficulty);
                        const response: AIWorkerOutgoingMessage = { type: 'MOVE_RESULT', payload: fallbackMove };
                        self.postMessage(response);
                    }
                }).catch((err) => {
                    console.error("[Worker] ONNX Error (Cayendo a Heurísticas):", err);
                    const fallbackMove = GoAI.getBestMove(board!, state!, msg.aiPlayerId, msg.difficulty);
                    const response: AIWorkerOutgoingMessage = { type: 'MOVE_RESULT', payload: fallbackMove };
                    self.postMessage(response);
                });
                break;
        }
    } catch (err: any) {
        self.postMessage({ type: 'ERROR', message: err.message });
    }
};
