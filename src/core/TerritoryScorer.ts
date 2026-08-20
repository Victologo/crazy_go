import { GraphBoard, type PlayerId } from './GraphBoard';
import { GameState } from './GameState';
import { t } from '../i18n/i18n';

export interface PlayerScore {
    playerId: PlayerId;
    name: string;
    color: string;
    icon: string;
    territory: number;
    captures: number;
    komi: number;
    total: number;
}

export interface ScoreReport {
    playerCount: number;
    playerScores: Record<PlayerId, PlayerScore>;
    ranking: PlayerScore[];
    blackTerritory: number;
    whiteTerritory: number;
    greenTerritory: number;
    purpleTerritory: number;
    blackCaptures: number;
    whiteCaptures: number;
    greenCaptures: number;
    purpleCaptures: number;
    komi: number;
    blackTotal: number;
    whiteTotal: number;
    winner: 'black' | 'white' | 'green' | 'purple' | 'draw';
    winnerPlayerId: PlayerId | null;
    margin: number;
    territoryMap: Map<string, PlayerId>; // Asigna a cada nodo vacío su dueño territorial (1, 2, 3 o 4)
    deadStones: Map<string, PlayerId>;   // Nodos con piedras muertas -> PlayerId del jugador que las capturó
    deadStonesCount: Record<PlayerId, number>; // Prisioneros adicionales ganados por captura de piedras muertas
    sekiMap: Set<string>;               // Nodos vacíos en Seki (no cuentan como territorio de nadie)
}

interface StoneChain {
    playerId: PlayerId;
    nodes: Set<string>;
    liberties: Set<string>;
    isIndestructible: boolean;
    isDead: boolean;
    killerId: PlayerId | null;
}

export class TerritoryScorer {
    public static get PLAYER_META(): Record<PlayerId, { name: string; color: string; icon: string; key: 'black' | 'white' | 'green' | 'purple' }> {
        return {
            1: { name: t('hud.player_black'), color: '#1a1a1a', icon: '⚫', key: 'black' },
            2: { name: t('hud.player_white'), color: '#ffffff', icon: '⚪', key: 'white' },
            3: { name: t('hud.player_green'), color: '#10b981', icon: '🟢', key: 'green' },
            4: { name: t('hud.player_purple'), color: '#8b5cf6', icon: '🟣', key: 'purple' }
        };
    }

