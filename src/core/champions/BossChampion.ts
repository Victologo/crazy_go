// champions/BossChampion.ts - Habilidad Activa del Gran Dragón Sabio Gris
import type { ChampionActiveSkill } from './types';

export const BossActiveSkill: ChampionActiveSkill = {
    name: 'Aliento Calcinante del Dragón',
    icon: '🐉',
    description: 'Calcina una esquina equivalente al 25% del tablero destruyendo todas las piedras y colocando una piedra aliada en el centro del vacío.',
    targetingMode: 'none'
};
