// tutorial/TutorialSteps.ts
import type { BoardSize, HeroId, SpellId, PolyominoType } from '../types';
import { getLanguage } from '../i18n/i18n';

export interface TutorialAction {
    type: 'place_stone' | 'pass' | 'use_spell' | 'use_polyomino' | 'use_skill' | 'dialog_only';
    nodeId?: string; // For place_stone or use_skill
    spellId?: SpellId; // For use_spell
    polyType?: PolyominoType; // For use_polyomino
    rotation?: number; // For use_polyomino (0 or 1)
}

export interface TutorialAIResponse {
    type: 'place_stone' | 'pass';
    nodeId?: string;
}

export interface TutorialAnnotation {
    nodeId: string;
    label: string; // "1", "2", "3", "4", "★", "⚔️", "🚫"
    color?: string; // hex or css color
}

export interface TutorialStep {
    id: string;
    messageTitle: string;
    messageBody: string;
    expectedAction: TutorialAction;
    aiResponse?: TutorialAIResponse;
    annotations?: TutorialAnnotation[];
    onStart?: (board: any, state: any) => void;
    onComplete?: (board: any, state: any) => void;
}

export interface TutorialChapter {
    id: string;
    chapterNumber: number;
    tag: string;
    title: string;
    description: string;
    boardSize: BoardSize;
    heroId: HeroId;
    komi: number;
    initialStones: { id: string, player: number }[];
    steps: TutorialStep[];
}

