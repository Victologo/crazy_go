// core/AnalysisEngine.ts - Motor de Análisis Táctico de Go (Ojo del Maestro, Proyección Astral y Win Rate)
import { GraphBoard, type PlayerId } from './GraphBoard';
import { GameState } from './GameState';
import { GoAI } from '../ai/GoAI';
import { TerritoryScorer } from './TerritoryScorer';
import { getLanguage } from '../i18n/i18n';

export interface TacticalAnalysis {
    blackWinRate: number; // 0 a 100
    whiteWinRate: number; // 0 a 100
    scoreLead: number;    // Puntos de ventaja para Negras (positivo) o Blancas (negativo)
    bestMoveNodeId: string | null;
    tacticalReason: string;
    continuation: Array<{ nodeId: string; playerId: PlayerId; step: number }>;
}

export class AnalysisEngine {
    /**
     * Calcula la probabilidad de victoria en tiempo real en base al balance territorial, prisioneros y komi
     */
    public static calculateWinRate(board: GraphBoard, state: GameState): { blackWinRate: number; whiteWinRate: number; scoreLead: number } {
        // ── Factor 1: Territorio territorial actual (estimación japonesa provisional) ──
        const report = TerritoryScorer.calculateScore(board, state);
        const blackTerr = report.blackTerritory;
        const whiteTerr = report.whiteTerritory;
        const terrLead = blackTerr - whiteTerr; // positivo = negras mejor

        // ── Factor 2: Ventaja en número de piedras en juego ──
        let blackStones = 0;
        let whiteStones = 0;
        let blackLiberties = 0;
        let whiteLiberties = 0;

        for (const [, node] of board.nodes.entries()) {
            if (!node.stone) continue;
            if (node.stone.playerId === 1) blackStones++;
            else if (node.stone.playerId === 2) whiteStones++;
        }

        // ── Factor 3: Ventaja en libertades totales (indicador de vitalidad táctica) ──
        const visitedChains = new Set<string>();
        for (const [nodeId, node] of board.nodes.entries()) {
            if (!node.stone) continue;
            if (visitedChains.has(nodeId)) continue;
            const chain = board.getChain(nodeId);
            chain.forEach(id => visitedChains.add(id));
            const libs = board.getLiberties(nodeId).size;
            if (node.stone.playerId === 1) blackLiberties += libs;
            else if (node.stone.playerId === 2) whiteLiberties += libs;
        }
        // Normalizar por número de grupos
        const blackLibsPerStone = blackStones > 0 ? blackLiberties / blackStones : 0;
        const whiteLibsPerStone = whiteStones > 0 ? whiteLiberties / whiteStones : 0;
        const libertyLead = (blackLibsPerStone - whiteLibsPerStone) * 3; // escalar a escala de puntos

        // ── Factor 4: Grupos vivos (Benson) ──
        const blackLivingGroups = board.getLivingGroupsInfo(1 as PlayerId);
        const whiteLivingGroups = board.getLivingGroupsInfo(2 as PlayerId);
        const livingGroupLead = (blackLivingGroups.length - whiteLivingGroups.length) * 4;

        // ── Factor 5: Capturas ──
        const captureLead = state.blackCaptures - state.whiteCaptures;

        // ── Factor 6: Diferencia de piedras en tablero ──
        const stoneLead = blackStones - whiteStones;

        // ── Evaluación compuesta ponderada ──
        // Territorio: 40% | Piedras: 20% | Libertades: 20% | Grupos vivos: 10% | Capturas: 10%
        // Escalar capturas y stones a la misma magnitud que territorio
        const totalNodes = board.nodes.size;
        const scale = totalNodes > 200 ? 1.0 : (totalNodes > 100 ? 1.2 : 1.5);

        const compositeLead =
            terrLead * 0.40 +
            stoneLead * scale * 0.20 +
            libertyLead * 0.20 +
            livingGroupLead * 0.10 +
            captureLead * scale * 0.10;

        // Compensar el komi para las blancas (que ya estaba en territorio)
        const komaAdjusted = compositeLead;

        // Función sigmoide logística
        const steepness = totalNodes > 200 ? 0.14 : (totalNodes > 100 ? 0.22 : 0.32);
        const rawWr = 100 / (1 + Math.exp(-steepness * komaAdjusted));
        const blackWinRate = Math.round(Math.max(3, Math.min(97, rawWr)));
        const whiteWinRate = 100 - blackWinRate;

        // El scoreLead lo seguimos reportando en puntos de territorio+capturas (para UI)
        const lead = (report.blackTotal || (blackTerr + state.blackCaptures)) -
                     (report.whiteTotal || (whiteTerr + state.whiteCaptures + report.komi));

        return {
            blackWinRate,
            whiteWinRate,
            scoreLead: Math.round(lead * 10) / 10
        };
    }

    /**
     * Obtiene el análisis completo: Mejor Jugada, Justificación Táctica y Proyección Astral (Secuencia 1-2-3)
     */
    public static analyzePosition(board: GraphBoard, state: GameState, activePlayerId: PlayerId): TacticalAnalysis {
        const { blackWinRate, whiteWinRate, scoreLead } = this.calculateWinRate(board, state);
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
                const opponentId = (activePlayerId === 1 ? 2 : 1) as PlayerId;
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
            blackWinRate,
            whiteWinRate,
            scoreLead,
            bestMoveNodeId: bestNodeId,
            tacticalReason: reason,
            continuation
        };
    }
}
