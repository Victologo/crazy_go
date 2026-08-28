// RogueliteManager.ts - Gestor de cartas de hechizos y habilidades mágicas para Crazy Go
import { GraphBoard, type PlayerId } from './GraphBoard';
import { GameState } from './GameState';
import { SoundFX } from '../audio/SoundFX';
import { RulesEngine } from './RulesEngine';
import { getLanguage } from '../i18n/i18n';

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

    public static getSnapshot(): Record<SpellId, number> {
        const snap: Record<string, number> = {};
        for (const [id, card] of this.playerSpells.entries()) {
            snap[id] = card.usesLeft;
        }
        return snap as Record<SpellId, number>;
    }

    public static restoreSnapshot(snapshot: Record<SpellId, number>) {
        if (!snapshot) return;
        this.nextStoneEffect = 'none';
        this.selectedSpell = null;
        for (const [id, count] of Object.entries(snapshot)) {
            const card = this.playerSpells.get(id as SpellId);
            if (card) {
                card.usesLeft = count;
            }
        }
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
        onSuccess: (msg: string, removedStones?: Array<{ x: number; y: number; playerId: PlayerId }>) => void,
        onError: (msg: string) => void,
        onVisuals?: (effectType: string, payload: any, onVisualsComplete: () => void) => void
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
                    onError(getLanguage() === 'en' ? 'Not enough recorded turns to rewind.' : 'No hay suficientes turnos registrados para rebobinar.');
                    SoundFX.playIllegal();
                    return false;
                }

                // Guardar coordenadas de piedras antes de deshacer
                const stonesBefore = new Map<string, { x: number; y: number; playerId: PlayerId }>();
                for (const [id, node] of board.nodes.entries()) {
                    if (node.stone) {
                        stonesBefore.set(id, { x: node.x, y: node.y, playerId: node.stone.playerId });
                    }
                }

                // En modo tutorial o si hay un único paso registrado, deshacer exactamente 1 paso
                const isTutorial = typeof window !== 'undefined' && !!(window as any).__isTutorialActive;
                const steps = isTutorial ? 1 : ((state.historyStack.length >= 2 && state.playerCount === 2) ? 2 : 1);
                for (let s = 0; s < steps; s++) {
                    if (state.canUndo()) state.undo(board);
                }

                card.usesLeft--;
                SoundFX.playUndo();

                // Identificar piedras afectadas por el rebobinado (piedras retiradas y piedras restauradas)
                const affectedStones: Array<{ x: number; y: number; playerId: PlayerId }> = [];
                for (const [id, data] of stonesBefore.entries()) {
                    const nodeAfter = board.nodes.get(id);
                    if (!nodeAfter || !nodeAfter.stone) {
                        affectedStones.push(data);
                    }
                }
                for (const [id, node] of board.nodes.entries()) {
                    if (node.stone && !stonesBefore.has(id)) {
                        affectedStones.push({ x: node.x, y: node.y, playerId: node.stone.playerId });
                    }
                }

                const isEn = getLanguage() === 'en';
                onSuccess(isEn 
                    ? '⏳ Time Rewound! The previous board position has been faithfully restored.' 
                    : '⏳ ¡Tiempo Rebobinado! La posición anterior del tablero ha sido restaurada fielmente.', 
                    affectedStones
                );
                return true;
            }

            case 'meteor': {
                const enemyNodes: string[] = [];
                const alliedNodes: string[] = [];

                for (const [nodeId, node] of board.nodes.entries()) {
                    if (node.stone && !node.stone.isIndestructible) {
                        if (node.stone.playerId !== playerId) {
                            enemyNodes.push(nodeId);
                        } else if (node.stone.playerId === playerId) {
                            alliedNodes.push(nodeId);
                        }
                    }
                }

                // 80% enemy, 20% allied (soporte determinista para demostración de tutorial)
                let isAlly = Math.random() < 0.2;
                if (typeof window !== 'undefined') {
                    if ((window as any).__tutorialForceMeteorAlly && alliedNodes.length > 0) {
                        isAlly = true;
                    } else if ((window as any).__tutorialForceMeteorEnemy && enemyNodes.length > 0) {
                        isAlly = false;
                    }
                }

                let targetNodes = isAlly ? alliedNodes : enemyNodes;

                // Fallback if no targets of the chosen type
                if (targetNodes.length === 0) {
                    targetNodes = isAlly ? enemyNodes : alliedNodes;
                }

                if (targetNodes.length === 0) {
                    onError(getLanguage() === 'en' ? 'No vulnerable stones found on the board.' : 'No se encontraron piedras vulnerables en el tablero.');
                    SoundFX.playIllegal();
                    return false;
                }

                // Destroy 1 random stone
                const targetNodeId = targetNodes[Math.floor(Math.random() * targetNodes.length)];
                const targetNode = board.nodes.get(targetNodeId);
                const isFinalAlly = targetNode?.stone?.playerId === playerId;
                
                state.recordSnapshot(board);
                card.usesLeft--;
                
                const completeMeteor = () => {
                    let destroyed = 0;
                    if (targetNode) {
                        const removed = RulesEngine.destroyStoneAndPolyGroup(board, state, targetNode.id);
                        destroyed = removed.length;
                    }
                    SoundFX.playMeteorImpact();
                    const isEn = getLanguage() === 'en';
                    let msg = '';
                    if (isFinalAlly) {
                        msg = isEn 
                            ? `☄️ Meteor Impact! Friendly fire! ${destroyed > 1 ? `An allied polyomino block (${destroyed} stones)` : 'An allied stone'} was obliterated.`
                            : `☄️ ¡Impacto de Meteorito! ¡Fuego Amigo! ${destroyed > 1 ? `Un bloque poliminó aliado (${destroyed} piedras)` : 'Una piedra aliada'} ha sido destruida.`;
                    } else {
                        msg = isEn 
                            ? `☄️ Meteor Impact! ${destroyed > 1 ? `An enemy polyomino block (${destroyed} stones)` : 'An enemy stone'} was obliterated.`
                            : `☄️ ¡Impacto de Meteorito! ${destroyed > 1 ? `Un bloque poliminó enemigo (${destroyed} piedras)` : 'Una piedra enemiga'} ha sido destruida.`;
                    }
                    onSuccess(msg);
                };

                if (onVisuals) {
                    onVisuals('meteor', { nodeId: targetNodeId, isAlly: isFinalAlly }, completeMeteor);
                } else {
                    completeMeteor();
                }
                
                return true;
            }

            case 'shield': {
                this.nextStoneEffect = 'shield';
                card.usesLeft--;
                SoundFX.playDivineShieldCast();
                onSuccess('🛡️ Sacred Shield activated! Your next stone will be indestructible for 3 turns.');
                return true;
            }

            case 'convert': {
                const candidateNodes: string[] = [];

                for (const [nodeId, node] of board.nodes.entries()) {
                    if (node.stone && node.stone.playerId !== playerId && !node.stone.isIndestructible) {
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
                let transmutedCount = 1;
                if (targetNode && targetNode.stone) {
                    const transmuted = RulesEngine.transmuteStoneAndPolyGroup(board, targetNode.id, playerId);
                    transmutedCount = transmuted.length;
                    for (const tid of transmuted) {
                        const tn = board.nodes.get(tid);
                        if (tn && tn.stone) tn.stone.isIndestructible = false;
                    }
                }

                const capturedCount = RulesEngine.resolveBoardCaptures(board, state, playerId);
                if (capturedCount > 0) {
                    SoundFX.playCapture();
                }

                card.usesLeft--;
                SoundFX.playAlchemicalTransmute();
                const captureMsg = capturedCount > 0 ? ` And you captured ${capturedCount} enemy stone(s) stripped of liberties!` : '';
                onSuccess(`☯️ Yin-Yang Inversion! ${transmutedCount > 1 ? `An enemy polyomino block (${transmutedCount} stones)` : 'An enemy stone'} was converted to your side.${captureMsg}`);
                return true;
            }
        }
    }
}
