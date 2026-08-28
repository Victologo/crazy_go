/**
 * GoSimulator.ts
 * ==============
 * Self-contained pure Go engine for ML training data generation.
 * NO browser dependencies — runs entirely in Node.js via tsx.
 * NO Crazy Go extras (no champions, no polyominoes, no topologies).
 *
 * Implements canonical Go rules:
 *   - Liberties and chains (BFS)
 *   - Captures (0 liberties)
 *   - Suicide prohibition (with capture exception)
 *   - Simple Ko (board state comparison)
 *   - Territory scoring (Japanese rules, BFS)
 *   - Feature tensor extraction [16][N][N] for CrazyGoNet
 */

export type Player = 1 | 2;
export type NodeId = string; // "row-col"

interface Node {
    id: NodeId;
    row: number;
    col: number;
    neighbors: NodeId[];
    stone: Player | null;
}

export interface MoveResult {
    success: boolean;
    capturedIds: NodeId[];
    errorReason?: 'OCCUPIED' | 'SUICIDE' | 'KO';
}

export interface ScoreResult {
    blackScore: number;  // territory + captures
    whiteScore: number;  // territory + captures + komi
    komi: number;
    winner: Player;
    territoryMap: Map<NodeId, Player>; // empty nodes owned by each player
}

export class GoSimulator {
    private nodes: Map<NodeId, Node> = new Map();
    public readonly size: number;
    private boardHistory: string[] = [];
    public lastMoveId: NodeId | null = null;
    public consecutivePasses = 0;
    public captures: [number, number] = [0, 0]; // [by_black, by_white]
    public isOver = false;
    public totalMoves = 0;
    public readonly komi: number;

    public readonly topology: 'square' | 'circle' | 'triangle' | 'eroded' | 'oni';

    constructor(size: 9 | 13 | 19, komi = 6.5, topology: 'square' | 'circle' | 'triangle' | 'eroded' | 'oni' = 'square') {
        this.size = size;
        this.komi = komi;
        this.topology = topology;
        this.buildBoard(topology);
        // Record initial empty board state
        this.boardHistory.push(this.serializeState());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Board Construction
    // ─────────────────────────────────────────────────────────────────────

    private buildBoard(topology: string): void {
        const N = this.size;
        const center = (N - 1) / 2;
        const radius = center;

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                let include = true;
                if (topology === 'circle') {
                    const dist = Math.sqrt((r - center) ** 2 + (c - center) ** 2);
                    if (dist > radius + 0.3) include = false;
                } else if (topology === 'triangle') {
                    if (c > (r * 0.8 + center) || c < (center - r * 0.8)) include = false;
                } else if (topology === 'eroded') {
                    if ((r === 0 && c === 0) || (r === 0 && c === N - 1) || (r === N - 1 && c === 0) || (r === N - 1 && c === N - 1)) {
                        include = false;
                    }
                    if (r === Math.floor(center) && c === Math.floor(center)) include = false;
                } else if (topology === 'oni') {
                    const distCenter = Math.sqrt((r - center) ** 2 + (c - center) ** 2);
                    if (distCenter <= 1.4) include = false; // Abyss void center
                }

                if (include) {
                    const id = `${r}-${c}`;
                    this.nodes.set(id, { id, row: r, col: c, neighbors: [], stone: null });
                }
            }
        }

