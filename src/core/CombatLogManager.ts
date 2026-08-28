// src/core/CombatLogManager.ts - Gestor de Registro de Combate y Repeticiones (Combat Log & Replay Engine)

import type {
    PlayerId,
    HeroId,
    PolyominoType,
    SpellId,
    GameSetupConfig,
    CombatLogEntry,
    CombatLogSnapshotNode,
    CombatReplayFile
} from '../types';
import { GraphBoard } from './GraphBoard';
import { GameState } from './GameState';
import { getLanguage } from '../i18n/i18n';


export class CombatLogManager {
    public static entries: CombatLogEntry[] = [];
    public static currentConfig: GameSetupConfig | null = null;
    private static stepCounter: number = 0;

    /**
     * Convierte un ID de casilla (ej. "3,4") en notación canónica de Go (ej. "D5") o coordenadas limpias
     */
    public static formatNodeCoordinate(nodeId: string | null, size: number = 9): string {
        if (!nodeId) return '—';
        
        // Coordenadas estilo "col,row" o "col_row"
        const parts = nodeId.includes(',') ? nodeId.split(',') : (nodeId.includes('_') ? nodeId.split('_') : null);
        if (parts && parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
            const col = parseInt(parts[0], 10);
            const row = parseInt(parts[1], 10);
            
            // Alfabeto tradicional de Go (salta la 'I' para no confundir con 1)
            const alphabet = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
            const base = alphabet.length; // 25
            let colLetter = "";
            let n = col;
            do {
                colLetter = alphabet[n % base] + colLetter;
                n = Math.floor(n / base) - 1;
            } while (n >= 0);

            // En Go la fila 1 es la inferior
            const rowNumber = size - row;
            return `${colLetter}${rowNumber > 0 ? rowNumber : row + 1}`;
        }

        // Si es topología no cartesiana (triangular, hex, etc.)
        return nodeId.replace(/_/g, ' ').toUpperCase();
    }

    /**
     * Crea un snapshot profundo del tablero actual
     */
    public static createBoardSnapshot(board: GraphBoard): CombatLogSnapshotNode[] {
        const snapshot: CombatLogSnapshotNode[] = [];
        for (const [id, node] of board.nodes.entries()) {
            snapshot.push({
                id,
                stone: node.stone ? {
                    id: node.stone.id,
                    playerId: node.stone.playerId,
                    stoneType: node.stone.stoneType,
                    isIndestructible: node.stone.isIndestructible,
                    shieldTurnsLeft: node.stone.shieldTurnsLeft,
                    polyGroupId: node.stone.polyGroupId
                } : null,
                terrain: node.terrain
            });
        }
        return snapshot;
    }

    /**
     * Resetea el registro para un nuevo combate y captura el estado inicial vacío (Paso 0)
     */
    public static resetForNewMatch(config: GameSetupConfig, board: GraphBoard, _state?: GameState): void {
        this.currentConfig = { ...config };
        this.entries = [];
        this.stepCounter = 0;

        const isEn = getLanguage() === 'en';
        const initialSnapshot = this.createBoardSnapshot(board);

        // Entrada inicial (Paso 0)
        this.entries.push({
            stepIndex: 0,
            turnRound: 1,
            turnLabel: '0',
            playerId: 1,
            playerName: isEn ? 'Game Start' : 'Inicio de Combate',
            playerHeroId: config.heroId || 'normal',
            actionType: 'place_stone',
            actionName: isEn ? 'Match Began' : 'Combate Iniciado',
            primaryNodeId: null,
            coordinateLabel: '—',
            affectedNodeIds: [],
            capturedCount: 0,
            descriptionEs: `Inicio de combate (${config.shape}, ${config.size}x${config.size}, Komi: ${config.komi} pts).`,
            descriptionEn: `Match started (${config.shape}, ${config.size}x${config.size}, Komi: ${config.komi} pts).`,
            boardSnapshot: initialSnapshot,
            snapshotDetails: {
                blackCaptures: 0,
                whiteCaptures: 0,
                greenCaptures: 0,
                purpleCaptures: 0,
                currentPlayer: 1,
                lastMoveNodeId: null,
                isGameOver: false
            },
            timestamp: Date.now()
        });
    }

