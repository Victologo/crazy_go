// RulesEngine.ts

import { GraphBoard, type StoneInfo } from './GraphBoard';
import type { PlayerId } from './GraphBoard';
import { GameState } from './GameState';
import { RogueliteManager } from './RogueliteManager';

export interface MoveResult {
    success: boolean;
    capturedCount: number;
    errorReason?: 'OCCUPIED' | 'INVALID_TERRAIN' | 'SUICIDE' | 'KO' | 'GAME_OVER';
}

export class RulesEngine {
    
    /**
     * Intenta colocar una piedra en un nodo según las reglas estándar de Go y las excepciones de Crazy Go.
     */
    static tryPlaceStone(
        board: GraphBoard, 
        state: GameState, 
        nodeId: string, 
        playerId: PlayerId,
        stoneType?: 'single' | 'sprouting' | 'domino' | 'monolith',
        sproutBirthTurn?: number
    ): MoveResult {
        if (state.isGameOver) {
            return { success: false, capturedCount: 0, errorReason: 'GAME_OVER' };
        }

        const node = board.nodes.get(nodeId);
        if (!node) {
            return { success: false, capturedCount: 0, errorReason: 'INVALID_TERRAIN' };
        }

        if (node.stone !== null || node.terrain === 'DESTROYED' || node.terrain === 'OBSTACLE') {
            return { success: false, capturedCount: 0, errorReason: 'OCCUPIED' };
        }

        const isShield = RogueliteManager.nextStoneEffect === 'shield' && playerId === 1;
        if (isShield) {
            RogueliteManager.nextStoneEffect = 'none';
        }

        // 1. Colocación provisional
        const newEntityId = state.entityManager.createEntity();
        node.stone = {
            id: newEntityId,
            playerId: playerId,
            isInvisible: false,
            isIndestructible: isShield,
            shieldTurnsLeft: isShield ? 3 : undefined,
            isFrozen: false,
            stoneType: stoneType || 'single',
            sproutBirthTurn: sproutBirthTurn
        };

        // 2. Identificar capturas enemigas (cualquier piedra de cualquier otro jugador)
        const nodesToCapture = new Set<string>();

        for (const neighborId of node.neighbors) {
            const neighborNode = board.nodes.get(neighborId);
            if (neighborNode && neighborNode.stone && neighborNode.stone.playerId !== playerId) {
                const liberties = board.getLiberties(neighborId);
                if (liberties.size === 0) {
                    const chain = board.getChain(neighborId);
                    
                    // Comprobar si alguna piedra es indestructible o tiene escudo de congelación
                    let canCapture = true;
                    for (const chainNodeId of chain) {
                        const chainNode = board.nodes.get(chainNodeId);
                        if (chainNode?.stone?.isIndestructible) {
                            canCapture = false;
                            break;
                        }
                        
                        // Escudo de congelación
                        for (const adjToChain of chainNode!.neighbors) {
                            if (board.nodes.get(adjToChain)?.stone?.isFrozen) {
                                canCapture = false;
                                break;
                            }
                        }
                        if (!canCapture) break;
                    }

                    if (canCapture) {
                        for (const c of chain) {
                            nodesToCapture.add(c);
                        }
                    }
                }
            }
        }

        // 3. Chequeo de Suicidio (si no hubo capturas y el grupo propio no tiene libertades)
        if (nodesToCapture.size === 0) {
            const myLiberties = board.getLiberties(nodeId);
            if (myLiberties.size === 0) {
                // Suicidio no permitido en Go estándar
                node.stone = null;
                state.entityManager.destroyEntity(newEntityId);
                return { success: false, capturedCount: 0, errorReason: 'SUICIDE' };
            }
        }

        // 4. Chequeo y aplicación de capturas con regla canónica de Ko
        const capturedStonesBackup = new Map<string, StoneInfo>();
        for (const capId of nodesToCapture) {
            const capNode = board.nodes.get(capId);
            if (capNode && capNode.stone) {
                capturedStonesBackup.set(capId, { ...capNode.stone });
                capNode.stone = null;
            }
        }

        const candidateState = board.serializeState();

        // Regla Canónica del Ko: Prohibido repetir la posición idéntica del tablero inmediatamente anterior
        if (state.boardHistory.length >= 2) {
            const previousState = state.boardHistory[state.boardHistory.length - 2];
            if (candidateState === previousState) {
                // Violación de Ko: restaurar tablero y cancelar jugada
                for (const [capId, stoneData] of capturedStonesBackup) {
                    const capNode = board.nodes.get(capId);
                    if (capNode) capNode.stone = stoneData;
                }
                node.stone = null;
                state.entityManager.destroyEntity(newEntityId);
                return { success: false, capturedCount: 0, errorReason: 'KO' };
            }
        }

        // Destruir entidades de piedras capturadas válidamente
        for (const [_, stoneData] of capturedStonesBackup) {
            state.entityManager.destroyEntity(stoneData.id);
        }

        const capturedCount = nodesToCapture.size;
        state.addCaptures(playerId, capturedCount);

        // Guardar estado en el historial y registrar jugada
        state.boardHistory.push(candidateState);
        state.lastMoveNodeId = nodeId;
        state.consecutivePasses = 0;

        return { success: true, capturedCount };
    }

