import { GraphBoard, type PlayerId } from './GraphBoard';
import { GameState } from './GameState';
import { GoAI } from '../ai/GoAI';
import { TerritoryScorer } from './TerritoryScorer';
import { NeuralNetAdapter } from '../ai/NeuralNetAdapter';
import { getLanguage } from '../i18n/i18n';

export interface TacticalAnalysis {
    playerWinRates: Record<PlayerId, number>; // 0 a 100
    scoreLead: number;    // Puntos de ventaja (generalmente absoluto entre líder y 2º)
    bestMoveNodeId: string | null;
    tacticalReason: string;
    continuation: Array<{ nodeId: string; playerId: PlayerId; step: number }>;
}

export class AnalysisEngine {
    private static cachedNeuralWinRates: { turn: number; winRates: Record<PlayerId, number> } | null = null;

    private static isEvaluatingWinRate: boolean = false;

    /**
     * Actualiza el Winrate neuronal en background
     */
    public static async updateNeuralWinRate(board: GraphBoard, state: GameState): Promise<void> {
        if (this.isEvaluatingWinRate) return;
        
        // Si ya tenemos el winrate de este turno, no recalcular
        if (this.cachedNeuralWinRates && this.cachedNeuralWinRates.turn === state.currentTurn) return;

        this.isEvaluatingWinRate = true;
        try {
            const evalResult = await NeuralNetAdapter.evaluate(board, state, state.currentPlayer);
            if (evalResult && evalResult.winRates) {
                this.cachedNeuralWinRates = {
                    turn: state.currentTurn,
                    winRates: evalResult.winRates
                };
            }
        } finally {
            this.isEvaluatingWinRate = false;
        }
    }

    /**
     * Calcula la probabilidad de victoria en tiempo real en base a la Red Neuronal (o fallback Softmax)
     */
    public static calculateWinRate(board: GraphBoard, state: GameState): { playerWinRates: Record<PlayerId, number>; scoreLead: number } {
        // Disparar evaluación neuronal asíncrona si está disponible
        this.updateNeuralWinRate(board, state).catch(() => {});

        // Si tenemos winrates neuronales para el turno actual, usarlos directamente
        if (this.cachedNeuralWinRates && this.cachedNeuralWinRates.turn === state.currentTurn) {
            const report = TerritoryScorer.calculateScore(board, state);
            return {
                playerWinRates: { ...this.cachedNeuralWinRates.winRates },
                scoreLead: report.margin
            };
        }
        const report = TerritoryScorer.calculateScore(board, state);
        const playerScores = report.playerScores;
        const totalNodes = board.nodes.size;
        const scale = totalNodes > 200 ? 1.0 : (totalNodes > 100 ? 1.2 : 1.5);
        
        // Obtenemos estadísticas adicionales (piedras vivas, libertades, etc.)
        const stones: Record<PlayerId, number> = {} as Record<PlayerId, number>;
        const liberties: Record<PlayerId, number> = {} as Record<PlayerId, number>;
        const livingGroups: Record<PlayerId, number> = {} as Record<PlayerId, number>;
        const captures: Record<PlayerId, number> = {} as Record<PlayerId, number>;
        
        for (let i = 1; i <= state.playerCount; i++) {
            const p = i as PlayerId;
            stones[p] = 0;
            liberties[p] = 0;
            livingGroups[p] = board.getLivingGroupsInfo(p).length;
            
            // Obtener capturas del estado (multi-jugador)
            if (p === 1) captures[p] = state.blackCaptures;
            else if (p === 2) captures[p] = state.whiteCaptures;
            else if (p === 3) captures[p] = (state as any).greenCaptures || 0;
            else if (p === 4) captures[p] = (state as any).purpleCaptures || 0;
        }

        const visitedChains = new Set<string>();
        for (const [nodeId, node] of board.nodes.entries()) {
            if (!node.stone) continue;
            const p = node.stone.playerId;
            stones[p] = (stones[p] || 0) + 1;
            
            if (!visitedChains.has(nodeId)) {
                const chain = board.getChain(nodeId);
                chain.forEach(id => visitedChains.add(id));
                const libs = board.getLiberties(nodeId).size;
                liberties[p] = (liberties[p] || 0) + libs;
            }
        }

        // Calcula un "Score Táctico" compuesto por jugador (Logit)
        const tacticalScores: Record<PlayerId, number> = {} as Record<PlayerId, number>;
        let maxScore = -Infinity;
        let secondMaxScore = -Infinity;

        // Calculate max komi for initiative compensation
        let maxKomi = 0;
        for (let i = 1; i <= state.playerCount; i++) {
            const komi = playerScores[i as PlayerId]?.komi || 0;
            if (komi > maxKomi) maxKomi = komi;
        }
        
        // Decay the initiative bonus as the board fills up (roughly 0 by mid-game)
        const decay = Math.max(0, 1 - (state.currentTurn - 1) / (totalNodes * 0.4));

        for (let i = 1; i <= state.playerCount; i++) {
            const p = i as PlayerId;
            const baseTotal = playerScores[p]?.total || 0; // Total incluye komi y capturas base
            const pKomi = playerScores[p]?.komi || 0;
            
            const pStones = stones[p] || 0;
            const libsPerStone = pStones > 0 ? (liberties[p] || 0) / pStones : 0;
            
            // Initiative bonus acts as 'virtual komi' for players who go first
            const initiativeBonus = (maxKomi - pKomi) * decay;

            // Score táctico = Territorio/Komi + (Piedras * 0.2) + (Libertades por piedra * 3 * 0.2) + (Grupos vivos * 4 * 0.1) + Initiative
            const tScore = (baseTotal + initiativeBonus) * 0.50 +
                           (pStones * scale * 0.20) +
                           (libsPerStone * 3 * 0.20) +
                           (livingGroups[p] * 4 * 0.10);
            
            tacticalScores[p] = tScore;

            if (baseTotal > maxScore) {
                secondMaxScore = maxScore;
                maxScore = baseTotal;
            } else if (baseTotal > secondMaxScore) {
                secondMaxScore = baseTotal;
            }
        }

        // Softmax para obtener Win Rates (%)
        // Ajustamos la temperatura basándonos en el tamaño del tablero.
        // Valores más bajos (más cercanos a 1) = más sensibilidad a la diferencia de puntos (estilo KataGo)
        const temperature = totalNodes > 200 ? 5 : (totalNodes > 100 ? 3 : 1.5);
        let expSum = 0;
        const exps: Record<PlayerId, number> = {} as Record<PlayerId, number>;
        
        // Obtenemos el logit máximo para evitar overflow numérico
        const maxLogit = Math.max(...Object.values(tacticalScores));

        for (let i = 1; i <= state.playerCount; i++) {
            const p = i as PlayerId;
            const val = Math.exp((tacticalScores[p] - maxLogit) / temperature);
            exps[p] = val;
            expSum += val;
        }

        const playerWinRates: Record<PlayerId, number> = {} as Record<PlayerId, number>;
        for (let i = 1; i <= state.playerCount; i++) {
            const p = i as PlayerId;
            let rawPct = (exps[p] / expSum) * 100;
            // En aperturas (primeros 8 turnos en 2P), suavizar para evitar 99%/1% artificiales por recuento en tablero casi vacío
            if (state.playerCount === 2 && state.currentTurn <= 8) {
                const alpha = Math.min(state.currentTurn / 8.0, 1.0);
                const prior = p === 1 ? 49 : 51;
                rawPct = (1 - alpha) * prior + alpha * rawPct;
            }
            playerWinRates[p] = Math.round(rawPct);
        }
        
        // Ajustar para que la suma sea exactamente 100
        let currentSum = Object.values(playerWinRates).reduce((a, b) => a + b, 0);
        if (currentSum !== 100 && state.playerCount > 0) {
            let maxP = 1 as PlayerId;
            for (let i = 2; i <= state.playerCount; i++) {
                if (playerWinRates[i as PlayerId] > playerWinRates[maxP]) maxP = i as PlayerId;
            }
            playerWinRates[maxP] += (100 - currentSum);
        }

        const lead = Math.max(0, maxScore - (secondMaxScore === -Infinity ? 0 : secondMaxScore));

        return {
            playerWinRates,
            scoreLead: Math.round(lead * 10) / 10
        };
    }

