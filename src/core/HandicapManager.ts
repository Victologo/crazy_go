// core/HandicapManager.ts - Gestor Universal Canónico de Piedras de Hándicap (0 a 9)
import type { GraphBoard, BoardNode, PlayerId } from './GraphBoard';
import type { GameState } from './GameState';

export class HandicapManager {
    /**
     * Obtiene la lista de IDs de nodos para colocar K piedras de hándicap (2 a 9)
     */
    public static getHandicapNodeIds(board: GraphBoard, count: number): string[] {
        if (count < 2) return [];
        const k = Math.min(9, Math.floor(count));

        // 1. Detección de tablero cuadrado canónico
        const squareSize = this.detectSquareSize(board);
        if (squareSize) {
            return this.getSquareHandicapPositions(board, squareSize, k);
        }

        // 2. Algoritmo de dispersión y centralidad para grafos asimétricos (triangular, hex, etc.)
        return this.getGraphHandicapPositions(board, k);
    }

    /**
     * Aplica el hándicap al inicio de la partida:
     * - Coloca K piedras negras en el tablero
     * - Cede el primer turno a Blancas (currentPlayer = 2)
     * - Ajusta el Komi a 0.5 canónico para desempate
     */
    public static applyHandicap(
        board: GraphBoard, 
        state: GameState, 
        handicapCount: number, 
        blackPlayerId: PlayerId = 1
    ): string[] {
        if (handicapCount < 2) return [];

        const nodeIds = this.getHandicapNodeIds(board, handicapCount);
        if (nodeIds.length === 0) return [];

        for (const nodeId of nodeIds) {
            const node = board.nodes.get(nodeId);
            if (node && !node.stone) {
                node.stone = {
                    id: `stone_handicap_${nodeId}`,
                    playerId: blackPlayerId,
                    isInvisible: false,
                    isIndestructible: false,
                    isFrozen: false,
                    stoneType: 'single'
                };
            }
        }

        // En Go con Hándicap, Blancas juega siempre el primer turno
        state.currentPlayer = 2;
        state.komi = 0.5;

        // Registrar la configuración inicial en el historial
        state.recordSnapshot(board);

        return nodeIds;
    }

    private static detectSquareSize(board: GraphBoard): number | null {
        const total = board.nodes.size;
        if (total === 25) return 5;
        if (total === 81) return 9;
        if (total === 169) return 13;
        if (total === 361) return 19;
        return null;
    }

