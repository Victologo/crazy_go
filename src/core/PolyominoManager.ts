// PolyominoManager.ts - Gestor de Fichas Poliminó Tácticas (Germinante 1x1, Dominó 2x1 y Monolito 2x2)
import { GraphBoard, type PlayerId } from './GraphBoard';
import { GameState } from './GameState';
import { RulesEngine } from './RulesEngine';
import { SoundFX } from '../audio/SoundFX';
import type { PolyominoType, PolyominoOrientation, PolyominoCard } from '../types';
import { RoguelikeRunManager } from './RoguelikeRunManager';

export class PolyominoManager {
    public static activePolyomino: PolyominoType | null = null;
    public static orientation: PolyominoOrientation = 'horizontal';

    // Inventario de fichas poliminó disponibles en la partida
    public static polyominoCards: Map<PolyominoType, PolyominoCard> = new Map([
        [
            'sprouting',
            {
                id: 'sprouting',
                name: 'Sprouting Stone',
                icon: '🌿',
                description: 'Every 2 personal turns, an allied stone automatically sprouts in an adjacent empty intersection.',
                sizeLabel: '1x1',
                usesLeft: 0
            }
        ],
        [
            'domino',
            {
                id: 'domino',
                name: 'Duplicity Stone',
                icon: '🀄',
                description: 'Interconnected 2-stone block (2x1). Can be rotated horizontally or vertically with [R].',
                sizeLabel: '2x1',
                usesLeft: 0,
                orientation: 'horizontal'
            }
        ],
        [
            'monolith',
            {
                id: 'monolith',
                name: 'Monolith Stone',
                icon: '🧱',
                description: 'Colossal 4-stone block (2x2). Occupies 4 adjacent intersections forming a solid defensive square.',
                sizeLabel: '2x2',
                usesLeft: 0
            }
        ]
    ]);

    // Inventarios individuales por jugador (1 a 4)
    public static playerInventories: Map<PlayerId, Map<PolyominoType, number>> = new Map();

    public static resetForMatch(isRoguelite: boolean = false, config?: any) {
        this.activePolyomino = null;
        this.orientation = 'horizontal';
        this.playerInventories.clear();

        const special = config?.specialStones;
        const playerCount = config?.playerCount || 2;
        const humanColor = config?.humanColor || 1;
        const gameMode = config?.gameMode || '1via';

        for (let p = 1; p <= playerCount; p++) {
            const isHuman = gameMode === '1v1' || p === humanColor;
            const inv = new Map<PolyominoType, number>();

            if (isRoguelite) {
                if (RoguelikeRunManager.isRunActive) {
                    if (isHuman) {
                        inv.set('sprouting', RoguelikeRunManager.polyominoes.sprouting || 0);
                        inv.set('domino', RoguelikeRunManager.polyominoes.domino || 0);
                        inv.set('monolith', RoguelikeRunManager.polyominoes.monolith || 0);
                    } else {
                        inv.set('sprouting', 0);
                        inv.set('domino', 0);
                        inv.set('monolith', 0);
                    }
                } else {
                    inv.set('sprouting', 0);
                    inv.set('domino', 0);
                    inv.set('monolith', 0);
                }
            } else if (special && special.enabled) {
                if (isHuman) {
                    inv.set('sprouting', special.playerSprouting ?? 0);
                    inv.set('domino', special.playerDomino ?? 0);
                    inv.set('monolith', special.playerMonolith ?? 0);
                } else {
                    if (special.aiEnabled) {
                        inv.set('sprouting', special.aiSprouting ?? 0);
                        inv.set('domino', special.aiDomino ?? 0);
                        inv.set('monolith', special.aiMonolith ?? 0);
                    } else {
                        inv.set('sprouting', 0);
                        inv.set('domino', 0);
                        inv.set('monolith', 0);
                    }
                }
            } else {
                // Por defecto en Modo Libre: 0 piedras especiales (Go canónico puro)
                inv.set('sprouting', 0);
                inv.set('domino', 0);
                inv.set('monolith', 0);
            }
            this.playerInventories.set(p as PlayerId, inv);
        }

        this.syncCardsWithInventory((humanColor as PlayerId) || 1);
    }

    public static syncCardsWithInventory(playerId: PlayerId) {
        const inv = this.playerInventories.get(playerId);
        for (const [id, card] of this.polyominoCards.entries()) {
            card.usesLeft = inv?.get(id) ?? 0;
            card.orientation = 'horizontal';
        }
    }

