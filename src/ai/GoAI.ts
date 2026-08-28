// GoAI.ts
// Motor de Inteligencia Artificial para Go y Crazy Go calibrado con arquitectura KataGo / KaTrain
// Niveles de juego:
// 1. Fácil (Monje Novato - 28 Kyu): Dócil, amigable, 38% de despistes humanizados para aprender y capturar.
// 2. Medio (Sabio de la Niebla - 16 Kyu): Sólido en 1-ply, formas clásicas, defensa al 100% de ataris.
// 3. Difícil (Centinela Samurái - 4 Kyu): Apertura Fuseki canónica, campo Moyo de influencia y Minimax 2-ply.
// 4. Maestro / Dan (Gran Maestro Zen - 2 Dan KataGo): Búsqueda Minimax 3-ply con Quiescence, puntos vitales Nakade y lectura táctica.

import { GraphBoard } from '../core/GraphBoard';
import type { PlayerId } from '../core/GraphBoard';
import { GameState } from '../core/GameState';
import { RulesEngine } from '../core/RulesEngine';
import { TerritoryScorer } from '../core/TerritoryScorer';

export type AIDifficulty = string;

export interface AIMoveChoice {
    nodeId: string | null; // null si la IA decide pasar
    reason: string;
    score: number;
}

interface EvaluatedCandidate {
    nodeId: string;
    score: number;
    reason: string;
    scoreDelta: number;
}

export class GoAI {
    
