// core/RoguelikeMapGenerator.ts - Generador Procedural del Mapa del Acto Único para Crazy Go
import type { 
    BoardShape, 
    BoardSize, 
    AIDifficulty, 
    RogueliteDifficulty 
} from '../types';

export type MapNodeType = 'battle' | 'shrine' | 'rest' | 'shop' | 'boss';
export type MapNodeStatus = 'locked' | 'available' | 'completed' | 'current';

export interface StageBattleConfig {
    enemyName: string;
    rankLabel: string;
    aiDifficulty: AIDifficulty;
    shape: BoardShape;
    size: BoardSize;
    goldReward: number;
    enemyImage: string;
    enemyIcon: string;
}

export interface MapNode {
    id: string;
    tier: number;
    colIndex: number;
    type: MapNodeType;
    title: string;
    icon: string;
    description: string;
    status: MapNodeStatus;
    battleConfig?: StageBattleConfig;
    nextConnectedNodeIds: string[];
    x: number; // Coordenada X porcentual (20% - 80%)
    y: number; // Coordenada Y en px (de abajo hacia arriba)
}

export interface RoguelikeMap {
    nodes: Map<string, MapNode>;
    tiers: MapNode[][];
    startNodeId: string;
    bossNodeId: string;
}

export class RoguelikeMapGenerator {
    /**
     * Genera el árbol procedural de 6 niveles (Tiers 0 a 5) en un único mapa continuo que culmina en el Jefe Final.
     */
    public static generateMap(difficulty: RogueliteDifficulty): RoguelikeMap {
        const shapes: BoardShape[] = ['square', 'volcano', 'sky', 'oni', 'eroded', 'islands_v1', 'islands_v2', 'cross', 'hourglass', 'geode', 'spiral', 'rings', 'star_5', 'star_6', 'triangle', 'hex'];
        const sizes: BoardSize[] = [9, 13, 19];

        // Longitud del mapa: entre 6 y 8 filas/pisos totales (6, 7 u 8 nodos por camino hasta el Boss)
        const NUM_TIERS = 6 + Math.floor(Math.random() * 3); 
        const NUM_LANES = 4; // Máximo 4 columnas horizontales (0, 1, 2, 3) -> Columnas 1, 2, 3, 4

        // Generar coordenadas Y dinámicas (Boss siempre arriba en y=60, base abajo)
        const stepY = 125;
        const tierY: number[] = [];
        for (let t = 0; t < NUM_TIERS; t++) {
            tierY.push(60 + (NUM_TIERS - 1 - t) * stepY);
        }

        // Estructuras de aristas y nodos activos
        const edges: Array<Array<{ from: number; to: number }>> = Array.from({ length: NUM_TIERS - 1 }, () => []);
        const activeNodes: Array<Set<number>> = Array.from({ length: NUM_TIERS }, () => new Set<number>());

        // El Jefe Final está en el último Tier (centrado en el Goban en x=50%)
        activeNodes[NUM_TIERS - 1].add(0);

        // Validación matemática de cruces en X en el mismo nivel
        const crossesAnyEdge = (tier: number, fromLane: number, toLane: number): boolean => {
            for (const e of edges[tier]) {
                if (fromLane < e.from && toLane > e.to) return true;
                if (fromLane > e.from && toLane < e.to) return true;
            }
            return false;
        };

        // Validación para evitar redundancia (dos nodos del mismo nivel con idénticos destinos)
        const createsRedundancy = (tier: number, fromLane: number, toLane: number): boolean => {
            const currentTargets = new Set<number>();
            for (const e of edges[tier]) {
                if (e.from === fromLane) currentTargets.add(e.to);
            }
            currentTargets.add(toLane);

            for (const otherLane of activeNodes[tier]) {
                if (otherLane === fromLane) continue;
                const otherTargets = new Set<number>();
                for (const e of edges[tier]) {
                    if (e.from === otherLane) otherTargets.add(e.to);
                }
                if (currentTargets.size > 1 && otherTargets.size > 1 && currentTargets.size === otherTargets.size) {
                    let allSame = true;
                    for (const t of currentTargets) {
                        if (!otherTargets.has(t)) { allSame = false; break; }
                    }
                    if (allSame) return true;
                }
            }
            return false;
        };

        // 1. INICIO DEL MAPA: Siempre 2 nodos de combate iniciales en columnas 2 y 3 (Lanes 1 y 2 / 40% y 60%)
        const startLanes = [1, 2];
        activeNodes[0].add(startLanes[0]);
        activeNodes[0].add(startLanes[1]);

        // 2. TIER 0 -> TIER 1: Conexión directa 1 a 1 sin bifurcaciones prematuras (un solo camino por nodo)
        edges[0].push({ from: 1, to: 1 });
        edges[0].push({ from: 2, to: 2 });
        activeNodes[1].add(1);
        activeNodes[1].add(2);

        // 3. TIER 1 -> TIER 2: Continuación directa (1 a 1) antes de abrir bifurcaciones o convergencias
        edges[1].push({ from: 1, to: 1 });
        edges[1].push({ from: 2, to: 2 });
        activeNodes[2].add(1);
        activeNodes[2].add(2);

        // Función de peso/atracción para favorecer caminos centrados en las columnas 2 y 3 (carriles 1 y 2)
        const getLaneWeight = (from: number, to: number): number => {
            let weight = 1.0;
            // Mantenerse en el mismo carril (camino recto vertical)
            if (from === to) weight += 2.0;
            // Estar en carriles centrales (1 o 2)
            if (to === 1 || to === 2) weight += 1.5;
            // Si está en el borde exterior (0 o 3), alta tendencia a volver al centro
            if (from === 0 && to === 1) weight += 2.5;
            if (from === 3 && to === 2) weight += 2.5;
            return weight;
        };

        const pickWeightedTarget = (from: number, candidates: number[]): number => {
            if (candidates.length === 1) return candidates[0];
            const weights = candidates.map(c => getLaneWeight(from, c));
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);
            let randomVal = Math.random() * totalWeight;
            for (let idx = 0; idx < candidates.length; idx++) {
                randomVal -= weights[idx];
                if (randomVal <= 0) return candidates[idx];
            }
            return candidates[0];
        };

