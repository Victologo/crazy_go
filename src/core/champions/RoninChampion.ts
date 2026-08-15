// champions/RoninChampion.ts - Habilidad Pasiva: Filo del Samurai (cada 25 turnos elimina 1 piedra enemiga)
import type { GraphBoard, PlayerId } from '../GraphBoard';
import type { GameState } from '../GameState';
import { RulesEngine } from '../RulesEngine';
import { RoninVFX } from '../../graphics/vfx/RoninVFX';
import { t } from '../../i18n/i18n';

export class RoninChampion {
    /**
     * Evalúa la pasiva de Ronin al finalizar un turno.
     * Cada 25 turnos del jugador (o rondas de combate), corta y elimina aleatoriamente 1 piedra enemiga.
     */
    public static checkPassiveTrigger(
        board: GraphBoard,
        state: GameState,
        playerId: PlayerId,
        svgElement: SVGSVGElement | null,
        onTrigger: (msg: string) => void
    ): boolean {
        // Turnos personales acumulados del jugador con el campeón Ronin
        const playerTurns = state.getPlayerTurnCount(playerId);

        // Se activa exactamente cada 25 turnos (Turno 25, 50, 75...)
        if (playerTurns === 0 || playerTurns % 25 !== 0) {
            return false;
        }

        // Buscar piedras enemigas vulnerables (no protegidas por escudo divino)
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

        // Disparar animación visual de tajo de katana con ráfaga de viento y sonido samurai
        if (svgElement) {
            RoninVFX.triggerWindSlash({ x: target.x, y: target.y }, svgElement);
        }

        // Eliminar la piedra enemiga y sumar captura al jugador Ronin
        targetNode.stone = null;
        state.addCaptures(playerId, 1);

        // Evaluar si la eliminación rompió libertades y causó capturas en cadena
        const extraCaptured = RulesEngine.resolveBoardCaptures(board, state, playerId);
        const otherPid = (state.playerCount === 2 ? (playerId === 1 ? 2 : 1) : (((playerId % state.playerCount) + 1) as PlayerId));
        RulesEngine.resolveBoardCaptures(board, state, otherPid);

        const extraMsg = extraCaptured > 0 ? ` (+${extraCaptured})` : '';
        const msg = t('champion.ronin.passive_trigger_msg', {
            turn: playerTurns.toString(),
            nodeId: target.id,
            extra: extraMsg
        }) || `🗡️💨 ¡Filo del Samurai (Turno ${playerTurns})! El Ronin desenvainó su katana y rebanó 1 piedra enemiga en [${target.id}].${extraMsg}`;

        onTrigger(msg);

        return true;
    }
}
