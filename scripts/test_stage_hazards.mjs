// scripts/test_stage_hazards.mjs - Suite de pruebas automatizadas para Peligros de Escenario (Cielo, Volcán, Oni)
import { GraphBoard } from '../src/core/GraphBoard';
import { GameState } from '../src/core/GameState';
import { BoardGenerators } from '../src/graphics/BoardGenerators';
import { StageHazardManager } from '../src/core/StageHazardManager';

if (typeof window === 'undefined') {
    global.window = {
        addEventListener: () => {},
        removeEventListener: () => {},
        AudioContext: class {
            createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, type: '', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
            createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
            createBiquadFilter() { return { connect: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, Q: { setValueAtTime: () => {} } }; }
            createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
            createBufferSource() { return { connect: () => {}, start: () => {}, buffer: null }; }
            get destination() { return {}; }
            get currentTime() { return 0; }
            get sampleRate() { return 44100; }
            resume() { return Promise.resolve(); }
        }
    };
    global.document = {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    };
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ ASSERTION FAILED: ${message}`);
        process.exit(1);
    } else {
        console.log(`  ✓ ${message}`);
    }
}

console.log('====================================================');
console.log('🧪 TEST DE PELIGROS DE ESCENARIO: CIELO, VOLCÁN, ONI');
console.log('====================================================\n');

// 1. TEST TABLERO DEL CIELO (SKY BOARD)
console.log('🔹 Test 1: Tablero del Cielo (Sky Board) - Expansión a Turno 21 (11a)');
StageHazardManager.reset();
const skyBoard = new GraphBoard();
BoardGenerators.generate(skyBoard, 'sky', 9);
const skyState = new GameState(6.5, 2);
const initialSkyNodes = skyBoard.nodes.size;
assert(initialSkyNodes === 81, `El tablero del cielo empieza con 81 nodos (9x9), tiene: ${initialSkyNodes}`);

// Simular 19 jugadas iniciales (turnos 2 a 20)
for (let t = 1; t <= 19; t++) {
    skyState.advanceTurn(skyBoard);
    const triggered = StageHazardManager.checkStageHazards(skyBoard, skyState, null, () => {});
    assert(!triggered, `Jugada ${t} (Turno interno ${skyState.currentTurn}) no debe disparar expansión aún`);
}

// Al realizar la jugada 20 (Avanza a Turno 21 / Ronda 11a):
skyState.advanceTurn(skyBoard);
assert(skyState.currentTurn === 21, `El turno actual es 21 (11a), es: ${skyState.currentTurn}`);
let skyRendered = false;
let skyCompleted = false;
const skyTriggered = StageHazardManager.checkStageHazards(
    skyBoard,
    skyState,
    null,
    () => { skyRendered = true; },
    () => { skyCompleted = true; }
);

assert(skyTriggered, 'El Tablero del Cielo disparó la Expansión Celestial en el Turno 21 (11a)');
assert(skyRendered, 'Se ejecutó el callback onRender al impactar los bloques');
assert(skyCompleted, 'Se ejecutó el callback onComplete al finalizar la expansión');
assert(skyBoard.nodes.size > 81, `El Goban creció de 81 a ${skyBoard.nodes.size} casillas`);

// 2. TEST TABLERO DEL VOLCÁN (VOLCANO BOARD)
console.log('\n🔹 Test 2: Tablero del Volcán (Volcano Board) - Erupción a Turno 21 (11a)');
StageHazardManager.reset();
const volcanoBoard = new GraphBoard();
BoardGenerators.generate(volcanoBoard, 'volcano', 9);
const volcanoState = new GameState(6.5, 2);

for (let t = 1; t <= 19; t++) {
    volcanoState.advanceTurn(volcanoBoard);
    const triggered = StageHazardManager.checkStageHazards(volcanoBoard, volcanoState, null, () => {});
    assert(!triggered, `Jugada ${t} no debe disparar erupción aún`);
}

volcanoState.advanceTurn(volcanoBoard);
assert(volcanoState.currentTurn === 21, 'El turno actual es 21 (11a)');
let volcanoCompleted = false;
const volcanoTriggered = StageHazardManager.checkStageHazards(
    volcanoBoard,
    volcanoState,
    null,
    () => {},
    () => { volcanoCompleted = true; }
);

assert(volcanoTriggered, 'El Tablero Volcánico disparó la Erupción en el Turno 21 (11a)');
assert(volcanoCompleted, 'Se ejecutó el callback onComplete tras el impacto del magma');
const destroyedNodes = Array.from(volcanoBoard.nodes.values()).filter(n => n.terrain === 'DESTROYED');
assert(destroyedNodes.length > 0, `Al menos 1 casilla fue destruida por el magma (${destroyedNodes.length} destruidas)`);

// 3. TEST TABLERO MÁSCARA ONI (ONI BOARD)
console.log('\n🔹 Test 3: Tablero Máscara Oni (Oni Board) - Inhalación a Turno 15 (8a)');
StageHazardManager.reset();
const oniBoard = new GraphBoard();
BoardGenerators.generate(oniBoard, 'oni', 19);
const oniState = new GameState(6.5, 2);

// Colocar 2 piedras ligeras
const p1Node = oniBoard.nodes.get('12,14');
if (p1Node) p1Node.stone = { id: 's1', playerId: 1, stoneType: 'single' };
const p2Node = oniBoard.nodes.get('12,15');
if (p2Node) p2Node.stone = { id: 's2', playerId: 2, stoneType: 'single' };

for (let t = 1; t <= 13; t++) {
    oniState.advanceTurn(oniBoard);
    const triggered = StageHazardManager.checkStageHazards(oniBoard, oniState, null, () => {});
    assert(!triggered, `Jugada ${t} no debe disparar inhalación aún`);
}

oniState.advanceTurn(oniBoard);
assert(oniState.currentTurn === 15, `El turno actual es 15 (8a), es: ${oniState.currentTurn}`);
let oniCompleted = false;
const oniTriggered = StageHazardManager.checkStageHazards(
    oniBoard,
    oniState,
    null,
    () => {},
    () => { oniCompleted = true; }
);

assert(oniTriggered, 'El Tablero Máscara Oni disparó la Inhalación en el Turno 15 (8a)');
assert(oniCompleted, 'Se ejecutó el callback onComplete tras la atracción gravitatoria');

console.log('\n====================================================');
console.log('🎉 ¡TODOS LOS PELIGROS DE ESCENARIO FUNCIONAN AL 100%!');
console.log('====================================================\n');