    /**
     * Obtiene el nombre formateado y bando del jugador
     */
    public static getPlayerDisplayName(playerId: PlayerId, config?: GameSetupConfig | null): { nameEs: string; nameEn: string; icon: string } {
        const isP1 = playerId === 1;

        if (isP1) {
            const heroName = config?.heroId ? config.heroId.charAt(0).toUpperCase() + config.heroId.slice(1) : 'Héroe';
            return {
                nameEs: `⚫ Negras (${heroName})`,
                nameEn: `⚫ Black (${heroName})`,
                icon: '⚫'
            };
        }

        if (playerId === 2) {
            const rivalHero = config?.enemyHeroId && config.enemyHeroId !== 'random' && config.enemyHeroId !== 'normal'
                ? config.enemyHeroId.charAt(0).toUpperCase() + config.enemyHeroId.slice(1)
                : 'Rival';
            return {
                nameEs: `⚪ Blancas (${rivalHero})`,
                nameEn: `⚪ White (${rivalHero})`,
                icon: '⚪'
            };
        }

        if (playerId === 3) {
            return { nameEs: `🟢 Esmeralda (J3)`, nameEn: `🟢 Emerald (P3)`, icon: '🟢' };
        }

        return { nameEs: `🟣 Amatista (J4)`, nameEn: `🟣 Amethyst (P4)`, icon: '🟣' };
    }

    /**
     * Registra una colocación normal de piedra Go
     */
    public static logStonePlacement(
        board: GraphBoard,
        state: GameState,
        nodeId: string,
        playerId: PlayerId,
        capturedCount: number = 0
    ): void {
        this.stepCounter++;
        const size = this.currentConfig?.size || 9;
        const coordLabel = this.formatNodeCoordinate(nodeId, size);
        const playerNames = this.getPlayerDisplayName(playerId, this.currentConfig);
        const boardSnap = this.createBoardSnapshot(board);

        const capTextEs = capturedCount > 0 ? ` (+${capturedCount} captura${capturedCount > 1 ? 's' : ''})` : '';
        const capTextEn = capturedCount > 0 ? ` (+${capturedCount} capture${capturedCount > 1 ? 's' : ''})` : '';

        const entry: CombatLogEntry = {
            stepIndex: this.stepCounter,
            turnRound: state.currentRound,
            turnLabel: state.getTurnLabel(),
            playerId,
            playerName: playerNames.nameEs,
            playerHeroId: playerId === 1 ? (this.currentConfig?.heroId || 'normal') : undefined,
            actionType: 'place_stone',
            actionName: 'Piedra Go',
            primaryNodeId: nodeId,
            coordinateLabel: coordLabel,
            affectedNodeIds: [nodeId],
            capturedCount,
            descriptionEs: `${playerNames.nameEs} colocó piedra en ${coordLabel}${capTextEs}.`,
            descriptionEn: `${playerNames.nameEn} placed stone at ${coordLabel}${capTextEn}.`,
            boardSnapshot: boardSnap,
            snapshotDetails: {
                blackCaptures: state.blackCaptures,
                whiteCaptures: state.whiteCaptures,
                greenCaptures: state.greenCaptures,
                purpleCaptures: state.purpleCaptures,
                currentPlayer: state.currentPlayer,
                lastMoveNodeId: nodeId,
                isGameOver: state.isGameOver
            },
            timestamp: Date.now()
        };

        this.entries.push(entry);
    }

