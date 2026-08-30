/**
 * generate_games.ts
 * =================
 * Generates self-play Go games using GoSimulator and writes training data
 * to JSONL files in ml_training/data/phase1/
 *
 * Phase 1: Pure random self-play on 9x9 boards (2 players).
 * Output format per game (one JSON line):
 *   {
 *     board_size: number,
 *     result: [black_score, white_score],
 *     winner: 1 | 2,
 *     positions: [
 *       {
 *         tensor: number[][][],      // [16][N][N] feature tensor
 *         current_player: 1 | 2,
 *         policy_target: number[],   // uniform over legal moves for Phase 1
 *         value_target: number[],    // [1,0] if black wins, [0,1] if white wins
 *         ownership_target: number[][] // [N][N] +1=black -1=white 0=dame
 *       }
 *     ]
 *   }
 *
 * Usage:
 *   npx tsx ml_training/generate_games.ts [--games N] [--size S] [--batch-size B] [--output DIR]
 */

import { GoSimulator } from './GoSimulator';
import type { Player } from './GoSimulator';
import * as fs from 'fs';
import * as path from 'path';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag: string, defaultVal: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
};

const TOTAL_GAMES   = parseInt(getArg('--games', '500'));
const BOARD_SIZE    = parseInt(getArg('--size', '9')) as 9 | 13 | 19;
const BATCH_SIZE    = parseInt(getArg('--batch-size', '100')); // games per JSONL file
const OUTPUT_DIR    = getArg('--output', path.resolve(process.cwd(), 'ml_training', 'data', 'phase1'));
const TOPOLOGY_ARG  = getArg('--topology', 'square');
const MAX_MOVES_PER_GAME = BOARD_SIZE * BOARD_SIZE * 2; // safety limit

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Picks a random element from an array */
function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/** Generates a smart policy using a fast 1-ply territory heuristic */
/** Evaluates a move using authentic master Go principles (Corners, Lines 3/4, Anti-Dango, Cuts/Ataris) */
function evaluateMoveHeuristic(sim: GoSimulator, move: string, boardSize: number, currentPlayer: Player, _moveCount: number): number {
    const [r, c] = move.split('-').map(Number);
    const clone = sim.clone();
    const res = clone.tryPlace(move, currentPlayer);
    if (!res.success) return -9999;

    let score = 0;

    // 1. CAPTURES (Huge tactical priority)
    if (res.capturedIds.length > 0) {
        score += res.capturedIds.length * 40;
    }

    const myChain = clone.getChain(move);
    const myLibs = clone.getLiberties(myChain).size;

    // 2. BLUNDER PREVENTION (Never self-atari)
    if (myLibs === 1) {
        score -= 50; // Death trap
    } else if (myLibs === 2) {
        score -= 10;
    }

    // 3. ATARI ON OPPONENT (Attacking weak groups)
    const opponent: Player = currentPlayer === 1 ? 2 : 1;
    for (const neighborId of clone.getNeighbors(move)) {
        const stone = clone.getStone(neighborId);
        if (stone === opponent) {
            const oppChain = clone.getChain(neighborId);
            const oppLibs = clone.getLiberties(oppChain).size;
            if (oppLibs === 1) {
                score += 30; // Direct capture threat
            }
        }
    }

    // 4. CALCULATE DISTANCE TO NEAREST FRIENDLY AND ENEMY STONES
    let minFriendlyDist = 999;
    let minEnemyDist = 999;
    let totalFriendlyStones = 0;

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const stone = sim.getStone(`${row}-${col}`);
            if (stone !== null) {
                const dist = Math.abs(r - row) + Math.abs(c - col);
                if (stone === currentPlayer) {
                    totalFriendlyStones++;
                    if (dist < minFriendlyDist) minFriendlyDist = dist;
                } else {
                    if (dist < minEnemyDist) minEnemyDist = dist;
                }
            }
        }
    }

    // 5. CORNER STAR POINTS (Fuseki opening - 4 discrete corners: 3-3/3-4/4-4)
    const isCornerPoint = (
        (r === 2 && c === 2) || (r === 2 && c === boardSize - 3) ||
        (r === boardSize - 3 && c === 2) || (r === boardSize - 3 && c === boardSize - 3)
    );
    const isCenterPoint = (r === Math.floor(boardSize / 2) && c === Math.floor(boardSize / 2));

    if (totalFriendlyStones <= 4) {
        if (isCornerPoint) score += 35; // Priority 1: Take open corners!
        if (isCenterPoint) score += 15; // Tengen
    }

    // 6. STRICT ANTI-SNAKE / PROPER SPACING (1-space jump, 2-space extension, Keima)
    if (minFriendlyDist === 1) {
        // Touching own stone in open board: HEAVY CLUMP PENALTY
        if (minEnemyDist > 2 && res.capturedIds.length === 0) {
            score -= 35; // STRICTLY FORBID adjacent snakes in empty space!
        }
    } else if (minFriendlyDist === 2 || minFriendlyDist === 3) {
        // Golden Go Spacing (Jumps and Extensions)
        score += 22;
    }

    // 7. EDGE PENALTIES (Line of Death in Opening)
    const distEdgeR = Math.min(r, boardSize - 1 - r);
    const distEdgeC = Math.min(c, boardSize - 1 - c);
    const lineMin = Math.min(distEdgeR, distEdgeC);

    if (lineMin === 0 && totalFriendlyStones < 8) {
        score -= 40; // 1st line in opening is suicidal waste
    } else if (lineMin === 1 && totalFriendlyStones < 5) {
        score -= 20; // 2nd line too early
    }

    return score;
}

