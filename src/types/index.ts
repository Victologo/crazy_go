// types/index.ts - Definición centralizada de tipos del dominio de Crazy Go

// 1. Identificadores y Elementos de Tablero
export type PlayerId = 1 | 2 | 3 | 4; // 1 = Negras ⚫, 2 = Blancas ⚪, 3 = Esmeralda 🟢, 4 = Amatista 🟣

export type TerrainType = 'normal' | 'void' | 'portal' | 'sanctuary' | 'vortex';

export type PolyominoType = 'single' | 'sprouting' | 'domino' | 'monolith';
export type PolyominoOrientation = 'horizontal' | 'vertical';

export interface PolyominoCard {
    id: PolyominoType;
    name: string;
    icon: string;
    description: string;
    sizeLabel: string;
    usesLeft: number;
    orientation?: PolyominoOrientation;
}

export interface StoneInfo {
    playerId: PlayerId;
    moveNumber: number;
    stoneType?: PolyominoType;
    sproutBirthTurn?: number;
    isShielded?: boolean;
    isRooted?: boolean;
    polyGroupId?: string;
}

export interface BoardNode {
    id: string;
    x: number;
    y: number;
    neighbors: string[];
    terrain: TerrainType;
    stone: StoneInfo | null;
    eyeStatus?: 'black' | 'white' | null;
}

// 2. Modos, Topologías y Configuración de Partida
export type BoardShape = 
    | 'square' 
    | 'triangle' 
    | 'hex' 
    | 'hexagon'
    | 'irregular' 
    | 'eroded'
    | 'islands' 
    | 'islands_v1' 
    | 'islands_v2' 
    | 'cross' 
    | 'hourglass' 
    | 'geode' 
    | 'spiral' 
    | 'rings' 
    | 'star_5'
    | 'star_6'
    | 'procedural';
export type BoardSize = 5 | 9 | 13 | 19;
export type GameMode = '1v1' | '1via' | 'coop' | 'online' | 'story';
export type RuleStyle = 'classic' | 'roguelite';
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'dan';
export type AppTheme = 'dark' | 'light';

export type TimerMode = 'none' | 'per_move' | 'absolute' | 'fischer' | 'japanese';

export interface TimerConfig {
    mode: TimerMode;
    mainTimeSeconds: number; // e.g. 60, 180, 300, 600, 900
    incrementSeconds: number; // e.g. 5, 10
    byoYomiSeconds: number; // e.g. 10, 15, 20, 30, 45, 60
    byoYomiPeriods?: number; // e.g. 3, 5
}

export interface PlayerTimerState {
    timeRemainingSeconds: number;
    movesCount: number;
    isFlagFallen: boolean;
    byoYomiPeriodsLeft?: number;
    isInByoYomi?: boolean;
}

export type CaptiveType = 'chest' | 'hostage' | 'scroll_relic' | 'spirit';

export interface CaptiveEntity {
    id: string;
    nodeId: string;
    nodeIds?: string[]; // Para entidades que ocupan múltiples casillas contiguas (ej: 2x1)
    type: CaptiveType;
    name: string;
    icon: string;
    description: string;
    rewardType: 'poly' | 'spell' | 'komi' | 'transmute';
    rewardValue?: any;
    isCaptured: boolean;
    capturedBy?: PlayerId; // Jugador que completó la captura (1 = Negras/Humano, 2 = Blancas/IA)
}

export interface SpecialStonesConfig {
    enabled: boolean;
    playerSprouting: number;
    playerDomino: number;
    playerMonolith: number;
    aiEnabled: boolean;
    aiSprouting: number;
    aiDomino: number;
    aiMonolith: number;
}

export interface GameSetupConfig {
    ruleStyle: RuleStyle;
    gameMode: GameMode;
    playerCount: 2 | 4;
    humanColor: PlayerId;
    difficulty: AIDifficulty;
    komi: number;
    handicap?: number; // 0, 2..9 piedras de hándicap
    shape: BoardShape;
    size: BoardSize;
    seed?: number;
    background?: BoardBackground;
    heroId?: HeroId | null;
    enemyHeroId?: EnemyHeroId | 'random' | 'random_monk' | 'random_sage' | null;
    enemyHeroIds?: Record<number, EnemyHeroId | 'random' | 'random_monk' | 'random_sage' | null>;

