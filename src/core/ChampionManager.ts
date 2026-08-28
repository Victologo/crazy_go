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
import { SoundFX } from '../audio/SoundFX';
import { KitsuneVFX } from '../graphics/vfx/KitsuneVFX';
import { CombatLogManager } from './CombatLogManager';

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

    public static getKitsuneShieldCharges(boardOrSize?: GraphBoard | BoardSize | number | { shape?: string; size?: number } | null): number {
        return KitsuneChampion.getShieldCharges(boardOrSize);
    }

    public static getAlchemistInversionCount(boardOrSize?: GraphBoard | BoardSize | number | { shape?: string; size?: number } | null): number {
        return AlchemistChampion.getInversionCount(boardOrSize);
    }

    public static getRoninInversionCount(boardOrSize?: GraphBoard | BoardSize | number | { shape?: string; size?: number } | null): number {
        return AlchemistChampion.getInversionCount(boardOrSize);
    }

    public static resetForMatch(
        heroId: HeroId | null, 
        boardOrSize?: GraphBoard | BoardSize | number | { shape?: string; size?: number } | null,
        heroOwnerId: PlayerId = 1
    ) {
        this.currentHero = heroId;
        this.isPassiveSkillAvailable = true;
        this.currentTargetingMode = 'none';
        this.dragonBurnKillsRemaining = 0;
        this.alchemistInversionsRemaining = heroId === 'alchemist' ? this.getAlchemistInversionCount(boardOrSize) : 0;
        this.ryujinEarnedBurns19x19 = 0;
        this.alchemistUsedThisTurn = false;
        this.targetingPlayerId = heroOwnerId;
        this.heroOwnerId = heroOwnerId;

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

    public static setHero(
        heroId: HeroId | null, 
        boardOrSize?: GraphBoard | BoardSize | number | { shape?: string; size?: number } | null,
        heroOwnerId: PlayerId = 1
    ) {
        this.resetForMatch(heroId, boardOrSize, heroOwnerId);
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
                SoundFX.playDragonFlame();
                SoundFX.playSkillActivate();
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
        onComplete: () => void,
        remoteHeroId?: string
    ): Promise<boolean> {
        const effectiveHero = remoteHeroId || this.currentHero;
        const isRemote = !!remoteHeroId;
        // console.log('🎯 [ChampionManager] executeTargetedSkill invoked:', { targetNodeId, playerId, currentTargetingMode: this.currentTargetingMode, effectiveHero, isRemote });

        // 1. Alquimista: Inversión Cromática / Transmutación Yin-Yang
        if (this.currentTargetingMode === 'convert_enemy' || effectiveHero === 'alchemist') {
            // console.log('🎯 [ChampionManager] Calling AlchemistChampion.executeSkill...');
            const res = await AlchemistChampion.executeSkill(
                board,
                state,
                targetNodeId,
                playerId,
                isRemote ? 999 : this.alchemistInversionsRemaining,
                svgElement,
                onSuccess,
                onError
            );
            // console.log('🎯 [ChampionManager] AlchemistChampion.executeSkill returned result:', res);
            if (res.success) {
                CombatLogManager.logChampionSkill(board, state, 'alchemist', 'Inversión Cromática', targetNodeId, [targetNodeId], playerId);
                if (!isRemote) {
                    this.alchemistInversionsRemaining = res.newInversionsRemaining;
                    if (res.isFinished) {
                        this.activeChargesLeft = Math.max(0, this.activeChargesLeft - 1);
                        this.alchemistUsedThisTurn = true;
                        this.currentTargetingMode = 'none';
                        state.advanceTurn();
                    }
                } else if (res.isFinished) {
                    state.advanceTurn();
                }
                onComplete();
                return true;
            } else {
                if (res.cancelled) {
                    // El usuario canceló explícitamente el modal de selección de color
                    // console.log('🎯 [ChampionManager] Skill cancelled by user modal close');
                    this.currentTargetingMode = 'none';
                    onComplete();
                }
                // Si fue un clic inválido (ej. casilla vacía o piedra indestructible),
                // el modo de apuntar permanece activo para que pueda clicar en la piedra deseada.
                return false;
            }
        }

        // 2. Ryūjin: Furia del Dragón
        if (this.currentTargetingMode === 'dragon_burn_2' || (isRemote && effectiveHero === 'ryujin')) {
            const res = RyujinChampion.executeBurn(
                board,
                targetNodeId,
                playerId,
                isRemote ? 999 : this.dragonBurnKillsRemaining,
                svgElement,
                onSuccess,
                onError
            );

            if (res.success) {
                CombatLogManager.logChampionSkill(board, state, 'ryujin', 'Furia del Dragón', targetNodeId, [targetNodeId], playerId, 1);
                this.dragonBurnKillsRemaining = res.newBurnsRemaining;
                if (res.isFinished) {
                    this.currentTargetingMode = 'none';
                }
                onComplete();
            }
            return res.success;
        }

        // 3. Kitsune: Escudo Divino
        if (this.currentTargetingMode === 'shield_target' || effectiveHero === 'kitsune') {
            // Check cost before execution
            const chain = board.getChain(targetNodeId);
            const cost = isRemote ? 0 : Math.ceil(chain.size / 5);

            if (!isRemote && cost > this.activeChargesLeft) {
                onError(`Not enough charges! Shielding this group of ${chain.size} stones requires ${cost} charges.`);
                return false;
            }

            const ok = KitsuneChampion.executeSkill(
                board,
                targetNodeId,
                playerId,
                isRemote ? 999 : this.activeChargesLeft,
                cost,
                onSuccess,
                onError
            );
            if (ok) {
                CombatLogManager.logChampionSkill(board, state, 'kitsune', 'Escudo Divino', targetNodeId, Array.from(chain), playerId);
                if (svgElement) {
                    chain.forEach(nid => {
                        const n = board.nodes.get(nid);
                        if (n) KitsuneVFX.triggerDivineShieldAura({ x: n.x, y: n.y }, svgElement);
                    });
                }
                SoundFX.playDivineShieldCast();
                if (!isRemote) {
                    this.activeChargesLeft = Math.max(0, this.activeChargesLeft - cost);
                    this.currentTargetingMode = 'none';
                }
                onComplete();
            }
            return ok;
        }

        // 4. Tengu: Lluvia Meteórica
        if (this.currentTargetingMode === 'meteor_5x5' || effectiveHero === 'tengu') {
            const ok = TenguChampion.executeSkill(board, targetNodeId, svgElement, onSuccess, () => {
                CombatLogManager.logChampionSkill(board, state, 'tengu', 'Lluvia Meteórica', targetNodeId, [targetNodeId], playerId);
                if (!isRemote) {
                    this.activeChargesLeft = Math.max(0, this.activeChargesLeft - 1);
                    this.currentTargetingMode = 'none';
                }
                onComplete();
            });
            return ok;
        }

        return false;
    }

    public static getMeteorZoneNodes(board: GraphBoard, centerNodeId: string): BoardNode[] {
        return TenguChampion.getMeteorZoneNodes(board, centerNodeId);
    }

    public static getMeteorCount(board: GraphBoard): number {
        return TenguChampion.getMeteorCount(board);
    }

    public static getStoneRainCount(boardOrSize?: GraphBoard | BoardSize | number | { shape?: string; size?: number } | null): number {
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

