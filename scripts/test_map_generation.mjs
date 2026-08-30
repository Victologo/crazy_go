// scripts/test_map_generation.mjs
// Verificación automatizada de generación procedural y centrado de caminos en el mapa Roguelike

import { RoguelikeMapGenerator } from '../src/core/RoguelikeMapGenerator.ts';

console.log('🧪 Iniciando suite de pruebas de generación y centrado del mapa Roguelike...');

const difficulties = ['easy', 'normal', 'hard', 'extreme'];
const NUM_RUNS = 200;

let totalNodes = 0;
let totalCenterNodes = 0; // Nodos en carriles 1 y 2 (Columnas 2 y 3)
let totalOuterNodes = 0;  // Nodos en carriles 0 y 3 (Columnas 1 y 4)
let totalCrossings = 0;
let totalDisconnected = 0;
let bossIdMismatches = 0;
let totalTwoPathTiers = 0;
let centeredTwoPathTiers = 0;

for (let r = 0; r < NUM_RUNS; r++) {
    const diff = difficulties[r % difficulties.length];
    const map = RoguelikeMapGenerator.generateMap(diff);

    // 1. Validar bossNodeId
    const lastTierIdx = map.tiers.length - 1;
    const expectedBossId = `${lastTierIdx}-0`;
    if (map.bossNodeId !== expectedBossId) {
        bossIdMismatches++;
        console.error(`❌ Mismatch en bossNodeId: esperado ${expectedBossId}, obtenido ${map.bossNodeId}`);
    }

    // 2. Validar que el nodo Boss existe y es de tipo 'boss'
    const bossNode = map.nodes.get(map.bossNodeId);
    if (!bossNode || bossNode.type !== 'boss') {
        console.error(`❌ Boss node inválido en run ${r}`);
    }

    // 3. Validar alcanzabilidad (Reachability) desde Tier 0 hasta el Boss
    const reachableFromStart = new Set();
    const queue = [];
    
    // Nodos en Tier 0
    for (const node of map.tiers[0]) {
        queue.push(node.id);
        reachableFromStart.add(node.id);
    }

    while (queue.length > 0) {
        const currId = queue.shift();
        const currNode = map.nodes.get(currId);
        if (!currNode) continue;
        for (const nextId of currNode.nextConnectedNodeIds) {
            if (!reachableFromStart.has(nextId)) {
                reachableFromStart.add(nextId);
                queue.push(nextId);
            }
        }
    }

    if (!reachableFromStart.has(map.bossNodeId)) {
        totalDisconnected++;
        console.error(`❌ Boss inalcanzable en run ${r}`);
    }

    // Comprobar que todos los nodos en el mapa son alcanzables
    for (const node of map.nodes.values()) {
        if (!reachableFromStart.has(node.id)) {
            totalDisconnected++;
            console.error(`❌ Nodo huérfano inalcanzable: ${node.id} en run ${r}`);
        }

        // Estadísticas de posición
        totalNodes++;
        if (node.x === 40 || node.x === 60 || node.x === 50) {
            totalCenterNodes++;
        } else {
            totalOuterNodes++;
        }
    }

    // 4. Analizar el centrado exacto de CADA tier
    for (let t = 0; t < map.tiers.length; t++) {
        const tier = map.tiers[t];
        const avgX = tier.reduce((sum, n) => sum + n.x, 0) / tier.length;
        if (Math.abs(avgX - 50) < 0.01) {
            centeredTwoPathTiers++; // Tiers perfectamente centrados
        } else {
            console.error(`❌ Tier ${t} no está perfectamente centrado: media = ${avgX}%`);
        }
        totalTwoPathTiers++;
    }
}

const tierCenterPercentage = ((centeredTwoPathTiers / totalTwoPathTiers) * 100).toFixed(1);

console.log('\n📊 Resultados de la prueba (200 mapas generados):');
console.log(`- Mapas generados: ${NUM_RUNS}`);
console.log(`- Nodos totales: ${totalNodes}`);
console.log(`- Tiers totales evaluados: ${totalTwoPathTiers}`);
console.log(`- Tiers con media matemática en el eje 50.0%: ${centeredTwoPathTiers} (${tierCenterPercentage}%)`);
console.log(`- Cruces o nodos desconectados: ${totalDisconnected}`);
console.log(`- Fallos de bossNodeId: ${bossIdMismatches}`);

if (totalDisconnected === 0 && bossIdMismatches === 0 && parseFloat(tierCenterPercentage) === 100.0) {
    console.log('\n✅ ¡TODAS LAS PRUEBAS DE CENTRADO DINÁMICO PASARON AL 100%!');
    process.exit(0);
} else {
    console.error('\n❌ Hubo fallos en las pruebas.');
    process.exit(1);
}
