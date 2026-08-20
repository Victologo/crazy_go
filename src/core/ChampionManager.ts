// ChampionManager.ts - Fachada Central de Lógica de Habilidades Activas y Pasivas de Campeones
import type { HeroId } from './RoguelikeRunManager';
import type { GraphBoard, PlayerId, BoardNode } from './GraphBoard';
import type { GameState } from './GameState';
import type { BoardSize } from '../types';
import type { TargetingMode, ChampionActiveSkill, ChampionPassiveSkill } from './champions/types';

import { TenguActiveSkill, TenguChampion } from './champions/TenguChampion';
import { HimikoPassiveSkill, HimikoChampion } from './champions/HimikoChampion';
import { KitsuneActiveSkill, KitsuneChampion } from './champions/KitsuneChampion';
import { AlchemistActiveSkill, AlchemistChampion } from './champions/AlchemistChampion';
import { RoninChampion } from './champions/RoninChampion';
import { RyujinPassiveSkill, RyujinChampion } from './champions/RyujinChampion';
import { BossActiveSkill } from './champions/BossChampion';

export type { TargetingMode, ChampionActiveSkill, ChampionPassiveSkill };

export interface ChampionSnapshot {
    activeChargesLeft: number;
    isPassiveSkillAvailable: boolean;
    dragonBurnKillsRemaining: number;
    alchemistInversionsRemaining: number;
    ryujinEarnedBurns19x19: number;
    alchemistUsedThisTurn: boolean;
}

export const NormalHumanPassiveSkill: ChampionPassiveSkill = {
    name: "Sensei's Retrospect",
    icon: '⏳',
    description: 'Master of calculation. Starts each match with 2 tactical Rewind charges to correct reading blunders.',
    conditionDesc: 'Innate (2 Rewinds per match)'
};

export const RoninPassiveSkill: ChampionPassiveSkill = {
    name: "Samurai's Edge",
    icon: '⚡',
    description: 'Every 20 turns elapsed, slashes the vital flow and eradicates 1 random enemy stone from the Goban.',
    conditionDesc: 'Every 20 turns elapsed'
};

export class ChampionManager {
    public static currentHero: HeroId | null = null;
    public static activeChargesLeft: number = 1;
    public static isPassiveSkillAvailable: boolean = true;
    public static currentTargetingMode: TargetingMode = 'none';
    public static heroOwnerId: PlayerId = 1; // El jugador dueño de las habilidades
    public static dragonBurnKillsRemaining: number = 0;
    public static alchemistInversionsRemaining: number = 0;
    public static ryujinEarnedBurns19x19: number = 0;
    public static targetingPlayerId: PlayerId = 1;
    /** Impide que el Alquimista use su habilidad más de una vez por turno */
    public static alchemistUsedThisTurn: boolean = false;

    public static getSnapshot(): ChampionSnapshot {
        return {
            activeChargesLeft: this.activeChargesLeft,
            isPassiveSkillAvailable: this.isPassiveSkillAvailable,
            dragonBurnKillsRemaining: this.dragonBurnKillsRemaining,
            alchemistInversionsRemaining: this.alchemistInversionsRemaining,
            ryujinEarnedBurns19x19: this.ryujinEarnedBurns19x19,
            alchemistUsedThisTurn: this.alchemistUsedThisTurn
        };
    }

    public static restoreSnapshot(snapshot: ChampionSnapshot) {
        if (!snapshot) return;
        this.activeChargesLeft = snapshot.activeChargesLeft;
        this.isPassiveSkillAvailable = snapshot.isPassiveSkillAvailable;
        this.dragonBurnKillsRemaining = snapshot.dragonBurnKillsRemaining;
        this.alchemistInversionsRemaining = snapshot.alchemistInversionsRemaining;
        this.ryujinEarnedBurns19x19 = snapshot.ryujinEarnedBurns19x19;
        this.alchemistUsedThisTurn = snapshot.alchemistUsedThisTurn ?? false;
        this.currentTargetingMode = 'none';
    }

    /**
     * Llamado por GameState.advanceTurn cuando el turno cambia al jugador 'nextPlayer'.
     * Solo resetea el flag alchemistUsedThisTurn cuando el turno vuelve al dueño del héroe,
     * de modo que el flag bloquea correctamente durante el turno de la IA.
     */
    public static onTurnAdvanced(nextPlayer?: PlayerId): void {
        // Resetear el flag solo cuando le toca de nuevo al jugador del Alquimista
        if (nextPlayer === undefined || nextPlayer === this.heroOwnerId) {
            this.alchemistUsedThisTurn = false;
        }
    }