    /**
     * Calcula la puntuación canónica de Go basada en:
     * 1. Primera pasada:  Detección de piedras muertas por recintos cerrados (Enclosure Analysis)
     * 2. Segunda pasada:  Análisis topológico Benson + Influencia
     * 3. Tercera pasada:  Detección de Seki — grupos rivales con libertades compartidas que se salvan mutuamente
     * 4. BFS de territorio sobre el tablero efectivo (sin piedras muertas, sin zonas Seki)
     */
    static calculateScore(board: GraphBoard, state: GameState): ScoreReport {
        const activePlayerIds: PlayerId[] = state.playerCount === 4 ? [1, 2, 3, 4] : [1, 2];

        // 1. Identificar todas las cadenas de piedras conexas
        const chains = this.findStoneChains(board);

        // 2. Primera pasada: detección de piedras muertas por recintos cerrados
        this.detectDeadStonesViaEnclosure(board, chains, activePlayerIds);

        // 3. Segunda pasada: evaluación de vida/muerte con Benson + Influencia
        this.evaluateLifeAndDeath(board, chains);

        // 4. TERCERA PASADA: Detección de Seki
        //    Rescata cadenas marcadas como muertas (o débiles sin 2 ojos) que en realidad están
        //    en relación de Seki (vida mutua por libertades compartidas) con un rival.
        //    Los nodos vacíos dentro de un Seki no cuentan como territorio de nadie.
        const sekiMap = this.detectAndResolveSeki(board, chains);

        // 5. Consolidar mapa de piedras muertas
        const deadStones = new Map<string, PlayerId>();
        const deadStonesCount: Record<PlayerId, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

        for (const chain of chains) {
            if (chain.isDead && chain.killerId !== null) {
                for (const nodeId of chain.nodes) {
                    deadStones.set(nodeId, chain.killerId);
                    deadStonesCount[chain.killerId]++;
                }
            }
        }

        // 6. Inundación BFS en el tablero efectivo (piedras muertas = vacías, zonas Seki = dame)
        const territoryMap = new Map<string, PlayerId>();
        const territoryCounts: Record<PlayerId, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
        const visitedEmpty = new Set<string>();

        for (const [nodeId, node] of board.nodes.entries()) {
            if (node.terrain === 'DESTROYED' || node.terrain === 'OBSTACLE' || visitedEmpty.has(nodeId)) {
                continue;
            }

            const isAliveStone = node.stone !== null && !deadStones.has(nodeId);
            if (isAliveStone) continue;

            // Iniciar componente conexa de territorio
            const region: string[] = [];
            const queue: string[] = [nodeId];
            visitedEmpty.add(nodeId);

            const borderingLivingPlayers = new Set<PlayerId>();
            let touchesSeki = false;

            while (queue.length > 0) {
                const currId = queue.shift()!;
                region.push(currId);

                // Si este nodo vacío es Seki, la región completa es dame
                if (sekiMap.has(currId)) touchesSeki = true;

                const currNode = board.nodes.get(currId);
                if (!currNode) continue;

                for (const neighborId of currNode.neighbors) {
                    const neighbor = board.nodes.get(neighborId);
                    if (!neighbor || neighbor.terrain === 'DESTROYED' || neighbor.terrain === 'OBSTACLE') continue;

                    const neighborHasLivingStone = neighbor.stone !== null && !deadStones.has(neighborId);

                    if (neighborHasLivingStone) {
                        borderingLivingPlayers.add(neighbor.stone!.playerId);
                    } else if (!visitedEmpty.has(neighborId)) {
                        visitedEmpty.add(neighborId);
                        queue.push(neighborId);
                    }
                }
            }

            // Regla de Territorio Canónica:
            // · Si toca un nodo Seki → dame (reglas japonesas: no cuenta)
            // · Si linda SOLO con un color → territorio de ese jugador
            // · Si linda con 2+ colores → dame
            if (!touchesSeki && borderingLivingPlayers.size === 1) {
                const owner = Array.from(borderingLivingPlayers)[0];
                territoryCounts[owner] += region.length;
                for (const id of region) {
                    territoryMap.set(id, owner);
                }
            }
        }

        // 7. Komi y Totales Canónicos
        const p1Komi = state.playerKomis ? (state.playerKomis[1] ?? 0) : 0;
        const p2Komi = state.playerKomis ? (state.playerKomis[2] ?? state.komi) : state.komi;
        const p3Komi = state.playerKomis ? (state.playerKomis[3] ?? 0) : 0;
        const p4Komi = state.playerKomis ? (state.playerKomis[4] ?? 0) : 0;

        const totalBlackCaps = state.blackCaptures + deadStonesCount[1];
        const totalWhiteCaps = state.whiteCaptures + deadStonesCount[2];
        const totalGreenCaps = state.greenCaptures + deadStonesCount[3];
        const totalPurpleCaps = state.purpleCaptures + deadStonesCount[4];

        const playerScores: Record<PlayerId, PlayerScore> = {
            1: {
                playerId: 1,
                name: 'Black',
                color: '#1a1a1a',
                icon: '⚫',
                territory: territoryCounts[1],
                captures: totalBlackCaps,
                komi: p1Komi,
                total: territoryCounts[1] + totalBlackCaps + p1Komi
            },
            2: {
                playerId: 2,
                name: 'White',
                color: '#ffffff',
                icon: '⚪',
                territory: territoryCounts[2],
                captures: totalWhiteCaps,
                komi: p2Komi,
                total: territoryCounts[2] + totalWhiteCaps + p2Komi
            },
            3: {
                playerId: 3,
                name: 'Emerald',
                color: '#10b981',
                icon: '🟢',
                territory: territoryCounts[3],
                captures: totalGreenCaps,
                komi: p3Komi,
                total: territoryCounts[3] + totalGreenCaps + p3Komi
            },
            4: {
                playerId: 4,
                name: 'Amethyst',
                color: '#8b5cf6',
                icon: '🟣',
                territory: territoryCounts[4],
                captures: totalPurpleCaps,
                komi: p4Komi,
                total: territoryCounts[4] + totalPurpleCaps + p4Komi
            }
        };

        const ranking = activePlayerIds
            .map(pid => playerScores[pid])
            .sort((a, b) => b.total - a.total);

        let winner: 'black' | 'white' | 'green' | 'purple' | 'draw' = 'draw';
        let winnerPlayerId: PlayerId | null = null;
        let margin = 0;

        if (ranking.length >= 2) {
            if (ranking[0].total > ranking[1].total) {
                winnerPlayerId = ranking[0].playerId;
                winner = this.PLAYER_META[winnerPlayerId].key;
                margin = ranking[0].total - ranking[1].total;
            } else {
                winner = 'draw';
                margin = 0;
            }
        }

        return {
            playerCount: state.playerCount,
            playerScores,
            ranking,
            blackTerritory: territoryCounts[1],
            whiteTerritory: territoryCounts[2],
            greenTerritory: territoryCounts[3],
            purpleTerritory: territoryCounts[4],
            blackCaptures: totalBlackCaps,
            whiteCaptures: totalWhiteCaps,
            greenCaptures: totalGreenCaps,
            purpleCaptures: totalPurpleCaps,
            komi: state.komi,
            blackTotal: playerScores[1].total,
            whiteTotal: playerScores[2].total,
            winner,
            winnerPlayerId,
            margin,
            territoryMap,
            deadStones,
            deadStonesCount,
            sekiMap
        };
    }

