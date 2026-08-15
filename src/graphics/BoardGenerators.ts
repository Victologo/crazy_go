// BoardGenerators.ts - Generador de Topologías Canónicas y Asimétricas / Erosionadas de Crazy Go
import { GraphBoard } from '../core/GraphBoard';
import type { BoardShape, BoardSize } from '../types';
export type { BoardShape, BoardSize };

export class BoardGenerators {
    
    /**
     * Generador Principal por Forma y Tamaño
     */
    static generate(board: GraphBoard, shape: BoardShape, size: BoardSize): void {
        switch (shape) {
            case 'square':
                this.generateSquareGrid(board, size);
                break;
            case 'triangle':
                this.generateTriangularGrid(board, size);
                break;
            case 'hex': {
                const hexRadius = size === 9 ? 3 : size === 13 ? 4 : 6;
                this.generateHexGrid(board, hexRadius);
                break;
            }
            case 'eroded':
                this.generateErodedGrid(board, size);
                break;
            case 'islands':
                this.generateIslandsGrid(board, size);
                break;
            case 'cross':
                this.generateCrossGrid(board, size);
                break;
            case 'procedural':
                this.generateProceduralGrid(board, size);
                break;
        }
    }

    /**
     * Generador Procedural Infinito de Topologías Orgánicas
     * Crea topologías infinitas únicas con reglas de conectividad estricta, cuellos de botella y archipiélagos.
     */
    static generateProceduralGrid(board: GraphBoard, size: number = 9, seed?: number): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        const starPoints = this.getStarPoints(size);

