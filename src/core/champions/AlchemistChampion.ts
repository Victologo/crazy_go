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
    public static getInversionCount(boardOrSize?: GraphBoard | BoardSize | number | null): number {
        let s = 9;
        if (typeof boardOrSize === 'number') {
            s = boardOrSize;
        } else if (boardOrSize && typeof (boardOrSize as GraphBoard).nodes !== 'undefined') {
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
    ): Promise<{ success: boolean; newInversionsRemaining: number; isFinished: boolean }> {
        const centerNode = board.nodes.get(targetNodeId);
        if (!centerNode) return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false };

        const isEn = getLanguage() === 'en';

        if (!centerNode.stone) {
            SoundFX.playIllegal();
            onError(isEn ? 'You must select an intersection with a stone to invert its color.' : 'Debes seleccionar una intersección con una piedra para invertir su color.');
            return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false };
        }

        if (centerNode.stone.isIndestructible) {
            SoundFX.playIllegal();
            onError(isEn ? '🛡️ This stone is protected by the Sacred Shield and is immune to transmutation!' : '🛡️ ¡Esta piedra está protegida por el Escudo Divino y es inmune a la transmutación!');
            return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false };
        }

        // Determine target color
        let targetColor: PlayerId;
        if (state.playerCount === 2) {
            targetColor = (centerNode.stone.playerId === playerId) ? (playerId === 1 ? 2 : 1) : playerId;
        } else {
            const chosenColor = await ModalManager.openColorPickerModal();
            if (!chosenColor) {
                onError(isEn ? 'Transmutation cancelled.' : 'Transmutación cancelada.');
                return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false };
            }
            targetColor = chosenColor;
        }

        const transmutedNodeIds = RulesEngine.transmuteStoneAndPolyGroup(board, centerNode.id, targetColor);

        if (svgElement) {
            for (const nid of transmutedNodeIds) {
                const targetNode = board.nodes.get(nid);
                if (targetNode) {
                    AlchemistVFX.triggerTransmuteSlash({ x: targetNode.x, y: targetNode.y }, svgElement);
                }
            }
        }

        // Resolve captures
        const currentPid = targetColor;
        const capturedCurrent = RulesEngine.resolveBoardCaptures(board, state, currentPid);
        const otherPid = currentPid === 1 ? 2 : 1;
        const capturedOther = RulesEngine.resolveBoardCaptures(board, state, otherPid as PlayerId);
        const totalCaptured = capturedCurrent + capturedOther;
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
