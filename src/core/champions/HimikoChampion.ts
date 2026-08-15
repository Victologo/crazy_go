// champions/HimikoChampion.ts - Habilidad Pasiva: Lluvia Pétrea Celestial
import type { ChampionPassiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import type { GameState } from '../GameState';
import { RulesEngine } from '../RulesEngine';
import { HimikoVFX } from '../../graphics/vfx/HimikoVFX';

export const HimikoPassiveSkill: ChampionPassiveSkill = {
    name: 'Celestial Stone Rain',
    icon: '🌧️',
    description: 'At the end of your 15th personal turn, allied stones rain down from heaven onto random empty intersections (4 on 9x9, 6 on 13x13, 9 on 19x19).',
    conditionDesc: 'At end of Turn 15'
};

export class HimikoChampion {
    public static getStoneRainCount(board: GraphBoard): number {
        const totalNodes = board.nodes.size;
        if (totalNodes > 220) {
            return 9;  // 19x19
        } else if (totalNodes > 100) {
            return 6;  // 13x13
        } else {
            return 4;  // 9x9
        }
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