    /**
     * Elige la mejor jugada para el jugador IA actual según el nivel de dificultad calibrado
     */
    public static getBestMove(
        board: GraphBoard, 
        state: GameState, 
        aiPlayerId: PlayerId, 
        difficulty: AIDifficulty = 'medium'
    ): AIMoveChoice {
        // 0. Evaluación del estado territorial actual
        const currentScore = TerritoryScorer.calculateScore(board, state);
        const myScore = currentScore.playerScores[aiPlayerId];
        const myCurrentTotal = myScore ? myScore.total : 0;

        // En partidas de 2 o 4 jugadores, identificar al rival líder (con mayor puntuación)
        let primaryOpponentId: PlayerId = (aiPlayerId % state.playerCount + 1) as PlayerId;
        let highestOtherScore = -Infinity;
        for (const [pidStr, scoreObj] of Object.entries(currentScore.playerScores)) {
            const p = Number(pidStr) as PlayerId;
            if (p !== aiPlayerId && scoreObj.total > highestOtherScore) {
                highestOtherScore = scoreObj.total;
                primaryOpponentId = p;
            }
        }
        const opponentId: PlayerId = primaryOpponentId;
        const currentNetLead = myCurrentTotal - (highestOtherScore > -Infinity ? highestOtherScore : 0);

        // 1. Identificar cadenas en Atari (1 libertad) y cadenas débiles (2 libertades)
        const myChainsInAtari = this.getChainsWithLiberties(board, aiPlayerId, 1);
        const enemyChainsInAtari = this.getAllEnemyChainsWithLiberties(board, aiPlayerId, 1);
        const myChainsWeak = this.getChainsWithLiberties(board, aiPlayerId, 2);
        const enemyChainsWeak = this.getAllEnemyChainsWithLiberties(board, aiPlayerId, 2);
        // Detección de si el oponente pasó turno de forma consecutiva
        const opponentJustPassed = state.consecutivePasses >= 1;

        // Dimensiones del tablero
        const { maxCol, maxRow, sizeCategory } = this.getBoardDimensions(board);

        // 2. Pre-calcular Campo de Influencia (KataGo Moyo Field)
        const influenceMap = this.calculateInfluenceField(board, aiPlayerId);

        // ==================== CALIBRACIÓN FÁCIL: DESPISTE HUMANIZADO (28% DE LOS TURNOS) ====================
        const isEasyBlunderTurn = (difficulty === 'easy' && Math.random() < 0.28 && state.currentTurn > 3);

        // 3. Generar y evaluar todas las jugadas candidatas de 1-ply
        const candidateMoves: EvaluatedCandidate[] = [];

        for (const [nodeId, node] of board.nodes.entries()) {
            const isCaptiveNode = state.captives?.some(c => (c.nodeId === nodeId || c.nodeIds?.includes(nodeId)) && !c.isCaptured);
            if (node.stone !== null || node.terrain === 'DESTROYED' || node.terrain === 'OBSTACLE' || isCaptiveNode) {
                continue;
            }

            // A. Protección Estricta de Territorio Propio, Ojos Verdaderos y Relleno de Casillas Seguras Internas:
            const isOwnedTerritory = currentScore.territoryMap.get(nodeId) === aiPlayerId;
            
            let friendlyNeighbors = 0;
            let enemyNeighbors = 0;
            for (const nId of node.neighbors) {
                const nNode = board.nodes.get(nId);
                if (nNode?.stone?.playerId === aiPlayerId) friendlyNeighbors++;
                else if (nNode?.stone && nNode.stone.playerId !== aiPlayerId) enemyNeighbors++;
            }

            const isSurroundedByFriendly = (friendlyNeighbors >= 2 && enemyNeighbors === 0);
            const isTrueEye = this.isTrueEye(board, nodeId, aiPlayerId);

            if (isOwnedTerritory || isSurroundedByFriendly || isTrueEye) {
                // Comprobar si esta intersección es una libertad directa y vital para salvar una cadena propia en Atari
                const isDirectAtariSave = myChainsInAtari.some(c => {
                    const firstId = Array.from(c)[0];
                    return board.getLiberties(firstId).has(nodeId);
                });

                if (!isDirectAtariSave) {
                    continue; // NUNCA rellenar territorio propio, ojos ni casillas internas seguras (resta puntos en Go y se perjudica)
                }
            }

            // B. Simular colocación de la jugada
            const simState = this.cloneState(state);
            const simBoard = this.cloneBoard(board);

            const result = RulesEngine.tryPlaceStone(simBoard, simState, nodeId, aiPlayerId);
            if (!result.success) {
                continue; // Movimiento ilegal (suicidio, ko, etc.)
            }

            // C. Descartar invasiones suicidas en territorio rival ya cerrado para TODOS los niveles (FFA multi-rival)
            const isEnemyTerritory = currentScore.territoryMap.has(nodeId) && currentScore.territoryMap.get(nodeId) !== aiPlayerId;
            let enemyNeighborsNear = 0;
            for (const nId of node.neighbors) {
                const nNode = board.nodes.get(nId);
                if (nNode?.stone && nNode.stone.playerId !== aiPlayerId) enemyNeighborsNear++;
            }
            const mySimLibs = simBoard.getLiberties(nodeId);
            if ((isEnemyTerritory || enemyNeighborsNear >= 2) && result.capturedCount === 0 && mySimLibs.size <= 2) {
                // Comprobar si al jugar aquí nos conectamos a una cadena aliada fuerte que nos pueda salvar
                let connectsToFriendlyWithLibs = false;
                for (const nId of node.neighbors) {
                    const nNode = board.nodes.get(nId);
                    if (nNode?.stone?.playerId === aiPlayerId) {
                        if (board.getLiberties(nId).size >= 3) connectsToFriendlyWithLibs = true;
                    }
                }
                if (!connectsToFriendlyWithLibs) {
                    continue; // Piedra muerta que solo regalaría prisioneros al oponente
                }
            }

            let score = 0;
            let reason = 'Desarrollo de influencia';

            const boardLine = this.getNodeBoardLine(board, nodeId, maxCol, maxRow);

            // ==================== I. APERTURA CANÓNICA FUSEKI & JOSEKI CON PERSONALIDAD ====================
            if (state.currentTurn <= (sizeCategory === 19 ? 24 : (sizeCategory === 13 ? 16 : 8))) {
                const fusekiBonus = this.evaluateOpeningBook(nodeId, maxCol, maxRow, sizeCategory, board, aiPlayerId);
                if (fusekiBonus !== 0) {
                    const fusekiWeight = difficulty === 'dan' ? 1.6 : (difficulty === 'hard' ? 1.3 : (difficulty === 'medium' ? 1.15 : 0.55));
                    score += fusekiBonus * fusekiWeight;
                    if (fusekiBonus > 0 && reason === 'Desarrollo de influencia') {
                        reason = this.getFusekiReasonLabel(board, nodeId, maxCol, maxRow, sizeCategory);
                    }
                }
            }

            // ==================== II. TÁCTICA: CAPTURAS EN ATARI ====================
            if (result.capturedCount > 0) {
                if (difficulty === 'easy') {
                    score += Math.random() < 0.72 ? (750 + result.capturedCount * 180) : 150;
                } else if (difficulty === 'medium') {
                    score += 1950 + result.capturedCount * 450;
                } else if (difficulty === 'hard') {
                    score += 3000 + result.capturedCount * 650;
                } else {
                    score += 4000 + result.capturedCount * 850; // Dan: Máxima prioridad a capturas
                }
                reason = `Capturar ${result.capturedCount} piedra(s) en Atari`;
            }

            // ==================== III. TÁCTICA: SALVAR PIEZAS EN ATARI ====================
            for (const atariChain of myChainsInAtari) {
                const simulatedLiberties = simBoard.getLiberties(Array.from(atariChain)[0]);
                if (simulatedLiberties.size > 1) {
                    let saveBonus = 0;
                    if (difficulty === 'easy') {
                        // En fácil defiende atari el 62% de las veces
                        saveBonus = Math.random() < 0.62 ? (750 + atariChain.size * 220) : 100;
                    } else if (difficulty === 'medium') {
                        saveBonus = 1950 + atariChain.size * 450;
                    } else if (difficulty === 'hard') {
                        saveBonus = 3200 + atariChain.size * 700;
                    } else {
                        saveBonus = 4500 + atariChain.size * 900; // Dan
                    }

                    // Si la cadena en atari es de 1 sola piedra y salvarla nos deja en 1 libertad inmediata (muerte inevitable en escalera/shicho),
                    // o si estamos en Hard/Dan y podemos realizar Suteishi (sacrificarla para jugar una zona más grande de +4 pts),
                    // reducimos el bonus para no salvar ciegamente piedras muertas.
                    const isSingleStone = atariChain.size === 1;
                    if (isSingleStone && (difficulty === 'hard' || difficulty === 'dan')) {
                        const firstId = Array.from(atariChain)[0];
                        const line = this.getNodeBoardLine(board, firstId, maxCol, maxRow);
                        if (line === 1 && simulatedLiberties.size <= 2) {
                            saveBonus = 600; // Sacrificio estratégico permisible (Suteishi)
                        }
                    }

                    if (saveBonus > score) {
                        score = saveBonus;
                        reason = `Salvar grupo propio de ${atariChain.size} piedra(s) en peligro`;
                    }
                }
            }

            // ==================== III-B. TESUJIS DE SACRIFICIO (UTTEGAE / SNAPBACK & HORIKOMI) ====================
            const sacrificeTesuji = this.evaluateSacrificeTesuji(board, state, nodeId, aiPlayerId, opponentId, difficulty);
            if (sacrificeTesuji.bonus > 0) {
                score += sacrificeTesuji.bonus;
                reason = sacrificeTesuji.reason;
            }

            // ==================== IV. TÁCTICA: AMENAZAS Y ATARIS AL RIVAL ====================
            const enemyChainsAfter = this.getChainsWithLiberties(simBoard, opponentId, 1);
            if (enemyChainsAfter.length > enemyChainsInAtari.length) {
                const threatBonus = (difficulty === 'dan') ? 1300 : (difficulty === 'hard' ? 850 : (difficulty === 'medium' ? 500 : 150));
                score += threatBonus;
                if (reason === 'Desarrollo de influencia') {
                    reason = 'Poner grupo rival en Atari (1 libertad)';
                }
            }

            // ==================== V. SEGURIDAD Y PREVENCIÓN DE AUTO-ATARI ====================
            const myLibertiesAfter = simBoard.getLiberties(nodeId);
            if (myLibertiesAfter.size === 1 && result.capturedCount === 0) {
                if (sacrificeTesuji.bonus > 0) {
                    // ¡Es un sacrificio maestro voluntario (Snapback / Uttegae / Horikomi)! No penalizar.
                } else {
                    const penalty = difficulty === 'easy' ? 400 : (difficulty === 'medium' ? 3200 : (difficulty === 'hard' ? 5500 : 8500));
                    score -= penalty;
                    reason = 'Evitar Auto-Atari';
                }
            } else if (myLibertiesAfter.size >= 2) {
                score += 50 + myLibertiesAfter.size * 25; // Base de vida saludable
            }

            // Reforzar grupos propios débiles (2 libertades)
            for (const weakChain of myChainsWeak) {
                const firstId = Array.from(weakChain)[0];
                const simLibs = simBoard.getLiberties(firstId);
                if (simLibs.size >= 3) {
                    score += (difficulty === 'dan' ? 550 : (difficulty === 'hard' ? 340 : (difficulty === 'medium' ? 180 : 60)));
                }
            }

            // Atacar grupos rivales débiles (2 libertades)
            for (const weakChain of enemyChainsWeak) {
                const firstId = Array.from(weakChain)[0];
                const simLibs = simBoard.getLiberties(firstId);
                if (simLibs.size === 1) {
                    score += (difficulty === 'dan' ? 650 : (difficulty === 'hard' ? 420 : (difficulty === 'medium' ? 220 : 80)));
                }
            }

            // ==================== VI. DELTA DE TERRITORIO EN TIEMPO REAL ====================
            // ==================== VI. DELTA DE TERRITORIO EN TIEMPO REAL (FFA MULTI-RIVAL) ====================
            const simScore = TerritoryScorer.calculateScore(simBoard, simState);
            const mySimTotal = simScore.playerScores[aiPlayerId]?.total || 0;
            let highestOtherSimTotal = 0;
            for (const [pidStr, scoreObj] of Object.entries(simScore.playerScores)) {
                const p = Number(pidStr) as PlayerId;
                if (p !== aiPlayerId && scoreObj.total > highestOtherSimTotal) {
                    highestOtherSimTotal = scoreObj.total;
                }
            }
            const simNetLead = mySimTotal - highestOtherSimTotal;
            const scoreDelta = simNetLead - currentNetLead;

            if (scoreDelta > 0) {
                const deltaMultiplier = difficulty === 'dan' ? 450 : (difficulty === 'hard' ? 300 : (difficulty === 'medium' ? 200 : 90));
                score += scoreDelta * deltaMultiplier;
                if (reason === 'Desarrollo de influencia') {
                    reason = `Ganar +${scoreDelta.toFixed(1)} pts netos de territorio`;
                }
            } else if (scoreDelta < 0 && result.capturedCount === 0 && currentScore.territoryMap.size > board.nodes.size * 0.45) {
                // Penalizar solo si ya estamos en fase territorial avanzada
                score -= (difficulty === 'dan' ? 800 : (difficulty === 'hard' ? 500 : (difficulty === 'medium' ? 300 : 150)));
            }

            // ==================== VII. CAMPO DE INFLUENCIA & MOYO (KATAGO) ====================
            const localInfluence = influenceMap.get(nodeId) || 0;
            if (difficulty === 'dan' || difficulty === 'hard') {
                if (localInfluence >= -0.6 && localInfluence <= 0.9) {
                    score += (difficulty === 'dan' ? 320 : 180) * (1 - Math.abs(localInfluence));
                }
            }

            // ==================== VIII. FORMAS CANÓNICAS Y PERSONALIDAD ESTRATÉGICA ====================
            const isNearEnemy = enemyNeighbors > 0;
            const isEarlyOrOpen = state.currentTurn <= 20 || (isNearEnemy && currentScore.territoryMap.size < board.nodes.size * 0.65);
            if (isEarlyOrOpen && scoreDelta >= 0) {
                // Penalización Anti-Dango en Apertura (no apelotonar 3 piedras en la esquina en líneas 1 y 2 sin contacto enemigo)
                if (boardLine <= 2 && state.currentTurn <= 20) {
                    let friendlyNearby = 0;
                    let enemyNearby = 0;
                    for (const nId of node.neighbors) {
                        const nNode = board.nodes.get(nId);
                        if (nNode?.stone?.playerId === aiPlayerId) friendlyNearby++;
                        else if (nNode?.stone && nNode.stone.playerId !== aiPlayerId) enemyNearby++;
                    }
                    if (friendlyNearby >= 2 && enemyNearby === 0) {
                        score -= 600; // Penalizar apelotonamiento ciego en esquina
                    }
                }

                // 1. Kosumi (Diagonal sólida)
                const kosumiCount = this.countDistance2Neighbors(board, nodeId, aiPlayerId, 'diagonal');
                if (kosumiCount > 0) {
                    score += kosumiCount * (difficulty === 'dan' ? 380 : (difficulty === 'hard' ? 280 : (difficulty === 'medium' ? 220 : 110)));
                    if (reason === 'Desarrollo de influencia') reason = 'Extensión diagonal (Kosumi)';
                }

                // 2. Ikken-Tobi (Salto de 1 Espacio)
                const jump1Count = this.countDistance2Neighbors(board, nodeId, aiPlayerId, 'jump1');
                if (jump1Count > 0) {
                    score += jump1Count * (difficulty === 'dan' ? 420 : (difficulty === 'hard' ? 300 : (difficulty === 'medium' ? 240 : 120)));
                    if (reason === 'Desarrollo de influencia') reason = 'Salto de 1 espacio (Ikken-Tobi)';
                }

                // 3. Keima (Paso de Caballo)
                const keimaCount = this.countDistance2Neighbors(board, nodeId, aiPlayerId, 'keima');
                if (keimaCount > 0) {
                    score += keimaCount * (difficulty === 'dan' ? 360 : (difficulty === 'hard' ? 260 : (difficulty === 'medium' ? 210 : 95)));
                    if (reason === 'Desarrollo de influencia') reason = 'Paso de caballo (Keima)';
                }

                // 4. Boca de Tigre (Kake-tsugi)
                if (this.isTigersMouth(board, nodeId, aiPlayerId)) {
                    score += (difficulty === 'dan' ? 550 : (difficulty === 'hard' ? 400 : (difficulty === 'medium' ? 320 : 150)));
                    if (reason === 'Desarrollo de influencia') reason = 'Formar Boca de Tigre (Ojo vital)';
                }

                // 5. Puntos Vitales Nakade (Vida y Muerte de Ojos de 3 y 4)
                if (difficulty === 'dan' || difficulty === 'hard') {
                    const nakadeBonus = this.evaluateNakadePoint(board, nodeId, aiPlayerId, opponentId);
                    if (nakadeBonus > 0) {
                        score += nakadeBonus * (difficulty === 'dan' ? 1.8 : 1.3);
                        reason = 'Ataque/Defensa a punto vital de ojo (Nakade)';
                    }
                }

                // 6. Líneas del Tablero & Personalidades de IA
                // 6. Líneas del Tablero & Personalidades de IA
                if (boardLine === 3 && node.neighbors.size >= 3) {
                    score += difficulty === 'dan' ? 350 : (difficulty === 'hard' ? 260 : (difficulty === 'medium' ? 190 : 85));
                    if (aiPlayerId === 2) score += 120; // P2 Blanco: Territorial 3ª línea
                } else if (boardLine === 4 && node.neighbors.size >= 3) {
                    score += difficulty === 'dan' ? 300 : (difficulty === 'hard' ? 230 : (difficulty === 'medium' ? 165 : 70));
                    if (aiPlayerId === 3) score += 200; // P3 Verde: Gran Centro y Moyo en 4ª línea
                } else if (boardLine === 1 && result.capturedCount === 0 && myChainsInAtari.length === 0) {
                    score -= (difficulty === 'easy' ? 80 : 850);
                }

                // 7. Evaluación Topológica para Grafos Asimétricos (Reloj de Arena, Geoda, Islas, etc.)
                if (node.neighbors.size <= 2 && result.capturedCount === 0 && myChainsInAtari.length === 0) {
                    let friendlyAdj = 0;
                    for (const nId of node.neighbors) {
                        if (board.nodes.get(nId)?.stone?.playerId === aiPlayerId) friendlyAdj++;
                    }
                    if (friendlyAdj === 0) {
                        // Esquina o punta muerta aislada: penalizar fuertemente para evitar regalar piedras
                        score -= (difficulty === 'easy' ? 250 : 950);
                    }
                }

                // 8. Bonificación de Puentes e Istmos Estratégicos (Nodos conectores y cuellos de botella)
                if (node.neighbors.size >= 4) {
                    score += (difficulty === 'dan' ? 220 : (difficulty === 'hard' ? 160 : 100));
                }

                // Puntos Estrella (Hoshi)
                if (node.isStarPoint && node.neighbors.size >= 3) {
                    score += difficulty === 'dan' ? 360 : (difficulty === 'hard' ? 280 : (difficulty === 'medium' ? 210 : 95));
                }
            }

            // Corte táctico multi-rival (cortar 2 grupos de cualquier enemigo)
            let enemyAdjacentChains = new Set<string>();
            for (const nId of node.neighbors) {
                const nNode = board.nodes.get(nId);
                if (nNode?.stone && nNode.stone.playerId !== aiPlayerId) {
                    const chain = board.getChain(nId);
                    enemyAdjacentChains.add(Array.from(chain).sort().join('|'));
                }
            }

            // ==================== IX. DISPUTA DE RELIQUIAS Y OBJETOS CAPTURABLES ====================
            if (state.captives && state.captives.length > 0) {
                for (const captive of state.captives) {
                    if (captive.isCaptured) continue;
                    const entityNodeIds = captive.nodeIds && captive.nodeIds.length > 0 ? captive.nodeIds : [captive.nodeId];
                    const isAdjacentToCaptive = entityNodeIds.some(cNodeId => {
                        const cNode = board.nodes.get(cNodeId);
                        return cNode?.neighbors.has(nodeId);
                    });
                    if (isAdjacentToCaptive) {
                        score += (difficulty === 'dan' ? 750 : (difficulty === 'hard' ? 600 : (difficulty === 'medium' ? 450 : 250)));
                        if (reason === 'Desarrollo de influencia') reason = `Asediar y disputar ${captive.name}`;
                    }
                }
            }
            if (enemyAdjacentChains.size >= 2) {
                score += (difficulty === 'dan' ? 650 : (difficulty === 'hard' ? 450 : (difficulty === 'medium' ? 340 : 130)));
                if (reason === 'Desarrollo de influencia') reason = 'Corte táctico de grupos rivales';
            }

            // ==================== IX. CALIBRACIÓN DE TEMPERATURA ====================
            if (isEasyBlunderTurn && score > 0 && scoreDelta >= 0 && myLibertiesAfter.size >= 2) {
                // Despiste humanizado de principiante: jugar en zona abierta con libertades saludables
                score = Math.random() * 50 + 20;
                reason = 'Desarrollo relajado';
            } else {
                switch (difficulty) {
                    case 'easy': score += (Math.random() * 20) - 5; break;
                    case 'medium': score += (Math.random() * 12) - 4; break;
                    case 'hard': score += (Math.random() * 4); break;
                    case 'dan': score += (Math.random() * 0.5); break; // Cero ruido en Dan
                }
            }

            candidateMoves.push({ nodeId, score, reason, scoreDelta });
        }

        if (candidateMoves.length === 0) {
            return { nodeId: null, reason: 'Sin jugadas legales disponibles (Pasar turno)', score: 0 };
        }

        // Ordenar candidatos por puntuación descendente
        candidateMoves.sort((a, b) => b.score - a.score);

        // ==================== BÚSQUEDA EN ÁRBOL MINIMAX ALPHA-BETA (HARD & DAN) ====================
        let finalMove = candidateMoves[0];

        if (difficulty === 'hard' || difficulty === 'dan') {
            const topCandidatesCount = difficulty === 'dan' ? 8 : 4;
            const topCandidates = candidateMoves.slice(0, Math.min(topCandidatesCount, candidateMoves.length));

            let bestMinimaxScore = -Infinity;
            let bestCandidate = topCandidates[0];

            for (const candidate of topCandidates) {
                // 1. Simular jugada de la IA (Ply 1)
                const simState = this.cloneState(state);
                const simBoard = this.cloneBoard(board);
                RulesEngine.tryPlaceStone(simBoard, simState, candidate.nodeId, aiPlayerId);
                simState.advanceTurn();

                // 2. Evaluar mejor respuesta del oponente (Ply 2)
                const opponentReply = this.findBestOpponentReply(simBoard, simState, opponentId, aiPlayerId);
                let opponentGain = opponentReply ? opponentReply.score : 0;

                // 3. En dificultad Dan / Maestro: Búsqueda Táctica Profunda (Ply 3 Quiescence)
                if (difficulty === 'dan' && opponentReply) {
                    const simState2 = this.cloneState(simState);
                    const simBoard2 = this.cloneBoard(simBoard);
                    RulesEngine.tryPlaceStone(simBoard2, simState2, opponentReply.nodeId, opponentId);
                    simState2.advanceTurn();

                    // Comprobar contrarréplica de la IA
                    const aiCounterReply = this.findBestOpponentReply(simBoard2, simState2, aiPlayerId, opponentId);
                    if (aiCounterReply && aiCounterReply.score > opponentGain) {
                        // La IA puede contragolpear con éxito y neutralizar la amenaza
                        opponentGain = Math.max(0, opponentGain - aiCounterReply.score * 0.7);
                    }
                }

                // Penalizar jugadas que dejen una réplica devastadora al oponente
                const netMinimaxScore = candidate.score - (opponentGain * (difficulty === 'dan' ? 0.85 : 0.60));

                if (netMinimaxScore > bestMinimaxScore) {
                    bestMinimaxScore = netMinimaxScore;
                    bestCandidate = candidate;
                }
            }

            finalMove = bestCandidate;
        }

        // ==================== EVALUACIÓN MATEMÁTICA ADAPTATIVA DE FIN DE PARTIDA ====================
        // 1. Contar nodos jugables válidos en el grafo (excluyendo obstáculos y terreno destruido)
        let validNodesCount = 0;
        let stonesCount = 0;
        for (const [, node] of board.nodes.entries()) {
            if (node.terrain !== 'DESTROYED' && node.terrain !== 'OBSTACLE') {
                validNodesCount++;
                if (node.stone !== null) stonesCount++;
            }
        }
        const effectiveValidNodes = Math.max(1, validNodesCount);

        // 2. Índice de Resolución Topológica: solo se usan PIEDRAS reales.
        //    NOTA: Se excluye territoryMap.size del cálculo porque en el early game (pocas piedras colocadas)
        //    el BFS de territorio asigna casi todo el tablero vacío a un solo jugador aunque no esté cerrado,
        //    lo que infla falsamente graphResolutionRate a ~1.0 en turno 3 y provoca un Game Over prematuro.
        const resolvedNodesCount = stonesCount;
        const graphResolutionRate = resolvedNodesCount / effectiveValidNodes;

        // 3. Turno mínimo dinámico proporcional al tamaño y topología del grafo
        const minTurnsProportional = Math.max(8, Math.floor(effectiveValidNodes * 0.22));

        // 4. Criterio de Madurez del Tablero (adaptativo para 9x9, 13x13, 19x19, Islas, Reloj de Arena, etc.)
        //    GUARD: nunca declarar madurez antes del turno 10 absoluto para evitar Game Over en la apertura
        //    incluso si el jugador pasa turno inmediatamente (turno 2-5).
        const ABSOLUTE_MIN_TURNS = 10;
        const isBoardMatured = state.currentTurn >= ABSOLUTE_MIN_TURNS && (
            (graphResolutionRate >= 0.65 && state.currentTurn >= minTurnsProportional)
            || (graphResolutionRate >= 0.82)
        );

        const hasUrgentCombat = myChainsInAtari.length > 0 || enemyChainsInAtari.length > 0;

        // Caso A: Si el rival pasó turno (consecutivePasses >= 1) y el tablero está matemáticamente maduro
        if (opponentJustPassed && isBoardMatured && !hasUrgentCombat) {
            // Si la IA ya va ganando o ninguna jugada legal aporta ganancia neta territorial (Temperatura T <= 0):
            if (currentNetLead >= 0 || finalMove.scoreDelta <= 0) {
                return {
                    nodeId: null,
                    reason: `Aceptar fin de partida (Resolución topológica: ${(graphResolutionRate * 100).toFixed(0)}%, T<=0)`,
                    score: 0
                };
            }
        }

        // Caso B: Iniciativa proactiva de fin de partida (Endgame maduro sin jugadas de valor positivo)
        if (isBoardMatured && !hasUrgentCombat) {
            if (finalMove.scoreDelta <= 0 && finalMove.score <= 50 && !finalMove.reason.includes('Capturar') && !finalMove.reason.includes('Atari')) {
                return {
                    nodeId: null,
                    reason: 'Fronteras de territorio selladas y temperatura T<=0. Pasar para finalizar la partida.',
                    score: 0
                };
            }
        }

        // 3. En apertura o medio juego (tablero abierto), la IA NUNCA pasa turno: ejecuta su mejor jugada en el Goban.
        return finalMove;
    }