        // 4. BIFURCACIÓN O CONVERGENCIA A PARTIR DE TIER 2
        // A partir de Tier 2, los caminos pueden unirse en un solo nodo central (cuello de botella/tienda), bifurcarse o continuar
        const shouldConvergeAtTier3 = Math.random() < 0.40; // 40% de probabilidad de convergencia en Tier 3

        if (shouldConvergeAtTier3) {
            // Convergen en un solo nodo en Tier 3 (ej. carril 1)
            const convergenceLane = 1;
            edges[2].push({ from: 1, to: convergenceLane });
            edges[2].push({ from: 2, to: convergenceLane });
            activeNodes[3].add(convergenceLane);
        } else {
            // Bifurcación orgánica desde Tier 2
            // Carril 1 puede ir a 1 o abrirse a 0
            edges[2].push({ from: 1, to: 1 });
            activeNodes[3].add(1);
            if (Math.random() < 0.5) {
                edges[2].push({ from: 1, to: 0 });
                activeNodes[3].add(0);
            }

            // Carril 2 puede ir a 2 o abrirse a 3
            edges[2].push({ from: 2, to: 2 });
            activeNodes[3].add(2);
            if (Math.random() < 0.5) {
                edges[2].push({ from: 2, to: 3 });
                activeNodes[3].add(3);
            }
        }

        // 5. CARVADO DE CAMINOS PRINCIPALES DESDE TIER 3 HASTA EL BOSS
        const tier3Lanes = Array.from(activeNodes[3]).sort((a, b) => a - b);
        const NUM_MAIN_PATHS = Math.max(2, tier3Lanes.length);