    /**
     * Agrupa las piedras adyacentes del mismo color en cadenas conexas
     */
    private static findStoneChains(board: GraphBoard): StoneChain[] {
        const visitedStones = new Set<string>();
        const chains: StoneChain[] = [];

        for (const [nodeId, node] of board.nodes.entries()) {
            if (!node.stone || visitedStones.has(nodeId)) continue;

            const playerId = node.stone.playerId;
            const chainNodes = new Set<string>();
            const liberties = new Set<string>();
            let isIndestructible = false;

            const queue = [nodeId];
            visitedStones.add(nodeId);

            while (queue.length > 0) {
                const currentId = queue.shift()!;
                chainNodes.add(currentId);

                const currNode = board.nodes.get(currentId)!;
                if (currNode.stone?.isIndestructible) {
                    isIndestructible = true;
                }

                for (const neighborId of currNode.neighbors) {
                    const neighbor = board.nodes.get(neighborId);
                    if (!neighbor || neighbor.terrain === 'DESTROYED' || neighbor.terrain === 'OBSTACLE') continue;

                    if (neighbor.stone === null) {
                        liberties.add(neighborId);
                    } else if (neighbor.stone.playerId === playerId && !visitedStones.has(neighborId)) {
                        visitedStones.add(neighborId);
                        queue.push(neighborId);
                    }
                }
            }

            chains.push({
                playerId,
                nodes: chainNodes,
                liberties,
                isIndestructible,
                isDead: false,
                killerId: null
            });
        }

        return chains;
    }

    /**
     * PRIMERA PASADA: Detección de piedras muertas por recintos cerrados.
     *
     * Para cada jugador P, encuentra las regiones vacías 100% encerradas por P.
     * Si una cadena rival tiene TODAS sus libertades dentro de ese recinto y no tiene
     * 2 ojos propios → está incondicionalmente muerta (killerId = P).
     */
    private static detectDeadStonesViaEnclosure(
        board: GraphBoard,
        chains: StoneChain[],
        activePlayerIds: PlayerId[]
    ): void {
        for (const enclosingPlayer of activePlayerIds) {
            const enclosedRegions = this.findEnclosedRegionsByPlayer(board, enclosingPlayer);

            for (const region of enclosedRegions) {
                for (const chain of chains) {
                    if (chain.playerId === enclosingPlayer) continue;
                    if (chain.isDead) continue;
                    if (chain.isIndestructible) continue;

                    const libertiesInRegion = Array.from(chain.liberties).filter(lib => region.has(lib));
                    const allLibertiesInsideRegion =
                        libertiesInRegion.length === chain.liberties.size && chain.liberties.size > 0;
                    const nodesInRegion = Array.from(chain.nodes).filter(n => region.has(n));
                    const partiallyInsideAndTrapped = nodesInRegion.length > 0 && allLibertiesInsideRegion;

                    if (!allLibertiesInsideRegion && !partiallyInsideAndTrapped) continue;

                    const hasEscape = this.chainHasTwoEyesInsideRegion(board, chain, region);
                    if (!hasEscape) {
                        chain.isDead = true;
                        chain.killerId = enclosingPlayer;
                    }
                }
            }
        }
    }

