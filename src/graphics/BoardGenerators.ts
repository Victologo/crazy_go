// BoardGenerators.ts - Generador de Topologías Canónicas y Asimétricas / Erosionadas de Crazy Go
import { GraphBoard } from '../core/GraphBoard';
import type { BoardShape, BoardSize } from '../types';
export type { BoardShape, BoardSize };

export class BoardGenerators {
    
    /**
     * Generador Principal por Forma y Tamaño
     */
    static generate(board: GraphBoard, shape: BoardShape, size: BoardSize, seed?: number): void {
        board.shape = shape;
        switch (shape) {
            case 'square':
                this.generateSquareGrid(board, size);
                break;
            case 'volcano':
                this.generateVolcanoGrid(board, size);
                break;
            case 'sky':
                this.generateSkyGrid(board, size);
                break;
            case 'oni':
                this.generateOniGrid(board, size);
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
            case 'islands_v1':
                this.generateIslandsV1Grid(board, size);
                break;
            case 'islands_v2':
                this.generateIslandsV2Grid(board, size);
                break;
            case 'cross':
                this.generateCrossGrid(board, size);
                break;
            case 'hourglass':
                this.generateHourglassGrid(board, size);
                break;
            case 'geode':
                this.generateGeodeGrid(board, size);
                break;
            case 'spiral':
                this.generateSpiralGrid(board, size);
                break;
            case 'rings':
                this.generateRingsGrid(board, size);
                break;
            case 'star_5':
                this.generateStar5Grid(board, size);
                break;
            case 'star_6':
                this.generateStar6Grid(board, size);
                break;
            case 'procedural':
                this.generateProceduralGrid(board, size, seed);
                break;
            default:
                this.generateSquareGrid(board, size);
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

        const archetype = Math.floor(random() * 8);
        const excluded = new Set<string>();
        const center = (size - 1) / 2;

        if (archetype === 0) {
            // Estilo 0: Anillos Concéntricos y Puertas Celestiales (Concentric Rings & Radial Bridges)
            const ring1 = size === 9 ? 1.5 : size === 13 ? 2.5 : 3.8;
            const ring2 = size === 9 ? 3.4 : size === 13 ? 4.8 : 7.2;
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const d = Math.hypot(c - center, r - center);
                    const isRadialBridge = Math.abs(c - r) <= 0.6 || Math.abs(c + r - (size - 1)) <= 0.6 || Math.abs(c - center) <= 0.6 || Math.abs(r - center) <= 0.6;
                    const inRing1 = Math.abs(d - ring1) <= 0.8;
                    const inRing2 = Math.abs(d - ring2) <= 0.9;
                    const isCenter = d <= 0.8;
                    if (!isCenter && !inRing1 && !inRing2 && !isRadialBridge) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
        } else if (archetype === 1) {
            // Estilo 1: Galaxia Espiral Doble (Twin Spiral Galaxy Arms)
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const d = Math.hypot(c - center, r - center);
                    const angle = Math.atan2(r - center, c - center);
                    const spiral1 = Math.abs(d - (angle * 1.2 + 2.5));
                    const spiral2 = Math.abs(d - ((angle + Math.PI) * 1.2 + 2.5));
                    const isCore = d <= 1.2;
                    const isConnector = (r % 3 === 0 && d < size * 0.45);
                    if (!isCore && spiral1 > 0.85 && spiral2 > 0.85 && !isConnector) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
        } else if (archetype === 2) {
            // Estilo 2: Reloj de Arena Cuántico (Quantum Hourglass & Vortex)
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const dx = Math.abs(c - center);
                    const dy = Math.abs(r - center);
                    const maxAllowedX = dy * 0.9 + 0.8;
                    const isCentralChokepoint = dy <= 1.0 && dx <= 1.0;
                    if (dx > maxAllowedX && !isCentralChokepoint) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
        } else if (archetype === 3) {
            // Estilo 3: Tridente / Ypsilon Sagrada (Mystic Tri-Branch Sanctuary)
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const d = Math.hypot(c - center, r - center);
                    const angle = Math.atan2(r - center, c - center);
                    const branchDistance = Math.min(
                        Math.abs(Math.sin(angle * 1.5)),
                        Math.abs(Math.sin(angle * 1.5 + Math.PI / 3))
                    );
                    const isSanctuary = d <= 1.4;
                    const onBranch = branchDistance < 0.35 && d <= (size * 0.48);
                    if (!isSanctuary && !onBranch) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
        } else if (archetype === 4) {
            // Estilo 4: Diamante Fractal con Geoda Hueca (Fractured Hollow Diamond)
            const maxRadius = (size - 1) / 2 + 0.2;
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const manhattan = Math.abs(c - center) + Math.abs(r - center);
                    const d = Math.hypot(c - center, r - center);
                    const isOutside = manhattan > maxRadius * 1.25;
                    const isHollowCenter = d < (size === 9 ? 1.6 : size === 13 ? 2.4 : 3.6);
                    const isCrossBridge = Math.abs(c - center) <= 0.6 || Math.abs(r - center) <= 0.6;
                    if (isOutside || (isHollowCenter && !isCrossBridge)) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
        } else if (archetype === 5) {
            // Estilo 5: Archipiélago de Atolones Flotantes (Floating Atolls with Chokepoints)
            const numIslands = size === 9 ? 3 : 4;
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
                    const maxR = size === 9 ? 2.2 : size === 13 ? 3.0 : 4.5;
                    const isBridge = (r === Math.floor(center) && c % 2 === 0) || (c === Math.floor(center) && r % 2 === 0);
                    if (minD > maxR && !isBridge) {
                        excluded.add(`${c},${r}`);
                    }
                }
            }
        } else if (archetype === 6) {
            // Estilo 6: Cañón Asimétrico Zig-Zag (Meandering Canyon)
            const slant = random() > 0.5 ? 1 : -1;
            const canyonWidth = size === 9 ? 1.4 : 2.0;
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const wave = Math.sin(r * 0.8) * 1.5;
                    const val = slant === 1 ? (c - r + wave) : (c + r - (size - 1) + wave);
                    if (Math.abs(val) < canyonWidth) {
                        const isSteppingStone = (r % 3 === 0) && (c % 2 === 0);
                        if (!isSteppingStone) {
                            excluded.add(`${c},${r}`);
                        }
                    }
                }
            }
        } else {
            // Estilo 7: Costa Orgánica Perlin Caótica (Chaotic Organic Coastline)
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const distToCorner1 = c + r;
                    const distToCorner2 = (size - 1 - c) + r;
                    const distToCorner3 = c + (size - 1 - r);
                    const distToCorner4 = (size - 1 - c) + (size - 1 - r);
                    const minDist = Math.min(distToCorner1, distToCorner2, distToCorner3, distToCorner4);
                    
                    const noise = Math.sin(c * 0.9) * Math.cos(r * 0.9) * 2.5 + random() * 1.2;
                    const threshold = size === 9 ? 1.6 : size === 13 ? 2.8 : 4.2;
                    if (minDist + noise < threshold) {
                        excluded.add(`${c},${r}`);
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
     * Tablero Volcánico (9x9, 13x13, 19x19)
     * Cuadrícula canónica de Go con estética de cráteres volcánicos en las esquinas y peligro ambiental de erupción.
     */
    static generateVolcanoGrid(board: GraphBoard, size: number = 9): void {
        board.shape = 'volcano';
        this.generateSquareGrid(board, size);
    }

    /**
     * Tablero del Cielo (9x9, 13x13, 19x19)
     * Comienza como una cuadrícula canónica completa de Go del tamaño seleccionado (9x9, 13x13 o 19x19),
     * y cada pocos turnos caen 5 nuevos bloques cuadrados (2x2) del cielo expandiendo el goban indefinidamente hacia el exterior.
     */
    static generateSkyGrid(board: GraphBoard, size: number = 9): void {
        board.shape = 'sky';
        board.size = size;
        this.generateSquareGrid(board, size);
    }

    /**
     * Cuadrícula clásica de Go (9x9, 13x13, 19x19) con puntos Hoshi
     */
    static generateSquareGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : size === 9 ? 46 : 56;
        
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
    /**
     * Tablero Máscara Oni (25x25 Unificado con Cuernos, Ojos Huecos y Fauces del Abismo)
     * Siempre se genera con la silueta completa 25x25 independientemente del tamaño seleccionado
     */
    static generateOniGrid(board: GraphBoard, _size: number = 25): void {
        board.shape = 'oni';
        const size = 25;
        board.size = size;
        const spacing = 24; // Escala visual óptima (viewBox ~600x600)

        const starPoints = new Set<string>([
            '4,6', '20,6', '12,6',
            '4,12', '12,12', '20,12',
            '5,20', '12,20', '19,20',
            '12,23'
        ]);

        const excluded = new Set<string>();

        // 1. Vano exterior de cuernos (Outer upper corners above temples)
        for (let y = 0; y <= 4; y++) {
            excluded.add(`0,${y}`);
            excluded.add(`24,${y}`);
        }
        excluded.add('1,0'); excluded.add('1,1'); excluded.add('1,2');
        excluded.add('23,0'); excluded.add('23,1'); excluded.add('23,2');

        // 2. Hendidura central superior entre cuernos (Frente en V)
        for (let x = 6; x <= 18; x++) excluded.add(`${x},0`);
        for (let x = 6; x <= 18; x++) excluded.add(`${x},1`);
        for (let x = 7; x <= 17; x++) excluded.add(`${x},2`);
        for (let x = 8; x <= 16; x++) excluded.add(`${x},3`);
        for (let x = 10; x <= 14; x++) excluded.add(`${x},4`);
        for (let x = 11; x <= 13; x++) excluded.add(`${x},5`);

        // 3. Ojos Huecos del Demonio (3x2 cada ojo)
        for (let x = 6; x <= 8; x++) {
            excluded.add(`${x},8`);
            excluded.add(`${x},9`);
        }
        for (let x = 16; x <= 18; x++) {
            excluded.add(`${x},8`);
            excluded.add(`${x},9`);
        }

        // 4. Boca / Fauces del Oni (Mouth Void / Cavidad del Abismo Infinito)
        for (let x = 8; x <= 16; x++) excluded.add(`${x},16`);
        for (let x = 8; x <= 16; x++) excluded.add(`${x},17`);
        for (let x = 9; x <= 15; x++) excluded.add(`${x},18`);

        // 5. Barbilla y Mandíbula inferior (Escalonado de mandíbula hacia la barbilla)
        excluded.add('0,20'); excluded.add('24,20');
        for (let x = 0; x <= 1; x++) { excluded.add(`${x},21`); excluded.add(`${24 - x},21`); }
        for (let x = 0; x <= 2; x++) { excluded.add(`${x},22`); excluded.add(`${24 - x},22`); }
        for (let x = 0; x <= 4; x++) { excluded.add(`${x},23`); excluded.add(`${24 - x},23`); }
        for (let x = 0; x <= 6; x++) { excluded.add(`${x},24`); excluded.add(`${24 - x},24`); }

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

        // Conectar vecinos ortogonales
        this.connectOrthogonalEdges(board, size);
    }

    static generateErodedGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        const starPoints = this.getStarPoints(size);

        const excluded = new Set<string>();

        // Profundidad máxima de tallado por esquina (asegurando que nunca colisionen)
        const maxCarve = size === 19 ? 7 : size === 13 ? 5 : 3;

        // Genera una secuencia no creciente para cortar la esquina en forma de escalera de forma aleatoria
        // Esto garantiza que la topología siga siendo "ortogonalmente convexa" (¡ninguna casilla rota de 2x1!)
        const generateStaircase = (maxH: number, maxW: number) => {
            const steps: number[] = [];
            let currentW = Math.floor(Math.random() * maxW) + 1;
            for (let i = 0; i < maxH; i++) {
                steps.push(currentW);
                if (currentW > 0) {
                    const drop = Math.floor(Math.random() * 3); // Baja 0, 1 o 2 posiciones
                    currentW -= drop;
                    if (currentW < 0) currentW = 0;
                }
            }
            return steps;
        };

        const tl = generateStaircase(maxCarve, maxCarve);
        const tr = generateStaircase(maxCarve, maxCarve);
        const bl = generateStaircase(maxCarve, maxCarve);
        const br = generateStaircase(maxCarve, maxCarve);

        for (let r = 0; r < maxCarve; r++) {
            for (let c = 0; c < tl[r]; c++) excluded.add(`${c},${r}`);
            for (let c = 0; c < tr[r]; c++) excluded.add(`${size - 1 - c},${r}`);
            for (let c = 0; c < bl[r]; c++) excluded.add(`${c},${size - 1 - r}`);
            for (let c = 0; c < br[r]; c++) excluded.add(`${size - 1 - c},${size - 1 - r}`);
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
     * Islas v1: Archipiélago Dual (Triángulo Equilátero + Hexágono Regular)
     * Dos grandes islas nítidas y diferenciadas de igual tamaño unidas por un puente táctico 100% horizontal y nivelado.
     */
    static generateIslandsV1Grid(board: GraphBoard, size: number = 9): void {
        const L_tri = size === 9 ? 6 : size === 13 ? 8 : 11;
        const R_hex = size === 9 ? 3 : size === 13 ? 4 : 5;
        const bridge_steps = size === 19 ? 3 : 2;
        const spacing = size === 19 ? 24 : size === 13 ? 32 : 42;
        const sqrt3_2 = Math.sqrt(3) / 2;

        const tr_mid = Math.floor(L_tri / 2);
        const tri_local_right_x = (tr_mid / 2.0) * spacing;
        const hex_local_left_x = -R_hex * spacing;
        const bridge_total_span = (bridge_steps + 1) * spacing;

        const dist_centers = tri_local_right_x + bridge_total_span - hex_local_left_x;
        const tri_cx = -dist_centers / 2.0 + tri_local_right_x / 2.0;
        const hex_cx = tri_cx + dist_centers;

        // 1. Isla Triangular Equilátera (Izquierda) - Mapeada a filas enteras r_grid
        for (let tr = 0; tr < L_tri; tr++) {
            const r_grid = tr - tr_mid;
            const y = r_grid * spacing * sqrt3_2;
            for (let tc = 0; tc <= tr; tc++) {
                const id = `tri_${tc}_${tr}`;
                const x = tri_cx + (tc - tr / 2.0) * spacing;
                const isStar = (tr === 0 && tc === 0) || (tr === L_tri - 1 && (tc === 0 || tc === tr)) || (tr === Math.floor(L_tri * 2 / 3) && tc === Math.floor(tr / 2));
                board.addNode(id, x, y, isStar);
            }
        }

        for (let tr = 0; tr < L_tri; tr++) {
            for (let tc = 0; tc <= tr; tc++) {
                const id = `tri_${tc}_${tr}`;
                if (tc < tr) board.addEdge(id, `tri_${tc + 1}_${tr}`);
                if (tr < L_tri - 1) {
                    board.addEdge(id, `tri_${tc}_${tr + 1}`);
                    board.addEdge(id, `tri_${tc + 1}_${tr + 1}`);
                }
            }
        }

        // 2. Isla Hexagonal Regular (Derecha) - Alineada a las mismas filas enteras r_hex
        for (let q = -R_hex; q <= R_hex; q++) {
            const r1 = Math.max(-R_hex, -q - R_hex);
            const r2 = Math.min(R_hex, -q + R_hex);
            for (let r_hex = r1; r_hex <= r2; r_hex++) {
                const id = `hex_${q}_${r_hex}`;
                const x = hex_cx + (q + r_hex / 2.0) * spacing;
                const y = r_hex * spacing * sqrt3_2;
                const isStar = (q === 0 && r_hex === 0);
                board.addNode(id, x, y, isStar);
            }
        }

        for (let q = -R_hex; q <= R_hex; q++) {
            const r1 = Math.max(-R_hex, -q - R_hex);
            const r2 = Math.min(R_hex, -q + R_hex);
            for (let r_hex = r1; r_hex <= r2; r_hex++) {
                const id1 = `hex_${q}_${r_hex}`;
                for (const [dq, dr] of [[1, 0], [0, 1], [1, -1]]) {
                    const id2 = `hex_${q + dq}_${r_hex + dr}`;
                    if (board.nodes.has(id2)) board.addEdge(id1, id2);
                }
            }
        }

        // 3. Puente Táctico 100% Horizontal y Nivelado (Zero Inclinación)
        const bridge_rows = size === 9 ? [-1, 0] : size === 13 ? [-1, 0, 1] : [-1, 0, 1, 2];

        for (const r_grid of bridge_rows) {
            const y = r_grid * spacing * sqrt3_2;
            const tr = r_grid + tr_mid;
            const s_id = `tri_${tr}_${tr}`;
            const sNode = board.nodes.get(s_id);
            if (!sNode) continue;

            const q_hex = r_grid >= 0 ? -R_hex : -r_grid - R_hex;
            const t_id = `hex_${q_hex}_${r_grid}`;
            const tNode = board.nodes.get(t_id) || board.nodes.get(`hex_${-R_hex}_0`)!;

            let last_id = s_id;
            for (let step = 1; step <= bridge_steps; step++) {
                const t = step / (bridge_steps + 1);
                const bid = `br_${r_grid}_${step}`;
                const bx = sNode.x + (tNode.x - sNode.x) * t;
                board.addNode(bid, bx, y, false);
                board.addEdge(last_id, bid);
                last_id = bid;

                // Conexiones triangulares transversales con la fila adyacente inferior
                const prev_row = r_grid - 1;
                if (bridge_rows.includes(prev_row)) {
                    const prev_bid = `br_${prev_row}_${step}`;
                    if (board.nodes.has(prev_bid)) board.addEdge(bid, prev_bid);

                    const prev_left = step > 1 ? `br_${prev_row}_${step - 1}` : `tri_${prev_row + tr_mid}_${prev_row + tr_mid}`;
                    if (board.nodes.has(prev_left)) board.addEdge(bid, prev_left);
                }
            }
            board.addEdge(last_id, tNode.id);

            const prev_row = r_grid - 1;
            if (bridge_rows.includes(prev_row)) {
                const prev_q_hex = prev_row >= 0 ? -R_hex : -prev_row - R_hex;
                const prev_t_id = `hex_${prev_q_hex}_${prev_row}`;
                const last_bid = `br_${r_grid}_${bridge_steps}`;
                if (board.nodes.has(prev_t_id) && board.nodes.has(last_bid)) {
                    board.addEdge(last_bid, prev_t_id);
                }
            }
        }
    }

    /**
     * Islas v2: Archipiélago Cruz Cardinal (5 Grandes Islas Cuadradas con Avenidas Ortogonales Anchas)
     * 100% Cuadrículas Cuadradas de Go tradicional de tamaño amplio unidas por paseos ortogonales de 2-3 casillas de ancho.
     */
    static generateIslandsV2Grid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 24 : size === 13 ? 32 : 42;

        const center_w = size === 9 ? 4 : size === 13 ? 5 : 7;
        const center_h = center_w;
        const sat_w = size === 9 ? 3 : size === 13 ? 4 : 5;
        const sat_h = sat_w;
        const bridge_len = size === 9 ? 2 : 3;
        const bridge_width = size === 9 ? 2 : 3;

        // 1. Isla Central Cuadrada
        const c_off_x = -(center_w - 1) / 2.0 * spacing;
        const c_off_y = -(center_h - 1) / 2.0 * spacing;
        for (let r = 0; r < center_h; r++) {
            for (let c = 0; c < center_w; c++) {
                const id = `c_${c}_${r}`;
                const x = c_off_x + c * spacing;
                const y = c_off_y + r * spacing;
                const isStar = (r === Math.floor(center_h / 2) && c === Math.floor(center_w / 2));
                board.addNode(id, x, y, isStar);
                if (c > 0) board.addEdge(id, `c_${c - 1}_${r}`);
                if (r > 0) board.addEdge(id, `c_${c}_${r - 1}`);
            }
        }

        // Distancias a satélites
        const dist_y = ((center_h - 1) / 2.0 + bridge_len + 1 + (sat_h - 1) / 2.0) * spacing;
        const dist_x = ((center_w - 1) / 2.0 + bridge_len + 1 + (sat_w - 1) / 2.0) * spacing;

        // 2. Satélite Norte (Arriba)
        const n_off_x = -(sat_w - 1) / 2.0 * spacing;
        const n_off_y = -dist_y - (sat_h - 1) / 2.0 * spacing;
        for (let r = 0; r < sat_h; r++) {
            for (let c = 0; c < sat_w; c++) {
                const id = `n_${c}_${r}`;
                const x = n_off_x + c * spacing;
                const y = n_off_y + r * spacing;
                board.addNode(id, x, y, (r === Math.floor(sat_h / 2) && c === Math.floor(sat_w / 2)));
                if (c > 0) board.addEdge(id, `n_${c - 1}_${r}`);
                if (r > 0) board.addEdge(id, `n_${c}_${r - 1}`);
            }
        }

        // 3. Satélite Sur (Abajo)
        const s_off_x = -(sat_w - 1) / 2.0 * spacing;
        const s_off_y = dist_y - (sat_h - 1) / 2.0 * spacing;
        for (let r = 0; r < sat_h; r++) {
            for (let c = 0; c < sat_w; c++) {
                const id = `s_${c}_${r}`;
                const x = s_off_x + c * spacing;
                const y = s_off_y + r * spacing;
                board.addNode(id, x, y, (r === Math.floor(sat_h / 2) && c === Math.floor(sat_w / 2)));
                if (c > 0) board.addEdge(id, `s_${c - 1}_${r}`);
                if (r > 0) board.addEdge(id, `s_${c}_${r - 1}`);
            }
        }

        // 4. Satélite Oeste (Izquierda)
        const w_off_x = -dist_x - (sat_w - 1) / 2.0 * spacing;
        const w_off_y = -(sat_h - 1) / 2.0 * spacing;
        for (let r = 0; r < sat_h; r++) {
            for (let c = 0; c < sat_w; c++) {
                const id = `w_${c}_${r}`;
                const x = w_off_x + c * spacing;
                const y = w_off_y + r * spacing;
                board.addNode(id, x, y, (r === Math.floor(sat_h / 2) && c === Math.floor(sat_w / 2)));
                if (c > 0) board.addEdge(id, `w_${c - 1}_${r}`);
                if (r > 0) board.addEdge(id, `w_${c}_${r - 1}`);
            }
        }

        // 5. Satélite Este (Derecha)
        const e_off_x = dist_x - (sat_w - 1) / 2.0 * spacing;
        const e_off_y = -(sat_h - 1) / 2.0 * spacing;
        for (let r = 0; r < sat_h; r++) {
            for (let c = 0; c < sat_w; c++) {
                const id = `e_${c}_${r}`;
                const x = e_off_x + c * spacing;
                const y = e_off_y + r * spacing;
                board.addNode(id, x, y, (r === Math.floor(sat_h / 2) && c === Math.floor(sat_w / 2)));
                if (c > 0) board.addEdge(id, `e_${c - 1}_${r}`);
                if (r > 0) board.addEdge(id, `e_${c}_${r - 1}`);
            }
        }

        // 6. Avenidas Ortogonales Anchas (Paseos de 2 a 3 carriles de ancho perfectamente alineados)
        const bridge_start_c = Math.floor((center_w - bridge_width) / 2);
        const sat_start_c = Math.floor((sat_w - bridge_width) / 2);

        // Avenida Norte
        for (let step = 1; step <= bridge_len; step++) {
            for (let lane = 0; lane < bridge_width; lane++) {
                const bid = `br_n_${lane}_${step}`;
                const y_start = board.nodes.get(`c_${bridge_start_c + lane}_0`)!.y;
                const y_end = board.nodes.get(`n_${sat_start_c + lane}_${sat_h - 1}`)!.y;
                const t = step / (bridge_len + 1);
                const y = y_start + (y_end - y_start) * t;
                const x = board.nodes.get(`c_${bridge_start_c + lane}_0`)!.x;
                board.addNode(bid, x, y, false);

                if (lane > 0) board.addEdge(bid, `br_n_${lane - 1}_${step}`);
                if (step === 1) {
                    board.addEdge(bid, `c_${bridge_start_c + lane}_0`);
                } else {
                    board.addEdge(bid, `br_n_${lane}_${step - 1}`);
                }
                if (step === bridge_len) {
                    board.addEdge(bid, `n_${sat_start_c + lane}_${sat_h - 1}`);
                }
            }
        }

        // Avenida Sur
        for (let step = 1; step <= bridge_len; step++) {
            for (let lane = 0; lane < bridge_width; lane++) {
                const bid = `br_s_${lane}_${step}`;
                const y_start = board.nodes.get(`c_${bridge_start_c + lane}_${center_h - 1}`)!.y;
                const y_end = board.nodes.get(`s_${sat_start_c + lane}_0`)!.y;
                const t = step / (bridge_len + 1);
                const y = y_start + (y_end - y_start) * t;
                const x = board.nodes.get(`c_${bridge_start_c + lane}_${center_h - 1}`)!.x;
                board.addNode(bid, x, y, false);

                if (lane > 0) board.addEdge(bid, `br_s_${lane - 1}_${step}`);
                if (step === 1) {
                    board.addEdge(bid, `c_${bridge_start_c + lane}_${center_h - 1}`);
                } else {
                    board.addEdge(bid, `br_s_${lane}_${step - 1}`);
                }
                if (step === bridge_len) {
                    board.addEdge(bid, `s_${sat_start_c + lane}_0`);
                }
            }
        }

        // Avenida Oeste
        const bridge_start_r = Math.floor((center_h - bridge_width) / 2);
        const sat_start_r = Math.floor((sat_h - bridge_width) / 2);

        for (let step = 1; step <= bridge_len; step++) {
            for (let lane = 0; lane < bridge_width; lane++) {
                const bid = `br_w_${lane}_${step}`;
                const x_start = board.nodes.get(`c_0_${bridge_start_r + lane}`)!.x;
                const x_end = board.nodes.get(`w_${sat_w - 1}_${sat_start_r + lane}`)!.x;
                const t = step / (bridge_len + 1);
                const x = x_start + (x_end - x_start) * t;
                const y = board.nodes.get(`c_0_${bridge_start_r + lane}`)!.y;
                board.addNode(bid, x, y, false);

                if (lane > 0) board.addEdge(bid, `br_w_${lane - 1}_${step}`);
                if (step === 1) {
                    board.addEdge(bid, `c_0_${bridge_start_r + lane}`);
                } else {
                    board.addEdge(bid, `br_w_${lane}_${step - 1}`);
                }
                if (step === bridge_len) {
                    board.addEdge(bid, `w_${sat_w - 1}_${sat_start_r + lane}`);
                }
            }
        }

        // Avenida Este
        for (let step = 1; step <= bridge_len; step++) {
            for (let lane = 0; lane < bridge_width; lane++) {
                const bid = `br_e_${lane}_${step}`;
                const x_start = board.nodes.get(`c_${center_w - 1}_${bridge_start_r + lane}`)!.x;
                const x_end = board.nodes.get(`e_0_${sat_start_r + lane}`)!.x;
                const t = step / (bridge_len + 1);
                const x = x_start + (x_end - x_start) * t;
                const y = board.nodes.get(`c_${center_w - 1}_${bridge_start_r + lane}`)!.y;
                board.addNode(bid, x, y, false);

                if (lane > 0) board.addEdge(bid, `br_e_${lane - 1}_${step}`);
                if (step === 1) {
                    board.addEdge(bid, `c_${center_w - 1}_${bridge_start_r + lane}`);
                } else {
                    board.addEdge(bid, `br_e_${lane}_${step - 1}`);
                }
                if (step === bridge_len) {
                    board.addEdge(bid, `e_0_${sat_start_r + lane}`);
                }
            }
        }
    }

    /**
     * Reloj de Arena Cuántico (Quantum Hourglass & Central Bridge)
     */
    static generateHourglassGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        const starPoints = this.getStarPoints(size);
        const center = (size - 1) / 2;
        const excluded = new Set<string>();

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const dx = Math.abs(c - center);
                const dy = Math.abs(r - center);
                const maxAllowedX = dy * 0.9 + 0.8;
                const isCentralBridge = dy <= 1.0 && dx <= 1.0;
                if (dx > maxAllowedX && !isCentralBridge) {
                    excluded.add(`${c},${r}`);
                }
            }
        }

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = `${col},${row}`;
                if (excluded.has(id)) continue;
                const x = col * spacing;
                const y = row * spacing;
                board.addNode(id, x, y, starPoints.has(id));
            }
        }
        this.connectOrthogonalEdges(board, size);
    }

    /**
     * Diamante Fractal con Geoda Hueca Interior (Hollow Crystal Geode)
     */
    static generateGeodeGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        const starPoints = this.getStarPoints(size);
        const center = (size - 1) / 2;
        const maxRadius = (size - 1) / 2 + 0.2;
        const excluded = new Set<string>();

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const manhattan = Math.abs(c - center) + Math.abs(r - center);
                const d = Math.hypot(c - center, r - center);
                const isOutside = manhattan > maxRadius * 1.25;
                const isHollowCenter = d < (size === 9 ? 1.6 : size === 13 ? 2.4 : 3.6);
                const isCrossBridge = Math.abs(c - center) <= 0.6 || Math.abs(r - center) <= 0.6;
                if (isOutside || (isHollowCenter && !isCrossBridge)) {
                    excluded.add(`${c},${r}`);
                }
            }
        }

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = `${col},${row}`;
                if (excluded.has(id)) continue;
                const x = col * spacing;
                const y = row * spacing;
                board.addNode(id, x, y, starPoints.has(id));
            }
        }
        this.connectOrthogonalEdges(board, size);
    }

    /**
     * Galaxia Espiral Doble (Twin Spiral Galaxy Arms)
     */
    static generateSpiralGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        const starPoints = this.getStarPoints(size);
        const center = (size - 1) / 2;
        const excluded = new Set<string>();

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const d = Math.hypot(c - center, r - center);
                const angle = Math.atan2(r - center, c - center);
                const spiral1 = Math.abs(d - (angle * 1.2 + 2.5));
                const spiral2 = Math.abs(d - ((angle + Math.PI) * 1.2 + 2.5));
                const isCore = d <= 1.2;
                const isConnector = (r % 3 === 0 && d < size * 0.45);
                if (!isCore && spiral1 > 0.85 && spiral2 > 0.85 && !isConnector) {
                    excluded.add(`${c},${r}`);
                }
            }
        }

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = `${col},${row}`;
                if (excluded.has(id)) continue;
                const x = col * spacing;
                const y = row * spacing;
                board.addNode(id, x, y, starPoints.has(id));
            }
        }
        this.connectOrthogonalEdges(board, size);
    }

    /**
     * Anillos Concéntricos con Puentes Radiales (Concentric Rings & Radial Gateways)
     */
    static generateRingsGrid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        const starPoints = this.getStarPoints(size);
        const center = (size - 1) / 2;
        const excluded = new Set<string>();

        const ring1 = size === 9 ? 1.5 : size === 13 ? 2.5 : 3.8;
        const ring2 = size === 9 ? 3.4 : size === 13 ? 4.8 : 7.2;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const d = Math.hypot(c - center, r - center);
                const isRadialBridge = Math.abs(c - r) <= 0.6 || Math.abs(c + r - (size - 1)) <= 0.6 || Math.abs(c - center) <= 0.6 || Math.abs(r - center) <= 0.6;
                const inRing1 = Math.abs(d - ring1) <= 0.8;
                const inRing2 = Math.abs(d - ring2) <= 0.9;
                const isCenter = d <= 0.8;
                if (!isCenter && !inRing1 && !inRing2 && !isRadialBridge) {
                    excluded.add(`${c},${r}`);
                }
            }
        }

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = `${col},${row}`;
                if (excluded.has(id)) continue;
                const x = col * spacing;
                const y = row * spacing;
                board.addNode(id, x, y, starPoints.has(id));
            }
        }
        this.connectOrthogonalEdges(board, size);
    }

    /**
     * Tablero de Estrella de 5 Puntas con Cuadrícula de Celdas Triangulares
     */
    static generateStar5Grid(board: GraphBoard, size: number = 9): void {
        const spacing = size === 19 ? 26 : size === 13 ? 34 : 46;
        const sqrt3_2 = Math.sqrt(3) / 2;
        const R_outer = (size - 1) * spacing * 0.58;
        const R_inner = R_outer * 0.42;

        const star_poly: [number, number][] = [];
        for (let i = 0; i < 10; i++) {
            const angle = i * (Math.PI / 5) - Math.PI / 2;
            const r = (i % 2 === 0) ? R_outer : R_inner;
            star_poly.push([r * Math.cos(angle), r * Math.sin(angle)]);
        }

        const pointInPoly = (px: number, py: number): boolean => {
            let inside = false;
            const n = star_poly.length;
            let p1 = star_poly[0];
            for (let i = 1; i <= n; i++) {
                const p2 = star_poly[i % n];
                if (py > Math.min(p1[1], p2[1])) {
                    if (py <= Math.max(p1[1], p2[1])) {
                        if (px <= Math.max(p1[0], p2[0])) {
                            if (p1[1] !== p2[1]) {
                                const xinters = (py - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]) + p1[0];
                                if (p1[0] === p2[0] || px <= xinters) {
                                    inside = !inside;
                                }
                            }
                        }
                    }
                }
                p1 = p2;
            }
            return inside;
        };

        const all_coords = new Map<string, string>();
        const grid_extent = Math.floor(size * 1.6);

        for (let q = -grid_extent; q <= grid_extent; q++) {
            for (let r = -grid_extent; r <= grid_extent; r++) {
                const x = spacing * (q + r / 2);
                const y = spacing * sqrt3_2 * r;
                if (pointInPoly(x, y) || Math.hypot(x, y) < spacing * 0.75) {
                    const id = `s5_${q}_${r}`;
                    const isCenter = (q === 0 && r === 0);
                    board.addNode(id, x, y, isCenter);
                    all_coords.set(`${q},${r}`, id);
                }
            }
        }

        const directions = [[1, 0], [0, 1], [1, -1]];
        all_coords.forEach((id1, key) => {
            const [q, r] = key.split(',').map(Number);
            for (const [dq, dr] of directions) {
                const id2 = all_coords.get(`${q + dq},${r + dr}`);
                if (id2) {
                    board.addEdge(id1, id2);
                }
            }
        });
    }

    /**
     * Tablero de Estrella de 6 Puntas (Estrella de David) con Cuadrícula de Celdas Triangulares
     */
    static generateStar6Grid(board: GraphBoard, size: number = 9): void {
        const K = size === 9 ? 2 : size === 13 ? 3 : 4;
        const spacing = size === 19 ? 24 : size === 13 ? 32 : 42;
        const sqrt3_2 = Math.sqrt(3) / 2;

        const all_coords = new Map<string, string>();

        for (let q = -2 * K; q <= 2 * K; q++) {
            for (let r = -2 * K; r <= 2 * K; r++) {
                const s = -q - r;
                const d = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
                if (d > 2 * K) continue;

                const count_over_K = (Math.abs(q) > K ? 1 : 0) + (Math.abs(r) > K ? 1 : 0) + (Math.abs(s) > K ? 1 : 0);
                if (count_over_K <= 1) {
                    const id = `s6_${q}_${r}`;
                    const x = spacing * (q + r / 2);
                    const y = spacing * sqrt3_2 * r;
                    const isCenter = (q === 0 && r === 0);
                    board.addNode(id, x, y, isCenter);
                    all_coords.set(`${q},${r}`, id);
                }
            }
        }

        const directions = [[1, 0], [0, 1], [1, -1]];
        all_coords.forEach((id1, key) => {
            const [q, r] = key.split(',').map(Number);
            for (const [dq, dr] of directions) {
                const id2 = all_coords.get(`${q + dq},${r + dr}`);
                if (id2) {
                    board.addEdge(id1, id2);
                }
            }
        });
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

    public static getStarPoints(size: number): Set<string> {
        const starPoints = new Set<string>();
        if (size === 5) {
            [[2, 2]].forEach(([c, r]) => starPoints.add(`${c},${r}`));
        } else if (size === 9) {
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
