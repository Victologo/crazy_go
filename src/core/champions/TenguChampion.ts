// champions/TenguChampion.ts - Habilidad Activa: Lluvia Meteórica
import type { ChampionActiveSkill } from './types';
import type { GraphBoard, BoardNode } from '../GraphBoard';
import { TenguVFX } from '../../graphics/vfx/TenguVFX';

export const TenguActiveSkill: ChampionActiveSkill = {
    name: 'Meteor Strike',
    icon: '☄️',
    description: 'Select an area: unleashes falling meteors (5 on 9x9, 9 on 13x13, 15 on 19x19) that destroy unprotected stones.',
    targetingMode: 'meteor_5x5'
};

export class TenguChampion {
    public static getMeteorZoneNodes(board: GraphBoard, centerNodeId: string): BoardNode[] {
        const centerNode = board.nodes.get(centerNodeId);
        if (!centerNode) return [];

        const allNodes = Array.from(board.nodes.values());
        const totalNodesCount = allNodes.length;
        // 15% board area zone (minimum 7 nodes)
        const zoneSize = Math.max(7, Math.round(totalNodesCount * 0.15));

        // Sort by Euclidean distance to center node
        const sortedByDistance = [...allNodes].sort((a, b) => {
            const distA = Math.hypot(a.x - centerNode.x, a.y - centerNode.y);
            const distB = Math.hypot(b.x - centerNode.x, b.y - centerNode.y);
            return distA - distB;
        });

        return sortedByDistance.slice(0, zoneSize);
    }

    public static getMeteorCount(board: GraphBoard): number {
        const totalNodes = board.nodes.size;
        if (totalNodes > 220) {
            return 15; // 19x19
        } else if (totalNodes > 100) {
            return 9;  // 13x13
        } else {
            return 5;  // 9x9
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

        // Generate equiprobable random impacts in target zone
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
            onSuccess(`☄️ Meteor Strike unleashed! ${meteorCount} meteors bombarded the area (${destroyedCount} stone(s) destroyed). Protected stones resisted.`);
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
