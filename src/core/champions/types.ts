// champions/types.ts - Definiciones de tipos para Campeones y Habilidades
import type { HeroId } from '../RoguelikeRunManager';

export type TargetingMode = 'none' | 'meteor_5x5' | 'shield_target' | 'convert_enemy' | 'dragon_burn_2';

export interface ChampionActiveSkill {
    name: string;
    icon: string;
    description: string;
    targetingMode: TargetingMode;
}

export interface ChampionPassiveSkill {
    name: string;
    icon: string;
    description: string;
    conditionDesc: string;
}

export interface ChampionDefinition {
    id: HeroId;
    name: string;
    activeSkill?: ChampionActiveSkill;
    passiveSkill?: ChampionPassiveSkill;
}