    specialStones?: SpecialStonesConfig;
    playerKomis?: Record<number, number>; // Komi individual para 4P (e.g. { 2: 2.5, 3: 4.5, 4: 6.5 })
    timer?: TimerConfig;
    isCoopRogue?: boolean;
    isRoguelikeMatch?: boolean;
    coopSubTurn?: 1 | 2; // 1 = J1 Host, 2 = J2 Guest
}

export type BoardBackground = 'combat' | 'story' | 'tutorial' | 'boss' | 'meadow' | 'sunset' | 'night';

// 3. Sistema de Héroes y Hechizos Roguelite
export type HeroId = 'tengu' | 'himiko' | 'kitsune' | 'ronin' | 'alchemist' | 'ryujin' | 'normal';
export type EnemyHeroId = HeroId | 'boss';
export type SpellId = 'rewind' | 'meteor' | 'shield' | 'convert';
export type TargetingMode = 'none' | 'meteor_5x5' | 'shield_target' | 'convert_enemy' | 'dragon_burn_2';

export interface HeroDefinition {
    id: HeroId;
    name: string;
    icon: string;
    title: string;
    description: string;
    image: string;
    quote: string;
    skillType: 'active' | 'passive' | 'none';
    activeName?: string;
    activeDesc?: string;
    activeCharges?: number;
    passiveName?: string;
    passiveDesc?: string;
    startingSpells: { [spellId: string]: number };
    extraKomi?: number;
}

export interface SpellCard {
    id: SpellId;
    name: string;
    icon: string;
    description: string;
    usesLeft: number;
    color: string;
}

export interface ActiveSkillInfo {
    heroId: HeroId;
    name: string;
    icon: string;
    description: string;
    targetingMode: TargetingMode;
}

// 4. Expedición Roguelike y Mapa Procedural
export type RogueliteDifficulty = 'easy' | 'normal' | 'hard' | 'extreme';
export type NodeType = 'battle' | 'elite' | 'sanctuary' | 'rest' | 'merchant' | 'boss';

export interface BattleConfig {
    enemyName: string;
    rankLabel: string;
    aiDifficulty: AIDifficulty;
    shape: BoardShape;
    size: BoardSize;
    captives?: CaptiveEntity[];
}

export interface OnlineGameConfig {
    shape: BoardShape;
    size: BoardSize;
    seed?: number;
    komi: number;
    hostColor: PlayerId;
    playerCount?: 2 | 4;
    assignedColor?: PlayerId;
    hostHero?: HeroId | null;
    guestHeroes?: Partial<Record<PlayerId, HeroId | null>>;
    timer?: TimerConfig;
    isCoopRogue?: boolean;
    background?: BoardBackground;
}

export interface MapNode {
    id: string;
    tier: number;
    colIndex: number;
    type: 'battle' | 'elite' | 'shrine' | 'rest' | 'shop' | 'boss' | NodeType;
    title: string;
    icon: string;
    description: string;
    status: 'locked' | 'available' | 'current' | 'completed';
    battleConfig?: any;
    nextConnectedNodeIds: string[];
    x: number;
    y: number;
}

export interface MerchantItem {
    id: string;
    type: 'spell' | 'komi_boost' | 'hero_skill_charge';
    name: string;
    icon: string;
    desc: string;
    price: number;
    spellId?: SpellId;
    komiValue?: number;
}

// 5. Puntuación y Ranking
export interface PlayerScore {
    playerId: PlayerId;
    name: string;
    icon: string;
    color?: string;
    territory: number;
    captures: number;
    komi: number;
    total: number;
}

export interface ScoreReport {
    playerCount?: number;
    playerScores: Record<PlayerId, PlayerScore>;
    ranking: PlayerScore[];
    blackTerritory: number;
    whiteTerritory: number;
    greenTerritory: number;
    purpleTerritory: number;
    blackCaptures: number;
    whiteCaptures: number;
    greenCaptures: number;
    purpleCaptures: number;
    komi: number;
    blackTotal: number;
    whiteTotal: number;
    winner: 'black' | 'white' | 'green' | 'purple' | 'draw';
    winnerPlayerId: PlayerId | null;
    margin: number;
    territoryMap?: Map<string, PlayerId | 0>;
    deadStones?: Map<string, PlayerId>;
    deadStonesCount?: Record<PlayerId, number>;
    sekiMap?: Set<string>;   // Nodos en Seki (vida mutua — no cuentan como territorio)
    dameCount?: number;
}


export interface PlayerMeta {
    id: PlayerId;
    name: string;
    icon: string;
    colorHex: string;
}
