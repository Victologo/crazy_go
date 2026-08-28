// champions/AlchemistChampion.ts - Habilidad Activa: Inversión Cromática
import type { ChampionActiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import type { GameState } from '../GameState';
import type { BoardSize } from '../../types';
import { RulesEngine } from '../RulesEngine';
import { SoundFX } from '../../audio/SoundFX';
import { AlchemistVFX } from '../../graphics/vfx/AlchemistVFX';
import { getLanguage } from '../../i18n/i18n';
import { ModalManager } from '../../ui/ModalManager';

export const AlchemistActiveSkill: ChampionActiveSkill = {
    name: 'Chromatic Inversion',
    icon: '⚗️',
    description: 'Transmutes 1 to 4 stones (based on board size) to any other color. Turn automatically passes upon completion.',
    targetingMode: 'convert_enemy'
};

export class AlchemistChampion {
    public static getInversionCount(boardOrSize?: GraphBoard | BoardSize | number | { shape?: string; size?: number } | null): number {
        if (!boardOrSize) return 1;

        if (typeof boardOrSize === 'object' && boardOrSize && 'shape' in boardOrSize && (boardOrSize as any).shape === 'oni') {
            return 4; // Máscara Oni siempre escala como 19x19 (4 transmutaciones)
        }

        let s = 9;
        if (typeof boardOrSize === 'number') {
            s = boardOrSize;
        } else if (typeof boardOrSize === 'object' && 'nodes' in boardOrSize && typeof (boardOrSize as GraphBoard).nodes !== 'undefined') {
            const count = (boardOrSize as GraphBoard).nodes.size;
            s = count >= 361 ? 19 : (count >= 169 ? 13 : 9);
        }
        if (s >= 19) return 4;
        if (s >= 13) return 2;
        return 1;
    }

    public static async executeSkill(
        board: GraphBoard,
        state: GameState,
        targetNodeId: string,
        playerId: PlayerId,
        currentInversionsRemaining: number,
        svgElement: SVGSVGElement | null,
        onSuccess: (msg: string) => void,
        onError: (msg: string) => void
    ): Promise<{ success: boolean; newInversionsRemaining: number; isFinished: boolean; cancelled?: boolean }> {
        const centerNode = board.nodes.get(targetNodeId);
        // console.log('🎯 [AlchemistChampion] executeSkill called on targetNodeId:', targetNodeId, 'centerNode:', centerNode, 'playerId:', playerId, 'playerCount:', state.playerCount);
        if (!centerNode) return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false };

        const isEn = getLanguage() === 'en';

        if (!centerNode.stone) {
            console.warn('⚠️ [AlchemistChampion] Node has no stone!');
            SoundFX.playIllegal();
            onError(isEn ? 'You must select an intersection with a stone to invert its color.' : 'Debes seleccionar una intersección con una piedra para invertir su color.');
            return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false, cancelled: false };
        }

        if (centerNode.stone.isIndestructible) {
            console.warn('⚠️ [AlchemistChampion] Stone is indestructible (Divine Shield)!');
            SoundFX.playIllegal();
            onError(isEn ? '🛡️ This stone is protected by the Sacred Shield and is immune to transmutation!' : '🛡️ ¡Esta piedra está protegida por el Escudo Divino y es inmune a la transmutación!');
            return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false, cancelled: false };
        }

        // Determine target color
        let targetColor: PlayerId;
        if (state.playerCount === 2) {
            targetColor = (centerNode.stone.playerId === playerId) ? (playerId === 1 ? 2 : 1) : playerId;
            // console.log('🎯 [AlchemistChampion] 2-Player mode, transmuting directly to:', targetColor);
        } else {
            // console.log('🎯 [AlchemistChampion] 4-Player mode, opening color picker modal...');
            const chosenColor = await ModalManager.openColorPickerModal();
            // console.log('🎯 [AlchemistChampion] ModalManager returned chosenColor:', chosenColor);
            if (!chosenColor) {
                // console.log('🎯 [AlchemistChampion] Color picker cancelled');
                onError(isEn ? 'Transmutation cancelled.' : 'Transmutación cancelada.');
                return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false, cancelled: true };
            }
            targetColor = chosenColor;
        }

        // console.log('🎯 [AlchemistChampion] Transmuting node to color:', targetColor);
        const transmutedNodeIds = RulesEngine.transmuteStoneAndPolyGroup(board, centerNode.id, targetColor);
        // console.log('🎯 [AlchemistChampion] Transmuted nodes:', transmutedNodeIds);

        if (svgElement) {
            for (const nid of transmutedNodeIds) {
                const targetNode = board.nodes.get(nid);
                if (targetNode) {
                    AlchemistVFX.triggerTransmuteSlash({ x: targetNode.x, y: targetNode.y }, svgElement);
                }
            }
        }
        SoundFX.playAlchemicalTransmute();

        // Resolve captures
        const currentPid = targetColor;
        const totalCaptured = RulesEngine.resolveBoardCaptures(board, state, currentPid);
        if (totalCaptured > 0) SoundFX.playCapture();

        const remaining = currentInversionsRemaining - 1;
        const isFinished = true; // El usuario pidió máximo 1 por turno
        // NOTA: el passTurn() lo ejecuta ChampionManager DESPUÉS de poner alchemistUsedThisTurn=true
        // para evitar que advanceTurn() resetee el flag antes de poder usarlo como barrera.

        const msg = isEn 
            ? `⚗️ Alchemist converted a stone! Turn passed. (${remaining} uses left in match)`
            : `⚗️ ¡El Alquimista ha convertido una piedra! El turno ha pasado. (Quedan ${remaining} usos en la partida)`;

        onSuccess(msg);
        return { success: true, newInversionsRemaining: remaining, isFinished: isFinished };
    }
}
