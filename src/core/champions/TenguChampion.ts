import type { ChampionActiveSkill } from './types';
import { GraphBoard, BoardNode } from '../GraphBoard';
import { SeededRandom } from '../SeededRandom';
import { RulesEngine } from '../RulesEngine';
import { TenguVFX } from '../../graphics/vfx/TenguVFX';
import { getLanguage } from '../../i18n/i18n';

export const TenguActiveSkill: ChampionActiveSkill = {
    name: 'Meteor Strike',
    icon: '☄️',
    description: 'Select an area: unleashes falling meteors (6 on 9x9, 13 on 13x13, 27 on 19x19) across 25% of the board destroying unprotected stones.',
    targetingMode: 'meteor_5x5'
};

export class TenguChampion {
    /**
     * Calcula la zona de impacto de la lluvia meteórica:
     * Dispersión proporcional del 25% del total de intersecciones válidas y jugables del tablero.
     * Compatible con topologías cuadradas, erosionadas, islas, cruz, hexagonales, triangulares y procedurales.
     */
    public static getMeteorZoneNodes(board: GraphBoard, centerNodeId: string): BoardNode[] {
        const centerNode = board.nodes.get(centerNodeId);
        if (!centerNode || centerNode.terrain === 'DESTROYED' || centerNode.terrain === 'OBSTACLE') {
            return [];
        }

        // 1. Filtrar únicamente nodos válidos y jugables (descartar vacíos, destruidos y obstáculos)
        const validNodes = Array.from(board.nodes.values()).filter(
            n => n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE'
        );
        const totalValidCount = validNodes.length;
        if (totalValidCount === 0) return [];
        
        // Área proporcional del 25% de intersecciones jugables (mínimo 5 nodos en tableros pequeños, máximo total)
        const zoneSize = Math.max(5, Math.min(totalValidCount, Math.round(totalValidCount * 0.25)));

        // 2. Ordenar por distancia euclídea real en el espacio 2D SVG respecto al nodo central
        const sortedByDistance = [...validNodes].sort((a, b) => {
            const distA = Math.hypot(a.x - centerNode.x, a.y - centerNode.y);
            const distB = Math.hypot(b.x - centerNode.x, b.y - centerNode.y);
            return distA - distB;
        });

        return sortedByDistance.slice(0, zoneSize);
    }

    /**
     * Fórmula Matemática Universal de Meteoros:
     * - Base de calibración: exactamente 6 meteoros en 9x9 estándar (81 casillas) -> Densidad = 6 / 81 (~7.407% del tablero).
     * - Se adapta de forma continua y proporcional al recuento exacto de intersecciones válidas del tablero.
     */
    public static getMeteorCount(board: GraphBoard): number {
        if (board.shape === 'oni') {
            return 27; // Máscara Oni siempre escala como 19x19 (27 meteoros)
        }
        const validCount = Array.from(board.nodes.values()).filter(
            n => n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE'
        ).length;
        return Math.max(3, Math.min(validCount, Math.round(validCount * (6 / 81))));
    }

    public static executeSkill(
        board: GraphBoard,
        targetNodeId: string,
        svgElement: SVGSVGElement | null,
        onSuccess: (msg: string) => void,
        onComplete: () => void
    ): boolean {
        const centerNode = board.nodes.get(targetNodeId);
        if (!centerNode || centerNode.terrain === 'DESTROYED' || centerNode.terrain === 'OBSTACLE') {
            return false;
        }

        const zoneNodes = this.getMeteorZoneNodes(board, targetNodeId);
        if (zoneNodes.length === 0) return false;

        const meteorCount = this.getMeteorCount(board);

        // Generar impactos seleccionando exclusivamente nodos ÚNICOS de la zona
        const impactNodes: BoardNode[] = [];
        const availableNodes = [...zoneNodes];
        const actualMeteorCount = Math.min(meteorCount, availableNodes.length);
        
        for (let i = 0; i < actualMeteorCount; i++) {
            const randIndex = SeededRandom.nextInt(availableNodes.length);
            impactNodes.push(availableNodes[randIndex]);
            availableNodes.splice(randIndex, 1); // Remover para evitar duplicados
        }

        const impactCoords = impactNodes.map(n => ({ x: n.x, y: n.y }));
        let destroyedCount = 0;

        const onImpactNode = (idx: number) => {
            const node = impactNodes[idx];
            if (node && node.stone && !node.stone.isIndestructible) {
                const removed = RulesEngine.destroyStoneAndPolyGroup(board, null, node.id);
                destroyedCount += removed.length;
            }
        };

        const onAllFinished = () => {
            const isEn = getLanguage() === 'en';
            onSuccess(isEn
                ? `☄️ Meteor Strike unleashed! ${meteorCount} meteors bombarded the area (${destroyedCount} stone(s) destroyed).`
                : `☄️ ¡Lluvia Meteórica desatada! ${meteorCount} meteoros bombardearon la zona (${destroyedCount} piedra(s) destruida(s)).`);
            onComplete();
        };

        // Calcular radio aproximado de piedra según la geometría del tablero para escalar la animación
        let minDistance = 40;
        if (zoneNodes.length > 1) {
            const d1 = Math.hypot(zoneNodes[0].x - zoneNodes[1].x, zoneNodes[0].y - zoneNodes[1].y);
            if (d1 > 0) minDistance = d1;
        }
        const stoneRadius = Math.max(10, Math.min(25, minDistance * 0.45));

        if (svgElement) {
            TenguVFX.triggerMeteorShower(impactCoords, svgElement, onImpactNode, onAllFinished, stoneRadius);
        } else {
            impactNodes.forEach((_, idx) => onImpactNode(idx));
            onAllFinished();
        }

        return true;
    }
}
