// core/StageHazardManager.ts — Gestor de Peligros Ambientales (Erupciones Volcánicas, Colapso Celestial e Inhalación del Oni)
import { GraphBoard } from './GraphBoard';
import { GameState } from './GameState';
import { RulesEngine } from './RulesEngine';
import { SoundFX } from '../audio/SoundFX';
import { HUDController } from '../ui/HUDController';
import { getLanguage } from '../i18n/i18n';
import { TenguVFX } from '../graphics/vfx/TenguVFX';
import { SkyVFX, type SkySquareImpact } from '../graphics/vfx/SkyVFX';
import { OniVFX, type OniStoneShift } from '../graphics/vfx/OniVFX';
import { BoardGenerators } from '../graphics/BoardGenerators';
import { CombatLogManager } from './CombatLogManager';

export class StageHazardManager {
    public static lastEruptionTurn: number = 0;
    public static lastSkyDropTurn: number = 0;
    public static lastOniTurn: number = 0;
    public static isHazardInProgress: boolean = false;

    /**
     * Reinicia el seguimiento de turnos de peligros ambientales al comenzar una partida.
     */
    public static reset(): void {
        this.lastEruptionTurn = 0;
        this.lastSkyDropTurn = 0;
        this.lastOniTurn = 0;
        this.isHazardInProgress = false;
    }

    /**
     * Ajusta el seguimiento de turnos si se rebobina / deshace la partida.
     */
    public static onTurnRolledBack(currentTurn: number): void {
        if (currentTurn <= this.lastEruptionTurn) {
            this.lastEruptionTurn = Math.floor((currentTurn - 1) / 10) * 10;
        }
        if (currentTurn <= this.lastSkyDropTurn) {
            this.lastSkyDropTurn = Math.floor((currentTurn - 1) / 10) * 10;
        }
        if (currentTurn <= this.lastOniTurn) {
            this.lastOniTurn = Math.floor((currentTurn - 1) / 10) * 10;
        }
        this.isHazardInProgress = false;
    }