    /**
     * Registra el despliegue de una Ficha Poliminó (🌿 Germinante, 🀄 Duplicidad, 🧱 Monolito)
     */
    public static logPolyominoPlacement(
        board: GraphBoard,
        state: GameState,
        polyType: PolyominoType,
        placedNodeIds: string[],
        playerId: PlayerId,
        capturedCount: number = 0
    ): void {
        this.stepCounter++;
        const size = this.currentConfig?.size || 9;
        const playerNames = this.getPlayerDisplayName(playerId, this.currentConfig);
        const boardSnap = this.createBoardSnapshot(board);

        const polyIcons: Record<PolyominoType, string> = {
            single: '⚫',
            sprouting: '🌿',
            domino: '🀄',
            monolith: '🧱'
        };
        const polyNamesEs: Record<PolyominoType, string> = {
            single: 'Piedra Simple',
            sprouting: 'Ficha Germinante (1x1)',
            domino: 'Ficha Duplicidad (2x1)',
            monolith: 'Ficha Monolito (2x2)'
        };
        const polyNamesEn: Record<PolyominoType, string> = {
            single: 'Single Stone',
            sprouting: 'Sprouting Tile (1x1)',
            domino: 'Duplicity Tile (2x1)',
            monolith: 'Monolith Tile (2x2)'
        };

        const icon = polyIcons[polyType] || '🧱';
        const pNameEs = polyNamesEs[polyType] || 'Ficha Poliminó';
        const pNameEn = polyNamesEn[polyType] || 'Polyomino Tile';

        const coordsFormatted = placedNodeIds.map(nid => this.formatNodeCoordinate(nid, size)).join(', ');
        const primaryNodeId = placedNodeIds[0] || null;
        const capTextEs = capturedCount > 0 ? ` (+${capturedCount} capturas)` : '';
        const capTextEn = capturedCount > 0 ? ` (+${capturedCount} captures)` : '';

        const entry: CombatLogEntry = {
            stepIndex: this.stepCounter,
            turnRound: state.currentRound,
            turnLabel: state.getTurnLabel(),
            playerId,
            playerName: playerNames.nameEs,
            playerHeroId: playerId === 1 ? (this.currentConfig?.heroId || 'normal') : undefined,
            actionType: 'polyomino',
            actionName: `${icon} ${pNameEs}`,
            primaryNodeId,
            coordinateLabel: coordsFormatted,
            affectedNodeIds: [...placedNodeIds],
            capturedCount,
            descriptionEs: `${playerNames.nameEs} desplegó ${icon} ${pNameEs} en [${coordsFormatted}]${capTextEs}.`,
            descriptionEn: `${playerNames.nameEn} deployed ${icon} ${pNameEn} at [${coordsFormatted}]${capTextEn}.`,
            boardSnapshot: boardSnap,
            snapshotDetails: {
                blackCaptures: state.blackCaptures,
                whiteCaptures: state.whiteCaptures,
                greenCaptures: state.greenCaptures,
                purpleCaptures: state.purpleCaptures,
                currentPlayer: state.currentPlayer,
                lastMoveNodeId: primaryNodeId,
                isGameOver: state.isGameOver
            },
            timestamp: Date.now()
        };

        this.entries.push(entry);
    }

    /**
     * Registra un pase de turno
     */
    public static logPassTurn(
        board: GraphBoard,
        state: GameState,
        playerId: PlayerId
    ): void {
        this.stepCounter++;
        const playerNames = this.getPlayerDisplayName(playerId, this.currentConfig);
        const boardSnap = this.createBoardSnapshot(board);

        const entry: CombatLogEntry = {
            stepIndex: this.stepCounter,
            turnRound: state.currentRound,
            turnLabel: state.getTurnLabel(),
            playerId,
            playerName: playerNames.nameEs,
            playerHeroId: playerId === 1 ? (this.currentConfig?.heroId || 'normal') : undefined,
            actionType: 'pass',
            actionName: 'Pase de Turno ⏭️',
            primaryNodeId: null,
            coordinateLabel: '—',
            affectedNodeIds: [],
            capturedCount: 0,
            descriptionEs: `${playerNames.nameEs} pasó su turno. (Pases consecutivos: ${state.consecutivePasses}/${state.playerCount})`,
            descriptionEn: `${playerNames.nameEn} passed their turn. (Consecutive passes: ${state.consecutivePasses}/${state.playerCount})`,
            boardSnapshot: boardSnap,
            snapshotDetails: {
                blackCaptures: state.blackCaptures,
                whiteCaptures: state.whiteCaptures,
                greenCaptures: state.greenCaptures,
                purpleCaptures: state.purpleCaptures,
                currentPlayer: state.currentPlayer,
                lastMoveNodeId: null,
                isGameOver: state.isGameOver
            },
            timestamp: Date.now()
        };

        this.entries.push(entry);
    }

