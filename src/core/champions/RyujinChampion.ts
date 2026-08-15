// champions/RyujinChampion.ts - Habilidad Pasiva: Furia del Dragón
import type { ChampionPassiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import { SoundFX } from '../../audio/SoundFX';
import { RyujinVFX } from '../../graphics/vfx/RyujinVFX';

export const RyujinPassiveSkill: ChampionPassiveSkill = {
    name: 'Dragon’s Fury',
    icon: '🐉',
    description: 'Upon consolidating living groups or expanding eyes (2 burns on 9x9 with 2 eyes; 3 burns on 13x13 with 3+ eyes or multiple groups; and +1 per additional eye on 19x19), incinerates any stone on the Goban.',
    conditionDesc: 'Living Structures / Eye Expansion'
};

export class RyujinChampion {
    public static checkPassiveTrigger(
        board: GraphBoard,
        playerId: PlayerId,
        isPassiveAvailable: boolean,
        ryujinEarnedBurns19x19: number,
        onNotify: (msg: string) => void,
        onBoardUpdated: () => void
    ): { triggered: boolean; burnsGranted: number; newEarnedBurns19x19: number } {
        const totalNodes = board.nodes.size;
        const livingGroups = board.getLivingGroupsInfo(playerId).filter(g => g.eyesCount >= 2);

        if (totalNodes <= 100) {
            // 9x9: 1 group of 2 eyes -> 2 burns
            if (livingGroups.length >= 1 && isPassiveAvailable) {
                onNotify("🐉🔥 Ryūjin’s Dragon Fury activated! You consolidated a Living Group with Two Eyes! Select 2 stones on the board to incinerate.");
                onBoardUpdated();
                return { triggered: true, burnsGranted: 2, newEarnedBurns19x19: 0 };
            }
        } else if (totalNodes <= 220) {
            // 13x13: Structure with 3+ eyes OR >= 2 living groups -> 3 burns
            const has3Eyes = livingGroups.some(g => g.eyesCount >= 3);
            const has2OrMoreGroups = livingGroups.length >= 2;

            if ((has3Eyes || has2OrMoreGroups) && isPassiveAvailable) {
                onNotify("🐉🔥 Ryūjin’s Ancient Dragon Fury! You built a supreme living structure (3+ eyes or multiple living groups)! Select 3 stones to incinerate.");
                onBoardUpdated();
                return { triggered: true, burnsGranted: 3, newEarnedBurns19x19: 0 };
            }
        } else {
            // 19x19: 1 burn per 2-eye group, +1 per extra eye
            let totalPotentialBurns = 0;
            for (const g of livingGroups) {
                totalPotentialBurns += (g.eyesCount - 1);
            }

            const newBurns = totalPotentialBurns - ryujinEarnedBurns19x19;
            if (newBurns > 0) {
                const totalBurnsRemaining = newBurns;
                onNotify(`🐉🔥 Ryūjin’s Infinite Dragon Fury! Your living structure expanded (+${newBurns} fire breath(s))! Select ${totalBurnsRemaining} stone(s) to incinerate.`);
                onBoardUpdated();
                return { triggered: true, burnsGranted: newBurns, newEarnedBurns19x19: totalPotentialBurns };
            }
        }

        return { triggered: false, burnsGranted: 0, newEarnedBurns19x19: ryujinEarnedBurns19x19 };
    }

    public static executeBurn(
        board: GraphBoard,
        targetNodeId: string,
        currentBurnsRemaining: number,
        svgElement: SVGSVGElement | null,
        onSuccess: (msg: string) => void,
        onError: (msg: string) => void,
        onComplete: () => void
    ): { success: boolean; newBurnsRemaining: number; isFinished: boolean } {
        const centerNode = board.nodes.get(targetNodeId);
        if (!centerNode) return { success: false, newBurnsRemaining: currentBurnsRemaining, isFinished: false };

        if (!centerNode.stone) {
            SoundFX.playIllegal();
            onError('You must select an intersection with a stone to incinerate with Dragon’s Fury.');
            return { success: false, newBurnsRemaining: currentBurnsRemaining, isFinished: false };
        }

        if (centerNode.stone.isIndestructible) {
            SoundFX.playIllegal();
            onError('🛡️ This stone is protected by the Divine Shield and is immune to dragon flames!');
            return { success: false, newBurnsRemaining: currentBurnsRemaining, isFinished: false };
        }

        centerNode.stone = null;
        const burnsLeft = Math.max(0, currentBurnsRemaining - 1);

        if (svgElement) {
            RyujinVFX.triggerDragonFlame({ x: centerNode.x, y: centerNode.y }, svgElement);
        }

        if (burnsLeft > 0) {
            onSuccess(`🔥 Dragon Flame! Select ${burnsLeft} more stone(s) to incinerate.`);
            onComplete();
            return { success: true, newBurnsRemaining: burnsLeft, isFinished: false };
        } else {
            onSuccess('🐉🔥 Dragon’s Fury completed! Target stones reduced to ash.');
            onComplete();
            return { success: true, newBurnsRemaining: 0, isFinished: true };
        }
    }
}