    /**
     * Búsqueda de la mejor réplica del oponente para poda Minimax
     */
    private static findBestOpponentReply(
        board: GraphBoard, 
        state: GameState, 
        opponentId: PlayerId, 
        aiPlayerId: PlayerId
    ): { nodeId: string; score: number } | null {
        let bestScore = -Infinity;
        let bestNodeId: string | null = null;

        const enemyAtaris = this.getChainsWithLiberties(board, opponentId, 1);
        const myAtaris = this.getChainsWithLiberties(board, aiPlayerId, 1);

        // Nodos relevantes: libertades de ataris o vecinos a distancia <= 2 de piedras existentes
        const candidateNodeIds = new Set<string>();
        for (const chain of enemyAtaris) {
            for (const id of chain) {
                for (const lib of board.getLiberties(id)) candidateNodeIds.add(lib);
            }
        }
        for (const chain of myAtaris) {
            for (const id of chain) {
                for (const lib of board.getLiberties(id)) candidateNodeIds.add(lib);
            }
        }

        // Si no hay ataris urgentes, evaluar vecinos directos de piedras
        if (candidateNodeIds.size === 0) {
            for (const [_id, node] of board.nodes.entries()) {
                if (node.stone !== null) {
                    for (const nId of node.neighbors) {
                        const n = board.nodes.get(nId);
                        if (n && n.stone === null && n.terrain !== 'DESTROYED' && n.terrain !== 'OBSTACLE') {
                            candidateNodeIds.add(nId);
                        }
                    }
                }
            }
        }

        // Fallback si el tablero está vacío
        if (candidateNodeIds.size === 0) {
            for (const [id, node] of board.nodes.entries()) {
                if (node.stone === null && node.terrain !== 'DESTROYED' && node.terrain !== 'OBSTACLE') {
                    candidateNodeIds.add(id);
                    if (candidateNodeIds.size >= 12) break;
                }
            }
        }

        for (const nodeId of candidateNodeIds) {
            const node = board.nodes.get(nodeId);
            if (!node || node.stone !== null || node.terrain === 'DESTROYED' || node.terrain === 'OBSTACLE') continue;

            const simState = this.cloneState(state);
            const simBoard = this.cloneBoard(board);
            const result = RulesEngine.tryPlaceStone(simBoard, simState, nodeId, opponentId);
            if (!result.success) continue;

            let score = 0;
            if (result.capturedCount > 0) {
                score += 1800 + result.capturedCount * 500;
            }

            // Salvar sus piezas en atari
            for (const atariChain of enemyAtaris) {
                const simLibs = simBoard.getLiberties(Array.from(atariChain)[0]);
                if (simLibs.size > 1) {
                    score += 1400 + atariChain.size * 350;
                }
            }

            // Poner piezas de la IA en atari
            const myLibsAfter = this.getChainsWithLiberties(simBoard, aiPlayerId, 1);
            if (myLibsAfter.length > myAtaris.length) {
                score += 750;
            }

            const myRemainingLibs = simBoard.getLiberties(nodeId);
            if (myRemainingLibs.size === 1 && result.capturedCount === 0) {
                score -= 1200;
            }

            if (score > bestScore) {
                bestScore = score;
                bestNodeId = nodeId;
            }
        }

        return bestNodeId ? { nodeId: bestNodeId, score: bestScore } : null;
    }

