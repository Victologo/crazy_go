// src/core/BossManager.ts - Gestor del Jefe Final (Gran Dragón Sabio Gris) y su Habilidad Activa
import { GraphBoard, type PlayerId } from './GraphBoard';
import { GameState } from './GameState';
import { RulesEngine } from './RulesEngine';
import { SoundFX } from '../audio/SoundFX';
import { VFXManager } from '../graphics/VFXManager';
import { getLanguage } from '../i18n/i18n';
import { CombatLogManager } from './CombatLogManager';


export interface CornerQuadrantInfo {
    cornerName: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
    cornerX: number;
    cornerY: number;
    nodes: any[];
    centerNode: any;
    enemyStoneCount: number;
    bossStoneCount: number;
    score: number;
}

export class BossManager {
    public static isBossBattle: boolean = false;
    public static bossChargesLeft: number = 2;
    public static readonly BOSS_NAME: string = 'Gran Dragón Sabio Gris';
    public static readonly BOSS_SKILL_NAME: string = 'Aliento Calcinante del Dragón';
    public static readonly BOSS_ICON: string = '🐉';
    public static readonly BOSS_IMAGE: string = './enemies/boss.png';

    public static resetForMatch(isBoss: boolean) {
        this.isBossBattle = isBoss;
        this.bossChargesLeft = isBoss ? 2 : 0;
    }

    /**
     * Obtiene los 4 cuadrantes correspondientes al 25% del tablero anclados a cada una de las 4 esquinas
     */
    public static getCornerQuadrants(board: GraphBoard, bossPlayerId: PlayerId): CornerQuadrantInfo[] {
        const allNodes = Array.from(board.nodes.values());
        const totalCount = allNodes.length;
        if (totalCount === 0) return [];

        // 25% del total de intersecciones del tablero (mínimo 4)
        const quadrantSize = Math.max(4, Math.round(totalCount * 0.25));

        // Encontrar los límites de coordenadas del tablero
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        allNodes.forEach(n => {
            if (n.x < minX) minX = n.x;
            if (n.x > maxX) maxX = n.x;
            if (n.y < minY) minY = n.y;
            if (n.y > maxY) maxY = n.y;
        });

        const corners: { name: CornerQuadrantInfo['cornerName']; x: number; y: number }[] = [
            { name: 'top_left', x: minX, y: minY },
            { name: 'top_right', x: maxX, y: minY },
            { name: 'bottom_left', x: minX, y: maxY },
            { name: 'bottom_right', x: maxX, y: maxY }
        ];

        return corners.map(corner => {
            // Ordenar nodos por distancia euclidiana a la esquina
            const sorted = [...allNodes].sort((a, b) => {
                const distA = Math.hypot(a.x - corner.x, a.y - corner.y);
                const distB = Math.hypot(b.x - corner.x, b.y - corner.y);
                return distA - distB;
            });

            const quadrantNodes = sorted.slice(0, quadrantSize);

            // Calcular el nodo centroide del cuadrante
            let sumX = 0, sumY = 0;
            quadrantNodes.forEach(n => {
                sumX += n.x;
                sumY += n.y;
            });
            const avgX = sumX / quadrantNodes.length;
            const avgY = sumY / quadrantNodes.length;

            let centerNode = quadrantNodes[0];
            let minDistToCenter = Infinity;
            quadrantNodes.forEach(n => {
                const dist = Math.hypot(n.x - avgX, n.y - avgY);
                if (dist < minDistToCenter) {
                    minDistToCenter = dist;
                    centerNode = n;
                }
            });

            let enemyCount = 0;
            let bossCount = 0;
            quadrantNodes.forEach(n => {
                if (n.stone) {
                    if (n.stone.playerId === bossPlayerId) {
                        bossCount++;
                    } else if (!n.stone.isIndestructible) {
                        enemyCount++;
                    }
                }
            });

            // Valor táctico: prioriza destruir piedras enemigas y minimizar el daño a piedras propias
            const score = enemyCount * 3.5 - bossCount * 1.5;

            return {
                cornerName: corner.name,
                cornerX: corner.x,
                cornerY: corner.y,
                nodes: quadrantNodes,
                centerNode,
                enemyStoneCount: enemyCount,
                bossStoneCount: bossCount,
                score
            };
        });
    }