    public static hasAnyAvailablePolyominoes(playerId: PlayerId): boolean {
        const inv = this.playerInventories.get(playerId);
        if (!inv) return false;
        return (inv.get('sprouting') || 0) > 0 || (inv.get('domino') || 0) > 0 || (inv.get('monolith') || 0) > 0;
    }

    public static selectPolyomino(type: PolyominoType | null) {
        if (this.activePolyomino === type) {
            this.activePolyomino = null;
        } else {
            this.activePolyomino = type;
        }
    }

    /**
     * Alterna la rotación del Dominó 2x1 entre Horizontal y Vertical
     */
    public static toggleRotation(): PolyominoOrientation {
        this.orientation = this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
        const dominoCard = this.polyominoCards.get('domino');
        if (dominoCard) {
            dominoCard.orientation = this.orientation;
        }
        SoundFX.playPlaceStone();
        return this.orientation;
    }

    /**
     * Calcula los IDs de los nodos objetivo para el poliminó a partir de una intersección base
     */
    public static getPolyominoTargetNodes(
        board: GraphBoard, 
        baseNodeId: string, 
        polyType: PolyominoType, 
        orientation: PolyominoOrientation = this.orientation
    ): string[] {
        const baseNode = board.nodes.get(baseNodeId);
        if (!baseNode) return [];

        if (polyType === 'single' || polyType === 'sprouting') {
            return [baseNodeId];
        }

        // Caso cuadrículas estándar / erosionadas / islas con formato de coordenadas "col,row"
        if (baseNodeId.includes(',')) {
            const [c, r] = baseNodeId.split(',').map(Number);
            if (isNaN(c) || isNaN(r)) return [baseNodeId];

            if (polyType === 'domino') {
                const secondId = orientation === 'horizontal' ? `${c + 1},${r}` : `${c},${r + 1}`;
                return [baseNodeId, secondId];
            }

            if (polyType === 'monolith') {
                return [
                    `${c},${r}`,
                    `${c + 1},${r}`,
                    `${c},${r + 1}`,
                    `${c + 1},${r + 1}`
                ];
            }
        }

        // Caso no-euclidiano o mallas triangulares / hexagonales:
        // Buscar vecinos geométricos adyacentes
        if (polyType === 'domino') {
            const neighbors = Array.from(baseNode.neighbors).map(nid => board.nodes.get(nid)!).filter(Boolean);
            if (neighbors.length === 0) return [baseNodeId];

            if (orientation === 'horizontal') {
                // Preferir vecino a la derecha (dx > 0)
                const rightNeighbor = neighbors.find(n => n.x > baseNode.x + 5);
                return [baseNodeId, rightNeighbor ? rightNeighbor.id : neighbors[0].id];
            } else {
                // Preferir vecino hacia abajo (dy > 0)
                const downNeighbor = neighbors.find(n => n.y > baseNode.y + 5);
                return [baseNodeId, downNeighbor ? downNeighbor.id : neighbors[0].id];
            }
        }

        if (polyType === 'monolith') {
            const neighbors = Array.from(baseNode.neighbors);
            const cluster = [baseNodeId];
            for (const nid of neighbors) {
                if (cluster.length < 4) cluster.push(nid);
            }
            return cluster;
        }

        return [baseNodeId];
    }

    /**
     * Valida si un conjunto de nodos es apto para colocar el poliminó
     */
    public static isValidPolyominoPlacement(board: GraphBoard, targetNodeIds: string[]): boolean {
        if (targetNodeIds.length === 0) return false;
        
        for (const nid of targetNodeIds) {
            const node = board.nodes.get(nid);
            if (!node) return false;
            if (node.stone !== null) return false;
            if (node.terrain === 'DESTROYED' || node.terrain === 'OBSTACLE') return false;
        }
        return true;
    }