        for (let p = 0; p < NUM_MAIN_PATHS; p++) {
            let currentLane = tier3Lanes[p % tier3Lanes.length];

            for (let t = 3; t < NUM_TIERS - 1; t++) {
                if (t === NUM_TIERS - 2) {
                    // Penúltimo Tier hacia el Boss (convergencia simétrica al Boss en to = 0)
                    if (!edges[t].some(e => e.from === currentLane && e.to === 0)) {
                        edges[t].push({ from: currentLane, to: 0 });
                    }
                    activeNodes[t + 1].add(0);
                    currentLane = 0;
                } else {
                    const existingOutgoing = edges[t].filter(e => e.from === currentLane);
                    if (existingOutgoing.length >= 2) {
                        currentLane = existingOutgoing[Math.floor(Math.random() * existingOutgoing.length)].to;
                        continue;
                    }

                    // Candidatos adyacentes válidos sin cruces
                    const candidates = [currentLane, currentLane - 1, currentLane + 1]
                        .filter(l => l >= 0 && l < NUM_LANES)
                        .filter(l => !crossesAnyEdge(t, currentLane, l))
                        .filter(l => !createsRedundancy(t, currentLane, l));

                    let nextLane: number;
                    if (candidates.length > 0) {
                        nextLane = pickWeightedTarget(currentLane, candidates);
                    } else {
                        const validFallback = [currentLane, currentLane === 0 ? 1 : (currentLane === 3 ? 2 : currentLane - 1), currentLane + 1]
                            .filter(l => l >= 0 && l < NUM_LANES)
                            .find(l => !crossesAnyEdge(t, currentLane, l));
                        nextLane = validFallback !== undefined ? validFallback : currentLane;
                    }

                    if (!edges[t].some(e => e.from === currentLane && e.to === nextLane)) {
                        edges[t].push({ from: currentLane, to: nextLane });
                    }
                    activeNodes[t + 1].add(nextLane);
                    currentLane = nextLane;
                }
            }
        }

        // 6. ASEGURAR CONEXIONES COMPLETAS Y SIN CALLEJONES SIN SALIDA (DESDE TIER 2 EN ADELANTE)
        for (let t = 2; t < NUM_TIERS - 1; t++) {
            for (const lane of activeNodes[t]) {
                const hasOutgoing = edges[t].some(e => e.from === lane);
                if (!hasOutgoing) {
                    if (t === NUM_TIERS - 2) {
                        edges[t].push({ from: lane, to: 0 });
                        activeNodes[t + 1].add(0);
                    } else {
                        const candidates = [lane, lane === 0 ? 1 : (lane === 3 ? 2 : 1), lane === 1 ? 2 : 1]
                            .filter(l => l >= 0 && l < NUM_LANES)
                            .filter(l => !crossesAnyEdge(t, lane, l));
                        const target = candidates.length > 0 ? pickWeightedTarget(lane, candidates) : lane;
                        edges[t].push({ from: lane, to: target });
                        activeNodes[t + 1].add(target);
                    }
                }
            }
        }

        // 5. MAPEAR IDS DE NODOS
        const laneToNodeId = new Map<string, string>();
        const tiers: MapNode[][] = [];
        const nodesMap = new Map<string, MapNode>();

        for (let t = 0; t < NUM_TIERS; t++) {
            const sortedLanes = Array.from(activeNodes[t]).sort((a, b) => a - b);
            sortedLanes.forEach((lane, colIdx) => {
                laneToNodeId.set(`${t}-${lane}`, `${t}-${colIdx}`);
            });
        }

        // 6. ASIGNACIÓN INICIAL DE TIPOS DE NODOS CON RITMO ROGUELIKE ÓPTIMO
        // Regla de Ritmo: la alternancia más común es Pelea -> Santuario/Tienda -> Pelea -> Santuario/Tienda/Descanso...
        const nodeTypes = new Map<string, MapNodeType>();

        for (let t = 0; t < NUM_TIERS; t++) {
            const sortedLanes = Array.from(activeNodes[t]).sort((a, b) => a - b);

            for (const lane of sortedLanes) {
                const nodeId = laneToNodeId.get(`${t}-${lane}`)!;

                if (t === NUM_TIERS - 1) {
                    nodeTypes.set(nodeId, 'boss');
                } else if (t === 0) {
                    // Ambos nodos de inicio son siempre de pelea
                    nodeTypes.set(nodeId, 'battle');
                } else if (t === 1) {
                    // Tier 1 (justo tras el inicio): muy común encontrar Santuario, Tienda o Pelea alternativa
                    const roll = Math.random();
                    if (roll < 0.45) nodeTypes.set(nodeId, 'shrine');
                    else if (roll < 0.80) nodeTypes.set(nodeId, 'shop');
                    else nodeTypes.set(nodeId, 'battle');
                } else if (t === NUM_TIERS - 2) {
                    // Penúltimo Tier antes del Jefe Final: descanso previo o santuario
                    const roll = Math.random();
                    if (roll < 0.50) nodeTypes.set(nodeId, 'rest');
                    else if (roll < 0.80) nodeTypes.set(nodeId, 'shrine');
                    else nodeTypes.set(nodeId, 'shop');
                } else {
                    // Tiers intermedios: distribución equilibrada
                    const roll = Math.random();
                    if (roll < 0.42) nodeTypes.set(nodeId, 'battle');
                    else if (roll < 0.70) nodeTypes.set(nodeId, 'shrine');
                    else if (roll < 0.88) nodeTypes.set(nodeId, 'shop');
                    else nodeTypes.set(nodeId, 'rest');
                }
            }
        }