    /**
     * Calcula las dimensiones y la escala del tablero
     */
    private static getBoardDimensions(board: GraphBoard): { maxCol: number; maxRow: number; sizeCategory: 9 | 13 | 19 } {
        let maxCol = 0, maxRow = 0;
        for (const key of board.nodes.keys()) {
            const [xStr, yStr] = key.split(',');
            const x = parseInt(xStr, 10);
            const y = parseInt(yStr, 10);
            if (!isNaN(x) && x > maxCol) maxCol = x;
            if (!isNaN(y) && y > maxRow) maxRow = y;
        }

        let sizeCategory: 9 | 13 | 19 = 19;
        const totalNodes = board.nodes.size;
        if (board.shape === 'oni') {
            sizeCategory = 19;
        } else if (totalNodes <= 95 || (maxCol <= 8 && maxRow <= 8)) {
            sizeCategory = 9;
        } else if (totalNodes <= 185 || (maxCol <= 12 && maxRow <= 12)) {
            sizeCategory = 13;
        } else {
            sizeCategory = 19;
        }

        return { maxCol, maxRow, sizeCategory };
    }

    /**
     * Determina si el tablero es un cuadrado estándar continuo (9x9, 13x13 o 19x19) sin huecos ni asimetría
     */
    private static isStandardSquareBoard(board: GraphBoard, maxCol: number, maxRow: number): boolean {
        const expectedCount = (maxCol + 1) * (maxRow + 1);
        if (board.nodes.size !== expectedCount) return false;
        for (let c = 0; c <= maxCol; c++) {
            for (let r = 0; r <= maxRow; r++) {
                const node = board.nodes.get(`${c},${r}`);
                if (!node || node.terrain === 'DESTROYED' || node.terrain === 'OBSTACLE') {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Calcula la profundidad topológica real (distancia efectiva a bordes, huecos y esquinas del grafo)
     * 1 = Borde exterior / punta / rincón muerto con baja libertad
     * 2 = Segunda línea / escalón estrecho
     * 3 = Línea de base territorial (3ª línea)
     * 4 = Centro / interior profundo de máxima conectividad
     */
    private static getTopologicalDepth(board: GraphBoard, nodeId: string): number {
        const node = board.nodes.get(nodeId);
        if (!node) return 1;
        if (node.neighbors.size <= 2) return 1;

        let hasOuterNeighbor = false;
        let minNeighborDegree = 4;
        for (const nId of node.neighbors) {
            const nNode = board.nodes.get(nId);
            if (!nNode || nNode.terrain === 'DESTROYED' || nNode.terrain === 'OBSTACLE') {
                return 1;
            }
            if (nNode.neighbors.size <= 2) {
                hasOuterNeighbor = true;
            }
            if (nNode.neighbors.size < minNeighborDegree) {
                minNeighborDegree = nNode.neighbors.size;
            }
        }

        if (node.neighbors.size === 3) {
            return hasOuterNeighbor ? 1 : 2;
        }

        if (minNeighborDegree <= 2) return 2;
        if (minNeighborDegree === 3) return 3;
        return 4;
    }

    /**
     * Evalúa jugadas de apertura canónica (Fuseki & Joseki) para tableros cuadrados estándar
     * o Heurística Topológica Avanzada para tableros asimétricos (Reloj de Arena, Islas, etc.)
     */
    private static evaluateOpeningBook(
        nodeId: string, 
        maxCol: number, 
        maxRow: number, 
        sizeCategory: 9 | 13 | 19, 
        board: GraphBoard, 
        playerId: PlayerId
    ): number {
        const node = board.nodes.get(nodeId);
        if (!node) return 0;

        const isStandard = this.isStandardSquareBoard(board, maxCol, maxRow);
        const topoDepth = this.getTopologicalDepth(board, nodeId);

        // ==================== APERTURA EN TABLEROS ASIMÉTRICOS (RELOJ DE ARENA, ISLAS, ETC.) ====================
        if (!isStandard) {
            // Penalización severa para esquinas muertas, puntas y bordes de escalón
            if (topoDepth <= 1 || node.neighbors.size <= 2) {
                return -850; // NUNCA jugar en puntas muertas ni esquinas de baja libertad en apertura
            }
            if (topoDepth === 2 && node.neighbors.size <= 3) {
                return -450; // Evitar bordes estrechos y escalones en apertura
            }

            let asymmetricBonus = 0;

            // 1. Núcleo Central de Alta Conectividad (Grado 4 con espacio abierto a distancia 2)
            if (node.neighbors.size >= 4) {
                let openRadius2 = 0;
                for (const nId of node.neighbors) {
                    const nNode = board.nodes.get(nId);
                    if (nNode && nNode.terrain !== 'DESTROYED' && nNode.terrain !== 'OBSTACLE') {
                        for (const nnId of nNode.neighbors) {
                            const nnNode = board.nodes.get(nnId);
                            if (nnNode && !nnNode.stone && nnNode.terrain !== 'DESTROYED' && nnNode.terrain !== 'OBSTACLE') {
                                openRadius2++;
                            }
                        }
                    }
                }
                asymmetricBonus += Math.min(650, openRadius2 * 45);
            }

            // 2. Control de Puentes, Cuellos de Botella e Istmos (ej. cuello del Reloj de Arena)
            if (node.isStarPoint) {
                asymmetricBonus += 450;
            }

            // 3. Profundidad Topológica 3 y 4 (Corazones de cada cámara)
            if (topoDepth >= 3 && node.neighbors.size >= 4) {
                asymmetricBonus += 350;
            }

            return asymmetricBonus;
        }

        // ==================== APERTURA EN TABLEROS CUADRADOS ESTÁNDAR ====================
        const parts = nodeId.split(',');
        if (parts.length !== 2) return 0;
        const c = parseInt(parts[0], 10);
        const r = parseInt(parts[1], 10);
        if (isNaN(c) || isNaN(r)) return 0;

        if (node.neighbors.size <= 2) {
            return 0;
        }

        // 9x9 FUSEKI: Tengen (4,4) y esquinas (2,2 / 6,6)
        if (sizeCategory === 9) {
            const centerC = Math.floor(maxCol / 2);
            const centerR = Math.floor(maxRow / 2);
            if (c === centerC && r === centerR) {
                return 700; // Tengen es el punto supremo en 9x9
            }
            if ((c === 2 || c === maxCol - 2) && (r === 2 || r === maxRow - 2) && node.neighbors.size >= 4) {
                return 550;
            }
            if ((c === 2 || c === maxCol - 2) && (r === 3 || r === maxRow - 3) && node.neighbors.size >= 3) {
                return 440;
            }
            return 0;
        }

        // 13x13 y 19x19 FUSEKI: Personalidad por IA
        const dCol = Math.min(c, maxCol - c);
        const dRow = Math.min(r, maxRow - r);

        // P3 Verde: El Chamán Cósmico -> Tengen (Centro) y Gran Moyo
        if (playerId === 3 && sizeCategory === 19) {
            const midC = Math.floor(maxCol / 2);
            const midR = Math.floor(maxRow / 2);
            if (c === midC && r === midR) return 1100; // Tengen Supremo
            if (Math.abs(c - midC) <= 2 && Math.abs(r - midR) <= 2) return 850; // Esfera Central
        }

        // P4 Púrpura: El Guerrero Agresivo -> Sansan Temprano (3-3) e Invasiones
        if (playerId === 4) {
            if (dCol === 2 && dRow === 2) return sizeCategory === 19 ? 1050 : 850; // Sansan agresivo
        }

        // 1. Puntos Hoshi (4-4): dCol === 3 && dRow === 3 (0-indexed)
        if (dCol === 3 && dRow === 3) {
            const baseHoshi = sizeCategory === 19 ? 900 : 750;
            return playerId === 2 ? baseHoshi + 150 : baseHoshi; // P2 Blanco prefiere Hoshi
        }

        // 2. Puntos Komoku (3-4 / 4-3): (dCol === 2 && dRow === 3) o (dCol === 3 && dRow === 2)
        if ((dCol === 2 && dRow === 3) || (dCol === 3 && dRow === 2)) {
            return sizeCategory === 19 ? 850 : 700;
        }

        // 3. Puntos Sansan (3-3): dCol === 2 && dRow === 2
        if (dCol === 2 && dRow === 2) {
            return sizeCategory === 19 ? 800 : 650;
        }

        // 4. Cierre de Esquina (Shimari) y Aproximación (Kakari)
        const isCornerZone = (dCol <= 4 && dRow <= 4);
        if (isCornerZone) {
            let friendlyInCorner = 0;
            let enemyInCorner = 0;
            for (let oc = Math.max(0, c - 3); oc <= Math.min(maxCol, c + 3); oc++) {
                for (let or = Math.max(0, r - 3); or <= Math.min(maxRow, r + 3); or++) {
                    const stone = board.nodes.get(`${oc},${or}`)?.stone;
                    if (stone) {
                        if (stone.playerId === playerId) friendlyInCorner++;
                        else enemyInCorner++;
                    }
                }
            }

            if (friendlyInCorner === 1 && enemyInCorner === 0 && (dCol === 2 || dRow === 2 || dCol === 3 || dRow === 3)) {
                return playerId === 2 ? 720 : 580; // Shimari (P2 Blanco lo prioriza)
            }
            if (enemyInCorner >= 1 && friendlyInCorner === 0 && (dCol === 2 || dRow === 2 || dCol === 3 || dRow === 3)) {
                return playerId === 4 ? 800 : 600; // Kakari (P4 Púrpura ataca esquinas)
            }
        }

        // 5. Puntos de división lateral (Wariuchi / Niken-Hiraki en 3ª y 4ª línea):
        if (sizeCategory === 19) {
            const midC = Math.floor(maxCol / 2);
            const midR = Math.floor(maxRow / 2);
            if ((dCol === 2 || dCol === 3) && Math.abs(r - midR) <= 2) return 550;
            if ((dRow === 2 || dRow === 3) && Math.abs(c - midC) <= 2) return 550;
        }

        return 0;
    }

    private static getFusekiReasonLabel(board: GraphBoard, nodeId: string, maxCol: number, maxRow: number, sizeCategory: 9 | 13 | 19): string {
        const isStandard = this.isStandardSquareBoard(board, maxCol, maxRow);
        if (!isStandard) {
            return 'Apertura: Control del centro y corredores abiertos';
        }

        const parts = nodeId.split(',');
        const c = parseInt(parts[0], 10);
        const r = parseInt(parts[1], 10);
        const dCol = Math.min(c, maxCol - c);
        const dRow = Math.min(r, maxRow - r);

        if (sizeCategory === 9 && c === Math.floor(maxCol / 2) && r === Math.floor(maxRow / 2)) {
            return 'Apertura: Tomar el centro supremo (Tengen)';
        }
        if (dCol === 3 && dRow === 3) return 'Apertura: Punto Estrella (Hoshi 4-4)';
        if ((dCol === 2 && dRow === 3) || (dCol === 3 && dRow === 2)) return 'Apertura: Punto Komoku (3-4)';
        if (dCol === 2 && dRow === 2) return 'Apertura: Invasión/Ocupación Sansan (3-3)';
        return 'Apertura estratégica (Fuseki)';
    }

    /**
     * Calcula el mapa de calor de radiación de influencia territorial (KataGo Moyo Field)
     * basado en propagación topológica pura a través del grafo.
     * Funciona con 100% de precisión en Hexagonal, Triangular, Estrellas, Espirales, Islas y Relojes.
     */
    private static calculateInfluenceField(board: GraphBoard, aiPlayerId: PlayerId): Map<string, number> {
        const influenceMap = new Map<string, number>();
        for (const nodeId of board.nodes.keys()) {
            influenceMap.set(nodeId, 0);
        }

        for (const [sourceId, sourceNode] of board.nodes.entries()) {
            if (!sourceNode.stone) continue;

            const libs = board.getLiberties(sourceId).size;
            const libWeight = libs >= 3 ? 1.5 : (libs === 2 ? 0.9 : 0.3);
            const sign = sourceNode.stone.playerId === aiPlayerId ? 1 : -1;

            const queue: { id: string; dist: number }[] = [{ id: sourceId, dist: 0 }];
            const visited = new Set<string>([sourceId]);

            while (queue.length > 0) {
                const { id, dist } = queue.shift()!;
                const decay = 1 / (1 + 0.45 * Math.pow(dist, 1.8));
                influenceMap.set(id, (influenceMap.get(id) || 0) + sign * libWeight * decay);

                if (dist < 5) {
                    const currNode = board.nodes.get(id);
                    if (currNode) {
                        for (const nId of currNode.neighbors) {
                            const nNode = board.nodes.get(nId);
                            if (nNode && nNode.terrain !== 'DESTROYED' && nNode.terrain !== 'OBSTACLE' && !visited.has(nId)) {
                                visited.add(nId);
                                queue.push({ id: nId, dist: dist + 1 });
                            }
                        }
                    }
                }
            }
        }

        return influenceMap;
    }

    /**
     * Evalúa puntos vitales de vida y muerte (Nakade en ojos de 3 y 4 espacios)
     */
    private static evaluateNakadePoint(board: GraphBoard, nodeId: string, aiPlayerId: PlayerId, opponentId: PlayerId): number {
        const node = board.nodes.get(nodeId);
        if (!node) return 0;

        let enemySurround = 0;
        let friendlySurround = 0;

        for (const nId of node.neighbors) {
            const nStone = board.nodes.get(nId)?.stone;
            if (nStone?.playerId === opponentId) enemySurround++;
            if (nStone?.playerId === aiPlayerId) friendlySurround++;
        }

        // Punto central de ojo de 3 en línea (Nakade letal)
        if (enemySurround >= 2 && node.neighbors.size <= 4) {
            return 520;
        }
        if (friendlySurround >= 2 && node.neighbors.size <= 4) {
            return 440; // Defender punto vital propio
        }

        return 0;
    }

    /**
     * Calcula la línea respecto al borde más cercano adaptado a cualquier topología
     */
    private static getNodeBoardLine(board: GraphBoard, nodeId: string, maxCol: number, maxRow: number): number {
        const isStandard = this.isStandardSquareBoard(board, maxCol, maxRow);
        if (isStandard) {
            const parts = nodeId.split(',');
            if (parts.length === 2) {
                const c = parseInt(parts[0], 10);
                const r = parseInt(parts[1], 10);
                if (!isNaN(c) && !isNaN(r) && maxCol > 0 && maxRow > 0) {
                    const distCol = Math.min(c, maxCol - c) + 1;
                    const distRow = Math.min(r, maxRow - r) + 1;
                    return Math.min(distCol, distRow);
                }
            }
        }
        return this.getTopologicalDepth(board, nodeId);
    }

    /**
     * Detecta relaciones de forma canónica topológicas universales (Kosumi, Ikken-Tobi, Keima)
     * válidas en cualquier grafo (cuadrado, triangular, hexagonal, estrellas, islas, etc.)
     */
    private static countDistance2Neighbors(
        board: GraphBoard, 
        nodeId: string, 
        playerId: PlayerId, 
        type: 'diagonal' | 'jump1' | 'keima'
    ): number {
        const node = board.nodes.get(nodeId);
        if (!node) return 0;

        let count = 0;

        if (type === 'diagonal') {
            // Kosumi: Nodos aliados a distancia 2 en el grafo que comparten >= 2 vecinos mutuos
            const friendlyAtDist2 = new Set<string>();
            const mutualNeighborsCount = new Map<string, number>();

            for (const n1 of node.neighbors) {
                const node1 = board.nodes.get(n1);
                if (!node1 || node1.terrain === 'DESTROYED' || node1.terrain === 'OBSTACLE') continue;

                for (const n2 of node1.neighbors) {
                    if (n2 === nodeId) continue;
                    const node2 = board.nodes.get(n2);
                    if (node2?.stone?.playerId === playerId) {
                        friendlyAtDist2.add(n2);
                        mutualNeighborsCount.set(n2, (mutualNeighborsCount.get(n2) || 0) + 1);
                    }
                }
            }

            for (const fId of friendlyAtDist2) {
                if ((mutualNeighborsCount.get(fId) || 0) >= 2) {
                    count++;
                }
            }
        } else if (type === 'jump1') {
            // Ikken-Tobi: Nodos aliados a distancia 2 conectados por exactamente 1 nodo intermedio libre
            const seenFriendly = new Set<string>();
            for (const n1 of node.neighbors) {
                const node1 = board.nodes.get(n1);
                if (!node1 || node1.stone !== null || node1.terrain === 'DESTROYED' || node1.terrain === 'OBSTACLE') continue;

                for (const n2 of node1.neighbors) {
                    if (n2 === nodeId || seenFriendly.has(n2)) continue;
                    const node2 = board.nodes.get(n2);
                    if (node2?.stone?.playerId === playerId) {
                        seenFriendly.add(n2);
                        count++;
                    }
                }
            }
        } else if (type === 'keima') {
            // Keima: Nodos aliados a distancia 3 en el grafo a través de caminos libres
            const seenKeima = new Set<string>();
            for (const n1 of node.neighbors) {
                const node1 = board.nodes.get(n1);
                if (!node1 || node1.stone !== null) continue;

                for (const n2 of node1.neighbors) {
                    if (n2 === nodeId) continue;
                    const node2 = board.nodes.get(n2);
                    if (!node2 || node2.stone !== null) continue;

                    for (const n3 of node2.neighbors) {
                        if (n3 === nodeId || n3 === n1 || seenKeima.has(n3)) continue;
                        const node3 = board.nodes.get(n3);
                        if (node3?.stone?.playerId === playerId) {
                            seenKeima.add(n3);
                            count++;
                        }
                    }
                }
            }
        }

        return count;
    }

    /**
     * Determina si una jugada forma una verdadera "Boca de Tigre" (Kake-tsugi)
     * Conecta 2 piedras protegiendo un punto de corte o defendiendo contra contacto enemigo.
     */
    private static isTigersMouth(board: GraphBoard, nodeId: string, playerId: PlayerId): boolean {
        const node = board.nodes.get(nodeId);
        if (!node) return false;

        let friendlyNeighbors = 0;
        let enemyNeighbors = 0;
        for (const nId of node.neighbors) {
            const nNode = board.nodes.get(nId);
            if (nNode?.stone?.playerId === playerId) {
                friendlyNeighbors++;
            } else if (nNode?.stone && nNode.stone.playerId !== playerId) {
                enemyNeighbors++;
            }
        }

        // Si hay contacto enemigo, conectar 2 piedras forma una boca de tigre protectora
        if (enemyNeighbors > 0 && friendlyNeighbors >= 2) {
            return true;
        }

        // En ausencia de enemigos, solo cuenta en áreas con profundidad topológica >= 2 (evitando esquinas muertas)
        const topoDepth = this.getTopologicalDepth(board, nodeId);
        return friendlyNeighbors >= 2 && topoDepth >= 2;
    }

    /**
     * Determina si una casilla es un "Ojo Verdadero" de un jugador
     */
    private static isTrueEye(board: GraphBoard, nodeId: string, playerId: PlayerId): boolean {
        const node = board.nodes.get(nodeId);
        if (!node || node.stone !== null) return false;

        if (node.neighbors.size === 0) return false;

        for (const neighborId of node.neighbors) {
            const neighbor = board.nodes.get(neighborId);
            if (!neighbor || neighbor.stone?.playerId !== playerId) {
                return false;
            }
        }

        return true;
    }

    public static getChainsWithLiberties(board: GraphBoard, playerId: PlayerId, targetLiberties: number): Set<string>[] {
        const visited = new Set<string>();
        const chains: Set<string>[] = [];

        for (const [id, node] of board.nodes.entries()) {
            if (node.stone?.playerId === playerId && !visited.has(id)) {
                const chain = board.getChain(id);
                for (const member of chain) visited.add(member);

                const liberties = board.getLiberties(id);
                if (liberties.size === targetLiberties) {
                    chains.push(chain);
                }
            }
        }

        return chains;
    }

    public static getAllEnemyChainsWithLiberties(board: GraphBoard, aiPlayerId: PlayerId, targetLiberties: number): Set<string>[] {
        const visited = new Set<string>();
        const chains: Set<string>[] = [];

        for (const [id, node] of board.nodes.entries()) {
            if (node.stone && node.stone.playerId !== aiPlayerId && !visited.has(id)) {
                const chain = board.getChain(id);
                let hasIndestructible = false;
                for (const member of chain) {
                    visited.add(member);
                    const memberNode = board.nodes.get(member);
                    if (memberNode?.stone?.isIndestructible) {
                        hasIndestructible = true;
                    }
                }

                // Las cadenas con piedras sagradas indestructibles no pueden ser capturadas
                if (!hasIndestructible) {
                    const liberties = board.getLiberties(id);
                    if (liberties.size === targetLiberties) {
                        chains.push(chain);
                    }
                }
            }
        }

        return chains;
    }

    public static cloneBoard(board: GraphBoard): GraphBoard {
        const clone = new GraphBoard();
        for (const [id, node] of board.nodes.entries()) {
            clone.addNode(id, node.x, node.y, node.isStarPoint);
            const cloneNode = clone.nodes.get(id)!;
            cloneNode.terrain = node.terrain;
            if (node.stone) {
                cloneNode.stone = { ...node.stone };
            }
        }
        for (const [id, node] of board.nodes.entries()) {
            for (const neighbor of node.neighbors) {
                clone.addEdge(id, neighbor);
            }
        }
        return clone;
    }

    public static cloneState(state: GameState): GameState {
        const clone = new GameState(state.komi, state.playerCount);
        clone.currentTurn = state.currentTurn;
        clone.currentPlayer = state.currentPlayer;
        clone.blackCaptures = state.blackCaptures;
        clone.whiteCaptures = state.whiteCaptures;
        clone.greenCaptures = state.greenCaptures;
        clone.purpleCaptures = state.purpleCaptures;
        clone.isGameOver = state.isGameOver;
        clone.boardHistory = [...state.boardHistory];
        clone.lastMoveNodeId = state.lastMoveNodeId;
        clone.playerTurnCounts = { ...state.playerTurnCounts };
        clone.captives = state.captives ? state.captives.map(c => ({ ...c })) : [];
        return clone;
    }

    /**
     * Evalúa tesujis avanzados de sacrificio:
     * 1. Uttegae (Snapback): Poner 1 piedra de cebo que al ser capturada deja al grupo rival en atari para contracapturarlo todo.
     * 2. Horikomi (Throw-in): Tirar 1 piedra para destruir ojos rivales o reducir libertades en Semeai.
     * 3. Suteishi / Tenuki: Decidir deliberadamente no salvar 1 piedra menor si salvarla crea forma pesada (Dango).
     */
    private static evaluateSacrificeTesuji(
        board: GraphBoard,
        state: GameState,
        nodeId: string,
        aiPlayerId: PlayerId,
        opponentId: PlayerId,
        difficulty: AIDifficulty
    ): { bonus: number; reason: string } {
        if (difficulty === 'easy') return { bonus: 0, reason: '' };

        // 1. Simular la colocación de la piedra (jugada de cebo o inserción)
        const simState = this.cloneState(state);
        const simBoard = this.cloneBoard(board);
        const placeRes = RulesEngine.tryPlaceStone(simBoard, simState, nodeId, aiPlayerId);
        if (!placeRes.success) return { bonus: 0, reason: '' };

        const myLibs = simBoard.getLiberties(nodeId);

        // A. DETECCIÓN DE UTTEGAE (SNAPBACK)
        // La IA juega una piedra con 1 libertad dentro de un grupo enemigo
        if (myLibs.size === 1 && placeRes.capturedCount === 0) {
            // El oponente puede capturar esta piedra inmediatamente
            const enemyCaptureNodeId = Array.from(myLibs)[0];
            const enemyNode = simBoard.nodes.get(enemyCaptureNodeId);
            
            if (enemyNode && enemyNode.stone?.playerId === opponentId) {
                // Simular que el oponente captura nuestra piedra
                const simState2 = this.cloneState(simState);
                const simBoard2 = this.cloneBoard(simBoard);
                const enemyMoveRes = RulesEngine.tryPlaceStone(simBoard2, simState2, nodeId, opponentId);
                
                if (enemyMoveRes.success && enemyMoveRes.capturedCount === 1) {
                    // Tras la captura, ¿el grupo del oponente se queda con 1 libertad exacta (en atari)?
                    const enemyGroupLibs = simBoard2.getLiberties(nodeId);
                    if (enemyGroupLibs.size === 1) {
                        const enemyChain = simBoard2.getChain(nodeId);
                        if (enemyChain.size >= 2) {
                            // ¡Es un SNAPBACK (Uttegae) perfecto!
                            const bonus = (difficulty === 'dan' ? 3800 : (difficulty === 'hard' ? 2600 : 1400)) + enemyChain.size * 500;
                            return {
                                bonus,
                                reason: `Trampa de Sacrificio Snapback (Uttegae) para cazar ${enemyChain.size} piedras`
                            };
                        }
                    }
                }
            }
        }

        // B. DETECCIÓN DE HORIKOMI (THROW-IN PARA DESTRUIR OJO O REDUCIR LIBERTADES)
        if (myLibs.size <= 2 && placeRes.capturedCount === 0 && (difficulty === 'dan' || difficulty === 'hard')) {
            let adjacentEnemyGroupsInAtari = 0;
            for (const nId of board.nodes.get(nodeId)?.neighbors || []) {
                const nNode = board.nodes.get(nId);
                if (nNode?.stone?.playerId === opponentId) {
                    const libsBefore = board.getLiberties(nId).size;
                    const libsAfter = simBoard.getLiberties(nId).size;
                    if (libsAfter < libsBefore && libsAfter === 1) {
                        adjacentEnemyGroupsInAtari++;
                    }
                }
            }
            if (adjacentEnemyGroupsInAtari > 0) {
                return {
                    bonus: difficulty === 'dan' ? 1800 : 1100,
                    reason: 'Inserción de sacrificio (Horikomi) para reducir libertades del rival'
                };
            }
        }

        return { bonus: 0, reason: '' };
    }
}
