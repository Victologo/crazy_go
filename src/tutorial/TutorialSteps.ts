// tutorial/TutorialSteps.ts
import type { BoardSize, HeroId, SpellId, PolyominoType } from '../types';

export interface TutorialAction {
    type: 'place_stone' | 'pass' | 'use_spell' | 'use_polyomino' | 'use_skill' | 'dialog_only';
    nodeId?: string; // Para place_stone o use_skill
    spellId?: SpellId; // Para use_spell
    polyType?: PolyominoType; // Para use_polyomino
    rotation?: number; // Para use_polyomino (0 o 1)
}

export interface TutorialAIResponse {
    type: 'place_stone' | 'pass';
    nodeId?: string;
}

export interface TutorialAnnotation {
    nodeId: string;
    label: string; // "1", "2", "3", "4", "★", "⚔️", "🚫"
    color?: string; // color hex o css
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
    initialStones: { id: string, player: number }[]; // Piedras ya colocadas al iniciar
    steps: TutorialStep[];
}

export const TUTORIAL_CHAPTERS: TutorialChapter[] = [
    {
        id: 'cap_1_libertades',
        chapterNumber: 1,
        tag: 'REGLA FUNDAMENTAL',
        title: 'Las Libertades y Grupos',
        description: 'Aprende cómo respiran las piedras en las intersecciones y cómo forman grupos con libertades compartidas.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [],
        steps: [
            {
                id: 'c1_s1',
                messageTitle: '1. Las Intersecciones',
                messageBody: 'En el Go las piedras se juegan siempre en las <strong>intersecciones</strong> de las líneas. Coloca tu piedra en el centro.',
                expectedAction: { type: 'place_stone', nodeId: '4,4' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c1_s2',
                messageTitle: '2. Las 4 Libertades Cardinales',
                messageBody: 'Cada piedra respira a través de sus 4 líneas ortogonales vacías, llamadas <strong>Libertades</strong> (marcas 1, 2, 3 y 4). Las diagonales no cuentan.',
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
                messageBody: 'Ahora coloca una segunda piedra en la libertad superior para unirte a ella y formar una cadena.',
                expectedAction: { type: 'place_stone', nodeId: '4,3' },
                annotations: [
                    { nodeId: '4,3', label: '🔗', color: '#38bdf8' }
                ]
            },
            {
                id: 'c1_s4',
                messageTitle: '4. Un Grupo Indivisible',
                messageBody: 'Al conectarse ortogonalmente forman un <strong>Grupo</strong> indivisible y comparten 6 libertades conjuntas (marcas 1 a 6).',
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
                messageBody: 'Conecta una tercera piedra a la izquierda para agrandar tu grupo y ganar más libertades.',
                expectedAction: { type: 'place_stone', nodeId: '3,4' },
                annotations: [
                    { nodeId: '3,4', label: '🔗', color: '#4ade80' }
                ]
            },
            {
                id: 'c1_s6',
                messageTitle: '6. ¡Cadena Consolidada!',
                messageBody: '¡Excelente! Has formado una sólida cadena de 3 piedras con <strong>7 libertades compartidas</strong> (marcas 1 a 7). Mientras el grupo tenga al menos 1 libertad, todas sus piedras seguirán vivas.',
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
        title: 'La Captura y el Atari',
        description: 'Cuando a un grupo le queda 1 sola libertad (Atari), la última jugada lo retira del tablero.',
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
                messageBody: 'A la piedra blanca central solo le queda 1 libertad libre (marcada en rojo): está en peligro inminente de captura (<strong>Atari</strong>).',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '5,4', label: '1', color: '#ef4444' }
                ]
            },
            {
                id: 'c2_s2',
                messageTitle: '2. Capturar la Piedra',
                messageBody: 'Juega en su última libertad libre para reducirla a 0 libertades y retirarla del tablero.',
                expectedAction: { type: 'place_stone', nodeId: '5,4' },
                annotations: [
                    { nodeId: '5,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c2_s3',
                messageTitle: '3. Piedra Capturada',
                messageBody: '¡Gran jugada! Al retirar la última libertad de la piedra blanca, ha sido capturada como prisionera, otorgándote puntos y liberando la intersección.',
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
        title: 'Grupos Vivos y los Dos Ojos',
        description: 'La regla de la inmortalidad: un grupo con dos ojos separados nunca puede ser capturado.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            // Grupo Negro rodeado con cavidad interior de 3 en línea: 3,4 - 4,4 - 5,4
            { id: '2,3', player: 1 }, { id: '3,3', player: 1 }, { id: '4,3', player: 1 }, { id: '5,3', player: 1 }, { id: '6,3', player: 1 },
            { id: '2,4', player: 1 }, { id: '6,4', player: 1 },
            { id: '2,5', player: 1 }, { id: '3,5', player: 1 }, { id: '4,5', player: 1 }, { id: '5,5', player: 1 }, { id: '6,5', player: 1 },
            // Anillo exterior Blanco rodeando completamente a Negras
            { id: '1,2', player: 2 }, { id: '2,2', player: 2 }, { id: '3,2', player: 2 }, { id: '4,2', player: 2 }, { id: '5,2', player: 2 }, { id: '6,2', player: 2 }, { id: '7,2', player: 2 },
            { id: '1,3', player: 2 }, { id: '7,3', player: 2 },
            { id: '1,4', player: 2 }, { id: '7,4', player: 2 },
            { id: '1,5', player: 2 }, { id: '7,5', player: 2 },
            { id: '1,6', player: 2 }, { id: '2,6', player: 2 }, { id: '3,6', player: 2 }, { id: '4,6', player: 2 }, { id: '5,6', player: 2 }, { id: '6,6', player: 2 }, { id: '7,6', player: 2 }
        ],
        steps: [
            {
                id: 'c3_s1',
                messageTitle: '1. Grupo Asediado',
                messageBody: 'Observa tu grupo negro: está <strong>completamente rodeado por piedras blancas</strong> en el exterior y no tiene escapatoria.',
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
                messageBody: 'Para sobrevivir rodeado, necesitas formar <strong>Dos Ojos</strong> independientes jugando en el punto vital central.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c3_s3',
                messageTitle: '3. Crear Dos Ojos',
                messageBody: 'Juega en el punto vital central para dividir el espacio interior en dos ojos separados.',
                expectedAction: { type: 'place_stone', nodeId: '4,4' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c3_s4',
                messageTitle: '4. Inmortalidad Matemática',
                messageBody: '¡Observa los dos ojos resultantes (1 y 2)! Para capturarte, Blancas tendría que ocupar todas tus libertades a la vez.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '1', color: '#38bdf8' },
                    { nodeId: '5,4', label: '2', color: '#38bdf8' }
                ]
            },
            {
                id: 'c3_s5',
                messageTitle: '5. El Suicidio del Rival',
                messageBody: 'Si Blancas juega en el Ojo 1, tu grupo sigue respirando por el Ojo 2: la jugada blanca no captura nada y es un <strong>Suicidio Ilegal</strong>. Lo mismo ocurre en el Ojo 2.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '3,4', label: '🚫', color: '#ef4444' },
                    { nodeId: '5,4', label: '🚫', color: '#ef4444' }
                ]
            },
            {
                id: 'c3_s6',
                messageTitle: '6. Estructura Invulnerable',
                messageBody: 'Como el rival no puede suicidarse ni colocar dos piedras al mismo tiempo, <strong>¡este grupo con dos ojos jamás podrá ser destruido!</strong>',
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
        title: 'El Suicidio Prohibido',
        description: 'No se puede jugar donde no hay libertades, salvo si esa jugada captura al instante.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            // Anillo blanco en Atari sin libertades exteriores, solo les queda la libertad 4,4
            { id: '4,3', player: 2 }, { id: '3,4', player: 2 }, { id: '5,4', player: 2 }, { id: '4,5', player: 2 },
            // Negras rodeando el exterior
            { id: '4,2', player: 1 }, { id: '3,3', player: 1 }, { id: '5,3', player: 1 },
            { id: '2,4', player: 1 }, { id: '6,4', player: 1 },
            { id: '3,5', player: 1 }, { id: '5,5', player: 1 }, { id: '4,6', player: 1 }
        ],
        steps: [
            {
                id: 'c4_s1',
                messageTitle: '1. Suicidio Prohibido',
                messageBody: 'En Go está <strong>estrictamente prohibido</strong> jugar en una casilla sin libertades si tu piedra no captura nada.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '🚫', color: '#ef4444' }
                ]
            },
            {
                id: 'c4_s2',
                messageTitle: '2. La Excepción de Captura',
                messageBody: 'Sin embargo, si tu jugada retira la última libertad de piedras enemigas, la captura se resuelve primero y la jugada es 100% legal.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c4_s3',
                messageTitle: '3. Captura Simultánea',
                messageBody: 'Juega en el centro para arrebatar la última libertad a las 4 piedras blancas y capturarlas todas al instante.',
                expectedAction: { type: 'place_stone', nodeId: '4,4' },
                annotations: [
                    { nodeId: '4,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c4_s4',
                messageTitle: '4. Captura Legal',
                messageBody: '¡Exacto! Al retirar la última libertad compartida del anillo blanco, las 4 piedras enemigas fueron eliminadas del tablero, dejando tu piedra viva y con libertades.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,3', label: '1', color: '#38bdf8' },
                    { nodeId: '3,4', label: '2', color: '#38bdf8' },
                    { nodeId: '5,4', label: '3', color: '#38bdf8' },
                    { nodeId: '4,5', label: '4', color: '#38bdf8' }
                ]
            }
        ]
    },
    {
        id: 'cap_5_ko',
        chapterNumber: 5,
        tag: 'REGLA CANÓNICA',
        title: 'La Regla del Ko (Eternidad)',
        description: 'Prohibido repetir de inmediato la posición anterior para evitar ciclos infinitos.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,5', player: 1 }, { id: '5,4', player: 1 }, { id: '6,5', player: 1 },
            { id: '4,6', player: 2 }, { id: '5,7', player: 2 }, { id: '6,6', player: 2 }, { id: '5,5', player: 2 }
        ],
        steps: [
            {
                id: 'c5_s1',
                messageTitle: '1. Bucle Infinito (Ko)',
                messageBody: 'Cuando dos piedras pueden capturarse mutuamente de forma alternativa, se crearía una repetición infinita que congelaría la partida.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '5,5', label: '1', color: '#f59e0b' },
                    { nodeId: '5,6', label: '★', color: '#ef4444' }
                ]
            },
            {
                id: 'c5_s2',
                messageTitle: '2. Captura de Ko',
                messageBody: 'Captura la piedra blanca central jugando en su libertad.',
                expectedAction: { type: 'place_stone', nodeId: '5,6' },
                annotations: [
                    { nodeId: '5,6', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c5_s3',
                messageTitle: '3. Prohibición de Repetición',
                messageBody: 'Por la <strong>Regla del Ko</strong>, tu rival no puede recapturar de inmediato en el siguiente turno. Debe jugar en otra parte del tablero primero.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '5,5', label: '🚫', color: '#ef4444' }
                ]
            }
        ]
    },
    {
        id: 'cap_6_territorio',
        chapterNumber: 6,
        tag: 'CONTEO FINAL',
        title: 'Territorio y Reglas Japonesas',
        description: 'Al final de la partida, el territorio cercado + prisioneros + Komi deciden la victoria.',
        boardSize: 9,
        heroId: 'normal',
        komi: 6.5,
        initialStones: [
            // Muro de Negras en la esquina superior izquierda con una fisura abierta en 2,2
            { id: '0,2', player: 1 }, { id: '1,2', player: 1 }, { id: '2,1', player: 1 }, { id: '2,0', player: 1 },
            // Territorio de Blancas en la esquina inferior derecha
            { id: '8,6', player: 2 }, { id: '7,6', player: 2 }, { id: '6,6', player: 2 }, { id: '6,7', player: 2 }, { id: '6,8', player: 2 },
            { id: '4,4', player: 2 }
        ],
        steps: [
            {
                id: 'c6_s1',
                messageTitle: '1. ¿Qué es el Territorio?',
                messageBody: 'En el Go, la victoria no se logra eliminando piezas, sino <strong>cercando la mayor cantidad de terreno vacío</strong> como si levantaras una cerca.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '0,0', label: '1', color: '#38bdf8' },
                    { nodeId: '1,0', label: '2', color: '#38bdf8' },
                    { nodeId: '0,1', label: '3', color: '#38bdf8' },
                    { nodeId: '1,1', label: '4', color: '#38bdf8' }
                ]
            },
            {
                id: 'c6_s2',
                messageTitle: '2. El Valor de los Puntos',
                messageBody: 'Bajo las <strong>Reglas Japonesas</strong>, cada intersección vacía completamente cercada por tus piedras (y los bordes del tablero) suma <strong>1 punto</strong> al final.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '0,0', label: '1', color: '#38bdf8' },
                    { nodeId: '1,0', label: '2', color: '#38bdf8' },
                    { nodeId: '0,1', label: '3', color: '#38bdf8' },
                    { nodeId: '1,1', label: '4', color: '#38bdf8' }
                ]
            },
            {
                id: 'c6_s3',
                messageTitle: '3. La Brecha en la Muralla',
                messageBody: 'Observa tu esquina: tu muralla tiene una fisura abierta. Si no la sellas, las piedras blancas podrán filtrarse y arrebatarte todo el espacio.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '2,2', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c6_s4',
                messageTitle: '4. Sellar la Frontera',
                messageBody: 'Juega en la intersección clave para cerrar herméticamente tu territorio de la esquina contra cualquier invasión rival.',
                expectedAction: { type: 'place_stone', nodeId: '2,2' },
                annotations: [
                    { nodeId: '2,2', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c6_s5',
                messageTitle: '5. Territorio Conquistado',
                messageBody: '¡Frontera blindada! Las 4 intersecciones interiores ahora están 100% protegidas y sumarán <strong>+4 puntos netos</strong> para Negras.',
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
                messageBody: 'Además del territorio cercado, cada piedra enemiga capturada suma <strong>+1 punto</strong>. Por su parte, Blancas recibe puntos extra (<strong>Komi</strong>, ej. +6.5) por jugar en segundo lugar.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '7,7', label: '1', color: '#f59e0b' },
                    { nodeId: '8,7', label: '2', color: '#f59e0b' },
                    { nodeId: '7,8', label: '3', color: '#f59e0b' },
                    { nodeId: '8,8', label: '4', color: '#f59e0b' }
                ]
            },
            {
                id: 'c6_s7',
                messageTitle: '7. ¡Cálculo de la Victoria!',
                messageBody: 'Cuando ambos pasan sucesivamente, se calcula: <strong>Territorio Cercado + Prisioneros + Komi</strong>. ¡El jugador con mayor puntuación total gana la partida!',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '0,0', label: '1', color: '#10b981' },
                    { nodeId: '1,0', label: '2', color: '#10b981' },
                    { nodeId: '0,1', label: '3', color: '#10b981' },
                    { nodeId: '1,1', label: '4', color: '#10b981' }
                ]
            }
        ]
    },
    {
        id: 'cap_7_campeones',
        chapterNumber: 7,
        tag: 'MECÁNICA CRAZY GO',
        title: 'Campeones y Lluvia Meteórica',
        description: 'Aprende a invocar la Lluvia Meteórica de Tengu para destruir bastiones enemigos.',
        boardSize: 9,
        heroId: 'tengu',
        komi: 0,
        initialStones: [
            // Densa fortaleza de piedras blancas en el flanco derecho (3x3 sólido)
            { id: '5,3', player: 2 }, { id: '6,3', player: 2 }, { id: '7,3', player: 2 },
            { id: '5,4', player: 2 }, { id: '6,4', player: 2 }, { id: '7,4', player: 2 },
            { id: '5,5', player: 2 }, { id: '6,5', player: 2 }, { id: '7,5', player: 2 },
            // Piedras de Negras en el flanco izquierdo
            { id: '2,3', player: 1 }, { id: '2,4', player: 1 }, { id: '2,5', player: 1 }, { id: '3,4', player: 1 }
        ],
        steps: [
            {
                id: 'c7_s1',
                messageTitle: '1. El Bastión Blanco',
                messageBody: 'Observa el flanco derecho: las piedras blancas han levantado una densa fortaleza de 9 piedras muy difícil de quebrar con jugadas normales.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '6,4', label: '⚔️', color: '#ef4444' }
                ]
            },
            {
                id: 'c7_s2',
                messageTitle: '2. Lluvia Meteórica de Tengu',
                messageBody: 'Tu campeón <strong>Tengu</strong> (a la izquierda) dispone de la habilidad activa <strong>☄️ Lluvia Meteórica</strong>, capaz de desatar un bombardeo devastador.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c7_s3',
                messageTitle: '3. Desatar el Bombardeo (Tecla C)',
                messageBody: 'Pulsa la tecla <strong>C</strong> (o el botón de Tengu a la izquierda) y haz clic en el centro del grupo blanco en <strong>6,4</strong> para invocar los meteoros.',
                expectedAction: { type: 'use_skill', nodeId: '6,4' },
                annotations: [
                    { nodeId: '6,4', label: '☄️', color: '#f59e0b' }
                ]
            },
            {
                id: 'c7_s4',
                messageTitle: '4. ¡Fortaleza Arrasada!',
                messageBody: '¡Impacto directo! Los meteoros han calcinado las piedras enemigas, quebrando su muralla y privando al rival de libertades y territorio.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c7_s5',
                messageTitle: '5. Sinergia de Go y Campeones',
                messageBody: '¡Excelente! Los poderes de campeón te permiten quebrar posiciones blindadas, pero el control territorial definitivo se gana dominando las libertades.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_8_hechizos_poliminos',
        chapterNumber: 8,
        tag: 'MECÁNICA CRAZY GO',
        title: 'Hechizos y Fichas Poliminó',
        description: 'Pergaminos de Meteorito y Rebobinar, Piedras Germinantes, Fichas Duplicidad 2x1 y Monolitos 2x2.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            // Piedra enemiga blanca para aniquilar con Meteorito
            { id: '4,4', player: 2 },
            // Disposición 1 [ ] [ ] 1 1 para la Ficha Duplicidad en fila y=6: (2,6) [3,6] [4,6] (5,6) (6,6)
            { id: '2,6', player: 1 },
            { id: '5,6', player: 1 }, { id: '6,6', player: 1 }
        ],
        steps: [
            {
                id: 'c8_s1',
                messageTitle: '1. El Arsenal Místico de Crazy Go',
                messageBody: 'Además de colocar piedras tradicionales, en Crazy Go dispones de un arsenal de <strong>Pergaminos Arcanos</strong> y <strong>Fichas Poliminó</strong> en tu dock inferior.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s2',
                messageTitle: '2. Pergamino de Meteorito (☄️)',
                messageBody: '¡Una piedra blanca enemiga se ha infiltrado en el centro (4,4)! Haz clic en el <strong>Pergamino de Meteorito (☄️)</strong> en el dock inferior (o pulsa <strong>2</strong>) para destruirla.',
                expectedAction: { type: 'use_spell', spellId: 'meteor' },
                annotations: [
                    { nodeId: '4,4', label: '☄️', color: '#f43f5e' }
                ]
            },
            {
                id: 'c8_s3',
                messageTitle: '3. ¡Impacto Devastador!',
                messageBody: '¡El meteorito ha pulverizado la piedra blanca enemiga al instante sin consumir tu jugada estándar de colocación!',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s4',
                messageTitle: '4. Un Error Táctico Deliberado',
                messageBody: 'Coloca una piedra normal en <strong>7,2</strong> para simular un descuido o jugada precipitada en territorio rival.',
                expectedAction: { type: 'place_stone', nodeId: '7,2' },
                annotations: [
                    { nodeId: '7,2', label: '❓', color: '#fbbf24' }
                ]
            },
            {
                id: 'c8_s5',
                messageTitle: '5. Pergamino de Rebobinar (⏳)',
                messageBody: 'Te has arrepentido de tu última jugada. Haz clic en el <strong>Pergamino de Rebobinar (⏳)</strong> en el dock inferior (o pulsa <strong>1</strong>) para retroceder en el tiempo y restaurar la posición anterior.',
                expectedAction: { type: 'use_spell', spellId: 'rewind' }
            },
            {
                id: 'c8_s6',
                messageTitle: '6. Fichas Poliminó Especiales',
                messageBody: '¡Tiempo restaurado! Ahora aprenderás a desplegar las 3 Fichas Poliminó: <strong>Germinante (🌿)</strong>, <strong>Duplicidad (🀄)</strong> y <strong>Monolito (🧱)</strong>.',
                expectedAction: { type: 'dialog_only' }
            },
            {
                id: 'c8_s7',
                messageTitle: '7. Ficha Germinante 1x1 (🌿)',
                messageBody: 'La <strong>Piedra Germinante (🌿)</strong> tiene esencia viva: <strong>brota una piedra aliada extra automáticamente cada 2 turnos</strong>. Selecciónala (tecla <strong>5</strong> o <strong>Z</strong>) y plántala en <strong>2,2</strong>.',
                expectedAction: { type: 'use_polyomino', polyType: 'sprouting', nodeId: '2,2' },
                annotations: [
                    { nodeId: '2,2', label: '🌿', color: '#10b981' }
                ]
            },
            {
                id: 'c8_s8',
                messageTitle: '8. Ficha Duplicidad 2x1 (🀄)',
                messageBody: 'Observa la fila inferior: tienes grupos separados `1 [ ] [ ] 1 1`. Selecciona la ficha <strong>Duplicidad (2x1)</strong> (tecla <strong>6</strong> o <strong>X</strong>, rotando con <strong>[R]</strong>) y colócala en <strong>3,6</strong> para tender el puente unificador.',
                expectedAction: { type: 'use_polyomino', polyType: 'domino', nodeId: '3,6' },
                annotations: [
                    { nodeId: '3,6', label: '🀄', color: '#38bdf8' },
                    { nodeId: '4,6', label: '🀄', color: '#38bdf8' }
                ]
            },
            {
                id: 'c8_s9',
                messageTitle: '9. Ficha Monolito 2x2 (🧱)',
                messageBody: 'Por último, el <strong>Monolito (🧱)</strong> es un coloso de 4 piedras unidas indisolubles para asegurar esquinas sólidas. Selecciónalo (tecla <strong>7</strong> o <strong>V</strong>) y colócalo en <strong>6,1</strong>.',
                expectedAction: { type: 'use_polyomino', polyType: 'monolith', nodeId: '6,1' },
                annotations: [
                    { nodeId: '6,1', label: '🧱', color: '#fbbf24' },
                    { nodeId: '7,1', label: '🧱', color: '#fbbf24' },
                    { nodeId: '6,2', label: '🧱', color: '#fbbf24' },
                    { nodeId: '7,2', label: '🧱', color: '#fbbf24' }
                ]
            },
            {
                id: 'c8_s10',
                messageTitle: '10. ¡Maestría Total del Arsenal!',
                messageBody: '¡Extraordinario! Has dominado el Meteorito, el Rebobinado temporal, la Germinación biológica, el Puente de Duplicidad y la Fortaleza del Monolito.',
                expectedAction: { type: 'dialog_only' }
            }
        ]
    },
    {
        id: 'cap_9_entidades',
        chapterNumber: 9,
        tag: 'MODO ROGUELIKE',
        title: 'Entidades y Rehenes del Goban',
        description: 'Cofres 🎁, Monjes 🧙, Pergaminos 📜 y Espíritus ✨: quítales sus libertades para liberarlos.',
        boardSize: 9,
        heroId: 'normal',
        komi: 0,
        initialStones: [
            { id: '4,3', player: 1 }, { id: '3,4', player: 1 }, { id: '5,4', player: 1 }
        ],
        steps: [
            {
                id: 'c9_s1',
                messageTitle: '1. Objetos y Cautivos',
                messageBody: 'En batallas Roguelike aparecen cofres 🎁, monjes 🧙, pergaminos 📜 y espíritus ✨ neutrales en el Goban.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '🎁', color: '#f59e0b' },
                    { nodeId: '4,5', label: '1', color: '#ef4444' }
                ]
            },
            {
                id: 'c9_s2',
                messageTitle: '2. Rescatar la Entidad',
                messageBody: 'Juega en su última libertad cardinal para capturar la entidad y reclamar tu recompensa inmediata.',
                expectedAction: { type: 'place_stone', nodeId: '4,5' },
                annotations: [
                    { nodeId: '4,5', label: '★', color: '#f59e0b' }
                ]
            },
            {
                id: 'c9_s3',
                messageTitle: '3. Botín Obtenido',
                messageBody: '¡Misión cumplida! Al retirar todas las libertades de una entidad, liberas su botín: hechizos, recargas de habilidad o bonificaciones permanentes de Komi.',
                expectedAction: { type: 'dialog_only' },
                annotations: [
                    { nodeId: '4,4', label: '🎁', color: '#10b981' }
                ]
            }
        ]
    }
];
