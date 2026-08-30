/**
 * NeuralNetAdapter.ts
 * ===================
 * Client for ONNX Runtime Web model (CrazyGoNet).
 * Provides asynchronous policy, value (winrate), and ownership evaluation.
 */

import * as ort from 'onnxruntime-web/wasm';
import { GraphBoard, type PlayerId } from '../core/GraphBoard';
import { GameState } from '../core/GameState';

export interface NeuralEvaluation {
    policyProbabilities: Map<string, number>; // nodeId -> prob, 'PASS' -> prob
    bestMoveId: string | null;
    bestMoveProb: number;
    winRates: Record<PlayerId, number>; // 0 to 100
    ownershipMap: Map<string, number>;  // nodeId -> [-1, 1]
    isNeural: boolean;
}

export class NeuralNetAdapter {
    private static session: ort.InferenceSession | null = null;
    private static isInitializing = false;
    private static initPromise: Promise<boolean> | null = null;

    /**
     * Initializes the ONNX inference session with crazy_go_brain_web.onnx (or fallback)
     */
    public static async init(): Promise<boolean> {
        if (this.session) return true;
        if (this.isInitializing && this.initPromise) return this.initPromise;

        this.isInitializing = true;
        this.initPromise = (async () => {
            try {
                // Configure ONNX Runtime Web options
                ort.env.wasm.numThreads = 1;
                ort.env.wasm.simd = true;
                ort.env.wasm.wasmPaths = '/';

                const modelUrl = '/models/crazy_go_brain_fp32.onnx';
                this.session = await ort.InferenceSession.create(modelUrl, {
                    executionProviders: ['wasm'],
                    graphOptimizationLevel: 'all'
                });
                console.log('[NeuralNetAdapter] CrazyGoNet ONNX FP32 loaded successfully!');
                return true;
            } catch (err) {
                console.warn('[NeuralNetAdapter] Could not load ONNX model, falling back to heuristics:', err);
                this.session = null;
                return false;
            } finally {
                this.isInitializing = false;
            }
        })();

        return this.initPromise;
    }

    public static isReady(): boolean {
        return this.session !== null;
    }