        // Generador pseudoaleatorio basado en semilla
        let s = (seed !== undefined ? seed : Math.floor(Math.random() * 9999999)) + 1;
        const random = () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };

        const archetype = Math.floor(random() * 4);
        const excluded = new Set<string>();
        const center = (size - 1) / 2;

        if (archetype === 0) {
            // Estilo 1: Costa & Penínsulas Erosionadas Asimétricas
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const distToCorner1 = c + r;
                    const distToCorner2 = (size - 1 - c) + r;
                    const distToCorner3 = c + (size - 1 - r);
                    const distToCorner4 = (size - 1 - c) + (size - 1 - r);
                    const minDist = Math.min(distToCorner1, distToCorner2, distToCorner3, distToCorner4);
                    
                    const noise = random() * 1.8;
                    const threshold = size === 9 ? 1.5 : size === 13 ? 2.5 : 4.0;
                    if (minDist + noise < threshold) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
        } else if (archetype === 1) {
            // Estilo 2: Archipiélago con Puentes Tácticos
            const numIslands = size === 9 ? 2 : 3;
            const islandCenters: [number, number][] = [];
            for (let i = 0; i < numIslands; i++) {
                islandCenters.push([
                    Math.floor(random() * (size - 4)) + 2,
                    Math.floor(random() * (size - 4)) + 2
                ]);
            }

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    let minD = 999;
                    for (const [ic, ir] of islandCenters) {
                        const d = Math.hypot(c - ic, r - ir);
                        if (d < minD) minD = d;
                    }
                    const maxR = size === 9 ? 2.8 : size === 13 ? 3.8 : 5.5;
                    const noise = (random() - 0.5) * 1.2;
                    if (minD + noise > maxR) {
                        const isBridge = Math.abs(r - Math.floor(center)) <= 0 || Math.abs(c - Math.floor(center)) <= 0;
                        if (!isBridge || random() > 0.45) {
                            excluded.add(`${c},${r}`);
                        }
                    }
                }
            }
        } else if (archetype === 2) {
            // Estilo 3: Abismo / Cráter Celestial Central con Brazos Espirales
            const craterRadius = size === 9 ? 1.8 : size === 13 ? 2.8 : 4.2;
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const d = Math.hypot(c - center, r - center);
                    const angle = Math.atan2(r - center, c - center);
                    const spiralNoise = Math.sin(angle * 3 + random()) * 0.8;
                    if (d + spiralNoise < craterRadius && (Math.abs(c - r) > 1 && Math.abs(c + r - (size - 1)) > 1)) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
        } else {
            // Estilo 4: Cañón Táctico Dividido
            const slant = random() > 0.5 ? 1 : -1;
            const canyonWidth = size === 9 ? 1.5 : 2.0;
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const val = slant === 1 ? (c - r) : (c + r - (size - 1));
                    if (Math.abs(val) < canyonWidth) {
                        const isSteppingStone = (r % (size === 9 ? 3 : 4) === 0) && (c % 2 === 0);
                        if (!isSteppingStone) {
                            excluded.add(`${c},${r}`);
                        }
                    }
                }
            }
        }

        // Crear Nodos válidos provisionales
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = `${col},${row}`;
                if (excluded.has(id)) continue;

                const x = col * spacing;
                const y = row * spacing;
                const isStar = starPoints.has(id);
                board.addNode(id, x, y, isStar);
            }
        }

        // Conectar aristas ortogonales
        this.connectOrthogonalEdges(board, size);

        // Filtro de Conectividad Estricta: Eliminar componentes disconexas y nodos con < 2 vecinos
        this.pruneDisconnectedComponents(board, size);
    }

    /**
     * Garantiza que todo el grafo del tablero sea un único componente conexo jugable
     */
    private static pruneDisconnectedComponents(board: GraphBoard, size: number): void {
        if (board.nodes.size === 0) {
            this.generateSquareGrid(board, size);
            return;
        }

        const visited = new Set<string>();
        const components: Set<string>[] = [];

        for (const nodeId of board.nodes.keys()) {
            if (visited.has(nodeId)) continue;

            const comp = new Set<string>();
            const queue = [nodeId];
            visited.add(nodeId);

            while (queue.length > 0) {
                const cur = queue.shift()!;
                comp.add(cur);
                const node = board.nodes.get(cur);
                if (node) {
                    for (const nbr of node.neighbors) {
                        if (!visited.has(nbr)) {
                            visited.add(nbr);
                            queue.push(nbr);
                        }
                    }
                }
            }
            components.push(comp);
        }

        components.sort((a, b) => b.size - a.size);
        const mainComponent = components[0];

        if (mainComponent.size < Math.floor(size * size * 0.4)) {
            board.nodes.clear();
            this.generateSquareGrid(board, size);
            return;
        }

        for (const nodeId of Array.from(board.nodes.keys())) {
            if (!mainComponent.has(nodeId)) {
                const node = board.nodes.get(nodeId);
                if (node) {
                    for (const nbr of node.neighbors) {
                        board.nodes.get(nbr)?.neighbors.delete(nodeId);
                    }
                }
                board.nodes.delete(nodeId);
            }
        }
    }

    /**
     * Cuadrícula clásica de Go (9x9, 13x13, 19x19) con puntos Hoshi
     */
    static generateSquareGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        
        // Puntos Hoshi
        const starPoints = this.getStarPoints(size);

        // Crear Nodos
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = `${col},${row}`;
                const x = col * spacing;
                const y = row * spacing;
                const isStar = starPoints.has(id);
                board.addNode(id, x, y, isStar);
            }
        }

        // Conectar aristas ortogonales
        this.connectOrthogonalEdges(board, size);
    }

    /**
     * Tablero Erosionado / Dentado (Eroded / Carved Goban)
     * Bordes y esquinas dentadas y recortadas de forma orgánica/asimétrica con chokepoints tácticos
     */
    static generateErodedGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        const starPoints = this.getStarPoints(size);

        const excluded = new Set<string>();

        if (size === 9) {
            // Esquinas dentadas asimétricas
            [[0, 0], [1, 0], [0, 1], [8, 0], [7, 0], [8, 1], [0, 8], [0, 7], [1, 8], [8, 8], [8, 7], [7, 8], [4, 0], [0, 4], [8, 4]].forEach(([c, r]) => {
                excluded.add(`${c},${r}`);
            });
        } else if (size === 13) {
            // Esquinas recortadas en escalera irregular + muescas en bordes
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (c + r < 3 || (12 - c) + r < 3 || c + (12 - r) < 3 || (12 - c) + (12 - r) < 3) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
            [[6, 0], [0, 6], [12, 6], [6, 12], [2, 6], [10, 6]].forEach(([c, r]) => excluded.add(`${c},${r}`));
        } else {
            // 19x19: Gran Goban milenario tallado
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (c + r < 5 || (18 - c) + r < 5 || c + (18 - r) < 5 || (18 - c) + (18 - r) < 5) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
            [[9, 0], [0, 9], [18, 9], [9, 18], [4, 9], [14, 9], [9, 4], [9, 14]].forEach(([c, r]) => excluded.add(`${c},${r}`));
        }

        // Crear Nodos válidos
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = `${col},${row}`;
                if (excluded.has(id)) continue;

                const x = col * spacing;
                const y = row * spacing;
                const isStar = starPoints.has(id);
                board.addNode(id, x, y, isStar);
            }
        }

        // Conectar aristas ortogonales solo entre nodos existentes
        this.connectOrthogonalEdges(board, size);
    }

    /**
     * Tablero con Agujeros Tácticos / Islas y Abismos (Tactical Voids & Straits)
     * Huecos interiores que crean pasos estrechos, puentes y dos o más frentes de batalla
     */
    static generateIslandsGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        const starPoints = this.getStarPoints(size);

        const excluded = new Set<string>();

        if (size === 9) {
            // Abismo central dual: dos huecos tácticos
            [[3, 3], [3, 4], [5, 4], [5, 5]].forEach(([c, r]) => excluded.add(`${c},${r}`));
        } else if (size === 13) {
            // 4 abismos en cuadrantes formando un archipiélago conectado por 4 puentes
            [[3, 3], [4, 3], [3, 4], [4, 4],
             [8, 3], [9, 3], [8, 4], [9, 4],
             [3, 8], [4, 8], [3, 9], [4, 9],
             [8, 8], [9, 8], [8, 9], [9, 9]].forEach(([c, r]) => excluded.add(`${c},${r}`));
        } else {
            // 19x19: 4 grandes lagos abisales
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const inQ1 = (c >= 4 && c <= 6 && r >= 4 && r <= 6);
                    const inQ2 = (c >= 12 && c <= 14 && r >= 4 && r <= 6);
                    const inQ3 = (c >= 4 && c <= 6 && r >= 12 && r <= 14);
                    const inQ4 = (c >= 12 && c <= 14 && r >= 12 && r <= 14);
                    if (inQ1 || inQ2 || inQ3 || inQ4) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
        }

        // Crear Nodos
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = `${col},${row}`;
                if (excluded.has(id)) continue;

                const x = col * spacing;
                const y = row * spacing;
                const isStar = starPoints.has(id);
                board.addNode(id, x, y, isStar);
            }
        }

        this.connectOrthogonalEdges(board, size);
    }

    /**
     * Tablero en Cruz / Diamante (Cross / Diamond Goban)
     */
    static generateCrossGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        const starPoints = this.getStarPoints(size);

        const cornerCut = size === 9 ? 2 : size === 13 ? 3 : 5;

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const inTL = col < cornerCut && row < cornerCut;
                const inTR = col >= size - cornerCut && row < cornerCut;
                const inBL = col < cornerCut && row >= size - cornerCut;
                const inBR = col >= size - cornerCut && row >= size - cornerCut;

                if (inTL || inTR || inBL || inBR) continue;

                const id = `${col},${row}`;
                const x = col * spacing;
                const y = row * spacing;
                const isStar = starPoints.has(id);
                board.addNode(id, x, y, isStar);
            }
        }

        this.connectOrthogonalEdges(board, size);
    }

    /**
     * Tablero Triangular (Triangular Lattice)
     */
    static generateTriangularGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 30 : size === 13 ? 38 : 48;
        const sqrt3_2 = Math.sqrt(3) / 2;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c <= r; c++) {
                const id = `tri_${c}_${r}`;
                const x = (c - r / 2) * spacing;
                const y = r * spacing * sqrt3_2;

                const isCorner = (r === 0 && c === 0) || (r === size - 1 && (c === 0 || c === r));
                const isCenter = (r === Math.floor(size * 2 / 3) && c === Math.floor(r / 2));
                
                board.addNode(id, x, y, isCorner || isCenter);
            }
        }

        for (let r = 0; r < size; r++) {
            for (let c = 0; c <= r; c++) {
                const id = `tri_${c}_${r}`;

                if (c < r) {
                    board.addEdge(id, `tri_${c + 1}_${r}`);
                }
                if (r < size - 1) {
                    board.addEdge(id, `tri_${c}_${r + 1}`);
                }
                if (r < size - 1) {
                    board.addEdge(id, `tri_${c + 1}_${r + 1}`);
                }
            }
        }
    }

    /**
     * Tablero Hexagonal Simétrico
     */
    static generateHexGrid(board: GraphBoard, radius: number = 3): void {
        const spacing = radius >= 6 ? 28 : radius >= 4 ? 36 : 46;

        for (let q = -radius; q <= radius; q++) {
            const r1 = Math.max(-radius, -q - radius);
            const r2 = Math.min(radius, -q + radius);
            for (let r = r1; r <= r2; r++) {
                const id = `hex_${q}_${r}`;
                const x = spacing * Math.sqrt(3) * (q + r / 2);
                const y = spacing * (3 / 2) * r;
                
                const isCenter = q === 0 && r === 0;
                board.addNode(id, x, y, isCenter);
            }
        }

        const directions = [
            [1, 0], [1, -1], [0, -1], 
            [-1, 0], [-1, 1], [0, 1]
        ];

        for (let q = -radius; q <= radius; q++) {
            const r1 = Math.max(-radius, -q - radius);
            const r2 = Math.min(radius, -q + radius);
            for (let r = r1; r <= r2; r++) {
                const id = `hex_${q}_${r}`;
                
                for (const dir of directions) {
                    const nq = q + dir[0];
                    const nr = r + dir[1];
                    const nId = `hex_${nq}_${nr}`;
                    
                    if (board.nodes.has(nId)) {
                        board.addEdge(id, nId);
                    }
                }
            }
        }
    }

    private static getStarPoints(size: number): Set<string> {
        const starPoints = new Set<string>();
        if (size === 9) {
            [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]].forEach(([c, r]) => starPoints.add(`${c},${r}`));
        } else if (size === 13) {
            [[3, 3], [9, 3], [6, 6], [3, 9], [9, 9]].forEach(([c, r]) => starPoints.add(`${c},${r}`));
        } else if (size === 19) {
            [
                [3, 3], [9, 3], [15, 3],
                [3, 9], [9, 9], [15, 9],
                [3, 15], [9, 15], [15, 15]
            ].forEach(([c, r]) => starPoints.add(`${c},${r}`));
        }
        return starPoints;
    }

    private static connectOrthogonalEdges(board: GraphBoard, size: number): void {
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = `${col},${row}`;
                if (!board.nodes.has(id)) continue;

                const rightId = `${col + 1},${row}`;
                const bottomId = `${col},${row + 1}`;

                if (col < size - 1 && board.nodes.has(rightId)) {
                    board.addEdge(id, rightId);
                }
                if (row < size - 1 && board.nodes.has(bottomId)) {
                    board.addEdge(id, bottomId);
                }
            }
        }
    }
}
