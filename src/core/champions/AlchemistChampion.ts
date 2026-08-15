// champions/AlchemistChampion.ts - Habilidad Activa: Inversión Cromática
import type { ChampionActiveSkill } from './types';
import type { GraphBoard, PlayerId } from '../GraphBoard';
import type { GameState } from '../GameState';
import type { BoardSize } from '../../types';
import { RulesEngine } from '../RulesEngine';
import { SoundFX } from '../../audio/SoundFX';
import { AlchemistVFX } from '../../graphics/vfx/AlchemistVFX';

export const AlchemistActiveSkill: ChampionActiveSkill = {
    name: 'Inversión Cromática',
    icon: '⚗️',
    description: 'Transmuta el color de piedras en el tablero (1 en 9x9, 2 en 13x13, 3 en 19x19 en el mismo turno). Al finalizar las transmutaciones, pasas tu turno automáticamente.',
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
            return 3; // 19x19 -> 3 inversiones en el mismo turno
        } else if (totalNodes > 100) {
            return 2; // 13x13 -> 2 inversiones en el mismo turno
        } else {
            return 1; // 9x9 -> 1 inversión
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
            onError('Debes seleccionar una casilla con piedra para invertir su color.');
            return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false };
        }

        if (centerNode.stone.isIndestructible) {
            SoundFX.playIllegal();
            onError('🛡️ ¡Esta piedra está bendecida por el Escudo Sagrado y es inmune a la transmutación!');
            return { success: false, newInversionsRemaining: currentInversionsRemaining, isFinished: false };
        }

        if (svgElement) {
            AlchemistVFX.triggerTransmuteSlash({ x: centerNode.x, y: centerNode.y }, svgElement);
        }

        // Invertir color: si es aliada -> se vuelve enemiga; si es enemiga -> se vuelve aliada
        if (centerNode.stone.playerId === playerId) {
            centerNode.stone.playerId = (state.playerCount === 2 ? (playerId === 1 ? 2 : 1) : (((playerId % state.playerCount) + 1) as PlayerId));
        } else {
            centerNode.stone.playerId = playerId;
        }

        // EVALUAR Y EJECUTAR CAPTURAS DE GRUPOS QUE HAYAN QUEDADO CON 0 LIBERTADES
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
            ? ` ¡Y se han capturado ${totalCaptured} piedra(s) sin libertades!`
            : '';

        if (invRemaining > 0) {
            onSuccess(`⚗️ ¡Transmutación Alquímica realizada!${captureMsg} Selecciona ${invRemaining} piedra(s) más en este turno.`);
            return { success: true, newInversionsRemaining: invRemaining, isFinished: false };
        } else {
            onSuccess(`⚗️ ¡Transmutación Alquímica completada!${captureMsg} Pasando turno...`);
            onComplete();
            return { success: true, newInversionsRemaining: 0, isFinished: true };
        }
    }
}
