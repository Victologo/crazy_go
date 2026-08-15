// champions/BossChampion.ts - Habilidad Activa del Gran Dragón Sabio Gris
import type { ChampionActiveSkill } from './types';

export const BossActiveSkill: ChampionActiveSkill = {
    name: 'Dragon’s Calcinating Breath',
    icon: '🐉',
    description: 'Incinerates a board corner equivalent to 25% of the board, destroying all stones and placing an allied stone in the center of the void.',
    targetingMode: 'none'
};
