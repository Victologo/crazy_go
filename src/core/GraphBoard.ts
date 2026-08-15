// GraphBoard.ts

export type PlayerId = 1 | 2 | 3 | 4; // 1 = Negras (Black), 2 = Blancas (White), 3 = Esmeralda (Green), 4 = Amatista (Purple)
export type TerrainType = 'NORMAL' | 'QUICKSAND' | 'DESTROYED' | 'OBSTACLE';

export interface StoneInfo {
    id: string;
    playerId: PlayerId;
    isInvisible: boolean;
    isIndestructible: boolean;
    shieldTurnsLeft?: number;
    isFrozen: boolean;
    stoneType?: 'single' | 'sprouting' | 'domino' | 'monolith';
    sproutBirthTurn?: number;
}

export class BoardNode {
    id: string;
    x: number;
    y: number;
    isStarPoint?: boolean;
    neighbors: Set<string>;
    stone: StoneInfo | null;
    terrain: TerrainType;
    value: number;

    constructor(id: string, x: number = 0, y: number = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.neighbors = new Set();
        this.stone = null;
        this.terrain = 'NORMAL';
        this.value = 1;
    }
}

export class GraphBoard {
    nodes: Map<string, BoardNode>;

    constructor() {
        this.nodes = new Map();
    }

    addNode(id: string, x: number = 0, y: number = 0, isStarPoint: boolean = false) {
        if (!this.nodes.has(id)) {
            const node = new BoardNode(id, x, y);
            node.isStarPoint = isStarPoint;
            this.nodes.set(id, node);
        }
    }

    addEdge(id1: string, id2: string) {
        const node1 = this.nodes.get(id1);
        const node2 = this.nodes.get(id2);
        if (node1 && node2) {
            node1.neighbors.add(id2);
            node2.neighbors.add(id1);
        }
    }

    getLiberties(startNodeId: string): Set<string> {
        const startNode = this.nodes.get(startNodeId);
        if (!startNode || !startNode.stone) return new Set();

        const playerId = startNode.stone.playerId;
        const visited = new Set<string>();
        const queue: string[] = [startNodeId];
        const liberties = new Set<string>();

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            
            visited.add(currentId);
            const currentNode = this.nodes.get(currentId)!;

            for (const neighborId of currentNode.neighbors) {
                const neighbor = this.nodes.get(neighborId)!;
                if (neighbor.stone === null && neighbor.terrain !== 'OBSTACLE' && neighbor.terrain !== 'DESTROYED') {
                    liberties.add(neighborId);
                } else if (neighbor.stone && neighbor.stone.playerId === playerId) {
                    if (!visited.has(neighborId)) {
                        queue.push(neighborId);
                    }
                }
            }
        }