    /**
     * Registra el uso de una Habilidad Activa de Campeón
     */
    public static logChampionSkill(
        board: GraphBoard,
        state: GameState,
        heroId: HeroId | 'boss',
        skillName: string,
        targetNodeId: string | null,
        affectedNodeIds: string[],
        playerId: PlayerId,
        capturedCount: number = 0,
        customDescEs?: string,
        customDescEn?: string
    ): void {
        this.stepCounter++;
        const size = this.currentConfig?.size || 9;
        const playerNames = this.getPlayerDisplayName(playerId, this.currentConfig);
        const coordLabel = targetNodeId ? this.formatNodeCoordinate(targetNodeId, size) : '—';
        const boardSnap = this.createBoardSnapshot(board);

        const skillIcons: Record<string, string> = {
            tengu: '☄️',
            kitsune: '🛡️',
            ronin: '🌪️',
            alchemist: '🌪️',
            ryujin: '🐉🔥',
            himiko: '🌧️✨',
            boss: '🐉'
        };
        const icon = skillIcons[heroId] || '⚡';

        const capTextEs = capturedCount > 0 ? ` (+${capturedCount} capturas)` : '';
        const capTextEn = capturedCount > 0 ? ` (+${capturedCount} captures)` : '';

        const descEs = customDescEs || `${playerNames.nameEs} activó ${icon} ${skillName} en ${coordLabel} (${affectedNodeIds.length} casilla(s) afectadas)${capTextEs}.`;
        const descEn = customDescEn || `${playerNames.nameEn} activated ${icon} ${skillName} at ${coordLabel} (${affectedNodeIds.length} node(s) affected)${capTextEn}.`;

        const entry: CombatLogEntry = {
            stepIndex: this.stepCounter,
            turnRound: state.currentRound,
            turnLabel: state.getTurnLabel(),
            playerId,
            playerName: playerNames.nameEs,
            playerHeroId: heroId === 'boss' ? undefined : heroId,
            actionType: 'champion_skill',
            actionName: `${icon} ${skillName}`,
            primaryNodeId: targetNodeId,
            coordinateLabel: coordLabel,
            affectedNodeIds: [...affectedNodeIds],
            capturedCount,
            descriptionEs: descEs,
            descriptionEn: descEn,
            boardSnapshot: boardSnap,
            snapshotDetails: {
                blackCaptures: state.blackCaptures,
                whiteCaptures: state.whiteCaptures,
                greenCaptures: state.greenCaptures,
                purpleCaptures: state.purpleCaptures,
                currentPlayer: state.currentPlayer,
                lastMoveNodeId: targetNodeId,
                isGameOver: state.isGameOver
            },
            timestamp: Date.now()
        };

        this.entries.push(entry);
    }

