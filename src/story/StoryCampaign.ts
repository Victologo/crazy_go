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
                    { speakerName: 'Espíritu Guardián', speakerImage: './enemies/spirit_1.png', text: 'Viajero... mi esencia se apaga. ¡Ancla mi espíritu antes de que me disperse!', position: 'right' },
                    { speakerName: 'Persona Normal', speakerImage: './heroes/normal_face.jpg', text: '¿Cómo? Solo tengo estas piedras negras de Go...', position: 'left' },
                    { speakerName: 'Espíritu Guardián', speakerImage: './enemies/spirit_1.png', text: 'Son condensaciones de tu propio Qi. Sella las 4 libertades cardinales a mi alrededor (arriba, abajo, izquierda, derecha). ¡Ciérralas todas y sálvame!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'spirit_target',
                dialogues: [
                    { speakerName: 'Espíritu Guardián', speakerImage: './enemies/spirit_1.png', text: '¡El sello está completo! Mi esencia se ha estabilizado.', position: 'right' },
                    { speakerName: 'Persona Normal', speakerImage: './heroes/normal_face.jpg', text: 'Ahora lo entiendo. Rodear no solo captura enemigos, sino que purifica y asegura reliquias espirituales.', position: 'left' },
                    { speakerName: 'Espíritu Guardián', speakerImage: './enemies/spirit_1.png', text: 'Así es. Pero cuidado, la Niebla Blanca intentará consumir las reliquias de los otros mundos. ¡Avancemos al siguiente fragmento!', position: 'right' }
                ]
            }
        ],
        winCondition: 'capture_specific',
        targetCaptiveId: 'spirit_target'
    },
    {
        id: 'cap_2_the_fog',
        title: 'Capítulo 2: La Niebla y la Transmutación Alquímica',
        description: 'El Maestro Alquimista de la Niebla busca corromper el Pergamino Sagrado usando Inversión Cromática. Rodéalo y asegúralo con tu Qi antes de que su alquimia lo consuma.',
        boardShape: 'eroded',
        boardSize: 9,
        heroId: 'normal',
        enemyHeroId: 'alchemist',
        komi: 0,
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
                description: 'Un pergamino sagrado en peligro inminente de corrupción alquímica.',
                rewardType: 'spell',
                rewardValue: 'meteor'
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Maestro Alquimista', speakerImage: './heroes/alchemist_face.jpg', text: '¡Necio! He dominado el arte prohibido de la Inversión Cromática. Con mi alquimia puedo transmutar la polaridad de tus piedras negras para volverlas blancas y consumir el Pergamino Sagrado.', position: 'right' },
                    { speakerName: 'Persona Normal', speakerImage: './heroes/normal_face.jpg', text: '¡Tu alquimia corrompe la armonía natural del Go! Rodearé las 4 libertades cardinales del Pergamino con mi Qi antes de que tu niebla lo asedie.', position: 'left' },
                    { speakerName: 'Maestro Alquimista', speakerImage: './heroes/alchemist_face.jpg', text: '¡Pruébalo si te atreves! ¡Mis transmutaciones cambiarán el color de tus piedras y quebrarán tu avance!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'scroll_target',
                shatterBoard: true,
                offerPowerDraft: true,
                dialogues: [
                    { speakerName: 'Maestro Alquimista', speakerImage: './heroes/alchemist_face.jpg', text: '¡Maldición! ¡El Qi primordial del Pergamino ha sobrecargado mi matriz de transmutación!', position: 'right' },
                    { speakerName: 'Persona Normal', speakerImage: './heroes/normal_face.jpg', text: 'El Pergamino Sagrado resuena con la sabiduría de los Grandes Campeones... ¡La energía purificadora colapsa la niebla!', position: 'left' },
                    { speakerName: 'Maestro Alquimista', speakerImage: './heroes/alchemist_face.jpg', text: '¡La sobrecarga de Qi va a quebrar el Goban en mil pedazos!', position: 'right' },
                    { speakerName: 'Voz del Vacío', speakerImage: '', text: 'El pergamino se funde en tu espíritu. Las piedras corrompidas se desvanecen... ¡Elige el poder místico de Campeón que guiará tu destino!', position: 'center' }
                ]
            },
            {
                trigger: 'on_enemy_capture',
                targetId: 'scroll_target',
                dialogues: [
                    { speakerName: 'Maestro Alquimista', speakerImage: './heroes/alchemist_face.jpg', text: '¡Jajaja! ¡La alquimia triunfa! Mis piedras blancas han rodeado el Pergamino Sagrado y su poder me pertenece.', position: 'right' },
                    { speakerName: 'Persona Normal', speakerImage: './heroes/normal_face.jpg', text: 'La corrupción ha triunfado en este fragmento. Debo reiniciar el capítulo y asegurar el Pergamino primero.', position: 'left' }
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
        komi: 0,
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
                    { speakerName: 'Maestro del Vacío', speakerImage: './heroes/ronin_face.jpg', text: 'Veo que has absorbido el Qi del Pergamino... Pero este Goban Asimétrico de 13x13 no perdona errores tácticos.', position: 'right' },
                    { speakerName: 'Tú (Campeón)', speakerImage: './heroes/normal_face.jpg', text: 'Mi poder místico y la pureza del Go decidirán el destino de este reino.', position: 'left' },
                    { speakerName: 'Maestro del Vacío', speakerImage: './heroes/ronin_face.jpg', text: '¡Demuéstralo! ¡Lucha por el control absoluto del territorio!', position: 'right' }
                ]
            },
            {
                trigger: 'post_battle',
                dialogues: [
                    { speakerName: 'Maestro del Vacío', speakerImage: './heroes/ronin_face.jpg', text: 'Increíble... Tu lectura táctica y la maestría de tu poder han dominado el Goban.', position: 'right' },
                    { speakerName: 'Tú (Campeón)', speakerImage: './heroes/normal_face.jpg', text: 'El territorio ha sido pacificado. Pero aún siento perturbaciones más adelante...', position: 'left' }
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
        komi: 0,
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
                description: 'Pilar espiritual que bendice con +3.0 puntos territoriales a quien lo selle.',
                rewardType: 'komi',
                rewardValue: 3.0
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Hechicera de las Sombras', speakerImage: './heroes/kitsune_face.jpg', text: 'Observa este santuario. Hay 3 relicarios místicos en el Goban, ¡incluido el colosal Monolito de Qi de 2 casillas!', position: 'right' },
                    { speakerName: 'Tú (Campeón)', speakerImage: './heroes/normal_face.jpg', text: 'Debo rodearlos con mis piedras negras para canalizar sus bendiciones.', position: 'left' },
                    { speakerName: 'Hechicera de las Sombras', speakerImage: './heroes/kitsune_face.jpg', text: '¡Si mis piedras blancas los asedian primero, absorberé sus reliquias y te arrebataré su poder!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'monolith_qi',
                dialogues: [
                    { speakerName: 'Tú (Campeón)', speakerImage: './heroes/normal_face.jpg', text: '¡He sellado el Monolito de 2 casillas! ¡El Qi de los Titanes potencia mi arsenal!', position: 'left' },
                    { speakerName: 'Hechicera de las Sombras', speakerImage: './heroes/kitsune_face.jpg', text: '¡Maldición! ¡Llegué demasiado tarde a su perímetro exterior!', position: 'right' }
                ]
            },
            {
                trigger: 'on_enemy_capture',
                targetId: 'monolith_qi',
                dialogues: [
                    { speakerName: 'Hechicera de las Sombras', speakerImage: './heroes/kitsune_face.jpg', text: '¡Jajaja! ¡Mis piedras blancas han rodeado el Monolito! ¡Su poder ahora me pertenece!', position: 'right' },
                    { speakerName: 'Tú (Campeón)', speakerImage: './heroes/normal_face.jpg', text: '¡Ha consumido el Monolito! Debo asegurar las reliquias restantes antes de que gane más ventaja.', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'thunder_orb',
                dialogues: [
                    { speakerName: 'Tú (Campeón)', speakerImage: './heroes/normal_face.jpg', text: '¡Orbe de Fuego asegurado! ¡La energía destructiva responde a mi llamada!', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'sacred_totem',
                dialogues: [
                    { speakerName: 'Tú (Campeón)', speakerImage: './heroes/normal_face.jpg', text: '¡Tótem purificado! Una barrera sagrada de armonía refuerza nuestro territorio.', position: 'left' }
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
                    { speakerName: 'Guardian Spirit', speakerImage: './enemies/spirit_1.png', text: 'Traveler... my essence is fading. Anchor my spirit before I disperse!', position: 'right' },
                    { speakerName: 'Normal Person', speakerImage: './heroes/normal_face.jpg', text: 'How? I only hold these black Go stones...', position: 'left' },
                    { speakerName: 'Guardian Spirit', speakerImage: './enemies/spirit_1.png', text: 'They are condensations of your own Qi. Seal the 4 cardinal liberties around me (top, bottom, left, right). Enclose them all and save me!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'spirit_target',
                dialogues: [
                    { speakerName: 'Guardian Spirit', speakerImage: './enemies/spirit_1.png', text: 'The seal is complete! My essence has stabilized.', position: 'right' },
                    { speakerName: 'Normal Person', speakerImage: './heroes/normal_face.jpg', text: 'I understand now. Surrounding does not just capture foes—it also purifies and anchors spiritual relics.', position: 'left' },
                    { speakerName: 'Guardian Spirit', speakerImage: './enemies/spirit_1.png', text: 'Indeed. But beware, the White Mist seeks to consume all relics across the realms. Let us advance to the next realm fragment!', position: 'right' }
                ]
            }
        ],
        winCondition: 'capture_specific',
        targetCaptiveId: 'spirit_target'
    },
    {
        id: 'cap_2_the_fog',
        title: 'Chapter 2: The Mist and Alchemical Transmutation',
        description: 'The Mist Alchemist Master seeks to corrupt the Sacred Scroll using Chromatic Inversion. Enclose and secure it with your Qi before his alchemy consumes it.',
        boardShape: 'eroded',
        boardSize: 9,
        heroId: 'normal',
        enemyHeroId: 'alchemist',
        komi: 0,
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
                description: 'A holy scroll in imminent danger of alchemical corruption.',
                rewardType: 'spell',
                rewardValue: 'meteor'
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Mist Alchemist', speakerImage: './heroes/alchemist_face.jpg', text: 'Fool! I have mastered the forbidden art of Chromatic Inversion. With my alchemy, I will invert the polarity of your black stones into white mist and consume the Sacred Scroll.', position: 'right' },
                    { speakerName: 'Normal Person', speakerImage: './heroes/normal_face.jpg', text: 'Your dark alchemy defies the sacred harmony of Go! I will surround the 4 cardinal liberties of the Scroll with my Qi before your mist engulfs it.', position: 'left' },
                    { speakerName: 'Mist Alchemist', speakerImage: './heroes/alchemist_face.jpg', text: 'Try it if you dare! My transmutations will flip your stones and shatter your advance!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'scroll_target',
                shatterBoard: true,
                offerPowerDraft: true,
                dialogues: [
                    { speakerName: 'Mist Alchemist', speakerImage: './heroes/alchemist_face.jpg', text: 'Curse you! The Primordial Qi of the Sacred Scroll has overloaded my transmutation matrix!', position: 'right' },
                    { speakerName: 'Normal Person', speakerImage: './heroes/normal_face.jpg', text: 'The Sacred Scroll resonates with the power of the Grand Champions... The purifying surge collapses the mist!', position: 'left' },
                    { speakerName: 'Mist Alchemist', speakerImage: './heroes/alchemist_face.jpg', text: 'The Qi overload is about to shatter the Goban into a thousand pieces!', position: 'right' },
                    { speakerName: 'Voice of the Void', speakerImage: '', text: 'The scroll dissolves into your soul. The corrupted stones vanish... Choose the Champion power that will guide your destiny!', position: 'center' }
                ]
            },
            {
                trigger: 'on_enemy_capture',
                targetId: 'scroll_target',
                dialogues: [
                    { speakerName: 'Mist Alchemist', speakerImage: './heroes/alchemist_face.jpg', text: 'Hahaha! Alchemy prevails! My white stones have enclosed the Sacred Scroll and its power is mine!', position: 'right' },
                    { speakerName: 'Normal Person', speakerImage: './heroes/normal_face.jpg', text: 'The corruption has overtaken this realm fragment. I must retry the chapter and secure the Scroll first.', position: 'left' }
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
        komi: 0,
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
                    { speakerName: 'Void Master', speakerImage: './heroes/ronin_face.jpg', text: 'I see you absorbed the Sacred Scroll Qi... But this 13x13 Asymmetric Goban forgives no tactical blunders.', position: 'right' },
                    { speakerName: 'You (Champion)', speakerImage: './heroes/normal_face.jpg', text: 'My mystic power and canonical Go mastery will decide the fate of this realm.', position: 'left' },
                    { speakerName: 'Void Master', speakerImage: './heroes/ronin_face.jpg', text: 'Prove it! Fight for total territorial dominion!', position: 'right' }
                ]
            },
            {
                trigger: 'post_battle',
                dialogues: [
                    { speakerName: 'Void Master', speakerImage: './heroes/ronin_face.jpg', text: 'Remarkable... Your tactical reading and power mastery have conquered the Goban.', position: 'right' },
                    { speakerName: 'You (Champion)', speakerImage: './heroes/normal_face.jpg', text: 'The territory is safe. Yet I sense deeper cosmic disturbances ahead...', position: 'left' }
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
        komi: 0,
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
                description: 'Spiritual pillar granting +3.0 permanent territory points to whoever encloses it.',
                rewardType: 'komi',
                rewardValue: 3.0
            }
        ],
        events: [
            {
                trigger: 'pre_battle',
                dialogues: [
                    { speakerName: 'Shadow Sorceress', speakerImage: './heroes/kitsune_face.jpg', text: 'Behold this sanctuary. Three mystical relics rest on the Goban, including the colossal 2-cell Monolith!', position: 'right' },
                    { speakerName: 'You (Champion)', speakerImage: './heroes/normal_face.jpg', text: 'I must seal them with my black stones to channel their blessings.', position: 'left' },
                    { speakerName: 'Shadow Sorceress', speakerImage: './heroes/kitsune_face.jpg', text: 'If my white stones enclose them first, I shall absorb their relics and seize their power from you!', position: 'right' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'monolith_qi',
                dialogues: [
                    { speakerName: 'You (Champion)', speakerImage: './heroes/normal_face.jpg', text: 'I have sealed the 2-cell Monolith! The Titan Qi supercharges my tactical arsenal!', position: 'left' },
                    { speakerName: 'Shadow Sorceress', speakerImage: './heroes/kitsune_face.jpg', text: 'Curse you! I arrived too late to its outer perimeter!', position: 'right' }
                ]
            },
            {
                trigger: 'on_enemy_capture',
                targetId: 'monolith_qi',
                dialogues: [
                    { speakerName: 'Shadow Sorceress', speakerImage: './heroes/kitsune_face.jpg', text: 'Hahaha! My white stones enclosed the Monolith! Its power belongs to the mist now!', position: 'right' },
                    { speakerName: 'You (Champion)', speakerImage: './heroes/normal_face.jpg', text: 'She consumed the Monolith! I must secure the remaining relics before she gains total dominion.', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'thunder_orb',
                dialogues: [
                    { speakerName: 'You (Champion)', speakerImage: './heroes/normal_face.jpg', text: 'Fire Orb secured! Astral power answers my command!', position: 'left' }
                ]
            },
            {
                trigger: 'on_capture',
                targetId: 'sacred_totem',
                dialogues: [
                    { speakerName: 'You (Champion)', speakerImage: './heroes/normal_face.jpg', text: 'Totem purified! A divine barrier reinforces our territory.', position: 'left' }
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
