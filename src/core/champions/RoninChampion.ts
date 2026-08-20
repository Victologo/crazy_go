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
     * Se ejecuta con un leve retardo al final del turno para no solapar el sonido ni la animación de colocación de piedra.
     */
    public static checkPassiveTrigger(
        board: GraphBoard,
        state: GameState,
        playerId: PlayerId,
        svgElement: SVGSVGElement | null,
        onTrigger: (msg: string) => void,
        onBoardUpdated?: () => void
    ): boolean {
        // Turnos personales acumulados del jugador con el campeón Ronin
        const playerTurns = state.getPlayerTurnCount(playerId);

        // Se activa exactamente cada 17 turnos (Turno 17, 34, 51...)
        if (playerTurns === 0 || playerTurns % 17 !== 0) {
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

        // Retardo para que la piedra recién jugada se asiente en el tablero y no se solapen sonidos ni VFX
        setTimeout(() => {
            if (!targetNode || !targetNode.stone) return;

            // Eliminar la piedra enemiga y sumar capturas al jugador Ronin
            const removedIds = RulesEngine.destroyStoneAndPolyGroup(board, state, targetNode.id);
            state.addCaptures(playerId, removedIds.length);

            // Evaluar si la eliminación rompió libertades y causó capturas en cadena
            const extraCaptured = RulesEngine.resolveBoardCaptures(board, state, playerId);
            const otherPid = (state.playerCount === 2 ? (playerId === 1 ? 2 : 1) : (((playerId % state.playerCount) + 1) as PlayerId));
            RulesEngine.resolveBoardCaptures(board, state, otherPid);

            if (onBoardUpdated) {
                onBoardUpdated();
            }

            // Disparar animación visual de tajo de katana en todas las casillas de la pieza
            if (svgElement) {
                for (const nid of removedIds) {
                    const n = board.nodes.get(nid);
                    if (n) {
                        RoninVFX.triggerWindSlash({ x: n.x, y: n.y }, svgElement);
                    }
                }
            }

            const totalCut = removedIds.length;
            const extraMsg = extraCaptured > 0 ? ` (+${extraCaptured})` : '';
            const msg = t('champion.ronin.passive_trigger_msg', {
                turn: playerTurns.toString(),
                nodeId: target.id,
                extra: extraMsg
            }) || `🗡️💨 ¡Filo del Samurai (Turno ${playerTurns})! El Ronin desenvainó su katana y rebanó ${totalCut > 1 ? `la ficha entera (${totalCut} casillas)` : '1 piedra enemiga'} en [${target.id}].${extraMsg}`;

            onTrigger(msg);
        }, 220);

        return true;
    }
}
