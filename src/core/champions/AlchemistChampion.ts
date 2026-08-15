// champions/AlchemistChampion.ts - Habilidad Activa: Inversión Cromática
import type { ChampionActiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import type { GameState } from '../GameState';
import type { BoardSize } from '../../types';
import { RulesEngine } from '../RulesEngine';
import { SoundFX } from '../../audio/SoundFX';
import { AlchemistVFX } from '../../graphics/vfx/AlchemistVFX';

export const AlchemistActiveSkill: ChampionActiveSkill = {
    name: 'Chromatic Inversion',
    icon: '⚗️',
    description: 'Transmutes the color of stones on the board (1 on 9x9, 2 on 13x13, 3 on 19x19 in the same turn). Turn automatically passes upon completion.',
    targetingMode: 'convert_enemy'
};

export class AlchemistChampion {
    public static getInversionCount(boardOrSize?: GraphBoard | BoardSize | number | null): number {
        if (!boardOrSize) return 1;

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
            return 3; // 19x19 -> 3 inversions
        } else if (totalNodes > 100) {
            return 2; // 13x13 -> 2 inversions
        } else {
            return 1; // 9x9 -> 1 inversion
        }
    }

    public static executeSkill(
        board: GraphBoard,
        state: GameState,
        targetNodeId: string,
        playerId: PlayerId,
        currentInversionsRemaining: number,
        svgElement: SVGSVGElement | null,
        onSuccess: (msg: string) => void,
        onError: (msg: string) => void,
        onComplete: () => void
    ): { success: boolean; newInversionsRemaining: number; isFinished: boolean } {
        const centerNode = board.nodes.get(targetNodeId);
        if (!centerNode) return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false };

        if (!centerNode.stone) {
            SoundFX.playIllegal();
            onError('You must select an intersection with a stone to invert its color.');
            return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false };
        }

        if (centerNode.stone.isIndestructible) {
            SoundFX.playIllegal();
            onError('🛡️ This stone is protected by the Sacred Shield and is immune to transmutation!');
            return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false };
        }

        if (svgElement) {
            AlchemistVFX.triggerTransmuteSlash({ x: centerNode.x, y: centerNode.y }, svgElement);
        }

        // Invert color
        if (centerNode.stone.playerId === playerId) {
            centerNode.stone.playerId = (state.playerCount === 2 ? (playerId === 1 ? 2 : 1) : (((playerId % state.playerCount) + 1) as PlayerId));
        } else {
            centerNode.stone.playerId = playerId;
        }

        // Resolve captures
        const capturedCurrent = RulesEngine.resolveBoardCaptures(board, state, playerId);
        const otherPid = (state.playerCount === 2 ? (playerId === 1 ? 2 : 1) : (((playerId % state.playerCount) + 1) as PlayerId));
        const capturedOther = RulesEngine.resolveBoardCaptures(board, state, otherPid);
        const totalCaptured = capturedCurrent + capturedOther;

        if (totalCaptured > 0) {
            SoundFX.playCapture();
        }

        let invRemaining = currentInversionsRemaining;
        if (invRemaining <= 0) {
            invRemaining = this.getInversionCount(board);
        }
        invRemaining = Math.max(0, invRemaining - 1);

        const captureMsg = totalCaptured > 0 
            ? ` And captured ${totalCaptured} stone(s) with 0 liberties!`
            : '';

        if (invRemaining > 0) {
            onSuccess(`⚗️ Alchemical Transmutation performed!${captureMsg} Select ${invRemaining} more stone(s) this turn.`);
            return { success: true, newInversionsRemaining: invRemaining, isFinished: false };
        } else {
            onSuccess(`⚗️ Alchemical Transmutation completed!${captureMsg} Passing turn...`);
            onComplete();
            return { success: true, newInversionsRemaining: 0, isFinished: true };
        }
    }
}