        // 7. VALIDACIÓN ESTRICTA DE PACING: NUNCA MÁS DE 2 PELEAS SEGUIDAS EN CUALQUIER RUTA
        const enforceNoThreeConsecutiveBattles = () => {
            for (let t = 0; t < NUM_TIERS - 2; t++) {
                for (const lane of activeNodes[t]) {
                    const currentId = laneToNodeId.get(`${t}-${lane}`)!;
                    if (nodeTypes.get(currentId) !== 'battle') continue;

                    for (const e of edges[t]) {
                        if (e.from === lane) {
                            const nextId = laneToNodeId.get(`${t + 1}-${e.to}`)!;
                            if (nodeTypes.get(nextId) === 'battle') {
                                if (t + 1 < NUM_TIERS - 2) {
                                    for (const e2 of edges[t + 1]) {
                                        if (e2.from === e.to) {
                                            const thirdId = laneToNodeId.get(`${t + 2}-${e2.to}`)!;
                                            if (nodeTypes.get(thirdId) === 'battle') {
                                                nodeTypes.set(thirdId, Math.random() < 0.6 ? 'shrine' : 'shop');
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        enforceNoThreeConsecutiveBattles();

        // Función para calcular posiciones X simétricas y perfectamente centradas según la cantidad de nodos del tier
        const getTierXPositions = (count: number): number[] => {
            switch (count) {
                case 1: return [50];
                case 2: return [38, 62];
                case 3: return [26, 50, 74];
                case 4: return [20, 40, 60, 80];
                default: {
                    if (count <= 1) return [50];
                    const spacing = 60 / (count - 1);
                    return Array.from({ length: count }, (_, i) => 20 + i * spacing);
                }
            }
        };

        // 8. CONSTRUCCIÓN DE OBJETOS FINALES MapNode CON CENTRADO SIMÉTRICO DINÁMICO
        for (let t = 0; t < NUM_TIERS; t++) {
            const tierNodes: MapNode[] = [];
            const sortedLanes = Array.from(activeNodes[t]).sort((a, b) => a - b);
            const tierXPositions = getTierXPositions(sortedLanes.length);

            sortedLanes.forEach((lane, colIdx) => {
                const nodeId = laneToNodeId.get(`${t}-${lane}`)!;
                const type = nodeTypes.get(nodeId) || 'battle';

                // Conexiones salientes hacia el siguiente tier
                const nextConnectedNodeIds: string[] = [];
                if (t < NUM_TIERS - 1) {
                    for (const e of edges[t]) {
                        if (e.from === lane) {
                            const targetId = laneToNodeId.get(`${t + 1}-${e.to}`);
                            if (targetId && !nextConnectedNodeIds.includes(targetId)) {
                                nextConnectedNodeIds.push(targetId);
                            }
                        }
                    }
                }

                const { title, icon, description } = this.getNodeMeta(type, t);
                let battleConfig: StageBattleConfig | undefined = undefined;

                if (type === 'battle' || type === 'boss') {
                    battleConfig = this.generateBattleConfig(type, t, NUM_TIERS, difficulty, shapes, sizes);
                }

                // Coordenada X perfectamente centrada en el 50% según la cantidad de nodos del tier
                const x = tierXPositions[colIdx] ?? 50;

                const node: MapNode = {
                    id: nodeId,
                    tier: t,
                    colIndex: colIdx,
                    type,
                    title,
                    icon,
                    description,
                    status: t === 0 ? 'available' : 'locked',
                    battleConfig,
                    nextConnectedNodeIds,
                    x,
                    y: tierY[t]
                };

                nodesMap.set(nodeId, node);
                tierNodes.push(node);
            });

            tiers.push(tierNodes);
        }

        return {
            nodes: nodesMap,
            tiers,
            startNodeId: '0-0',
            bossNodeId: `${NUM_TIERS - 1}-0`
        };
    }

    private static getNodeMeta(type: MapNodeType, tier: number): { title: string; icon: string; description: string } {
        switch (type) {
            case 'battle':
                return {
                    title: `Batalla de Go (Ronda ${tier + 1})`,
                    icon: '⚔️',
                    description: 'Enfréntate a un rival de Go en un tablero asimétrico. Gana artefactos y pergaminos sagrados.'
                };
            case 'shrine':
                return {
                    title: 'Santuario Místico',
                    icon: '⛩️',
                    description: 'Recibe una bendición espiritual o restaura la Habilidad Activa de tu Campeón.'
                };
            case 'rest':
                return {
                    title: 'Zona de Meditación',
                    icon: '🏕️',
                    description: 'Descansa para recuperar usos de hechizos o forja pergaminos y fichas poliminó.'
                };
            case 'shop':
                return {
                    title: 'Mercader de Go',
                    icon: '🛒',
                    description: 'Elige artefactos y pergaminos sagrados para potenciar tu expedición.'
                };
            case 'boss':
                return {
                    title: '🐉 Gran Dragón Sabio Gris (Jefe Final)',
                    icon: '🐉',
                    description: 'El desafío definitivo del Goban. Un anciano dragón sabio de escamas grisáceas y bigotes que calcina cuadrantes del 25% del tablero.'
                };
        }
    }

    private static generateBattleConfig(
        type: MapNodeType, 
        tier: number, 
        totalTiers: number,
        difficulty: RogueliteDifficulty,
        shapes: BoardShape[], 
        _sizes: BoardSize[]
    ): StageBattleConfig {
        let aiDifficulty: AIDifficulty = 'easy';
        let rankLabel = '30 Kyu';
        let size: BoardSize = 9;
        let shape: BoardShape = 'square';
        let goldReward = 30 + tier * 15;

        // Progresión Canónica de Tamaño de Tablero en Roguelike:
        // Tier 0 y 1: 9x9 (Inicio)
        // Tiers intermedios (ej. 2, 3 o 2, 3, 4): 13x13 (Medio)
        // Tiers finales y Jefe Boss: 19x19
        const midCutoff = Math.floor((totalTiers - 2) / 2) + 1;
        if (tier <= 1) {
            size = 9;
        } else if (tier <= midCutoff) {
            size = 13;
        } else {
            size = 19;
        }

        // Dificultad escalada de IA y Rangos según la selección de dificultad
        // Se suma 1 rango (1 kyu/dan) por cada tier
        const kyuDanToString = (val: number): string => {
            if (val <= 30) return `${31 - val}k`;
            return `${val - 30}d`;
        };

        // Valores iniciales (1 a 40, donde 1 = 30k, 16 = 15k, 31 = 1d)
        // Fácil empieza en 26k (valor 5)
        // Normal empieza en 14k (valor 17)
        // Difícil empieza en 3k (valor 28)
        // Extremo empieza en 7d (valor 37)
        let baseValue = 5; 
        if (difficulty === 'easy') baseValue = 5;
        else if (difficulty === 'normal') baseValue = 17;
        else if (difficulty === 'hard') baseValue = 28;
        else baseValue = 37;

        // Sumar 1 nivel por cada Tier
        const currentLvlValue = Math.min(40, baseValue + tier);
        
        const rankStr = kyuDanToString(currentLvlValue);
        rankLabel = type === 'boss' ? `👑 ${rankStr} (Jefe)` : `${rankStr}`;
        aiDifficulty = rankStr;
        shape = shapes[tier % shapes.length];

        if (type === 'boss') {
            goldReward += 100;
            size = 19;
            shape = 'square';
        }

        const regularEnemies = [
            { name: 'Monje Sabio', image: './enemies/sage_1.png', icon: '📜' }
        ];

        let enemyName = '';
        let enemyImage = './enemies/sage_1.png';
        let enemyIcon = '📜';

        if (type === 'boss') {
            enemyName = '🐉 Gran Dragón Sabio Gris';
            enemyImage = './enemies/boss.png';
            enemyIcon = '🐉';
        } else {
            // Elección totalmente equiprobable y aleatoria en cada casilla de batalla
            const randomEnemy = regularEnemies[Math.floor(Math.random() * regularEnemies.length)];
            enemyName = randomEnemy.name;
            enemyImage = randomEnemy.image;
            enemyIcon = randomEnemy.icon;
        }

        return {
            enemyName,
            rankLabel,
            aiDifficulty,
            shape,
            size,
            goldReward,
            enemyImage,
            enemyIcon
        };
    }
}