    // Compatibilidad retroactiva
    public static get roninInversionsRemaining(): number {
        return this.alchemistInversionsRemaining;
    }
    public static set roninInversionsRemaining(val: number) {
        this.alchemistInversionsRemaining = val;
    }

    public static readonly ACTIVE_SKILLS: Partial<Record<HeroId | 'grey_dragon_boss', ChampionActiveSkill>> = {
        tengu: TenguActiveSkill,
        kitsune: KitsuneActiveSkill,
        alchemist: AlchemistActiveSkill,
        grey_dragon_boss: BossActiveSkill
    };

    public static readonly PASSIVE_SKILLS: Partial<Record<HeroId, ChampionPassiveSkill>> = {
        normal: NormalHumanPassiveSkill,
        himiko: HimikoPassiveSkill,
        ronin: RoninPassiveSkill,
        ryujin: RyujinPassiveSkill
    };

    public static get isActiveSkillAvailable(): boolean {
        // El Alquimista no puede reusar su habilidad en el mismo turno aunque le queden cargas
        if (this.currentHero === 'alchemist' && this.alchemistUsedThisTurn) return false;
        return this.activeChargesLeft > 0;
    }

    public static getKitsuneShieldCharges(boardOrSize?: GraphBoard | BoardSize | number | null): number {
        return KitsuneChampion.getShieldCharges(boardOrSize);
    }

    public static getAlchemistInversionCount(boardOrSize?: GraphBoard | BoardSize | number | null): number {
        return AlchemistChampion.getInversionCount(boardOrSize);
    }

    public static getRoninInversionCount(boardOrSize?: GraphBoard | BoardSize | number | null): number {
        return AlchemistChampion.getInversionCount(boardOrSize);
    }

    public static resetForMatch(heroId: HeroId | null, boardOrSize?: GraphBoard | BoardSize | number | null) {
        this.currentHero = heroId;
        this.isPassiveSkillAvailable = true;
        this.currentTargetingMode = 'none';
        this.dragonBurnKillsRemaining = 0;
        this.alchemistInversionsRemaining = heroId === 'alchemist' ? this.getAlchemistInversionCount(boardOrSize) : 0;
        this.ryujinEarnedBurns19x19 = 0;
        this.alchemistUsedThisTurn = false;
        this.targetingPlayerId = 1;
        this.heroOwnerId = 1;

        if (heroId === 'kitsune') {
            this.activeChargesLeft = this.getKitsuneShieldCharges(boardOrSize);
        } else if (heroId === 'tengu') {
            this.activeChargesLeft = 1;
        } else if (heroId === 'alchemist') {
            this.activeChargesLeft = this.alchemistInversionsRemaining;
        } else {
            this.activeChargesLeft = 0;
        }
    }

    public static setHero(heroId: HeroId | null, boardOrSize?: GraphBoard | BoardSize | number | null) {
        this.resetForMatch(heroId, boardOrSize);
    }

    /**
     * Comprueba y dispara las pasivas que correspondan tras un movimiento (al finalizar el turno)
     */
    public static checkPassiveTriggers(
        board: GraphBoard,
        state: GameState,
        playerId: PlayerId,
        svgElement: SVGSVGElement | null,
        onNotify: (msg: string) => void,
        onBoardUpdated: () => void,
        _onExtraTurnGranted?: () => void
    ) {
        if (!this.currentHero || state.isGameOver) return;
        if (playerId !== this.heroOwnerId) return; // Solo dispara si el turno pertenece al dueño del héroe

        const playerTurns = state.getPlayerTurnCount(playerId);

        // 1. Himiko la Astrónoma: Lluvia Pétrea al finalizar su Turno 20 personal
        if (this.currentHero === 'himiko' && this.isPassiveSkillAvailable && playerTurns >= 20) {
            this.isPassiveSkillAvailable = false;
            HimikoChampion.checkAndTriggerPassive(board, state, playerId, svgElement, onNotify, onBoardUpdated);
            return;
        }

        // 2. Ronin: Filo del Samurai (Elimina 1 piedra enemiga aleatoria cada 25 turnos al final del turno)
        if (this.currentHero === 'ronin') {
            RoninChampion.checkPassiveTrigger(board, state, playerId, svgElement, onNotify, onBoardUpdated);
        }

        // 3. Ryūjin: Furia del Dragón (Calcinar piedras con escalado por tamaño de tablero)
        if (this.currentHero === 'ryujin') {
            const res = RyujinChampion.checkPassiveTrigger(
                board,
                playerId,
                this.isPassiveSkillAvailable,
                this.ryujinEarnedBurns19x19,
                onNotify,
                onBoardUpdated
            );

            if (res.triggered) {
                this.isPassiveSkillAvailable = false;
                this.dragonBurnKillsRemaining = res.burnsGranted;
                this.ryujinEarnedBurns19x19 = res.newEarnedBurns19x19;
                this.currentTargetingMode = 'dragon_burn_2';
                this.targetingPlayerId = playerId;
            }
        }
    }

