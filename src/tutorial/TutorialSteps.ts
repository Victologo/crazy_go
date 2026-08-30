// tutorial/TutorialSteps.ts
import type { BoardSize, HeroId, SpellId, PolyominoType } from '../types';
import { getLanguage } from '../i18n/i18n';
import { PolyominoManager } from '../core/PolyominoManager';

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
    category: 'classic' | 'special' | 'tsumego';
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
        category: 'classic',
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
        category: 'classic',
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
        category: 'classic',
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
        id: 'cap_ojos_falsos',
        chapterNumber: 4,
        category: 'classic',
        tag: 'VIDA Y MUERTE',
        title: 'Ojos Falsos y Muerte',
        description: 'Creer que tienes 2 ojos cuando uno es falso es la trampa más letal del Go. Si un ojo colapsa, todo tu grupo muere.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '2,3', player: 1 }, { id: '3,3', player: 1 }, { id: '4,3', player: 1 }, { id: '5,3', player: 1 },
            { id: '2,4', player: 1 }, { id: '4,4', player: 1 }, { id: '6,4', player: 1 },
            { id: '2,5', player: 1 }, { id: '3,5', player: 1 }, { id: '4,5', player: 1 }, { id: '5,5', player: 1 },
            { id: '1,3', player: 2 }, { id: '1,4', player: 2 }, { id: '1,5', player: 2 },
            { id: '2,2', player: 2 }, { id: '3,2', player: 2 }, { id: '4,2', player: 2 }, { id: '5,2', player: 2 }, { id: '6,2', player: 2 },
            { id: '2,6', player: 2 }, { id: '3,6', player: 2 }, { id: '4,6', player: 2 }, { id: '5,6', player: 2 }, { id: '6,6', player: 2 },
            { id: '6,3', player: 2 }, { id: '7,4', player: 2 }, { id: '6,5', player: 2 }
        ],
        steps: [
            {
                id: 'cof_s1',
                messageTitle: '1. La Falsa Inmortalidad (2 Ojos)',
                messageBody: 'Recuerda: necesitas <strong>2 ojos reales</strong> para que un grupo viva eternamente. Tu grupo parece seguro porque tiene 2 huecos: el <strong>Ojo 1</strong> en (3,4) y el <strong>Ojo 2</strong> en (5,4).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '1', color: '#10b981' },
                    { nodeId: '5,4', label: '2', color: '#f59e0b' }
                ]
            },
            {
                id: 'cof_s2',
                messageTitle: '2. La Esquina Vulnerable',
                messageBody: 'El Ojo 1 está protegido en todas sus diagonales. Pero mira la piedra negra en (6,4): Blancas ha rodeado todas sus libertades exteriores en (6,3), (7,4) y (6,5). ¡Está en <strong>Atari</strong> con solo 1 libertad en (5,4)!',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '6,4', label: '⚠️', color: '#ef4444' },
                    { nodeId: '5,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'cof_s3',
                messageTitle: '3. Defender la Piedra',
                messageBody: 'Si Blancas juega en (5,4), capturará tu piedra (6,4) y entrará a tu grupo. Debes jugar tú mismo en (5,4) para conectarla y evitar que muera. ¡Juega en (5,4)!',
                expectedAction: { type: 'place_stone', nodeId: '5,4' },
                annotations: [
                    { nodeId: '5,4', label: '🔗', color: '#38bdf8' }
                ]
            },
            {
                id: 'cof_s4',
                messageTitle: '4. Muerte por Ojo Falso',
                messageBody: '¡Tragedia! Al tener que rellenar el hueco, <strong>tu segundo ojo ha desaparecido</strong>. Ahora a tu grupo <strong>solo le queda 1 ojo</strong> en (3,4). Como un grupo con un solo ojo no puede sobrevivir, ¡el enemigo capturará todo tu grupo entero!',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '💀', color: '#ef4444' }
                ]
            }
        ]
    },
    
    {
        id: 'cap_4_suicidio',
        chapterNumber: 5,
        category: 'classic',
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
        chapterNumber: 6,
        category: 'classic',
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
        id: 'cap_snapback',
        chapterNumber: 7,
        category: 'classic',
        tag: 'TÁCTICA BÁSICA',
        title: 'Captura en Snapback (Uttegaeshi)',
        description: 'Sacrifica una piedra deliberadamente en las fauces del enemigo para recapturar un grupo más grande inmediatamente.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '3,2', player: 2 }, { id: '4,2', player: 2 }, { id: '5,2', player: 2 },
            { id: '3,3', player: 2 }, { id: '3,4', player: 2 }, { id: '4,4', player: 2 },
            { id: '3,1', player: 1 }, { id: '4,1', player: 1 }, { id: '5,1', player: 1 },
            { id: '2,2', player: 1 }, { id: '6,2', player: 1 },
            { id: '2,3', player: 1 }, { id: '6,3', player: 1 },
            { id: '2,4', player: 1 }, { id: '5,4', player: 1 },
            { id: '3,5', player: 1 }, { id: '4,5', player: 1 }
        ],
        steps: [
            {
                id: 'csb_s1',
                messageTitle: '1. La Trampa de la Herradura',
                messageBody: 'El grupo blanco de 6 piedras está casi completamente rodeado. Solo le quedan dos libertades: (4,3) y (5,3).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,3', label: '★', color: '#f59e0b' },
                    { nodeId: '5,3', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'csb_s2',
                messageTitle: '2. El Sacrificio',
                messageBody: 'Juega en (4,3). Tu piedra entra como cebo con 1 sola libertad en (5,3), pero deja al grupo blanco entero también con 1 sola libertad.',
                expectedAction: { type: 'place_stone', nodeId: '4,3' },
                annotations: [
                    { nodeId: '4,3', label: '★', color: '#38bdf8' }
                ]
            },
            {
                id: 'csb_s3',
                messageTitle: '3. El Cebo Mordido',
                messageBody: '¡El blanco ha mordido el anzuelo capturando tu piedra en (5,3)! Pero fíjate: al hacerlo, sus 7 piedras han quedado con UNA SOLA libertad de nuevo en (4,3).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,3', label: '1', color: '#ef4444' }
                ],
                onStart: (board: any, state: any) => {
                    import('../core/RulesEngine').then(m => {
                        m.RulesEngine.tryPlaceStone(board, state, '5,3', 2);
                        import('../controllers/GameController').then(gc => {
                            gc.GameController.renderer?.render();
                            gc.GameController.updateInGameUI();
                        });
                    });
                }
            },
            {
                id: 'csb_s4',
                messageTitle: '4. El Snapback (Uttegaeshi)',
                messageBody: '¡Recaptura inmediatamente jugando en (4,3)! Al capturar 7 piedras de golpe, la regla del Ko no lo impide.',
                expectedAction: { type: 'place_stone', nodeId: '4,3' },
                annotations: [
                    { nodeId: '4,3', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'csb_s5',
                messageTitle: '5. ¡Golpe Maestro!',
                messageBody: '¡Increíble! Has sacrificado 1 piedra para aniquilar 7 piedras enemigas. Esta técnica táctica milenaria se llama <strong>Snapback (Uttegaeshi)</strong>.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_seki',
        chapterNumber: 8,
        category: 'classic',
        tag: 'VIDA Y MUERTE',
        title: 'Seki (Vida Mutua)',
        description: 'Cuando dos grupos enemigos comparten libertades y ninguno puede atacar sin suicidarse, ambos conviven en paz (Seki).',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '2,2', player: 2 }, { id: '3,2', player: 2 }, { id: '4,2', player: 2 }, { id: '5,2', player: 2 },
            { id: '2,3', player: 2 }, { id: '5,3', player: 2 },
            { id: '2,4', player: 2 }, { id: '3,4', player: 1 }, { id: '4,4', player: 1 }, { id: '5,4', player: 2 },
            { id: '2,5', player: 2 }, { id: '3,5', player: 1 }, { id: '4,5', player: 1 }, { id: '5,5', player: 2 },
            { id: '2,6', player: 2 }, { id: '3,6', player: 2 }, { id: '4,6', player: 2 }, { id: '5,6', player: 2 }
        ],
        steps: [
            {
                id: 'csk_s1',
                messageTitle: '1. Ojos Insuficientes',
                messageBody: 'Mira tu bloque de 4 piedras negras. Están totalmente rodeadas por el blanco y solo comparten 2 libertades vacías en (3,3) y (4,3). Ninguno tiene ojos reales.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,3', label: '?', color: '#f59e0b' },
                    { nodeId: '4,3', label: '?', color: '#f59e0b' }
                ]
            },
            {
                id: 'csk_s2',
                messageTitle: '2. Suicidio Táctico',
                messageBody: 'Si intentas jugar en una de las libertades compartidas para atacar, te pondrás a ti mismo en Atari y el blanco te capturará.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,3', label: '🚫', color: '#ef4444' }
                ]
            },
            {
                id: 'csk_s3',
                messageTitle: '3. Parálisis Mutua',
                messageBody: 'Igualmente, si el blanco juega ahí, él se pondrá en Atari y tú lo capturarás a él. Ninguno de los dos jugadores tiene incentivo para jugar.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'csk_s4',
                messageTitle: '4. Pasar el Turno (Paz)',
                messageBody: 'A este estado se le llama <strong>Seki (Vida Mutua)</strong>. Los grupos sobreviven pacíficamente. Pasa tu turno usando el botón inferior o la tecla [P].',
                expectedAction: { type: 'pass' }
            },
            {
                id: 'csk_s5',
                messageTitle: '5. Fin de Partida en Seki',
                messageBody: 'Al terminar la partida, las piedras en Seki se consideran "vivas", pero sus libertades compartidas no suman puntos de territorio para nadie.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_6_territorio',
        chapterNumber: 9,
        category: 'classic',
        tag: 'PUNTUACIÓN FINAL',
        title: 'Territorio y Reglas Japonesas',
        description: 'Gana quien domine más territorio cercado sumando prisioneros y la compensación de Komi.',
        boardSize: 9,
        heroId: 'normal',
        komi: 6.5,
        initialStones: [
            { id: '1,4', player: 1 }, { id: '2,4', player: 1 }, { id: '4,4', player: 1 }, { id: '5,4', player: 1 },
            { id: '5,1', player: 1 }, { id: '5,2', player: 1 }, { id: '5,3', player: 1 },
            { id: '2,2', player: 2 },
            { id: '6,6', player: 2 }, { id: '6,7', player: 2 }, { id: '6,8', player: 2 }, { id: '6,9', player: 2 },
            { id: '7,6', player: 2 }, { id: '8,6', player: 2 }, { id: '9,6', player: 2 }
        ],
        steps: [
            {
                id: 'c6_s1',
                messageTitle: '1. El Objetivo Sagrado del Go',
                messageBody: 'En Go, ganar no consiste en capturar todas las fichas, sino en **cercar la mayor cantidad de tierra vacía (Territorio)**. Mira el tablero: ambos bandos están trazando sus fronteras.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,2', label: '⚫', color: '#10b981' },
                    { nodeId: '8,8', label: '⚪', color: '#38bdf8' }
                ]
            },
            {
                id: 'c6_s2',
                messageTitle: '2. Sellar la Muralla',
                messageBody: 'Mira tu muralla negra en la esquina superior izquierda: hay una **brecha abierta en (3,4)**. Si no la cierras, el territorio no está cercado y no sumará ningún punto. ¡Juega en (3,4) para sellar tu frontera!',
                expectedAction: { type: 'place_stone', nodeId: '3,4' },
                annotations: [
                    { nodeId: '3,4', label: '★', color: '#10b981' }
                ]
            },
            {
                id: 'c6_s3',
                messageTitle: '3. +11 Puntos de Territorio',
                messageBody: '¡Muralla sellada! Has cercado herméticamente las intersecciones vacías de tu esquina. Bajo las <strong>Reglas Japonesas</strong>, cada casilla vacía dentro de tu muralla vale exactamente <strong>1 Punto de Victoria</strong> (+11 puntos).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '1,1', label: '+1', color: '#10b981' }, { nodeId: '2,1', label: '+1', color: '#10b981' }, { nodeId: '3,1', label: '+1', color: '#10b981' }, { nodeId: '4,1', label: '+1', color: '#10b981' },
                    { nodeId: '1,2', label: '+1', color: '#10b981' }, { nodeId: '3,2', label: '+1', color: '#10b981' }, { nodeId: '4,2', label: '+1', color: '#10b981' },
                    { nodeId: '1,3', label: '+1', color: '#10b981' }, { nodeId: '2,3', label: '+1', color: '#10b981' }, { nodeId: '3,3', label: '+1', color: '#10b981' }, { nodeId: '4,3', label: '+1', color: '#10b981' }
                ]
            },
            {
                id: 'c6_s4',
                messageTitle: '4. Piedras Muertas (+1 Prisionero)',
                messageBody: 'Mira la piedra blanca solitaria atrapada en (2,2) dentro de tu muralla. No puede crear 2 ojos ni escapar: es una <strong>Piedra Muerta</strong>. Al final de la partida se retira sin necesidad de gastar jugadas y suma <strong>+1 Prisionero</strong> a tu favor.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '2,2', label: '💀 +1', color: '#ef4444' }
                ]
            },
            {
                id: 'c6_s5',
                messageTitle: '5. El Komi (+6.5 Puntos para Blancas)',
                messageBody: 'Como Negras juega primero y tiene la ventaja de la iniciativa, Blancas recibe una compensación fija al final: <strong>+6.5 Puntos de Komi</strong>. El 0.5 decimal evita empates para siempre.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c6_s6',
                messageTitle: '6. Puntuación Final Japonesa',
                messageBody: 'Hagamos el recuento final:<br>⚫ <strong>Negras</strong>: 11 Territorio + 1 Prisionero (piedra muerta) = <strong>12 Puntos</strong>.<br>⚪ <strong>Blancas</strong>: 9 Territorio + 0 Prisioneros + 6.5 Komi = <strong>15.5 Puntos</strong>.<br>¡Blancas gana por 3.5 puntos! Así se calcula cada partida milenaria de Go.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },

    {
        id: 'cap_topologia',
        chapterNumber: 10,
        category: 'special',
        tag: 'MECÁNICA CRAZY GO',
        title: 'Topologías y el Vacío',
        description: 'Descubre cómo los tableros asimétricos o destruidos cambian las reglas de supervivencia. El vacío no da libertades.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '2,2', player: 2 }, { id: '3,2', player: 2 }, { id: '4,2', player: 2 }
        ],
        steps: [
            {
                id: 'ctp_s1',
                messageTitle: '1. El Abismo',
                messageBody: 'En Crazy Go, los meteoritos y ciertos tableros pueden tener casillas <strong>destruidas</strong> (sin suelo). Estas casillas desaparecen del mapa.',
                expectedAction: { type: 'dialog_only' },
                onStart: (board: any, state: any) => {
                    import('../core/RulesEngine').then(m => {
                        m.RulesEngine.destroyTopology(board, state, ['3,1', '2,1', '4,1']);
                    });
                }
            },
            {
                id: 'ctp_s2',
                messageTitle: '2. El Vacío no respira',
                messageBody: 'Las piedras blancas están al borde del vacío. Los huecos destruidos <strong>no cuentan como libertades</strong>. Empújalas hacia el abismo jugando en (3,3).',
                expectedAction: { type: 'place_stone', nodeId: '3,3' },
                annotations: [
                    { nodeId: '3,3', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'ctp_s3',
                messageTitle: '3. Asfixia Acelerada',
                messageBody: 'Como ves, es mucho más fácil capturar a un enemigo acorralado contra zonas destruidas. ¡Aprovecha la topología a tu favor!',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    
    {
        id: 'cap_7_campeones',
        chapterNumber: 11,
        category: 'special',
        tag: 'CRAZY GO MECHANIC',
        title: 'Champion Abilities',
        description: 'Master the astonishing powers of the different game champions: active (Tengu, Alchemist, Kitsune) and passive (Himiko, Ronin, Ryūjin).',
        boardSize: 9,
        heroId: 'tengu',
        komi: 0,
        initialStones: [
            { id: '4,2', player: 2 }, { id: '5,2', player: 2 }, { id: '6,2', player: 2 }, { id: '7,2', player: 2 }, { id: '8,2', player: 2 },
            { id: '4,3', player: 2 }, { id: '5,3', player: 2 }, { id: '6,3', player: 2 }, { id: '7,3', player: 2 }, { id: '8,3', player: 2 },
            { id: '4,4', player: 2 }, { id: '5,4', player: 2 }, { id: '6,4', player: 2 }, { id: '7,4', player: 2 }, { id: '8,4', player: 2 },
            { id: '4,5', player: 2 }, { id: '5,5', player: 2 }, { id: '6,5', player: 2 }, { id: '7,5', player: 2 }, { id: '8,5', player: 2 },
            { id: '4,6', player: 2 }, { id: '5,6', player: 2 }, { id: '6,6', player: 2 }, { id: '7,6', player: 2 }, { id: '8,6', player: 2 },
            { id: '2,2', player: 1 }, { id: '2,6', player: 1 }
        ],
        steps: [
            {
                id: 'ch_s1',
                messageTitle: '1. The Enemy Bastion',
                messageBody: 'The enemy has built a massive fortress of 25 white stones. Traditional Go would take dozens of turns to breach it, but in Crazy Go, <strong>Champions</strong> possess devastating abilities.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '6,4', label: '⚔️', color: '#ef4444' }
                ],
                onStart: (_board: any, state: any) => {
                    state.player1.heroId = 'tengu';
                    if (typeof window !== 'undefined' && (window as any).uiManager) {
                        (window as any).uiManager.hudController?.updateHeroInfo(state.player1);
                    }
                }
            },
            {
                id: 'ch_s2',
                messageTitle: '2. Tengu: Meteor Shower',
                messageBody: 'As <strong>Tengu</strong>, you master the active skill <strong>☄️ Meteor Shower</strong>. It covers 25% of the board and drops destructive meteors. Press [C] or the skill button and select the center of the enemy fortress at <strong>(6,4)</strong> to shatter it.',
                expectedAction: { type: 'use_skill', nodeId: '6,4' },
                annotations: [
                    { nodeId: '6,4', label: '☄️', color: '#ef4444' }
                ]
            },
            {
                id: 'ch_s3',
                messageTitle: '3. Fortress Pulverized',
                messageBody: 'Devastating impact! The meteor shower pulverized multiple stones in the blast zone. Be careful as it can also cause friendly fire.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'ch_s4',
                messageTitle: '4. Alchemist: Chromatic Inversion',
                messageBody: 'You are now the <strong>Alchemist</strong>. Look at this white column cutting your groups. Since it is surrounded by your stones, you can transmute it. Press [C] and invert the central enemy stone at <strong>(5,5)</strong>.',
                expectedAction: { type: 'use_skill', nodeId: '5,5' },
                annotations: [
                    { nodeId: '5,5', label: '✨', color: '#a855f7' }
                ],
                onStart: (board: any, state: any) => {
                    state.player1.heroId = 'alchemist';
                    if (typeof window !== 'undefined' && (window as any).uiManager) {
                        (window as any).uiManager.hudController?.updateHeroInfo(state.player1);
                    }
                    import('../core/RulesEngine').then(m => {
                        board.nodes.forEach((n: any) => { n.stone = null; });
                        const setupStones = [
                            { id: '5,4', player: 2 }, { id: '5,5', player: 2 }, { id: '5,6', player: 2 },
                            { id: '4,4', player: 1 }, { id: '4,5', player: 1 }, { id: '4,6', player: 1 },
                            { id: '6,4', player: 1 }, { id: '6,6', player: 1 },
                            { id: '5,3', player: 1 }, { id: '5,7', player: 1 }
                        ];
                        for(const st of setupStones) {
                            m.RulesEngine.tryPlaceStone(board, state, st.id, st.player as any);
                        }
                        if (typeof window !== 'undefined' && (window as any).uiManager) {
                            (window as any).uiManager.renderBoard();
                        }
                    });
                }
            },
            {
                id: 'ch_s5',
                messageTitle: '5. Implosion and Total Capture!',
                messageBody: 'Pure magic! By transmuting the central stone to your color, the two neighboring white stones were left with 0 liberties and captured instantly.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'ch_s6',
                messageTitle: '6. Kitsune: Divine Shield',
                messageBody: 'The beautiful <strong>Kitsune</strong> does not destroy, she protects. Her active skill <strong>Divine Shield</strong> coats an allied group in energy, making it immune to meteors and blocking capture on the first strike.',
                expectedAction: { type: 'dialog_only' },
                onStart: (_board: any, state: any) => {
                    state.player1.heroId = 'kitsune';
                    if (typeof window !== 'undefined' && (window as any).uiManager) {
                        (window as any).uiManager.hudController?.updateHeroInfo(state.player1);
                    }
                }
            },
            {
                id: 'ch_s7',
                messageTitle: '7. Himiko: Celestial Stone Rain',
                messageBody: 'The Shaman Queen <strong>Himiko</strong> has a miraculous passive. After 20 turns, she unleashes a celestial rain where stones of your color randomly drop onto the map, filling empty spaces.',
                expectedAction: { type: 'dialog_only' },
                onStart: (_board: any, state: any) => {
                    state.player1.heroId = 'himiko';
                    if (typeof window !== 'undefined' && (window as any).uiManager) {
                        (window as any).uiManager.hudController?.updateHeroInfo(state.player1);
                    }
                }
            },
            {
                id: 'ch_s8',
                messageTitle: '8. Ronin and Ryūjin',
                messageBody: 'The <strong>Ronin</strong> has "Samurai\'s Edge": every 17 turns he passively slashes and removes 1 enemy stone.<br><br>Meanwhile, the relentless dragon god <strong>Ryūjin</strong> triggers "Dragon\'s Fury" by capturing 3+ enemy stones at once, granting you targeted burns against single stones.',
                expectedAction: { type: 'dialog_only' },
                onStart: (_board: any, state: any) => {
                    state.player1.heroId = 'ronin';
                    if (typeof window !== 'undefined' && (window as any).uiManager) {
                        (window as any).uiManager.hudController?.updateHeroInfo(state.player1);
                    }
                }
            }
        ]
    },
    {
        id: 'cap_8_hechizos_poliminos',
        chapterNumber: 12,
        category: 'special',
        tag: 'MECÁNICA CRAZY GO',
        title: 'Hechizos y Fichas Poliminó',
        description: 'Domina el arsenal completo: Meteorito (80% enemigo / 20% fuego amigo), Rebobinar, Piedra Germinante, Duplicidad y Monolito.',
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
                messageBody: 'En la barra inferior dispones de <strong>Pergaminos Mágicos</strong> y <strong>Fichas Poliminó</strong> que te permitirán cambiar el rumbo de la partida.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s2',
                messageTitle: '2. Ejemplo 1: Meteorito (Acierto Seguro)',
                messageBody: 'El pergamino <strong>Meteorito (tecla 2)</strong> destruye 1 piedra vulnerable en el Goban. Al no haber piedras aliadas en riesgo inmediato, úsalo ahora para pulverizar la piedra blanca en (4,4).',
                expectedAction: { type: 'use_spell', spellId: 'meteor' },
                onStart: () => {
                    if (typeof window !== 'undefined') {
                        (window as any).__tutorialForceMeteorEnemy = true;
                        (window as any).__tutorialForceMeteorAlly = false;
                    }
                },
                annotations: [
                    { nodeId: '4,4', label: '☄️', color: '#ef4444' }
                ]
            },
            {
                id: 'c8_s3',
                messageTitle: '3. Acierto Directo y Probabilidades',
                messageBody: '¡Piedra enemiga destruida! El pergamino de Meteorito tiene un <strong>80% de probabilidad de impactar al enemigo y un 20% de probabilidad de fuego amigo (impactar a una ficha aliada)</strong>.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s4',
                messageTitle: '4. Ejemplo 2: Riesgo del 20% (Fuego Amigo)',
                messageBody: 'Ahora hay piedras aliadas y enemigas en juego. Usa tu segundo <strong>Meteorito (tecla 2)</strong> para comprobar qué sucede cuando ocurre el 20% de desvío estocástico.',
                expectedAction: { type: 'use_spell', spellId: 'meteor' },
                onStart: () => {
                    if (typeof window !== 'undefined') {
                        (window as any).__tutorialForceMeteorAlly = true;
                        (window as any).__tutorialForceMeteorEnemy = false;
                    }
                }
            },
            {
                id: 'c8_s5',
                messageTitle: '5. ¡Fuego Amigo y Rebobinado Temporal!',
                messageBody: '¡El meteorito impactó en tu propia piedra aliada! Este riesgo del 20% exige prudencia al invocarlo. ¡Afortunadamente dispones del pergamino <strong>⏳ Rebobinar (tecla 1 o U)</strong>! Úsalo para revertir el tiempo y recuperar tu piedra.',
                expectedAction: { type: 'use_spell', spellId: 'rewind' },
                onComplete: () => {
                    if (typeof window !== 'undefined') {
                        (window as any).__tutorialForceMeteorAlly = false;
                        (window as any).__tutorialForceMeteorEnemy = false;
                    }
                }
            },
            {
                id: 'c8_s6',
                messageTitle: '6. Fichas Poliminó',
                messageBody: '¡Tiempo restaurado y piedra recuperada! Ahora continuemos con las <strong>Fichas Poliminó</strong>: piezas con formas geométricas especiales: Germinante (1x1), Duplicidad (2x1) y Monolito (2x2).',
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
                onStart: () => {
                    PolyominoManager.orientation = 'vertical';
                    const dominoCard = PolyominoManager.polyominoCards.get('domino');
                    if (dominoCard) dominoCard.orientation = 'vertical';
                },
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
                messageBody: '¡Extraordinario! Has dominado el Meteorito (con su 80% de acierto y 20% de fuego amigo), el Rebobinado temporal y las tres fichas poliminó tácticas.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_9_entidades',
        chapterNumber: 13,
        category: 'special',
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
    },
    {
        id: 'cap_tsumego_1',
        chapterNumber: 14,
        category: 'tsumego',
        tag: 'TSUMEGO (VIDA Y MUERTE)',
        title: 'Tsumego 1: Las Negras Viven',
        description: 'Encuentra el punto vital para salvar a tu grupo negro creando dos ojos reales.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '2,1', player: 2 }, { id: '3,1', player: 2 }, { id: '4,1', player: 2 },
            { id: '2,2', player: 1 }, { id: '3,2', player: 1 }, { id: '5,2', player: 2 },
            { id: '2,3', player: 1 }, { id: '4,3', player: 1 }, { id: '5,3', player: 2 },
            { id: '2,4', player: 2 }, { id: '3,4', player: 2 }, { id: '4,4', player: 2 }
        ],
        steps: [
            {
                id: 'cts_1_s1',
                messageTitle: '1. El Desafío (Tsumego)',
                messageBody: 'En los "Tsumegos" (Puzzles de Go), debes encontrar la jugada exacta (Tesuji) para vivir o matar. Tu grupo negro está asediado.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'cts_1_s2',
                messageTitle: '2. Encuentra el Tesuji',
                messageBody: 'Juega en la intersección vital que garantiza la formación de dos ojos reales para salvar a tu grupo.',
                expectedAction: { type: 'place_stone', nodeId: '3,3' }
            },
            {
                id: 'cts_1_s3',
                messageTitle: '3. ¡Grupo Salvado!',
                messageBody: '¡Excelente! Al jugar en (3,3), has creado dos ojos reales independientes. Tu grupo es ahora matemáticamente inmortal.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    }
];

export const TUTORIAL_CHAPTERS_EN: TutorialChapter[] = [
    {
        id: 'cap_1_libertades',
        chapterNumber: 1,
        category: 'classic',
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
        category: 'classic',
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
        category: 'classic',
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
        id: 'cap_ojos_falsos',
        chapterNumber: 4,
        category: 'classic',
        tag: 'LIFE & DEATH',
        title: 'False Eyes & Death',
        description: 'Believing you have 2 eyes when one is false is the deadliest trap in Go. If one eye collapses, your entire group dies.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '2,3', player: 1 }, { id: '3,3', player: 1 }, { id: '4,3', player: 1 }, { id: '5,3', player: 1 },
            { id: '2,4', player: 1 }, { id: '4,4', player: 1 }, { id: '6,4', player: 1 },
            { id: '2,5', player: 1 }, { id: '3,5', player: 1 }, { id: '4,5', player: 1 }, { id: '5,5', player: 1 },
            { id: '1,3', player: 2 }, { id: '1,4', player: 2 }, { id: '1,5', player: 2 },
            { id: '2,2', player: 2 }, { id: '3,2', player: 2 }, { id: '4,2', player: 2 }, { id: '5,2', player: 2 }, { id: '6,2', player: 2 },
            { id: '2,6', player: 2 }, { id: '3,6', player: 2 }, { id: '4,6', player: 2 }, { id: '5,6', player: 2 }, { id: '6,6', player: 2 },
            { id: '6,3', player: 2 }, { id: '7,4', player: 2 }, { id: '6,5', player: 2 }
        ],
        steps: [
            {
                id: 'cof_s1',
                messageTitle: '1. The False Immortality (2 Eyes)',
                messageBody: 'Remember: you need <strong>2 real eyes</strong> for a group to live forever. Your group seems safe with 2 holes: <strong>Eye 1</strong> at (3,4) and <strong>Eye 2</strong> at (5,4).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '1', color: '#10b981' },
                    { nodeId: '5,4', label: '2', color: '#f59e0b' }
                ]
            },
            {
                id: 'cof_s2',
                messageTitle: '2. The Vulnerable Corner',
                messageBody: 'Eye 1 is protected on all its corners. But look at the black stone at (6,4): White has surrounded all its outside liberties at (6,3), (7,4), and (6,5). It is in <strong>Atari</strong> with only 1 liberty inside at (5,4)!',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '6,4', label: '⚠️', color: '#ef4444' },
                    { nodeId: '5,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'cof_s3',
                messageTitle: '3. Defend the Stone',
                messageBody: 'If White plays at (5,4), they will capture your stone at (6,4) and break inside. You must play at (5,4) yourself to connect it and prevent capture. Play at (5,4)!',
                expectedAction: { type: 'place_stone', nodeId: '5,4' },
                annotations: [
                    { nodeId: '5,4', label: '🔗', color: '#38bdf8' }
                ]
            },
            {
                id: 'cof_s4',
                messageTitle: '4. Death by False Eye',
                messageBody: 'Tragedy! By being forced to fill the hole, <strong>your second eye has vanished</strong>. Now your group <strong>only has 1 eye left</strong> at (3,4). Since a group with only 1 eye cannot survive, the enemy will capture your entire group!',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '💀', color: '#ef4444' }
                ]
            }
        ]
    },
    
    {
        id: 'cap_4_suicidio',
        chapterNumber: 5,
        category: 'classic',
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
        chapterNumber: 6,
        category: 'classic',
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
        id: 'cap_snapback',
        chapterNumber: 7,
        category: 'classic',
        tag: 'BASIC TACTICS',
        title: 'Snapback Capture',
        description: 'Deliberately sacrifice a stone into the jaws of the enemy to recapture a larger group immediately.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '3,2', player: 2 }, { id: '4,2', player: 2 }, { id: '5,2', player: 2 },
            { id: '3,3', player: 2 }, { id: '3,4', player: 2 }, { id: '4,4', player: 2 },
            { id: '3,1', player: 1 }, { id: '4,1', player: 1 }, { id: '5,1', player: 1 },
            { id: '2,2', player: 1 }, { id: '6,2', player: 1 },
            { id: '2,3', player: 1 }, { id: '6,3', player: 1 },
            { id: '2,4', player: 1 }, { id: '5,4', player: 1 },
            { id: '3,5', player: 1 }, { id: '4,5', player: 1 }
        ],
        steps: [
            {
                id: 'csb_s1',
                messageTitle: '1. The Horseshoe Trap',
                messageBody: 'The 6-stone white group is nearly surrounded. It only has two liberties left: (4,3) and (5,3).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,3', label: '★', color: '#f59e0b' },
                    { nodeId: '5,3', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'csb_s2',
                messageTitle: '2. The Sacrifice',
                messageBody: 'Play at (4,3). Your stone enters as bait with 1 liberty at (5,3), while reducing the entire white group to just 1 liberty as well.',
                expectedAction: { type: 'place_stone', nodeId: '4,3' },
                annotations: [
                    { nodeId: '4,3', label: '★', color: '#38bdf8' }
                ]
            },
            {
                id: 'csb_s3',
                messageTitle: '3. Taking the Bait',
                messageBody: 'White took the bait and captured your stone by playing at (5,3)! But look closely: by doing so, all 7 white stones now have only ONE liberty remaining at (4,3).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,3', label: '1', color: '#ef4444' }
                ],
                onStart: (board: any, state: any) => {
                    import('../core/RulesEngine').then(m => {
                        m.RulesEngine.tryPlaceStone(board, state, '5,3', 2);
                        import('../controllers/GameController').then(gc => {
                            gc.GameController.renderer?.render();
                            gc.GameController.updateInGameUI();
                        });
                    });
                }
            },
            {
                id: 'csb_s4',
                messageTitle: '4. The Snapback',
                messageBody: 'Recapture immediately by playing at (4,3)! Since you are capturing 7 stones in return, the Ko Rule does not apply.',
                expectedAction: { type: 'place_stone', nodeId: '4,3' },
                annotations: [
                    { nodeId: '4,3', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'csb_s5',
                messageTitle: '5. Trap Closed',
                messageBody: 'Masterful! You sacrificed 1 stone to eliminate 7 enemy stones. This legendary tactic is called <strong>Snapback (Uttegaeshi)</strong>.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_seki',
        chapterNumber: 8,
        category: 'classic',
        tag: 'LIFE & DEATH',
        title: 'Seki (Mutual Life)',
        description: 'When two enemy groups share liberties and neither can attack without committing suicide, they live in peace (Seki).',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '2,2', player: 2 }, { id: '3,2', player: 2 }, { id: '4,2', player: 2 }, { id: '5,2', player: 2 },
            { id: '2,3', player: 2 }, { id: '5,3', player: 2 },
            { id: '2,4', player: 2 }, { id: '3,4', player: 1 }, { id: '4,4', player: 1 }, { id: '5,4', player: 2 },
            { id: '2,5', player: 2 }, { id: '3,5', player: 1 }, { id: '4,5', player: 1 }, { id: '5,5', player: 2 },
            { id: '2,6', player: 2 }, { id: '3,6', player: 2 }, { id: '4,6', player: 2 }, { id: '5,6', player: 2 }
        ],
        steps: [
            {
                id: 'csk_s1',
                messageTitle: '1. Insufficient Eyes',
                messageBody: 'Look at your 4 black stones. They are fully surrounded by white and only share 2 empty liberties at (3,3) and (4,3). Neither group has real eyes.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,3', label: '?', color: '#f59e0b' },
                    { nodeId: '4,3', label: '?', color: '#f59e0b' }
                ]
            },
            {
                id: 'csk_s2',
                messageTitle: '2. Tactical Suicide',
                messageBody: 'If you try to play in one of the shared liberties to attack, you will put yourself in Atari and White will capture you.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,3', label: '🚫', color: '#ef4444' }
                ]
            },
            {
                id: 'csk_s3',
                messageTitle: '3. Mutual Paralysis',
                messageBody: 'Likewise, if White plays there, they will put themselves in Atari and you will capture them. Neither player has an incentive to play.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'csk_s4',
                messageTitle: '4. Passing the Turn (Peace)',
                messageBody: 'This state is called <strong>Seki (Mutual Life)</strong>. The groups survive peacefully. Pass your turn using the bottom button or [P] key.',
                expectedAction: { type: 'pass' }
            },
            {
                id: 'csk_s5',
                messageTitle: '5. Endgame in Seki',
                messageBody: 'At the end of the game, stones in Seki are considered "alive", but their shared liberties do not count as territory points for anyone.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_6_territorio',
        chapterNumber: 9,
        category: 'classic',
        tag: 'FINAL SCORING',
        title: 'Territory & Japanese Rules',
        description: 'The player with the most surrounded territory plus prisoners and Komi wins.',
        boardSize: 9,
        heroId: 'normal',
        komi: 6.5,
        initialStones: [
            { id: '1,4', player: 1 }, { id: '2,4', player: 1 }, { id: '4,4', player: 1 }, { id: '5,4', player: 1 },
            { id: '5,1', player: 1 }, { id: '5,2', player: 1 }, { id: '5,3', player: 1 },
            { id: '2,2', player: 2 },
            { id: '6,6', player: 2 }, { id: '6,7', player: 2 }, { id: '6,8', player: 2 }, { id: '6,9', player: 2 },
            { id: '7,6', player: 2 }, { id: '8,6', player: 2 }, { id: '9,6', player: 2 }
        ],
        steps: [
            {
                id: 'c6_s1',
                messageTitle: '1. The True Goal of Go',
                messageBody: 'In Go, winning is not about capturing all enemy stones, but about **enclosing the most empty land (Territory)**. Look at the board: both sides are drawing their borders.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,2', label: '⚫', color: '#10b981' },
                    { nodeId: '8,8', label: '⚪', color: '#38bdf8' }
                ]
            },
            {
                id: 'c6_s2',
                messageTitle: '2. Sealing the Border',
                messageBody: 'Look at your black wall in the top-left corner: there is an **open gap at (3,4)**. Without closing it, your territory is open and will not score any points. Play at (3,4) to seal your border!',
                expectedAction: { type: 'place_stone', nodeId: '3,4' },
                annotations: [
                    { nodeId: '3,4', label: '★', color: '#10b981' }
                ]
            },
            {
                id: 'c6_s3',
                messageTitle: '3. +11 Territory Points',
                messageBody: 'Border sealed! You have safely enclosed the empty intersections of your corner. Under <strong>Japanese Rules</strong>, each empty intersection inside your wall is worth exactly <strong>1 Victory Point</strong> (+11 points).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '1,1', label: '+1', color: '#10b981' }, { nodeId: '2,1', label: '+1', color: '#10b981' }, { nodeId: '3,1', label: '+1', color: '#10b981' }, { nodeId: '4,1', label: '+1', color: '#10b981' },
                    { nodeId: '1,2', label: '+1', color: '#10b981' }, { nodeId: '3,2', label: '+1', color: '#10b981' }, { nodeId: '4,2', label: '+1', color: '#10b981' },
                    { nodeId: '1,3', label: '+1', color: '#10b981' }, { nodeId: '2,3', label: '+1', color: '#10b981' }, { nodeId: '3,3', label: '+1', color: '#10b981' }, { nodeId: '4,3', label: '+1', color: '#10b981' }
                ]
            },
            {
                id: 'c6_s4',
                messageTitle: '4. Dead Stones (+1 Prisoner)',
                messageBody: 'Look at the lonely white stone trapped at (2,2) inside your wall. It cannot make 2 eyes and cannot escape: it is a <strong>Dead Stone</strong>. At the end of the game, it is removed without wasting extra moves and counts as <strong>+1 Prisoner</strong> for you.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '2,2', label: '💀 +1', color: '#ef4444' }
                ]
            },
            {
                id: 'c6_s5',
                messageTitle: '5. Komi (+6.5 Points for White)',
                messageBody: 'Since Black plays first and enjoys initiative advantage, White receives a fixed compensation at the end: <strong>+6.5 Komi Points</strong>. The 0.5 decimal eliminates ties forever.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c6_s6',
                messageTitle: '6. Japanese Final Scoring',
                messageBody: 'Let us calculate the final score:<br>⚫ <strong>Black</strong>: 11 Territory + 1 Prisoner (dead stone) = <strong>12 Points</strong>.<br>⚪ <strong>White</strong>: 9 Territory + 0 Prisoners + 6.5 Komi = <strong>15.5 Points</strong>.<br>White wins by 3.5 points! This is how every game of Go is scored.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },

    {
        id: 'cap_topologia',
        chapterNumber: 10,
        category: 'special',
        tag: 'CRAZY GO MECHANIC',
        title: 'Topologies & The Void',
        description: 'Discover how asymmetrical or destroyed boards change survival rules. The void grants no liberties.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '2,2', player: 2 }, { id: '3,2', player: 2 }, { id: '4,2', player: 2 }
        ],
        steps: [
            {
                id: 'ctp_s1',
                messageTitle: '1. The Abyss',
                messageBody: 'In Crazy Go, meteors and certain boards can have <strong>destroyed</strong> tiles (no ground). These intersections disappear from the map.',
                expectedAction: { type: 'dialog_only' },
                onStart: (board: any, state: any) => {
                    import('../core/RulesEngine').then(m => {
                        m.RulesEngine.destroyTopology(board, state, ['3,1', '2,1', '4,1']);
                    });
                }
            },
            {
                id: 'ctp_s2',
                messageTitle: '2. The Void Does Not Breathe',
                messageBody: 'The white stones are at the edge of the void. Destroyed gaps <strong>do not count as liberties</strong>. Push them towards the abyss by playing at (3,3).',
                expectedAction: { type: 'place_stone', nodeId: '3,3' },
                annotations: [
                    { nodeId: '3,3', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'ctp_s3',
                messageTitle: '3. Accelerated Asphyxiation',
                messageBody: 'As you can see, it is much easier to capture an enemy cornered against destroyed areas. Use the topology to your advantage!',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    
    {
        id: 'cap_7_campeones',
        chapterNumber: 11,
        category: 'special',
        tag: 'CRAZY GO MECHANIC',
        title: 'Champions & Meteor Strike',
        description: 'Unleash supernatural Champion skills and master the strike area, hit chances, and friendly fire of Meteor Strike.',
        boardSize: 9,
        heroId: 'tengu',
        komi: 0,
        initialStones: [
            { id: '4,2', player: 2 }, { id: '5,2', player: 2 }, { id: '6,2', player: 2 }, { id: '7,2', player: 2 }, { id: '8,2', player: 2 },
            { id: '4,3', player: 2 }, { id: '5,3', player: 2 }, { id: '6,3', player: 2 }, { id: '7,3', player: 2 }, { id: '8,3', player: 2 },
            { id: '4,4', player: 2 }, { id: '5,4', player: 2 }, { id: '6,4', player: 2 }, { id: '7,4', player: 2 }, { id: '8,4', player: 2 },
            { id: '4,5', player: 2 }, { id: '5,5', player: 2 }, { id: '6,5', player: 2 }, { id: '7,5', player: 2 }, { id: '8,5', player: 2 },
            { id: '4,6', player: 2 }, { id: '5,6', player: 2 }, { id: '6,6', player: 2 }, { id: '7,6', player: 2 }, { id: '8,6', player: 2 },
            { id: '2,2', player: 1 }, { id: '2,6', player: 1 }
        ],
        steps: [
            {
                id: 'c7_s1',
                messageTitle: '1. The Rival Bastion',
                messageBody: 'Your opponent built a massive fortress of 25 white stones on the right. In classic Go this would require dozens of turns to breach, but in Crazy Go <strong>Champions</strong> wield devastating active powers.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '6,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c7_s2',
                messageTitle: '2. Active Skill: ☄️ Meteor Strike',
                messageBody: 'As <strong>Tengu</strong>, you command the active skill <strong>☄️ Meteor Strike</strong>. It targets <strong>25% of the board</strong> around your chosen center (~20 intersections on 9x9) and unleashes <strong>6 orbital meteors</strong> (13 on 13x13, 27 on 19x19).',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c7_s3',
                messageTitle: '3. Hit Chances & Indiscriminate Damage (Friendly Fire!)',
                messageBody: '<strong>⚠️ Critical Rule:</strong> Meteors strike random unique intersections within the zone (~30% hit chance per tile). <strong>They destroy ANY unprotected stone, whether ENEMY OR ALLIED!</strong> Avoid targeting your own key groups unless they are safeguarded by <strong>🛡️ Divine Shield</strong> (100% immune).',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c7_s4',
                messageTitle: '4. Summon the Cosmic Barrage',
                messageBody: 'Press [C] (or click the skill button on your champion portrait) and click the center of the enemy fortress at <strong>(6,4)</strong> to trigger the orbital bombardment.',
                expectedAction: { type: 'use_skill', nodeId: '6,4' },
                annotations: [
                    { nodeId: '6,4', label: '☄️', color: '#ef4444' }
                ]
            },
            {
                id: 'c7_s5',
                messageTitle: '5. Fortress Pulverized',
                messageBody: 'Devastating impact! The meteor barrage pulverized multiple stones across the impact zone, creating lethal openings in the enemy structure. Seize the momentum and advance!',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_8_hechizos_poliminos',
        chapterNumber: 12,
        category: 'special',
        tag: 'CRAZY GO MECHANIC',
        title: 'Spells & Polyomino Stones',
        description: 'Master the full mystical arsenal: Meteor Strike (80% enemy / 20% friendly fire), Time Rewind, Sprouting Stone, Duplicity, and Monolith.',
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
                messageTitle: '2. Example 1: Guaranteed Hit (100% Enemy)',
                messageBody: 'The <strong>Meteor Strike scroll (Key 2)</strong> searches and destroys 1 vulnerable stone on the Goban. With no allied stones in immediate danger, use the scroll now to obliterate the white stone at (4,4).',
                expectedAction: { type: 'use_spell', spellId: 'meteor' },
                onStart: () => {
                    if (typeof window !== 'undefined') {
                        (window as any).__tutorialForceMeteorEnemy = true;
                        (window as any).__tutorialForceMeteorAlly = false;
                    }
                },
                annotations: [
                    { nodeId: '4,4', label: '☄️', color: '#ef4444' }
                ]
            },
            {
                id: 'c8_s3',
                messageTitle: '3. Direct Hit & Probabilities',
                messageBody: 'Enemy stone destroyed! Meteor Strike has an <strong>80% chance to strike an enemy stone and a 20% chance of friendly fire (striking an allied stone)</strong>.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s4',
                messageTitle: '4. Example 2: The 20% Risk (Friendly Fire)',
                messageBody: 'Now both allied and enemy stones share the Goban. Use your second <strong>Meteor Strike (Key 2)</strong> to experience what happens when the 20% stochastic deviation occurs.',
                expectedAction: { type: 'use_spell', spellId: 'meteor' },
                onStart: () => {
                    if (typeof window !== 'undefined') {
                        (window as any).__tutorialForceMeteorAlly = true;
                        (window as any).__tutorialForceMeteorEnemy = false;
                    }
                }
            },
            {
                id: 'c8_s5',
                messageTitle: '5. Friendly Fire & Temporal Rescue!',
                messageBody: 'The meteor hit your own allied stone! This 20% risk requires tactical care. Fortunately, you hold the <strong>⏳ Time Rewind scroll (Key 1 or U)</strong>! Cast it now to reverse time and restore your stone.',
                expectedAction: { type: 'use_spell', spellId: 'rewind' },
                onComplete: () => {
                    if (typeof window !== 'undefined') {
                        (window as any).__tutorialForceMeteorAlly = false;
                        (window as any).__tutorialForceMeteorEnemy = false;
                    }
                }
            },
            {
                id: 'c8_s6',
                messageTitle: '6. Polyomino Stones',
                messageBody: 'Time restored and stone saved! Now let us learn <strong>Polyomino Stones</strong>: multi-stone geometrical pieces (1x1, 2x1, and 2x2).',
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
                onStart: () => {
                    PolyominoManager.orientation = 'vertical';
                    const dominoCard = PolyominoManager.polyominoCards.get('domino');
                    if (dominoCard) dominoCard.orientation = 'vertical';
                },
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
                messageBody: 'Outstanding! You have mastered Meteor Strike (with its 80% hit and 20% friendly fire rates), Time Rewind rescue, and all three tactical polyomino stones.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_9_entidades',
        chapterNumber: 13,
        category: 'special',
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
