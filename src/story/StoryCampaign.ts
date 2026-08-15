import type { BoardShape, BoardSize, HeroId } from '../types';

export type DialogueSpeakerPosition = 'left' | 'right' | 'center';

export interface StoryDialogueLine {
    speakerName: string;
    speakerImage: string; // e.g., '/heroes/normal_face.jpg'
    text: string;
    position: DialogueSpeakerPosition;
}

export interface StoryEvent {
    trigger: 'pre_battle' | 'post_battle' | 'on_capture' | 'turn_start';
    targetId?: string; // e.g., 'hostage_1' if trigger is 'on_capture', or '1' if turn_start
    dialogues: StoryDialogueLine[];
}

export interface StoryCaptiveConfig {
    id: string;
    type: 'chest' | 'hostage' | 'scroll_relic' | 'spirit';
    name: string;
    x: number;
    y: number;
    icon: string;
    description: string;
    rewardType: 'poly' | 'spell' | 'komi' | 'transmute';
    rewardValue?: any;
}

export interface StoryChapter {
    id: string;
    title: string;
    description: string;
    boardShape: BoardShape;
    boardSize: BoardSize;
    heroId: HeroId;
    enemyHeroId: HeroId | null;
    komi: number;
    initialStones: { x: number; y: number; player: number }[];
    captives: StoryCaptiveConfig[];
    events: StoryEvent[];
    winCondition: 'eliminate' | 'capture_all' | 'capture_specific' | 'survive';
    targetCaptiveId?: string;
}

export const STORY_CAMPAIGN: StoryChapter[] = [
    {
        id: 'cap_1_awakening',
        title: 'Capítulo 1: El Despertar',
        description: 'Te encuentras en las islas flotantes. Rescata al monje cautivo.',
        boardShape: 'islands',
        boardSize: 13,
        heroId: 'normal',
        enemyHeroId: null,
        komi: 6.5,
        initialStones: [],
        captives: [
            {
                id: 'monk_target',
                type: 'hostage',
                name: 'Monje Sabio',
                x: 6,
                y: 6,
                icon: '🧙',
                description: 'Un monje atrapado en la isla central.',
                rewardType: 'komi',
                rewardValue: 5
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Hombre Normal', speakerImage: '/heroes/normal_face.jpg', text: '¿Dónde estoy? El tatami está fragmentado...', position: 'left' },
                    { speakerName: 'Monje Sabio', speakerImage: '/enemies/monk_1.png', text: '¡Viajero! Ayúdame, estoy atrapado en el centro del Goban. ¡Rodéame con tus piedras para liberarme!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'monk_target',
                dialogues: [
                    { speakerName: 'Monje Sabio', speakerImage: '/enemies/monk_1.png', text: '¡Gracias! Mi chi ahora fluye hacia ti. Te otorgaré ventaja en tu viaje.', position: 'right' },
                    { speakerName: 'Hombre Normal', speakerImage: '/heroes/normal_face.jpg', text: 'Aún no entiendo nada, pero el camino se abre...', position: 'left' }
                ]
            }
        ],
        winCondition: 'capture_specific',
        targetCaptiveId: 'monk_target'
    },
    {
        id: 'cap_2_the_fox',
        title: 'Capítulo 2: El Bosque de los Engaños',
        description: 'Kitsune ha robado el Pergamino Sagrado. Recupéralo.',
        boardShape: 'eroded',
        boardSize: 13,
        heroId: 'normal',
        enemyHeroId: 'kitsune',
        komi: 6.5,
        initialStones: [
            { x: 3, y: 3, player: 2 },
            { x: 9, y: 9, player: 2 }
        ],
        captives: [
            {
                id: 'scroll_target',
                type: 'scroll_relic',
                name: 'Pergamino Antiguo',
                x: 9,
                y: 3,
                icon: '📜',
                description: 'Reliquia sagrada custodiada por Kitsune.',
                rewardType: 'spell',
                rewardValue: 'meteor'
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Kitsune', speakerImage: '/heroes/kitsune_face.jpg', text: 'Fufufu... ¿Buscas esto? Atrápalo si puedes, humano.', position: 'right' },
                    { speakerName: 'Hombre Normal', speakerImage: '/heroes/normal_face.jpg', text: 'Devuélvelo. No tengo tiempo para tus juegos.', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'scroll_target',
                dialogues: [
                    { speakerName: 'Kitsune', speakerImage: '/heroes/kitsune_face.jpg', text: '¡Imposible! Has burlado mi ilusión...', position: 'right' },
                    { speakerName: 'Hombre Normal', speakerImage: '/heroes/normal_face.jpg', text: 'La lógica siempre prevalece.', position: 'left' }
                ]
            }
        ],
        winCondition: 'capture_specific',
        targetCaptiveId: 'scroll_target'
    }
];