    /**
     * Generador de números pseudoaleatorios determinista sincronizado por estado y turno.
     * Garantiza que en partidas Multijugador Online (P2P) ambos clientes calculen exactamente los mismos objetivos.
     */
    private static getDeterministicRandom(state: GameState): () => number {
        let seed = (state.currentTurn * 2654435761) >>> 0;
        const lastHist = state.boardHistory[state.boardHistory.length - 1] || '';
        for (let i = 0; i < lastHist.length; i++) {
            seed = ((seed ^ lastHist.charCodeAt(i)) * 16777619) >>> 0;
        }
        seed = (seed || 123456789) >>> 0;

        return () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };
    }

    /**
     * Comprueba si el tablero actual posee la mecánica activa de erupción volcánica.
     */
    public static isVolcanoActive(board?: GraphBoard): boolean {
        return board?.shape === 'volcano';
    }

    /**
     * Comprueba si el tablero actual posee la mecánica activa del Tablero del Cielo.
     */
    public static isSkyActive(board?: GraphBoard): boolean {
        return board?.shape === 'sky';
    }

    /**
     * Comprueba si el tablero actual posee la mecánica activa de la Máscara Oni.
     */
    public static isOniActive(board?: GraphBoard): boolean {
        return board?.shape === 'oni';
    }

    /**
     * Comprueba y ejecuta los peligros ambientales activos del tablero actual (Volcán, Cielo u Oni).
     */
    public static checkStageHazards(
        board: GraphBoard,
        state: GameState,
        svgElement: SVGSVGElement | null,
        onRender: () => void,
        onComplete?: () => void
    ): boolean {
        if (this.isVolcanoActive(board)) {
            const triggered = this.checkAndTriggerVolcano(board, state, svgElement, onRender, onComplete);
            if (triggered) this.isHazardInProgress = true;
            return triggered;
        }
        if (this.isSkyActive(board)) {
            const triggered = this.checkAndTriggerSky(board, state, svgElement, onRender, onComplete);
            if (triggered) this.isHazardInProgress = true;
            return triggered;
        }
        if (this.isOniActive(board)) {
            const triggered = this.checkAndTriggerOni(board, state, svgElement, onRender, onComplete);
            if (triggered) this.isHazardInProgress = true;
            return triggered;
        }
        return false;
    }

    /**
     * Comprueba y ejecuta una erupción volcánica si se cumplen las condiciones:
     * - Tablero Volcánico ('volcano')
     * - Cada 10 rondas completas (10 turnos por jugador, ej: 11a, 21a, 31a...)
     */
    public static checkAndTriggerVolcano(
        board: GraphBoard,
        state: GameState,
        svgElement: SVGSVGElement | null,
        onRender: () => void,
        onComplete?: () => void
    ): boolean {
        if (!this.isVolcanoActive(board) || state.isGameOver) {
            return false;
        }

        // Se activa cada 10 rondas completas (ej: turno 11a, 21a, 31a)
        const roundLength = state.playerCount || 2;
        const interval = 10 * roundLength;
        if (state.currentTurn <= 1 || (state.currentTurn - 1) % interval !== 0 || state.currentTurn === this.lastEruptionTurn) {
            return false;
        }

        // Filtrar nodos válidos (que no estén ya destruidos ni sean obstáculos)
        const validNodes = Array.from(board.nodes.values()).filter(
            n => n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE'
        );

        if (validNodes.length === 0) return false;

        this.lastEruptionTurn = state.currentTurn;

        // Seleccionar 1 casilla determinista (idéntica en ambos clientes Online)
        const prng = this.getDeterministicRandom(state);
        const targetIndex = Math.floor(prng() * validNodes.length);
        const targetNode = validNodes[targetIndex];
        const targetIds = [targetNode.id];
        const isEn = getLanguage() === 'en';
        const hadStone = targetNode.stone !== null;

        const onImpactNode = () => {
            const result = RulesEngine.destroyTopology(board, state, targetIds, svgElement);
            SoundFX.playVolcanoEruption();
            onRender();

            let extraInfo = '';
            if (result.shieldedDirectHits > 0) {
                extraInfo = isEn 
                    ? ` (Direct hit shattered Divine Shield on destroyed tile!)`
                    : ` (¡El impacto directo destrozó el Escudo Divino de la casilla eliminada!)`;
            } else if (hadStone && result.collateralCaptured > 0) {
                extraInfo = isEn 
                    ? ` (Direct hit + ${result.collateralCaptured} stone(s) suffocated without liberties!)`
                    : ` (Impacto directo + ${result.collateralCaptured} piedra(s) asfixiada(s) sin libertades!)`;
            } else if (hadStone) {
                extraInfo = isEn ? ` (Stone destroyed!)` : ` (¡Piedra destruida!)`;
            } else if (result.collateralCaptured > 0) {
                extraInfo = isEn 
                    ? ` (${result.collateralCaptured} adjacent stone(s) suffocated without liberties!)`
                    : ` (¡${result.collateralCaptured} piedra(s) adyacente(s) asfixiada(s) sin libertades!)`;
            }

            HUDController.showAlert(
                isEn
                    ? `🌋 VOLCANIC ERUPTION! Turn ${state.currentTurn}: Magma boulder struck ${targetNode.id}!${extraInfo}`
                    : `🌋 ¡ERUPCIÓN VOLCÁNICA! Turno ${state.currentTurn}: ¡Roca de magma impactó en ${targetNode.id}!${extraInfo}`
            );
        };

        const onAllFinished = () => {
            CombatLogManager.logBoardEvent(board, state, 'Erupción Volcánica', '🌋', targetIds, '¡Roca de magma impactó en la casilla!', 'Magma boulder struck the intersection!');
            StageHazardManager.isHazardInProgress = false;
            if (onComplete) onComplete();
        };

        if (svgElement) {
            TenguVFX.triggerMeteorShower([{ x: targetNode.x, y: targetNode.y }], svgElement, onImpactNode, onAllFinished, 22, 'red');
        } else {
            onImpactNode();
            onAllFinished();
        }

        return true;
    }

    /**
     * Comprueba y ejecuta la Caída Celestial del Tablero del Cielo:
     * - Tablero del Cielo ('sky')
     * - MODO DEBUG: Cada 4 turnos totales (turnos 5, 9, 13, 17, 21...)
     * - Caen 5 nuevos bloques cuadrados (2x2 = 4 casillas por bloque) de arriba a abajo de manera procedural
     * - Al impactar, GENERAN y EXPANDEN nuevas casillas e intersecciones en el goban.
     */
    public static checkAndTriggerSky(
        board: GraphBoard,
        state: GameState,
        svgElement: SVGSVGElement | null,
        onRender: () => void,
        onComplete?: () => void
    ): boolean {
        if (!this.isSkyActive(board) || state.isGameOver) {
            return false;
        }

        // Se activa cada 10 turnos por jugador (20 turnos totales en 2P: al terminar 10b, 20b, 30b... en turnos 21, 41, 61...)
        const roundLength = state.playerCount || 2;
        const interval = 10 * roundLength; // 20 turnos totales en 2P
        if (state.currentTurn <= 1 || (state.currentTurn - 1) % interval !== 0 || state.currentTurn === this.lastSkyDropTurn) {
            return false;
        }

        const size = board.size || 9;
        const spacing = size === 19 ? 28 : size === 13 ? 36 : size === 9 ? 46 : 56;
        const starPoints = BoardGenerators.getStarPoints(size);

        // 1. Obtener los límites actuales del tablero en coordenadas de cuadrícula (minCol, maxCol, minRow, maxRow)
        let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
        for (const node of board.nodes.values()) {
            if (node.terrain === 'DESTROYED') continue;
            const parts = node.id.split(',');
            if (parts.length !== 2) continue;
            const c = parseInt(parts[0], 10);
            const r = parseInt(parts[1], 10);
            if (isNaN(c) || isNaN(r)) continue;
            if (c < minCol) minCol = c;
            if (c > maxCol) maxCol = c;
            if (r < minRow) minRow = r;
            if (r > maxRow) maxRow = r;
        }

        if (!isFinite(minCol)) return false;

        interface SpawnCandidate {
            c: number;
            r: number;
            missingCount: number;
            adjacentAliveCount: number;
            center: { x: number; y: number };
            coords: { x: number; y: number }[];
            nodeIds: string[];
        }

        const candidates: SpawnCandidate[] = [];

        // 2. Escanear todo el perímetro exterior e interior alrededor del tablero actual (sin límite fijo)
        const minScanCol = minCol - 2;
        const maxScanCol = maxCol + 1;
        const minScanRow = minRow - 2;
        const maxScanRow = maxRow + 1;

        for (let r = minScanRow; r <= maxScanRow; r++) {
            for (let c = minScanCol; c <= maxScanCol; c++) {
                const id00 = `${c},${r}`;
                const id10 = `${c + 1},${r}`;
                const id01 = `${c},${r + 1}`;
                const id11 = `${c + 1},${r + 1}`;

                const n00 = board.nodes.get(id00);
                const n10 = board.nodes.get(id10);
                const n01 = board.nodes.get(id01);
                const n11 = board.nodes.get(id11);

                const currentNodes = [n00, n10, n01, n11];
                const missingCount = currentNodes.filter(n => !n || n.terrain === 'DESTROYED').length;

                // Solo consideramos bloques donde falte al menos 1 casilla por generar
                if (missingCount === 0) continue;

                // Contar cuántas casillas vivas existentes están adyacentes al perímetro de este bloque 2x2
                const perimeterIds = [
                    `${c - 1},${r}`, `${c - 1},${r + 1}`,
                    `${c + 2},${r}`, `${c + 2},${r + 1}`,
                    `${c},${r - 1}`, `${c + 1},${r - 1}`,
                    `${c},${r + 2}`, `${c + 1},${r + 2}`
                ];

                let adjacentAliveCount = 0;
                for (const pId of perimeterIds) {
                    const pNode = board.nodes.get(pId);
                    if (pNode && pNode.terrain !== 'DESTROYED' && pNode.terrain !== 'OBSTACLE') {
                        adjacentAliveCount++;
                    }
                }

                // También contamos si alguna casilla del propio bloque 2x2 ya existía viva (superposición parcial adyacente)
                const internalAliveCount = 4 - missingCount;

                // Para que el tablero crezca de forma orgánica conectada, debe tocar el goban existente
                if (adjacentAliveCount === 0 && internalAliveCount === 0) continue;

                const x0 = c * spacing;
                const x1 = (c + 1) * spacing;
                const y0 = r * spacing;
                const y1 = (r + 1) * spacing;

                const coords = [
                    { x: x0, y: y0 },
                    { x: x1, y: y0 },
                    { x: x0, y: y1 },
                    { x: x1, y: y1 }
                ];
                const centerX = (x0 + x1) / 2;
                const centerY = (y0 + y1) / 2;

                candidates.push({
                    c,
                    r,
                    missingCount,
                    adjacentAliveCount: adjacentAliveCount + internalAliveCount,
                    center: { x: centerX, y: centerY },
                    coords,
                    nodeIds: [id00, id10, id01, id11]
                });
            }
        }

        if (candidates.length === 0) return false;

        this.lastSkyDropTurn = state.currentTurn;

        const prng = this.getDeterministicRandom(state);

        // Ordenamos candidatos: preferimos los que expanden el borde exterior de forma equilibrada en todas las direcciones
        candidates.sort((a, b) => {
            const scoreA = a.adjacentAliveCount * 15 + a.missingCount * 10 + prng() * 30;
            const scoreB = b.adjacentAliveCount * 15 + b.missingCount * 10 + prng() * 30;
            return scoreB - scoreA;
        });

        const selectedCandidates = candidates.slice(0, 5);
        const skyImpacts: SkySquareImpact[] = selectedCandidates.map(cand => ({
            center: cand.center,
            nodeIds: cand.nodeIds,
            coords: cand.coords
        }));

        const onImpactSquare = (index: number) => {
            const cand = selectedCandidates[index];
            if (!cand) return;

            // GENERAR Y CREAR LAS 4 CASILLAS DEL BLOQUE 2x2 EN EL GOBAN
            for (let dr = 0; dr <= 1; dr++) {
                for (let dc = 0; dc <= 1; dc++) {
                    const col = cand.c + dc;
                    const row = cand.r + dr;
                    const id = `${col},${row}`;
                    const x = col * spacing;
                    const y = row * spacing;
                    const isStar = starPoints.has(id);

                    if (!board.nodes.has(id)) {
                        board.addNode(id, x, y, isStar);
                    } else {
                        const existing = board.nodes.get(id)!;
                        existing.terrain = 'NORMAL';
                        existing.x = x;
                        existing.y = y;
                    }

                    // Conectar aristas ortogonales con vecinos que existan en el grafo
                    const neighbors = [
                        `${col - 1},${row}`,
                        `${col + 1},${row}`,
                        `${col},${row - 1}`,
                        `${col},${row + 1}`
                    ];
                    for (const nId of neighbors) {
                        if (board.nodes.has(nId) && board.nodes.get(nId)!.terrain !== 'DESTROYED') {
                            board.addEdge(id, nId);
                        }
                    }
                }
            }

            // Conectar aristas internas del cuadrado 2x2
            const c = cand.c;
            const r = cand.r;
            board.addEdge(`${c},${r}`, `${c + 1},${r}`);
            board.addEdge(`${c},${r + 1}`, `${c + 1},${r + 1}`);
            board.addEdge(`${c},${r}`, `${c},${r + 1}`);
            board.addEdge(`${c + 1},${r}`, `${c + 1},${r + 1}`);

            onRender();
        };

        const onAllFinished = () => {
            const isEn = getLanguage() === 'en';
            HUDController.showAlert(
                isEn
                    ? `☁️✨ CELESTIAL EXPANSION! Turn ${state.currentTurn}: 5 new square blocks (2x2) plummeted from the sky, expanding the goban!`
                    : `☁️✨ ¡EXPANSIÓN CELESTIAL! Turno ${state.currentTurn}: ¡5 nuevos bloques cuadrados (2x2) cayeron del cielo expandiendo el goban!`
            );

            const allNewNodeIds = selectedCandidates.flatMap(c => c.nodeIds);
            CombatLogManager.logBoardEvent(
                board,
                state,
                'Expansión Celestial',
                '☁️',
                allNewNodeIds,
                `¡5 nuevos bloques cuadrados (2x2) cayeron del cielo expandiendo el goban!`,
                `5 new square blocks (2x2) plummeted from the sky expanding the goban!`
            );

            StageHazardManager.isHazardInProgress = false;
            if (onComplete) onComplete();
        };

        if (svgElement) {
            SkyVFX.triggerSkyFallingSquares(skyImpacts, svgElement, onImpactSquare, onAllFinished, 20);
        } else {
            skyImpacts.forEach((_, idx) => onImpactSquare(idx));
            onAllFinished();
        }

        return true;
    }

    /**
     * Comprueba y ejecuta la Inhalación del Demonio (Vórtice Gravitacional) en el Tablero Máscara Oni:
     * - Tablero Máscara Oni ('oni')
     * - Cadencia: Cada 7 turnos por jugador (14 turnos totales: turnos 15, 29, 43, 57...)
     */
    public static checkAndTriggerOni(
        board: GraphBoard,
        state: GameState,
        svgElement: SVGSVGElement | null,
        onRender: () => void,
        onComplete?: () => void
    ): boolean {
        if (board.shape !== 'oni' || state.isGameOver) return false;

        const roundLength = state.playerCount || 2;
        const interval = 7 * roundLength; // 14 turnos en 2P
        if (state.currentTurn <= 1 || (state.currentTurn - 1) % interval !== 0 || state.currentTurn === this.lastOniTurn) {
            return false;
        }

        this.lastOniTurn = state.currentTurn;

        return this.forceTriggerOniInhalation(board, state, svgElement, onRender, onComplete);
    }

    /**
     * Dispara forzadamente la Inhalación del Oni (útil para pruebas inmediatas en Sandbox/DevMode).
     * - Cadenas pesadas (4+ piedras conectadas): Resisten la fuerza del vórtice y NO se mueven.
     * - Piedras y grupos ligeros (1 a 3 piedras): Son atraídos desde todas las direcciones hacia la boca del Oni.
     * - DEVORACIÓN EN LA BOCA: Si una piedra ligera entra o cae en las fauces abismales, el Oni la DEVORA y absorbe.
     * - Colisiones y bordes: Si la casilla destino está ocupada o linda con el borde, se frena contra el obstáculo.
     * - Al terminar de deslizarse, se recalculan libertades y se ejecutan capturas por asfixia.
     */
    public static forceTriggerOniInhalation(
        board: GraphBoard,
        state: GameState,
        svgElement: SVGSVGElement | null,
        onRender: () => void,
        onComplete?: () => void
    ): boolean {
        const spacing = 24;
        const mouthX = 12;
        const mouthY = 17;
        const mouthCenter = { x: mouthX * spacing, y: mouthY * spacing };

        // 1. Identificar todas las cadenas y clasificar piedras ligeras (<= 3) vs pesadas (>= 4)
        const lightStoneNodeIds = new Set<string>();
        const evaluatedChains = new Set<string>();

        for (const [nodeId, node] of board.nodes.entries()) {
            if (node.stone && node.terrain !== 'DESTROYED' && node.terrain !== 'OBSTACLE') {
                if (evaluatedChains.has(nodeId)) continue;
                const chain = board.getChain(nodeId);
                for (const c of chain) evaluatedChains.add(c);

                // Grupos ligeros (1, 2 o 3 piedras aliadas)
                if (chain.size <= 3) {
                    for (const c of chain) {
                        lightStoneNodeIds.add(c);
                    }
                }
                // Cadenas pesadas (>= 4 piedras) son inamovibles y no se mueven ni se devoran
            }
        }

        // 2. Extraer y ordenar piedras ligeras por proximidad a la boca (las más cercanas se mueven primero)
        interface MovableStone {
            id: string;
            c: number;
            r: number;
            distToMouth: number;
            stone: import('./GraphBoard').StoneInfo;
        }

        const stonesToMove: MovableStone[] = [];
        for (const id of lightStoneNodeIds) {
            const node = board.nodes.get(id);
            if (!node || !node.stone) continue;
            const parts = id.split(',');
            if (parts.length !== 2) continue;
            const c = parseInt(parts[0], 10);
            const r = parseInt(parts[1], 10);
            if (isNaN(c) || isNaN(r)) continue;
            const distToMouth = Math.hypot(c - mouthX, r - mouthY);
            stonesToMove.push({ id, c, r, distToMouth, stone: node.stone });
        }

        // Ordenar con menor distancia a la boca primero
        stonesToMove.sort((a, b) => a.distToMouth - b.distToMouth);

        const shifts: OniStoneShift[] = [];
        let devouredCount = 0;

        // Función que identifica si una coordenada cae dentro del abismo de las fauces del Oni
        const isInsideMouthCavity = (c: number, r: number) => {
            return (c >= 8 && c <= 16 && (r === 16 || r === 17)) || (c >= 9 && c <= 15 && r === 18);
        };

        // 3. Ejecutar atracción vectorial omnidireccional hacia la boca
        for (const item of stonesToMove) {
            const sourceNode = board.nodes.get(item.id);
            if (!sourceNode || !sourceNode.stone) continue;

            const dc = mouthX - item.c;
            const dr = mouthY - item.r;

            // Determinar paso primario y secundario hacia la boca
            const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
            const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;

            let primaryTargetC = item.c;
            let primaryTargetR = item.r;
            let secondaryTargetC = item.c;
            let secondaryTargetR = item.r;

            if (Math.abs(dr) >= Math.abs(dc)) {
                primaryTargetR += stepR;
                secondaryTargetC += stepC;
            } else {
                primaryTargetC += stepC;
                secondaryTargetR += stepR;
            }

            let chosenTargetC = primaryTargetC;
            let chosenTargetR = primaryTargetR;
            let chosenTargetId = `${chosenTargetC},${chosenTargetR}`;
            let chosenTargetNode = board.nodes.get(chosenTargetId);

            // A) Verificar si el objetivo primario cae directo en la boca
            if (isInsideMouthCavity(chosenTargetC, chosenTargetR)) {
                state.entityManager.destroyEntity(sourceNode.stone.id);
                shifts.push({
                    fromId: item.id,
                    toCoords: { x: mouthCenter.x, y: mouthCenter.y },
                    fromCoords: { x: sourceNode.x, y: sourceNode.y },
                    playerId: sourceNode.stone.playerId,
                    isDevoured: true
                });
                sourceNode.stone = null;
                devouredCount++;
                continue;
            }

            // B) Verificar si el objetivo primario está libre
            let canMovePrimary = chosenTargetNode && chosenTargetNode.terrain !== 'DESTROYED' && chosenTargetNode.terrain !== 'OBSTACLE' && chosenTargetNode.stone === null;

            if (!canMovePrimary && (stepC !== 0 || stepR !== 0)) {
                // Intentar paso secundario
                const secId = `${secondaryTargetC},${secondaryTargetR}`;
                const secNode = board.nodes.get(secId);
                if (isInsideMouthCavity(secondaryTargetC, secondaryTargetR)) {
                    state.entityManager.destroyEntity(sourceNode.stone.id);
                    shifts.push({
                        fromId: item.id,
                        toCoords: { x: mouthCenter.x, y: mouthCenter.y },
                        fromCoords: { x: sourceNode.x, y: sourceNode.y },
                        playerId: sourceNode.stone.playerId,
                        isDevoured: true
                    });
                    sourceNode.stone = null;
                    devouredCount++;
                    continue;
                } else if (secNode && secNode.terrain !== 'DESTROYED' && secNode.terrain !== 'OBSTACLE' && secNode.stone === null) {
                    chosenTargetC = secondaryTargetC;
                    chosenTargetR = secondaryTargetR;
                    chosenTargetId = secId;
                    chosenTargetNode = secNode;
                    canMovePrimary = true;
                }
            }

            if (canMovePrimary && chosenTargetNode) {
                chosenTargetNode.stone = sourceNode.stone;
                sourceNode.stone = null;

                shifts.push({
                    fromId: item.id,
                    toId: chosenTargetId,
                    fromCoords: { x: sourceNode.x, y: sourceNode.y },
                    toCoords: { x: chosenTargetNode.x, y: chosenTargetNode.y },
                    playerId: chosenTargetNode.stone.playerId,
                    isDevoured: false
                });
            }
            // Si está bloqueado en ambas direcciones, la piedra frena contra el obstáculo
        }

        // 4. Función de finalización tras la animación
        const onAnimationComplete = () => {
            // Recalcular libertades de todas las piedras y resolver asfixia inmediata
            const nodesToCapture = new Set<string>();
            const postEvaluatedChains = new Set<string>();

            for (const [nodeId, node] of board.nodes.entries()) {
                if (node.stone && node.terrain !== 'DESTROYED') {
                    if (postEvaluatedChains.has(nodeId)) continue;
                    const chain = board.getChain(nodeId);
                    for (const c of chain) postEvaluatedChains.add(c);

                    if (board.getLiberties(nodeId).size === 0) {
                        // Respetar Escudo Divino de Kitsune si alguna piedra del grupo lo posee
                        let isProtected = false;
                        for (const c of chain) {
                            const cNode = board.nodes.get(c);
                            if (cNode?.stone?.isIndestructible) {
                                isProtected = true;
                                break;
                            }
                        }

                        if (!isProtected) {
                            for (const c of chain) {
                                nodesToCapture.add(c);
                            }
                        }
                    }
                }
            }

            // Retirar piedras asfixiadas
            let suffocatedCount = 0;
            for (const capId of nodesToCapture) {
                const capNode = board.nodes.get(capId);
                if (capNode && capNode.stone) {
                    state.entityManager.destroyEntity(capNode.stone.id);
                    capNode.stone = null;
                    suffocatedCount++;
                }
            }

            if (suffocatedCount > 0 || devouredCount > 0) {
                SoundFX.playCapture();
            }

            const isEn = getLanguage() === 'en';
            let extraInfo = '';
            if (devouredCount > 0) {
                extraInfo += isEn
                    ? ` (🕳️ Devoured ${devouredCount} light stone(s) in its abyssal mouth!)`
                    : ` (🕳️ ¡Devoró ${devouredCount} piedra(s) ligera(s) en sus fauces abismales!)`;
            }
            if (suffocatedCount > 0) {
                extraInfo += isEn 
                    ? ` (💀 ${suffocatedCount} stone(s) suffocated without liberties!)`
                    : ` (💀 ¡${suffocatedCount} piedra(s) asfixiada(s) sin libertades!)`;
            }

            HUDController.showAlert(
                isEn
                    ? `🌪️👹 ONI INHALATION! Turn ${state.currentTurn}: Vortex pulled ${shifts.length} light stone(s) towards the mouth!${extraInfo}`
                    : `🌪️👹 ¡INHALACIÓN DEL ONI! Turno ${state.currentTurn}: ¡El vórtice atrajo ${shifts.length} piedra(s) hacia las fauces!${extraInfo}`
            );

            CombatLogManager.logBoardEvent(
                board, state, 'Inhalación Oni', '🌪️', [],
                `¡El vórtice atrajo ${shifts.length} piedra(s) hacia las fauces!${extraInfo}`,
                `Vortex pulled ${shifts.length} light stone(s) towards the mouth!${extraInfo}`
            );

            onRender();
            StageHazardManager.isHazardInProgress = false;
            if (onComplete) onComplete();
        };

        // 5. Disparar VFX o completar síncronamente
        if (svgElement) {
            OniVFX.triggerOniInhalation(mouthCenter, shifts, svgElement, onAnimationComplete);
        } else {
            onAnimationComplete();
        }

        return true;
    }
}





