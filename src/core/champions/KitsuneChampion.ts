// champions/KitsuneChampion.ts - Habilidad Activa: Escudo Divino
import type { ChampionActiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import type { BoardSize } from '../../types';
import { SoundFX } from '../../audio/SoundFX';

export const KitsuneActiveSkill: ChampionActiveSkill = {
    name: 'Escudo Divino',
    icon: '🛡️',
    description: 'Selecciona una piedra aliada: se convierte en Piedra Sagrada con Aura Dorada indestructible e inmune a capturas y poderes durante 2 turnos (2 cargas en 9x9, 3 en 13x13, 4 en 19x19).',
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
            return 4; // 19x19 -> 4 escudos divinos
        } else if (totalNodes > 100) {
            return 3; // 13x13 -> 3 escudos divinos
        } else {
            return 2; // 9x9 -> 2 escudos divinos
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
            onError('Debes seleccionar una piedra propia para bendecirla con el Escudo Divino.');
            return false;
        }

        if (centerNode.stone.isIndestructible) {
            SoundFX.playIllegal();
            onError('Esta piedra ya está consagrada con un Escudo Divino y su Aura Dorada está activa.');
            return false;
        }

        centerNode.stone.isIndestructible = true;
        centerNode.stone.shieldTurnsLeft = 2;

        const remaining = Math.max(0, activeChargesLeft - 1);
        const remainingText = remaining > 0 ? `(Queda ${remaining} carga)` : `(Cargas agotadas)`;
        onSuccess(`🛡️✨ ¡Piedra Sagrada consagrada con Aura Dorada! Es indestructible e inmune a capturas y poderes durante 2 turnos. ${remainingText}`);
        onComplete();
        return true;
    }
}
