// champions/TenguChampion.ts - Habilidad Activa: Lluvia Meteórica
import type { ChampionActiveSkill } from './types';
import type { GraphBoard, BoardNode } from '../GraphBoard';
import { TenguVFX } from '../../graphics/vfx/TenguVFX';

export const TenguActiveSkill: ChampionActiveSkill = {
    name: 'Meteor Strike',
    icon: '☄️',
    description: 'Select an area: unleashes falling meteors (6 on 9x9, 13 on 13x13, 27 on 19x19) across 25% of the board destroying unprotected stones.',
    targetingMode: 'meteor_5x5'
};

export class TenguChampion {
    /**
     * Calcula la zona de impacto de la lluvia meteórica:
     * Dispersión proporcional del 25% del tamaño total del tablero (mínimo 9 casillas).
     */
    public static getMeteorZoneNodes(board: GraphBoard, centerNodeId: string): BoardNode[] {
        const centerNode = board.nodes.get(centerNodeId);
        if (!centerNode) return [];

        const allNodes = Array.from(board.nodes.values());
        const totalNodesCount = allNodes.length;
        
        // Área proporcional del 25% del tablero (mínimo 9 nodos)
        const zoneSize = Math.max(9, Math.round(totalNodesCount * 0.25));

        // Ordenar por distancia euclídea al nodo central
        const sortedByDistance = [...allNodes].sort((a, b) => {
            const distA = Math.hypot(a.x - centerNode.x, a.y - centerNode.y);
            const distB = Math.hypot(b.x - centerNode.x, b.y - centerNode.y);
            return distA - distB;
        });

        return sortedByDistance.slice(0, zoneSize);
    }

    /**
     * Fórmula Matemática Universal para cualquier dimensión de tablero:
     * - Base de calibración: exactamente 6 meteoros en 9x9 (81 casillas) -> Densidad = 6 / 81 (~7.407% del tablero).
     * - 5x5 (25 nodos): 3 meteoros
     * - 7x7 (49 nodos): 4 meteoros
     * - 9x9 (81 nodos): 6 meteoros
     * - 11x11 (121 nodos): 9 meteoros
     * - 13x13 (169 nodos): 13 meteoros
     * - 15x15 (225 nodos): 17 meteoros
     * - 19x19 (361 nodos): 27 meteoros
     */
    public static getMeteorCount(board: GraphBoard): number {
        const totalNodes = board.nodes.size;
        return Math.max(3, Math.round(totalNodes * (6 / 81)));
    }

    public static executeSkill(
        board: GraphBoard,
        targetNodeId: string,
        svgElement: SVGSVGElement | null,
        onSuccess: (msg: string) => void,
        onComplete: () => void
    ): boolean {
        const centerNode = board.nodes.get(targetNodeId);
        if (!centerNode) return false;

        const zoneNodes = this.getMeteorZoneNodes(board, targetNodeId);
        if (zoneNodes.length === 0) return false;

        const meteorCount = this.getMeteorCount(board);

        // Generar impactos aleatorios equiprobables dentro de la zona del 25%
        const impactNodes: BoardNode[] = [];
        for (let i = 0; i < meteorCount; i++) {
            const randIndex = Math.floor(Math.random() * zoneNodes.length);
            impactNodes.push(zoneNodes[randIndex]);
        }

        const impactCoords = impactNodes.map(n => ({ x: n.x, y: n.y }));
        let destroyedCount = 0;

        const onImpactNode = (idx: number) => {
            const node = impactNodes[idx];
            if (node && node.stone && !node.stone.isIndestructible) {
                node.stone = null;
                destroyedCount++;
            }
        };

        const onAllFinished = () => {
            onSuccess(`☄️ ¡Lluvia Meteórica desatada! ${meteorCount} meteoros bombardearon la zona (${destroyedCount} piedra(s) destruida(s)).`);
            onComplete();
        };

        if (svgElement) {
            TenguVFX.triggerMeteorShower(impactCoords, svgElement, onImpactNode, onAllFinished);
        } else {
            impactNodes.forEach((_, idx) => onImpactNode(idx));
            onAllFinished();
        }

        return true;
    }
}