export const TUTORIAL_CHAPTERS_ES: TutorialChapter[] = [
    {
        id: 'cap_1_libertades',
        chapterNumber: 1,
        tag: 'REGLA FUNDAMENTAL',
        title: 'Libertades y Grupos',
        description: 'Aprende cómo respiran las piedras a través de las intersecciones y forman grupos interconectados.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [],
        steps: [
            {
                id: 'c1_s1',
                messageTitle: '1. Las Intersecciones',
                messageBody: 'En Go, las piedras se juegan exclusivamente en las <strong>intersecciones</strong> de las líneas. Coloca tu piedra en el nodo central marcado.',
                expectedAction: { type: 'place_stone', nodeId: '4,4' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c1_s2',
                messageTitle: '2. Las 4 Libertades Cardinales',
                messageBody: 'Toda piedra respira por sus 4 líneas ortogonales adyacentes vacías llamadas <strong>Libertades</strong> (numeradas del 1 al 4). Las diagonales no cuentan.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,3', label: '1', color: '#38bdf8' },
                    { nodeId: '3,4', label: '2', color: '#38bdf8' },
                    { nodeId: '5,4', label: '3', color: '#38bdf8' },
                    { nodeId: '4,5', label: '4', color: '#38bdf8' }
                ]
            },
            {
                id: 'c1_s3',
                messageTitle: '3. Conectar Piedras',
                messageBody: 'Ahora coloca una segunda piedra en la libertad superior para unirte a tu piedra y crear una cadena.',
                expectedAction: { type: 'place_stone', nodeId: '4,3' },
                annotations: [
                    { nodeId: '4,3', label: '🔗', color: '#38bdf8' }
                ]
            },
            {
                id: 'c1_s4',
                messageTitle: '4. Un Grupo Indivisible',
                messageBody: 'Al estar conectadas ortogonalmente, forman un <strong>Grupo</strong> indivisible que comparte un total de 6 libertades (etiquetadas del 1 al 6).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,2', label: '1', color: '#4ade80' },
                    { nodeId: '3,3', label: '2', color: '#4ade80' },
                    { nodeId: '5,3', label: '3', color: '#4ade80' },
                    { nodeId: '3,4', label: '4', color: '#4ade80' },
                    { nodeId: '5,4', label: '5', color: '#4ade80' },
                    { nodeId: '4,5', label: '6', color: '#4ade80' }
                ]
            },
            {
                id: 'c1_s5',
                messageTitle: '5. Expandir la Cadena',
                messageBody: 'Conecta una tercera piedra a la izquierda para agrandar tu grupo y ganar aún más espacio de respiración.',
                expectedAction: { type: 'place_stone', nodeId: '3,4' },
                annotations: [
                    { nodeId: '3,4', label: '🔗', color: '#4ade80' }
                ]
            },
            {
                id: 'c1_s6',
                messageTitle: '6. ¡Cadena Consolidada!',
                messageBody: '¡Excelente! Creaste una cadena sólida de 3 piedras con <strong>7 libertades compartidas</strong> (1 a 7). Mientras un grupo tenga al menos 1 libertad, todas sus piedras viven.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,2', label: '1', color: '#4ade80' },
                    { nodeId: '3,3', label: '2', color: '#4ade80' },
                    { nodeId: '5,3', label: '3', color: '#4ade80' },
                    { nodeId: '2,4', label: '4', color: '#4ade80' },
                    { nodeId: '5,4', label: '5', color: '#4ade80' },
                    { nodeId: '3,5', label: '6', color: '#4ade80' },
                    { nodeId: '4,5', label: '7', color: '#4ade80' }
                ]
            }
        ]
    },
    {
        id: 'cap_2_capturas',
        chapterNumber: 2,
        tag: 'COMBATE BÁSICO',
        title: 'Capturas y Atari',
        description: 'Cuando a un grupo le queda solo 1 libertad (Atari), la jugada que lo rodea por completo lo retira del tablero.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,4', player: 2 },
            { id: '4,3', player: 1 },
            { id: '3,4', player: 1 },
            { id: '4,5', player: 1 }
        ],
        steps: [
            {
                id: 'c2_s1',
                messageTitle: '1. Estado de Atari',
                messageBody: 'La piedra blanca central solo tiene 1 libertad restante (marcada en rojo): está en peligro inmediato de captura (<strong>Atari</strong>).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '5,4', label: '1', color: '#ef4444' }
                ]
            },
            {
                id: 'c2_s2',
                messageTitle: '2. Capturar la Piedra',
                messageBody: 'Juega en su última libertad libre para reducirla a 0 libertades y ejecutar la captura.',
                expectedAction: { type: 'place_stone', nodeId: '5,4' },
                annotations: [
                    { nodeId: '5,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c2_s3',
                messageTitle: '3. Piedra Capturada',
                messageBody: '¡Bien jugado! Al quitarle su última libertad, la piedra blanca fue capturada como prisionero sumando puntos y liberando la casilla.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#38bdf8' }
                ]
            }
        ]
    },
    {
        id: 'cap_3_ojos',
        chapterNumber: 3,
        tag: 'VIDA Y MUERTE',
        title: 'Grupos Vivos y Dos Ojos',
        description: 'La regla de oro de la inmortalidad: un grupo con dos ojos separados jamás puede ser capturado.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '2,3', player: 1 }, { id: '3,3', player: 1 }, { id: '4,3', player: 1 }, { id: '5,3', player: 1 }, { id: '6,3', player: 1 },
            { id: '2,4', player: 1 }, { id: '6,4', player: 1 },
            { id: '2,5', player: 1 }, { id: '3,5', player: 1 }, { id: '4,5', player: 1 }, { id: '5,5', player: 1 }, { id: '6,5', player: 1 },
            { id: '1,2', player: 2 }, { id: '2,2', player: 2 }, { id: '3,2', player: 2 }, { id: '4,2', player: 2 }, { id: '5,2', player: 2 }, { id: '6,2', player: 2 }, { id: '7,2', player: 2 },
            { id: '1,3', player: 2 }, { id: '7,3', player: 2 },
            { id: '1,4', player: 2 }, { id: '7,4', player: 2 },
            { id: '1,5', player: 2 }, { id: '7,5', player: 2 },
            { id: '1,6', player: 2 }, { id: '2,6', player: 2 }, { id: '3,6', player: 2 }, { id: '4,6', player: 2 }, { id: '5,6', player: 2 }, { id: '6,6', player: 2 }, { id: '7,6', player: 2 }
        ],
        steps: [
            {
                id: 'c3_s1',
                messageTitle: '1. Grupo Sitiado',
                messageBody: 'Mira tu grupo negro: está <strong>completamente rodeado de piedras blancas</strong> en el perímetro y no puede escapar hacia afuera.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '1', color: '#f59e0b' },
                    { nodeId: '4,4', label: '2', color: '#f59e0b' },
                    { nodeId: '5,4', label: '3', color: '#f59e0b' }
                ]
            },
            {
                id: 'c3_s2',
                messageTitle: '2. El Punto Vital (Ojos)',
                messageBody: 'Para sobrevivir totalmente rodeado, debes crear <strong>Dos Ojos Separados</strong> jugando en el punto vital central.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c3_s3',
                messageTitle: '3. Crear Dos Ojos',
                messageBody: 'Juega en el punto vital central para dividir el espacio interior en dos ojos independientes.',
                expectedAction: { type: 'place_stone', nodeId: '4,4' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c3_s4',
                messageTitle: '4. Inmortalidad Matemática',
                messageBody: '¡Observa los dos ojos resultantes (1 y 2)! Para capturar tu grupo, Blancas necesitaría ocupar ambos ojos al mismo tiempo.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '1', color: '#38bdf8' },
                    { nodeId: '5,4', label: '2', color: '#38bdf8' }
                ]
            },
            {
                id: 'c3_s5',
                messageTitle: '5. Suicidio del Rival',
                messageBody: 'Si Blancas juega dentro del Ojo 1, tu grupo sigue respirando por el Ojo 2: la jugada no captura nada y es un <strong>Suicidio Ilegal</strong>. Lo mismo ocurre en el Ojo 2.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '🚫', color: '#ef4444' },
                    { nodeId: '5,4', label: '🚫', color: '#ef4444' }
                ]
            },
            {
                id: 'c3_s6',
                messageTitle: '6. Fortaleza Invulnerable',
                messageBody: 'Dado que el rival no puede suicidarse ni colocar dos piedras a la vez en un solo turno, <strong>¡un grupo con dos ojos nunca puede ser destruido!</strong>',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '1', color: '#10b981' },
                    { nodeId: '5,4', label: '2', color: '#10b981' }
                ]
            }
        ]
    },
    {
        id: 'cap_4_suicidio',
        chapterNumber: 4,
        tag: 'REGLA CANÓNICA',
        title: 'Suicidio Prohibido',
        description: 'No puedes jugar donde no tengas libertades, a menos que esa jugada capture inmediatamente piedras enemigas.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,3', player: 2 }, { id: '3,4', player: 2 }, { id: '5,4', player: 2 }, { id: '4,5', player: 2 },
            { id: '4,2', player: 1 }, { id: '3,3', player: 1 }, { id: '5,3', player: 1 },
            { id: '2,4', player: 1 }, { id: '6,4', player: 1 },
            { id: '3,5', player: 1 }, { id: '5,5', player: 1 }, { id: '4,6', player: 1 }
        ],
        steps: [
            {
                id: 'c4_s1',
                messageTitle: '1. Suicidio Ilegal',
                messageBody: 'En Go está <strong>estrictamente prohibido</strong> jugar dentro de un espacio sin libertades si tu piedra no captura nada.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '🚫', color: '#ef4444' }
                ]
            },
            {
                id: 'c4_s2',
                messageTitle: '2. La Excepción de Captura',
                messageBody: 'Sin embargo, si tu jugada retira la última libertad de piedras enemigas, la captura se resuelve primero, volviendo la jugada 100% legal.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c4_s3',
                messageTitle: '3. Captura Simultánea',
                messageBody: 'Juega en el centro para quitar la última libertad a las 4 piedras blancas que te rodean y capturarlas todas al instante.',
                expectedAction: { type: 'place_stone', nodeId: '4,4' },
                annotations: [
                    { nodeId: '4,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c4_s4',
                messageTitle: '4. Captura Completada',
                messageBody: '¡Magistral! Como tu piedra causó la captura inmediata de las 4 piedras blancas, no fue suicidio sino una captura legal perfecta.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_5_ko',
        chapterNumber: 5,
        tag: 'REGLA CANÓNICA',
        title: 'La Regla del Ko (Eternidad)',
        description: 'Prohíbe la repetición infinita de la misma posición en el tablero.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,3', player: 1 }, { id: '3,4', player: 1 }, { id: '4,5', player: 1 },
            { id: '5,3', player: 2 }, { id: '6,4', player: 2 }, { id: '5,5', player: 2 },
            { id: '4,4', player: 2 }
        ],
        steps: [
            {
                id: 'c5_s1',
                messageTitle: '1. Estructura de Ko',
                messageBody: 'La piedra blanca en (4,4) solo tiene 1 libertad (en 5,4). Puedes capturarla colocando tu piedra negra en (5,4).',
                expectedAction: { type: 'place_stone', nodeId: '5,4' },
                annotations: [
                    { nodeId: '5,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c5_s2',
                messageTitle: '2. Prohibición de Recaptura',
                messageBody: '¡Piedra capturada! Ahora tu piedra en (5,4) solo tiene 1 libertad (4,4), pero <strong>Blancas no puede recapturar de inmediato</strong> en este turno.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '🚫', color: '#ef4444' }
                ]
            },
            {
                id: 'c5_s3',
                messageTitle: '3. Evitar el Bucle Infinito',
                messageBody: 'La <strong>Regla del Ko</strong> evita bucles infinitos. Blancas debe jugar en otra parte (amenaza de Ko) antes de tener derecho a recapturar.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_6_territorio',
        chapterNumber: 6,
        tag: 'PUNTUACIÓN FINAL',
        title: 'Territorio y Reglas Japonesas',
        description: 'Gana quien domine más territorio cercado sumando prisioneros y la compensación de Komi.',
        boardSize: 9,
        heroId: 'normal',
        komi: 6.5,
        initialStones: [
            { id: '0,3', player: 1 }, { id: '1,3', player: 1 }, { id: '2,3', player: 1 },
            { id: '3,0', player: 1 }, { id: '3,1', player: 1 }, { id: '3,2', player: 1 }
        ],
        steps: [
            {
                id: 'c6_s1',
                messageTitle: '1. ¿Qué es el Territorio?',
                messageBody: 'En Go, el <strong>Territorio</strong> son las intersecciones vacías cercadas por tus piedras conectadas hasta los bordes del tablero.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '1,1', label: '?', color: '#f59e0b' },
                    { nodeId: '2,2', label: '?', color: '#f59e0b' }
                ]
            },
            {
                id: 'c6_s2',
                messageTitle: '2. Valor del Territorio',
                messageBody: 'Cada intersección vacía dentro de tus fronteras cerradas vale <strong>1 Punto de Victoria</strong>.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '0,0', label: '1pt', color: '#f59e0b' },
                    { nodeId: '1,0', label: '1pt', color: '#f59e0b' },
                    { nodeId: '0,1', label: '1pt', color: '#f59e0b' },
                    { nodeId: '1,1', label: '1pt', color: '#f59e0b' }
                ]
            },
            {
                id: 'c6_s3',
                messageTitle: '3. Detectar la Fisura',
                messageBody: 'Mira la esquina superior izquierda: tu muralla tiene una <strong>brecha en (2,2)</strong>. Sin cerrar esa esquina, el territorio no te pertenece.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '2,2', label: '⚠️', color: '#ef4444' }
                ]
            },
            {
                id: 'c6_s4',
                messageTitle: '4. Sellar la Frontera',
                messageBody: 'Juega tu piedra en <strong>(2,2)</strong> para unir tu muralla y sellar herméticamente el territorio.',
                expectedAction: { type: 'place_stone', nodeId: '2,2' },
                annotations: [
                    { nodeId: '2,2', label: '★', color: '#10b981' }
                ]
            },
            {
                id: 'c6_s5',
                messageTitle: '5. Territorio Conquistado',
                messageBody: '¡Frontera sellada! Has conquistado <strong>4 intersecciones vacías</strong> (1 a 4). Cada una te otorga +1 punto de territorio.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '0,0', label: '1', color: '#10b981' },
                    { nodeId: '1,0', label: '2', color: '#10b981' },
                    { nodeId: '0,1', label: '3', color: '#10b981' },
                    { nodeId: '1,1', label: '4', color: '#10b981' }
                ]
            },
            {
                id: 'c6_s6',
                messageTitle: '6. Prisioneros y Komi',
                messageBody: 'Cada piedra enemiga capturada otorga <strong>+1 punto adicional</strong>. Además, Blancas recibe <strong>+6.5 puntos de Komi</strong> por jugar en segundo lugar.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c6_s7',
                messageTitle: '7. Fórmula Canónica de Victoria',
                messageBody: 'Al terminar la partida:<br><strong>Puntuación = Territorio Cercado + Prisioneros + Komi</strong>.<br>¡Quien sume más puntos gana!',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_7_campeones',
        chapterNumber: 7,
        tag: 'MECÁNICA CRAZY GO',
        title: 'Campeones y Lluvia Meteórica',
        description: 'Desata las habilidades místicas de los Campeones de Crazy Go sobre el tablero.',
        boardSize: 9,
        heroId: 'tengu',
        komi: 0,
        initialStones: [
            { id: '5,3', player: 2 }, { id: '6,3', player: 2 }, { id: '7,3', player: 2 },
            { id: '5,4', player: 2 }, { id: '6,4', player: 2 }, { id: '7,4', player: 2 },
            { id: '5,5', player: 2 }, { id: '6,5', player: 2 }, { id: '7,5', player: 2 },
            { id: '2,2', player: 1 }, { id: '2,6', player: 1 }
        ],
        steps: [
            {
                id: 'c7_s1',
                messageTitle: '1. El Bastión Rival',
                messageBody: 'El rival ha construido una fortaleza masiva de 9 piedras blancas en la derecha difícil de invadir mediante reglas estándar.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '6,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c7_s2',
                messageTitle: '2. Campeón Tengu',
                messageBody: 'Como <strong>Tengu</strong>, posees la habilidad activa <strong>☄️ Lluvia Meteórica</strong>. Pulsa la tecla [C] o haz clic en el botón de habilidad de tu tarjeta.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c7_s3',
                messageTitle: '3. Invocar Meteoros',
                messageBody: 'Haz clic en el centro de la fortaleza rival (6,4) para desatar la lluvia de meteoros cósmicos y destruir su bastión.',
                expectedAction: { type: 'use_skill', nodeId: '6,4' },
                annotations: [
                    { nodeId: '6,4', label: '☄️', color: '#ef4444' }
                ]
            },
            {
                id: 'c7_s4',
                messageTitle: '4. Impacto Devastador',
                messageBody: '¡Increíble! La lluvia meteórica pulverizó las piedras desprotegidas en el área de impacto, abriendo el tablero para tu victoria.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_8_hechizos_poliminos',
        chapterNumber: 8,
        tag: 'MECÁNICA CRAZY GO',
        title: 'Hechizos y Fichas Poliminó',
        description: 'Domina el arsenal completo: Rebobinar, Meteorito, Piedra Germinante, Ficha Duplicidad y Monolito.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,4', player: 2 },
            { id: '2,6', player: 1 }, { id: '5,6', player: 1 }, { id: '6,6', player: 1 }
        ],
        steps: [
            {
                id: 'c8_s1',
                messageTitle: '1. El Arsenal Místico',
                messageBody: 'En la barra inferior posees <strong>Pergaminos Mágicos</strong> y <strong>Fichas Poliminó</strong> que te permitirán cambiar el curso de la partida.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s2',
                messageTitle: '2. Hechizo Meteorito (☄️)',
                messageBody: 'Selecciona el <strong>Meteorito (tecla 2)</strong> y haz clic en la piedra blanca solitaria en (4,4) para destruirla.',
                expectedAction: { type: 'use_spell', spellId: 'meteor' },
                annotations: [
                    { nodeId: '4,4', label: '☄️', color: '#ef4444' }
                ]
            },
            {
                id: 'c8_s3',
                messageTitle: '3. Poder Instantáneo',
                messageBody: '¡Piedra eliminada! Los hechizos se ejecutan de forma instantánea sin consumir tu turno de colocación estándar.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s4',
                messageTitle: '4. Error Táctico Deliberado',
                messageBody: 'Coloca una piedra normal en la casilla marcada (7,2) para simular una jugada equivocada.',
                expectedAction: { type: 'place_stone', nodeId: '7,2' },
                annotations: [
                    { nodeId: '7,2', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c8_s5',
                messageTitle: '5. Hechizo Rebobinar (⏳)',
                messageBody: '¡Te has equivocado de posición! Usa el pergamino <strong>Rebobinar (tecla 1 o U)</strong> para retroceder el tiempo.',
                expectedAction: { type: 'use_spell', spellId: 'rewind' }
            },
            {
                id: 'c8_s6',
                messageTitle: '6. Fichas Poliminó',
                messageBody: 'Las fichas poliminó son piezas especiales con formas geométricas únicas: Germinante (1x1), Duplicidad (2x1) y Monolito (2x2).',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s7',
                messageTitle: '7. Piedra Germinante (🌿)',
                messageBody: 'Selecciona la <strong>Piedra Germinante (tecla 5 o Z)</strong> y plántala en (2,2). Cada 2 turnos brotará 1 piedra aliada extra.',
                expectedAction: { type: 'use_polyomino', polyType: 'sprouting', nodeId: '2,2' },
                annotations: [
                    { nodeId: '2,2', label: '🌿', color: '#10b981' }
                ]
            },
            {
                id: 'c8_s8',
                messageTitle: '8. Ficha Duplicidad 2x1 (🀄)',
                messageBody: 'Selecciona la <strong>Ficha Duplicidad (tecla 6 o X)</strong>, pulsa [R] para orientación horizontal [⇄] y colócala en (3,6) para conectar tu grupo.',
                expectedAction: { type: 'use_polyomino', polyType: 'domino', nodeId: '3,6', rotation: 0 },
                annotations: [
                    { nodeId: '3,6', label: '🀄', color: '#38bdf8' },
                    { nodeId: '4,6', label: '🀄', color: '#38bdf8' }
                ]
            },
            {
                id: 'c8_s9',
                messageTitle: '9. Ficha Monolito 2x2 (🧱)',
                messageBody: 'Selecciona el <strong>Monolito 2x2 (tecla 7 o V)</strong> y colócalo en (6,1) para plantar un titánico bloque de 4 piedras a la vez.',
                expectedAction: { type: 'use_polyomino', polyType: 'monolith', nodeId: '6,1' },
                annotations: [
                    { nodeId: '6,1', label: '🧱', color: '#f59e0b' }
                ]
            },
            {
                id: 'c8_s10',
                messageTitle: '10. ¡Arsenal Dominado!',
                messageBody: '¡Extraordinario! Has dominado el Meteorito, el Rebobinado temporal y las tres fichas poliminó tácticas.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_9_entidades',
        chapterNumber: 9,
        tag: 'MODO ROGUELIKE',
        title: 'Entidades y Cautivos del Goban',
        description: 'Rescata rehenes, abre cofres místicos y reclama pergaminos sagrados cercando sus libertades.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,3', player: 1 },
            { id: '3,4', player: 1 },
            { id: '4,5', player: 1 }
        ],
        steps: [
            {
                id: 'c9_s1',
                messageTitle: '1. Entidades Neutrales',
                messageBody: 'En la senda roguelike encontrarás <strong>Monjes Cautivos (🧙), Cofres (🎁) y Pergaminos (📜)</strong> sobre el Goban.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '🎁', color: '#f59e0b' },
                    { nodeId: '5,4', label: '1', color: '#38bdf8' }
                ]
            },
            {
                id: 'c9_s2',
                messageTitle: '2. Captura Perimetral',
                messageBody: 'Para reclamar un objeto, debes <strong>rodear todas sus libertades cardinales</strong> con tus piedras, igual que una captura.',
                expectedAction: { type: 'place_stone', nodeId: '5,4' },
                annotations: [
                    { nodeId: '5,4', label: '★', color: '#38bdf8' }
                ]
            },
            {
                id: 'c9_s3',
                messageTitle: '3. Recompensa Reclamada',
                messageBody: '¡Has asegurado el perímetro del cofre! Al retirar su última libertad, la reliquia se desbloquea otorgándote recompensas inmediatas.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    }
];

export const TUTORIAL_CHAPTERS_EN: TutorialChapter[] = [
    {
        id: 'cap_1_libertades',
        chapterNumber: 1,
        tag: 'FUNDAMENTAL RULE',
        title: 'Liberties & Groups',
        description: 'Learn how stones breathe through intersections and form interconnected groups with shared liberties.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [],
        steps: [
            {
                id: 'c1_s1',
                messageTitle: '1. The Intersections',
                messageBody: 'In Go, stones are played exclusively on line <strong>intersections</strong>. Place your stone on the highlighted center node.',
                expectedAction: { type: 'place_stone', nodeId: '4,4' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c1_s2',
                messageTitle: '2. The 4 Cardinal Liberties',
                messageBody: 'Every stone breathes along its 4 orthogonal empty lines, called <strong>Liberties</strong> (numbered 1, 2, 3, 4). Diagonal lines do not count.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,3', label: '1', color: '#38bdf8' },
                    { nodeId: '3,4', label: '2', color: '#38bdf8' },
                    { nodeId: '5,4', label: '3', color: '#38bdf8' },
                    { nodeId: '4,5', label: '4', color: '#38bdf8' }
                ]
            },
            {
                id: 'c1_s3',
                messageTitle: '3. Connecting Stones',
                messageBody: 'Now place a second stone on the top liberty to join with your stone and build a connected chain.',
                expectedAction: { type: 'place_stone', nodeId: '4,3' },
                annotations: [
                    { nodeId: '4,3', label: '🔗', color: '#38bdf8' }
                ]
            },
            {
                id: 'c1_s4',
                messageTitle: '4. An Indivisible Group',
                messageBody: 'By connecting orthogonally, they form an indivisible <strong>Group</strong> that shares 6 total liberties (labeled 1 through 6).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,2', label: '1', color: '#4ade80' },
                    { nodeId: '3,3', label: '2', color: '#4ade80' },
                    { nodeId: '5,3', label: '3', color: '#4ade80' },
                    { nodeId: '3,4', label: '4', color: '#4ade80' },
                    { nodeId: '5,4', label: '5', color: '#4ade80' },
                    { nodeId: '4,5', label: '6', color: '#4ade80' }
                ]
            },
            {
                id: 'c1_s5',
                messageTitle: '5. Expanding the Chain',
                messageBody: 'Connect a third stone to the left to expand your group and gain even more breathing room.',
                expectedAction: { type: 'place_stone', nodeId: '3,4' },
                annotations: [
                    { nodeId: '3,4', label: '🔗', color: '#4ade80' }
                ]
            },
            {
                id: 'c1_s6',
                messageTitle: '6. Chain Consolidated!',
                messageBody: 'Excellent! You created a solid 3-stone chain with <strong>7 shared liberties</strong> (1 to 7). As long as a group has at least 1 liberty, all its stones stay alive.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,2', label: '1', color: '#4ade80' },
                    { nodeId: '3,3', label: '2', color: '#4ade80' },
                    { nodeId: '5,3', label: '3', color: '#4ade80' },
                    { nodeId: '2,4', label: '4', color: '#4ade80' },
                    { nodeId: '5,4', label: '5', color: '#4ade80' },
                    { nodeId: '3,5', label: '6', color: '#4ade80' },
                    { nodeId: '4,5', label: '7', color: '#4ade80' }
                ]
            }
        ]
    },
    {
        id: 'cap_2_capturas',
        chapterNumber: 2,
        tag: 'BASIC COMBAT',
        title: 'Captures & Atari',
        description: 'When a group is down to only 1 liberty (Atari), the final surrounding move removes it from the board.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,4', player: 2 },
            { id: '4,3', player: 1 },
            { id: '3,4', player: 1 },
            { id: '4,5', player: 1 }
        ],
        steps: [
            {
                id: 'c2_s1',
                messageTitle: '1. Atari State',
                messageBody: 'The central white stone only has 1 liberty left (marked in red): it is in immediate danger of capture (<strong>Atari</strong>).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '5,4', label: '1', color: '#ef4444' }
                ]
            },
            {
                id: 'c2_s2',
                messageTitle: '2. Capturing the Stone',
                messageBody: 'Play on its last open liberty to reduce it to 0 liberties and claim the capture.',
                expectedAction: { type: 'place_stone', nodeId: '5,4' },
                annotations: [
                    { nodeId: '5,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c2_s3',
                messageTitle: '3. Stone Captured',
                messageBody: 'Well played! By stripping the white stone of its final liberty, it was captured as a prisoner, awarding points and clearing the intersection.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#38bdf8' }
                ]
            }
        ]
    },
    {
        id: 'cap_3_ojos',
        chapterNumber: 3,
        tag: 'LIFE & DEATH',
        title: 'Living Groups & Two Eyes',
        description: 'The golden rule of immortality: a group with two separate eyes can never be captured.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '2,3', player: 1 }, { id: '3,3', player: 1 }, { id: '4,3', player: 1 }, { id: '5,3', player: 1 }, { id: '6,3', player: 1 },
            { id: '2,4', player: 1 }, { id: '6,4', player: 1 },
            { id: '2,5', player: 1 }, { id: '3,5', player: 1 }, { id: '4,5', player: 1 }, { id: '5,5', player: 1 }, { id: '6,5', player: 1 },
            { id: '1,2', player: 2 }, { id: '2,2', player: 2 }, { id: '3,2', player: 2 }, { id: '4,2', player: 2 }, { id: '5,2', player: 2 }, { id: '6,2', player: 2 }, { id: '7,2', player: 2 },
            { id: '1,3', player: 2 }, { id: '7,3', player: 2 },
            { id: '1,4', player: 2 }, { id: '7,4', player: 2 },
            { id: '1,5', player: 2 }, { id: '7,5', player: 2 },
            { id: '1,6', player: 2 }, { id: '2,6', player: 2 }, { id: '3,6', player: 2 }, { id: '4,6', player: 2 }, { id: '5,6', player: 2 }, { id: '6,6', player: 2 }, { id: '7,6', player: 2 }
        ],
        steps: [
            {
                id: 'c3_s1',
                messageTitle: '1. Besieged Group',
                messageBody: 'Look at your black group: it is <strong>completely surrounded by white stones</strong> on the perimeter and cannot escape outward.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '1', color: '#f59e0b' },
                    { nodeId: '4,4', label: '2', color: '#f59e0b' },
                    { nodeId: '5,4', label: '3', color: '#f59e0b' }
                ]
            },
            {
                id: 'c3_s2',
                messageTitle: '2. The Vital Point (Eyes)',
                messageBody: 'To survive completely surrounded, you must create <strong>Two Separate Eyes</strong> by playing at the central vital point.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c3_s3',
                messageTitle: '3. Create Two Eyes',
                messageBody: 'Play on the central vital point to split the interior space into two independent eyes.',
                expectedAction: { type: 'place_stone', nodeId: '4,4' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c3_s4',
                messageTitle: '4. Mathematical Immortality',
                messageBody: 'Look at the two resulting eyes (1 and 2)! To capture your group, White would need to occupy both eyes simultaneously.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '1', color: '#38bdf8' },
                    { nodeId: '5,4', label: '2', color: '#38bdf8' }
                ]
            },
            {
                id: 'c3_s5',
                messageTitle: '5. Opponent Suicide',
                messageBody: 'If White plays inside Eye 1, your group still breathes through Eye 2: the move captures nothing and is an <strong>Illegal Suicide</strong>. The same applies to Eye 2.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '🚫', color: '#ef4444' },
                    { nodeId: '5,4', label: '🚫', color: '#ef4444' }
                ]
            },
            {
                id: 'c3_s6',
                messageTitle: '6. Invulnerable Fortress',
                messageBody: 'Since the opponent cannot commit suicide nor place two stones in a single turn, <strong>a group with two eyes can never be destroyed!</strong>',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '1', color: '#10b981' },
                    { nodeId: '5,4', label: '2', color: '#10b981' }
                ]
            }
        ]
    },
    {
        id: 'cap_4_suicidio',
        chapterNumber: 4,
        tag: 'CANONICAL RULE',
        title: 'Prohibited Suicide',
        description: 'You cannot play where you have no liberties, unless that move immediately captures enemy stones.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,3', player: 2 }, { id: '3,4', player: 2 }, { id: '5,4', player: 2 }, { id: '4,5', player: 2 },
            { id: '4,2', player: 1 }, { id: '3,3', player: 1 }, { id: '5,3', player: 1 },
            { id: '2,4', player: 1 }, { id: '6,4', player: 1 },
            { id: '3,5', player: 1 }, { id: '5,5', player: 1 }, { id: '4,6', player: 1 }
        ],
        steps: [
            {
                id: 'c4_s1',
                messageTitle: '1. Illegal Suicide',
                messageBody: 'In Go, it is <strong>strictly forbidden</strong> to play inside a liberty-less space if your stone captures nothing.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '🚫', color: '#ef4444' }
                ]
            },
            {
                id: 'c4_s2',
                messageTitle: '2. The Capture Exception',
                messageBody: 'However, if your move removes the final liberty of enemy stones, the capture resolves first, making the move 100% legal.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c4_s3',
                messageTitle: '3. Simultaneous Capture',
                messageBody: 'Play in the center to strip the 4 surrounding white stones of their final liberty and capture them all instantly.',
                expectedAction: { type: 'place_stone', nodeId: '4,4' },
                annotations: [
                    { nodeId: '4,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c4_s4',
                messageTitle: '4. Capture Completed',
                messageBody: 'Masterful! Since your move immediately captured the 4 white stones, it was not suicide but a completely legal capture.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_5_ko',
        chapterNumber: 5,
        tag: 'CANONICAL RULE',
        title: 'The Rule of Ko (Eternity)',
        description: 'Prohibits the infinite repetition of the exact same board position.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,3', player: 1 }, { id: '3,4', player: 1 }, { id: '4,5', player: 1 },
            { id: '5,3', player: 2 }, { id: '6,4', player: 2 }, { id: '5,5', player: 2 },
            { id: '4,4', player: 2 }
        ],
        steps: [
            {
                id: 'c5_s1',
                messageTitle: '1. Ko Structure',
                messageBody: 'The white stone at (4,4) only has 1 liberty left (at 5,4). You can capture it by playing at (5,4).',
                expectedAction: { type: 'place_stone', nodeId: '5,4' },
                annotations: [
                    { nodeId: '5,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c5_s2',
                messageTitle: '2. Immediate Recapture Forbidden',
                messageBody: 'Stone captured! Your stone at (5,4) only has 1 liberty (4,4), but <strong>White cannot immediately recapture it</strong> on this turn.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '🚫', color: '#ef4444' }
                ]
            },
            {
                id: 'c5_s3',
                messageTitle: '3. Preventing Infinite Loops',
                messageBody: 'The <strong>Rule of Ko</strong> prevents infinite game loops. White must play elsewhere first (a Ko threat) before having the right to recapture.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_6_territorio',
        chapterNumber: 6,
        tag: 'FINAL SCORING',
        title: 'Territory & Japanese Rules',
        description: 'The player with the most surrounded territory plus prisoners and Komi wins.',
        boardSize: 9,
        heroId: 'normal',
        komi: 6.5,
        initialStones: [
            { id: '0,3', player: 1 }, { id: '1,3', player: 1 }, { id: '2,3', player: 1 },
            { id: '3,0', player: 1 }, { id: '3,1', player: 1 }, { id: '3,2', player: 1 }
        ],
        steps: [
            {
                id: 'c6_s1',
                messageTitle: '1. What is Territory?',
                messageBody: 'In Go, <strong>Territory</strong> consists of the empty intersections completely enclosed by your connected stones against the board edges.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '1,1', label: '?', color: '#f59e0b' },
                    { nodeId: '2,2', label: '?', color: '#f59e0b' }
                ]
            },
            {
                id: 'c6_s2',
                messageTitle: '2. Value of Territory',
                messageBody: 'Each empty intersection safely inside your borders awards <strong>1 Victory Point</strong>.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '0,0', label: '1pt', color: '#f59e0b' },
                    { nodeId: '1,0', label: '1pt', color: '#f59e0b' },
                    { nodeId: '0,1', label: '1pt', color: '#f59e0b' },
                    { nodeId: '1,1', label: '1pt', color: '#f59e0b' }
                ]
            },
            {
                id: 'c6_s3',
                messageTitle: '3. Spotting the Breach',
                messageBody: 'Look at the top-left corner: your wall has a <strong>gap at (2,2)</strong>. Without sealing it, the corner does not count as your territory.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '2,2', label: '⚠️', color: '#ef4444' }
                ]
            },
            {
                id: 'c6_s4',
                messageTitle: '4. Sealing the Border',
                messageBody: 'Place your stone at <strong>(2,2)</strong> to complete the enclosure and safely secure the territory.',
                expectedAction: { type: 'place_stone', nodeId: '2,2' },
                annotations: [
                    { nodeId: '2,2', label: '★', color: '#10b981' }
                ]
            },
            {
                id: 'c6_s5',
                messageTitle: '5. Secured Territory',
                messageBody: 'Enclosure complete! You have secured <strong>4 empty intersections</strong> (1 to 4). Each grants +1 territory point.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '0,0', label: '1', color: '#10b981' },
                    { nodeId: '1,0', label: '2', color: '#10b981' },
                    { nodeId: '0,1', label: '3', color: '#10b981' },
                    { nodeId: '1,1', label: '4', color: '#10b981' }
                ]
            },
            {
                id: 'c6_s6',
                messageTitle: '6. Prisoners & Komi',
                messageBody: 'Each captured opponent stone grants <strong>+1 extra point</strong>. In addition, White receives <strong>+6.5 Komi points</strong> for moving second.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c6_s7',
                messageTitle: '7. Canonical Victory Formula',
                messageBody: 'At match conclusion:<br><strong>Final Score = Enclosed Territory + Prisoners + Komi</strong>.<br>The player with the highest total wins!',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_7_campeones',
        chapterNumber: 7,
        tag: 'CRAZY GO MECHANIC',
        title: 'Champions & Meteor Strike',
        description: 'Unleash the supernatural skills of Crazy Go champions on the board.',
        boardSize: 9,
        heroId: 'tengu',
        komi: 0,
        initialStones: [
            { id: '5,3', player: 2 }, { id: '6,3', player: 2 }, { id: '7,3', player: 2 },
            { id: '5,4', player: 2 }, { id: '6,4', player: 2 }, { id: '7,4', player: 2 },
            { id: '5,5', player: 2 }, { id: '6,5', player: 2 }, { id: '7,5', player: 2 },
            { id: '2,2', player: 1 }, { id: '2,6', player: 1 }
        ],
        steps: [
            {
                id: 'c7_s1',
                messageTitle: '1. The Rival Bastion',
                messageBody: 'Your opponent built a massive fortress of 9 white stones on the right side, nearly impossible to breach with basic moves.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '6,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c7_s2',
                messageTitle: '2. Tengu Champion',
                messageBody: 'As <strong>Tengu</strong>, you wield the active skill <strong>☄️ Meteor Strike</strong>. Press the [C] key or click the skill button on your portrait.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c7_s3',
                messageTitle: '3. Summon Meteors',
                messageBody: 'Click on the center of the enemy fortress (6,4) to unleash orbital meteorites and destroy their stronghold.',
                expectedAction: { type: 'use_skill', nodeId: '6,4' },
                annotations: [
                    { nodeId: '6,4', label: '☄️', color: '#ef4444' }
                ]
            },
            {
                id: 'c7_s4',
                messageTitle: '4. Devastating Impact',
                messageBody: 'Incredible! The meteor strike pulverized the unprotected stones in the impact zone, opening the field for your victory.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_8_hechizos_poliminos',
        chapterNumber: 8,
        tag: 'CRAZY GO MECHANIC',
        title: 'Spells & Polyomino Stones',
        description: 'Master the full mystical arsenal: Time Rewind, Meteor, Sprouting Stone, Duplicity Stone, and Monolith.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,4', player: 2 },
            { id: '2,6', player: 1 }, { id: '5,6', player: 1 }, { id: '6,6', player: 1 }
        ],
        steps: [
            {
                id: 'c8_s1',
                messageTitle: '1. The Mystic Arsenal',
                messageBody: 'In the bottom dock you have <strong>Magic Scrolls</strong> and <strong>Polyomino Stones</strong> to turn the tide of the match.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s2',
                messageTitle: '2. Meteor Strike (☄️)',
                messageBody: 'Select the <strong>Meteor Strike (Key 2)</strong> and click on the solitary white stone at (4,4) to destroy it.',
                expectedAction: { type: 'use_spell', spellId: 'meteor' },
                annotations: [
                    { nodeId: '4,4', label: '☄️', color: '#ef4444' }
                ]
            },
            {
                id: 'c8_s3',
                messageTitle: '3. Instant Casting',
                messageBody: 'Stone destroyed! Spells execute instantly without consuming your standard stone placement turn.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s4',
                messageTitle: '4. Deliberate Mistake',
                messageBody: 'Place a normal stone on the marked node (7,2) to simulate an unintended tactical error.',
                expectedAction: { type: 'place_stone', nodeId: '7,2' },
                annotations: [
                    { nodeId: '7,2', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c8_s5',
                messageTitle: '5. Time Rewind (⏳)',
                messageBody: 'You placed the stone in the wrong spot! Use the <strong>Time Rewind (Key 1 or U)</strong> scroll to reverse time.',
                expectedAction: { type: 'use_spell', spellId: 'rewind' }
            },
            {
                id: 'c8_s6',
                messageTitle: '6. Polyomino Stones',
                messageBody: 'Polyominoes are multi-stone geometrical shapes: Sprouting (1x1), Duplicity (2x1), and Monolith (2x2).',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s7',
                messageTitle: '7. Sprouting Stone (🌿)',
                messageBody: 'Select the <strong>Sprouting Stone (Key 5 or Z)</strong> and plant it at (2,2). Every 2 turns it will sprout an additional allied stone.',
                expectedAction: { type: 'use_polyomino', polyType: 'sprouting', nodeId: '2,2' },
                annotations: [
                    { nodeId: '2,2', label: '🌿', color: '#10b981' }
                ]
            },
            {
                id: 'c8_s8',
                messageTitle: '8. Duplicity Stone 2x1 (🀄)',
                messageBody: 'Select the <strong>Duplicity Stone (Key 6 or X)</strong>, press [R] for horizontal orientation [⇄], and place it at (3,6) to bridge your group.',
                expectedAction: { type: 'use_polyomino', polyType: 'domino', nodeId: '3,6', rotation: 0 },
                annotations: [
                    { nodeId: '3,6', label: '🀄', color: '#38bdf8' },
                    { nodeId: '4,6', label: '🀄', color: '#38bdf8' }
                ]
            },
            {
                id: 'c8_s9',
                messageTitle: '9. Monolith Stone 2x2 (🧱)',
                messageBody: 'Select the <strong>Monolith 2x2 (Key 7 or V)</strong> and place it at (6,1) to deploy a titanic 4-stone block all at once.',
                expectedAction: { type: 'use_polyomino', polyType: 'monolith', nodeId: '6,1' },
                annotations: [
                    { nodeId: '6,1', label: '🧱', color: '#f59e0b' }
                ]
            },
            {
                id: 'c8_s10',
                messageTitle: '10. Arsenal Mastered!',
                messageBody: 'Outstanding! You have mastered Meteor Strike, Time Rewind, and all three tactical polyomino stones.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_9_entidades',
        chapterNumber: 9,
        tag: 'ROGUELIKE MODE',
        title: 'Goban Entities & Captives',
        description: 'Rescue hostages, unlock shrine chests, and recover sacred scrolls by surrounding their liberties.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,3', player: 1 },
            { id: '3,4', player: 1 },
            { id: '4,5', player: 1 }
        ],
        steps: [
            {
                id: 'c9_s1',
                messageTitle: '1. Neutral Entities',
                messageBody: 'Along the roguelike journey you will discover <strong>Captive Monks (🧙), Chests (🎁), and Scrolls (📜)</strong> on the Goban.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '🎁', color: '#f59e0b' },
                    { nodeId: '5,4', label: '1', color: '#38bdf8' }
                ]
            },
            {
                id: 'c9_s2',
                messageTitle: '2. Perimeter Capture',
                messageBody: 'To claim an entity, you must <strong>surround all its cardinal liberties</strong> with your stones, just like a capture.',
                expectedAction: { type: 'place_stone', nodeId: '5,4' },
                annotations: [
                    { nodeId: '5,4', label: '★', color: '#38bdf8' }
                ]
            },
            {
                id: 'c9_s3',
                messageTitle: '3. Reward Claimed',
                messageBody: 'You secured the perimeter of the chest! By removing its final liberty, the relic is unlocked, awarding immediate bounties.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    }
];

export function getTutorialChapters(): TutorialChapter[] {
    return getLanguage() === 'en' ? TUTORIAL_CHAPTERS_EN : TUTORIAL_CHAPTERS_ES;
}

export const TUTORIAL_CHAPTERS: TutorialChapter[] = new Proxy([] as TutorialChapter[], {
    get(_target, prop) {
        const chapters = getTutorialChapters();
        const val = (chapters as any)[prop];
        if (typeof val === 'function') {
            return val.bind(chapters);
        }
        return val;
    }
});