    /**
     * Ejecuta el Aliento Calcinante del Dragón Sabio Gris sobre un cuadrante
     */
    public static executeDragonBreath(
        board: GraphBoard,
        state: GameState,
        bossPlayerId: PlayerId,
        quadrant: CornerQuadrantInfo,
        svgElement: SVGSVGElement | null,
        onSuccess: (msg: string) => void,
        onComplete: () => void
    ) {
        if (this.bossChargesLeft <= 0) return;

        this.bossChargesLeft--;

        const coords = quadrant.nodes.map(n => ({ x: n.x, y: n.y }));
        const centerCoord = { x: quadrant.centerNode.x, y: quadrant.centerNode.y };

        const applyDestructionAndCenterStone = () => {
            let destroyedCount = 0;
            quadrant.nodes.forEach(n => {
                if (n.stone && !n.stone.isIndestructible) {
                    const removed = RulesEngine.destroyStoneAndPolyGroup(board, state, n.id);
                    destroyedCount += removed.length;
                }
            });

            // Colocar la piedra normal del dragón en el centro del vacío generado
            const centerNode = board.nodes.get(quadrant.centerNode.id);
            if (centerNode) {
                centerNode.stone = {
                    id: state.entityManager.createEntity(),
                    playerId: bossPlayerId,
                    isInvisible: false,
                    isIndestructible: false,
                    isFrozen: false,
                    stoneType: 'single'
                };
            }

            // Resolver capturas en cascada si la nueva piedra del centro encierra piedras enemigas
            const capturedCount = RulesEngine.resolveBoardCaptures(board, state, bossPlayerId);

            CombatLogManager.logChampionSkill(
                board,
                state,
                'boss',
                'Aliento Calcinante del Dragón',
                quadrant.centerNode.id,
                quadrant.nodes.map(n => n.id),
                bossPlayerId,
                capturedCount
            );

            if (capturedCount > 0) {
                SoundFX.playCapture();
            } else {
                SoundFX.playBossDragonBreath();
            }
            const isEn = getLanguage() === 'en';
            const captureExtra = capturedCount > 0 
                ? (isEn ? ` (and captured ${capturedCount} stone(s) with 0 liberties!)` : ` (¡y capturó ${capturedCount} piedra(s) por libertades!)`) 
                : '';
            onSuccess(isEn
                ? `🐉🔥 The Great Grey Sage Dragon unleashed its Calcinating Breath! Incinerated 25% of the board in the corner (${destroyedCount} stones destroyed) and placed its stone in the center of the void${captureExtra}.`
                : `🐉🔥 ¡El Gran Dragón Sabio Gris ha desatado su Aliento Calcinante! Ha calcinado el 25% del tablero en la esquina (${destroyedCount} piedras destruidas) y colocado su piedra en el centro del vacío${captureExtra}.`
            );
            onComplete();
        };

        if (svgElement) {
            VFXManager.triggerGreyDragonBreath(coords, centerCoord, svgElement, applyDestructionAndCenterStone);
        } else {
            applyDestructionAndCenterStone();
        }
    }

    /**
     * Comprueba si la IA del Dragón Jefe debe usar su Aliento Calcinante en su turno
     */
    public static checkAIBossTrigger(
        board: GraphBoard,
        state: GameState,
        bossPlayerId: PlayerId,
        svgElement: SVGSVGElement | null,
        onSuccess: (msg: string) => void,
        onComplete: () => void
    ): boolean {
        // Habilidad del Dragón desactivada por petición del usuario
        return false;
        
        if (!this.isBossBattle || this.bossChargesLeft <= 0 || state.isGameOver) {
            return false;
        }

        const bossTurn = state.getPlayerTurnCount(bossPlayerId);
        // Evaluar a partir del turno 3 del jefe
        if (bossTurn < 3) return false;

        const quadrants = this.getCornerQuadrants(board, bossPlayerId);
        quadrants.sort((a, b) => b.score - a.score);
        const bestQuadrant = quadrants[0];

        // Disparar si hay al menos 2 piedras enemigas que quemar (o 1 si estamos en late game turno 9+)
        const threshold = bossTurn >= 9 ? 1 : 2;
        if (bestQuadrant && bestQuadrant.enemyStoneCount >= threshold && bestQuadrant.score > 0) {
            this.executeDragonBreath(
                board,
                state,
                bossPlayerId,
                bestQuadrant,
                svgElement,
                onSuccess,
                onComplete
            );
            return true;
        }

        return false;
    }

    /**
     * Devastación Pasiva (A partir del turno 22):
     * Cae aleatoriamente 4 bolas de fuego destruyendo casillas y aristas (rompe topología).
     */
    public static checkAIPassiveDevastation(
        board: GraphBoard,
        state: GameState,
        bossPlayerId: PlayerId,
        svgElement: SVGSVGElement | null,
        onComplete: () => void
    ): boolean {
        // Habilidad del Dragón desactivada por petición del usuario
        return false;
        
        // bossPlayerId can be used to style the devastation maybe, or ignored for now
        if (!bossPlayerId) return false;
        
        if (!this.isBossBattle || state.isGameOver) return false;
        if (state.currentTurn < 22) return false; // Solo a partir del turno global 22

        const availableNodes = Array.from(board.nodes.values()).filter(n => n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE');
        if (availableNodes.length < 4) return false;

        // Mezclar y elegir 4 nodos aleatorios
        for (let i = availableNodes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableNodes[i], availableNodes[j]] = [availableNodes[j], availableNodes[i]];
        }
        
        const targets = availableNodes.slice(0, 4);
        const targetIds = targets.map(n => n.id);
        const impactCoords = targets.map(n => ({ x: n.x, y: n.y }));

        Promise.all([
            import('../graphics/VFXManager'),
            import('./RulesEngine')
        ]).then(([{ VFXManager }, { RulesEngine }]) => {
            if (svgElement) {
                VFXManager.triggerMeteorShower(impactCoords, svgElement, () => {}, () => {
                    RulesEngine.destroyTopology(board, state, targetIds);
                    onComplete();
                }, 18);
            } else {
                RulesEngine.destroyTopology(board, state, targetIds);
                onComplete();
            }
        });

        return true;
    }
}