    /**
     * Coloca múltiples piedras simultáneamente (Fichas Poliminó: Dominó 2x1, Monolito 2x2)
     */
    static tryPlaceMultiStones(
        board: GraphBoard,
        state: GameState,
        nodeIds: string[],
        playerId: PlayerId,
        polyominoType: 'domino' | 'monolith'
    ): MoveResult {
        if (state.isGameOver) {
            return { success: false, capturedCount: 0, errorReason: 'GAME_OVER' };
        }

        if (nodeIds.length === 0) {
            return { success: false, capturedCount: 0, errorReason: 'INVALID_TERRAIN' };
        }

        // 1. Validar que todas las intersecciones están libres y son válidas
        for (const nid of nodeIds) {
            const n = board.nodes.get(nid);
            if (!n) {
                return { success: false, capturedCount: 0, errorReason: 'INVALID_TERRAIN' };
            }
            if (n.stone !== null) {
                return { success: false, capturedCount: 0, errorReason: 'OCCUPIED' };
            }
            if (n.terrain === 'DESTROYED' || n.terrain === 'OBSTACLE') {
                return { success: false, capturedCount: 0, errorReason: 'INVALID_TERRAIN' };
            }
        }

        // 2. Colocación provisional de todas las piedras del bloque poliminó
        const createdEntityIds: { nodeId: string; entityId: string }[] = [];
        for (const nid of nodeIds) {
            const n = board.nodes.get(nid)!;
            const newEntityId = state.entityManager.createEntity();
            n.stone = {
                id: newEntityId,
                playerId: playerId,
                isInvisible: false,
                isIndestructible: false,
                isFrozen: false,
                stoneType: polyominoType
            };
            createdEntityIds.push({ nodeId: nid, entityId: newEntityId });
        }

        // 3. Evaluar capturas en todas las cadenas enemigas adyacentes al bloque
        const nodesToCapture = new Set<string>();
        for (const nid of nodeIds) {
            const n = board.nodes.get(nid)!;
            for (const neighborId of n.neighbors) {
                // Si el vecino es parte del propio bloque nuevo, ignorar
                if (nodeIds.includes(neighborId)) continue;

                const neighborNode = board.nodes.get(neighborId);
                if (neighborNode && neighborNode.stone && neighborNode.stone.playerId !== playerId) {
                    const liberties = board.getLiberties(neighborId);
                    if (liberties.size === 0) {
                        const chain = board.getChain(neighborId);
                        let canCapture = true;
                        for (const chainNodeId of chain) {
                            const chainNode = board.nodes.get(chainNodeId);
                            if (chainNode?.stone?.isIndestructible) {
                                canCapture = false;
                                break;
                            }
                            for (const adjToChain of chainNode!.neighbors) {
                                if (board.nodes.get(adjToChain)?.stone?.isFrozen) {
                                    canCapture = false;
                                    break;
                                }
                            }
                            if (!canCapture) break;
                        }
                        if (canCapture) {
                            for (const c of chain) {
                                nodesToCapture.add(c);
                            }
                        }
                    }
                }
            }
        }

        // 4. Chequeo de Suicidio del bloque propio si no hubo capturas
        if (nodesToCapture.size === 0) {
            let hasLiberties = false;
            for (const nid of nodeIds) {
                const libs = board.getLiberties(nid);
                if (libs.size > 0) {
                    hasLiberties = true;
                    break;
                }
            }
            if (!hasLiberties) {
                // Revertir colocación provisional
                for (const item of createdEntityIds) {
                    const n = board.nodes.get(item.nodeId);
                    if (n) n.stone = null;
                    state.entityManager.destroyEntity(item.entityId);
                }
                return { success: false, capturedCount: 0, errorReason: 'SUICIDE' };
            }
        }

        // 5. Aplicar capturas enemigas
        for (const capId of nodesToCapture) {
            const capNode = board.nodes.get(capId);
            if (capNode && capNode.stone) {
                state.entityManager.destroyEntity(capNode.stone.id);
                capNode.stone = null;
            }
        }

        const capturedCount = nodesToCapture.size;
        state.addCaptures(playerId, capturedCount);

        // Guardar estado en el historial y registrar jugada
        const finalState = board.serializeState();
        state.boardHistory.push(finalState);
        state.lastMoveNodeId = nodeIds[0];
        state.consecutivePasses = 0;

        return { success: true, capturedCount };
    }

