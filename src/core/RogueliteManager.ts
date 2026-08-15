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

    // Deck of available player spell scrolls
    public static playerSpells: Map<SpellId, SpellCard> = new Map([
        [
            'rewind',
            {
                id: 'rewind',
                name: 'Time Rewind',
                icon: '⏳',
                description: 'Undoes the previous full turn and restores the board state.',
                usesLeft: 2,
                color: '#38bdf8'
            }
        ],
        [
            'meteor',
            {
                id: 'meteor',
                name: 'Meteor Strike',
                icon: '☄️',
                description: 'Destroys a random vulnerable enemy stone on the board.',
                usesLeft: 0,
                color: '#f43f5e'
            }
        ],
        [
            'shield',
            {
                id: 'shield',
                name: 'Sacred Stone',
                icon: '🛡️',
                description: 'Your next placed stone will be indestructible and immune to capture.',
                usesLeft: 0,
                color: '#fbbf24'
            }
        ],
        [
            'convert',
            {
                id: 'convert',
                name: 'Yin-Yang Inversion',
                icon: '☯️',
                description: 'Transmutes an enemy stone into an allied stone of your color.',
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
     * Executes or triggers a spell
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
            onError('No charges left for this spell scroll.');
            SoundFX.playIllegal();
            return false;
        }

        switch (spellId) {
            case 'rewind': {
                if (!state.canUndo()) {
                    onError('Not enough recorded turns to rewind.');
                    SoundFX.playIllegal();
                    return false;
                }
                // Undo snapshot
                if (state.historyStack.length >= 2) {
                    state.undo(board);
                    state.undo(board);
                } else {
                    state.undo(board);
                }

                card.usesLeft--;
                SoundFX.playUndo();
                onSuccess('⏳ Time Rewound! The previous board position has been faithfully restored.');
                return true;
            }

            case 'meteor': {
                // Find vulnerable enemy stones
                const enemyPlayerId: PlayerId = playerId === 1 ? 2 : 1;
                const enemyNodes: string[] = [];

                for (const [nodeId, node] of board.nodes.entries()) {
                    if (node.stone && node.stone.playerId === enemyPlayerId && !node.stone.isIndestructible) {
                        enemyNodes.push(nodeId);
                    }
                }

                if (enemyNodes.length === 0) {
                    onError('No vulnerable enemy stones found on the board.');
                    SoundFX.playIllegal();
                    return false;
                }

                // Destroy 1 random enemy stone
                const targetNodeId = enemyNodes[Math.floor(Math.random() * enemyNodes.length)];
                const targetNode = board.nodes.get(targetNodeId);
                if (targetNode) {
                    targetNode.stone = null;
                }
                card.usesLeft--;

                SoundFX.playCapture();
                onSuccess(`☄️ Meteor Impact! An enemy stone was obliterated.`);
                return true;
            }

            case 'shield': {
                this.nextStoneEffect = 'shield';
                card.usesLeft--;
                SoundFX.playPlaceStone();
                onSuccess('🛡️ Sacred Shield activated! Your next stone will be indestructible for 3 turns.');
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
                    onError('No vulnerable enemy stones found to transmute.');
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
                const captureMsg = capturedCount > 0 ? ` And you captured ${capturedCount} enemy stone(s) stripped of liberties!` : '';
                onSuccess(`☯️ Yin-Yang Inversion! An enemy stone was converted to your side.${captureMsg}`);
                return true;
            }
        }
    }
}
