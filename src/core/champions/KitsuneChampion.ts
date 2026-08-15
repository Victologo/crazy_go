// champions/KitsuneChampion.ts - Habilidad Activa: Escudo Divino
import type { ChampionActiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import type { BoardSize } from '../../types';
import { SoundFX } from '../../audio/SoundFX';

export const KitsuneActiveSkill: ChampionActiveSkill = {
    name: 'Divine Shield',
    icon: '🛡️',
    description: 'Select an allied stone: it becomes a Sacred Stone with a Golden Aura, indestructible and immune to capture and skills for 2 turns (2 charges on 9x9, 3 on 13x13, 4 on 19x19).',
    targetingMode: 'shield_target'
};

export class KitsuneChampion {
    public static getShieldCharges(boardOrSize?: GraphBoard | BoardSize | number | null): number {
        if (!boardOrSize) return 2;

        let totalNodes: number;
        if (typeof boardOrSize === 'number') {
            if (boardOrSize === 19) totalNodes = 361;
            else if (boardOrSize === 13) totalNodes = 169;
            else if (boardOrSize === 9) totalNodes = 81;
            else totalNodes = boardOrSize;
        } else if (typeof boardOrSize === 'object' && 'nodes' in boardOrSize) {
            totalNodes = boardOrSize.nodes.size;
        } else {
            totalNodes = 81;
        }

        if (totalNodes > 220) {
            return 4; // 19x19 -> 4 divine shields
        } else if (totalNodes > 100) {
            return 3; // 13x13 -> 3 divine shields
        } else {
            return 2; // 9x9 -> 2 divine shields
        }
    }

    public static executeSkill(
        board: GraphBoard,
        targetNodeId: string,
        playerId: PlayerId,
        activeChargesLeft: number,
        onSuccess: (msg: string) => void,
        onError: (msg: string) => void,
        onComplete: () => void
    ): boolean {
        const centerNode = board.nodes.get(targetNodeId);
        if (!centerNode) return false;

        if (!centerNode.stone || centerNode.stone.playerId !== playerId) {
            SoundFX.playIllegal();
            onError('You must select your own stone to bless with the Divine Shield.');
            return false;
        }

        if (centerNode.stone.isIndestructible) {
            SoundFX.playIllegal();
            onError('This stone is already consecrated with a Divine Shield and its Golden Aura is active.');
            return false;
        }

        centerNode.stone.isIndestructible = true;
        centerNode.stone.shieldTurnsLeft = 2;

        const remaining = Math.max(0, activeChargesLeft - 1);
        const remainingText = remaining > 0 ? `(${remaining} charge left)` : `(Charges depleted)`;
        onSuccess(`🛡️✨ Sacred Stone consecrated with Golden Aura! It is indestructible and immune to capture for 2 turns. ${remainingText}`);
        onComplete();
        return true;
    }
}