    /**
     * Evalúa y ejecuta la captura en cascada de todas las piedras o grupos que se hayan quedado
     * con 0 libertades tras una manipulación especial de piedras (Inversión Cromática de Ronin,
     * Transmutación Yin-Yang, Caída de Piedras Astrales, etc.).
     */
    public static resolveBoardCaptures(
        board: GraphBoard, 
        state: GameState, 
        capturingPlayerId: PlayerId
    ): number {
        const visited = new Set<string>();
        const stonesToCapture = new Set<string>();

        // 1. Identificar todas las cadenas enemigas sin libertades
        for (const [nodeId, node] of board.nodes.entries()) {
            if (node.stone && node.stone.playerId !== capturingPlayerId && !visited.has(nodeId)) {
                const chain = board.getChain(nodeId);
                chain.forEach(id => visited.add(id));

                const liberties = board.getLiberties(nodeId);
                if (liberties.size === 0) {
                    let canCapture = true;
                    for (const chainNodeId of chain) {
                        const chainNode = board.nodes.get(chainNodeId);
                        if (chainNode?.stone?.isIndestructible) {
                            canCapture = false;
                            break;
                        }
                    }
                    if (canCapture) {
                        chain.forEach(id => stonesToCapture.add(id));
                    }
                }
            }
        }

        // 2. Ejecutar captura de piedras enemigas
        let capturedCount = 0;
        for (const capId of stonesToCapture) {
            const capNode = board.nodes.get(capId);
            if (capNode && capNode.stone) {
                state.entityManager.destroyEntity(capNode.stone.id);
                capNode.stone = null;
                capturedCount++;
            }
        }

        if (capturedCount > 0) {
            state.addCaptures(capturingPlayerId, capturedCount);
        }

        // 3. Comprobar si tras retirar las piedras enemigas quedan piedras del propio jugador sin libertades
        const myVisited = new Set<string>();
        for (const [nodeId, node] of board.nodes.entries()) {
            if (node.stone && node.stone.playerId === capturingPlayerId && !myVisited.has(nodeId)) {
                const chain = board.getChain(nodeId);
                chain.forEach(id => myVisited.add(id));

                const liberties = board.getLiberties(nodeId);
                if (liberties.size === 0) {
                    let isProtected = false;
                    for (const chainNodeId of chain) {
                        const chainNode = board.nodes.get(chainNodeId);
                        if (chainNode?.stone?.isIndestructible) {
                            isProtected = true;
                            break;
                        }
                    }
                    if (!isProtected) {
                        for (const deadId of chain) {
                            const deadNode = board.nodes.get(deadId);
                            if (deadNode && deadNode.stone) {
                                state.entityManager.destroyEntity(deadNode.stone.id);
                                deadNode.stone = null;
                            }
                        }
                    }
                }
            }
        }

        // Guardar estado resultante en el historial
        state.boardHistory.push(board.serializeState());

        // Comprobar capturas de entidades neutrales (objetos, cofres, rehenes)
        this.resolveCaptiveCaptures(board, state, capturingPlayerId);

        return capturedCount;
    }

    /**
     * Comprueba si algún objeto, cofre o rehén neutral ha sido rodeado completamente (0 libertades restantes)
     */
    public static resolveCaptiveCaptures(
        board: GraphBoard, 
        state: GameState, 
        capturingPlayerId: PlayerId,
        onCaptureCallback?: (captive: any) => void
    ): number {
        if (!state.captives || state.captives.length === 0) return 0;

        let rescuedCount = 0;
        for (const captive of state.captives) {
            if (captive.isCaptured) continue;

            const targetNode = board.nodes.get(captive.nodeId);
            if (!targetNode) continue;

            // Contar libertades vacías alrededor del nodo donde reside la entidad
            let emptyLiberties = 0;
            let mySurroundingCount = 0;

            for (const neighborId of targetNode.neighbors) {
                const neighbor = board.nodes.get(neighborId);
                if (neighbor) {
                    if (!neighbor.stone && neighbor.terrain !== 'DESTROYED' && neighbor.terrain !== 'OBSTACLE') {
                        emptyLiberties++;
                    } else if (neighbor.stone && neighbor.stone.playerId === capturingPlayerId) {
                        mySurroundingCount++;
                    }
                }
            }

            // Si todas sus libertades cardinales están ocupadas (0 libertades restantes)
            if (emptyLiberties === 0 && mySurroundingCount > 0) {
                captive.isCaptured = true;
                rescuedCount++;

                if (onCaptureCallback) {
                    onCaptureCallback(captive);
                }
            }
        }

        return rescuedCount;
    }
}