/** Generates a smart policy using the master Go heuristic */
function smartPolicy(sim: GoSimulator, legalMoveIds: string[], boardSize: number, currentPlayer: Player, moveCount: number): { policy: number[], chosenMove: string | null } {
    const totalCells = boardSize * boardSize;
    const policy = new Array(totalCells + 1).fill(0); // +1 for PASS

    if (legalMoveIds.length === 0) {
        policy[totalCells] = 1.0;
        return { policy, chosenMove: null };
    }

    const scores: { move: string, score: number }[] = [];
    let maxScore = -999999;

    for (const move of legalMoveIds) {
        const score = evaluateMoveHeuristic(sim, move, boardSize, currentPlayer, moveCount);
        scores.push({ move, score });
        if (score > maxScore) maxScore = score;
    }

    // Baseline score for pass
    const passScore = -15;
    if (passScore > maxScore) maxScore = passScore;

    let expSum = 0;
    const exps: Record<string, number> = {};
    for (const s of scores) {
        if (s.score <= -9990) continue;
        const e = Math.exp((s.score - maxScore) / 2.0); // Temperature scaled
        exps[s.move] = e;
        expSum += e;
    }
    const passExp = Math.exp((passScore - maxScore) / 2.0);
    expSum += passExp;

    if (expSum === 0 || !isFinite(expSum)) {
        policy[totalCells] = 1.0;
        return { policy, chosenMove: null };
    }

    let bestMove: string | null = null;
    let highestProb = -1;

    for (const s of scores) {
        if (s.score <= -9990) continue;
        const prob = exps[s.move] / expSum;
        const [r, c] = s.move.split('-').map(Number);
        policy[r * boardSize + c] = prob;

        if (prob > highestProb) {
            highestProb = prob;
            bestMove = s.move;
        }
    }

    policy[totalCells] = passExp / expSum;
    if (policy[totalCells] > highestProb) {
        bestMove = null;
    }

    // AlphaZero exploration noise
    if (Math.random() < 0.20 && legalMoveIds.length > 0) {
        bestMove = randomChoice(legalMoveIds);
    }

    return { policy, chosenMove: bestMove };
}

// ── Game Simulation ───────────────────────────────────────────────────────────

interface PositionRecord {
    tensor: number[][][];
    current_player: Player;
    policy_target: number[];
    value_target: number[];     // [p_current, p_opponent]
    ownership_target: number[][];
}

interface GameRecord {
    board_size: number;
    result: { black: number; white: number; komi: number };
    winner: Player;
    move_count: number;
    positions: PositionRecord[];
}