    /**
     * Encuentra todas las regiones vacías 100% encerradas por un jugador dado.
     */
    private static findEnclosedRegionsByPlayer(board: GraphBoard, playerId: PlayerId): Set<string>[] {
        const visitedEmpty = new Set<string>();
        const enclosedRegions: Set<string>[] = [];

        for (const [nodeId, node] of board.nodes.entries()) {
            if (node.stone !== null) continue;
            if (node.terrain === 'DESTROYED' || node.terrain === 'OBSTACLE') continue;
            if (visitedEmpty.has(nodeId)) continue;

            const region = new Set<string>();
            const queue: string[] = [nodeId];
            visitedEmpty.add(nodeId);

            let isEnclosed = true;
            let hasFriendlyBorder = false;

            while (queue.length > 0) {
                const currId = queue.shift()!;
                region.add(currId);

                const currNode = board.nodes.get(currId);
                if (!currNode) continue;

                for (const neighborId of currNode.neighbors) {
                    const neighbor = board.nodes.get(neighborId);
                    if (!neighbor || neighbor.terrain === 'DESTROYED' || neighbor.terrain === 'OBSTACLE') continue;

                    if (neighbor.stone !== null) {
                        if (neighbor.stone.playerId === playerId) {
                            hasFriendlyBorder = true;
                        } else {
                            isEnclosed = false;
                        }
                    } else if (!visitedEmpty.has(neighborId)) {
                        visitedEmpty.add(neighborId);
                        queue.push(neighborId);
                    }
                }
            }

            if (isEnclosed && hasFriendlyBorder) {
                enclosedRegions.push(region);
            }
        }

        return enclosedRegions;
    }