    /**
     * Registra la activación de una Habilidad Pasiva
     */
    public static logPassiveTrigger(
        board: GraphBoard,
        state: GameState,
        heroId: HeroId,
        passiveName: string,
        affectedNodeIds: string[],
        playerId: PlayerId,
        capturedCount: number = 0,
        customDescEs?: string,
        customDescEn?: string
    ): void {
        this.stepCounter++;
        const size = this.currentConfig?.size || 9;
        const playerNames = this.getPlayerDisplayName(playerId, this.currentConfig);
        const boardSnap = this.createBoardSnapshot(board);

        const passiveIcons: Record<string, string> = {
            himiko: '🌧️✨',
            ryujin: '🐉🔥',
            ronin: '⚔️'
        };
        const icon = passiveIcons[heroId] || '✨';

        const primaryNodeId = affectedNodeIds[0] || null;
        const coordLabel = primaryNodeId ? this.formatNodeCoordinate(primaryNodeId, size) : '—';

        const capTextEs = capturedCount > 0 ? ` (+${capturedCount} capturas)` : '';
        const capTextEn = capturedCount > 0 ? ` (+${capturedCount} captures)` : '';

        const descEs = customDescEs || `✨ Pasiva disparada: ${icon} ${passiveName} de ${playerNames.nameEs} (${affectedNodeIds.length} casilla(s))${capTextEs}.`;
        const descEn = customDescEn || `✨ Passive triggered: ${icon} ${passiveName} by ${playerNames.nameEn} (${affectedNodeIds.length} node(s))${capTextEn}.`;

        const entry: CombatLogEntry = {
            stepIndex: this.stepCounter,
            turnRound: state.currentRound,
            turnLabel: state.getTurnLabel(),
            playerId,
            playerName: playerNames.nameEs,
            playerHeroId: heroId,
            actionType: 'passive_trigger',
            actionName: `✨ ${passiveName}`,
            primaryNodeId,
            coordinateLabel: coordLabel,
            affectedNodeIds: [...affectedNodeIds],
            capturedCount,
            descriptionEs: descEs,
            descriptionEn: descEn,
            boardSnapshot: boardSnap,
            snapshotDetails: {
                blackCaptures: state.blackCaptures,
                whiteCaptures: state.whiteCaptures,
                greenCaptures: state.greenCaptures,
                purpleCaptures: state.purpleCaptures,
                currentPlayer: state.currentPlayer,
                lastMoveNodeId: primaryNodeId,
                isGameOver: state.isGameOver
            },
            timestamp: Date.now()
        };

        this.entries.push(entry);
    }

    /**
     * Registra el lanzamiento de un Hechizo Consumible (Rebobinar, Meteorito, Escudo, Inversión Yin-Yang)
     */
    public static logSpellCast(
        board: GraphBoard,
        state: GameState,
        spellId: SpellId,
        spellName: string,
        affectedNodeIds: string[],
        playerId: PlayerId,
        capturedCount: number = 0
    ): void {
        this.stepCounter++;
        const size = this.currentConfig?.size || 9;
        const playerNames = this.getPlayerDisplayName(playerId, this.currentConfig);
        const boardSnap = this.createBoardSnapshot(board);

        const spellIcons: Record<SpellId, string> = {
            rewind: '⏳',
            meteor: '☄️',
            shield: '🛡️',
            convert: '☯️'
        };
        const icon = spellIcons[spellId] || '📜';

        const primaryNodeId = affectedNodeIds[0] || null;
        const coordLabel = primaryNodeId ? this.formatNodeCoordinate(primaryNodeId, size) : '—';

        const capTextEs = capturedCount > 0 ? ` (+${capturedCount} capturas)` : '';
        const capTextEn = capturedCount > 0 ? ` (+${capturedCount} captures)` : '';

        const entry: CombatLogEntry = {
            stepIndex: this.stepCounter,
            turnRound: state.currentRound,
            turnLabel: state.getTurnLabel(),
            playerId,
            playerName: playerNames.nameEs,
            playerHeroId: playerId === 1 ? (this.currentConfig?.heroId || 'normal') : undefined,
            actionType: 'spell_cast',
            actionName: `📜 ${icon} ${spellName}`,
            primaryNodeId,
            coordinateLabel: coordLabel,
            affectedNodeIds: [...affectedNodeIds],
            capturedCount,
            descriptionEs: `${playerNames.nameEs} lanzó el pergamino ${icon} ${spellName} en ${coordLabel}${capTextEs}.`,
            descriptionEn: `${playerNames.nameEn} cast scroll ${icon} ${spellName} at ${coordLabel}${capTextEn}.`,
            boardSnapshot: boardSnap,
            snapshotDetails: {
                blackCaptures: state.blackCaptures,
                whiteCaptures: state.whiteCaptures,
                greenCaptures: state.greenCaptures,
                purpleCaptures: state.purpleCaptures,
                currentPlayer: state.currentPlayer,
                lastMoveNodeId: primaryNodeId,
                isGameOver: state.isGameOver
            },
            timestamp: Date.now()
        };

        this.entries.push(entry);
    }

