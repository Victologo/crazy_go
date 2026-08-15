// champions/HimikoChampion.ts - Habilidad Pasiva: Lluvia Pétrea Celestial
import type { ChampionPassiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import type { GameState } from '../GameState';
import { RulesEngine } from '../RulesEngine';
import { HimikoVFX } from '../../graphics/vfx/HimikoVFX';

import type { BoardSize } from '../../types';

export const HimikoPassiveSkill: ChampionPassiveSkill = {
    name: 'Celestial Stone Rain',
    icon: '🌧️',
    description: 'At the end of your 15th personal turn, allied stones rain down from heaven onto random empty intersections (4 on 9x9, 7 on 13x13, 13 on 19x19).',
    conditionDesc: 'At end of Turn 15'
};

export class HimikoChampion {
    /**
     * Sublinear Diminishing Returns Formula for Himiko's Celestial Stone Rain:
     * - Reduces density as the board grows so larger boards are not overwhelmed:
     *   f(N) = round( 4 * (N / 81)^0.7885 )
     * - Exact values:
     *   - 9x9 (81 intersections): 4 * (81/81)^0.7885 = 4 stones
     *   - 13x13 (169 intersections): 4 * (169/81)^0.7885 ≈ 7.15 -> 7 stones
     *   - 19x19 (361 intersections): 4 * (361/81)^0.7885 = 13.00 -> 13 stones
     *   - Any future / procedural size (N intersections): Math.max(1, Math.min(validCount, Math.round(4 * Math.pow(validCount / 81, 0.7885))))
     */
    public static getStoneRainCount(boardOrSize?: GraphBoard | BoardSize | number | null): number {
        if (!boardOrSize) return 4;

        let validCount: number;
        if (typeof boardOrSize === 'number') {
            if (boardOrSize === 19) validCount = 361;
            else if (boardOrSize === 13) validCount = 169;
            else if (boardOrSize === 9) validCount = 81;
            else validCount = boardOrSize;
        } else if (typeof boardOrSize === 'object' && 'nodes' in boardOrSize) {
            validCount = Array.from(boardOrSize.nodes.values()).filter(
                n => n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE'
            ).length;
        } else {
            validCount = 81;
        }

        return Math.max(1, Math.min(validCount, Math.round(4 * Math.pow(validCount / 81, 0.7885))));
    }

    public static checkAndTriggerPassive(
        board: GraphBoard,
        state: GameState,
        playerId: PlayerId,
        svgElement: SVGSVGElement | null,
        onNotify: (msg: string) => void,
        onBoardUpdated: () => void
    ): boolean {
        const emptyNodes = Array.from(board.nodes.values()).filter(
            n => n.stone === null && n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE'
        );
        if (emptyNodes.length === 0) return false;

        const stoneCount = this.getStoneRainCount(board);

        // Fisher-Yates shuffle
        const shuffled = [...emptyNodes];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const chosen = shuffled.slice(0, Math.min(stoneCount, shuffled.length));
        const coords = chosen.map(n => ({ x: n.x, y: n.y }));

        const placeStoneAt = (idx: number) => {
            const node = chosen[idx];
            if (node) {
                node.stone = {
                    id: state.entityManager.createEntity(),
                    playerId: playerId,
                    isInvisible: false,
                    isIndestructible: false,
                    isFrozen: false,
                    stoneType: 'single'
                };
                RulesEngine.resolveBoardCaptures(board, state, playerId);
                onBoardUpdated();
            }
        };

        const onAllFinished = () => {
            onNotify(`🌧️✨ Himiko’s Celestial Stone Rain! Upon finishing personal turn 15, ${chosen.length} blessed allied stones descended onto the Goban.`);
            onBoardUpdated();
        };

        if (svgElement) {
            HimikoVFX.triggerStoneRainBeams(coords, svgElement, placeStoneAt, onAllFinished);
        } else {
            chosen.forEach((_, idx) => placeStoneAt(idx));
            onAllFinished();
        }

        return true;
    }
}