        return liberties;
    }

    getChain(startNodeId: string): Set<string> {
        const startNode = this.nodes.get(startNodeId);
        if (!startNode || !startNode.stone) return new Set();

        const playerId = startNode.stone.playerId;
        const chain = new Set<string>();
        const queue: string[] = [startNodeId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (chain.has(currentId)) continue;

            chain.add(currentId);
            const currentNode = this.nodes.get(currentId)!;

            for (const neighborId of currentNode.neighbors) {
                const neighbor = this.nodes.get(neighborId)!;
                if (neighbor.stone && neighbor.stone.playerId === playerId) {
                    if (!chain.has(neighborId)) {
                        queue.push(neighborId);
                    }
                }
            }
        }

        return chain;
    }

    /**
     * Serializes board state into a deterministic string representation
     * (used for Ko rule detection and history).
     */
    serializeState(): string {
        const entries: string[] = [];
        const sortedKeys = Array.from(this.nodes.keys()).sort();
        for (const key of sortedKeys) {
            const node = this.nodes.get(key)!;
            const stone = node.stone ? `${node.stone.playerId}` : '0';
            entries.push(`${key}:${stone}`);
        }
        return entries.join(';');
    }

    /**
     * Comprueba si una intersección vacía es un Ojo Verdadero (True Eye) en CUALQUIER topología de grafo
     * (Cuadrado, Triangular, Hexagonal, Procedural, etc.).
     * 
     * Criterios Topológicos Universales:
     * 1. 100% de los vecinos del nodo deben contener piedras del jugador aliado (sin presencia enemiga).
     * 2. Todas las piedras adyacentes deben pertenecer a la misma cadena conexa, O si pertenecen
     *    a cadenas distintas, cada cadena debe tener al menos 2 libertades externas para evitar el corte por falso ojo.
     */
    /**
     * Comprueba si una intersección vacía es un Ojo Verdadero (True Eye) en CUALQUIER topología de grafo
     * (Cuadrado, Triangular, Hexagonal, Procedural, Erosionado, etc.).
     * 
     * Criterios Topológicos Universales:
     * 1. 100% de los vecinos válidos del nodo en el grafo deben contener piedras del jugador aliado (sin presencia enemiga).
     * 2. Todas las piedras adyacentes deben pertenecer a cadenas sólidas del jugador: si pertenecen a varias cadenas,
     *    ninguna debe estar en atari (1 sola libertad) para evitar ojos falsos.
     */
    isTrueEye(nodeId: string, playerId: PlayerId, _chain?: Set<string>): boolean {
        const node = this.nodes.get(nodeId);
        if (!node || node.stone !== null || node.terrain === 'OBSTACLE' || node.terrain === 'DESTROYED') {
            return false;
        }

        const validNeighbors = Array.from(node.neighbors)
            .map(nId => this.nodes.get(nId)!)
            .filter(n => n && n.terrain !== 'OBSTACLE' && n.terrain !== 'DESTROYED');

        if (validNeighbors.length === 0) return false;

        // 1. Todos los vecinos cardinales existentes en el grafo deben ser piedras del jugador aliado
        for (const neighbor of validNeighbors) {
            if (!neighbor.stone || neighbor.stone.playerId !== playerId) {
                return false;
            }
        }

        // 2. Comprobar que las cadenas que defienden el ojo no estén en falso ojo (atari inmediato de 1 libertad)
        const neighborChains = new Set<Set<string>>();
        for (const neighbor of validNeighbors) {
            neighborChains.add(this.getChain(neighbor.id));
        }

        if (neighborChains.size > 1) {
            for (const ch of neighborChains) {
                const firstStone = Array.from(ch)[0];
                if (firstStone) {
                    const liberties = this.getLiberties(firstStone);
                    if (liberties.size < 2) return false;
                }
            }
        }

        return true;
    }

    /**
     * Retorna la información de todas las cadenas/estructuras del jugador que poseen ojos verdaderos/vitales,
     * junto con la cantidad exacta de ojos independientes que protege cada estructura (Teorema de Benson en Grafos Arbitrarios).
     */
    getLivingGroupsInfo(playerId: PlayerId): { chain: Set<string>; eyesCount: number }[] {
        // 1. Identificar todas las cadenas conectadas del jugador
        const visitedStones = new Set<string>();
        const playerChains: Set<string>[] = [];

        for (const [nodeId, node] of this.nodes.entries()) {
            if (node.stone && node.stone.playerId === playerId && !visitedStones.has(nodeId)) {
                const chain = this.getChain(nodeId);
                chain.forEach(id => visitedStones.add(id));
                playerChains.push(chain);
            }
        }

        if (playerChains.length === 0) return [];

        // 2. Identificar todas las cavidades vacías conexas del tablero (ojos)
        const visitedEmpty = new Set<string>();
        interface EnclosedCavity {
            id: string;
            nodes: Set<string>;
            borderPlayerStones: Set<string>;
            isTrue: boolean;
        }

        const enclosedCavities: EnclosedCavity[] = [];

        for (const [nodeId, node] of this.nodes.entries()) {
            if (node.stone === null && node.terrain !== 'OBSTACLE' && node.terrain !== 'DESTROYED' && !visitedEmpty.has(nodeId)) {
                const cavityNodes = new Set<string>();
                const borderPlayerStones = new Set<string>();
                let hasEnemyBorder = false;

                const queue: string[] = [nodeId];
                visitedEmpty.add(nodeId);

                while (queue.length > 0) {
                    const curId = queue.shift()!;
                    cavityNodes.add(curId);
                    const curNode = this.nodes.get(curId)!;

                    for (const nId of curNode.neighbors) {
                        const nNode = this.nodes.get(nId);
                        if (!nNode || nNode.terrain === 'OBSTACLE' || nNode.terrain === 'DESTROYED') continue;

                        if (nNode.stone === null) {
                            if (!visitedEmpty.has(nId)) {
                                visitedEmpty.add(nId);
                                queue.push(nId);
                            }
                        } else if (nNode.stone.playerId === playerId) {
                            borderPlayerStones.add(nId);
                        } else {
                            hasEnemyBorder = true;
                        }
                    }
                }

                // Una cavidad es un ojo si no tiene contacto con piedras enemigas y está 100% bordeada por piedras aliadas
                if (!hasEnemyBorder && borderPlayerStones.size > 0) {
                    let isTrue = true;
                    if (cavityNodes.size === 1) {
                        const singleNodeId = Array.from(cavityNodes)[0];
                        isTrue = this.isTrueEye(singleNodeId, playerId);
                    }
                    if (isTrue) {
                        enclosedCavities.push({
                            id: Array.from(cavityNodes).sort().join(';'),
                            nodes: cavityNodes,
                            borderPlayerStones,
                            isTrue: true
                        });
                    }
                }
            }
        }

        // 3. Evaluar cadenas individuales y clusters conectados/mutuamente soportados
        const result: { chain: Set<string>; eyesCount: number }[] = [];

        for (const chain of playerChains) {
            let vitalCavitiesCount = 0;
            const countedCavities = new Set<string>();

            for (const cavity of enclosedCavities) {
                const bordersThisChain = Array.from(cavity.borderPlayerStones).some(sId => chain.has(sId));
                if (bordersThisChain && !countedCavities.has(cavity.id)) {
                    countedCavities.add(cavity.id);
                    vitalCavitiesCount++;
                }
            }

            if (vitalCavitiesCount > 0) {
                result.push({ chain, eyesCount: vitalCavitiesCount });
            }
        }

        // 4. Si existen múltiples cadenas aliadas que defienden conjuntamente los mismos ojos (Grupo Mutuo de Benson)
        // unificar las cadenas que comparten las cavidades para reconocer estructuras de ojos conectadas
        if (enclosedCavities.length >= 2) {
            const allLivingStones = new Set<string>();
            enclosedCavities.forEach(c => c.borderPlayerStones.forEach(sId => allLivingStones.add(sId)));
            
            // Si el conjunto conjunto de piedras que rodea las cavidades tiene 2 o más ojos y no fue detectado en cadenas aisladas
            const maxEyesInSingleChain = result.reduce((max, r) => Math.max(max, r.eyesCount), 0);
            if (maxEyesInSingleChain < 2 && enclosedCavities.length >= 2) {
                result.push({ chain: allLivingStones, eyesCount: enclosedCavities.length });
            }
        }

        return result;
    }

    /**
     * Comprueba si el jugador posee al menos un grupo de piedras consolidado
     * con 2 o más ojos verdaderos e independientes (Teorema de Vida Incondicional de Benson en Grafos).
     * 
     * Funciona en cualquier topología de tablero (cuadrado, triangular, hexagonal, irregular, etc.).
     */
    hasLivingGroup(playerId: PlayerId): boolean {
        const livingGroups = this.getLivingGroupsInfo(playerId);
        return livingGroups.some(g => g.eyesCount >= 2);
    }
}