    /**
     * Verifica si una cadena atrapada tiene 2 ojos independientes dentro del recinto
     * (si los tiene, está viva incluso dentro de territorio enemigo).
     */
    private static chainHasTwoEyesInsideRegion(
        board: GraphBoard,
        chain: StoneChain,
        _region: Set<string>
    ): boolean {
        const visitedCavities = new Set<string>();
        let independentEyesCount = 0;

        for (const libId of chain.liberties) {
            if (visitedCavities.has(libId)) continue;

            const cavityNodes: string[] = [];
            const queue = [libId];
            visitedCavities.add(libId);
            let isPureFriendlyCavity = true;

            while (queue.length > 0) {
                const currId = queue.shift()!;
                cavityNodes.push(currId);

                const currNode = board.nodes.get(currId);
                if (!currNode) continue;

                for (const nId of currNode.neighbors) {
                    const neighbor = board.nodes.get(nId);
                    if (!neighbor || neighbor.terrain === 'DESTROYED' || neighbor.terrain === 'OBSTACLE') continue;

                    if (neighbor.stone) {
                        if (neighbor.stone.playerId !== chain.playerId) {
                            const enemyLibs = board.getLiberties(nId);
                            if (enemyLibs.size > 2) {
                                isPureFriendlyCavity = false;
                            }
                        }
                    } else if (!visitedCavities.has(nId)) {
                        visitedCavities.add(nId);
                        queue.push(nId);
                    }
                }
            }

            if (isPureFriendlyCavity && cavityNodes.length >= 1) {
                if (cavityNodes.length === 1) {
                    if (board.isTrueEye(cavityNodes[0], chain.playerId)) {
                        independentEyesCount++;
                    }
                } else {
                    independentEyesCount++;
                }
            }

            if (independentEyesCount >= 2) return true;
        }

        return independentEyesCount >= 2;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TERCERA PASADA: DETECCIÓN DE SEKI
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Detección canónica de Seki (vida mutua) en el grafo topológico.
     *
     * DEFINICIÓN DE SEKI:
     * Dos grupos de colores distintos comparten libertades comunes de forma que
     * ninguno puede jugar en esas libertades sin quedar inmediatamente en situación
     * de captura. Bajo reglas japonesas, las intersecciones vacías de un Seki
     * NO cuentan como territorio de nadie.
     *
     * ALGORITMO (tres capas de detección):
     *
     * Capa 1 — Seki Directo (más común):
     *   Cadenas A y B de colores distintos donde TODAS las libertades de A son
     *   compartidas con B y viceversa. Ninguna tiene libertades "privadas".
     *   Ejemplo clásico: dos grupos atrapados compartiendo 1-2 intersecciones.
     *
     * Capa 2 — Seki con ojos privados insuficientes:
     *   A y B comparten libertades, pero además cada una tiene algunas libertades
     *   propias. Se valida que los ojos independientes privados de cada cadena
     *   sean < 2 (sin ellos no son incondicionalmente vivas por sí solas).
     *
     * Capa 3 — Rescate de cadenas marcadas muertas erróneamente:
     *   Una cadena C fue marcada muerta por la primera o segunda pasada, pero en
     *   realidad está en Seki con la cadena que la "encerró" (killerId).
     *   Verificamos si la cadena killer también depende de esas libertades.
     *
     * PARA 4 JUGADORES:
     *   El algoritmo es idéntico — compara pares de cualquier combinación de
     *   PlayerId distintos. El set `sekiMap` es global y acumula todos los nodos.
     */
    private static detectAndResolveSeki(
        board: GraphBoard,
        chains: StoneChain[]
    ): Set<string> {
        const sekiMap = new Set<string>();

        // Índice rápido: nodeId → StoneChain (solo cadenas vivas)
        const nodeToChain = new Map<string, StoneChain>();
        for (const chain of chains) {
            if (chain.isIndestructible) continue;
            for (const nodeId of chain.nodes) {
                nodeToChain.set(nodeId, chain);
            }
        }

        // ── CAPA 1 y 2: Detección de Seki entre pares de cadenas ──────────────
        const processedPairs = new Set<string>(); // evitar duplicados

        for (const chainA of chains) {
            if (chainA.isIndestructible) continue;

            for (const libId of chainA.liberties) {
                const libNode = board.nodes.get(libId);
                if (!libNode) continue;

                // Buscar cadenas rivales que también tengan esta libertad
                for (const neighborId of libNode.neighbors) {
                    const neighbor = board.nodes.get(neighborId);
                    if (!neighbor || !neighbor.stone) continue;
                    if (neighbor.stone.playerId === chainA.playerId) continue;

                    const chainB = nodeToChain.get(neighborId);
                    if (!chainB) continue;
                    if (chainB.isIndestructible) continue;

                    // Clave única para el par (independiente de orden)
                    const keyA = Array.from(chainA.nodes)[0] ?? '';
                    const keyB = Array.from(chainB.nodes)[0] ?? '';
                    const pairKey = [keyA, keyB].sort().join('|');
                    if (processedPairs.has(pairKey)) continue;
                    processedPairs.add(pairKey);

                    this.evaluateSekiPair(board, chainA, chainB, sekiMap);
                }
            }
        }

        // ── CAPA 3: Rescate de cadenas marcadas muertas que son Seki ──────────
        for (const chain of chains) {
            if (!chain.isDead || chain.killerId === null) continue;
            if (chain.isIndestructible) continue;

            // Buscar la cadena del killer que comparte libertades con esta
            // (la que la "encierra" y la marcó muerta)
            for (const libId of chain.liberties) {
                const libNode = board.nodes.get(libId);
                if (!libNode) continue;

                for (const neighborId of libNode.neighbors) {
                    const neighbor = board.nodes.get(neighborId);
                    if (!neighbor || !neighbor.stone) continue;
                    if (neighbor.stone.playerId !== chain.killerId) continue;

                    const killerChain = nodeToChain.get(neighborId);
                    if (!killerChain) continue;
                    if (killerChain.isIndestructible) continue;

                    const pairKey = [
                        Array.from(chain.nodes)[0] ?? '',
                        Array.from(killerChain.nodes)[0] ?? ''
                    ].sort().join('|');
                    if (processedPairs.has(pairKey)) continue;
                    processedPairs.add(pairKey);

                    this.evaluateSekiPair(board, chain, killerChain, sekiMap);
                }
            }
        }

        return sekiMap;
    }

    /**
     * Evalúa si el par (chainA, chainB) está en relación de Seki y, si es así,
     * rescata ambas cadenas (isDead = false) y añade las libertades compartidas
     * al sekiMap.
     *
     * Condiciones de Seki:
     * 1. Las cadenas comparten al menos 1 libertad.
     * 2. Los ojos privados (independientes del espacio compartido) de CADA cadena son < 2.
     *    · Si ambas tienen 0 libertades privadas → Seki Directo (la forma más común).
     *    · Si ambas tienen < 2 ojos privados     → Seki con ojos insuficientes.
     */
    private static evaluateSekiPair(
        board: GraphBoard,
        chainA: StoneChain,
        chainB: StoneChain,
        sekiMap: Set<string>
    ): void {
        // 1. Libertades compartidas
        const sharedLibs = new Set<string>();
        for (const lib of chainA.liberties) {
            if (chainB.liberties.has(lib)) sharedLibs.add(lib);
        }
        if (sharedLibs.size === 0) return;

        // 2. Libertades privadas de cada cadena
        const aPrivate = new Set<string>();
        for (const lib of chainA.liberties) {
            if (!sharedLibs.has(lib)) aPrivate.add(lib);
        }
        const bPrivate = new Set<string>();
        for (const lib of chainB.liberties) {
            if (!sharedLibs.has(lib)) bPrivate.add(lib);
        }

        // 3. Ojos independientes en libertades privadas
        const aPrivateEyes = this.countIndependentEyes(board, chainA, aPrivate);
        const bPrivateEyes = this.countIndependentEyes(board, chainB, bPrivate);

        // 4. Verificar condición de Seki: ninguna tiene suficientes ojos propios
        if (aPrivateEyes >= 2 || bPrivateEyes >= 2) return; // una de las dos es independientemente viva → no Seki

        // 5. ¡SEKI CONFIRMADO!
        chainA.isDead = false;
        chainA.killerId = null;
        chainB.isDead = false;
        chainB.killerId = null;

        for (const lib of sharedLibs) {
            sekiMap.add(lib);
        }
    }

    /**
     * Cuenta cuántas cavidades de ojo independientes tiene una cadena
     * considerando SOLO el conjunto de libertades dado (subset de chain.liberties).
     *
     * Usado para calcular "ojos privados" (libertades no compartidas con el rival en Seki).
     */
    private static countIndependentEyes(
        board: GraphBoard,
        chain: StoneChain,
        libertySubset: Set<string>
    ): number {
        if (libertySubset.size === 0) return 0;

        const visited = new Set<string>();
        let eyes = 0;

        for (const libId of libertySubset) {
            if (visited.has(libId)) continue;

            const cavity: string[] = [];
            const queue: string[] = [libId];
            visited.add(libId);
            let isPure = true;

            while (queue.length > 0) {
                const curr = queue.shift()!;
                cavity.push(curr);

                const currNode = board.nodes.get(curr);
                if (!currNode) continue;

                for (const nId of currNode.neighbors) {
                    const n = board.nodes.get(nId);
                    if (!n || n.terrain === 'DESTROYED' || n.terrain === 'OBSTACLE') continue;

                    if (n.stone) {
                        if (n.stone.playerId !== chain.playerId) {
                            // Piedra rival dentro de la cavidad: ¿está viva?
                            const enemyLibs = board.getLiberties(nId);
                            if (enemyLibs.size > 2) isPure = false;
                        }
                    } else if (libertySubset.has(nId) && !visited.has(nId)) {
                        // Solo expandir dentro del subset de libertades privadas
                        visited.add(nId);
                        queue.push(nId);
                    }
                }
            }

            if (isPure && cavity.length >= 1) {
                if (cavity.length === 1) {
                    if (board.isTrueEye(cavity[0], chain.playerId)) eyes++;
                } else {
                    eyes++;
                }
            }
        }

        return eyes;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEGUNDA PASADA: BENSON + INFLUENCIA
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Evaluación de vida/muerte mediante Teorema de Benson + Análisis de Influencia.
     * Solo actúa sobre cadenas no marcadas por la primera pasada.
     * Radio BFS de influencia: 6 (cubre cercos grandes en tableros 19x19).
     */
    private static evaluateLifeAndDeath(
        board: GraphBoard,
        chains: StoneChain[]
    ) {
        // 1. Grupos incondicionalmente vivos (Teorema de Benson 1976)
        const livingChainsByPlayer = new Map<PlayerId, Set<string>[]>();
        for (const pid of [1, 2, 3, 4] as PlayerId[]) {
            const livingInfo = board.getLivingGroupsInfo(pid);
            livingChainsByPlayer.set(pid, livingInfo.map(info => info.chain));
        }

        // Marcar vivas las cadenas certificadas por Benson
        for (const chain of chains) {
            if (chain.isDead) continue;
            const playerLivingChains = livingChainsByPlayer.get(chain.playerId) || [];
            for (const livingChain of playerLivingChains) {
                const firstNode = Array.from(chain.nodes)[0];
                if (firstNode && livingChain.has(firstNode)) {
                    chain.isDead = false;
                    break;
                }
            }
        }

        // 2. Mapa de influencia topológica (radio 6)
        const influence = new Map<string, Record<PlayerId, number>>();
        for (const [nodeId] of board.nodes) {
            influence.set(nodeId, { 1: 0, 2: 0, 3: 0, 4: 0 });
        }

        const INFLUENCE_RADIUS = 6;

        for (const [stoneId, node] of board.nodes) {
            if (!node.stone) continue;
            const pId = node.stone.playerId;

            const queue: {id: string, dist: number}[] = [{id: stoneId, dist: 0}];
            const visited = new Set<string>([stoneId]);

            while(queue.length > 0) {
                const {id, dist} = queue.shift()!;
                influence.get(id)![pId] += 1 / Math.pow(2, dist);

                if (dist < INFLUENCE_RADIUS) {
                    const currNode = board.nodes.get(id);
                    if (currNode) {
                        for (const nId of currNode.neighbors) {
                            const nNode = board.nodes.get(nId);
                            if (nNode && nNode.terrain !== 'DESTROYED' && nNode.terrain !== 'OBSTACLE' && !visited.has(nId)) {
                                visited.add(nId);
                                queue.push({id: nId, dist: dist + 1});
                            }
                        }
                    }
                }
            }
        }

        // 3. Evaluar cada cadena (solo las no marcadas aún)
        for (const chain of chains) {
            if (chain.isIndestructible) { chain.isDead = false; continue; }
            if (chain.isDead) continue;

            // Benson: ¿está certificada incondicionalmente viva?
            const playerLivingChains = livingChainsByPlayer.get(chain.playerId) || [];
            const isBensonAlive = playerLivingChains.some(lc => {
                const fNode = Array.from(chain.nodes)[0];
                return fNode ? lc.has(fNode) : false;
            });
            if (isBensonAlive) { chain.isDead = false; continue; }

            // Análisis de ojos (sin umbral de salida por libertades/tamaño)
            const visitedCavities = new Set<string>();
            let independentEyesCount = 0;

            for (const libId of chain.liberties) {
                if (visitedCavities.has(libId)) continue;

                const cavityNodes: string[] = [];
                const queue: string[] = [libId];
                visitedCavities.add(libId);
                let isPureFriendlyCavity = true;

                while(queue.length > 0) {
                    const currId = queue.shift()!;
                    cavityNodes.push(currId);
                    const currNode = board.nodes.get(currId);
                    if (!currNode) continue;

                    for (const nId of currNode.neighbors) {
                        const neighbor = board.nodes.get(nId);
                        if (!neighbor || neighbor.terrain === 'DESTROYED' || neighbor.terrain === 'OBSTACLE') continue;

                        if (neighbor.stone) {
                            if (neighbor.stone.playerId !== chain.playerId) {
                                const enemyLibs = board.getLiberties(nId);
                                if (enemyLibs.size > 2) isPureFriendlyCavity = false;
                            }
                        } else if (!visitedCavities.has(nId)) {
                            visitedCavities.add(nId);
                            queue.push(nId);
                        }
                    }
                }

                if (isPureFriendlyCavity && cavityNodes.length >= 1) {
                    if (cavityNodes.length === 1) {
                        if (board.isTrueEye(cavityNodes[0], chain.playerId)) independentEyesCount++;
                    } else {
                        independentEyesCount++;
                    }
                }
            }

            if (independentEyesCount >= 2) { chain.isDead = false; continue; }

            // Evaluación de Influencia
            let myInf = 0;
            const enemyInf: Record<PlayerId, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

            for (const nodeId of chain.nodes) {
                const inf = influence.get(nodeId)!;
                myInf += inf[chain.playerId];
                for (const pid of [1, 2, 3, 4] as PlayerId[]) {
                    if (pid !== chain.playerId) enemyInf[pid] += inf[pid];
                }
            }

            let killerId: PlayerId | null = null;
            let maxEnemyInf = 0;
            for (const pid of [1, 2, 3, 4] as PlayerId[]) {
                if (enemyInf[pid] > maxEnemyInf) {
                    maxEnemyInf = enemyInf[pid];
                    killerId = pid;
                }
            }

            if (maxEnemyInf > myInf * 1.8) {
                chain.isDead = true;
                chain.killerId = killerId;
            } else if (chain.liberties.size <= 1 && maxEnemyInf > myInf * 1.0) {
                chain.isDead = true;
                chain.killerId = killerId;
            } else {
                chain.isDead = false;
            }
        }
    }
}
