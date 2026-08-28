// scripts/test_combat_log.mjs - Suite de pruebas automatizadas para CombatLog, Replay y Rebobinar
import { GraphBoard } from '../src/core/GraphBoard';
import { GameState } from '../src/core/GameState';
import { BoardGenerators } from '../src/graphics/BoardGenerators';
import { RulesEngine } from '../src/core/RulesEngine';
import { CombatLogManager } from '../src/core/CombatLogManager';
import { ChampionManager } from '../src/core/ChampionManager';
import { PolyominoManager } from '../src/core/PolyominoManager';
import { RogueliteManager } from '../src/core/RogueliteManager';

if (typeof window === 'undefined') {
    global.window = {
        addEventListener: () => {},
        removeEventListener: () => {},
        AudioContext: class {
            createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, type: '', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
            createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
            get destination() { return {}; }
            get currentTime() { return 0; }
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
console.log('🧪 INICIANDO TEST AUTOMATIZADO DE COMBAT LOG & REPLAY');
console.log('====================================================\n');

// 1. Configuración e Inicialización de Tablero
console.log('🔹 Test 1: Inicialización de Partida y Reset de CombatLog');
const board = new GraphBoard();
BoardGenerators.generate(board, 'square', 9);

const config = {
    shape: 'square',
    size: 9,
    gameMode: '1via',
    ruleStyle: 'roguelite',
    playerCount: 2,
    humanColor: 1,
    difficulty: 'medium',
    komi: 6.5,
    heroId: 'normal',
    enemyHeroId: 'normal'
};

const state = new GameState(config.komi, config.playerCount);
ChampionManager.resetForMatch(config.heroId, board, 1);
RogueliteManager.initSpells({ rewind: 2, meteor: 1, shield: 1, convert: 1 });
PolyominoManager.resetForMatch(true, config);
CombatLogManager.resetForNewMatch(config, board, state);

let entries = CombatLogManager.getEntries();
assert(entries.length === 1, 'CombatLog contiene exactamente 1 entrada inicial (Paso 0)');
assert(entries[0].stepIndex === 0, 'La entrada inicial tiene stepIndex === 0');
assert(entries[0].actionType === 'place_stone', 'La entrada inicial es el inicio del combate');

// 2. Colocación de Piedras (Negras y Blancas)
console.log('\n🔹 Test 2: Registro de Colocación de Piedras');
state.recordSnapshot(board);
let r1 = RulesEngine.tryPlaceStone(board, state, '4,4', 1);
assert(r1.success, 'Negras colocan piedra en 4,4');
CombatLogManager.logStonePlacement(board, state, '4,4', 1, r1.capturedCount);
state.advanceTurn(board);

state.recordSnapshot(board);
let r2 = RulesEngine.tryPlaceStone(board, state, '2,2', 2);
assert(r2.success, 'Blancas colocan piedra en 2,2');
CombatLogManager.logStonePlacement(board, state, '2,2', 2, r2.capturedCount);
state.advanceTurn(board);

entries = CombatLogManager.getEntries();
assert(entries.length === 3, 'CombatLog tiene 3 entradas (Inicio + Jugada 1 + Jugada 2)');
assert(entries[1].primaryNodeId === '4,4', 'Entrada 1 apunta a 4,4');
assert(entries[2].primaryNodeId === '2,2', 'Entrada 2 apunta a 2,2');
assert(entries[1].boardSnapshot.some(n => n.id === '4,4' && n.stone !== null), 'Snapshot 1 tiene la piedra negra en 4,4');
assert(entries[2].boardSnapshot.some(n => n.id === '2,2' && n.stone !== null), 'Snapshot 2 tiene la piedra blanca en 2,2');

// 3. Registro de Habilidades de Campeón
console.log('\n🔹 Test 3: Registro de Habilidades de Campeón');
CombatLogManager.logChampionSkill(board, state, 'kitsune', 'Escudo Divino', '4,4', ['4,4'], 1);
entries = CombatLogManager.getEntries();
assert(entries.length === 4, 'CombatLog registra Escudo Divino de Kitsune');
assert(entries[3].actionName.includes('Escudo Divino'), 'Nombre de la acción contiene "Escudo Divino"');

// 4. Registro de Poliminós y Brote
console.log('\n🔹 Test 4: Registro de Fichas Poliminó y Brotes Germinantes');
CombatLogManager.logPolyominoPlacement(board, state, 'domino', ['0,0', '0,1'], 1);
CombatLogManager.logSproutingGrowth(board, state, '0,2', 1);
entries = CombatLogManager.getEntries();
assert(entries.length === 6, 'CombatLog registra Ficha Duplicidad y Brote Germinante');
assert(entries[4].actionType === 'polyomino', 'Tipo de acción es polyomino');
assert(entries[5].actionType === 'sprouting_growth', 'Tipo de acción es sprouting_growth');

// 5. Registro de Hechizos y Rebobinado
console.log('\n🔹 Test 5: Lanzamiento de Hechizo Rebobinar y Preservación de Historial');
const initialRewindUses = RogueliteManager.getSpells().find(s => s.id === 'rewind')?.usesLeft || 0;
assert(initialRewindUses === 2, 'El jugador empieza con 2 cargas de Rebobinar');

console.log('  [DEBUG] Before rewind: currentPlayer =', state.currentPlayer, 'historyStack length =', state.historyStack.length);

// Lanzar hechizo Rebobinar
let castOk = RogueliteManager.castSpell(
    'rewind',
    board,
    state,
    1,
    (msg, removedStones) => {
        CombatLogManager.logSpellCast(
            board,
            state,
            'rewind',
            'Rebobinar',
            removedStones ? removedStones.map(s => `${s.x},${s.y}`) : [],
            1
        );
    },
    (err) => {
        assert(false, `Fallo inesperado al lanzar rebobinar: ${err}`);
    }
);

console.log('  [DEBUG] After rewind: currentPlayer =', state.currentPlayer, 'historyStack length =', state.historyStack.length);
assert(castOk, 'Hechizo Rebobinar ejecutado con éxito');
const remainingRewinds = RogueliteManager.getSpells().find(s => s.id === 'rewind')?.usesLeft || 0;
assert(remainingRewinds === 1, 'Se consumió exactamente 1 carga de Rebobinar (quedan 1)');
assert(state.currentPlayer === 1, `El turno actual volvió a ser del Jugador 1 (Negras), pero es ${state.currentPlayer}`);

entries = CombatLogManager.getEntries();
assert(entries.length === 7, 'CombatLog contiene todas las entradas anteriores más el paso del Rebobinado');
assert(entries[6].actionType === 'spell_cast', 'El último paso registrado es el lanzamiento de Rebobinar');

// 6. Exportación e Importación de Archivo Replay (.cgo)
console.log('\n🔹 Test 6: Exportación e Importación de Replay JSON');
const replayJSON = CombatLogManager.exportReplayJSON();
assert(typeof replayJSON === 'string' && replayJSON.length > 50, 'JSON de Replay generado correctamente');

const importedReplay = CombatLogManager.importReplayJSON(replayJSON);
assert(importedReplay.format === 'CRAZY_GO_REPLAY', 'El formato importado es CRAZY_GO_REPLAY');
assert(importedReplay.entries.length === 7, 'El replay importado conserva exactamente las 7 entradas');
assert(importedReplay.gameConfig.shape === 'square', 'El replay importado conserva la forma del tablero');

// 7. Test de Destrucción Dinámica de Casillas y Eventos de Tablero (Volcán, Terremoto, Fauces)
console.log('\n🔹 Test 7: Destrucción Dinámica de Nodos y Topología Cambiante');
// Simular destrucción física de un nodo (ej. Terremoto o Erupción Volcánica)
board.removeNode('8,8');
const node88 = board.nodes.get('8,8');
assert(node88?.terrain === 'DESTROYED', 'El nodo 8,8 tiene terreno DESTROYED tras removeNode');
assert(node88?.neighbors.size === 0, 'El nodo 8,8 tiene 0 vecinos tras ser desconectado y destruido');

CombatLogManager.logBoardEvent(
    board,
    state,
    'Erupción Volcánica',
    '8,8',
    ['8,8'],
    'El volcán ha destruido la intersección 8,8'
);

entries = CombatLogManager.getEntries();
assert(entries.length === 8, 'CombatLog registra el evento de tablero destructivo');
const lastSnapshot = entries[entries.length - 1].boardSnapshot;
const snap88 = lastSnapshot.find(n => n.id === '8,8');
assert(snap88 !== undefined, 'El nodo 8,8 está en el snapshot');
assert(snap88?.terrain === 'DESTROYED', 'El snapshot registra fielmente terrain === "DESTROYED" para el nodo 8,8');
assert(snap88?.stone === null, 'El nodo destruido 8,8 no contiene ninguna piedra');

// 8. Test de Expansión Celestial Dinámica (Nuevas Casillas que Caen del Cielo)
console.log('\n🔹 Test 8: Expansión Dinámica de Nuevas Casillas (Tablero del Cielo)');
// Simular expansión de 4 nuevas casillas que antes no existían en el tablero (9,0 / 9,1 / 10,0 / 10,1)
const newCoords = ['9,0', '9,1', '10,0', '10,1'];
for (const cid of newCoords) {
    const [c, r] = cid.split(',').map(Number);
    board.addNode(cid, c * 46, r * 46, false);
}
board.addEdge('9,0', '8,0');
board.addEdge('9,1', '8,1');

CombatLogManager.logBoardEvent(
    board,
    state,
    'Expansión Celestial',
    '9,0',
    newCoords,
    '5 nuevos bloques cuadrados han caído del cielo expandiendo el goban'
);

entries = CombatLogManager.getEntries();
assert(entries.length === 9, 'CombatLog registra el evento de Expansión Celestial');
const skySnapshot = entries[entries.length - 1].boardSnapshot;
for (const cid of newCoords) {
    const found = skySnapshot.find(n => n.id === cid);
    assert(found !== undefined, `El nodo recién generado ${cid} está en el snapshot de este turno`);
    assert(found?.terrain === 'NORMAL', `El nodo recién generado ${cid} tiene terreno NORMAL`);
}

console.log('\n====================================================');
console.log('🎉 ¡TODOS LOS TESTS DE COMBAT LOG & REPLAY PASARON AL 100%!');
console.log('====================================================\n');
