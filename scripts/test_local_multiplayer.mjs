// scripts/test_local_multiplayer.mjs
import { GraphBoard } from '../src/core/GraphBoard.ts';
import { GameState } from '../src/core/GameState.ts';
import { RulesEngine } from '../src/core/RulesEngine.ts';
import { PolyominoManager } from '../src/core/PolyominoManager.ts';
import { BoardGenerators } from '../src/graphics/BoardGenerators.ts';

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAILED ASSERTION: ${message}`);
        process.exit(1);
    }
    console.log(`  ✓ ${message}`);
}

console.log("====================================================");
console.log("🧪 TEST DE PARTIDAS MULTIJUGADOR LOCAL (2P y 4P)");
console.log("====================================================");

// --- TEST 1: Partida 1v1 Local (2 Jugadores) ---
console.log("\n🔹 Test 1: Partida 1v1 Local (2 Jugadores: Negras vs Blancas)");
{
    const board = new GraphBoard();
    BoardGenerators.generate(board, 'square', 9);
    const state = new GameState(6.5, 2);

    assert(state.currentPlayer === 1, "Turno inicial es Jugador 1 (Negras)");
    assert(state.getTurnLabel() === "1a", "Etiqueta de turno inicial es 1a");

    // Turno 1a: Jugador 1 (Negras ⚫)
    const res1 = RulesEngine.tryPlaceStone(board, state, "0,0", state.currentPlayer);
    assert(res1.success, "Jugador 1 coloca piedra legalmente en 0,0");
    assert(board.nodes.get("0,0").stone.playerId === 1, "La piedra en 0,0 pertenece al Jugador 1 (Negras ⚫)");
    state.advanceTurn(board);

    assert(state.currentPlayer === 2, "Turno avanza a Jugador 2 (Blancas)");
    assert(state.getTurnLabel() === "1b", "Etiqueta de turno es 1b");

    // Turno 1b: Jugador 2 (Blancas ⚪)
    const res2 = RulesEngine.tryPlaceStone(board, state, "1,1", state.currentPlayer);
    assert(res2.success, "Jugador 2 coloca piedra legalmente en 1,1");
    assert(board.nodes.get("1,1").stone.playerId === 2, "La piedra en 1,1 pertenece al Jugador 2 (Blancas ⚪)");
    state.advanceTurn(board);

    assert(state.currentPlayer === 1, "Turno vuelve a Jugador 1 (Negras)");
    assert(state.getTurnLabel() === "2a", "Etiqueta de turno es 2a");
}

// --- TEST 2: Partida 4 Jugadores Local (Go Cuádruple) ---
console.log("\n🔹 Test 2: Partida 4 Jugadores Local (P1=A/Negro, P2=B/Blanco, P3=C/Esmeralda, P4=D/Amatista)");
{
    const board = new GraphBoard();
    BoardGenerators.generate(board, 'square', 9);
    const state = new GameState(6.5, 4, { 2: 2.5, 3: 4.5, 4: 6.5 });

    // Turno 1a (Jugador A / 1 / Negro)
    assert(state.currentPlayer === 1, "Inicio en Jugador 1");
    assert(state.getTurnLabel() === "1a", "Etiqueta de turno es 1a");
    const r1 = RulesEngine.tryPlaceStone(board, state, "0,0", state.currentPlayer);
    assert(r1.success, "P1 coloca piedra en 0,0");
    assert(board.nodes.get("0,0").stone.playerId === 1, "Piedra en 0,0 es NEGRA (PlayerId = 1)");
    state.advanceTurn(board);

    // Turno 1b (Jugador B / 2 / Blanco)
    assert(state.currentPlayer === 2, "Turno es Jugador 2 (B)");
    assert(state.getTurnLabel() === "1b", "Etiqueta de turno es 1b");
    const r2 = RulesEngine.tryPlaceStone(board, state, "1,1", state.currentPlayer);
    assert(r2.success, "P2 coloca piedra en 1,1");
    assert(board.nodes.get("1,1").stone.playerId === 2, "Piedra en 1,1 es BLANCA (PlayerId = 2)");
    state.advanceTurn(board);

    // Turno 1c (Jugador C / 3 / Esmeralda)
    assert(state.currentPlayer === 3, "Turno es Jugador 3 (C)");
    assert(state.getTurnLabel() === "1c", "Etiqueta de turno es 1c");
    const r3 = RulesEngine.tryPlaceStone(board, state, "2,2", state.currentPlayer);
    assert(r3.success, "P3 coloca piedra en 2,2");
    assert(board.nodes.get("2,2").stone.playerId === 3, "Piedra en 2,2 es ESMERALDA (PlayerId = 3)");
    state.advanceTurn(board);

    // Turno 1d (Jugador D / 4 / Amatista)
    assert(state.currentPlayer === 4, "Turno es Jugador 4 (D)");
    assert(state.getTurnLabel() === "1d", "Etiqueta de turno es 1d");
    const r4 = RulesEngine.tryPlaceStone(board, state, "3,3", state.currentPlayer);
    assert(r4.success, "P4 coloca piedra en 3,3");
    assert(board.nodes.get("3,3").stone.playerId === 4, "Piedra en 3,3 es AMATISTA (PlayerId = 4)");
    state.advanceTurn(board);

    // Ronda 2: Turno 2a (Jugador A / 1 / Negro)
    assert(state.currentPlayer === 1, "Turno regresa a Jugador 1 (A)");
    assert(state.getTurnLabel() === "2a", "Etiqueta de turno avanza a Ronda 2: 2a");
    const r5 = RulesEngine.tryPlaceStone(board, state, "4,4", state.currentPlayer);
    assert(r5.success, "P1 coloca piedra en 4,4");
    assert(board.nodes.get("4,4").stone.playerId === 1, "Piedra en 4,4 es NEGRA (PlayerId = 1)");
    state.advanceTurn(board);

    // Turno 2b (Jugador B / 2 / Blanco)
    assert(state.currentPlayer === 2, "Turno avanza a Jugador 2 (B)");
    assert(state.getTurnLabel() === "2b", "Etiqueta de turno es 2b");
    const r6 = RulesEngine.tryPlaceStone(board, state, "5,5", state.currentPlayer);
    assert(r6.success, "P2 coloca piedra en 5,5");
    assert(board.nodes.get("5,5").stone.playerId === 2, "Piedra en 5,5 es BLANCA (PlayerId = 2)");
}

// --- TEST 3: Colocación de Poliminós por cada Jugador en 4P ---
console.log("\n🔹 Test 3: Poliminós en 4P (Cada jugador coloca de su propio color)");
{
    const board = new GraphBoard();
    BoardGenerators.generate(board, 'square', 9);
    const state = new GameState(6.5, 4);

    PolyominoManager.resetForMatch(false, {
        playerCount: 4,
        gameMode: '1v1',
        specialStones: {
            enabled: true,
            playerSprouting: 2,
            playerDomino: 2,
            playerMonolith: 1
        }
    });

    // P1 coloca Dominó horizontal (0,0 y 1,0)
    PolyominoManager.syncCardsWithInventory(1);
    PolyominoManager.activePolyomino = 'domino';
    PolyominoManager.orientation = 'horizontal';
    const pRes1 = PolyominoManager.placePolyomino(board, state, "0,0", 1, () => {}, () => {});
    assert(pRes1.success, "P1 coloca Dominó");
    assert(board.nodes.get("0,0").stone.playerId === 1, "Dominó nodo 1 es Negro (PlayerId 1)");
    assert(board.nodes.get("1,0").stone.playerId === 1, "Dominó nodo 2 es Negro (PlayerId 1)");
    state.advanceTurn(board);

    // P2 coloca Dominó vertical (0,2 y 0,3)
    PolyominoManager.syncCardsWithInventory(2);
    PolyominoManager.activePolyomino = 'domino';
    PolyominoManager.orientation = 'vertical';
    const pRes2 = PolyominoManager.placePolyomino(board, state, "0,2", 2, () => {}, () => {});
    assert(pRes2.success, "P2 coloca Dominó");
    assert(board.nodes.get("0,2").stone.playerId === 2, "Dominó nodo 1 es Blanco (PlayerId 2)");
    assert(board.nodes.get("0,3").stone.playerId === 2, "Dominó nodo 2 es Blanco (PlayerId 2)");
    state.advanceTurn(board);

    // P3 coloca Germinante en 5,5
    PolyominoManager.syncCardsWithInventory(3);
    PolyominoManager.activePolyomino = 'sprouting';
    const pRes3 = PolyominoManager.placePolyomino(board, state, "5,5", 3, () => {}, () => {});
    assert(pRes3.success, "P3 coloca Germinante");
    assert(board.nodes.get("5,5").stone.playerId === 3, "Piedra Germinante es Esmeralda (PlayerId 3)");
    state.advanceTurn(board);

    // P4 coloca Monolito 2x2 en 7,7
    PolyominoManager.syncCardsWithInventory(4);
    PolyominoManager.activePolyomino = 'monolith';
    const pRes4 = PolyominoManager.placePolyomino(board, state, "7,7", 4, () => {}, () => {});
    assert(pRes4.success, "P4 coloca Monolito");
    assert(board.nodes.get("7,7").stone.playerId === 4, "Monolito nodo (7,7) es Amatista (PlayerId 4)");
    assert(board.nodes.get("8,7").stone.playerId === 4, "Monolito nodo (8,7) es Amatista (PlayerId 4)");
    assert(board.nodes.get("7,8").stone.playerId === 4, "Monolito nodo (7,8) es Amatista (PlayerId 4)");
    assert(board.nodes.get("8,8").stone.playerId === 4, "Monolito nodo (8,8) es Amatista (PlayerId 4)");
}

console.log("\n====================================================");
console.log("🎉 ¡TODOS LOS TESTS DE MULTIJUGADOR LOCAL PASARON AL 100%!");
console.log("====================================================");
