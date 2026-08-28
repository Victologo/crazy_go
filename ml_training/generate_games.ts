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

/** Creates a uniform policy distribution over legal moves */
function uniformPolicy(legalMoveIds: string[], boardSize: number): number[] {
    const totalCells = boardSize * boardSize;
    const policy = new Array(totalCells + 1).fill(0); // +1 for PASS
    const prob = legalMoveIds.length > 0 ? 1.0 / legalMoveIds.length : 0;
    for (const id of legalMoveIds) {
        const [r, c] = id.split('-').map(Number);
        policy[r * boardSize + c] = prob;
    }
    return policy;
}

// ── Game Simulation ───────────────────────────────────────────────────────────

interface PositionRecord {
    tensor: number[][][];
    current_player: Player;
    policy_target: number[];
    value_target: number[];     // [p_black, p_white]
    ownership_target: number[][];
}

interface GameRecord {
    board_size: number;
    result: { black: number; white: number; komi: number };
    winner: Player;
    move_count: number;
    positions: PositionRecord[];
}

function playRandomGame(boardSize: 9 | 13 | 19, topologyArg: string): GameRecord {
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

        // Extract position snapshot BEFORE the move
        const tensor = sim.toTensor(currentPlayer);
        const policyTarget = uniformPolicy(legalMoves, boardSize);

        // Random move selection (Phase 1: pure random)
        // With small probability, pass even if moves are available (adds diversity)
        const shouldPass = legalMoves.length === 0 || Math.random() < 0.02;

        if (shouldPass) {
            sim.pass(currentPlayer);
        } else {
            const chosen = randomChoice(legalMoves);
            sim.tryPlace(chosen, currentPlayer);
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
    const ownershipTarget = sim.getOwnershipTarget(territoryMap);

    // Fill value and ownership targets retroactively
    const valueTarget: [number, number] = winner === 1 ? [1, 0] : [0, 1];
    for (const pos of positions) {
        pos.value_target = [...valueTarget];
        pos.ownership_target = ownershipTarget;
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
        const game = playRandomGame(BOARD_SIZE, TOPOLOGY_ARG);
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
