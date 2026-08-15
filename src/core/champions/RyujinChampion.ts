// champions/RyujinChampion.ts - Habilidad Pasiva: Furia del Dragón
import type { ChampionPassiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import { SoundFX } from '../../audio/SoundFX';
import { RyujinVFX } from '../../graphics/vfx/RyujinVFX';

export const RyujinPassiveSkill: ChampionPassiveSkill = {
    name: 'Furia del Dragón',
    icon: '🐉',
    description: 'Al consolidar grupos vivos o expandir ojos (2 en 9x9 con 2 ojos; 3 en 13x13 con 3+ ojos o múltiples grupos; y +1 por cada ojo adicional en 19x19), calcina cualquier piedra aliada o enemiga.',
    conditionDesc: 'Estructuras Vivas / Expansión de Ojos'
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
            // Tablero 9x9: Al crear 1 grupo de 2 ojos -> 2 calcinaciones
            if (livingGroups.length >= 1 && isPassiveAvailable) {
                onNotify("🐉🔥 ¡Furia del Dragón de Ryūjin activada! ¡Has consolidado un Grupo Vivo con Doble Ojo! Selecciona 2 piedras en el tablero (aliadas o enemigas) para calcinarlas.");
                onBoardUpdated();
                return { triggered: true, burnsGranted: 2, newEarnedBurns19x19: 0 };
            }
        } else if (totalNodes <= 220) {
            // Tablero 13x13: Solo si tiene 1 estructura con 3+ ojos O >= 2 estructuras con 2+ ojos -> 3 calcinaciones
            const has3Eyes = livingGroups.some(g => g.eyesCount >= 3);
            const has2OrMoreGroups = livingGroups.length >= 2;

            if ((has3Eyes || has2OrMoreGroups) && isPassiveAvailable) {
                onNotify("🐉🔥 ¡Furia del Dragón Ancestral de Ryūjin! ¡Has consolidado una estructura suprema (3+ ojos o múltiples grupos vivos)! Selecciona 3 piedras en el tablero para calcinarlas.");
                onBoardUpdated();
                return { triggered: true, burnsGranted: 3, newEarnedBurns19x19: 0 };
            }
        } else {
            // Tablero 19x19: 1 calcinación por grupo de 2 ojos, +1 por cada ojo adicional (fórmula n-1 acumulativa)
            let totalPotentialBurns = 0;
            for (const g of livingGroups) {
                totalPotentialBurns += (g.eyesCount - 1);
            }

            const newBurns = totalPotentialBurns - ryujinEarnedBurns19x19;
            if (newBurns > 0) {
                const totalBurnsRemaining = newBurns;
                onNotify(`🐉🔥 ¡Furia del Dragón Infinito de Ryūjin! ¡Tu estructura viva se ha expandido (+${newBurns} aliento(s) de fuego)! Selecciona ${totalBurnsRemaining} piedra(s) para calcinar.`);
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
            onError('Debes seleccionar una casilla con piedra para calcinarla con la Furia del Dragón.');
            return { success: false, newBurnsRemaining: currentBurnsRemaining, isFinished: false };
        }

        if (centerNode.stone.isIndestructible) {
            SoundFX.playIllegal();
            onError('🛡️ ¡Esta piedra está bendecida por el Escudo Divino y su Aura Sagrada es inmune a las llamas del Dragón!');
            return { success: false, newBurnsRemaining: currentBurnsRemaining, isFinished: false };
        }

        centerNode.stone = null;
        const burnsLeft = Math.max(0, currentBurnsRemaining - 1);

        if (svgElement) {
            RyujinVFX.triggerDragonFlame({ x: centerNode.x, y: centerNode.y }, svgElement);
        }

        if (burnsLeft > 0) {
            onSuccess(`🔥 ¡Llama del Dragón! Selecciona ${burnsLeft} piedra(s) más para calcinar.`);
            onComplete();
            return { success: true, newBurnsRemaining: burnsLeft, isFinished: false };
        } else {
            onSuccess('🐉🔥 ¡Furia del Dragón completada! Las piedras seleccionadas han sido reducidas a cenizas.');
            onComplete();
            return { success: true, newBurnsRemaining: 0, isFinished: true };
        }
    }
}
