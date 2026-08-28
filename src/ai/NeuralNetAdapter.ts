/**
 * NeuralNetAdapter.ts
 * ===================
 * Client for ONNX Runtime Web model (CrazyGoNet).
 * Provides asynchronous policy, value (winrate), and ownership evaluation.
 */

import * as ort from 'onnxruntime-web';
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
                ort.env.wasm.numThreads = 2;
                ort.env.wasm.simd = true;

                const modelUrl = '/models/crazy_go_brain_web.onnx';
                this.session = await ort.InferenceSession.create(modelUrl, {
                    executionProviders: ['wasm'],
                    graphOptimizationLevel: 'all'
                });
                console.log('[NeuralNetAdapter] CrazyGoNet ONNX loaded successfully!');
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

        const N = board.size || 9;
        // Construct 1 x 16 x N x N tensor
        const channels = 16;
        const inputData = new Float32Array(channels * N * N);

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
        const totalNodes = N * N;
        for (const [id, node] of board.nodes) {
            const parts = id.split('-');
            const r = parseInt(parts[0], 10);
            const c = parseInt(parts[1], 10);
            if (isNaN(r) || isNaN(c) || r >= N || c >= N) continue;

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
            const parts = state.lastMoveNodeId.split('-');
            const r = parseInt(parts[0], 10);
            const c = parseInt(parts[1], 10);
            if (!isNaN(r) && !isNaN(c) && r < N && c < N) {
                inputData[7 * totalNodes + (r * N + c)] = 1.0;
            }
        }

        // Ch 15: Turn progress
        const maxExpectedMoves = N * N * 1.5;
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

            // Parse policy
            const policyData = policyTensor.data as Float32Array;
            const policyMap = new Map<string, number>();

            // Softmax over legal moves
            let maxLogit = -Infinity;
            for (let i = 0; i < policyData.length; i++) {
                if (policyData[i] > maxLogit) maxLogit = policyData[i];
            }

            let expSum = 0;
            const expValues = new Float32Array(policyData.length);
            for (let i = 0; i < policyData.length; i++) {
                expValues[i] = Math.exp(policyData[i] - maxLogit);
                expSum += expValues[i];
            }

            let bestProb = -1;
            let bestMoveNodeId: string | null = null;

            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    const id = `${r}-${c}`;
                    const prob = expValues[r * N + c] / expSum;
                    policyMap.set(id, prob);

                    // Check if legal move and highest probability
                    const node = board.nodes.get(id);
                    if (node && node.stone === null && node.terrain !== 'DESTROYED' && node.terrain !== 'OBSTACLE') {
                        if (prob > bestProb) {
                            bestProb = prob;
                            bestMoveNodeId = id;
                        }
                    }
                }
            }

            // Pass action
            const passProb = expValues[totalNodes] / expSum;
            policyMap.set('PASS', passProb);
            if (passProb > bestProb && bestProb < 0.05) {
                bestMoveNodeId = null; // Pass
            }

            // Parse value (winrates)
            const valueData = valueTensor.data as Float32Array;
            const winRates: Record<PlayerId, number> = {
                1: Math.round((valueData[0] || 0.5) * 100),
                2: Math.round((valueData[1] || 0.5) * 100),
                3: 0,
                4: 0
            };

            // Parse ownership
            const ownData = ownTensor.data as Float32Array;
            const ownMap = new Map<string, number>();
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    ownMap.set(`${r}-${c}`, ownData[r * N + c]);
                }
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
