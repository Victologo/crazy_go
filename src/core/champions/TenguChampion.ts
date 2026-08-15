// champions/TenguChampion.ts - Habilidad Activa: Lluvia Meteórica
import type { ChampionActiveSkill } from './types';
import type { GraphBoard, BoardNode } from '../GraphBoard';
import { TenguVFX } from '../../graphics/vfx/TenguVFX';

export const TenguActiveSkill: ChampionActiveSkill = {
    name: 'Meteor Strike',
    icon: '☄️',
    description: 'Select an area: unleashes falling meteors (7 on 9x9, 11 on 13x13, 17 on 19x19) destroying unprotected stones.',
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
     * Número de meteoros por impacto con +2 disparos adicionales:
     * - Tableros pequeños (<= 100 nodos ej: 9x9): 7 meteoros (+2)
     * - Tableros medianos (101..220 nodos ej: 13x13): 11 meteoros (+2)
     * - Tableros grandes (> 220 nodos ej: 19x19): 17 meteoros (+2)
     */
    public static getMeteorCount(board: GraphBoard): number {
        const totalNodes = board.nodes.size;
        if (totalNodes > 220) {
            return 17; // 19x19 (+2)
        } else if (totalNodes > 100) {
            return 11; // 13x13 (+2)
        } else {
            return 7;  // 9x9 (+2)
        }
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
