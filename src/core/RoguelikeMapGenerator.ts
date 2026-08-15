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
        const nodesMap = new Map<string, MapNode>();
        const tiers: MapNode[][] = [];

        const shapes: BoardShape[] = ['square', 'eroded', 'islands', 'triangle', 'hex', 'cross'];
        const sizes: BoardSize[] = [9, 13, 19];

        // Definición de la topología del grafo por niveles del Acto Único
        interface NodeSpec {
            id: string;
            colIndex: number;
            type: MapNodeType;
            x: number; // Porcentaje horizontal
            y: number; // Coordenada vertical en px
            nextIds: string[];
        }

        const tierSpecs: NodeSpec[][] = [
            // Tier 0 (Inicio - 2 Opciones iniciales: Batalla vs Mercader)
            [
                { id: '0-0', colIndex: 0, type: 'battle', x: 36, y: 700, nextIds: ['1-0'] },
                { id: '0-1', colIndex: 1, type: 'shop',   x: 64, y: 700, nextIds: ['1-1'] }
            ],
            // Tier 1 (Carriles paralelos independientes)
            [
                { id: '1-0', colIndex: 0, type: 'battle', x: 36, y: 570, nextIds: ['2-0'] },
                { id: '1-1', colIndex: 1, type: 'shrine', x: 64, y: 570, nextIds: ['2-0'] }
            ],
            // Tier 2 (Punto de Convergencia - Batalla de Go)
            [
                { id: '2-0', colIndex: 0, type: 'battle', x: 50, y: 440, nextIds: ['3-0', '3-1'] }
            ],
            // Tier 3 (Nueva Bifurcación: Santuario Místico vs Batalla de Go)
            [
                { id: '3-0', colIndex: 0, type: 'shrine', x: 36, y: 310, nextIds: ['4-0', '4-1'] },
                { id: '3-1', colIndex: 1, type: 'battle', x: 64, y: 310, nextIds: ['4-1', '4-2'] }
            ],
            // Tier 4 (3 Caminos de Especialización: Bazar, Meditación, Batalla)
            [
                { id: '4-0', colIndex: 0, type: 'shop',   x: 24, y: 180, nextIds: ['5-0'] },
                { id: '4-1', colIndex: 1, type: 'rest',   x: 50, y: 180, nextIds: ['5-0'] },
                { id: '4-2', colIndex: 2, type: 'battle', x: 76, y: 180, nextIds: ['5-0'] }
            ],
            // Tier 5 (Jefe Final del Goban)
            [
                { id: '5-0', colIndex: 0, type: 'boss',   x: 50, y: 60,  nextIds: [] }
            ]
        ];

        for (let tier = 0; tier < tierSpecs.length; tier++) {
            const specList = tierSpecs[tier];
            const tierNodes: MapNode[] = [];

            for (const spec of specList) {
                const { title, icon, description } = this.getNodeMeta(spec.type, tier);
                let battleConfig: StageBattleConfig | undefined = undefined;

                if (spec.type === 'battle' || spec.type === 'boss') {
                    battleConfig = this.generateBattleConfig(spec.type, tier, difficulty, shapes, sizes);
                }

                const node: MapNode = {
                    id: spec.id,
                    tier,
                    colIndex: spec.colIndex,
                    type: spec.type,
                    title,
                    icon,
                    description,
                    status: tier === 0 ? 'available' : 'locked', // Nodos de inicio disponibles
                    battleConfig,
                    nextConnectedNodeIds: spec.nextIds,
                    x: spec.x,
                    y: spec.y
                };

                nodesMap.set(spec.id, node);
                tierNodes.push(node);
            }
            tiers.push(tierNodes);
        }

        return {
            nodes: nodesMap,
            tiers,
            startNodeId: '0-0',
            bossNodeId: '5-0'
        };
    }

    private static getNodeMeta(type: MapNodeType, tier: number): { title: string; icon: string; description: string } {
        switch (type) {
            case 'battle':
                return {
                    title: `Batalla de Go (Ronda ${tier + 1})`,
                    icon: '⚔️',
                    description: 'Enfréntate a un rival de Go en un tablero asimétrico. Gana Magatamas y Hechizos.'
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
                    description: 'Descansa para recuperar usos de hechizos o medita para ganar +1.5 Komi permanente.'
                };
            case 'shop':
                return {
                    title: 'Mercader de Go',
                    icon: '🛒',
                    description: 'Intercambia tus Magatamas por hechizos (Meteoritos, Rebobinar, Escudos, Veneno).'
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
        difficulty: RogueliteDifficulty,
        shapes: BoardShape[], 
        _sizes: BoardSize[]
    ): StageBattleConfig {
        let aiDifficulty: AIDifficulty = 'easy';
        let rankLabel = '30 Kyu';
        let size: BoardSize = 9;
        let shape: BoardShape = 'square';
        let goldReward = 30 + tier * 15;

        // Dificultad escalada paso a paso según la selección y el tier
        if (difficulty === 'easy') {
            const ranks = ['30 Kyu', '27 Kyu', '25 Kyu', '24 Kyu', '22 Kyu', '👑 20 Kyu'];
            rankLabel = ranks[tier] || '25 Kyu';
            aiDifficulty = tier >= 4 ? 'medium' : 'easy';
            size = tier >= 4 ? 13 : 9;
            shape = tier === 0 ? 'square' : shapes[tier % shapes.length];
        } else if (difficulty === 'normal') {
            const ranks = ['22 Kyu', '18 Kyu', '15 Kyu', '12 Kyu', '10 Kyu', '👑 8 Kyu'];
            rankLabel = ranks[tier] || '15 Kyu';
            aiDifficulty = tier >= 4 ? 'hard' : 'medium';
            size = tier >= 4 ? 13 : (tier >= 2 ? 13 : 9);
            shape = shapes[tier % shapes.length];
        } else if (difficulty === 'hard') {
            const ranks = ['8 Kyu', '6 Kyu', '4 Kyu', '2 Kyu', '1 Kyu', '👑 1 Dan'];
            rankLabel = ranks[tier] || '4 Kyu';
            aiDifficulty = tier >= 4 ? 'dan' : 'hard';
            size = tier >= 3 ? 19 : 13;
            shape = shapes[tier % shapes.length];
        } else {
            const ranks = ['1 Dan', '2 Dan', '3 Dan', '4 Dan', '5 Dan', '👑 6 Dan Pro'];
            rankLabel = ranks[tier] || '3 Dan';
            aiDifficulty = 'dan';
            size = 19;
            shape = shapes[tier % shapes.length];
        }

        if (type === 'boss') {
            goldReward += 100;
            size = difficulty === 'easy' ? 13 : 19;
            shape = 'eroded';
        }

        const regularEnemies = [
            // 5 Sabios de la Niebla (Fondos transparentes integrados)
            { name: 'Kenshin el Sabio', image: '/enemies/sage_1.png', icon: '📜' },
            { name: 'Nobunaga el Sabio', image: '/enemies/sage_2.png', icon: '📜' },
            { name: 'Masashi el Sabio', image: '/enemies/sage_3.png', icon: '📜' },
            { name: 'Tetsuo el Sabio', image: '/enemies/sage_4.png', icon: '📜' },
            { name: 'Genzaburo el Sabio', image: '/enemies/sage_5.png', icon: '📜' },
            // 5 Monjes Novatos (Fondos transparentes integrados)
            { name: 'Joven Ren', image: '/enemies/monk_1.png', icon: '🧘' },
            { name: 'Joven Hiro', image: '/enemies/monk_2.png', icon: '🧘' },
            { name: 'Joven Sora', image: '/enemies/monk_3.png', icon: '🧘' },
            { name: 'Joven Daiki', image: '/enemies/monk_4.png', icon: '🧘' },
            { name: 'Joven Kazuki', image: '/enemies/monk_5.png', icon: '🧘' },
            // Maestros de Batalla del Clan
            { name: 'Estratega del Clan', image: '/enemies/samurai.png', icon: '⚔️' }
        ];

        let enemyName = '';
        let enemyImage = '/enemies/monk_1.png';
        let enemyIcon = '🧘';

        if (type === 'boss') {
            enemyName = '🐉 Gran Dragón Sabio Gris';
            enemyImage = '/enemies/boss.png';
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
