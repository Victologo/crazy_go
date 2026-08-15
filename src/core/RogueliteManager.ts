// RogueliteManager.ts - Gestor de cartas de hechizos y habilidades mágicas para Crazy Go
import { GraphBoard, type PlayerId } from './GraphBoard';
import { GameState } from './GameState';
import { SoundFX } from '../audio/SoundFX';
import { RulesEngine } from './RulesEngine';

export type SpellId = 'rewind' | 'meteor' | 'shield' | 'convert';

export interface SpellCard {
    id: SpellId;
    name: string;
    icon: string;
    description: string;
    usesLeft: number;
    color: string;
}

export class RogueliteManager {
    public static isRogueliteMode: boolean = false;
    public static nextStoneEffect: 'none' | 'shield' = 'none';

    // Baraja de cartas disponibles para el jugador (4 hechizos místicos)
    public static playerSpells: Map<SpellId, SpellCard> = new Map([
        [
            'rewind',
            {
                id: 'rewind',
                name: 'Rebobinar',
                icon: '⏳',
                description: 'Deshace el último turno completo y restaura el tablero.',
                usesLeft: 2,
                color: '#38bdf8'
            }
        ],
        [
            'meteor',
            {
                id: 'meteor',
                name: 'Meteorito',
                icon: '☄️',
                description: 'Destruye una piedra enemiga al azar en el tablero.',
                usesLeft: 0,
                color: '#f43f5e'
            }
        ],
        [
            'shield',
            {
                id: 'shield',
                name: 'Piedra Sagrada',
                icon: '🛡️',
                description: 'Tu siguiente piedra será indestructible e inmune a captura.',
                usesLeft: 0,
                color: '#fbbf24'
            }
        ],
        [
            'convert',
            {
                id: 'convert',
                name: 'Inversión Yin-Yang',
                icon: '☯️',
                description: 'Transmuta una piedra enemiga en una piedra propia de tu color.',
                usesLeft: 0,
                color: '#a855f7'
            }
        ]
    ]);

    public static resetSpells(startingSpells?: { [spellId: string]: number }) {
        this.nextStoneEffect = 'none';
        for (const [id, card] of this.playerSpells.entries()) {
            if (startingSpells && startingSpells[id] !== undefined) {
                card.usesLeft = startingSpells[id];
            } else {
                card.usesLeft = id === 'rewind' ? 2 : 0;
            }
        }
    }

    public static initSpells(startingSpells?: { [spellId: string]: number }) {
        this.resetSpells(startingSpells);
    }

    public static selectedSpell: SpellId | null = null;

    public static getSpells(): SpellCard[] {
        return Array.from(this.playerSpells.values());
    }

    public static selectSpell(spellId: SpellId | null) {
        this.selectedSpell = spellId;
    }

    public static addSpell(spellId: SpellId, amount: number = 1) {
        const card = this.playerSpells.get(spellId);
        if (card) {
            card.usesLeft += amount;
        }
    }

    /**
     * Ejecuta o activa un hechizo
     */
    public static castSpell(
        spellId: SpellId, 
        board: GraphBoard, 
        state: GameState, 
        playerId: PlayerId,
        onSuccess: (msg: string) => void,
        onError: (msg: string) => void
    ): boolean {
        const card = this.playerSpells.get(spellId);
        if (!card || card.usesLeft <= 0) {
            onError('No te quedan usos de este hechizo.');
            SoundFX.playIllegal();
            return false;
        }

        switch (spellId) {
            case 'rewind': {
                if (!state.canUndo()) {
                    onError('No hay suficientes jugadas registradas para rebobinar.');
                    SoundFX.playIllegal();
                    return false;
                }
                // Deshacer de forma fiel con snapshots
                if (state.historyStack.length >= 2) {
                    state.undo(board);
                    state.undo(board);
                } else {
                    state.undo(board);
                }

                card.usesLeft--;
                SoundFX.playUndo();
                onSuccess('⏳ ¡Tiempo Rebobinado! Se ha restaurado la posición anterior fielmente.');
                return true;
            }

            case 'meteor': {
                // Encontrar piedras enemigas no protegidas
                const enemyPlayerId: PlayerId = playerId === 1 ? 2 : 1;
                const enemyNodes: string[] = [];

                for (const [nodeId, node] of board.nodes.entries()) {
                    if (node.stone && node.stone.playerId === enemyPlayerId && !node.stone.isIndestructible) {
                        enemyNodes.push(nodeId);
                    }
                }

                if (enemyNodes.length === 0) {
                    onError('No hay piedras enemigas vulnerables para destruir con el meteorito.');
                    SoundFX.playIllegal();
                    return false;
                }

                // Destruir 1 piedra enemiga al azar
                const targetNodeId = enemyNodes[Math.floor(Math.random() * enemyNodes.length)];
                const targetNode = board.nodes.get(targetNodeId);
                if (targetNode) {
                    targetNode.stone = null;
                }
                card.usesLeft--;

                SoundFX.playCapture();
                onSuccess(`☄️ ¡Impacto Meteórico! Se destruyó una piedra enemiga.`);
                return true;
            }

            case 'shield': {
                this.nextStoneEffect = 'shield';
                card.usesLeft--;
                SoundFX.playPlaceStone();
                onSuccess('🛡️ ¡Escudo Sagrado activado! Tu próxima piedra será indestructible durante 3 turnos.');
                return true;
            }

            case 'convert': {
                const enemyPlayerId: PlayerId = playerId === 1 ? 2 : 1;
                const candidateNodes: string[] = [];

                for (const [nodeId, node] of board.nodes.entries()) {
                    if (node.stone && node.stone.playerId === enemyPlayerId && !node.stone.isIndestructible) {
                        candidateNodes.push(nodeId);
                    }
                }

                if (candidateNodes.length === 0) {
                    onError('No hay piedras enemigas vulnerables en el tablero para transmutar.');
                    SoundFX.playIllegal();
                    return false;
                }

                const targetId = candidateNodes[Math.floor(Math.random() * candidateNodes.length)];
                const targetNode = board.nodes.get(targetId);
                if (targetNode && targetNode.stone) {
                    targetNode.stone.playerId = playerId;
                    targetNode.stone.isIndestructible = false;
                }

                const capturedCount = RulesEngine.resolveBoardCaptures(board, state, playerId);
                if (capturedCount > 0) {
                    SoundFX.playCapture();
                }

                card.usesLeft--;
                SoundFX.playPlaceStone();
                const captureMsg = capturedCount > 0 ? ` ¡Y has capturado ${capturedCount} piedra(s) enemiga(s) que se quedaron sin libertades!` : '';
                onSuccess(`☯️ ¡Inversión Yin-Yang! Una piedra enemiga ha sido transmutada a tu bando.${captureMsg}`);
                return true;
            }
        }
    }
}
