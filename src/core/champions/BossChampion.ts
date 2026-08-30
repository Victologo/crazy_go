// champions/BossChampion.ts - Habilidad Activa del Gran Dragón Sabio Gris
import type { ChampionActiveSkill, ChampionPassiveSkill } from './types';

export const BossActiveSkill: ChampionActiveSkill = {
    name: 'Ninguna',
    icon: '—',
    description: 'El Gran Dragón Sabio Gris prefiere luchar con honor y fuerza bruta sin depender de habilidades mágicas.',
    targetingMode: 'none'
};

export const BossPassiveSkill: ChampionPassiveSkill = {
    name: 'Presencia Imponente',
    icon: '🐉',
    description: 'La mera presencia del dragón intimida al oponente, pero no afecta las reglas del juego.',
    conditionDesc: 'Siempre activa.'
};
