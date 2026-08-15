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
    trigger: 'pre_battle' | 'post_battle' | 'on_capture' | 'on_enemy_capture' | 'turn_start';
    targetId?: string;
    dialogues: StoryDialogueLine[];
    shatterBoard?: boolean;
    offerPowerDraft?: boolean;
}

export interface StoryCaptiveConfig {
    id: string;
    type: 'chest' | 'hostage' | 'scroll_relic' | 'spirit';
    name: string;
    x: number;
    y: number;
    nodeIds?: string[]; // Para entidades multi-casilla contiguas (ej: ['6,6', '6,7'])
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
    winCondition: 'eliminate' | 'capture_all' | 'capture_specific' | 'survive' | 'territory';
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
                    { speakerName: 'Espíritu Guardián', speakerImage: '/enemies/spirit_1.png', text: 'Son condensaciones de tu propio Qi. Sella las 4 libertades cardinales a mi alrededor (arriba, abajo, izquierda, derecha). ¡Ciérralas todas y sálvame!', position: 'right' }
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
                shatterBoard: true,
                offerPowerDraft: true,
                dialogues: [
                    { speakerName: 'Sabio de la Niebla', speakerImage: '/heroes/kitsune_face.jpg', text: '¡Imposible! ¡Has sellado el Pergamino Sagrado y purificado la niebla!', position: 'right' },
                    { speakerName: 'Hombre Normal', speakerImage: '/heroes/normal_face.jpg', text: 'El Qi primordial está despertando... ¡La reliquia resuena con una fuerza colosal!', position: 'left' },
                    { speakerName: 'Sabio de la Niebla', speakerImage: '/heroes/kitsune_face.jpg', text: '¡Cuidado! ¡La sobrecarga de Qi va a quebrar el Goban en mil pedazos!', position: 'right' },
                    { speakerName: 'Voz del Vacío', speakerImage: '', text: 'El pergamino se disuelve en tu espíritu. Las piedras se destruyen... ¡Elige el poder que guiará tu destino!', position: 'center' }
                ]
            }
        ],
        winCondition: 'capture_specific',
        targetCaptiveId: 'scroll_target'
    },
    {
        id: 'cap_3_asymmetric_battle',
        title: 'Capítulo 3: La Batalla del Vacío Asimétrico (13x13)',
        description: 'Empuñando tu nuevo poder místico, enfréntate al Maestro del Vacío en un colosal tablero irregular de 13x13 y conquista el territorio.',
        boardShape: 'eroded',
        boardSize: 13,
        heroId: 'normal',
        enemyHeroId: 'ronin',
        komi: 6.5,
        initialStones: [
            { x: 3, y: 3, player: 2 },
            { x: 9, y: 3, player: 2 },
            { x: 3, y: 9, player: 2 }
        ],
        captives: [],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Maestro del Vacío', speakerImage: '/heroes/ronin_face.jpg', text: 'Veo que has absorbido el Qi del Pergamino... Pero este Goban Asimétrico de 13x13 no perdona errores tácticos.', position: 'right' },
                    { speakerName: 'Tú (Campeón)', speakerImage: '/heroes/normal_face.jpg', text: 'Mi poder místico y la pureza del Go decidirán el destino de este reino.', position: 'left' },
                    { speakerName: 'Maestro del Vacío', speakerImage: '/heroes/ronin_face.jpg', text: '¡Demuéstralo! ¡Lucha por el control absoluto del territorio!', position: 'right' }
                ]
            },
            {
                trigger: 'post_battle',
                dialogues: [
                    { speakerName: 'Maestro del Vacío', speakerImage: '/heroes/ronin_face.jpg', text: 'Increíble... Tu lectura táctica y la maestría de tu poder han dominado el Goban.', position: 'right' },
                    { speakerName: 'Tú (Campeón)', speakerImage: '/heroes/normal_face.jpg', text: 'El territorio ha sido pacificado. Pero aún siento perturbaciones más adelante...', position: 'left' }
                ]
            }
        ],
        winCondition: 'territory'
    },
    {
        id: 'cap_4_relic_dispute',
        title: 'Capítulo 4: La Disputa de los Tres Relicarios',
        description: 'Tres reliquias sagradas yacen en el tablero asimétrico, incluyendo el Monolito de 2 casillas contiguas. ¡Rodéalas antes de que la IA de Blancas se apropie de su poder!',
        boardShape: 'cross',
        boardSize: 13,
        heroId: 'normal',
        enemyHeroId: 'kitsune',
        komi: 5.5,
        initialStones: [
            { x: 2, y: 6, player: 2 },
            { x: 10, y: 6, player: 2 }
        ],
        captives: [
            {
                id: 'monolith_qi',
                type: 'chest',
                name: 'Monolito de Qi Ancestral (2x1)',
                x: 6,
                y: 6,
                nodeIds: ['6,6', '6,7'],
                icon: '🀄',
                description: 'Reliquia colosal de 2 casillas. Otorga fichas tácticas a quien rodee su perímetro.',
                rewardType: 'poly',
                rewardValue: 'monolith'
            },
            {
                id: 'thunder_orb',
                type: 'scroll_relic',
                name: 'Orbe de Fuego Astral',
                x: 3,
                y: 9,
                icon: '⚡',
                description: 'Condensación de relámpago que otorga hechizos de Meteorito al ser capturado.',
                rewardType: 'spell',
                rewardValue: 'meteor'
            },
            {
                id: 'sacred_totem',
                type: 'spirit',
                name: 'Tótem Sagrado de Armonía',
                x: 9,
                y: 3,
                icon: '🛡️',
                description: 'Pilar espiritual que bendice con +3.0 puntos de Komi territorial a quien lo selle.',
                rewardType: 'komi',
                rewardValue: 3.0
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Hechicera de las Sombras', speakerImage: '/heroes/kitsune_face.jpg', text: 'Observa este santuario. Hay 3 relicarios místicos en el Goban, ¡incluido el colosal Monolito de Qi de 2 casillas!', position: 'right' },
                    { speakerName: 'Tú (Campeón)', speakerImage: '/heroes/normal_face.jpg', text: 'Debo rodearlos con mis piedras negras para canalizar sus bendiciones.', position: 'left' },
                    { speakerName: 'Hechicera de las Sombras', speakerImage: '/heroes/kitsune_face.jpg', text: '¡Si mis piedras blancas los asedian primero, absorberé sus reliquias y te arrebataré su poder!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'monolith_qi',
                dialogues: [
                    { speakerName: 'Tú (Campeón)', speakerImage: '/heroes/normal_face.jpg', text: '¡He sellado el Monolito de 2 casillas! ¡El Qi de los Titanes potencia mi arsenal!', position: 'left' },
                    { speakerName: 'Hechicera de las Sombras', speakerImage: '/heroes/kitsune_face.jpg', text: '¡Maldición! ¡Llegué demasiado tarde a su perímetro exterior!', position: 'right' }
                ]
            },
            {
                trigger: 'on_enemy_capture',
                targetId: 'monolith_qi',
                dialogues: [
                    { speakerName: 'Hechicera de las Sombras', speakerImage: '/heroes/kitsune_face.jpg', text: '¡Jajaja! ¡Mis piedras blancas han rodeado el Monolito! ¡Su poder ahora me pertenece!', position: 'right' },
                    { speakerName: 'Tú (Campeón)', speakerImage: '/heroes/normal_face.jpg', text: '¡Ha consumido el Monolito! Debo asegurar las reliquias restantes antes de que gane más ventaja.', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'thunder_orb',
                dialogues: [
                    { speakerName: 'Tú (Campeón)', speakerImage: '/heroes/normal_face.jpg', text: '¡Orbe de Fuego asegurado! ¡La energía destructiva responde a mi llamada!', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'sacred_totem',
                dialogues: [
                    { speakerName: 'Tú (Campeón)', speakerImage: '/heroes/normal_face.jpg', text: '¡Tótem purificado! Una barrera sagrada de armonía refuerza nuestro territorio.', position: 'left' }
                ]
            }
        ],
        winCondition: 'territory'
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
                    { speakerName: 'Guardian Spirit', speakerImage: '/enemies/spirit_1.png', text: 'They are condensations of your own Qi. Seal the 4 cardinal liberties around me (top, bottom, left, right). Enclose them all and save me!', position: 'right' }
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
                shatterBoard: true,
                offerPowerDraft: true,
                dialogues: [
                    { speakerName: 'Sage of the Mist', speakerImage: '/heroes/kitsune_face.jpg', text: 'Impossible! You anchored the Sacred Scroll and repelled my mist!', position: 'right' },
                    { speakerName: 'Normal Apprentice', speakerImage: '/heroes/normal_face.jpg', text: 'The primordial Qi is awakening... The relic resonates with colossal force!', position: 'left' },
                    { speakerName: 'Sage of the Mist', speakerImage: '/heroes/kitsune_face.jpg', text: 'Watch out! The Qi overload is about to shatter the Goban into a thousand pieces!', position: 'right' },
                    { speakerName: 'Voice of the Void', speakerImage: '', text: 'The scroll dissolves into your soul. The stones shatter... Choose the Champion power that will guide your destiny!', position: 'center' }
                ]
            }
        ],
        winCondition: 'capture_specific',
        targetCaptiveId: 'scroll_target'
    },
    {
        id: 'cap_3_asymmetric_battle',
        title: 'Chapter 3: The Asymmetric Void Battle (13x13)',
        description: 'Wielding your newly chosen Champion blessing, face the Void Master in a colossal irregular 13x13 board and conquer the territory.',
        boardShape: 'eroded',
        boardSize: 13,
        heroId: 'normal',
        enemyHeroId: 'ronin',
        komi: 6.5,
        initialStones: [
            { x: 3, y: 3, player: 2 },
            { x: 9, y: 3, player: 2 },
            { x: 3, y: 9, player: 2 }
        ],
        captives: [],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Void Master', speakerImage: '/heroes/ronin_face.jpg', text: 'I see you absorbed the Sacred Scroll Qi... But this 13x13 Asymmetric Goban forgives no tactical blunders.', position: 'right' },
                    { speakerName: 'You (Champion)', speakerImage: '/heroes/normal_face.jpg', text: 'My mystic power and canonical Go mastery will decide the fate of this realm.', position: 'left' },
                    { speakerName: 'Void Master', speakerImage: '/heroes/ronin_face.jpg', text: 'Prove it! Fight for total territorial dominion!', position: 'right' }
                ]
            },
            {
                trigger: 'post_battle',
                dialogues: [
                    { speakerName: 'Void Master', speakerImage: '/heroes/ronin_face.jpg', text: 'Remarkable... Your tactical reading and power mastery have conquered the Goban.', position: 'right' },
                    { speakerName: 'You (Champion)', speakerImage: '/heroes/normal_face.jpg', text: 'The territory is safe. Yet I sense deeper cosmic disturbances ahead...', position: 'left' }
                ]
            }
        ],
        winCondition: 'territory'
    },
    {
        id: 'cap_4_relic_dispute',
        title: 'Chapter 4: The Dispute of the Three Relics',
        description: 'Three sacred relics lie upon the asymmetric board, including the 2-cell Monolith. Enclose them before the White AI claims their powers!',
        boardShape: 'cross',
        boardSize: 13,
        heroId: 'normal',
        enemyHeroId: 'kitsune',
        komi: 5.5,
        initialStones: [
            { x: 2, y: 6, player: 2 },
            { x: 10, y: 6, player: 2 }
        ],
        captives: [
            {
                id: 'monolith_qi',
                type: 'chest',
                name: 'Ancestral Qi Monolith (2x1)',
                x: 6,
                y: 6,
                nodeIds: ['6,6', '6,7'],
                icon: '🀄',
                description: 'Colossal 2-cell relic. Grants tactical polyomino tiles to whoever encloses its perimeter.',
                rewardType: 'poly',
                rewardValue: 'monolith'
            },
            {
                id: 'thunder_orb',
                type: 'scroll_relic',
                name: 'Astral Fire Orb',
                x: 3,
                y: 9,
                icon: '⚡',
                description: 'Astral lightning condensation granting Meteor Rain spells upon capture.',
                rewardType: 'spell',
                rewardValue: 'meteor'
            },
            {
                id: 'sacred_totem',
                type: 'spirit',
                name: 'Sacred Harmony Totem',
                x: 9,
                y: 3,
                icon: '🛡️',
                description: 'Spiritual pillar granting +3.0 permanent Komi to whoever encloses it.',
                rewardType: 'komi',
                rewardValue: 3.0
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Shadow Sorceress', speakerImage: '/heroes/kitsune_face.jpg', text: 'Behold this sanctuary. Three mystical relics rest on the Goban, including the colossal 2-cell Monolith!', position: 'right' },
                    { speakerName: 'You (Champion)', speakerImage: '/heroes/normal_face.jpg', text: 'I must seal them with my black stones to channel their blessings.', position: 'left' },
                    { speakerName: 'Shadow Sorceress', speakerImage: '/heroes/kitsune_face.jpg', text: 'If my white stones enclose them first, I shall absorb their relics and seize their power from you!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'monolith_qi',
                dialogues: [
                    { speakerName: 'You (Champion)', speakerImage: '/heroes/normal_face.jpg', text: 'I have sealed the 2-cell Monolith! The Titan Qi supercharges my tactical arsenal!', position: 'left' },
                    { speakerName: 'Shadow Sorceress', speakerImage: '/heroes/kitsune_face.jpg', text: 'Curse you! I arrived too late to its outer perimeter!', position: 'right' }
                ]
            },
            {
                trigger: 'on_enemy_capture',
                targetId: 'monolith_qi',
                dialogues: [
                    { speakerName: 'Shadow Sorceress', speakerImage: '/heroes/kitsune_face.jpg', text: 'Hahaha! My white stones enclosed the Monolith! Its power belongs to the mist now!', position: 'right' },
                    { speakerName: 'You (Champion)', speakerImage: '/heroes/normal_face.jpg', text: 'She consumed the Monolith! I must secure the remaining relics before she gains total dominion.', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'thunder_orb',
                dialogues: [
                    { speakerName: 'You (Champion)', speakerImage: '/heroes/normal_face.jpg', text: 'Fire Orb secured! Astral power answers my command!', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'sacred_totem',
                dialogues: [
                    { speakerName: 'You (Champion)', speakerImage: '/heroes/normal_face.jpg', text: 'Totem purified! A divine barrier reinforces our territory.', position: 'left' }
                ]
            }
        ],
        winCondition: 'territory'
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