        // Add edges (4-connected grid among existing nodes)
        for (const [, node] of this.nodes) {
            const { row: r, col: c } = node;
            const neighborCoords = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
            for (const [nr, nc] of neighborCoords) {
                const nid = `${nr}-${nc}`;
                if (this.nodes.has(nid)) {
                    node.neighbors.push(nid);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Core Go Logic
    // ─────────────────────────────────────────────────────────────────────

    private getChain(startId: NodeId): Set<NodeId> {
        const startNode = this.nodes.get(startId);
        if (!startNode || startNode.stone === null) return new Set();
        const player = startNode.stone;
        const chain = new Set<NodeId>();
        const queue: NodeId[] = [startId];
        while (queue.length > 0) {
            const id = queue.shift()!;
            if (chain.has(id)) continue;
            chain.add(id);
            for (const nId of this.nodes.get(id)!.neighbors) {
                const n = this.nodes.get(nId);
                if (n && n.stone === player && !chain.has(nId)) queue.push(nId);
            }
        }
        return chain;
    }

    private getLiberties(chain: Set<NodeId>): Set<NodeId> {
        const liberties = new Set<NodeId>();
        for (const id of chain) {
            for (const nId of this.nodes.get(id)!.neighbors) {
                const n = this.nodes.get(nId);
                if (n && n.stone === null) liberties.add(nId);
            }
        }
        return liberties;
    }

    private serializeState(): string {
        const N = this.size;
        let s = '';
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const node = this.nodes.get(`${r}-${c}`);
                if (!node) {
                    s += 'X'; // Void / abyss / obstacle
                } else {
                    s += node.stone === null ? '0' : node.stone.toString();
                }
            }
        }
        return s;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Move Execution
    // ─────────────────────────────────────────────────────────────────────

    tryPlace(nodeId: NodeId, player: Player): MoveResult {
        const node = this.nodes.get(nodeId);
        if (!node || node.stone !== null) {
            return { success: false, capturedIds: [], errorReason: 'OCCUPIED' };
        }

        const opponent = player === 1 ? 2 : 1;
        node.stone = player;

        // Find enemy chains with 0 liberties after placement
        const capturedSet = new Set<NodeId>();
        for (const nId of node.neighbors) {
            const n = this.nodes.get(nId);
            if (n && n.stone === opponent) {
                const chain = this.getChain(nId);
                const libs = this.getLiberties(chain);
                if (libs.size === 0) {
                    for (const c of chain) capturedSet.add(c);
                }
            }
        }

        // Suicide check
        if (capturedSet.size === 0) {
            const myChain = this.getChain(nodeId);
            const myLibs = this.getLiberties(myChain);
            if (myLibs.size === 0) {
                node.stone = null;
                return { success: false, capturedIds: [], errorReason: 'SUICIDE' };
            }
        }

        // Apply captures to simulate resulting state
        for (const cId of capturedSet) this.nodes.get(cId)!.stone = null;

        // Ko check: compare candidate state to state 2 moves ago
        const candidateState = this.serializeState();
        const prevState = this.boardHistory.length >= 2
            ? this.boardHistory[this.boardHistory.length - 2]
            : null;

        if (prevState && candidateState === prevState) {
            // Undo everything
            node.stone = null;
            for (const cId of capturedSet) this.nodes.get(cId)!.stone = opponent;
            return { success: false, capturedIds: [], errorReason: 'KO' };
        }

        // Commit move
        this.captures[player - 1] += capturedSet.size;
        this.lastMoveId = nodeId;
        this.consecutivePasses = 0;
        this.totalMoves++;
        this.boardHistory.push(candidateState);

        return { success: true, capturedIds: Array.from(capturedSet) };
    }

    pass(player: Player): void {
        this.consecutivePasses++;
        this.lastMoveId = null;
        this.totalMoves++;
        this.boardHistory.push(this.serializeState());
        if (this.consecutivePasses >= 2) {
            this.isOver = true;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Legal Moves
    // ─────────────────────────────────────────────────────────────────────

    getLegalMoves(player: Player): NodeId[] {
        const legal: NodeId[] = [];
        const opponent = player === 1 ? 2 : 1;

        for (const [id, node] of this.nodes) {
            if (node.stone !== null) continue;

            // Temporarily place
            node.stone = player;
            const capturedSet = new Set<NodeId>();

            for (const nId of node.neighbors) {
                const n = this.nodes.get(nId);
                if (n && n.stone === opponent) {
                    const chain = this.getChain(nId);
                    const libs = this.getLiberties(chain);
                    if (libs.size === 0) for (const c of chain) capturedSet.add(c);
                }
            }

            // Suicide?
            let isSuicide = false;
            if (capturedSet.size === 0) {
                const myChain = this.getChain(id);
                const myLibs = this.getLiberties(myChain);
                if (myLibs.size === 0) isSuicide = true;
            }

            if (!isSuicide) {
                // Ko check
                for (const cId of capturedSet) this.nodes.get(cId)!.stone = null;
                const candidateState = this.serializeState();
                for (const cId of capturedSet) this.nodes.get(cId)!.stone = opponent;

                const prevState = this.boardHistory.length >= 2
                    ? this.boardHistory[this.boardHistory.length - 2]
                    : null;

                if (!prevState || candidateState !== prevState) {
                    legal.push(id);
                }
            }

            // Restore
            node.stone = null;
        }

        return legal;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Territory Scoring (Japanese rules, BFS)
    // ─────────────────────────────────────────────────────────────────────

    scoreTerritory(): ScoreResult {
        const territoryMap = new Map<NodeId, Player>();
        const visited = new Set<NodeId>();

        for (const [id, node] of this.nodes) {
            if (node.stone !== null || visited.has(id)) continue;

            const region: NodeId[] = [];
            const queue: NodeId[] = [id];
            const borderingPlayers = new Set<Player>();
            visited.add(id);

            while (queue.length > 0) {
                const curr = queue.shift()!;
                region.push(curr);
                for (const nId of this.nodes.get(curr)!.neighbors) {
                    const n = this.nodes.get(nId);
                    if (!n) continue;
                    if (n.stone !== null) {
                        borderingPlayers.add(n.stone);
                    } else if (!visited.has(nId)) {
                        visited.add(nId);
                        queue.push(nId);
                    }
                }
            }

            // Canonical rule: belongs to exactly one player
            if (borderingPlayers.size === 1) {
                const owner = Array.from(borderingPlayers)[0];
                for (const nId of region) territoryMap.set(nId, owner);
            }
        }

        let blackTerritory = 0;
        let whiteTerritory = 0;
        for (const [, owner] of territoryMap) {
            if (owner === 1) blackTerritory++;
            else whiteTerritory++;
        }

        const blackScore = blackTerritory + this.captures[0];
        const whiteScore = whiteTerritory + this.captures[1] + this.komi;

        return {
            blackScore,
            whiteScore,
            komi: this.komi,
            winner: blackScore > whiteScore ? 1 : 2,
            territoryMap,
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    // Feature Tensor Extraction [16][N][N] for CrazyGoNet
    // ─────────────────────────────────────────────────────────────────────
    //
    // Channel layout:
    //   0  — Current player's stones
    //   1  — Opponent's stones
    //   2  — Topology mask (always 1 for square boards)
    //   3  — Liberty count of current player's chains (normalized 0–1)
    //   4  — Liberty count of opponent's chains (normalized 0–1)
    //   5  — Atari indicator: current player's chains with 1 liberty
    //   6  — Atari indicator: opponent's chains with 1 liberty
    //   7  — Last move position
    //   8  — Ko position (if any — detected from board history)
    //   9  — Unused (future: influence map)
    //  10  — Unused (future: influence map)
    //  11–14 — Champion abilities (all 0 in Phase 1)
    //  15  — Turn progress (0.0 to 1.0, constant per plane)

    toTensor(currentPlayer: Player): number[][][] {
        const N = this.size;
        const opponent: Player = currentPlayer === 1 ? 2 : 1;

        // Initialize 16 x N x N tensor with zeros
        const tensor: number[][][] = Array.from({ length: 16 }, () =>
            Array.from({ length: N }, () => new Array(N).fill(0))
        );

        // Pre-compute chain liberty counts
        const visitedChains = new Set<NodeId>();
        const libertyCount = new Map<NodeId, number>(); // nodeId → liberty count of its chain

        for (const [id, node] of this.nodes) {
            if (node.stone !== null && !visitedChains.has(id)) {
                const chain = this.getChain(id);
                for (const c of chain) visitedChains.add(c);
                const libs = this.getLiberties(chain).size;
                for (const c of chain) libertyCount.set(c, libs);
            }
        }

        // Fill channels 0–7 and 15
        for (const [id, node] of this.nodes) {
            const { row: r, col: c } = node;
            tensor[2][r][c] = 1; // Topology mask (square board — all cells playable)

            if (node.stone === currentPlayer) {
                tensor[0][r][c] = 1;
                const libs = libertyCount.get(id) ?? 0;
                tensor[3][r][c] = Math.min(libs, 8) / 8;
                if (libs === 1) tensor[5][r][c] = 1; // Atari
            } else if (node.stone === opponent) {
                tensor[1][r][c] = 1;
                const libs = libertyCount.get(id) ?? 0;
                tensor[4][r][c] = Math.min(libs, 8) / 8;
                if (libs === 1) tensor[6][r][c] = 1; // Opponent atari
            }
        }

        // Channel 7: last move
        if (this.lastMoveId) {
            const parts = this.lastMoveId.split('-');
            tensor[7][parseInt(parts[0])][parseInt(parts[1])] = 1;
        }

        // Channel 8: Ko position — where the opponent cannot replay
        // Detect by finding the one node that, if placed, reproduces boardHistory[length-2]
        // (Simplified: just mark the last single-capture location if Ko-eligible)
        // Full Ko detection deferred to Phase 2 for performance.

        // Channel 15: turn progress
        const maxExpectedMoves = N * N * 1.5;
        const progress = Math.min(this.totalMoves / maxExpectedMoves, 1.0);
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                tensor[15][r][c] = progress;
            }
        }

        return tensor;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Ownership Target for Ownership Head training
    // Returns NxN array: +1 (black), -1 (white), 0 (dame / neutral)
    // ─────────────────────────────────────────────────────────────────────
    getOwnershipTarget(territoryMap: Map<NodeId, Player>): number[][] {
        const N = this.size;
        const ownership: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));

        // Territory
        for (const [id, owner] of territoryMap) {
            const parts = id.split('-');
            ownership[parseInt(parts[0])][parseInt(parts[1])] = owner === 1 ? 1 : -1;
        }

        // Live stones
        for (const [id, node] of this.nodes) {
            if (node.stone !== null) {
                const parts = id.split('-');
                ownership[parseInt(parts[0])][parseInt(parts[1])] = node.stone === 1 ? 1 : -1;
            }
        }

        return ownership;
    }
}
