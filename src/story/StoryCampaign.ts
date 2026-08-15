import type { BoardShape, BoardSize, HeroId } from '../types';
import { getLanguage } from '../i18n/i18n';

export type DialogueSpeakerPosition = 'left' | 'right' | 'center';

export interface StoryDialogueLine {
    speakerName: string;
    speakerImage: string;
    text: string;
    position: DialogueSpeakerPosition;
}

export interface StoryEvent {
    trigger: 'pre_battle' | 'post_battle' | 'on_capture' | 'turn_start';
    targetId?: string;
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

export const STORY_CAMPAIGN_ES: StoryChapter[] = [
    {
        id: 'cap_1_awakening',
        title: 'Capítulo 1: El Fragmento del Vacío',
        description: 'La realidad se ha fracturado. Usa tu Qi (piedras negras) para sellar el espíritu guardián antes de que se desvanezca en el vacío.',
        boardShape: 'square',
        boardSize: 5,
        heroId: 'normal',
        enemyHeroId: null,
        komi: 0,
        initialStones: [],
        captives: [
            {
                id: 'spirit_target',
                type: 'spirit',
                name: 'Espíritu Guardián',
                x: 2,
                y: 2,
                icon: '✨',
                description: 'Un espíritu atrapado perdiendo su energía mística.',
                rewardType: 'komi',
                rewardValue: 5
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Voz del Vacío', speakerImage: '', text: 'Tu conciencia despierta en el abismo. El Goban primordial... se ha quebrado.', position: 'center' },
                    { speakerName: 'Espíritu Guardián', speakerImage: '/enemies/spirit_1.png', text: 'Viajero... mi esencia se apaga. ¡Ancla mi espíritu antes de que me disperse!', position: 'right' },
                    { speakerName: 'Hombre Normal', speakerImage: '/heroes/normal_face.jpg', text: '¿Cómo? Solo tengo estas piedras negras de Go...', position: 'left' },
                    { speakerName: 'Espíritu Guardián', speakerImage: '/enemies/spirit_1.png', text: 'Son condensaciones de tu propio Qi. Sella las 4 fisuras cardinales a mi alrededor (arriba, abajo, izquierda, derecha). ¡Ciérralas todas y sálvame!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'spirit_target',
                dialogues: [
                    { speakerName: 'Espíritu Guardián', speakerImage: '/enemies/spirit_1.png', text: '¡El sello está completo! Mi esencia se ha estabilizado.', position: 'right' },
                    { speakerName: 'Hombre Normal', speakerImage: '/heroes/normal_face.jpg', text: 'Ahora lo entiendo. Rodear no solo captura enemigos, sino que purifica y asegura reliquias espirituales.', position: 'left' },
                    { speakerName: 'Espíritu Guardián', speakerImage: '/enemies/spirit_1.png', text: 'Así es. Pero cuidado, la Niebla Blanca intentará consumir las reliquias de los otros mundos. ¡Avancemos al siguiente fragmento!', position: 'right' }
                ]
            }
        ],
        winCondition: 'capture_specific',
        targetCaptiveId: 'spirit_target'
    },
    {
        id: 'cap_2_the_fog',
        title: 'Capítulo 2: La Niebla Invasora',
        description: 'La Niebla Blanca busca corromper el Pergamino Sagrado. Ciérralo y asegúralo antes que ellos.',
        boardShape: 'eroded',
        boardSize: 9,
        heroId: 'normal',
        enemyHeroId: 'kitsune',
        komi: 6.5,
        initialStones: [
            { x: 2, y: 2, player: 2 },
            { x: 6, y: 6, player: 2 }
        ],
        captives: [
            {
                id: 'scroll_target',
                type: 'scroll_relic',
                name: 'Pergamino Sagrado',
                x: 4,
                y: 4,
                icon: '📜',
                description: 'Un pergamino sagrado en peligro inminente de corrupción.',
                rewardType: 'spell',
                rewardValue: 'meteor'
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Sabio de la Niebla', speakerImage: '/heroes/kitsune_face.jpg', text: 'Jejeje... Llegas tarde. Mis piedras blancas ya dominan esta tierra rota.', position: 'right' },
                    { speakerName: 'Hombre Normal', speakerImage: '/heroes/normal_face.jpg', text: 'Ese pergamino... debo rodear sus libertades con mi Qi antes de que la corrupción lo consuma.', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'scroll_target',
                dialogues: [
                    { speakerName: 'Sabio de la Niebla', speakerImage: '/heroes/kitsune_face.jpg', text: '¡Imposible! ¡Has sellado el Pergamino Sagrado y disipado mi niebla!', position: 'right' },
                    { speakerName: 'Hombre Normal', speakerImage: '/heroes/normal_face.jpg', text: 'El territorio está seguro. Y tu niebla... se ha disuelto.', position: 'left' }
                ]
            }
        ],
        winCondition: 'capture_specific',
        targetCaptiveId: 'scroll_target'
    }
];

export const STORY_CAMPAIGN_EN: StoryChapter[] = [
    {
        id: 'cap_1_awakening',
        title: 'Chapter 1: The Void Fragment',
        description: 'Reality has fractured. Use your Qi (black stones) to seal the guardian spirit before it dissolves into the void.',
        boardShape: 'square',
        boardSize: 5,
        heroId: 'normal',
        enemyHeroId: null,
        komi: 0,
        initialStones: [],
        captives: [
            {
                id: 'spirit_target',
                type: 'spirit',
                name: 'Guardian Spirit',
                x: 2,
                y: 2,
                icon: '✨',
                description: 'A trapped spirit losing its spiritual essence.',
                rewardType: 'komi',
                rewardValue: 5
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Voice of the Void', speakerImage: '', text: 'Your consciousness awakens in the abyss. The primordial Goban... has shattered.', position: 'center' },
                    { speakerName: 'Guardian Spirit', speakerImage: '/enemies/spirit_1.png', text: 'Traveler... my essence is fading. Anchor my spirit before I disperse!', position: 'right' },
                    { speakerName: 'Normal Apprentice', speakerImage: '/heroes/normal_face.jpg', text: 'How? I only hold these black Go stones...', position: 'left' },
                    { speakerName: 'Guardian Spirit', speakerImage: '/enemies/spirit_1.png', text: 'They are condensations of your own Qi. Seal the 4 cardinal fissures around me (top, bottom, left, right). Enclose them all and save me!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'spirit_target',
                dialogues: [
                    { speakerName: 'Guardian Spirit', speakerImage: '/enemies/spirit_1.png', text: 'The seal is complete! My essence has stabilized.', position: 'right' },
                    { speakerName: 'Normal Apprentice', speakerImage: '/heroes/normal_face.jpg', text: 'I understand now. Surrounding does not just capture foes—it also purifies and anchors spiritual relics.', position: 'left' },
                    { speakerName: 'Guardian Spirit', speakerImage: '/enemies/spirit_1.png', text: 'Indeed. But beware, the White Mist seeks to consume all relics across the realms. Let us advance to the next realm fragment!', position: 'right' }
                ]
            }
        ],
        winCondition: 'capture_specific',
        targetCaptiveId: 'spirit_target'
    },
    {
        id: 'cap_2_the_fog',
        title: 'Chapter 2: The Invading Mist',
        description: 'The White Mist seeks to corrupt the Sacred Scroll. Seal and secure it before they do.',
        boardShape: 'eroded',
        boardSize: 9,
        heroId: 'normal',
        enemyHeroId: 'kitsune',
        komi: 6.5,
        initialStones: [
            { x: 2, y: 2, player: 2 },
            { x: 6, y: 6, player: 2 }
        ],
        captives: [
            {
                id: 'scroll_target',
                type: 'scroll_relic',
                name: 'Sacred Scroll',
                x: 4,
                y: 4,
                icon: '📜',
                description: 'A holy scroll in imminent danger of corruption.',
                rewardType: 'spell',
                rewardValue: 'meteor'
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Sage of the Mist', speakerImage: '/heroes/kitsune_face.jpg', text: 'Hehehe... You are too late. My white stones already sprawl across this fractured land.', position: 'right' },
                    { speakerName: 'Normal Apprentice', speakerImage: '/heroes/normal_face.jpg', text: 'That sacred scroll... I must seal its surrounding liberties with Qi before corruption engulfs it completely.', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'scroll_target',
                dialogues: [
                    { speakerName: 'Sage of the Mist', speakerImage: '/heroes/kitsune_face.jpg', text: 'Impossible! You anchored the Sacred Scroll and repelled my mist!', position: 'right' },
                    { speakerName: 'Normal Apprentice', speakerImage: '/heroes/normal_face.jpg', text: 'The territory is secure. And your mist... has cleared.', position: 'left' }
                ]
            }
        ],
        winCondition: 'capture_specific',
        targetCaptiveId: 'scroll_target'
    }
];

export function getStoryCampaign(): StoryChapter[] {
    return getLanguage() === 'en' ? STORY_CAMPAIGN_EN : STORY_CAMPAIGN_ES;
}

export const STORY_CAMPAIGN: StoryChapter[] = new Proxy([] as StoryChapter[], {
    get(_target, prop) {
        const campaign = getStoryCampaign();
        const val = (campaign as any)[prop];
        if (typeof val === 'function') {
            return val.bind(campaign);
        }
        return val;
    }
});
