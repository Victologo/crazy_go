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
    polyGroupId?: string;
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
    shape?: string;
    size?: number;

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
        // GUARDIA: Solo añadir arista si AMBOS nodos existen en el grafo.
        // Previene pseudo-libertades en topologías asiétricas donde se intenta conectar
        // nodos que fueron excluidos durante la generación del tablero.
        if (node1 && node2) {
            node1.neighbors.add(id2);
            node2.neighbors.add(id1);
        }
    }

    removeEdge(id1: string, id2: string) {
        const node1 = this.nodes.get(id1);
        const node2 = this.nodes.get(id2);
        if (node1) node1.neighbors.delete(id2);
        if (node2) node2.neighbors.delete(id1);
    }

    removeNode(id: string) {
        const node = this.nodes.get(id);
        if (!node) return;
        // Eliminar aristas de los vecinos
        for (const neighborId of node.neighbors) {
            const neighbor = this.nodes.get(neighborId);
            if (neighbor) {
                neighbor.neighbors.delete(id);
            }
        }
        // Limpiar aristas del nodo
        node.neighbors.clear();
        node.stone = null;
        // Marcar como destruido
        node.terrain = 'DESTROYED';
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
            const currentNode = this.nodes.get(currentId);
            if (!currentNode) continue; // Protección: nodo borrado o inconsistente

            for (const neighborId of currentNode.neighbors) {
                const neighbor = this.nodes.get(neighborId);
                // GUARDIA CRUCÍAL: ignorar vecinos que no existen en el grafo
                // (aristas húrfanas en tableros procedurales/asimétricos).
                // También ignorar nodos con terreno no jugable.
                if (!neighbor || neighbor.terrain === 'OBSTACLE' || neighbor.terrain === 'DESTROYED') continue;

                if (neighbor.stone === null) {
                    liberties.add(neighborId);
                } else if (neighbor.stone.playerId === playerId) {
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
            const currentNode = this.nodes.get(currentId);
            if (!currentNode) continue; // Protección null-safe

            for (const neighborId of currentNode.neighbors) {
                const neighbor = this.nodes.get(neighborId);
                if (neighbor && neighbor.stone && neighbor.stone.playerId === playerId) {
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
    /**
     * Determina si un nodo vacío representa un Ojo Verdadero (True Eye) y no un Ojo Falso (False Eye),
     * aplicando el criterio canónico de control de esquinas/diagonales de la teoría de Go:
     * 1. 100% de los vecinos cardinales directos deben contener piedras aliadas.
     * 2. Control de intersecciones diagonales (esquinas): En el centro se requiere controlar al menos 3 de 4 diagonales;
     *    en el borde se requiere que el rival no controle ninguna de las 2 diagonales; en la esquina no debe haber control rival.
     */
    isTrueEye(nodeId: string, playerId: PlayerId): boolean {
        const node = this.nodes.get(nodeId);
        if (!node || node.stone !== null || node.terrain === 'OBSTACLE' || node.terrain === 'DESTROYED') {
            return false;
        }

        const validNeighbors = Array.from(node.neighbors)
            .map(nId => this.nodes.get(nId)!)
            .filter(n => n && n.terrain !== 'OBSTACLE' && n.terrain !== 'DESTROYED');

        if (validNeighbors.length === 0) return false;

        // 1. Todos los vecinos cardinales deben contener piedras del jugador aliado
        for (const neighbor of validNeighbors) {
            if (!neighbor.stone || neighbor.stone.playerId !== playerId) {
                return false;
            }
        }

        // 2. Comprobar esquinas/diagonales (nodos a distancia 2 que comparten al menos 2 vecinos cardinales con este ojo)
        if (validNeighbors.length >= 3) {
            const diagCandidateIds = new Set<string>();
            for (const cardinal of validNeighbors) {
                for (const dId of cardinal.neighbors) {
                    if (dId !== nodeId && !node.neighbors.has(dId)) {
                        const sharedCount = validNeighbors.filter(c => c.neighbors.has(dId)).length;
                        if (sharedCount >= 2) {
                            diagCandidateIds.add(dId);
                        }
                    }
                }
            }

            if (diagCandidateIds.size > 0) {
                let enemyDiagCount = 0;
                let friendlyDiagCount = 0;

                for (const dId of diagCandidateIds) {
                    const dNode = this.nodes.get(dId);
                    if (dNode && dNode.stone) {
                        if (dNode.stone.playerId === playerId) {
                            friendlyDiagCount++;
                        } else {
                            enemyDiagCount++;
                        }
                    }
                }

                // En el centro (4 esquinas posibles): el rival no puede tener 2 o más esquinas
                if (diagCandidateIds.size >= 4) {
                    if (enemyDiagCount >= 2 || (enemyDiagCount >= 1 && friendlyDiagCount < 2)) {
                        return false; // Ojo Falso
                    }
                } else if (diagCandidateIds.size >= 2) {
                    // En el borde (2 esquinas posibles): el rival no puede tener esquinas
                    if (enemyDiagCount >= 1) {
                        return false; // Ojo Falso
                    }
                }
            }
        }

        return true;
    }

    /**
     * Retorna la información de todas las estructuras del jugador que son INCONDICIONALMENTE VIVAS
     * aplicando el Teorema y Algoritmo Canónico de Benson (1976) en Grafos Arbitrarios:
     * 
     * 1. Encuentra todos los bloques (cadenas conexas) del jugador.
     * 2. Encuentra todas las regiones vacías conexas 100% encerradas por el jugador (y filtra ojos falsos).
     * 3. Define la salud de una región R para un bloque B: R es saludable para B ssi todo nodo en R es adyacente a B.
     * 4. Poda iterativa de punto fijo:
     *    - Elimina de B todo bloque con menos de 2 regiones saludables en R.
     *    - Elimina de R toda región donde no todos los bloques adyacentes pertenezcan al conjunto superviviente B.
     * 5. Retorna las cadenas y grupos que sobreviven con su número exacto de ojos independientes comprobados.
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

        // 2. Identificar todas las regiones vacías conexas (cavidades / ojos potenciales)
        const visitedEmpty = new Set<string>();
        const emptyRegions: Set<string>[] = [];

        for (const [nodeId, node] of this.nodes.entries()) {
            if (node.stone === null && node.terrain !== 'OBSTACLE' && node.terrain !== 'DESTROYED' && !visitedEmpty.has(nodeId)) {
                const region = new Set<string>();
                const queue: string[] = [nodeId];
                visitedEmpty.add(nodeId);

                while (queue.length > 0) {
                    const curId = queue.shift()!;
                    region.add(curId);
                    const curNode = this.nodes.get(curId)!;

                    for (const nId of curNode.neighbors) {
                        const nNode = this.nodes.get(nId);
                        if (!nNode || nNode.terrain === 'OBSTACLE' || nNode.terrain === 'DESTROYED') continue;

                        if (nNode.stone === null && !visitedEmpty.has(nId)) {
                            visitedEmpty.add(nId);
                            queue.push(nId);
                        }
                    }
                }
                emptyRegions.push(region);
            }
        }

        // 3. Filtrar regiones 100% encerradas por piedras del jugador (sin contacto con enemigos)
        const enclosedRegions: Set<string>[] = [];

        for (const region of emptyRegions) {
            let isEnclosed = true;
            let hasFriendlyBorder = false;

            for (const rId of region) {
                const rNode = this.nodes.get(rId)!;
                for (const nId of rNode.neighbors) {
                    const nNode = this.nodes.get(nId);
                    if (nNode && nNode.stone !== null) {
                        if (nNode.stone.playerId !== playerId) {
                            isEnclosed = false;
                            break;
                        } else {
                            hasFriendlyBorder = true;
                        }
                    }
                }
                if (!isEnclosed) break;
            }

            if (isEnclosed && hasFriendlyBorder) {
                // Si la región es un único nodo (1 intersección), aplicar verificación de ojo verdadero
                if (region.size === 1) {
                    const singleId = Array.from(region)[0];
                    if (!this.isTrueEye(singleId, playerId)) {
                        continue; // Descartar ojo falso
                    }
                }
                enclosedRegions.push(region);
            }
        }

        // Función auxiliar: Comprueba si la región R es saludable para la cadena B
        // Definición de Benson: Todo punto en R debe tener al menos una piedra adyacente en B
        const isHealthy = (region: Set<string>, chain: Set<string>): boolean => {
            for (const rId of region) {
                const rNode = this.nodes.get(rId)!;
                let hasAdjacentStoneInChain = false;
                for (const nId of rNode.neighbors) {
                    if (chain.has(nId)) {
                        hasAdjacentStoneInChain = true;
                        break;
                    }
                }
                if (!hasAdjacentStoneInChain) return false;
            }
            return true;
        };

        // 4. Algoritmo de Poda de Benson (Punto Fijo Iterativo)
        let B: Set<string>[] = [...playerChains];
        let R: Set<string>[] = [...enclosedRegions];

        let changed = true;
        while (changed) {
            changed = false;

            // Paso A: Podar de B cualquier cadena que no tenga al menos 2 regiones saludables en R
            const nextB: Set<string>[] = [];
            for (const b of B) {
                const healthyCount = R.filter(r => isHealthy(r, b)).length;
                if (healthyCount >= 2) {
                    nextB.push(b);
                } else {
                    changed = true;
                }
            }
            B = nextB;

            // Paso B: Podar de R cualquier región donde no todas las piedras adyacentes pertenezcan a B
            const nextR: Set<string>[] = [];
            for (const r of R) {
                let allAdjacentInB = true;
                for (const rId of r) {
                    const rNode = this.nodes.get(rId)!;
                    for (const nId of rNode.neighbors) {
                        const nNode = this.nodes.get(nId);
                        if (nNode && nNode.stone && nNode.stone.playerId === playerId) {
                            const isInSurvivingB = B.some(b => b.has(nId));
                            if (!isInSurvivingB) {
                                allAdjacentInB = false;
                                break;
                            }
                        }
                    }
                    if (!allAdjacentInB) break;
                }

                if (allAdjacentInB) {
                    nextR.push(r);
                } else {
                    changed = true;
                }
            }
            R = nextR;
        }

        // 5. Agrupar las cadenas supervivientes y calcular su número exacto de ojos vitales
        const result: { chain: Set<string>; eyesCount: number }[] = [];

        for (const b of B) {
            const healthyCount = R.filter(r => isHealthy(r, b)).length;
            result.push({ chain: b, eyesCount: healthyCount });
        }

        return result;
    }

    /**
     * Comprueba si el jugador posee al menos un grupo de piedras consolidado
     * con 2 o más ojos verdaderos e independientes (Teorema de Vida Incondicional de Benson en Grafos).
     */
    hasLivingGroup(playerId: PlayerId): boolean {
        const livingGroups = this.getLivingGroupsInfo(playerId);
        return livingGroups.some(g => g.eyesCount >= 2);
    }
}