    /**
     * Obtiene el análisis completo: Mejor Jugada, Justificación Táctica y Proyección Astral (Secuencia 1-2-3)
     */
    public static analyzePosition(board: GraphBoard, state: GameState, activePlayerId: PlayerId): TacticalAnalysis {
        const { playerWinRates, scoreLead } = this.calculateWinRate(board, state);
        const isEn = getLanguage() === 'en';

        // 1. Obtener la jugada maestra mediante el motor de alta precisión Dan
        const bestMove = GoAI.getBestMove(board, state, activePlayerId, 'dan');
        const bestNodeId = bestMove.nodeId;

        // 2. Simulación de la Secuencia de Continuación (3 pasos)
        const continuation: Array<{ nodeId: string; playerId: PlayerId; step: number }> = [];

        if (bestNodeId) {
            continuation.push({
                nodeId: bestNodeId,
                playerId: activePlayerId,
                step: 1
            });

            // Simular respuesta rival
            const simState = new GameState(state.komi, state.playerCount);
            simState.currentPlayer = activePlayerId;

            const node1 = board.nodes.get(bestNodeId);
            const originalStone1 = node1 ? node1.stone : null;

            if (node1) {
                node1.stone = {
                    id: `sim_${bestNodeId}`,
                    playerId: activePlayerId,
                    isInvisible: false,
                    isIndestructible: false,
                    isFrozen: false,
                    stoneType: 'single'
                };
                const opponentId = ((activePlayerId % state.playerCount) + 1) as PlayerId;
                simState.currentPlayer = opponentId;

                // Predecir jugada 2 (Rival)
                const move2 = GoAI.getBestMove(board, simState, opponentId, 'dan');
                if (move2.nodeId) {
                    continuation.push({
                        nodeId: move2.nodeId,
                        playerId: opponentId,
                        step: 2
                    });

                    const node2 = board.nodes.get(move2.nodeId);
                    const originalStone2 = node2 ? node2.stone : null;
                    if (node2) {
                        node2.stone = {
                            id: `sim_${move2.nodeId}`,
                            playerId: opponentId,
                            isInvisible: false,
                            isIndestructible: false,
                            isFrozen: false,
                            stoneType: 'single'
                        };
                        simState.currentPlayer = activePlayerId;

                        // Predecir jugada 3 (Contraataque aliado)
                        const move3 = GoAI.getBestMove(board, simState, activePlayerId, 'dan');
                        if (move3.nodeId) {
                            continuation.push({
                                nodeId: move3.nodeId,
                                playerId: activePlayerId,
                                step: 3
                            });
                        }
                        node2.stone = originalStone2;
                    }
                }
                node1.stone = originalStone1;
            }
        }

        const reason = bestMove.reason || (isEn ? "Optimal tactical balance point." : "Punto de equilibrio táctico óptimo.");

        return {
            playerWinRates,
            scoreLead,
            bestMoveNodeId: bestNodeId,
            tacticalReason: reason,
            continuation
        };
    }
}