    /**
     * Registra el brote automático de una Piedra Germinante (🌿)
     */
    public static logSproutingGrowth(
        board: GraphBoard,
        state: GameState,
        sproutNodeId: string,
        playerId: PlayerId
    ): void {
        this.stepCounter++;
        const size = this.currentConfig?.size || 9;
        const playerNames = this.getPlayerDisplayName(playerId, this.currentConfig);
        const coordLabel = this.formatNodeCoordinate(sproutNodeId, size);
        const boardSnap = this.createBoardSnapshot(board);

        const entry: CombatLogEntry = {
            stepIndex: this.stepCounter,
            turnRound: state.currentRound,
            turnLabel: state.getTurnLabel(),
            playerId,
            playerName: playerNames.nameEs,
            playerHeroId: playerId === 1 ? (this.currentConfig?.heroId || 'normal') : undefined,
            actionType: 'sprouting_growth',
            actionName: '🌿 Brote Germinante',
            primaryNodeId: sproutNodeId,
            coordinateLabel: coordLabel,
            affectedNodeIds: [sproutNodeId],
            capturedCount: 0,
            descriptionEs: `🌿 ¡Una Piedra Germinante de ${playerNames.nameEs} ha brotado en ${coordLabel}!`,
            descriptionEn: `🌿 A Sprouting stone of ${playerNames.nameEn} grew a new stone at ${coordLabel}!`,
            boardSnapshot: boardSnap,
            snapshotDetails: {
                blackCaptures: state.blackCaptures,
                whiteCaptures: state.whiteCaptures,
                greenCaptures: state.greenCaptures,
                purpleCaptures: state.purpleCaptures,
                currentPlayer: state.currentPlayer,
                lastMoveNodeId: sproutNodeId,
                isGameOver: state.isGameOver
            },
            timestamp: Date.now()
        };

        this.entries.push(entry);
    }

    /**
     * Registra la captura o liberación de una Entidad Neutral (Cofre, Monje, Reliquia, Espíritu)
     */
    public static logCaptiveCaptured(
        board: GraphBoard,
        state: GameState,
        captiveName: string,
        nodeId: string,
        capturerId: PlayerId
    ): void {
        this.stepCounter++;
        const size = this.currentConfig?.size || 9;
        const playerNames = this.getPlayerDisplayName(capturerId, this.currentConfig);
        const coordLabel = this.formatNodeCoordinate(nodeId, size);
        const boardSnap = this.createBoardSnapshot(board);

        const entry: CombatLogEntry = {
            stepIndex: this.stepCounter,
            turnRound: state.currentRound,
            turnLabel: state.getTurnLabel(),
            playerId: capturerId,
            playerName: playerNames.nameEs,
            playerHeroId: capturerId === 1 ? (this.currentConfig?.heroId || 'normal') : undefined,
            actionType: 'captive_freed',
            actionName: `🎁 ${captiveName}`,
            primaryNodeId: nodeId,
            coordinateLabel: coordLabel,
            affectedNodeIds: [nodeId],
            capturedCount: 0,
            descriptionEs: `✨ ${playerNames.nameEs} liberó o asedió ${captiveName} en ${coordLabel}.`,
            descriptionEn: `✨ ${playerNames.nameEn} liberated or captured ${captiveName} at ${coordLabel}.`,
            boardSnapshot: boardSnap,
            snapshotDetails: {
                blackCaptures: state.blackCaptures,
                whiteCaptures: state.whiteCaptures,
                greenCaptures: state.greenCaptures,
                purpleCaptures: state.purpleCaptures,
                currentPlayer: state.currentPlayer,
                lastMoveNodeId: nodeId,
                isGameOver: state.isGameOver
            },
            timestamp: Date.now()
        };

        this.entries.push(entry);
    }

