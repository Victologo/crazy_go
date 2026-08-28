// champions/HimikoChampion.ts - Habilidad Pasiva: Lluvia Pétrea Celestial
import type { ChampionPassiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import { SeededRandom } from '../SeededRandom';
import type { GameState } from '../GameState';
import { RulesEngine } from '../RulesEngine';
import { HimikoVFX } from '../../graphics/vfx/HimikoVFX';
import { getLanguage } from '../../i18n/i18n';

import type { BoardSize } from '../../types';

export const HimikoPassiveSkill: ChampionPassiveSkill = {
    name: 'Celestial Stone Rain',
    icon: '🌧️',
    description: 'At the end of your 20th personal turn, allied stones rain down from heaven onto random empty intersections (4 on 9x9, 8 on 13x13, 18 on 19x19).',
    conditionDesc: 'At end of Turn 20'
};

export class HimikoChampion {
    /**
     * Proportional Density Formula for Himiko's Celestial Stone Rain:
     * - Base: 4 stones on 9x9 (81 intersections) -> Density ratio = 4 / 81 (~4.938%)
     * - Universal formula for any board with N intersections:
     *   f(N) = round( N * (4 / 81) )
     * - Exact values:
     *   - 9x9 (81 intersections): round(81 * 4 / 81) = 4 stones
     *   - 13x13 (169 intersections): round(169 * 4 / 81) = round(8.345) = 8 stones
     *   - 19x19 (361 intersections): round(361 * 4 / 81) = round(17.827) = 18 stones
     *   - Any future / procedural size (N intersections): Math.max(1, Math.min(validCount, Math.round((validCount * 4) / 81)))
     */
    public static getStoneRainCount(boardOrSize?: GraphBoard | BoardSize | number | { shape?: string; size?: number } | null): number {
        if (!boardOrSize) return 4;

        if (typeof boardOrSize === 'object' && boardOrSize && 'shape' in boardOrSize && (boardOrSize as any).shape === 'oni') {
            return 18; // Máscara Oni siempre escala como 19x19 (18 piedras celestiales)
        }

        let validCount: number;
        if (typeof boardOrSize === 'number') {
            if (boardOrSize >= 19) validCount = 361;
            else if (boardOrSize >= 13) validCount = 169;
            else if (boardOrSize === 9) validCount = 81;
            else validCount = boardOrSize;
        } else if (typeof boardOrSize === 'object' && 'nodes' in boardOrSize) {
            validCount = Array.from((boardOrSize as GraphBoard).nodes.values()).filter(
                n => n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE'
            ).length;
        } else {
            validCount = 81;
        }

        return Math.max(1, Math.min(validCount, Math.round((validCount * 4) / 81)));
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
            const j = SeededRandom.nextInt(i + 1);
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
            const isEn = getLanguage() === 'en';
            onNotify(isEn
                ? `🌧️✨ Himiko’s Celestial Stone Rain! Upon finishing personal turn 20, ${chosen.length} blessed allied stones descended onto the Goban.`
                : `🌧️✨ ¡Lluvia Pétrea Celestial de Himiko! Al finalizar el turno 20, ${chosen.length} piedras aliadas bendecidas descendieron sobre el Goban.`);
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