function playSmartGame(boardSize: 9 | 13 | 19, topologyArg: string): GameRecord {
    let chosenTopology: 'square' | 'circle' | 'triangle' | 'eroded' | 'oni' = 'square';
    if (topologyArg === 'mixed') {
        const allTopos: Array<'square' | 'circle' | 'triangle' | 'eroded' | 'oni'> = ['square', 'circle', 'triangle', 'eroded', 'oni'];
        chosenTopology = randomChoice(allTopos);
    } else if (['square', 'circle', 'triangle', 'eroded', 'oni'].includes(topologyArg)) {
        chosenTopology = topologyArg as any;
    }

    const sim = new GoSimulator(boardSize, 6.5, chosenTopology);
    const positions: PositionRecord[] = [];
    let currentPlayer: Player = 1;
    let moveCount = 0;

    while (!sim.isOver && moveCount < MAX_MOVES_PER_GAME) {
        const legalMoves = sim.getLegalMoves(currentPlayer);

        const tensor = sim.toTensor(currentPlayer);
        const { policy: policyTarget, chosenMove } = smartPolicy(sim, legalMoves, boardSize, currentPlayer, moveCount);

        if (chosenMove === null) {
            sim.pass(currentPlayer);
        } else {
            sim.tryPlace(chosenMove, currentPlayer);
        }

        positions.push({
            tensor,
            current_player: currentPlayer,
            policy_target: policyTarget,
            value_target: [0, 0], // filled in after game ends
            ownership_target: [], // filled in after game ends
        });

        currentPlayer = currentPlayer === 1 ? 2 : 1;
        moveCount++;
    }

    // Score the game
    const { blackScore, whiteScore, winner, territoryMap } = sim.scoreTerritory();

    // Fill value and ownership targets retroactively
    for (const pos of positions) {
        // Value: [1, 0] if current player won, [0, 1] if opponent won
        if (winner === pos.current_player) {
            pos.value_target = [1, 0];
        } else {
            pos.value_target = [0, 1];
        }

        // Ownership: 1.0 if owned by current player, -1.0 if opponent
        const N = boardSize;
        const ownTarget: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
        for (const [id, owner] of territoryMap) {
            const [r, c] = id.split('-').map(Number);
            if (owner === pos.current_player) ownTarget[r][c] = 1.0;
            else if (owner !== pos.current_player) ownTarget[r][c] = -1.0;
        }
        pos.ownership_target = ownTarget;
    }

    return {
        board_size: boardSize,
        result: { black: blackScore, white: whiteScore, komi: 6.5 },
        winner,
        move_count: moveCount,
        positions,
    };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('='.repeat(60));
    console.log('  CrazyGoNet — Game Generator (Phase 1)');
    console.log('='.repeat(60));
    console.log(`  Board size:  ${BOARD_SIZE}x${BOARD_SIZE}`);
    console.log(`  Total games: ${TOTAL_GAMES}`);
    console.log(`  Batch size:  ${BATCH_SIZE} games per file`);
    console.log(`  Output:      ${OUTPUT_DIR}`);
    console.log('='.repeat(60));
    console.log();

    let batchIndex = 0;
    let batchGames: GameRecord[] = [];
    let totalPositions = 0;

    const startTime = Date.now();

    for (let g = 0; g < TOTAL_GAMES; g++) {
        const game = playSmartGame(BOARD_SIZE, TOPOLOGY_ARG);
        batchGames.push(game);
        totalPositions += game.positions.length;

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const pct = (((g + 1) / TOTAL_GAMES) * 100).toFixed(1);
        process.stdout.write(
            `\r  Game ${g + 1}/${TOTAL_GAMES} (${pct}%) | ` +
            `Winner: P${game.winner} | ` +
            `Moves: ${game.move_count} | ` +
            `Positions: ${totalPositions} | ` +
            `Time: ${elapsed}s`
        );

        // Write batch to disk using file streams to avoid Node.js string length limit
        if (batchGames.length >= BATCH_SIZE || g === TOTAL_GAMES - 1) {
            const batchFile = path.join(OUTPUT_DIR, `batch_${String(batchIndex).padStart(4, '0')}.jsonl`);
            const fd = fs.openSync(batchFile, 'w');
            for (const gm of batchGames) {
                fs.writeSync(fd, JSON.stringify(gm) + '\n');
            }
            fs.closeSync(fd);
            console.log(`\n  [Saved] ${batchFile} (${batchGames.length} games)`);
            batchGames = [];
            batchIndex++;
        }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log();
    console.log('='.repeat(60));
    console.log(`  Done! Generated ${TOTAL_GAMES} games, ${totalPositions} positions`);
    console.log(`  Time: ${totalTime}s | Files: ${batchIndex}`);
    console.log(`  Avg positions per game: ${Math.round(totalPositions / TOTAL_GAMES)}`);
    console.log('='.repeat(60));
}

main();