    /**
     * Evaluates the board state using the neural network
     */
    public static async evaluate(
        board: GraphBoard,
        state: GameState,
        currentPlayer: PlayerId
    ): Promise<NeuralEvaluation | null> {
        if (!this.session) {
            const ok = await this.init();
            if (!ok || !this.session) return null;
        }

        // ── Universal Node-to-Grid Coordinate Mapper ──
        // Maps ANY graph board (Square, Cross, Hex, Triangle, Islands, Star, Oni, etc.) to discrete 2D grid (r, c)
        const nodeToGrid = new Map<string, { r: number, c: number }>();
        const gridToNode = new Map<string, string>(); // `${r},${c}` -> nodeId

        let isStandardComma = true;
        for (const id of board.nodes.keys()) {
            const parts = id.split(',');
            if (parts.length !== 2 || isNaN(parseInt(parts[0], 10)) || isNaN(parseInt(parts[1], 10))) {
                isStandardComma = false;
                break;
            }
        }

        let N = board.size || 9;

        if (isStandardComma) {
            let maxCoord = 0;
            for (const [id] of board.nodes) {
                const parts = id.split(',');
                const col = parseInt(parts[0], 10);
                const row = parseInt(parts[1], 10);
                const r = row;
                const c = col;
                nodeToGrid.set(id, { r, c });
                gridToNode.set(`${r},${c}`, id);
                if (r > maxCoord) maxCoord = r;
                if (c > maxCoord) maxCoord = c;
            }
            N = Math.max(N, maxCoord + 1);
        } else {
            // Asymmetric topology: extract unique sorted X and Y coordinates to construct compact bounding grid
            const uniqueX = Array.from(new Set(Array.from(board.nodes.values()).map(n => Math.round(n.x)))).sort((a, b) => a - b);
            const uniqueY = Array.from(new Set(Array.from(board.nodes.values()).map(n => Math.round(n.y)))).sort((a, b) => a - b);
            
            const xToCol = new Map<number, number>();
            uniqueX.forEach((x, i) => xToCol.set(x, i));
            
            const yToRow = new Map<number, number>();
            uniqueY.forEach((y, i) => yToRow.set(y, i));

            N = Math.max(uniqueX.length, uniqueY.length, board.size || 9);

            for (const [id, node] of board.nodes) {
                const c = xToCol.get(Math.round(node.x)) ?? 0;
                const r = yToRow.get(Math.round(node.y)) ?? 0;
                nodeToGrid.set(id, { r, c });
                gridToNode.set(`${r},${c}`, id);
            }
        }

        const channels = 16;
        const totalNodes = N * N;
        const inputData = new Float32Array(channels * totalNodes);

        // Precompute liberties
        const visitedChains = new Set<string>();
        const libertyMap = new Map<string, number>();

        for (const [id, node] of board.nodes) {
            if (node.stone && !visitedChains.has(id)) {
                const chain = board.getChain(id);
                for (const c of chain) visitedChains.add(c);
                const libs = board.getLiberties(id).size;
                for (const c of chain) libertyMap.set(c, libs);
            }
        }

        // Fill features
        for (const [id, node] of board.nodes) {
            const gridPos = nodeToGrid.get(id);
            if (!gridPos) continue;
            const { r, c } = gridPos;
            if (r >= N || c >= N) continue;

            const idx = r * N + c;

            // Ch 2: Topology mask
            if (node.terrain !== 'DESTROYED' && node.terrain !== 'OBSTACLE') {
                inputData[2 * totalNodes + idx] = 1.0;
            }

            if (node.stone) {
                const libs = libertyMap.get(id) ?? 0;
                const normLibs = Math.min(libs, 8) / 8.0;

                if (node.stone.playerId === currentPlayer) {
                    inputData[0 * totalNodes + idx] = 1.0; // Ch 0: My stones
                    inputData[3 * totalNodes + idx] = normLibs; // Ch 3: My liberties
                    if (libs === 1) inputData[5 * totalNodes + idx] = 1.0; // Ch 5: My Atari
                } else {
                    inputData[1 * totalNodes + idx] = 1.0; // Ch 1: Opponent stones
                    inputData[4 * totalNodes + idx] = normLibs; // Ch 4: Opponent liberties
                    if (libs === 1) inputData[6 * totalNodes + idx] = 1.0; // Ch 6: Opponent Atari
                }
            }
        }

        // Ch 7: Last move
        if (state.lastMoveNodeId) {
            const gridPos = nodeToGrid.get(state.lastMoveNodeId);
            if (gridPos && gridPos.r < N && gridPos.c < N) {
                inputData[7 * totalNodes + (gridPos.r * N + gridPos.c)] = 1.0;
            }
        }

        // Ch 15: Turn progress
        const maxExpectedMoves = Math.max(board.nodes.size * 1.5, 50);
        const progress = Math.min(state.currentTurn / maxExpectedMoves, 1.0);
        for (let i = 0; i < totalNodes; i++) {
            inputData[15 * totalNodes + i] = progress;
        }

        try {
            const tensor = new ort.Tensor('float32', inputData, [1, 16, N, N]);
            const results = await this.session.run({ board: tensor });

            const policyTensor = results.policy;
            const valueTensor = results.value;
            const ownTensor = results.ownership;

            // Leer Policy Head y aplicar Softmax con estabilidad numérica (restando maxLogit)
            const policyData = policyTensor.data as Float32Array;
            const policyMap = new Map<string, number>();
            const expValues = new Float32Array(totalNodes + 1); // +1 for PASS
            let expSum = 0;
            let maxLogit = -Infinity;

            // 1. Encontrar max logit
            for (const [id] of board.nodes) {
                const gridPos = nodeToGrid.get(id);
                if (!gridPos || gridPos.r >= N || gridPos.c >= N) continue;
                const logit = policyData[gridPos.r * N + gridPos.c];
                if (logit > maxLogit) maxLogit = logit;
            }
            const passLogit = policyData[totalNodes] ?? -10.0;
            if (passLogit > maxLogit) maxLogit = passLogit;

            // 2. Calcular exponenciales estables
            for (const [id] of board.nodes) {
                const gridPos = nodeToGrid.get(id);
                if (!gridPos || gridPos.r >= N || gridPos.c >= N) continue;

                const logit = policyData[gridPos.r * N + gridPos.c];
                const expVal = Math.exp(logit - maxLogit);
                expValues[gridPos.r * N + gridPos.c] = expVal;
                expSum += expVal;
            }

            const passExpVal = Math.exp(passLogit - maxLogit);
            expValues[totalNodes] = passExpVal;
            expSum += passExpVal;

            let bestProb = -1;
            let bestMoveNodeId: string | null = null;
            let validNodesCount = 0;

            for (const [id, node] of board.nodes) {
                const gridPos = nodeToGrid.get(id);
                if (!gridPos || gridPos.r >= N || gridPos.c >= N) continue;
                validNodesCount++;

                const prob = expValues[gridPos.r * N + gridPos.c] / expSum;
                policyMap.set(id, prob);

                // Check if legal move and highest probability
                if (node.stone === null && node.terrain !== 'DESTROYED' && node.terrain !== 'OBSTACLE') {
                    if (prob > bestProb) {
                        bestProb = prob;
                        bestMoveNodeId = id;
                    }
                }
            }

            // Pass action
            const passProb = expValues[totalNodes] / expSum;
            policyMap.set('PASS', passProb);
            if (passProb > bestProb && bestProb < 0.05) {
                bestMoveNodeId = null; // Pass
            }

            // Parse value (perspectiva del jugador en turno)
            const valData = valueTensor.data as Float32Array;
            const myWinProb = valData[0];
            const oppWinProb = valData.length > 1 ? valData[1] : (1.0 - myWinProb);

            let p1Prob = currentPlayer === 1 ? myWinProb : oppWinProb;
            let p2Prob = currentPlayer === 2 ? myWinProb : oppWinProb;

            // En los primeros turnos (1 a 8), suavizar hacia la distribución equilibrada inicial de Komi (49% - 51%)
            if (state.currentTurn <= 8) {
                const alpha = Math.min(state.currentTurn / 8.0, 1.0);
                const priorP1 = 0.49;
                const priorP2 = 0.51;
                p1Prob = (1 - alpha) * priorP1 + alpha * p1Prob;
                p2Prob = (1 - alpha) * priorP2 + alpha * p2Prob;
            }

            const p1Percent = Math.min(99, Math.max(1, Math.round(p1Prob * 100)));
            const p2Percent = 100 - p1Percent;

            const winRates: Record<PlayerId, number> = {
                1: p1Percent,
                2: p2Percent,
                3: 0,
                4: 0
            };

            // Parse ownership
            const ownData = ownTensor.data as Float32Array;
            const ownMap = new Map<string, number>();
            for (const [id] of board.nodes) {
                const gridPos = nodeToGrid.get(id);
                if (!gridPos || gridPos.r >= N || gridPos.c >= N) continue;
                ownMap.set(id, ownData[gridPos.r * N + gridPos.c]);
            }
            // Dispose ALL tensors AFTER reading all data to prevent 'tensor is disposed' errors
            if (tensor.dispose) tensor.dispose();
            if (policyTensor.dispose) policyTensor.dispose();
            if (valueTensor.dispose) valueTensor.dispose();
            if (ownTensor && ownTensor.dispose) ownTensor.dispose();

            if (validNodesCount === 0) {
                return null;
            }

            return {
                policyProbabilities: policyMap,
                bestMoveId: bestMoveNodeId,
                bestMoveProb: bestProb,
                winRates,
                ownershipMap: ownMap,
                isNeural: true
            };
        } catch (err) {
            console.error('[NeuralNetAdapter] Error running inference:', err);
            return null;
        }
    }
}