    /**
     * Ejecuta una habilidad con objetivo sobre una coordenada/nodo
     */
    public static async executeTargetedSkill(
        board: GraphBoard,
        state: GameState,
        targetNodeId: string,
        playerId: PlayerId,
        svgElement: SVGSVGElement | null,
        onSuccess: (msg: string) => void,
        onError: (msg: string) => void,
        onComplete: () => void
    ): Promise<boolean> {
        // 1. Tengu: Lluvia Meteórica
        if (this.currentHero === 'tengu') {
            const ok = TenguChampion.executeSkill(board, targetNodeId, svgElement, onSuccess, () => {
                this.activeChargesLeft = Math.max(0, this.activeChargesLeft - 1);
                this.currentTargetingMode = 'none';
                onComplete();
            });
            return ok;
        }

        // 2. Kitsune: Escudo Divino
        if (this.currentHero === 'kitsune') {
            const ok = KitsuneChampion.executeSkill(
                board,
                targetNodeId,
                playerId,
                this.activeChargesLeft,
                onSuccess,
                onError
            );
            if (ok) {
                this.activeChargesLeft = Math.max(0, this.activeChargesLeft - 1);
                this.currentTargetingMode = 'none';
                onComplete();
            }
            return ok;
        }

        // 3. Alquimista: Inversión Cromática / Transmutación Yin-Yang
        if (this.currentHero === 'alchemist' || this.currentTargetingMode === 'convert_enemy') {
            const res = await AlchemistChampion.executeSkill(
                board,
                state,
                targetNodeId,
                playerId,
                this.alchemistInversionsRemaining,
                svgElement,
                onSuccess,
                onError
            );

            if (res.success) {
                this.alchemistInversionsRemaining = res.newInversionsRemaining;
                if (res.isFinished) {
                    this.activeChargesLeft = Math.max(0, this.activeChargesLeft - 1);
                    // CRÍTICO: poner el flag ANTES de advanceTurn para que onTurnAdvanced()
                    // no lo destruya. El flag sobrevivirá al turno de la IA porque
                    // onTurnAdvanced() solo lo resetea cuando le vuelve a tocar al dueño del héroe.
                    this.alchemistUsedThisTurn = true;
                    this.currentTargetingMode = 'none';
                    // Avanzar turno sin incrementar consecutivePasses:
                    // La Inversión Cromática NO es un pase voluntario — es una acción táctica.
                    // Usar advanceTurn() directamente evita que la IA vea consecutivePasses>=1
                    // y pase su turno de forma prematura en respuesta.
                    state.advanceTurn();
                }
                onComplete();
            }
            return res.success;
        }

        // 4. Ryūjin: Furia del Dragón
        if (this.currentTargetingMode === 'dragon_burn_2') {
            const res = RyujinChampion.executeBurn(
                board,
                targetNodeId,
                playerId,
                this.dragonBurnKillsRemaining,
                svgElement,
                onSuccess,
                onError
            );

            if (res.success) {
                this.dragonBurnKillsRemaining = res.newBurnsRemaining;
                if (res.isFinished) {
                    this.currentTargetingMode = 'none';
                }
                onComplete();
            }
            return res.success;
        }

        return false;
    }

    public static getMeteorZoneNodes(board: GraphBoard, centerNodeId: string): BoardNode[] {
        return TenguChampion.getMeteorZoneNodes(board, centerNodeId);
    }

    public static getMeteorCount(board: GraphBoard): number {
        return TenguChampion.getMeteorCount(board);
    }

    public static getStoneRainCount(boardOrSize?: GraphBoard | BoardSize | number | null): number {
        return HimikoChampion.getStoneRainCount(boardOrSize);
    }

    public static isValidTarget(board: GraphBoard, nodeId: string, playerId: PlayerId): boolean {
        const node = board.nodes.get(nodeId);
        if (!node) return false;

        const effectivePid = this.targetingPlayerId || playerId;

        if (this.currentTargetingMode === 'meteor_5x5') {
            return true;
        } else if (this.currentTargetingMode === 'shield_target') {
            return node.stone !== null && node.stone.playerId === effectivePid && !node.stone.isIndestructible;
        } else if (this.currentTargetingMode === 'convert_enemy' || this.currentTargetingMode === 'dragon_burn_2') {
            return node.stone !== null && !node.stone.isIndestructible;
        }
        return false;
    }
}