    /**
     * Ejecuta la colocación de la ficha poliminó activa
     */
    public static placePolyomino(
        board: GraphBoard,
        state: GameState,
        baseNodeId: string,
        playerId: PlayerId,
        onSuccess: (msg: string) => void,
        onError: (msg: string) => void
    ): boolean {
        const polyType = this.activePolyomino;
        if (!polyType || polyType === 'single') return false;

        const card = this.polyominoCards.get(polyType);
        if (!card || card.usesLeft <= 0) {
            onError(`No remaining ${card?.name || 'stones of this type'}!`);
            SoundFX.playIllegal();
            return false;
        }

        const targetNodeIds = this.getPolyominoTargetNodes(board, baseNodeId, polyType, this.orientation);

        if (!this.isValidPolyominoPlacement(board, targetNodeIds)) {
            onError(`Insufficient space or occupied intersection for ${card.name}!`);
            SoundFX.playIllegal();
            return false;
        }

        let result;
        if (polyType === 'sprouting') {
            const currentPersonalTurn = state.getPlayerTurnCount(playerId);
            result = RulesEngine.tryPlaceStone(board, state, baseNodeId, playerId, 'sprouting', currentPersonalTurn);
        } else {
            result = RulesEngine.tryPlaceMultiStones(board, state, targetNodeIds, playerId, polyType as 'domino' | 'monolith');
        }

        if (!result.success) {
            let msg = 'Illegal polyomino stone move.';
            if (result.errorReason === 'SUICIDE') msg = 'Illegal move: Suicide of the polyomino stone!';
            else if (result.errorReason === 'OCCUPIED') msg = 'One of the required intersections is already occupied!';
            else if (result.errorReason === 'INVALID_TERRAIN') msg = 'The piece exceeds the board boundaries!';
            onError(msg);
            SoundFX.playIllegal();
            return false;
        }

        const inv = this.playerInventories.get(playerId);
        if (inv) {
            const current = inv.get(polyType) || 0;
            const nextVal = Math.max(0, current - 1);
            inv.set(polyType, nextVal);

            if (RoguelikeRunManager.isRunActive && playerId === 1) {
                if (polyType === 'sprouting') RoguelikeRunManager.polyominoes.sprouting = nextVal;
                if (polyType === 'domino') RoguelikeRunManager.polyominoes.domino = nextVal;
                if (polyType === 'monolith') RoguelikeRunManager.polyominoes.monolith = nextVal;
                RoguelikeRunManager.saveToLocalStorage();
            }
        }
        this.syncCardsWithInventory(playerId);
        this.activePolyomino = null;

        if (result.capturedCount > 0) {
            SoundFX.playCapture();
            onSuccess(`${card.name} placed successfully! Captured ${result.capturedCount} enemy stones.`);
        } else {
            SoundFX.playPlaceStone();
            onSuccess(`${card.name} deployed onto the Goban!`);
        }

        return true;
    }

    /**
     * Procesa la brotación de las Piedras Germinantes (1x1) al finalizar un turno personal
     * Brota cada 2 turnos personales (2, 4, 6, 8...) en una intersección vecina vacía
     */
    public static processSproutingStones(
        board: GraphBoard,
        state: GameState,
        playerId: PlayerId,
        onSprout?: (nodeId: string) => void
    ): number {
        const personalTurn = state.getPlayerTurnCount(playerId);
        // Solo brota en turnos personales pares (cada 2 turnos)
        if (personalTurn === 0 || personalTurn % 2 !== 0) {
            return 0;
        }

        let sproutedCount = 0;
        const sproutingNodes: string[] = [];

        for (const [nodeId, node] of board.nodes.entries()) {
            if (node.stone && node.stone.playerId === playerId && node.stone.stoneType === 'sprouting') {
                sproutingNodes.push(nodeId);
            }
        }

        for (const parentId of sproutingNodes) {
            const parentNode = board.nodes.get(parentId);
            if (!parentNode || !parentNode.stone) continue;

            // Buscar vecinos válidos
            const candidateNeighbors: string[] = [];
            for (const nId of parentNode.neighbors) {
                const neighbor = board.nodes.get(nId);
                if (neighbor && neighbor.stone === null && neighbor.terrain !== 'DESTROYED' && neighbor.terrain !== 'OBSTACLE') {
                    // Validar que colocar aquí no cause suicidio inmediato sin captura
                    const liberties = board.getLiberties(parentId);
                    if (liberties.size > 0) {
                        candidateNeighbors.push(nId);
                    }
                }
            }

            if (candidateNeighbors.length > 0) {
                // Elegir un vecino aleatorio para brotar
                const chosenNeighborId = candidateNeighbors[Math.floor(Math.random() * candidateNeighbors.length)];
                const result = RulesEngine.tryPlaceStone(board, state, chosenNeighborId, playerId, 'single');
                if (result.success) {
                    sproutedCount++;
                    if (onSprout) {
                        onSprout(chosenNeighborId);
                    }
                }
            }
        }

        return sproutedCount;
    }
}
