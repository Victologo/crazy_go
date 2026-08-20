// champions/RyujinChampion.ts - Habilidad Pasiva: Furia del Dragón
import type { ChampionPassiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import { RulesEngine } from '../RulesEngine';
import { SoundFX } from '../../audio/SoundFX';
import { RyujinVFX } from '../../graphics/vfx/RyujinVFX';
import { getLanguage } from '../../i18n/i18n';

export const RyujinPassiveSkill: ChampionPassiveSkill = {
    name: 'Dragon’s Fury',
    icon: '🐉',
    description: 'Upon consolidating living structures: incinerates 2 enemy stones on 9x9 (with 2 eyes); 4 enemy stones on 13x13 (with 3+ eyes); and on 19x19 grants 1 burn per 2-eye group plus 1 burn per additional eye expanded (2→3, 3→4).',
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
        const isEn = getLanguage() === 'en';

        if (totalNodes <= 100) {
            // 9x9: 1 grupo vivo de 2 ojos -> 2 piedras enemigas calcinadas
            if (livingGroups.length >= 1 && isPassiveAvailable) {
                onNotify(isEn 
                    ? "🐉🔥 Ryūjin’s Dragon Fury activated! You formed a Living Group with Two Eyes! Select 2 enemy stones to incinerate."
                    : "🐉🔥 ¡Furia del Dragón de Ryūjin activada! Has consolidado un Grupo Vivo con Dos Ojos. Selecciona 2 piedras enemigas para calcinar.");
                onBoardUpdated();
                return { triggered: true, burnsGranted: 2, newEarnedBurns19x19: 0 };
            }
        } else if (totalNodes <= 220) {
            // 13x13: Grupo vivo de 3+ ojos -> 4 piedras enemigas calcinadas
            const has3Eyes = livingGroups.some(g => g.eyesCount >= 3);

            if (has3Eyes && isPassiveAvailable) {
                onNotify(isEn 
                    ? "🐉🔥 Ryūjin’s Ancient Dragon Fury! You built a supreme living structure (3+ eyes)! Select 4 enemy stones to incinerate."
                    : "🐉🔥 ¡Furia del Dragón Ancestral de Ryūjin! Has forjado una estructura viva de 3+ ojos. Selecciona 4 piedras enemigas para calcinar.");
                onBoardUpdated();
                return { triggered: true, burnsGranted: 4, newEarnedBurns19x19: 0 };
            }
        } else {
            // 19x19: 1 quema por cada grupo de 2 ojos, y +1 quema por cada ojo adicional (2->3, 3->4, etc.)
            let totalPotentialBurns = 0;
            for (const g of livingGroups) {
                totalPotentialBurns += (g.eyesCount - 1);
            }

            const newBurns = totalPotentialBurns - ryujinEarnedBurns19x19;
            if (newBurns > 0) {
                onNotify(isEn 
                    ? `🐉🔥 Ryūjin’s Infinite Dragon Fury! Living structure expanded (+${newBurns} flame(s))! Select ${newBurns} enemy stone(s) to incinerate.`
                    : `🐉🔥 ¡Furia Infinita de Ryūjin! Tu estructura viva se ha expandido (+${newBurns} llamarada(s)). Selecciona ${newBurns} piedra(s) enemiga(s) para calcinar.`);
                onBoardUpdated();
                return { triggered: true, burnsGranted: newBurns, newEarnedBurns19x19: totalPotentialBurns };
            }
        }

        return { triggered: false, burnsGranted: 0, newEarnedBurns19x19: ryujinEarnedBurns19x19 };
    }

    public static executeBurn(
        board: GraphBoard,
        targetNodeId: string,
        _playerId: PlayerId,
        currentBurnsRemaining: number,
        svgElement: SVGSVGElement | null,
        onSuccess: (msg: string) => void,
        onError: (msg: string) => void
    ): { success: boolean; newBurnsRemaining: number; isFinished: boolean } {
        const centerNode = board.nodes.get(targetNodeId);
        if (!centerNode) return { success: false, newBurnsRemaining: currentBurnsRemaining, isFinished: false };

        const isEn = getLanguage() === 'en';

        if (!centerNode.stone) {
            SoundFX.playIllegal();
            onError(isEn 
                ? '🔥 Dragon\'s Fury: select any stone to incinerate.' 
                : '🔥 Furia del Dragón: selecciona cualquier piedra para calcinar.');
            return { success: false, newBurnsRemaining: currentBurnsRemaining, isFinished: false };
        }

        if (centerNode.stone.isIndestructible) {
            SoundFX.playIllegal();
            onError(isEn 
                ? '🛡️ This stone is protected by the Divine Shield and is immune to dragon flames!' 
                : '🛡️ ¡Esta piedra está protegida por el Escudo Divino y es inmune a las llamas del dragón!');
            return { success: false, newBurnsRemaining: currentBurnsRemaining, isFinished: false };
        }

        const removedNodeIds = RulesEngine.destroyStoneAndPolyGroup(board, null, centerNode.id);
        const burnsLeft = Math.max(0, currentBurnsRemaining - 1);

        if (svgElement) {
            for (const nid of removedNodeIds) {
                const targetNode = board.nodes.get(nid);
                if (targetNode) {
                    RyujinVFX.triggerDragonFlame({ x: targetNode.x, y: targetNode.y }, svgElement);
                }
            }
        }

        if (burnsLeft > 0) {
            onSuccess(isEn 
                ? `🔥 Dragon Flame! Select ${burnsLeft} more stone(s) to incinerate.` 
                : `🔥 ¡Llamarada del Dragón! Selecciona ${burnsLeft} piedra(s) más para calcinar.`);
            return { success: true, newBurnsRemaining: burnsLeft, isFinished: false };
        } else {
            onSuccess(isEn 
                ? '🐉🔥 Dragon\'s Fury completed! Stones reduced to ash.' 
                : '🐉🔥 ¡Furia del Dragón completada! Las piedras han sido reducidas a cenizas.');
            return { success: true, newBurnsRemaining: 0, isFinished: true };
        }
    }
}