    private static getSquareHandicapPositions(board: GraphBoard, size: number, k: number): string[] {
        let starCoords: [number, number][] = [];

        if (size === 19) {
            // Puntos Hoshi canónicos 19x19
            const cMin = 3;
            const cMid = 9;
            const cMax = 15;
            
            const pTopRight: [number, number] = [cMax, cMin];
            const pBottomLeft: [number, number] = [cMin, cMax];
            const pTopLeft: [number, number] = [cMin, cMin];
            const pBottomRight: [number, number] = [cMax, cMax];
            const pTengen: [number, number] = [cMid, cMid];
            const pLeftMid: [number, number] = [cMin, cMid];
            const pRightMid: [number, number] = [cMax, cMid];
            const pTopMid: [number, number] = [cMid, cMin];
            const pBottomMid: [number, number] = [cMid, cMax];

            if (k === 2) starCoords = [pTopRight, pBottomLeft];
            else if (k === 3) starCoords = [pTopRight, pBottomLeft, pTopLeft];
            else if (k === 4) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight];
            else if (k === 5) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pTengen];
            else if (k === 6) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid];
            else if (k === 7) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid, pTengen];
            else if (k === 8) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid, pTopMid, pBottomMid];
            else if (k >= 9) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid, pTopMid, pBottomMid, pTengen];
        } else if (size === 13) {
            const cMin = 3;
            const cMid = 6;
            const cMax = 9;

            const pTopRight: [number, number] = [cMax, cMin];
            const pBottomLeft: [number, number] = [cMin, cMax];
            const pTopLeft: [number, number] = [cMin, cMin];
            const pBottomRight: [number, number] = [cMax, cMax];
            const pTengen: [number, number] = [cMid, cMid];
            const pLeftMid: [number, number] = [cMin, cMid];
            const pRightMid: [number, number] = [cMax, cMid];
            const pTopMid: [number, number] = [cMid, cMin];
            const pBottomMid: [number, number] = [cMid, cMax];

            if (k === 2) starCoords = [pTopRight, pBottomLeft];
            else if (k === 3) starCoords = [pTopRight, pBottomLeft, pTopLeft];
            else if (k === 4) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight];
            else if (k === 5) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pTengen];
            else if (k === 6) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid];
            else if (k === 7) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid, pTengen];
            else if (k === 8) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid, pTopMid, pBottomMid];
            else if (k >= 9) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid, pTopMid, pBottomMid, pTengen];
        } else if (size === 9) {
            const cMin = 2;
            const cMid = 4;
            const cMax = 6;

            const pTopRight: [number, number] = [cMax, cMin];
            const pBottomLeft: [number, number] = [cMin, cMax];
            const pTopLeft: [number, number] = [cMin, cMin];
            const pBottomRight: [number, number] = [cMax, cMax];
            const pTengen: [number, number] = [cMid, cMid];
            const pLeftMid: [number, number] = [cMin, cMid];
            const pRightMid: [number, number] = [cMax, cMid];
            const pTopMid: [number, number] = [cMid, cMin];
            const pBottomMid: [number, number] = [cMid, cMax];

            if (k === 2) starCoords = [pTopRight, pBottomLeft];
            else if (k === 3) starCoords = [pTopRight, pBottomLeft, pTopLeft];
            else if (k === 4) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight];
            else if (k === 5) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pTengen];
            else if (k === 6) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid];
            else if (k === 7) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid, pTengen];
            else if (k === 8) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid, pTopMid, pBottomMid];
            else if (k >= 9) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pLeftMid, pRightMid, pTopMid, pBottomMid, pTengen];
        } else {
            // Tablero 5x5
            const pTopLeft: [number, number] = [1, 1];
            const pTopRight: [number, number] = [3, 1];
            const pBottomLeft: [number, number] = [1, 3];
            const pBottomRight: [number, number] = [3, 3];
            const pTengen: [number, number] = [2, 2];

            if (k === 2) starCoords = [pTopRight, pBottomLeft];
            else if (k === 3) starCoords = [pTopRight, pBottomLeft, pTopLeft];
            else if (k === 4) starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight];
            else starCoords = [pTopLeft, pTopRight, pBottomLeft, pBottomRight, pTengen];
        }

        const validIds: string[] = [];
        for (const [x, y] of starCoords) {
            const id = `${x},${y}`;
            if (board.nodes.has(id)) {
                validIds.push(id);
            }
        }
        return validIds;
    }

    private static getGraphHandicapPositions(board: GraphBoard, k: number): string[] {
        const nodes = Array.from(board.nodes.values()).filter(n => n.terrain !== 'DESTROYED');
        if (nodes.length <= k) return nodes.map(n => n.id);

        // Calcular centro geométrico del grafo
        let sumX = 0, sumY = 0;
        nodes.forEach(n => { sumX += n.x; sumY += n.y; });
        const centerX = sumX / nodes.length;
        const centerY = sumY / nodes.length;

        // Puntuación por grado y equilibrio de cuadrantes
        const scored = nodes.map(n => {
            const distFromCenter = Math.hypot(n.x - centerX, n.y - centerY);
            const degree = n.neighbors.size;
            // Preferir nodos de grado 4 o 3 con distancia equilibrada
            const score = (degree * 10) - Math.abs(distFromCenter - 4);
            return { node: n, score, x: n.x, y: n.y };
        });

        scored.sort((a, b) => b.score - a.score);

        // Seleccionar k nodos manteniendo distancia mínima entre ellos
        const selected: BoardNode[] = [];
        for (const item of scored) {
            if (selected.length >= k) break;
            const tooClose = selected.some(s => Math.hypot(s.x - item.node.x, s.y - item.node.y) < 2.5);
            if (!tooClose) {
                selected.push(item.node);
            }
        }

        // Relleno si no se alcanzaron k debido a distancia estricta
        if (selected.length < k) {
            for (const item of scored) {
                if (selected.length >= k) break;
                if (!selected.includes(item.node)) {
                    selected.push(item.node);
                }
            }
        }

        return selected.map(n => n.id);
    }
}