    /**
     * Sincroniza el log al deshacer (Undo): elimina las últimas N entradas para reflejar el estado actual
     */
    public static onUndo(stepsCount: number = 1): void {
        for (let i = 0; i < stepsCount; i++) {
            if (this.entries.length > 1) {
                this.entries.pop();
                this.stepCounter = Math.max(0, this.stepCounter - 1);
            }
        }
    }

    /**
     * Retorna todas las entradas del registro de combate
     */
    public static getEntries(): CombatLogEntry[] {
        return this.entries;
    }

    /**
     * Genera el objeto estructurado de repetición exportable (Replay File)
     */
    public static exportReplayFile(): CombatReplayFile {
        const config = this.currentConfig || {
            ruleStyle: 'classic',
            gameMode: '1via',
            playerCount: 2,
            humanColor: 1,
            difficulty: 'medium',
            komi: 6.5,
            shape: 'square',
            size: 9
        };

        return {
            format: 'CRAZY_GO_REPLAY',
            version: '1.0',
            exportDate: new Date().toISOString(),
            gameConfig: {
                shape: config.shape,
                size: config.size,
                seed: config.seed,
                gameMode: config.gameMode,
                ruleStyle: config.ruleStyle,
                playerCount: config.playerCount,
                komi: config.komi,
                playerKomis: config.playerKomis,
                heroId: config.heroId,
                enemyHeroId: config.enemyHeroId,
                enemyHeroIds: config.enemyHeroIds
            },
            entries: this.entries,
            summary: {
                totalSteps: this.entries.length - 1
            }
        };
    }

    /**
     * Exporta la repetición como string JSON formateado
     */
    public static exportReplayJSON(): string {
        return JSON.stringify(this.exportReplayFile(), null, 2);
    }

    /**
     * Descarga el archivo de repetición en el navegador (.cgo o .json)
     */
    public static downloadReplayFile(): void {
        const jsonStr = this.exportReplayJSON();
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `crazygo_replay_${dateStr}.cgo`;
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Importa y valida una repetición desde una cadena JSON
     */
    public static importReplayJSON(rawJson: string): CombatReplayFile {
        try {
            const parsed = JSON.parse(rawJson) as CombatReplayFile;
            if (!parsed || !parsed.gameConfig || !Array.isArray(parsed.entries) || parsed.entries.length === 0) {
                throw new Error("Formato de repetición no válido (faltan metadatos o entries).");
            }
            return parsed;
        } catch (e: any) {
            throw new Error(`Error al leer archivo de repetición: ${e.message || 'JSON inválido'}`);
        }
    }
    public static logBoardEvent(
        board: GraphBoard,
        state: GameState,
        eventName: string,
        icon: string,
        affectedNodeIds: string[],
        descEs: string,
        descEn: string
    ): void {
        if (!this.currentConfig) return;
        this.stepCounter++;
        const boardSnap = this.createBoardSnapshot(board);

        this.entries.push({
            stepIndex: this.stepCounter,
            turnRound: state.currentTurn,
            turnLabel: state.currentTurn.toString(),
            playerId: 0,
            playerName: getLanguage() === 'en' ? 'Board Event' : 'Evento de Tablero',
            playerHeroId: undefined,
            actionType: 'board_event',
            actionName: icon + ' ' + eventName,
            primaryNodeId: affectedNodeIds.length > 0 ? affectedNodeIds[0] : null,
            coordinateLabel: affectedNodeIds.length > 0 ? this.formatNodeCoordinate(affectedNodeIds[0]) : '—',
            affectedNodeIds: [...affectedNodeIds],
            capturedCount: 0,
            descriptionEs: descEs,
            descriptionEn: descEn,
            boardSnapshot: boardSnap,
            snapshotDetails: {
                blackCaptures: state.blackCaptures,
                whiteCaptures: state.whiteCaptures
            }
        });
    }
}
