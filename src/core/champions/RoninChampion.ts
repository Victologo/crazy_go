// champions/RoninChampion.ts - Habilidad Pasiva: Corte del Filo Silencioso (cada 25 turnos elimina 1 piedra enemiga)
import type { GraphBoard, PlayerId } from '../GraphBoard';
import type { GameState } from '../GameState';
import { RulesEngine } from '../RulesEngine';
import { SoundFX } from '../../audio/SoundFX';
import { RoninVFX } from '../../graphics/vfx/RoninVFX';

export class RoninChampion {
    /**
     * Evalúa la pasiva de Ronin al finalizar un turno.
     * Cada 25 turnos totales del combate (o turnos personales), corta y elimina aleatoriamente 1 piedra enemiga.
     */
    public static checkPassiveTrigger(
        board: GraphBoard,
        state: GameState,
        playerId: PlayerId,
        svgElement: SVGSVGElement | null,
        onTrigger: (msg: string) => void
    ): boolean {
        // Dispara cada 25 jugadas en la partida (ej: turno 25, 50, 75...)
        if (state.moveHistory.length === 0 || state.moveHistory.length % 25 !== 0) {
            return false;
        }

        // Buscar piedras enemigas vulnerables (no protegidas por escudo)
        const enemyNodes: { id: string; x: number; y: number }[] = [];
        board.nodes.forEach((node, id) => {
            if (node.stone && node.stone.playerId !== playerId) {
                if (!node.stone.isIndestructible) {
                    enemyNodes.push({ id, x: node.x, y: node.y });
                }
            }
        });

        if (enemyNodes.length === 0) return false;

        // Seleccionar una piedra enemiga aleatoria
        const target = enemyNodes[Math.floor(Math.random() * enemyNodes.length)];
        const targetNode = board.nodes.get(target.id);
        if (!targetNode || !targetNode.stone) return false;

        // Efecto visual de tajo de viento del samurai
        if (svgElement) {
            RoninVFX.triggerWindSlash({ x: target.x, y: target.y }, svgElement);
        }

        // Eliminar la piedra enemiga y sumar captura al jugador Ronin
        targetNode.stone = null;
        state.addCaptures(playerId, 1);

        SoundFX.playCapture();

        // Evaluar si la eliminación causó capturas en cadena
        const extraCaptured = RulesEngine.resolveBoardCaptures(board, state, playerId);
        const otherPid = (state.playerCount === 2 ? (playerId === 1 ? 2 : 1) : (((playerId % state.playerCount) + 1) as PlayerId));
        RulesEngine.resolveBoardCaptures(board, state, otherPid);

        const extraMsg = extraCaptured > 0 ? ` And caused the capture of ${extraCaptured} additional stone(s)!` : '';
        onTrigger(`⚡ Samurai's Edge (Turn ${state.moveHistory.length})! The Ronin slashed and eradicated 1 enemy stone at [${target.id}].${extraMsg}`);

        return true;
    }
}
