import { GraphBoard, type PlayerId } from './GraphBoard';
import { GameState } from './GameState';
import { t } from '../i18n/i18n';

export interface PlayerScore {
    playerId: PlayerId;
    name: string;
    color: string;
    icon: string;
    territory: number;
    captures: number;
    komi: number;
    total: number;
}

export interface ScoreReport {
    playerCount: number;
    playerScores: Record<PlayerId, PlayerScore>;
    ranking: PlayerScore[];
    blackTerritory: number;
    whiteTerritory: number;
    greenTerritory: number;
    purpleTerritory: number;
    blackCaptures: number;
    whiteCaptures: number;
    greenCaptures: number;
    purpleCaptures: number;
    komi: number;
    blackTotal: number;
    whiteTotal: number;
    winner: 'black' | 'white' | 'green' | 'purple' | 'draw';
    winnerPlayerId: PlayerId | null;
    margin: number;
    territoryMap: Map<string, PlayerId>; // Asigna a cada nodo vacío su dueño territorial (1, 2, 3 o 4)
}

export class TerritoryScorer {
    public static get PLAYER_META(): Record<PlayerId, { name: string; color: string; icon: string; key: 'black' | 'white' | 'green' | 'purple' }> {
        return {
            1: { name: t('hud.player_black'), color: '#1a1a1a', icon: '⚫', key: 'black' },
            2: { name: t('hud.player_white'), color: '#ffffff', icon: '⚪', key: 'white' },
            3: { name: t('hud.player_green'), color: '#10b981', icon: '🟢', key: 'green' },
            4: { name: t('hud.player_purple'), color: '#8b5cf6', icon: '🟣', key: 'purple' }
        };
    }

    /**
     * Calculates the complete match score using Japanese Go territory rules
     */
    static calculateScore(board: GraphBoard, state: GameState): ScoreReport {
        const visited = new Set<string>();
        const territoryMap = new Map<string, PlayerId>();
        
        const territoryCounts: Record<PlayerId, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

        // 1. Identify empty territory regions with BFS
        for (const [nodeId, node] of board.nodes.entries()) {
            if (node.stone !== null || node.terrain === 'DESTROYED' || node.terrain === 'OBSTACLE' || visited.has(nodeId)) {
                continue;
            }

            // Start empty connected component
            const region: string[] = [];
            const queue: string[] = [nodeId];
            visited.add(nodeId);

            const borderingPlayerCounts: Record<PlayerId, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
            let totalBorders = 0;

            while (queue.length > 0) {
                const currentId = queue.shift()!;
                region.push(currentId);

                const currentNode = board.nodes.get(currentId)!;
                for (const neighborId of currentNode.neighbors) {
                    const neighbor = board.nodes.get(neighborId);
                    if (!neighbor || neighbor.terrain === 'DESTROYED' || neighbor.terrain === 'OBSTACLE') continue;

                    if (neighbor.stone !== null) {
                        borderingPlayerCounts[neighbor.stone.playerId]++;
                        totalBorders++;
                    } else if (!visited.has(neighborId)) {
                        visited.add(neighborId);
                        queue.push(neighborId);
                    }
                }
            }

            // 2. Determine territory ownership (>= 74% border dominance)
            let maxBorders = 0;
            let owner: PlayerId | null = null;
            
            for (const [pidStr, count] of Object.entries(borderingPlayerCounts)) {
                const pid = Number(pidStr) as PlayerId;
                if (count > maxBorders) {
                    maxBorders = count;
                    owner = pid;
                }
            }

            if (owner !== null && (totalBorders === 0 || maxBorders >= totalBorders * 0.74)) {
                territoryCounts[owner] += region.length;
                for (const id of region) {
                    territoryMap.set(id, owner);
                }
            }
        }

        const activePlayerIds: PlayerId[] = state.playerCount === 4 ? [1, 2, 3, 4] : [1, 2];
        const playerScores: Record<PlayerId, PlayerScore> = {
            1: { playerId: 1, name: 'Black', color: '#1a1a1a', icon: '⚫', territory: territoryCounts[1], captures: state.blackCaptures, komi: 0, total: territoryCounts[1] + state.blackCaptures },
            2: { playerId: 2, name: 'White', color: '#ffffff', icon: '⚪', territory: territoryCounts[2], captures: state.whiteCaptures, komi: state.komi, total: territoryCounts[2] + state.whiteCaptures + state.komi },
            3: { playerId: 3, name: 'Emerald', color: '#10b981', icon: '🟢', territory: territoryCounts[3], captures: state.greenCaptures, komi: 0, total: territoryCounts[3] + state.greenCaptures },
            4: { playerId: 4, name: 'Amethyst', color: '#8b5cf6', icon: '🟣', territory: territoryCounts[4], captures: state.purpleCaptures, komi: 0, total: territoryCounts[4] + state.purpleCaptures }
        };

        const ranking = activePlayerIds
            .map(pid => playerScores[pid])
            .sort((a, b) => b.total - a.total);

        let winner: 'black' | 'white' | 'green' | 'purple' | 'draw' = 'draw';
        let winnerPlayerId: PlayerId | null = null;
        let margin = 0;

        if (ranking.length >= 2) {
            if (ranking[0].total > ranking[1].total) {
                winnerPlayerId = ranking[0].playerId;
                winner = this.PLAYER_META[winnerPlayerId].key;
                margin = ranking[0].total - ranking[1].total;
            } else {
                winner = 'draw';
                margin = 0;
            }
        }

        return {
            playerCount: state.playerCount,
            playerScores,
            ranking,
            blackTerritory: territoryCounts[1],
            whiteTerritory: territoryCounts[2],
            greenTerritory: territoryCounts[3],
            purpleTerritory: territoryCounts[4],
            blackCaptures: state.blackCaptures,
            whiteCaptures: state.whiteCaptures,
            greenCaptures: state.greenCaptures,
            purpleCaptures: state.purpleCaptures,
            komi: state.komi,
            blackTotal: playerScores[1].total,
            whiteTotal: playerScores[2].total,
            winner,
            winnerPlayerId,
            margin,
            territoryMap
        };
    }
}
