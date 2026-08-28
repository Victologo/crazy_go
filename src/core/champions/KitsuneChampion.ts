// champions/KitsuneChampion.ts - Habilidad Activa: Escudo Divino
import type { ChampionActiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import type { BoardSize } from '../../types';
import { SoundFX } from '../../audio/SoundFX';
import { getLanguage } from '../../i18n/i18n';

export const KitsuneActiveSkill: ChampionActiveSkill = {
    name: 'Divine Shield',
    icon: '🛡️',
    description: 'Select an allied stone: its ENTIRE GROUP becomes consecrated with a Golden Aura. It is indestructible and immune to capture for 2 turns. Cost scales with group size (1 charge per 5 stones).',
    targetingMode: 'shield_target'
};

export class KitsuneChampion {
    public static getShieldCharges(boardOrSize?: GraphBoard | BoardSize | number | { shape?: string; size?: number } | null): number {
        if (!boardOrSize) return 2;

        if (typeof boardOrSize === 'object' && boardOrSize && 'shape' in boardOrSize && (boardOrSize as any).shape === 'oni') {
            return 5; // Máscara Oni siempre escala como 19x19 (5 escudos divinos)
        }

        let totalNodes: number;
        if (typeof boardOrSize === 'number') {
            if (boardOrSize >= 19) totalNodes = 361;
            else if (boardOrSize >= 13) totalNodes = 169;
            else if (boardOrSize === 9) totalNodes = 81;
            else totalNodes = boardOrSize;
        } else if (typeof boardOrSize === 'object' && 'nodes' in boardOrSize) {
            totalNodes = (boardOrSize as GraphBoard).nodes.size;
        } else {
            totalNodes = 81;
        }

        if (totalNodes > 220) {
            return 5; // 19x19 -> 5 divine shields
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
        cost: number,
        onSuccess: (msg: string) => void,
        onError: (msg: string) => void
    ): boolean {
        const centerNode = board.nodes.get(targetNodeId);
        if (!centerNode) return false;

        const isEn = getLanguage() === 'en';

        if (!centerNode.stone || centerNode.stone.playerId !== playerId) {
            SoundFX.playIllegal();
            onError(isEn ? 'You must select your own stone to bless its group with the Divine Shield.' : 'Debes seleccionar una piedra aliada para bendecir a su grupo con el Escudo Divino.');
            return false;
        }

        const chain = board.getChain(targetNodeId);
        
        let anyShielded = false;
        for (const nodeId of chain) {
            const n = board.nodes.get(nodeId);
            if (n && n.stone && !n.stone.isIndestructible) {
                n.stone.isIndestructible = true;
                // Back to 3 turns since it costs multiple charges! (1 full round = 2 internal turns + 1 buffer)
                n.stone.shieldTurnsLeft = 3; 
                anyShielded = true;
            }
        }

        if (!anyShielded) {
            SoundFX.playIllegal();
            onError(isEn ? 'This group is already fully consecrated with a Divine Shield.' : 'Este grupo ya está completamente consagrado con un Escudo Divino.');
            return false;
        }

        const remaining = Math.max(0, activeChargesLeft - cost);
        const remainingText = remaining > 0 
            ? (isEn ? `(${remaining} charge(s) left)` : `(${remaining} carga(s) restante(s))`) 
            : (isEn ? `(Charges depleted)` : `(Cargas agotadas)`);
        onSuccess(isEn
            ? `🛡️✨ Sacred Group consecrated with Golden Aura! The entire group is indestructible and immune to capture for 2 turns. ${remainingText}`
            : `🛡️✨ ¡Grupo Sagrado consagrado con Aura Dorada! El grupo entero es indestructible e inmune a capturas durante 2 turnos. ${remainingText}`);
        return true;
    }
}
