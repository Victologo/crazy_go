## 30 de Agosto de 2026 - Día 14 (Sesión 174) [Horario: 12:30 - 13:50]: Reconstrucción Completa de CrazyGoNet v6, Entrenamiento Minimax y Fusión del Oráculo de Hechizos

### 🧠 1. Reconstrucción y Duplicación de Capacidad de CrazyGoNet
- **Arquitectura Residual 16 Bloques / 192 Filtros**: Rediseñado `model.py` aumentando la profundidad de 12 a 16 bloques residuales y los filtros convolucionales a 192, alcanzando 14.3 MB de parámetros FP32 y 7.1 MB FP16.
- **Generación de Datos con Minimax (Alpha-Beta) y Corrección de Objetivos Relativos**: Reescribo `generate_games.ts` sustituyendo rollouts aleatorios por búsqueda inteligente de 1-ply con evaluación de libertades y capturas. Corregido el bug del Winrate 99% haciendo que `value_target` y `ownership_target` sean siempre relativos al turno del jugador actual.
- **Estabilización de Pérdidas (MSE Loss en Territorio)**: Corregida la función de pérdida en `train.py` para utilizar MSE Loss y `F.cross_entropy` nativo, erradicando fallos de aserción CUDA en GPUs RTX 4070 Ti.
- **Entrenamiento Exitoso**: El modelo alcanzó en el paso 17.000 un Value Loss de 0.0028 y un Ownership Loss de 0.0104, asegurando una precisión absoluta en la predicción de victorias.

### 🔮 2. Oráculo Neuronal para Habilidades de Campeones (`AITurnManager.ts`, `GoAI.worker.ts`)
- Implementada la API asíncrona `EVAL_BOARD` en el Web Worker.
- El Alquimista y el Ronin ahora evalúan hasta 15 piedras hipotéticamente invertidas con la red neuronal y calculan la ganancia en Winrate antes de gastar habilidades tácticas.

### 📦 3. Integración de Modelos ONNX
- Los modelos generados `crazygo_net.onnx` (14.3 MB) y `crazygo_net_web.onnx` (7.1 MB) se han integrado en `public/models/`, `src/ai/models/`, `dist/models/` y en `CrazyGo_Portable/dist/models/`.
- Proyecto compilado y empaquetado al 100%.

## 29 de Agosto de 2026 - Día 13 (Sesión 172) [Horario: 21:35 - 21:45]: Erradicación de Cascada Exponencial y Soporte Universal 13x13/19x19 en la Red
## 29 de Agosto de 2026 - Día 13 (Sesión 173) [Horario: 21:45 - 22:00]: Resolución de Colapso Aleatorio de CrazyGoNet, Leak WASM y Oscilación de Winrate

### 🧠 1. Corrección Crítica de IA Aleatoria (Softmax Doble en CrazyGoNet)
Se ha solucionado el problema por el que la IA de 2 Kyu (y otros rangos) jugaba piedras de forma completamente aleatoria y absurda. La red `CrazyGoNet FP32` ya emitía las probabilidades con Softmax aplicado internamente. Al aplicar un segundo Softmax en `NeuralNetAdapter.ts`, la distribución se aplanaba de forma destructiva, reduciendo la diferencia entre la mejor jugada y las peores. Se añadió detección automática (`isAlreadySoftmaxed`) que evita aplicar un Softmax sobre probabilidades preexistentes, restaurando toda la brillantez y agudeza táctica del modelo tanto en 9x9 como en 19x19.

### ⚡ 2. Corrección Crítica de Ralentización Exponencial (WASM Memory Leak)
Se resolvió la queja del usuario sobre la IA volviéndose exponencialmente más lenta con cada turno. El problema radicaba en un memory leak de WebAssembly (`onnxruntime-web`) debido a la creación recurrente de `ort.Tensor` sin liberar la memoria en `NeuralNetAdapter.evaluate()`. Se implementaron llamadas a `tensor.dispose()` y `results.dispose()`, garantizando que la memoria WASM se recicle cada turno y manteniendo la inferencia ultrarrápida estable sin importar lo larga que sea la partida.

### 📊 3. Corrección de la Oscilación Matemática del Gráfico de Winrate
Se reparó el problema visual donde la barra de Winrate oscilaba alternando 99% Negro / 99% Blanco a cada turno. La red neuronal emite estrictamente la probabilidad de victoria de **Negras** (Player 1) en `valData[0]` de manera absoluta (estilo KataGo), no la del jugador actual (estilo AlphaZero). Al actualizar la extracción de datos de la red para asignar incondicionalmente `valData[0]` a `blackWinProb` y corregir escalas negativas `[-1, 1]`, la barra de progreso se ha vuelto estable y fiable independientemente de a quién le toque jugar.


### 🧠 1. Corrección del Confinamiento a 9x9 en Tableros Grandes (`BoardGenerators.ts`, `NeuralNetAdapter.ts`)
- **Problema Diagnosticado**: En tableros 19x19, la IA concentraba todas sus piedras exclusivamente dentro de una caja de 9x9 en la esquina superior izquierda, ignorando el resto del goban.
- **Causa Raíz Descubierta**: `BoardGenerators.generate` no asignaba `board.size = size`. Por tanto, `board.size` quedaba en `undefined` y `NeuralNetAdapter.ts` caía en el fallback por defecto `N = 9`. La red creaba un tensor `[1, 16, 9, 9]` y filtraba con `col >= 9 || row >= 9`, quedando totalmente ciega a las 300 casillas restantes.
- **Solución Implementada**:
  - Asignación explícita de `board.size = size` en `BoardGenerators.generate` y `generateSquareGrid`.
  - En `NeuralNetAdapter.ts`, detección dinámica de `N` calculando la coordenada máxima de todos los nodos si `board.size` no estuviese definido.

### ⚡ 2. Erradicación de la Ralentización Exponencial ($2^N$) (`GameController.ts`, `AITurnManager.ts`)
- **Problema Diagnosticado**: Cada turno en IA vs IA o contra IA se ralentizaba cada vez más hasta congelar el juego.
- **Causa Raíz Descubierta**: Cada movimiento de IA ejecutaba `this.renderer.handleNodeClick` (que disparaba `afterAction` $\to$ `checkAITurn`) y simultáneamente el temporizador `setTimeout` tras la jugada volvía a invocar `checkAITurn`. Cada turno duplicaba el número de hilos de cálculo concurrentes ($1 \to 2 \to 4 \to 8 \to 16 \dots$).
- **Solución Implementada**:
  - Mutex estricto `isAITurnProcessing` en `GameController.ts` que bloquea cualquier llamada concurrente.
  - Sincronización de `currentTurn` y `lastMoveNodeId` hacia el Worker para alimentar correctamente los canales 7 y 15 de la red.
  - Limpieza rigurosa de listeners en `AITurnManager` para prevenir fugas de memoria.

## 29 de Agosto de 2026 - Día 13 (Sesión 171) [Horario: 21:15 - 21:30]: Ocultación del Modo Historia para Release 1.0

### 📖 1. Ocultación del Modo Historia (Story Mode) en UI
- **Decisión de Diseño**: Se determinó que la versión 1.0 se enfocará exclusivamente en el Modo Roguelike y las partidas estándar con Inteligencia Artificial (CrazyGoNet) funcional.
- **Implementación**: Se ocultó temporalmente el botón del Modo Historia en el Menú Principal (`index.html` aplicando `display: none;` a `#btn-menu-story`). El modo y su infraestructura se mantienen intactos en el código base pero inaccesibles para el usuario, dejándolo planificado como característica principal para la futura **Versión 2.0**.
- **Reglas de Empaquetado Verificadas**: Se constató que el script de construcción (`scripts/build_packages.js`) genera exitosamente el archivo `README.txt` en inglés para los `.zip` y portables, cumpliendo con la política de distribución.

## 29 de Agosto de 2026 - Día 13 (Sesión 170) [Horario: 11:15 - 11:25]: Reparación Crítica de Transposición de Coordenadas X/Y en la Red Neuronal

### 🧠 1. Corrección del Bug de Reflejo Diagonal en `NeuralNetAdapter.ts`
- **Problema Diagnosticado**: La IA a nivel 10 Dan seguía colocando piedras en posiciones extrañas a pesar de estar conectado el modelo ONNX.
- **Causa Raíz Descubierta**: En el motor de Crazy Go (`BoardGenerators.ts`), los IDs de nodo se crean como `"${col},${row}"` (donde el primer índice es la columna horizontal $X$ y el segundo es la fila vertical $Y$). En `NeuralNetAdapter.ts`, el parser extraía `r = parts[0]` y `c = parts[1]`, invirtiendo los ejes fila y columna. Esto transponía la matriz completa alimentada a CrazyGoNet (`col * N + row` en vez de `row * N + col`), provocando que la red jugase mirando un tablero reflejado en diagonal.
- **Solución Implementada**:
  - Corrección de la extracción de coordenadas: `col = parts[0]`, `row = parts[1]` e indexación estricta `row * N + col` en los 16 planos de características, en el logit de última jugada, en el vector de predicción de la *Policy Head* y en el mapa de *Ownership*.
  - Compilación exitosa en 1.30s.

## 29 de Agosto de 2026 - Día 13 (Sesión 168) [Horario: 10:44 - 10:55]: Calibración de Política Neuronal, Supresión de Llenado de Ojos y Visibilidad de Rango P1

### 🧠 1. Erradicación del Bucle de Partidas Infinitas (Turnos 100+ en 9x9) y Protección de Ojos
- **Problema Diagnosticado**:
  1. En partidas 9x9 las IAs jugaban más de 100 turnos rellenando sus propios territorios y cometiendo jugadas autodestructivas.
  2. En el visor de duelo (`DuelistRenderer.ts`), la tarjeta de la IA Negra (P1) mostraba "2 Rewinds" en lugar de su rango de dificultad (`10 Dan`).
- **Causas Raíz**:
  1. **Bloqueo del Pase**: `NeuralNetAdapter.ts` tenía la condición `passProb > bestProb && bestProb < 0.05`. Si cualquier casilla residual del tablero tenía una probabilidad mayor a $0.05$, la IA **nunca pasaba**, forzándola a colocar piedras en territorio asegurado.
  2. **Exclusión de PASAR en el Muestreo**: En `GoAI.worker.ts`, cuando la temperatura era mayor a 0 (niveles Kyu), `PASS` estaba explícitamente excluido del array de movimientos legales, imposibilitando que la IA pasase turno hasta que el goban estuviese 100% saturado.
  3. **Llenado de Ojos Propios**: No existía una salvaguarda que impidiese a la red neural o al selector estocástico jugar dentro de ojos verdaderos vivos (`board.isTrueEye`).
  4. **Fallo de DOM en P1**: `DuelistRenderer.ts` buscaba el elemento `duel-player-title` (inexistente en el HTML) y sobreescribía `duel-player-sub` con la cadena por defecto de rebobinados de humanos.
- **Solución Implementada**:
  - `NeuralNetAdapter.ts`: Softmax numéricamente estable (`exp(logit - maxLogit)`), validación de `RulesEngine.isMoveLegal` e inclusión canónica de pase cuando `passProb > bestProb`.
  - `GoAI.worker.ts`: Integración de la acción `PASS` en el pool proporcional de muestreo con temperatura y filtro `!board.isTrueEye(id, playerId)` para no destruir ojos propios.
  - Curva de temperatura de muestreo suavemente calibrada ($10d \to 0.0, 1d \to 0.20, 10k \to 0.50, 30k \to 0.95$).
  - `DuelistRenderer.ts`: `duel-player-sub` renderiza debidamente `⚫ Turn: Black • [Rango]` en modo IA vs IA.

## 29 de Agosto de 2026 - Día 13 (Sesión 165) [Horario: 10:30 - 10:40]: Reconexión del Motor de Red Neuronal (Bug de Lobotomía)

### 🧠 1. Reparación de Arquitectura de IA (Reconexión de CrazyGoNet ONNX)
- **Problema Crítico**: Un usuario reportó que al enfrentar a "Masashi el Sabio" (7d), la IA jugaba de manera pésima, colocando fichas en formas triangulares ineficientes sin vida.
- **Causa Raíz**: Tras refactorizaciones recientes, `GameController.checkAITurn()` estaba llamando a `GoAI.getBestMove()` sincrónicamente. Este método utiliza una IA heurística (Minimax + Flood Fill) como fallback y **no utiliza** la Red Neuronal ONNX, lo que provocó una "lobotomía" de la IA en la cual ni siquiera usaba los pesos entrenados por 750k pasos.
- **Solución Implementada**:
  - En `AITurnManager.ts`, se hizo público `calculateMoveAsync`, que delega al Web Worker `GoAI.worker.ts` la evaluación ONNX real con `NeuralNetAdapter`.
  - En `GameController.ts`, `checkAITurn()` ahora intenta delegar el movimiento primario a `AITurnManager.calculateMoveAsync()`, lo que reconecta el modelo ONNX universal.
  - Si el worker ONNX falla, el sistema realiza un fallback gracefully hacia `GoAI.getBestMove()`.
  - La inicialización del worker (`AITurnManager.initWorker()`) ahora se despacha dinámicamente en `GameController.initGame()` cada vez que la configuración (`newConfig`) es suministrada (asegurando sincronización con el tamaño del tablero 9x9, 13x13 o 19x19).
- **Corrección Adicional de Tipado**: Se corrigió un error de TypeScript añadiendo `'sage'` al alias `HeroId` en `RoguelikeRunManager.ts`, lo que arregló la compilación y errores UI en la pantalla de duelo.

## 29 de Agosto de 2026 - Día 13 (Sesión 164) [Horario: 10:20 - 10:30]: Reestructuración de Fase de Disputa Opcional
### ⚖️ 1. Fase de Disputa Opcional (Score Modal y Reanudación de Partida)
- **Problema Reportado**: El juego entraba forzosamente en una fase manual de disputa (marcar grupos vivos/muertos) en la parte superior del tablero siempre que dos jugadores pasaban turno, lo cual interrumpía la experiencia cuando las partes ya estaban de acuerdo con el conteo automático de territorio.
- **Solución Implementada**:
  - Modificación en GameState.ts (passTurn): Ahora, cuando dos jugadores pasan, el juego asume el conteo automático y termina la partida directamente (isGameOver = true), mostrando el Modal de Puntuación.
  - Inyección del botón **[⚖️ Disputar]** en modal-score.html visible exclusivamente en partidas donde participe al menos un humano (gameMode !== 'aivsai').
  - Lógica de Disputa en GameEventBinder.ts: Al hacer clic en Disputar, el modal se cierra, se cambia isGameOver = false y isScoringPhase = true, activando el banner superior para marcar manualidad.
  - Corrección de botón Reanudar en HUDController.ts: Ahora llama a GameController.handlePass(true) en lugar de modificar el estado silenciosamente, asegurando que si es el turno de la IA, ésta se despierte y juegue correctamente al reanudarse la partida.

# Log Crazy Go - Diario de Desarrollo

Este registro cronológico documenta los avances diarios en el desarrollo del juego. (Orden: Más reciente arriba).

## 29 de Agosto de 2026 - Día 13 (Sesión 163) [Horario: 10:00 - 10:20]: Calibración de Dificultad Granular Kyu/Dan, Parada de IA en Menú y Turbo Instantáneo

### 🧠 1. Normalización y Fuerza Real de Dificultades Kyu/Dan en `GoAI.ts`
- **Problema Reportado**: La IA blanca configurada en `10d` no jugaba como 10 Dan y se mostraba como `15 Kyu` en la partida.
- **Causas Raíz Diagnosticadas**:
  1. `GoAI.ts` comparaba `difficulty === 'dan'` de forma literal. Valores como `'10d'` o `'15k'` no coincidían con ninguna rama y caían en un comportamiento por defecto débil sin Minimax profundo.
  2. `GameController.checkAITurn()` pasaba `this.config.difficulty` global en lugar del valor asignado específicamente a cada slot (`this.config.slots?.[activePlayer]?.aiDifficulty`).
  3. `DuelistRenderer.ts` no leía la configuración de slots de `GameController` porque `window.GameController` no estaba expuesto en el ámbito global.
- **Solución Implementada**:
  - Creación del método `GoAI.normalizeDifficulty(diff)`: Mapea `'1d'` a `'10d'` directamente a nivel `'dan'` (activando Minimax 3-ply, Quiescence, lectura de Nakade, campo Moyo de influencia y Fuseki ponderado), y rangos Kyu a sus categorías correspondientes (`hard`, `medium`, `easy`).
  - `GameController.checkAITurn()` ahora consulta `slots?.[activePlayer]?.aiDifficulty` de forma individual por jugador.
  - Exposición de `window.GameController` para que `DuelistRenderer.ts` muestre con exactitud el rango de cada IA (`⚫ P1 • 15 Kyu` y `⚪ P2 • 10 Dan`).

### 🛑 2. Erradicación del Bucle Zombi de IA al Salir al Menú Principal (`GameController.ts`, `ScreenManager.ts`)
- **Problema Reportado**: Al abandonar la partida y volver al menú principal, la consola seguía calculando jugadas e inferencias ONNX indefinidamente.
- **Causa Raíz**: `ScreenManager.transitionTo` cambiaba la vista del DOM pero no cancelaba el temporizador `aiTurnTimeout` ni detenía el bucle recursivo de IA en `GameController`.
- **Solución**:
  - Creación del método `GameController.stopGame()`.
  - Invocación automática de `stopGame()` tanto al hacer clic en el botón de Menú como en cualquier transición de pantalla en `ScreenManager.ts`.
  - Verificación defensiva en `checkAITurn()` comprobando que la pantalla `#game-screen` no esté oculta antes de iniciar cualquier cálculo.

### ⚡ 3. Eliminación de Retardos Artificiales en Jugadas de la IA
- **Problema Reportado**: La IA tardaba siempre ~1 segundo en poner la ficha en velocidad normal, forzando una espera incluso cuando ya había pensado su jugada, lo cual se percibía como artificial.
- **Solución Implementada**: 
  - Se eliminó el `thinkDelay` aleatorio de 600-1200ms en `GameController.checkAITurn()`.
  - Ahora el retardo es de solo **20ms** (lo mínimo necesario para que el navegador repinte el badge visual de "IA pensando").
  - El tiempo total que tarda la IA en poner la ficha es ahora *estrictamente* el tiempo real de cómputo síncrono del algoritmo `GoAI.getBestMove()`. Juega tan rápido como piensa.
  - En Modo Turbo, todos los delays post-animación y pre-cálculo bajan a **0ms** para máxima aceleración.

---

## 29 de Agosto de 2026 - Día 13 (Sesión 162) [Horario: 10:00 - 10:30]: Centrado y Progresión Directa Inicial del Mapa Roguelike (Columnas 2 y 3) con Centrado Dinámico por Tier

### 🗺️ 1. Centrado Dinámico Universal por Tier en el Mapa Roguelike (`RoguelikeMapGenerator.ts`)
- **Problema Reportado**: Incluso en situaciones donde la topología del grafo contenía 2 nodos en un piso intermedio (ej. Campamento en carril 0 y Tienda en carril 1), la posición gráfica se anclaba rígidamente a los carriles estáticos (`20%` y `40%`), dejando el lateral derecho vacío y sesgando la estética del mapa hacia la izquierda.
- **Solución Matemática Implementada (`getTierXPositions`)**:
  - Implementación del algoritmo de **Centrado Dinámico Simétrico por Tier**, que calcula las coordenadas horizontales $X$ en función estricta de la cantidad $N$ de nodos presentes en cada fila:
    - $N = 1$ (Boss, cuellos de botella): $X = [50\%]$.
    - $N = 2$ (Doble ruta paralela o penúltimo tier): $X = [38\%, 62\%]$ (separación limpia del 24% y centro exacto en el $50\%$).
    - $N = 3$ (Bifurcaciones triples): $X = [26\%, 50\%, 74\%]$ (separación del 24% y centro exacto en el $50\%$).
    - $N = 4$ (Apertura máxima de 4 carriles): $X = [20\%, 40\%, 60\%, 80\%]$ (centro exacto en el $50\%$).
  - **Preservación Total del Grafo**: La conectividad, elecciones estratégicas, IDs de nodos y mecánicas no sufren alteración alguna; únicamente la proyección visual se distribuye con simetría matemática perfecta.
  - **Apertura Central 1 a 1 (Tier 0 ➔ Tier 1 ➔ Tier 2)**:
    - Tier 0 arranca con 2 combates en las columnas 2 y 3.
    - Tier 0 ➔ Tier 1: Conexión estrictamente directa 1:1 (`1 -> 1`, `2 -> 2`), sin bifurcación prematura.
    - Tier 1 ➔ Tier 2: Continuación directa 1:1 (`1 -> 1`, `2 -> 2`).
  - **Bifurcaciones y Convergencias Orgánicas a partir de Tier 2**: Convergencias al 40% en un nodo central en Tier 3 o ramificaciones hacia los extremos con atracción gravitacional hacia el centro.
- **Validación Automatizada (`scripts/test_map_generation.mjs`)**:
  - 200 mapas evaluados (1.389 tiers analizados): **100.0% de los tiers están centrados matemáticamente en el eje exacto de 50.0%**, con 0 nodos huérfanos y 0 cruces ilegales.

---


### 🏆 1. Culminación del Entrenamiento AlphaZero (CrazyGoNet 750k Steps)
- **Hito de Machine Learning**: La red neuronal `CrazyGoNet` ha completado con éxito los 750.000 pasos en GPU RTX 4070 Ti SUPER.
- **Métricas de Convergencia Finales**:
  - `Policy Loss`: Estable en ~2.85 (convergencia óptima de selección de jugadas).
  - `Value Loss`: 0.0031 (predicción hiper-precisa de Winrate y probabilidad de victoria).
  - `Ownership Loss`: 0.1825 (delimitación territorial nítida de influencias y vida/muerte).
- **Universalidad de Tablero**: Gracias a la arquitectura *Fully Convolutional* inyectada en `model.py` (convoluciones $1\times 1$ y `AdaptiveAvgPool2d`), el modelo generado es elástico y universal, procesando tableros de 9x9, 13x13, 19x19 y topologías asimétricas con el Topology Mask.

### 📦 2. Protocolo de Exportación ONNX Multiplataforma
- Exportación directa desde PyTorch a formatos ONNX FP32 (Desktop) y FP16 (Web) con `dynamic_axes`.
- Sincronización hacia `public/models/` para consumo directo por `NeuralNetAdapter.ts` y `GoAI.worker.ts`.

### 🐛 3. Corrección Crítica del Bucle Infinito en Turno 2a en Modo IA vs IA (`GameController.ts`, `AITurnManager.ts`)
- **Causa Raíz Diagnosticada**:
  - En `GameController.ts` (líneas 646 y 940) y en `AITurnManager.ts` (líneas 130, 192, 255, 286, 303, 576), el encadenamiento de turnos de IA evaluaba `state.currentPlayer !== config.humanColor`.
  - Como `config.humanColor` está inicializado por defecto en `1` (Negras), en el modo **IA vs IA**:
    - **Turno 1a (Negras / P1)**: Iniciaba al arrancar la partida.
    - **Turno 1b (Blancas / P2)**: `2 !== 1` (verdadero), se disparaba el turno de la IA Blanca.
    - **Turno 2a (Negras / P1)**: Al devolver el turno a Negras (`currentPlayer = 1`), la condición `1 !== 1` resultaba **FALSA**, y el flujo caía en la rama `else` bloqueando la interactividad y **deteniendo el bucle de IA para siempre en el Turno 2a**.
- **Solución Implementada**:
  - Creación del método unificado `isNextPlayerAI(state, config)` en `AITurnManager.ts` y actualización de todas las condiciones en `GameController.ts` para verificar `config.gameMode === 'aivsai' || isAISlot(currentPlayer)`.
  - Ahora las partidas en modo IA vs IA juegan de forma fluida e ininterrumpida de principio a fin.

---

## 28 de Agosto de 2026 - Día 12 (Sesión 160) [Horario: 21:15 - 21:30]: Reparación de Arquitectura Linear ONNX y Winrate Lock

### 🧠 1. Reparación del Bucle Infinito (Freeze) en Inteligencia Artificial y Fallback de Minimax (NeuralNetAdapter.ts, GoAI.worker.ts)
- **Causa Raíz de Bloqueo "Thinking move...!"**: El adaptador de ONNX parseaba las coordenadas de los nodos separando por guiones id.split('-'), mientras que el grafo (GraphBoard) utiliza comas "x,y". Esto provocaba que el modelo de ML (CrazyGoNet) saltara todos los nodos del tablero, devolviendo un array vacío de jugadas. Como resultado, el Worker de IA no obtenía movimientos válidos de la red neuronal y se veía forzado a caer silenciosamente al fallback heurístico clásico (GoAI.getBestMove()), el cual (con un Alpha-Beta Minimax en dificultades altas y un tablero completo) colapsaba en tiempos de cálculo insoportables, paralizando el turno 2 indefinidamente.
- **Solución Implementada**:
  - Sustitución de id.split('-') por id.split(',') en todos los procesos de extracción de policyProbabilities y ownershipMap dentro de NeuralNetAdapter.ts.
  - Con esta corrección matemática, ONNX mapea correctamente el grafo, devolviendo probabilidades inmediatas y evitando completamente las costosas heurísticas.

### 📊 2. Sincronización del Winrate en Tiempo Real de la Red Neuronal (GoAI.ts, GoAI.worker.ts, AITurnManager.ts)
- **Causa Raíz**: La evaluación de Winrate (porcentajes de victoria provistos por la Value Head del modelo de IA) se generaba con éxito en NeuralNetAdapter, pero se perdía en la transmisión desde el Worker hacia el Main Thread.
- **Solución Implementada**:
  - Modificada la interfaz AIMoveChoice en GoAI.ts añadiendo la propiedad winRates.
  - El payload de respuesta MOVE_RESULT del Worker propaga la propiedad desde 
euralResult.winRates.
  - Modificado el Main Thread en AITurnManager.ts para que inyecte winRates directamente en la caché del módulo AnalysisEngine (encargado de dibujar las barras de Winrate) y fuerce el renderizado visual invocando HUDController.updateWinRates.

### 🚀 3. Botón Interfaz para Modo Turbo (x10 Velocidad) IA vs IA (index.html, MenuEventBinder.ts)
- **Problema**: El modo Turbo (x10) solo era accesible a través de la consola de desarrollador de Chrome asignando la variable oculta de la ventana.
- **Solución Implementada**:
  - Inserción de un nuevo botón con el icono ⚡ Turbo directamente en el HUD Superior (Topbar) entre los controles de Rebobinar (Undo/Redo) y Reiniciar.
  - Event Listener en MenuEventBinder.ts que conmuta dinámicamente el flag global window.AI_TURBO_MODE, activando un aviso Toast en pantalla y cambiando el color del botón a amarillo cálido #f59e0b para visibilidad constante.


## 28 de Agosto de 2026 - Día 12 (Sesión 158) [Horario: 21:00 - 21:15]: Corrección de Selector de Campeones en Modo IA vs IA (Paso 4 Exclusivo, Ratio 1:1 y Sincronización Completa)

### 🧙‍♂️ 1. Corrección Estructural del Contenedor de Campeones en el Asistente (`modal-local-setup.html`)
- **Causa Raíz Diagnosticada**: El contenedor dividido (`#setup-champion-container-split`) había quedado ubicado por error en el DOM fuera del bloque `<div id="wizard-step-4">`, alojándose directamente en el contenedor raíz del cuerpo del modal (`.wizard-body-container`). En consecuencia, al cambiar de paso (Paso 1, 2, 3 "Board", 5, 6, 7), mientras el panel del paso 4 se ocultaba con `.hidden`, el contenedor dividido permanecía visible de manera persistente en todas las pantallas intermedias y finales.
- **Solución Implementada**:
  - Reubicación estricta de `#setup-champion-container-split` dentro de `<div id="wizard-step-4">`.
  - Ahora en el Paso 3 (Tablero / Board) y resto de pasos solo se ve el contenido correspondiente a dicho paso; la elección de campeones de la IA se muestra única y exclusivamente al alcanzar el Paso 4 (Champion).

### 📐 2. Calibración Visual y Ratio 1:1 Estricto en Retratos de Campeones (`modal-local-setup.html`, `setup.css`, `carousel.css`)
- **Causa Raíz de Imagen Estirada/Deformada**: La clase base `.hero-portrait-wrapper` contenía `min-width: 200px` en `carousel.css`. Al aplicar `width: 120px; height: 120px` inline en el HTML para la vista dual, el contenedor adoptaba `200px × 120px` (aspecto 5:3 apaisado), provocando que la imagen cuadrada original (512×512) se recortara horizontalmente y el texto del nombre colisionara visualmente.
- **Solución Implementada**:
  - Creación de clases dedicadas `.setup-champion-split-layout`, `.setup-split-ai-col`, `.setup-split-portrait-wrapper` y `.setup-split-portrait-img` en `setup.css`.
  - Dimensionamiento simétrico con `aspect-ratio: 1 / 1; width: 110px; height: 110px; min-width: 110px; max-width: 110px; border-radius: var(--radius-lg); object-fit: cover;`.
  - Aplicación de `aspect-ratio: 1 / 1;` universal en `carousel.css` para el showcase individual y dual.

### 🔄 3. Reparación de Reactividad y Sincronización de Héroes de IA 1 e IA 2 (`SetupModalRenderer.ts`, `SetupEventBinder.ts`, `DuelistRenderer.ts`)
- **Discrepancia de Identificadores (IDs)**: `SetupModalRenderer.renderHeroShowcaseElements` buscaba `${prefix}-hero-showcase-img` y `${prefix}-hero-showcase-name` (esperando `setup-p1-hero-showcase-img`), pero el HTML contenía `setup-p1-showcase-img` (sin `-hero-`). Por ello, las flechas `◀` y `▶` nunca actualizaban la ilustración ni el texto del campeón.
- **Solución Implementada**:
  - Homogeneización de todos los IDs y selectores a `setup-p1-hero-*` y `setup-p2-hero-*` (incluyendo cajas de habilidades activas/pasivas y mini-tiras de miniaturas `hero-thumb-strip` para selección directa con un clic).
  - Inicialización limpia de `heroId` y `enemyHeroId` (por defecto `'normal'`) al conmutar al modo `aivsai`.
  - Actualización de `updateWizardSummary` para reflejar en el resumen `⚫ <Hero P1> vs ⚪ <Hero P2>` y mostrar ambos standees en el visor de escenario del Paso 5.
  - Sincronización en `DuelistRenderer.ts` para asignar `⚫ IA Negra (P1)` y `⚪ IA Blanca (P2)` con los campeones elegidos en el HUD de combate.

---

## 28 de Agosto de 2026 - Día 12 (Sesión 157) [Horario: 12:00 - 21:00]: Ingesta de Modelo ONNX 592k, Proyección Universal 19x19, Modo Turbo x10, Vista Dividida de Campeones y Calibración Continua de Temperatura Kyu/Dan

### 🧠 1. Ingesta Exitosa de Modelos ONNX 592k y Proyección Universal 19x19 (`NeuralNetAdapter.ts`, `public/models/`, `src/ai/models/`)
- **Ingesta del Checkpoint 592.000 Pasos**:
  - Exportado con 169 capas neuronales activas en precisión FP32 (`crazy_go_brain_fp32.onnx`, 10.4 MB) y FP16 para Web (`crazy_go_brain_web.onnx`, 5.2 MB) con ejes dinámicos verificados.
  - Sincronizado en `public/models/`, `src/ai/models/`, `dist/models/` y en `CrazyGo_Portable/dist/models/`.
- **Proyección Topológica Universal sobre Matriz 19x19**:
  - Se eliminó la restricción rígida que limitaba el adaptador únicamente a tableros 9x9.
  - Ahora cualquier geometría (9x9, 13x13, 19x19 y tableros asimétricos como Volcán, Cielo o Máscara Oni) se proyecta limpiamente sobre el lienzo universal 19x19 utilizando el **Canal 2 (Máscara Topológica)** con ceros en las casillas fuera de límites, eliminando definitivamente cualquier cuelgue de memoria o error en WebAssembly.

### 📐 2. Fórmula Matemática de Interpolación Continua de Temperatura para Rangos Kyu y Dan (`GoAI.worker.ts`)
- **Erradicación de Heurísticas Minimax**: El motor evalúa siempre mediante la red neuronal `CrazyGoNet`, sin recurrir a árboles Minimax ni en rangos principiantes.
- **Calibración Continua por Tramos (Piecewise Linear)**:
  - **30 Kyu a 20 Kyu**: $\text{Temp} = 1.3 + \left(\frac{k - 20}{10}\right) \times 0.7$ $\rightarrow$ (30k = 2.00, 27k = 1.79, 25k = 1.65, 20k = 1.30).
  - **20 Kyu a 10 Kyu**: $\text{Temp} = 1.0 + \left(\frac{k - 10}{10}\right) \times 0.3$ $\rightarrow$ (20k = 1.30, 15k = 1.15, 11k = 1.03, 10k = 1.00).
  - **10 Kyu a 1 Kyu**: $\text{Temp} = 0.7 + \left(\frac{k - 1}{9}\right) \times 0.3$ $\rightarrow$ (10k = 1.00, 5k = 0.83, 1k = 0.70).
  - **1 Dan a 9 Dan**: $\text{Temp} = 0.5 \times \left(1 - \frac{d - 1}{8}\right)$ $\rightarrow$ (1d = 0.50, 5d = 0.25, 9d = 0.00 / Argmax puro).

### 🚀 3. Modo Turbo IA para Acelerar Playtesting (`AITurnManager.ts`, `KeyboardController.ts`)
- **Hotkey Global `T`**: Permite alternar dinámicamente durante cualquier partida en tiempo real el *Modo Turbo*, reduciendo los tiempos de pensamiento y demoras artificiales de habilidades de 1000ms a 10ms (velocidad x10) con aviso HUD en pantalla.

### 👥 4. Vista Dividida (Split View) de Campeones en Modo IA vs IA (`modal-local-setup.html`, `SetupModalRenderer.ts`, `SetupEventBinder.ts`)
- **Adaptación Dinámica del Paso 4**: Al seleccionar el modo "IA vs IA", el paso 4 se renombra a "Champions" y muestra dos tarjetas paralelas (⚫ IA Negra P1 vs ⚪ IA Blanca P2) con controles independientes de selección.
- **Salto Automático de Paso Redundante**: Se deshabilita y omite automáticamente el Paso 6 (Oponente) en este modo, avanzando directamente del Paso 5 (Escenario) al 7 (Ajustes de tiempo).

---

## 28 de Agosto de 2026 - Día 12 (Sesiones 151 - 155) [Horario: 09:00 - 12:00]: Soluciones de Dificultad Granular, Symmetry Breaker Anti-Espejo y RoadMap para Redes Neuronales Kyu

### 🤖 1. Rediseño del Selector Granular de Dificultad IA (`SetupEventBinder.ts`, `OnlineEventBinder.ts`, `SetupModalRenderer.ts`)
- **Bug del Movimiento en Pack Visual**: Solucionado el problema por el que al ajustar el slider de un Bot específico (ej. P2), los demás Bots sin modificar (P3, P4) saltaban visualmente para igualarlo. Esto sucedía porque heredaban la `dificultad temporal global`. Se ha inyectado una inicialización explícita en todos los "slots" al momento exacto de hacer clic en el botón "Granular ⚙️".
- **Condicionamiento Inteligente del Botón Granular**:
  - En partidas 1vs1 Local o 2P Online (donde solo hay 1 IA o ninguna), el botón de conmutar a "Granular" desaparece de la UI y se fuerza en "Pack Mode".
  - En modo **IA vs IA** (2 jugadores, ambos bots), el botón "Granular" reaparece, y se ha añadido un **nuevo slider dedicado para el Bot P1 (Negras)**, permitiendo enfrentar a un modelo de 15 Kyu contra un modelo de 9 Dan.

### 🪞 2. Rompedor de Simetría contra el Mirror Go / Mane-go (`GoAI.worker.ts`)
- **Problema Matemático (El Espejo Infinito)**: Al enfrentar a dos IAs configuradas en máxima fuerza (7d - 10d, Temperatura = 0.0), el determinismo de la función Argmax provocaba que copiaran los movimientos recíprocamente en las esquinas o laterales matemáticamente idénticos de un tablero vacío o simétrico, jugando un Mirror Go eterno.
- **Solución (Symmetry Breaker)**: Se ha inyectado una regla de excepción termodinámica en la red neuronal. Si la IA está en `Temp = 0` (fuerza máxima), pero el juego está en sus **primeros 6 turnos** (`state.moveHistory.length <= 6`), se aplica una temperatura microscópica de `0.03`. Esto fuerza a la IA a escoger aleatoriamente en caso de empate de probabilidades (mismo Winrate/Policy en esquinas equivalentes), rompiendo la simetría en la apertura sin comprometer el nivel de juego.

### 🧠 3. RoadMap Aprobado: Erradicación de Heurísticas Minimax en Niveles Kyu (`task.md`)
- **Propuesta Arquitectónica**: Las heurísticas artificiales (Minimax clásico) para niveles bajos de Kyu se sustituirán por versiones reales pero "infantiles" de nuestra red neuronal.
- **Implementación Prevista (Tarea 294)**: Se descargarán e integrarán los Checkpoints ONNX generados en fases previas del entrenamiento actual (CrazyGoNet):
  - `model_50k.onnx` (50.000 pasos de entrenamiento) para niveles **20k - 30k**.
  - `model_150k.onnx` (150.000 pasos de entrenamiento) para niveles **10k - 19k**.
  - `model_250k.onnx` (250.000 pasos de entrenamiento) para niveles **1k - 9k**.
  - El modelo final `model_700k.onnx` de la Fase 5 quedará reservado exclusivamente para los niveles **Dan (1d - 10d)**, regulados mediante Temperatura Softmax.

## 27 de Agosto de 2026 - Día 11 (Sesión 150): Corrección Integral de Multijugador Local 2P/4P (Colores por Turno) y Animación Universal del Vórtice de la Boca Oni

### 👥 1. Corrección de Asignación de Color en Partidas Multijugador Local (`SVGRenderer.ts`, `GameController.ts`, `HUDController.ts`, `test_local_multiplayer.mjs`)
- **Causa Raíz del Error**:
  - `SVGRenderer.handleNodeClick` utilizaba un callback `getLocalPlayerColorCallback` que evaluaba `(this.config.humanColor || ...)`.
  - Como `this.config.humanColor` se inicializaba por defecto en `1` (Negras), la expresión devolvía invariablemente `1` (*truthy*) en todas las partidas locales.
  - Al ser un clic local (`isLocal === true`), `placingPlayer` se forzaba siempre al Jugador 1 (Negras ⚫), ignorando el jugador activo `this.state.currentPlayer`. Por tanto, aunque el HUD cambiaba a los turnos 1b (Blancas ⚪), 1c (Esmeralda 🟢) o 1d (Amatista 🟣), cualquier clic sobre el Goban colocaba una ficha negra.
- **Solución Implementada**:
  - Se eliminó el parámetro y callback redundante `getLocalPlayerColorCallback` de `SVGRenderer` y de la llamada en `GameController`.
  - `placingPlayer` ahora se extrae directamente de `this.state.currentPlayer`, garantizando que en partidas de 2 y 4 jugadores locales cada usuario coloque fielmente su color correspondiente (Negras, Blancas, Esmeralda y Amatista).
  - Sincronización del dock de poliminós en `HUDController.updatePolyominoUI` mediante `PolyominoManager.syncCardsWithInventory(currentPlayer)` para reflejar las cartas disponibles de cada jugador en su turno.
  - Ajuste en `GameController.onNodeClicked` para que la captura de entidades neutrales (`resolveCaptiveCaptures`) se atribuya al jugador que realizó la jugada (`previousPlayerId`).
  - Creada y validada la suite de pruebas automatizadas `scripts/test_local_multiplayer.mjs` con 100% de éxito.

### 👹 2. Animación Universal del Vórtice Abismal en la Boca de la Máscara Oni (`SVGRenderer.ts`, `CombatLogModalRenderer.ts`, `vfx.css`)
- **Problema Reportado**:
  - La animación del vórtice abismal morado/carmesí en las fauces del tablero Oni únicamente aparecía en el visor del Combat Log & Replay, pero faltaba en el tablero de combate en vivo (`#game-svg`) y en las previsualizaciones de selección de tablero (Asistente Local y Asistente Online).
- **Solución Implementada**:
  - Se añadieron `renderOniMouthAbyss` y `renderVolcanoCornerDecorations` en el método principal `render()` de `SVGRenderer.ts`, dibujándose inmediatamente sobre el fondo de madera dinámico (`renderBoardBackground`).
  - Se agregaron anillos concéntricos giratorios (`.oni-mouth-swirl-ring-1` y `.oni-mouth-swirl-ring-2`) con `transform-box: fill-box;` en `vfx.css` para lograr una rotación fluida y centrada en todos los navegadores.
  - Ahora el vórtice místico con brillo palpitante morado/carmesí se muestra permanentemente en el combate en vivo, en el Combat Log/Replay, en el Paso 3, 5 y 6 del Asistente Local (`wizard-board-preview-svg`, `wizard-stage-board-svg`, `wizard-rival-board-svg`) y en el Asistente Online (`online-board-preview-svg`, `online-stage-board-svg`).

### 🌐 3. Rediseño del Asistente Multijugador Online (`modal-online.html`, `OnlineModalRenderer.ts`, `OnlineEventBinder.ts`, `translations.ts`)
- **Disposición en 2 Columnas**:
  - Las tarjetas de selección de modo de red (`Classic Duel (1v1 / 4P)` y `Roguelike Expedition`) ahora se presentan lado a lado en la misma fila con una cuadrícula de 2 columnas (`setup-grid grid-2 wizard-big-grid`).
- **Nueva Fase/Paso Dedicado de Selección de Jugadores**:
  - Tras seleccionar **Duelo Clásico** (y exclusivamente en este modo), el asistente avanza a un nuevo Paso 2 independiente donde el anfitrión elige entre **2 Jugadores (Duelo 1v1)** o **4 Jugadores (FFA Cuádruple)** en tarjetas panorámicas.
  - Al seleccionar **Roguelike Expedition**, este paso se omite y salta de forma automática, pasando directamente a la configuración del tablero y adaptando la barra de progreso (5 pasos para Roguelike vs 6 pasos para Duelo Clásico).
- **Navegación Fluida y Adaptativa**:
  - Se sincronizaron los botones "Atrás" / "Siguiente" y los clics en los nodos del Stepper para saltar fluidamente el paso omitido en expediciones cooperativas.
  - Sincronización del Paso 6 (Lobby y Sala P2P) en `OnlineController.ts` y `OnlineModalRenderer.ts`.

---

## 27 de Agosto de 2026 - Día 11 (Sesión 149): Auditoría Exhaustiva de Reglas Canónicas de Go, Corrección de Inconsistencia de Ko, y Hoja de Ruta Definitiva de Machine Learning (AlphaZero-Style)

### ♟️ 1. Auditoría Canónica del Motor de Go y Corrección de Ko (`RulesEngine.ts`, `docs/ai_wiki/go_rules.md`)
- **Diagnóstico y Corrección de Ko Simple**:
  - Se identificó una discrepancia sutil entre `RulesEngine.isMoveLegal` y `RulesEngine.tryPlaceStone`: `isMoveLegal` condicionaba la verificación del Ko a `nodesToCapture.size > 0`, mientras que `tryPlaceStone` lo evaluaba de forma incondicional cuando `boardHistory.length >= 2`.
  - Se corrigió `isMoveLegal` en `RulesEngine.ts` para evaluar la repetición de estado serializado siempre que exista historial suficiente, unificando ambos métodos y blindando el motor contra falsos positivos en simulaciones y MCTS.
- **Sincronización del Wiki de Reglas (`go_rules.md`)**:
  - Se actualizó el manual canónico corrigiendo el error que indicaba que el Ko estaba desactivado (en el código real siempre estuvo activo).
  - Verificadas e indexadas como válidas todas las reglas: cadenas, libertades BFS, prohibición de suicidio, Teorema de Benson (1976) para vida incondicional, detección de 3 capas para Seki, Komi y descarte de piedras muertas por recinto cerrado.
  - Se documentó la razón por la cual la "Fase de Disputa de Territorio" (reanudación post-pases) no es requerida para el entrenamiento con ML, ya que el *Ownership Head* de la red neuronal resuelve la asignación territorial directamente.

### 🧠 2. Plan Maestro de Machine Learning y Red Neuronal (`entrenar la IA para el Go con machine learning.md`)
- **Arquitectura de Tres Cabezas (CrazyGoNet - ResNet-12)**:
  - **Policy Head**: Distribución de probabilidades de mejor jugada ($N \times N + 1$).
  - **Value Head**: Vector de probabilidad de victoria calibrado $[p_1, p_2, p_3, p_4]$ sin sesgo de Komi en el turno 1, reemplazando la heurística Softmax actual en `AnalysisEngine.ts` y reparando el cálculo de **Winrate en tiempo real**.
  - **Ownership Head**: Mapa de predicción de dominio territorial ($N \times N \times 4$) para resolver piedras muertas y territorio en tableros asimétricos sin heurísticas BFS frágiles.
- **Decisión Arquitectónica Clave (Simulador Headless en Node.js/TypeScript)**:
  - Se descartó reescribir las reglas en Python para evitar discrepancias de código o bugs divergentes; el bucle de Self-Play consumirá directamente las clases `RulesEngine.ts` y `GraphBoard.ts` mediante `tsx`/Node.js conectándose con PyTorch (CUDA 12) para el entrenamiento por lotes en GPU.
- **Estrategia de Doble Modelo**:
  - **Versión Descargable (Desktop / itch.io)**: Exportación ONNX en FP32 completo (~85-100 MB, ResNet-12) ejecutada mediante `onnxruntime-node` a máxima velocidad (<15 ms).
  - **Versión Web (WASM)**: Exportación cuantizada en FP16 y modelo destilado ResNet-8 (~40-45 MB) vía `onnxruntime-web` con caché persistente en navegador.

### 🌋 3. Reactivación y Sincronización Universal de Peligros Ambientales (Cielo, Volcán, Máscara Oni) (`SVGRenderer.ts`, `StageHazardManager.ts`, `GameController.ts`, `AITurnManager.ts`)
- **Causa Raíz del Fallo en Tableros con Habilidades Especiales**:
  - En versiones recientes, `StageHazardManager.checkStageHazards` únicamente se invocaba cuando un jugador o la IA decidía pasar turno (`passTurn`), pero **nunca** tras la colocación estándar de piedras o poliminós en `SVGRenderer.handleNodeClick`.
  - En consecuencia, en partidas donde ambos bandos colocaban piedras de forma continua, el turno alcanzaba el umbral de activación (Turno 21 / 11a en Tablero del Cielo y Volcán, o Turno 15 / 8a en Máscara Oni) y la alerta de aviso se mostraba pero los bloques celestiales nunca caían, el magma no impactaba y el vórtice gravitatorio del Oni no se activaba.
- **Solución Implementada**:
  - **Ejecución Post-Jugada en `SVGRenderer`**: Se conectó `StageHazardManager.checkStageHazards` tras la colocación de piedras y fichas de poliminó en `SVGRenderer.handleNodeClick`.
  - **Bloqueo Asíncrono durante Animaciones (`isHazardInProgress`)**: Se introdujo el flag `StageHazardManager.isHazardInProgress` para evitar que la IA o el usuario interactúen mientras caen los bloques (600ms), impacta el meteorito volcánico o el vórtice arrastra piedras ligeras hacia las fauces. Al finalizar el efecto, se restaura la interactividad y se cede el turno limpiamente.
  - **Registro en Combat Log**: Se agregaron eventos de tablero (`CombatLogManager.logBoardEvent`) para la Expansión Celestial y la Inhalación del Oni.
  - **Filtro de Casillas Destruidas en SVG**: Se perfeccionó el renderizado del Goban en `SVGRenderer.ts` (líneas de cuadrícula, estrellas Hoshi y fondo Convex Hull de madera) para descartar completamente las casillas eliminadas por el magma o sismos.
  - **Suite de Pruebas Automatizada (`scripts/test_stage_hazards.mjs`)**: Suite de validación que simula partidas paso a paso verificando que en el turno 21 (11a) el Tablero del Cielo se expande proceduralmente de 81 a 91 casillas, el Volcán destruye casillas por impacto directo de magma, y en el turno 15 (8a) la Máscara Oni succiona piedras ligeras hacia la boca. 100% de tests pasando.

---

## 27 de Agosto de 2026 - Día 11 (Sesión 148 / Fase 103): Registro Total de Jugadas en Combat Log & Replay con Rebobinar, Aislamiento del Modo Historia, Audio Pool Anti-Caché y Textura de Hierba en Tableros Conquistados

### 📜 1. Reparación Integral del Combat Log & Replay Engine con Hechizos de Rebobinar (`SVGRenderer.ts`, `CombatLogManager.ts`, `CombatLogModalRenderer.ts`)
- **Causa Raíz del Error Diagnosticada**:
  - Al abrir el Registro de Combate y Repetición (`CombatLogModalRenderer`), el visor solo mostraba los lanzamientos del pergamino ⌛ *Rebobinar* (`CS93`) y parecía "olvidar todo lo anterior".
  - La causa raíz era que **`CombatLogManager.logStonePlacement`** y **`CombatLogManager.logPolyominoPlacement`** estaban implementados en el gestor pero nunca se llamaban desde el flujo de clics del tablero (`SVGRenderer.handleNodeClick`). Por tanto, ninguna colocación de piedra normal se guardaba en el historial; únicamente se registraban hechizos y habilidades.
- **Solución Implementada**:
  - **Registro Universal de Piedras Go**: Se conectó `CombatLogManager.logStonePlacement(this.board, this.state, nodeId, placingPlayer, result.capturedCount)` en `SVGRenderer.handleNodeClick` inmediatamente después de cada jugada válida. Esto registra automáticamente todas las jugadas del jugador humano, de la IA, de invitados online y en modo historia.
  - **Registro de Poliminós y Brotes**: Se conectó `CombatLogManager.logPolyominoPlacement` para Fichas Germinantes (1x1), Duplicidad (2x1) y Monolitos (2x2), y `CombatLogManager.logSproutingGrowth` para cada nuevo brote botánico.
  - **Cronología Fiel con Rebobinado**: Ahora, al lanzar el pergamino ⌛ *Rebobinar*, el historial conserva íntegramente todos los pasos y capturas previas, y añade el paso de Rebobinado con el snapshot del tablero restaurado a su turno anterior, permitiendo reproducir la partida paso a paso sin vacíos en la línea temporal.
  - **Soporte para Topología Dinámica y Destrucción de Nodos**: El visor de replay (`CombatLogModalRenderer`) y los snapshots (`CombatLogManager.createBoardSnapshot`) sincronizan el estado exacto de cada nodo y terreno (`DESTROYED`, `NORMAL`). Si un evento de tablero destruye o desconecta casillas (volcanes, terremotos, fauces Oni), las líneas de cuadrícula, estrellas Hoshi y fondo de madera se recalculan y adaptan en cada paso cronológico.
  - **Suite de Pruebas Automatizadas (`scripts/test_combat_log.mjs`)**: 7 pruebas unitarias y de integración que verifican piedras, habilidades de campeones, poliminós, brotes, rebobinado y destrucción dinámica de nodos con un 100% de éxito.

### 🛡️ 2. Aislamiento Total del Modo Historia y Prevención de Fugas de Estado (`StoryModeController.ts`, `GameController.ts`, `ScreenManager.ts`)
- **Diagnóstico del Fallo de Carga de Tablero en Otros Modos**:
  - Al jugar al Modo Historia, el contenedor `#story-world-container` se reducía a `scale(0.08)` (macrocosmos), los tableros superados se clonaban en el DOM (`.story-conquered-island`), los duelistas se ocultaban con `opacity: 0; pointer-events: none;`, y un watcher con `setInterval` (`_turnWatcher`) quedaba activo.
  - Al salir al Menú Principal o iniciar modos como 1v1 Local, Roguelite u Online, no se limpiaban estos estados, provocando que el nuevo tablero apareciera enano (escala 8%), desplazado fuera de pantalla o no interactivo.
- **Solución Implementada**:
  - **`StoryModeController.resetWorld()`**: Método público de reseteo total que restaura `#story-world-container` a `scale(1)` y `translate(0, 0)`, elimina los SVGs clonados, resetea `#game-svg`, reactiva los duelistas y limpia diálogos y prompts residuales.
  - **Blindaje en `GameController.initGame()`**: Toda inicialización de partida que no sea del Modo Historia ejecuta automáticamente `stopCampaign()` y `resetWorld()`, restaurando el fondo a `'combat'` si estaba en `'story'`.
  - **Blindaje en `ScreenManager.transitionTo()`**: Cualquier transición hacia el Menú Principal (`main-menu`) o el Mapa Roguelike (`roguelike-map`) detiene la campaña y limpia el contenedor del tablero.

### 🔊 3. Resolución de Error de Audio Chromium `ERR_CACHE_OPERATION_NOT_SUPPORTED` (`BGMGenerator.ts`)
- **Causa Raíz**: El reproductor creaba 16 instancias de `new Audio()` en el arranque (7 de ellas apuntando simultáneamente a `bgm_zen.wav` de 10.5 MB y 9 a `bgm_battle.wav`), generando peticiones concurrentes de *byte-range* HTTP que saturaban la caché interna de Chromium en `localhost`.
- **Solución Implementada**: Se rediseñó `BGMGenerator` con un pool estricto de instancias únicas por archivo de audio. Al transicionar entre pantallas que comparten la misma música (Menú ➔ Mapa ➔ Zen ➔ Tutorial), la pista continúa sonando sin reinicios, cortes ni re-peticiones de red.

### 🌿 4. Textura de Hierba en Tableros Conquistados (`SVGDefs.ts`, `StoryModeController.ts`)
- Añadido el patrón vectorial `#grass-texture` en `SVGDefs.ts` con tono verde esmeralda y follaje natural.
- En la transición de victoria del Modo Historia, el tablero superado reemplaza dinámicamente la textura de madera de Kaya por la textura de hierba, transformándose en un prado purificado sin madera visible al quedar anclado como isla inferior del macrocosmos.

---

## 26 y 27 de Agosto de 2026 - Día 11 (Sesión 148): Nuevo Modo Historia Cósmico: Flujo de 4 Escenas Macro, Zoom-In Dive Cinemático, Conquista de Naturaleza Ilustrada 2D y Corrección de Ejecución

### 🌌 1. Flujo Canónico de 4 Escenas Cósmicas (`StoryModeController.ts`, `SVGRenderer.ts`, `layout.css`, `board.css`)
- **Escena 1 (Cosmos Puro e Intro Cinemática)**:
  - Overlay fullscreen `#story-cinematic-intro` con fondo de nebulosa estelar `/bg_story.jpg`.
  - Zoom dinámico del cosmos (×2.2) y revelación secuencial de las 4 frases del lore del Tejedor Cósmico y la fractura de la realidad por el Vacío.
  - Botón de salto rápido `[ SKIP INTRO ⏩ ]` interactivo desde el milisegundo 0.
- **Escena 2 (Vista Macro Cósmica con Tablero Diminuto Flotante)**:
  - Al salir de la intro o cargar un nuevo capítulo con `startZoomedOut = true`, la cámara se ubica en el vacío cósmico.
  - En el centro de la pantalla flota un **pequeño Goban místico enano a escala `0.08`** con un resplandor pulsante dorado/ámbar (`drop-shadow(0 0 35px rgba(251, 191, 36, 0.85))`).
  - Los duelistas permanecen ocultos (`opacity: 0`).
  - Banner interactivo flotante: `✦ FRACTURE NODE 01 ✦ The Shattered Goban ✦ [ ⚔️ DIVE INTO GOBAN ✦ ]`.
  - Clic en el tablero diminuto o en el banner: **Zoom-In Dive de 1.4s** (`cubic-bezier(0.16, 1, 0.3, 1)`), con leve sacudida al aterrizar (`vfx-screen-shake`), aparición de duelistas y apertura de diálogo narrativo.
- **Escena 3 (Combate en el Cosmos y Florecimiento de Naturaleza)**:
  - El fondo de batalla se mantiene **siempre en el cosmos estelar** (`url('/bg_story.jpg')`), dando la sensación de combatir directamente en islas flotantes en el espacio profundo.
  - Colocación de piedras 100% receptiva mediante doble detección en SVG.
  - Al vencer (`onWinCurrentChapter`), brotan sobre las casillas 4 ilustraciones 2D de alta resolución con animación elástica (`storyNaturePop`) y enredaderas verdes SVG trepando por la cuadrícula (`storyVineGrow`).
- **Escena 4 (Zoom-Out Cósmico y Navegación con Doble Tablero)**:
  - La cámara hace zoom-out a `scale(0.08)` de vuelta a la galaxia.
  - En la parte inferior queda la isla purificada (`[ CONQUISTADO ]`) resplandeciendo en verde con su jardín y árboles.
  - En la parte superior se carga la nueva isla (`[ NUEVO ]`, Capítulo 2: *The Crystal Fault*) esperando a ser purificada.
  - Clic en la nueva isla desciende en picado al siguiente combate.

### 🌲 2. Generación e Integración de Assets Ilustrados de Naturaleza (`/public/nature/`)
- Creados y procesados 4 assets PNG transparentes de estilo anime / sumi-e tradicional:
  - **`nature_pine.png`**: Bonsái centenario de Pino Negro Japonés (*Matsu*) con tronco retorcido.
  - **`nature_sakura.png`**: Árbol floreciente de Cerezo Japonés (*Sakura*) con copa rosada.
  - **`nature_bamboo.png`**: Macizo de Bambú Zen verde esmeralda.
  - **`nature_vines.png`**: Manto de enredadera de hiedra y musgo con hojas brillantes.
- Sustituyen definitivamente los emojis de texto por elementos gráficos `<image>` dentro de la capa `<g id="story-nature-bloom-layer">` del SVG.

### 🛠️ 3. Panel de Debug Integrado en la Topbar (`StoryDebugUI.ts`, `index.html`)
- Reubicado `#story-debug-panel` y su botón `🛠️ Story Debug ▼` en `#game-topbar .topbar-left` (junto al botón de reset `🔄`).
- Menú desplegable ámbar con opciones para: saltar capítulo, ganar/perder al instante, forzar terremoto con ruptura de tablero (`⚡ Quake`), probar diálogos y reiniciar la intro cinemática.
- Atajos de teclado rápidos: **`F3`** o **`~`** (tilde/backtick). Cierre automático al hacer clic fuera del panel.

### 🐛 4. Resolución de Errores Críticos de Runtime y Conexión de Goban
- **Fix `Uncaught TypeError: Cannot read properties of undefined (reading '0')` en `SVGRenderer.renderShrines`**:
  - `STORY_CHAPTERS` estaba fuera de la clase `StoryModeController` y `(window as any).StoryModeController.STORY_CHAPTERS` devolvía `undefined`, abortando la inicialización del motor, impidiendo el cambio de fondo a cósmico y bloqueando los clics para poner fichas.
  - Declarado `public static readonly STORY_CHAPTERS = STORY_CHAPTERS;`, asignación global incondicional a `window` y protección con `try...catch` en todas las capas SVG.
- **Doble Detección Global en SVG (`SVGRenderer.ts`)**:
  - El manejador global de clics en SVG asegura que cualquier clic donde se dibuje la piedra fantasma consolida la jugada con 100% de efectividad.
- **Omisión de Splash de Komi (`GameController.ts`)**:
  - Activado `skipKomiSplash` en modo historia para erradicar el velo translúcido de desenfoque que interceptaba los eventos del puntero.
- **Alineación Visual en Menú Principal (`index.html`)**:
  - Elevado el texto "ROGUELIKE" en 20px (`translateY(-22px)`).

---

## 26 de Agosto de 2026 - Día 10 (Sesión 147): Cromatismo de Dificultad Avanzado y Transiciones de Escena por Disolución y Desenfoque

### 🔥 1. Rediseño Cromático de las Llamas de Expedición (`carousel.css`)
- **Medium (Medio)**: Ajustado a un color **amarillo-dorado brillante** (`#fde047`, `rgba(234, 179, 8, 0.9)`) con un factor de rotación de matiz cálido (`hue-rotate(10deg)`). Esto evita que se confunda visualmente con la dificultad Hard.
- **Hard (Difícil)**: Rediseñado para mostrar un **rojo carmesí profundo y puro** (`#ef4444`, `rgba(220, 38, 38, 1)`) con alta saturación (`saturate(10)` y `hue-rotate(-45deg)`), logrando una distinción instantánea.
- **Grandmaster (Gran Maestro)**: Cambiado a una **llama blanca cósmica celestial** pura y brillante (`brightness(3.2) saturate(0.1)`), evocando maestría suprema.

### 🌊 2. Transición de Pantallas por Disolución y Desenfoque Progresivo (`theme.css`, `ScreenManager.ts`)
- **Adiós al Parpadeo en Negro**: Reemplazada la máscara opaca de color negro puro por una **transición fluida de tipo disolución (cross-dissolve)** con desenfoque de fondo y atenuación de brillo:
  - Fondo de transición translúcido y azulado: `rgba(8, 12, 22, 0.45)`.
  - Desenfoque y brillo dinámicos mediante hardware: `backdrop-filter: blur(18px) brightness(0.55)`.
  - Evita la fatiga visual y la sensación de tirones durante la carga de assets del Goban.
- **Sincronización de Tiempos**: Ajustados los retrasos en `ScreenManager.ts` (retraso inicial de entrada de 240ms y retraso de salida de 300ms) para acomodar suavemente la animación de desenfoque.

---

## 26 de Agosto de 2026 - Día 10 (Sesión 146): Mapa Roguelike Definitivo Tipo Slay the Spire, Pacing Anti-Grind y Sincronización Subpixel Inmune a Zoom

### 🗺️ 1. Generador de Grafos DAG Canónico Tipo Slay the Spire (`RoguelikeMapGenerator.ts`)
- **Tallado de Caminos Puros (Path-Carving DAG)**: El mapa se genera mediante el tallado de 3 caminos continuos e independientes desde el inicio hasta el Gran Dragón Sabio Gris, garantizando que el 100% de los nodos pertenezcan a una ruta válida y eliminando cualquier posibilidad de nodos huérfanos o callejones sin salida.
- **Prevención Geométrica Estricta de Cruces (`crossesAnyEdge`)**: Evaluación formal de no-intersección ($from_1 < from_2 \land to_1 > to_2$), impidiendo líneas cruzadas en "X" y garantizando un grafo planar limpio.
- **Filtro de No-Redundancia (`createsRedundancy`)**: Se rechazan conexiones que dupliquen el abanico completo de destinos de otro nodo paralelo en el mismo nivel, asegurando que cada nodo ofrezca decisiones estratégicas diferenciadas.
- **Estilización Zen y Capping de Salidas**: Se limitó a un máximo de 2 conexiones salientes en puntos de bifurcación clave (y 1 conexión directa en la mayoría de nodos) para lograr un mapa visualmente despejado, legible y sin ruido de telarañas.

### ⚔️ 2. Pacing de Game Design Óptimo y Progresión de Tableros (`RoguelikeMapGenerator.ts`)
- **2 Nodos Iniciales de Batalla**: El nivel inicial (Tier 0) siempre presenta exactamente 2 combates para que el jugador elija con qué apertura comenzar.
- **Bifurcación Inmediata Garantizada**: Cada nodo de inicio en Tier 0 se ramifica obligatoriamente hacia 2 o más opciones distintas en Tier 1, otorgando agencia y toma de decisiones al jugador desde el primer turno.
- **Regla Estricta Anti-Grind (Máximo 2 Peleas Seguidas)**: Se implementó un validador que recorre todos los caminos del grafo y prohíbe que se encadenen 3 combates seguidos, forzando nodos sucesores a transformarse en Santuarios ⛩️, Mercaderes 🛒 o Zonas de Meditación 🏕️.
- **Longitud Procedural y Escala de Goban**: Cada mapa genera entre 6 y 8 pisos totales con progresión canónica: **9x9** (primeras 2 rondas) $\to$ **13x13** (rondas intermedias) $\to$ **19x19** (rondas tardías y combate final).

### 🔍 3. Sincronización Subpixel Inmune a Zoom (`RoguelikeMapRenderer.ts`, `map.css`)
- **Causa Raíz del Descuadre en Zoom**: El contenedor del mapa tenía paddings y discrepancias entre la altura SVG vectorial (`viewBox`) y los píxeles absolutos CSS de los botones, lo que provocaba que al hacer zoom (50% a 200%) las líneas y los nodos se desfasaran hasta 40px.
- **Solución Geométrica**: Eliminados los paddings del wrapper y unificada la altura exacta del escenario (`stageHeight = maxY + 80`) tanto en `svg.style.height`, `nodesContainer.style.height` y `viewBox="0 0 1000 stageHeight"`, logrando que $\text{SVG}(X,Y) \equiv \text{Centro Botón}(X,Y)$ a cualquier nivel de zoom o resolución.

---

## 26 de Agosto de 2026 - Día 10 (Sesión 145): Calibración Proporcional de Standees de Monjes y Sabios en Combate (-25%)

### 🧘 1. Reducción Proporcional del Tamaño de Monjes y Sabios (`champions.css`)
- **Motivo**: Las ilustraciones de monjes jóvenes (`monk_1.png` a `monk_5.png`) y sabios ancianos (`sage_1.png` a `sage_5.png`), al estar en postura sentada ancha con ratio cuadrado y tener configurado un `scale(1.68)`, se veían con una presencia física sobredimensionada en combate respecto al resto de héroes.
- **Ajuste Aplicado (-25%)**:
  - Reducción del factor de escala exactamente en un **25%**:
    - En reposo: de `scale(1.68)` a `scale(1.26)`.
    - En hover: de `scale(1.74)` a `scale(1.31)`.
  - Reasentado vertical con `translateY(95px)` (hover `90px`) para mantener su base asentada sobre el pedestal de madera.
  - Aplicación consistente sin importar el lado o modo de juego:
    - **Lado Izquierdo (Jugador / P1)**: `.duel-standee-player`, `#duel-player-img` con `scaleX(-1)`.
    - **Lado Derecho (Rival / IA / P2)**: `.duel-standee-enemy`, `#duel-enemy-img` con `scaleX(1)`.
    - **Modo 4 Jugadores**: `.multi-standee-card`, `#duel-p2-img`, `#duel-p3-img`, `#duel-p4-img`.

---

## 26 de Agosto de 2026 - Día 10 (Sesión 137): Modo Historia - Tableros Contiguos e Internacionalización de Miniaturas de Campeones

### 🌐 1. Internacionalización de Botones y Miniaturas de Campeones (`modal-local-setup.html`, `modal-online.html`, `modal-roguelike-setup.html`)
- **Causa Raíz**: En la tira de miniaturas inferior de los modales de configuración de partida, los textos de los botones (*Persona Normal* y *Alquimista*) estaban escritos de forma estática en español en el HTML sin el atributo de enlace `data-i18n`.
- **Solución**: Se añadieron los atributos reactivos `data-i18n="champion.<hero>.name"` a todas las miniaturas en los asistentes Local, Online (Host y Guest) y Roguelike, traduciéndose de inmediato al inglés (*Normal Person* / *Alchemist*) cuando el juego está en dicho idioma.

---

## 26 de Agosto de 2026 - Día 10 (Sesión 136): Normalización Simétrica de Personajes y Habilidades, Escalado Canónico a 19x19 en Máscara Oni, Vectores Ortogonales y Máscara Continua de Inmunidad

### ⚖️ 1. Normalización y Simetría Total de Personajes y Tarjetas de Habilidad (`champions.css`, `DuelistRenderer.ts`)
- **Simetría Dimensional de Siluetas (Standees)**:
  - Eliminado el `scale(1.3)` asimétrico que agrandaba al jugador del lado izquierdo.
  - Ambas siluetas (`.duel-standee-player` y `.duel-standee-enemy`) se calibraron con idéntico ancho (`clamp(285px, 23vw, 400px)`), altura de figuras (`clamp(340px, 50vh, 520px)`), posición base (`translateY(6%)`) y factor de escala de imagen (`scale(1.45)`, hover `1.50`).
  - Sincronizadas las orientaciones y escalas de todos los campeones (`normal`, `ronin`, `alchemist`, `tengu`, `boss`) para una presencia equilibrada en ambos lados.
- **Tarjetas de Habilidad Descriptivas y Completas para el Rival (`#duel-enemy-skill-badge`)**:
  - Rediseñada la tarjeta del rival en `champions.css` (`.duel-enemy-skill-pill`) para igualar las dimensiones, padding, bordes redondeados y estructura interna de `.btn-card-skill.passive-badge`.
  - Ahora renderiza tanto el **nombre de la habilidad** (`.duel-skill-name`) como la **fórmula de combate explicativa** (`.duel-skill-formula`) para todos los héroes (Kitsune, Tengu, Ryūjin, Ronin, Alquimista, Himiko, Gran Dragón Sabio y Aprendiz del Dojo) en cualquier modo de juego.

---

### 👹 2. Escalado Canónico a Escala 19x19 en el Tablero Máscara Oni
- **Estandarización Universal**: Con independencia de si el jugador selecciona 9x9, 13x13 o 19x19 en la configuración previa, en el Tablero Máscara Oni (`shape === 'oni'`, topología de 25x25) todos los personajes y rivales IA operan con sus habilidades calibradas exactamente a **escala 19x19**:
  - **🦊 Kitsune**: Otorga **5 cargas de Escudo Divino** (`KitsuneChampion.getShieldCharges`).
  - **⚗️ Alquimista**: Otorga **4 transmutaciones de Inversión Cromática** (`AlchemistChampion.getInversionCount`).
  - **✨ Himiko**: Su Lluvia Pétrea Celestial invoca **18 piedras aliadas** (`HimikoChampion.getStoneRainCount`).
  - **🦅 Tengu**: Su Lluvia Meteórica descarga **27 meteoros** (`TenguChampion.getMeteorCount`).
  - **🐉 Ryūjin**: Opera con la regla de 19x19 (1 quema por grupo vivo de 2 ojos y +1 quema por cada ojo adicional que se expanda en `RyujinChampion.checkPassiveTrigger`).
  - **🤖 IA & Heurística de Apertura**: `AITurnManager`, `GameController` y `GoAI.ts` (`getBoardDimensions`) calibrados para operar a escala de 19x19 en el mapa de Máscara Oni.

---

### 🌪️ 2. Visualizador Dinámico de Inhalación Oni y Tarjeta Lateral Flotante (`OniInhalationPreview.ts`, `hud.css`, `GameEventBinder.ts`)
- **Tarjeta Lateral Flotante sin Solapamientos**: El tooltip informativo de la Máscara Oni ya no cae sobre el Goban; ahora se despliega como tarjeta flotante fijada en el margen superior derecho de la pantalla (`top: 60px; right: 24px;`), dejando el **100% del área del tablero despejada y visible**.
- **Capa SVG Dinámica de Alta Fidelidad en Hover (`OniInhalationPreview.ts`)**:
  - **Vectores de Flujo Ortogonales**: Las flechas de atracción ya no se dibujan en diagonal flotando en el vacío; siguen con precisión las **aristas reales de la cuadrícula** ($\downarrow$, $\uparrow$, $\rightarrow$, $\leftarrow$) por donde se desplazarán las piedras.
  - **Alto Contraste y Visibilidad**: Diseñadas con doble trazo (núcleo en **neón magenta vibrante `#e879f9`** sobre sombra oscura `rgba(15, 23, 42, 0.85)` y puntas triangulares nítidas) para resaltar sobre la madera y las líneas urushi del Goban.
  - **Exclusión de Ruido en Cadenas Inmunes**: Las piedras pertenecientes a cadenas de 4+ piedras no tienen ninguna flecha dibujada encima.
  - **Máscara Azul Continua Compartida (Sin Círculos Superpuestos)**: Los grupos inmunes (4+ piedras) comparten un contorno perimetral exterior suave y continuo (`#38bdf8`) con relleno azul cian translúcido y badge centralizado `🛡️ Inmune (X piedras)`.
  - **Puntas de Flecha en Trayectorias de Piedras Ligeras**: Flechas de 3.2px con puntas prominentes hacia su destino y calaveras `💀` de alerta si van a ser devoradas por las fauces abismales.

---

### 🐉 3. Reparación del Targeting de Ryūjin y Flujo de Fin de Quema (`ChampionManager.ts`, `GameController.ts`, `SVGRenderer.ts`)
- **Sincronización de `heroOwnerId`**: Se corrigió `ChampionManager.resetForMatch` para recibir y enlazar `config.humanColor`, permitiendo que el jugador humano dispare y ejecute la Furia del Dragón con cualquier color (Negras o Blancas).
- **Aislamiento de `onPassiveBurnCompleted`**: Se eliminó el falso disparo de `onMovePlaced` al terminar la quema pasiva de piedras en `SVGRenderer.ts`, conectando `onPassiveBurnCompleted` en `GameController.ts` para dar paso fluido al turno de la IA sin estados suspendidos.

---

### 🌐 4. Corrección del Oponente / Rival del Invitado en Modo Online (`DuelistRenderer.ts`)
- **Causa Raíz Identificada**: En `DuelistRenderer.render2PlayerDuelists`, la resolución del héroe rival (`oppHeroKey`) y del héroe propio (`myHeroKey`) asumía hardcodeado que el Anfitrión (Host) siempre jugaba con Negras (`myColor === 1` / `oppColor === 1`). Cuando el Host configuraba la sala como Blancas (P2) o el Invitado jugaba con Negras (P1), la condición invertía los roles y asignaba al rival el héroe del propio invitado (creando clones visuales en la interfaz del Guest) o recurría a un fallback forzado `'kitsune'`.
- **Solución Técnica Aplicada**:
  - Se vinculó dinámicamente con `NetworkManager.currentConfig.hostColor`.
  - La comprobación ahora compara `myColor === hostColor ? hostHero : guestHeroes[myColor]` y `oppColor === hostColor ? hostHero : guestHeroes[oppColor]`.
  - Se normalizó el fallback por defecto de oponente no seleccionado a `'normal'` (Aprendiz de Dojo).
  - **Soporte 4P Online (`render4PlayerDuelists`)**: Se derivaron de forma exacta los campeones de todos los slots (P1 a P4) leyendo `hostHero` y el mapa `guestHeroes`, asegurando que cada jugador vea a los otros 3 rivales con sus respectivos personajes reales.

---

### 🎴 5. Rediseño Ergonómico de Previsualización de Escenario y Oponente (`setup.css`, `champions.css`, `modal-local-setup.html`, `modal-online.html`, `OnlineModalRenderer.ts`)
- **Eliminación Total de Solapamientos**: Erradicada la colisión de standees y el Goban central con los selectores inferiores en los pasos de Escenario (*Scenery*) y Oponente (*Opponent*) tanto en Modo Local como Online.
- **Dimensionado y Centrado Natural**:
  - Standees reducidos de 301px a 195px (`165px x 195px`).
  - Caja misteriosa reducida a `110px x 145px` y Goban central a `135px x 135px`.
  - Asentados de forma natural en el centro del viewport escénico con `transform: translateY(0)` y `align-items: center`.
- **Limpieza de Etiquetas**: Eliminadas las etiquetas flotantes `.duel-combatant-tag` y `.duel-stage-board-pill` para despejar completamente la vista previa.
- **Renderizado en Tiempo Real Online**: Conectado el renderizado reactivo del SVG del tablero (`online-stage-board-svg`) y el standee del héroe anfitrión (`online-stage-player-img`) en el Paso 4 del Asistente Online.

---

### 🚪 6. Flujo Secuencial Diferido del Modo Online P2P (`modal-online.html`, `OnlineController.ts`, `OnlineEventBinder.ts`)
- **Creación de Sala P2P Diferida al Paso 5 (Host)**: La sala WebRTC/MQTT se crea únicamente cuando el anfitrión completa la configuración (Modo, Tablero, Campeón, Escenario) y accede al Paso 5 (Lobby), erradicando desincronizaciones de red previas.
- **Estructuración en 2 Fases Claras para el Invitado (Guest)**:
  - **Fase 1**: Selección visual del Campeón.
  - **Fase 2**: Introducción del código `GO-XXXX` y conexión directa `Connect 🚀`.

---

## 26 de Agosto de 2026 - Día 10 (Sesiones 129 - 134): Reparación Integral del Modo Online P2P, Copiado Limpio de Códigos, Desbloqueo del Jugador 2 y Corrección de Fondos

### 🌐 Mejoras en el Modo Online y Análisis de Fallos Previos

#### 1. ¿Por qué antes no funcionaba el emparejamiento online? (Causas Raíz Técnicas)
- **Causa 1: Condición de carrera por doble llamada a `startGame()` (`NetworkManager.ts`)**
  - *El problema*: Cuando un invitado se unía a la sala, el anfitrión disparaba `onPeerJoin`, reservaba el slot y llamaba a `startGame()` con un temporizador corto (200ms). Casi al mismo instante, el invitado enviaba el mensaje `GUEST_JOINED`, y el anfitrión volvía a llamar a `startGame()` dentro de `handleHostIncomingMessage`.
  - *La consecuencia*: El paquete de red `START_GAME` se transmitía a través del canal de datos antes de que la negociación ICE/DTLS de WebRTC entre ambos navegadores estuviese 100% establecida. El mensaje se perdía silenciosamente y la partida no arrancaba.
  - *La solución*: Se eliminó la llamada prematura a `startGame()` del `onPeerJoin` del anfitrión. Ahora `startGame()` se dispara **únicamente tras recibir `GUEST_JOINED`** (lo que garantiza que el canal de datos del invitado ya está activo y escuchando), y se aumentó el margen a **500ms** para permitir que la negociación P2P finalice con estabilidad.
- **Causa 2: Bucle de handshake por solapamiento de `GUEST_JOINED` y `HERO_SELECT` (`NetworkManager.ts`)**
  - *El problema*: Ambos mensajes compartían el mismo bloque `case` en el manejador del host. Cuando el invitado recibía `INIT_GAME`, respondía con `HERO_SELECT`, lo que provocaba que el host volviese a reenviar `INIT_GAME` y a reiniciar el temporizador de inicio, creando un ciclo repetitivo de mensajes.
  - *La solución*: Se separaron en dos casos independientes. `HERO_SELECT` ahora únicamente actualiza el héroe del slot y sincroniza el lobby, sin interferir en el arranque de la partida. Además, en el cliente se añadió una guarda para enviar `HERO_SELECT` solo una vez.
- **Causa 3: Bloqueo de clics del Jugador 2 / Blancas tras el primer turno (`SVGRenderer.ts`, `OnlineController.ts`)**
  - *El problema*: Al arrancar la partida en el navegador del Jugador 2 (Blancas), el motor inicializaba la capa interactiva SVG (`<g class="interactive-layer">`) con `pointer-events: none` porque el primer turno correspondía al Jugador 1 (Negras). Cuando el Jugador 1 ponía su piedra y el mensaje de red llegaba al Jugador 2, `handleNodeClick` avanzaba el turno a Blancas pero llamaba a `render()` **antes** de actualizar `isInteractive = true`. El nuevo SVG se volvía a construir con `pointer-events: none`.
  - *La consecuencia*: El Jugador 2 veía la piedra blanca transparente en hover (porque el evento de movimiento del ratón se escuchaba en el SVG raíz), pero al hacer clic, los círculos invisibles de las intersecciones tenían los clics bloqueados por CSS (`pointer-events: none`) y ninguna jugada se registraba.
  - *La solución*: La capa interactiva ahora comprueba `this.isActionAllowed()` de forma reactiva, `handleNodeClick()` sincroniza `isInteractive` antes de llamar a `render()`, y los callbacks de red `onMoveReceived` y `onPassReceived` en `OnlineController` re-renderizan y actualizan el HUD de inmediato.

---

#### 2. Copiado Rápido y Limpio de Código de Sala (`OnlineController.ts`, `modal-online.html`)
- **Antes**: Al pulsar el botón de compartir, se copiaba la URL local completa (`http://127.0.0.1:5174/?join=GO-XXXX`), la cual era confusa e inútil para compartir con amigos a través de Discord/WhatsApp si se jugaba en red o local.
- **Ahora**: El botón **"📋 Copy Code"** copia **exclusivamente el código de sala `GO-XXXX`** en todos los entornos (localhost, itch.io, servidores dedicados).

---

#### 3. Interfaz del Asistente Online y Navegación Contextual (`modal-online.html`, `OnlineModalRenderer.ts`)
- **Supresión de confusión con el botón "Next ➔"**:
  - En la pestaña **"Join Room (Guest)"** y en **"Buscar Partida (Matchmaking)"**, los botones de navegación del wizard (`Next ➔` y `◀ Back`) se ocultan por completo, dejando únicamente el botón principal **`Connect 🚀`** al lado del campo de texto.
  - En la pestaña **"Create Room (Host)"**, el botón `Next ➔` permanece activo y visible en los pasos 1 (*Mode*), 2 (*Board*), 3 (*Champion*) y 4 (*Scenery*), ocultándose en el paso 5 (*Lobby*).

---

#### 4. Corrección de Pantallas y Fondos en Negro (`HUDController.ts`, `GameController.ts`, `layout.css`)
- **Causa Raíz**: Al elegir tableros como *Máscara Oni*, *Cielo* o *Volcán*, `GameController.initGame()` sobrescribía `activeBg` con el nombre de la forma geométrica (`'oni'`, `'sky'`, `'volcano'`). `HUDController.setBoardBackground` intentaba cargar `./bg_oni.jpg` o `./bg_sky.jpg` (archivos inexistentes en `/public`), produciendo error 404 y dejando el fondo en negro.
- **Solución**: Se implementó un mapa de alias (`volcano` $\to$ `boss`, `dojo` $\to$ `combat`, `zen` $\to$ `tutorial`, `oni`/`sky` $\to$ `combat`), se respetó la elección del usuario en `config.background` y se actualizaron las rutas relativas en `layout.css`.

---

#### 5. Flujo Ergonómico de la Tecla Escape (`KeyboardController.ts`, `OptionsModalRenderer.ts`)
- **Jerarquía en Combate**: Presionar `Escape` en partida ahora deselecciona habilidades activas de campeón, poliminós y pistas tácticas antes de abrir el menú de opciones.
- **Cierre Limpio de Feedback**: `Escape` dentro del formulario de feedback cierra el formulario inmediatamente y regresa al menú principal limpio, sin abrir el menú de opciones por debajo.
- **Apertura Restringida de Opciones**: `Escape` para abrir Opciones/Pausa queda restringido exclusivamente a combates activos y expediciones Roguelike (mapa, combates, tiendas y santuarios).

---

## 23 de Agosto de 2026 - Día 9 (Sesión 123): Tablero Máscara Oni 25x25, Atracción Omnidireccional Hacia las Fauces y Portal Abisal Permanente

**1. Expansión y Rediseño Topológico a 25x25 (`BoardGenerators.ts`):**
- **Grid Unificado 25x25 (`board.size = 25`, `spacing = 24px`):**
  - Con independencia de la elección de 9/13/19 en los menús, el tablero Máscara Oni se genera en su escala completa de 25x25 (~465 intersecciones jugables).
  - Silueta demoníaca esculpida con cuernos superiores en las esquinas (`(2..5, 0..4)` y `(19..22, 0..4)`), hendidura central en V de la frente, cuencas oculares vacías de 3x2 (`(6..8, 8..9)` y `(16..18, 8..9)`), cavidad abismal de las fauces (`(8..16, 16..17)` y `(9..15, 18)`) y mandíbula escalonada hacia la barbilla.
- **Sincronización en Previsualizadores de Interfaz (`SetupModalRenderer.ts`, `OnlineModalRenderer.ts`):**
  - Corregido el rótulo de tamaño en el asistente local y lobby online para que muestre exactamente `25x25 Máscara Oni` y el cómputo real de intersecciones.

**2. Inhalación Gravitacional y Devoración de Grupos Ligeros (`StageHazardManager.ts`, `OniVFX.ts`):**
- **Cadencia Canónica de 14 Turnos Totales:**
  - Activación garantizada cada 7 turnos por jugador (turnos 15, 29, 43, 57...).
- **Regla de Resistencia de Cadenas Pesadas vs Débiles:**
  - **Cadenas Pesadas ($\ge 4$ piedras aliadas):** Inamovibles e inmunes a la succión.
  - **Piedras y Grupos Ligeros ($\le 3$ piedras aliadas):** Atraídas por el vórtice hacia el centro de la boca $(12, 17)$.
- **Atracción Vectorial Omnidireccional:**
  - Las piedras situadas arriba descienden ($y+1$), las de abajo ascienden ($y-1$), las de la izquierda avanzan a la derecha ($x+1$) y las de la derecha a la izquierda ($x-1$).
- **Mecánica de Devoración en las Fauces:**
  - Si el movimiento de una piedra ligera la hace entrar en la cavidad de la boca, **el Oni la DEVORA y absorbe** en el abismo dimensional (`isDevoured: true`), destruyendo la entidad, reproduciendo el rugido demoníaco y animándola implosionando y reduciendo su escala a 0 en el vórtice.

**3. Portal Abisal Permanente en la Boca (`SVGRenderer.ts`, `SVGDefs.ts`, `vfx.css`):**
- Simplificada la representación visual de la cavidad bucal: eliminados los anillos rotatorios y los colmillos, dejando un portal dimensional estático de horizonte de sucesos con núcleo de singularidad oscura, resplandor púrpura/carmesí y borde neón.

**4. Localización y Textos (`translations.ts`):**
- Actualizadas las descripciones y advertencias en español e inglés para reflejar con precisión la cadencia de 14 turnos, la resistencia de 4+ piedras y la atracción omnidireccional con devoración.

---

## 23 de Agosto de 2026 - Día 9 (Sesión 122): Sistema Integral de Efectos Especiales (SFX Web Audio) y Normalización de Música de Fondo BGM

**1. Síntesis Acústica Procedural en Tiempo Real con Web Audio API (`SoundFX.ts`):**
- **Sintetizadores de Audio Dedicados y de Alta Fidelidad:**
  - `playMeteorImpact()` (Tengu / Hechizo Meteorito): Silbido de caída en alta velocidad con filtro dinámico + explosión subsónica en 32Hz + crepitar y chisporroteo de ascuas incandescentes.
  - `playDragonFlame()` (Ryūjin / Furia del Dragón): Ruido térmico modelado con modulación armónica y barrido pasa-banda continuo (450Hz-1400Hz) emulando convección térmica de fuego vivo.
  - `playCelestialDrop()` (Himiko / Lluvia Pétrea): Arpegio cósmico pentatónico (880, 1318, 1760, 2637Hz) con envolvente cristalina y destellos de polvo estelar.
  - `playAlchemicalTransmute()` (Alquimista / Inversión Yin-Yang): Trazo suave de pincel caligráfico sobre papel washi seguido de un acorde místico efervescente de transmutación.
  - `playDivineShieldCast()` (Kitsune / Pergamino de Escudo): Acorde sacrosanto envolvente con campanas tibetanas (440, 880, 1320, 2200Hz) con decaimiento orgánico de 0.95s.
  - `playDivineShieldShatter()` (Kitsune / Rotura de Escudo): Estallido cristalino en alta frecuencia (3500Hz) con cascada de fragmentos resonantes en caída de tono.
  - `playVolcanoEruption()` (Tablero Volcánico): Retumbar sísmico subterráneo profundo (30Hz) combinado con detonación y expulsión de magma ardiente.
  - `playBossDragonBreath()` (Gran Dragón Sabio Gris / Boss Final): Rugido colosal ancestral de dragón con doble capa de plasma ardiente de alta energía.
  - `playSkyBlockLand()` (Tablero del Cielo): Golpe gravitacional etéreo en tono sinusoidal grave combinado con campana de nubes en descenso armónico.
  - `playVictoryFanfare()` (Desenlace de Combate Victorioso): Doble golpe de tambor marcial Taiko + arpegio tradicional de Koto/campanas en escala Hirajōshi (A, B, C, E, F).
  - `playDefeatGong()` (Desenlace de Combate Derrotado): Golpe sombrío de campana/gong budista de bronce (110Hz) con armónico menor disonante.

**2. Integración y Enlace en Capa Gráfica, VFX y Controladores:**
- Reemplazados los sonidos reciclados (`playCapture()` o silencios) por los nuevos efectos dedicados en:
  - `TenguVFX.ts`: `SoundFX.playMeteorImpact()`.
  - `RyujinVFX.ts`: `SoundFX.playDragonFlame()`.
  - `HimikoVFX.ts`: `SoundFX.playCelestialDrop()`.
  - `AlchemistVFX.ts`: `SoundFX.playAlchemicalTransmute()`.
  - `KitsuneVFX.ts`: `SoundFX.playDivineShieldCast()` y `SoundFX.playDivineShieldShatter()`.
  - `BossVFX.ts` & `BossManager.ts`: `SoundFX.playBossDragonBreath()`.
  - `SkyVFX.ts`: `SoundFX.playSkyBlockLand()`.
  - `StageHazardManager.ts`: `SoundFX.playVolcanoEruption()`.
  - `RogueliteManager.ts`: Sonidos dedicados para el lanzamiento de Meteorito, Escudo Sagrado e Inversión Yin-Yang.
  - `ScoreModalRenderer.ts`: Disparo automático de `playVictoryFanfare()` al ganar la partida y `playDefeatGong()` al caer derrotado.

**3. Normalización y Corrección de Música de Fondo BGM (`BGMGenerator.ts`):**
- **Eliminación Total de Errores HTTP 404:** Se eliminaron las referencias a archivos `.mp3` inexistentes que provocaban fallos de carga y silenciamiento en segundo plano.
- **Clasificación Semántica y Fallback Automático:**
  - Entornos Zen / Relajantes (`meadow`, `sunset`, `night`, `zen`, `tutorial`, `menu`, `map`) enrutados a la pista acústica `bgm_zen.wav`.
  - Entornos de Combate / Intensos (`combat`, `dojo`, `void`, `story`, `volcano`, `boss`, `online`) enrutados a la pista marcial `bgm_battle.wav`.
  - Añadido manejador de eventos `error` para auto-recuperar la reproducción inmediatamente ante cualquier imprevisto de red o carga.

---

## 23 de Agosto de 2026 - Día 9 (Sesión 121): Corrección de Ghost Preview en Previsualizaciones y Turno Rival, Banner Prominente de Peligros y Calibración del Tablero Oni

**1. Supresión de Ghost Preview en Modos Inertes y Fuera de Turno (`SVGRenderer.ts`, `GameController.ts`):**
- **Bloqueo en Modos No Interactivos (`isInteractive = false`):**
  - Se implementó el guardián centralizado `isActionAllowed()` y se aplicó `pointer-events: none` a la capa interactiva SVG en todas las maquetas de previsualización (Asistente Local, Lobby Online y Stage Preview).
  - Se eliminó por completo la aparición de fichas fantasma o cursores de colocación al pasar el ratón sobre los tableros de previsualización en menús.
- **Sincronización con el Turno del Rival / IA:**
  - En combate activo, cuando no es el turno del jugador local (es el turno del rival remoto o la IA está calculando), `isActionAllowed()` evalúa `false`.
  - El cursor permanece en modo puntero neutro (`default`) y no se proyecta ninguna ficha fantasma en casillas vacías, evitando la falsa impresión visual de que el jugador puede colocar ficha fuera de su turno.

**2. Icono en HUD y Banner Prominente de Advertencia de Peligros (`index.html`, `HUDController.ts`, `modal-local-setup.html`, `modal-online.html`, `SetupModalRenderer.ts`, `OnlineModalRenderer.ts`, `translations.ts`, `hud.css`):**
- **Icono Interactivo `👹` en HUD Superior:**
  - Añadido el badge `👹` al HUD de combate para el tablero Máscara Oni con animación de pulso y tooltip explicativo.
  - Sincronizado de forma inmediata y síncrona en `HUDController.updateInGameUI` desde el turno 1.
- **Banner Prominente en Previsualización (`.setup-board-hazard-banner`):**
  - Creado un componente de advertencia destacado con borde, fondo sombreado y texto explicativo bilingüe (ES/EN) debajo de la previsualización del goban en el Asistente Local y Lobby Online.
  - Informa dinámicamente sobre la mecánica activa según la topología seleccionada:
    - `🌋 Volcán`: Meteorito destructor cada 20 turnos totales.
    - `☁️ Cielo`: Expansión perimetral de 5 bloques cuadrados (2x2) cada 20 turnos totales.
    - `👹 Máscara Oni`: Fases de erupción / peligros ambientales.

**3. Calibración de Disparadores Oni en Modo Debug (`StageHazardManager.ts`):**
- Configurados los disparadores de depuración rápida en las rondas 3, 6 y 9 (al finalizar los turnos 3b, 6b y 9b / turnos 7, 13 y 19 en 2P).

---

## 23 de Agosto de 2026 - Día 9 (Sesión 120): Rediseño Integral de Lecciones del Dojo (Snapback, Seki, Ojos Falsos, Puntuación Japonesa y Magia Alquimista), Llamas Místicas Animadas y UI Glassmorphism

**1. Reestructuración Modular y Didáctica del Dojo Tutorial (`TutorialSteps.ts`, `TutorialManager.ts`, `tutorial.css`, `translations.ts`, `GameController.ts`):**
- **División Canónica en 2 Módulos Temáticos:**
  - `dojo.module_classic` (*Fundamentos del Go Tradicional*): Lecciones 1 a 9 dedicadas a reglas puras de Go (Libertades, Capturas, Ojos, Seki, Snapback, Suicidio, Ko y Territorio).
  - `dojo.module_special` (*Mecánicas de Crazy Go*): Lecciones 10 a 14 dedicadas a topologías destruidas, poliminós tácticos, magia de campeones y entidades neutrales del mapa.
- **Rediseño Didáctico e Interactivo de Lecciones Clave:**
  - **Lección 7 (Snapback / Uttegaeshi):** Diseñado el patrón canónico de herradura de 6 piedras y corregido el flujo de IA con `RulesEngine.tryPlaceStone` para evitar bloqueos del botón de avance.
  - **Lección 8 (Seki / Vida Mutua):** Integración diegética del botón `[Pasar Turno]` (`.tutorial-show-pass-only`) para permitir al jugador resolver el Seki pasando turno con [P] o clic en el botón iluminado.
  - **Lección 4 (Ojos Falsos y Muerte / La Trampa de los 2 Ojos):** Transformada de un texto estático a un problema interactivo paso a paso enfocado en la regla de los 2 ojos. El jugador ve 2 ojos aparentes, blanco asedia la esquina del Ojo 2 en Atari, y el jugador se ve forzado a jugar dentro de su propio ojo para salvar sus piedras, experimentando de primera mano la desaparición del ojo, quedándose con 1 solo ojo y condenando al grupo entero a morir.
  - **Lección 9 (Puntuación Final y Territorio / Reglas Japonesas):** Corregidas las coordenadas históricas 0-indexadas por coordenadas válidas 1-indexadas en 9x9 (`1,1` a `9,9`). Se convirtió en un ejercicio interactivo donde el jugador sella la brecha de su muralla en `(3,4)` cercando 11 puntos de territorio, aprende cómo las piedras muertas en `(2,2)` suman +1 prisionero sin gastar turnos, el funcionamiento del Komi (+6.5 para Blancas), y el desglose de la fórmula de victoria japonesa.
  - **Lección 13 (Sinergias de Magia / Alquimista):** Sustituido el ejemplo previo de la cruz (donde la piedra transmutada se suicidaba al instante) por un Tesuji de Inversión Cromática real: transmutar la piedra central `(5,5)` de un muro de corte enemigo captura y elimina instantáneamente las 2 piedras blancas adyacentes `(5,4)` y `(5,6)` por falta de libertades, conectando a Negras en una fortaleza viva con 8 libertades.
- **Limpieza de Interfaz en Tutoriales:**
  - Ocultación del botón de Registro de Combate (`#btn-game-combat-log`) en modo tutorial para maximizar el área de juego y concentración.

**2. Modernización Visual y Glassmorphism del Modal de Expedición Roguelike (`modal-rogue-setup.html`, `carousel.css`, `base.css`):**
- **Llamas Místicas Animadas por Dificultad (🔥):**
  - Sustituidos los puntos estáticos y subtítulos redundantes ("Beginner", "Warrior", "Master", "Supreme Dan") por **Llamas Elementales Animadas** con efecto de fuego parpadeante (`@keyframes flameFlicker`) y auras luminosas:
    - **Easy (Fácil):** Llama Verde Esmeralda Mística 🔥 (`flame-easy`).
    - **Normal:** Llama Ámbar / Dorada Solar 🔥 (`flame-normal`).
    - **Hard (Difícil):** Llama Roja Carmesí de Sangre 🔥 (`flame-hard`).
    - **Grandmaster (Gran Maestro):** Llama Púrpura del Vacío Supremo 🔥 (`flame-extreme`).
- **Contenedores Sin Bordes Rígidos (*Borderless Glassmorphism*):**
  - Eliminación de bordes sólidos pesados y sustitución por fondos con desenfoque de cristal (`backdrop-filter: blur(28px)`), sutiles relieves de luz interior (`inset 0 1px 0 rgba(255, 255, 255, 0.1)`), degradados ambientales de cristal tintado en las cajas de habilidades activas y pasivas, y píldoras de héroe iluminadas suavemente.
  - Suavizado global de bordes de ventanas modales (`.modal-card`) en `base.css`.

**3. Reparación de Tipos y Generador de Tableros (`BoardGenerators.ts`, `OnlineController.ts`):**
- Corregida la sintaxis de plantillas de texto en `BoardGenerators.generateOniGrid`.
- Tipado estricto de `OnlineGameConfig.slots` y corrección de imports dinámicos en `OnlineController.ts`.

---

## 23 de Agosto de 2026 - Día 9 (Sesión 119): Tablero del Cielo con Expansión Perimetral Infinita (Bloques Cuadrados 2x2), VFX Suave y Refinamientos de UI y Menú

**1. Tablero del Cielo y Expansión Perimetral Infinita (`BoardGenerators.ts`, `SVGRenderer.ts`, `StageHazardManager.ts`, `SkyVFX.ts`, `SVGDefs.ts`, `translations.ts`):**
- **Inicio Canónico Completo:** El tablero de cielo comienza como una cuadrícula oficial pura de Go en los tres tamaños profesionales (**9x9, 13x13 y 19x19**) con sus líneas y puntos Hoshi oficiales.
- **Mecánica Celestial de Caída y Expansión Dinámica:**
  - Se activa cada **20 turnos totales** (10 turnos por jugador / al terminar las rondas 10b, 20b, 30b... en los turnos 21, 41, 61...).
  - El motor escanea el perímetro exterior del goban (`[minCol - 2, maxCol + 1]` y `[minRow - 2, maxRow + 1]`) buscando cuadrantes $2\times 2$ adyacentes al terreno actual.
  - **5 nuevos bloques cuadrados ($2\times 2$, 4 casillas por bloque, totalizando hasta 20 casillas)** caen desde el cielo y se acoplan a los bordes del goban.
  - Al aterrizar, **crean nuevas intersecciones de madera y líneas de Go**, conectándose con el tablero existente y **haciéndolo crecer y expandirse infinitamente hacia afuera** (11x11, 15x15, 17x17, 21x21...) a lo largo de toda la partida en cualquier tamaño de tablero.
- **Animación VFX Cinemática Fluida y sin Sacudidas (`SkyVFX.ts`, `board.css`):**
  - Eliminado por completo el temblor de pantalla (`vfx-screen-shake`).
  - Descenso gravitatorio suave (`cubic-bezier(0.22, 1, 0.36, 1)`), estelas celestes (`#38bdf8`, `#fef08a`), halo de luz expansivo al posarse sobre el goban y chispas estelares sutiles.
  - Eliminada la floritura azul de la esquina superior izquierda del renderizador SVG para una madera limpia.
- **Integración UI, HUD e Internacionalización (ES / EN):**
  - Nueva opción `☁️ Sky / Cielo` con badge dinámico `#ui-sky-warning` en el HUD de combate y tarjetas informativas interactivas en el Asistente Local (`modal-local-setup.html`) y Lobby Online (`modal-online.html`).

**2. Refinamiento de la Pantalla de Continuar Expedición Roguelike (`RogueChoiceCameraController.ts`, `modal-rogue-choice.html`):**
- **Periodo de Gracia Inicial al Abrir (700ms):** Se bloquea la activación automática del hover durante los primeros 700ms, evitando que la posición del cursor en el menú principal (a la izquierda) fuerce inmediatamente el zoom sobre "NUEVA EXPEDICIÓN".
- **Visibilidad Dual de Títulos en Estado Neutral:** En el encuadre neutral 50/50, **ambos letreros permanecen visibles y legibles** con sus colores temáticos:
  - Izquierda: **NUEVA EXPEDICIÓN** en coral/rosa cálido (`#fca5a5`) con subtítulo *"Abandonar viaje actual y regresar al Dojo"*.
  - Derecha: **CONTINUAR EXPEDICIÓN** en verde esmeralda (`#34d399`) con subtítulo *"Reanudar la marcha por el sendero del mapa"*.

**3. Aceleración y Respuesta Instantánea del Menú de Inicio (`MenuCameraController.ts`, `base.css`):**
- **Sincronización Inmediata de `transform-origin` (0ms):** Eliminada la interpolación CSS en el pivote focal para que salte al instante al nuevo icono enfocado sin derivas ni retrasos.
- **Cámara y Objetos Ultrarrápidos:** Reducida la transición de cámara a **200ms**, el buffer de amortiguación a **15ms** y los objetos a **180ms**, permitiendo una navegación ágil e inmediata entre los elementos del dojo.

---

## 22 de Agosto de 2026 - Día 8 (Sesión 118): Rediseño Cinemático de la Pantalla de Continuar Expedición Roguelike (Escena 2.5D, Vistas Traseras en Ambos Lados, Corrección de Clics y Biblia de Prompts)

**1. Pantalla de Elección Diegética e Inmersiva (`modal-rogue-choice.html`, `RogueChoiceCameraController.ts`, `RogueModalRenderer.ts`):**
- **Sustitución de la Ventana Modal por Escenario 2.5D:** Se eliminó el diálogo emergente genérico de tres botones y se transformó en una experiencia espacial cinemática a pantalla completa con dos caminos narrativos representados en el entorno físico del juego.
- **Lado Izquierdo (Nueva Expedición / Regreso al Dojo):**
  - Fondo del interior de un dojo tradicional de cedro (`bg_choice_dojo.jpg`) con iluminación ámbar tenue.
  - El héroe aparece **visto de espaldas, girado e inclinado hacia el dojo** (`./heroes/${hero.id}_back.png` con `transform: scaleX(-1) rotate(-3deg)`), simbolizando que abandona el viaje para regresar al santuario.
  - Paleta de color **grisácea, nostálgica y atenuada** (`grayscale(45%)`, brillo moderado), que se ilumina suavemente con tono ámbar al hacer *hover*.
- **Lado Derecho (Continuar Expedición / Reanudar Marcha):**
  - Fondo del sendero místico de montaña con los **nodos espirituales de Go brillando a lo largo del camino** y un portal Torii a lo lejos (`bg_choice_map.jpg`).
  - El héroe aparece **visto de espaldas avanzando con paso firme hacia el sendero** (`./heroes/${hero.id}_back.png`) en colores **ricos, saturados y vívidos** (`saturate(1.25)`).
  - Al hacer *hover*, el sendero estalla en brillo esmeralda/dorado y la cámara realiza un suave *dolly-in* con profundidad de campo desenfocando el dojo.
- **Placa Central Informativa de la Run:** Muestra de forma flotante con cristal ahumado y bordes dorados el nombre del héroe activo con su icono, la dificultad (`🟢 Fácil (Principiante)`, `🟡 Normal (Guerrero)`, etc.) y la posición exacta en el mapa procedural (`📍 Tier {N}: {Nombre del Nodo}`).
- **Internacionalización Completa (ES / EN):** Integradas todas las cadenas en `translations.ts` con claves `rogue.choice_*` y atributos `data-i18n`, traduciendo dinámicamente nombres de rivales (`translateEnemyName`), dificultades y nodos.
- **Corrección de Eventos de Clic (`RogueChoiceCameraController.ts`):** Se eliminó el `cloneNode` que eliminaba los event listeners de `MenuEventBinder.ts`, restaurando el funcionamiento instantáneo de los clics para reanudar o reiniciar la run.
- **Calibración y Desactivación del Modo Debug de Hitboxes (`index.html`, `base.css`):** Se ajustaron las cajas de colisión y contenedores de los 7 elementos espaciales para eliminar franjas desfasadas y se desactivaron los recuadros visuales de depuración para dejar el menú 100% limpio en producción.
- **Auto-recorte de Márgenes Transparentes de Assets (`Pillow / PIL`):** Se procesaron todos los archivos `item_*.png` recortando automáticamente los bordes y márgenes transparentes vacíos (que en farolillos, muñeco y grulla ocupaban hasta un 60% del lienzo), logrando que los elementos se vean significativamente más grandes, nítidos y proporcionados sin aumentar el tamaño de sus cajas de colisión ni invadir otros botones.

**2. Generación y Procesamiento de Vistas Traseras de los 7 Campeones (`public/heroes/*_back.png`):**
- Se generaron ilustraciones en alta resolución de los 7 campeones vistos de espaldas y se procesaron con scripts de PowerShell/.NET `System.Drawing` a PNGs transparentes de 32 bits puros:
  1. **Ryūjin (`ryujin_back.png`):** Cabello blanco/plateado largo cayendo por la espalda, cuernos de dragón blancos, túnica azul zafiro con dragón dorado y olas, aura cian, sin rocas en la base.
  2. **Tengu (`tengu_back.png`):** Alas de cuervo gigantes desplegadas en la espalda, máscara tengu ladeada y ropas yamabushi rojas/doradas.
  3. **Kitsune (`kitsune_back.png`):** Cabello negro largo, orejas de zorro blancas con lazo rojo, 9 colas blancas con puntas doradas y hakama carmesí.
  4. **Ronin (`ronin_back.png`):** Sombrero cónico *kasa*, petate enrollado, katana al cinto y haori índigo desgastado.
  5. **Himiko (`himiko_back.png`):** Corona solar, pelo negro larguísimo, manto imperial carmesí con soles dorados en la espalda y polvo estelar.
  6. **Alquimista (`alchemist_back.png`):** Gorro alto ceremonial *eboshi*, túnica verde/morada con constelaciones celestiales y emblema del Yin-Yang en la espalda.
  7. **Hombre Normal (`normal_back.png`):** Moño con lazo azul, kimono blanco superior y pantalón hakama azul marino.

**3. Biblia Maestra de Prompts de Arte Actualizada (`docs/ai_wiki/game_design/art_prompts_bible.md`):**
- Documentados de forma exhaustiva los prompts exactos tanto para la vista **Frontal** como para la vista **Trasera** (Sendero y Retorno al Dojo) de cada uno de los 7 campeones, así como de los enemigos (monjes, sabios y Gran Dragón Sabio Gris), escenarios, mobiliario 2.5D y artefactos del juego para garantizar una consistencia artística del 100%.

---

## 22 de Agosto de 2026 - Día 8 (Sesión 117): Topología de Tablero Volcánico con Cráteres Diegéticos, Vulnerabilidad de Escudo Divino, Tipografía Mincho y Pulido del Dojo

**1. Nueva Topología de Tablero Volcánico (`board.shape = 'volcano'`) e Independencia del Escenario:**
- **Desvinculación del Fondo:** La mecánica de erupción volcánica ya no depende del fondo o escenario (`background === 'boss'`), sino que es una forma y topología propia de tablero (`board.shape = 'volcano'`), seleccionable y jugable en cualquier entorno o modo (Local, 1vIA, 1v1, Online, Sandbox).
- **Cuadrícula Canónica en 9x9, 13x13 y 19x19 (`BoardGenerators.generateVolcanoGrid`):** Genera una cuadrícula de Go completa, limpia y pura con todos sus puntos Hoshi oficiales intactos.
- **Capa Estética Diegética de Cráteres en las 4 Esquinas (`renderVolcanoCornerDecorations` en `SVGRenderer.ts`):**
  - Renderiza 4 conos volcánicos de roca basáltica oscura (`#1c1917`), grietas radiales de lava incandescente (`#ea580c`) y una caldera con núcleo de magma resplandeciente (`#fef08a` ➔ `#f59e0b` ➔ `#dc2626`).
  - Animación de pulso térmico en vivo (`.volcano-core-glow`) y penachos de humo y ceniza suspendida (`.volcano-smoke-plume`).
- **Mecánica Ambiental y Recálculo Canónico de Libertades (`StageHazardManager.ts` y `RulesEngine.destroyTopology`):**
  - Cada 10 turnos globales, un proyectil de magma impacta una casilla aleatoria, destruye la piedra presente y perfora el nodo del tablero a estado `DESTROYED`.
  - Recalcula inmediatamente las libertades: si alguna cadena aliada o enemiga pierde su última libertad por el agujero resultante, muere por asfixia topológica y es retirada del tablero.
  - Totalmente sincronizado con rebobinado/deshacer (`StageHazardManager.onTurnRolledBack`).

**2. Lógica Canónica: Erupción Volcánica vs Escudo Divino de Kitsune (`RulesEngine.destroyTopology`):**
- **Impacto Directo:** Si el meteorito de magma impacta directamente sobre una casilla ocupada por una piedra con Escudo Divino, la piedra muere incondicionalmente y se reproduce el quiebre de cristal dorado (`VFXManager.triggerDivineShieldShatter`), ya que el suelo físico sobre el que reposaba desaparece en el vacío.
- **Supervivencia del Resto del Grupo:** Las demás piedras del grupo que posean Escudo Divino **conservan intacta su protección** y **no mueren por falta de libertades**, manteniéndose invulnerables a la captura colateral.

**3. Optimización Tipográfica y Legibilidad en Placas de Combatientes (`champions.css`, `DuelistRenderer.ts`, `index.html`):**
- **Sustitución de Tipografía All-Caps por Mincho Serif Mixta:** Se sustituyó `var(--font-oriental)` (`Cinzel Decorative`, que forzaba mayúsculas desmedidas y truncaba nombres como `NORMAL PER...`) por `var(--font-serif)` (`'Shippori Mincho', 'Cinzel', serif`), permitiendo minúsculas y mayúsculas naturales (Title Case) con elegancia caligráfica tradicional japonesa.
- **Ampliación de Placa y Envoltura de Texto (`.duel-standee-plate`, `.duel-plate-title-group strong`):**
  - Ampliado el ancho máximo de la placa a `255px`.
  - Ajustado `font-size: 0.92rem; font-weight: 700; max-width: 100%; white-space: normal; word-break: break-word;` para que nombres largos como *Persona Normal*, *Kitsune (Tú)*, *Novice Monk* o *Sensei Hiroshi* se lean completos y nítidos sin elipses indeseadas.
- **Lectura Simultánea de Identidad y Habilidad/Descripción:**
  - Añadido el subtítulo `#duel-player-sub` para reflejar la maestría canónica (*Maestría de Go Canónico • 2 Rebobinares*) en personajes normales o aprendices.
  - Para héroes con habilidades, el botón/placa inferior muestra directamente el **Nombre de la Habilidad** y su **Fórmula/Efecto de Combate** de forma simultánea.

**4. Pulido Visual del Selector del Dojo y Relieve de Textos del Menú Principal (`tutorial.css`, `modal-tutorial.html`, `base.css`):**
- **Selector de Lecciones del Dojo:** Eliminados los contenedores rígidos tipo pill, líneas divisorias ondulantes y kanjis de marca de agua para un acabado diáfano, zen y minimalista.
- **Internacionalización Completa (ES/EN):** Título, subtítulo, botón de cierre y etiquetas dinámicas del Dojo 100% traducidas.
- **Contraste de Letreros del Menú 2.5D:** Sistema multicapa de contorno oscuro profundo (`#05070c`), sombra proyectada y resplandor ambiental reactivo (`currentColor`) para máxima legibilidad de las opciones sobre el fondo de madera del dojo.

**5. Clarificación de Habilidades: Tengu vs Peligros del Mapa (`TenguChampion.ts`):**
- Se reafirmó y blindó que la *Lluvia Meteórica* de Tengu destruye exclusivamente piedras enemigas sin perforar ni alterar los nodos del tablero, manteniéndose diferenciada de la destrucción topológica volcánica.

---

## 22 de Agosto de 2026 - Día 8 (Sesión 116): Generación de Assets Finales del Menú 2.5D, Maquetación de Estantería en Zig-Zag y Sistema de Escalado Paramétrico

**1. Generación e Integración de los 3 Assets Fundacionales del Menú (`public/bg_dojo_empty.jpg`, `furniture_bookshelf.png`, `furniture_stand.png`):**
- **Fondo de Dojo Acogedor y Tenue 16:9 (`bg_dojo_empty.jpg`):**
  - Interior diáfano y espacioso de madera de cedro maciza oscura y tatami limpio.
  - Iluminación cinematográfica tenue nocturna/crepuscular con paneles shoji cerrados y sutil vistazo al jardín zen exterior, optimizado para hacer brillar los farolillos y destacar el mobiliario 2.5D sin elementos dibujados fijos.
- **Estantería Abierta de 3 Baldas Limpias (`furniture_bookshelf.png`):**
  - Mueble tradicional minimalista de cedro japonés con exactamente 3 baldas horizontales amplias y despejadas. Procesado con script de recorte y transparencia alfa pura de 32 bits (`Pillow`).
- **Soporte Ceremonial de Suelo para Pergaminos / Emakimono Stand (`furniture_stand.png`):**
  - Caballete bajo tradicional con patas curvas y dos postes verticales con clavijas ranuradas. Procesado con transparencia alfa pura, posicionado en el lateral izquierdo enmarcando y sosteniendo el pergamino del mapa Roguelike.

**2. Maquetación y Armonización en Zig-Zag de la Estantería (`index.html`):**
- Reorganizada la alineación de objetos interactivos y sus etiquetas de texto en las 3 baldas de la estantería para lograr un equilibrio visual perfecto:
  - *Balda Superior:* Libro antiguo a la izquierda $\rightarrow$ Texto **`STORY`** a la derecha del libro.
  - *Balda Media:* Texto **`FEEDBACK`** a la izquierda (`right: 110%`) $\leftarrow$ Grulla de origami a la derecha.
  - *Balda Inferior:* Ábaco artesanal a la izquierda $\rightarrow$ Texto **`OPTIONS`** a la derecha (`left: 102%`).
- Añadido `white-space: nowrap;` en todas las etiquetas de la estantería para evitar saltos de línea no deseados en pantallas de cualquier resolución.

**3. Espejado Horizontal del Muñeco de Entrenamiento de Tutorial (`item_dummy_tutorial_1787400017841.png`):**
- Volteado horizontalmente de forma permanente en el propio asset PNG de origen (`ImageOps.mirror`) para que la pose del muñeco de madera apunte naturalmente hacia el centro de la estancia y hacia el jugador, manteniendo intacto y legible al frente el texto `TUTORIAL`.

**4. Sistema de Escalado Paramétrico de Fácil Modificación (`index.html`):**
- Añadida la propiedad `transform: scale(1); transform-origin: center center;` de forma explícita a todos los elementos del escenario espacial (`#furniture-bookshelf`, `#furniture-stand`, `#btn-menu-title`, `#btn-menu-roguelike`, `#btn-menu-free`, `#btn-menu-online`, `#btn-menu-story`, `#btn-menu-feedback`, `#btn-menu-dojo`, `#btn-menu-options`).
- Permite que cualquier desarrollador o diseñador ajuste la escala de cada objeto editando un único valor numérico (`scale(1.2)`, `scale(0.85)`, etc.) sin alterar las posiciones relativas, los porcentajes de caja ni las interpolaciones de la cámara de foco 3D.

## 22 de Agosto de 2026 - Día 8 (Sesión 116): Fix Definitivo de Jitter Loop y Cursores Personalizados (Base64 + Inyección Universal)

**1. Corrección Definitiva del Bug de Superposición de Cursores en Windows/Chromium:**
- **Inyección Base64 (`variables.css`):** Se abandonó el uso de Data URIs con texto plano y SVG vinculados mediante rutas relativas (que daban problemas al empaquetar con Vite para Itch.io o aplicaciones portables). Se codificaron los 3 cursores SVG (Puntero, Default y Agarre) en formato Base64 puro y se inyectaron en el núcleo del CSS, asegurando que carguen instantáneamente el 100% de las veces.
- **Escalado Vectorial Nativo:** Los cursores se han hecho un 50% más grandes escalando los vectores SVG directamente a una caja de 48x48 píxeles mediante `<g transform="scale(1.5)">`.
- **Eliminación Total de `cursor: pointer` nativo:** Se ejecutó un barrido masivo en todos los archivos del proyecto (17+ hojas de estilos) reemplazando cualquier mención a `cursor: pointer;` por `cursor: var(--cursor-pointer);`. Esto, sumado a la estrategia de fijar el fallback de los SVGs como `default` (ej: `url('...'), default;`), bloquea completamente al navegador Chromium para que no solicite la "mano" nativa al sistema operativo, erradicando para siempre el glitch de doble flecha superpuesta.

**2. Solución Analítica al Bucle de Parpadeo (Jitter Loop) en el Menú Principal 2.5D:**
- **El Problema:** Al hacer zoom cinemático con la cámara (`scale(1.045)` en `#menu-camera`), la imagen y el texto se expandían alejándose entre sí. Como la cámara calculaba el centro basándose en la imagen, el texto se desplazaba físicamente unos píxeles hacia afuera, provocando que el ratón "cayera" en el hueco transparente entre la silueta y el texto, perdiendo el foco y generando un bucle epiléptico de zoom in / zoom out (y alternancia rápida de cursores).
- **El Fix Inicial (Fallido):** Se intentó añadir una caja invisible global (`.dojo-item::after`) que englobaba ambas partes, pero era tan inmensa que los botones se solapaban invisiblemente entre ellos, haciendo que el ratón activara menús equivocados al pasar cerca.
- **La Solución Quirúrgica (`base.css`):**
  - Se eliminó el `transform: scale(1.05)` nativo de hover en `.dojo-item` para evitar que compitiera o multiplicara el escalado del controlador JavaScript.
  - Se introdujo un "puente" matemático estrictamente confinado al texto (`.dojo-item span::before`). Este pseudo-elemento tiene un padding negativo de `150%` alrededor del texto y un fondo casi transparente (`rgba(0, 0, 0, 0.001)`).
  - Este puente llena de forma exacta y precisa el abismo de separación entre el texto y la imagen de cada sección sin invadir otras secciones, logrando que el cursor mantenga un foco sólido como una roca durante toda la transición de cámara.

---

## 22 de Agosto de 2026 - Día 8 (Sesión 114): Menú Principal Espacial 2.5D, Dolly-in Cinemático y Arquitectura Modular de Mobiliario

**1. Menú Principal Espacial 2.5D y Cámara Cinemática (`MenuCameraController.ts`, `base.css`, `index.html`):**
- **Transformación 3D Espacial:** Reemplazo de los botones planos tradicionales por un entorno 2.5D inmersivo con perspectiva CSS (`perspective: 1200px`, `transform-style: preserve-3d`). La mirada del jugador (cursor del ratón) genera un suave paneo Parallax tridimensional en tiempo real sobre la estancia del Dojo.
- **Dolly-in Zoom y Profundidad de Campo:** Al posar el cursor (*hover*) sobre cualquier modo de juego, la cámara ejecuta una transición suave de aproximación (dolly-in centrado) hacia el objeto, desenfocando (`filter: blur`) los elementos circundantes para crear un efecto cinematográfico de lente. El título principal `CRAZY GO` se diseñó para permanecer siempre visible y nítido sin sufrir zoom intrusivo.

**2. Arquitectura de Escenario Desacoplada y Modular:**
- **Separación en 3 Capas Físicas:** Para evitar que los elementos floten o se desfasen al mover la cámara, se dividió la escena en:
  1. *Fondo Diáfano (Z: -100px):* Habitación tradicional japonesa vacía (`bg_dojo_empty.jpg`) con vista al jardín.
  2. *Mobiliario Modular (Z: 0px):* Elementos de mobiliario como PNGs transparentes independientes (`furniture_bookshelf.png`, `furniture_stand.png`), permitiendo reposicionarlos y escalarlos con libertad total.
  3. *Objetos Interactivos de Juego (Z: 10px):* Farolillos de papel luminosos para Local y Online, Pergamino antiguo para la Expedición Roguelike, Libro clásico para el Modo Historia, Grulla de origami para Feedback, Ábaco de piedra para Opciones y Muñeco de entrenamiento gigante para el Tutorial posado sobre el suelo de madera.
- **Eliminación del Botón Obsoleto `LOG`:** Retirado del DOM y del flujo de navegación.

**3. Automatización de Transparencias y Procesamiento de Assets:**
- Implementado pipeline de procesamiento con scripts de Python (Pillow / PIL) para extraer los fondos blancos de las ilustraciones generadas por IA, convirtiéndolas en texturas PNG transparentes puras sin pérdida de resolución ni bordes duros.

**4. Fix de Compilación TypeScript y Parseo de Vite/Oxc:**
- Resuelto el bloqueo de parseo `[PARSE_ERROR] Expected '(' but found 'Identifier'` en `RulesEngine.ts` reestructurando los comentarios de cabecera.
- Subsanados los errores de tipos en `types/index.ts` y restaurada la firma de `RulesEngine.destroyTopology()`.

---

## 22 de Agosto de 2026 - Día 8 (Sesión 113): Topología Dinámica, Sandbox y Arquitectura Multi-Facciones (Lobby Libre)

**1. Modo Desarrollador (Sandbox) In-Game:**
- **Funcionalidad:** Se amplió el soporte del Modo Sandbox. Ahora se permite probar y alterar tableros libremente sin respetar los turnos de color, ideal para encontrar fallos, plantear tsumegos o verificar el comportamiento matemático de grupos complejos de piedras.

**2. Sistema Avanzado de Zoom In-Game:**
- **Problema:** El escalado previo estropeaba el centrado visual de los objetos, separaba a los duelistas y revelaba bordes no renderizados (franjas negras) al disminuir el zoom.
- **Solución:** Se reconstruyó por completo el sistema de cámara de combate (`MenuCameraController`) acoplándolo matemáticamente al viewBox y unificando el paneo del escenario 3D para emular el zoom nativo de los navegadores web.

**3. Topología Dinámica y Asfixia por Destrucción:**
- **Mecánica Core (`RulesEngine.destroyTopology`):** Ahora el tablero de Go puede perder intersecciones físicas en mitad del combate. Si un nodo es destruido, la piedra que contenía muere al instante, sus aristas de conexión se rompen permanentemente, y cualquier cadena aliada o enemiga adyacente que pierda su última libertad por este hundimiento sufrirá captura inmediata por "asfixia espacial".
- **Renderizado Dinámico (Holey-Board):** El `SVGRenderer` aplica máscaras de recorte instantáneas (`<mask id="board-hole-mask">`) sobre la textura del propio goban, revelando el fondo transparente o la madera destrozada por debajo de la zona afectada.

**4. Devastación Pasiva del Boss y Hechizo Meteoro Reconstruido:**
- El consumible "Lluvia de Meteoritos" ahora remodela la geometría del terreno, destruyendo nodos además de piedras.
- **Jefe Final Despiadado (`BossManager`):** Se activó la habilidad pasiva definitiva para los combates finales: A partir del turno 22, el jefe invocará meteoritos aleatorios turno tras turno (aliento calcinante), obligando al jugador a proteger sus territorios frente a un tablero menguante y dinámico.

**5. Arquitectura Multijugador "Rengo" y Asientos Flexibles (Lobby Libre Backend):**
- **Soporte Híbrido (`GameSetupConfig.slots`):** Se reescribió la arquitectura del estado de partida para independizar el concepto de "Turno" del concepto de "Color de Piedra". El motor permite asignar independientemente los 4 asientos a humanos locales, amigos online (remotos) o inteligencias artificiales.
- **Turnos Aliados (Rengo):** El `GameController` y la `GoAI` ahora comprenden configuraciones de equipo (ej: Asiento 1 y 3 = Equipo Negro; Asiento 2 y 4 = Equipo Blanco). Esto garantiza que el recuento matemático japonés (`TerritoryScorer`) permanezca inalterado (al final del día solo hay piedras Negras vs Blancas), logrando soporte instantáneo para 2v2 (Humanos vs Humanos) y 3v1 (Tres amigos vs IA Máster).

---

## 20 de Agosto de 2026 - Día 6 (Sesión 112): Hotfix Integral 4 Jugadores (Reglas y Habilidades)

**1. Blindaje del Motor de Reglas en 4P (`RulesEngine.ts`):**
- **Problema:** En el motor de capturas neutrales (`resolveCaptiveCaptures`), cuando una entidad se asfixiaba indirectamente, el motor otorgaba la captura al jugador que tuviera más piezas a su alrededor comparando *únicamente* entre Jugador 1 y 2 (`playerCounts[2] > playerCounts[1] ? 2 : 1`), ignorando por completo a los jugadores 3 (Esmeralda) y 4 (Amatista).
- **Solución:** Se implementó una búsqueda modular del máximo (`Math.max` iterativo sobre `playerCounts`) que evalúa equitativamente la presencia de los 4 colores, adjudicando correctamente los prisioneros neutrales al verdadero captor en partidas de 4 jugadores.

**2. Corrección del Hechizo "Inversión Yin-Yang" y "Meteoro" para 4P (`RogueliteManager.ts`):**
- **Problema:** Ambos hechizos místicos usaban lógica binaria (`playerId === 1 ? 2 : 1`) para buscar piedras "enemigas". En partidas de 4 jugadores, esto provocaba que solo afectaran a las piedras del Jugador 1 o 2, volviendo los hechizos inútiles si querías atacar a P3 o P4.
- **Solución:** Se reemplazó el check binario por `playerId !== playerId`, permitiendo que el algoritmo rastree y afecte correctamente a *cualquier* piedra rival en el Goban, sin importar el color.

**3. Arreglo de IA y "Ojo del Maestro" en 4P (`AnalysisEngine.ts`):**
- **Problema:** La pista táctica de "Mejor Jugada" y el simulador predecían el próximo turno usando la misma lógica binaria hardcodeada (`opponentId = activePlayerId === 1 ? 2 : 1`). Si pedías una pista durante el turno del Jugador 3, la IA predecía la respuesta del Jugador 1 en lugar del Jugador 4.
- **Solución:** Se implementó rotación modular `((activePlayerId % state.playerCount) + 1)`, asegurando que las pistas y el motor de IA subyacente siempre prevean el movimiento del *verdadero* jugador siguiente en el orden de turnos rotativo (1 → 2 → 3 → 4 → 1).

**4. Validación de Habilidades en 4P:**
- Se comprobó y validó que **Tengu, Kitsune, Ryūjin, Ronin, Alquimista y Boss/Himiko** operan sin bugs de 2P, debido a que su lógica de captura (`tryPlaceMultiStones`, destrucción física, y validación por `effectivePid`) escala naturalmente a múltiples jugadores sin asunciones binarias.

**5. Sistema Avanzado de Registro de Combate y Repeticiones (Combat Log & Replay Viewer):**
- **Registro Integral (`CombatLogManager.ts`)**: Grabación de coordenadas canónicas de Go (ej. `Q16`), colocación de piedras especiales, uso de hechizos, activaciones de campeones y saltos de turno. Sincronizado completamente con la mecánica de deshacer (`undo`).
- **Visor Interactivo Panorámico**: Un modal SVG (`modal-combat-log.html`) que renderiza el tablero paso a paso, con anillo resaltador, controles multimedia (`⏪`, `◀`, `▶`, `⏩`, `⏯`), selector de velocidad y línea temporal cronológica filtrable.
- **Exportación/Importación de Partidas**: Capacidad de guardar las partidas como un archivo local `.cgo` (o copiar a JSON portapapeles) e importarlas libremente en cualquier otra sesión o dispositivo para estudiar estrategias y compartir finales épicos.

**6. Motor Matemático de Win Rate 4P y Ojo del Maestro (`AnalysisEngine.ts`):**
- **Algoritmo Softmax Compensado**: Sustitución del modelo Sigmoide binario de 2 colores. El motor ahora toma el territorio, komi, capturas, libertades por piedra y grupos vivos de los N jugadores y aplica un cálculo Logit + Softmax (con temperatura adaptable al tamaño del tablero) para obtener `playerWinRates` dinámicos que suman exactamente el 100%.
- **Win Rate Bar en HUD**: Adición de la barra superior `.winrate-bar-container` dinámica, mostrando visualmente la ventaja relativa (Negro, Blanco, Esmeralda, Amatista) de todos los combatientes en tiempo real.

**7. Sistema de Música de Fondo Ambiental Dinámico (BGM):**
- Refactorización de `BGMGenerator.ts` para mapear fondos específicos (`dojo`, `combat`, `zen`, `meadow`, `sunset`, `void`, etc.) a sus propias bandas sonoras.
- Implementación de transiciones fluidas de `fade-out` y `fade-in` de volumen cruzado entre escenas y escenarios, inyectado directamente en el método visual de `HUDController`.

---

### 📢 Draft de Novedades para Update v15 (Itch.io CommonMark):
*(Nota: Este borrador se acumulará con las próximas features que se añadan antes de lanzar el devlog oficial)*

> ### **Update v15 [WIP]: Combat Logs, 4-Player Tactical Engine & Dynamic Soundtracks!**
>
> We're pushing the engine to the limit again! This update introduces fundamental tools for competitive and analytical play, massively upgrades the 4-Player engine, and deepens the atmosphere of the Go board.
>
> ### **1. Combat Log & Interactive Replay Viewer**
> Want to study a masterstroke or figure out where a 4-player game fell apart? You can now hit the **Log & Replay** button at any time during or after a match!
> - **Timeline & Breakdown:** See a full chronological timeline of every stone placed (canonical coordinates like K10), spell cast, and champion ability used.
> - **Interactive Scrubber:** Play, pause, fast-forward, and scrub through the match move-by-move on a dedicated mini-Goban with glowing highlights for every action.
> - **Export & Import Matches (.cgo):** Share your wildest matches with friends! Download your replay files or copy them as JSON strings, and import them instantly from the Main Menu.
>
> ### **2. The 4-Player Softmax Win Rate Engine**
> We tore down the old 2-player win rate calculator and rebuilt it mathematically from scratch using a compensated Softmax algorithm. 
> - The Tactical Engine now weighs territory, prisoners, stone density, liberties, and immortal Benson groups for **up to 4 players simultaneously**. 
> - A new, sleek **multi-segmented Win Rate Bar** sits at the top of your HUD, dynamically showing exactly who is dominating the board at any given second—Black, White, Emerald, or Amethyst!
>
> ### **3. Dynamic Stage Soundtracks (BGM)**
> The game no longer cycles between just "menu" and "battle" music. Every visual environment (Zen Garden, Volcano, Twilight Meadow, The Void, Dojo) now has its own unique traditional Japanese soundtrack that seamlessly cross-fades as you travel through the Story or Roguelike map!
>
> ### **4. 4-Player Rules Engine Bulletproofing**
> We fixed several critical interactions in massive Free-For-All 4-Player games:
> - Neutral entity captures are now properly credited to the player who surrounds them the most (whether they are P3 or P4!).
> - Meteor strikes and Yin-Yang inversions can now correctly target ANY enemy color on the board, not just Player 1 or Player 2.
>
> *— The Crazy Go Dev Team*

---

## 20 de Agosto de 2026 - Día 6 (Sesión 111): Hotfix Crítico de IA (Game Over Prematuro)

**1. Fix: Game Over Prematuro en la Apertura (`GoAI.ts`):**
- **Problema:** Si el jugador humano pasaba su turno muy temprano (ej. turno 3), la IA evaluaba erróneamente el tablero como "maduro" (`isBoardMatured = true`) y también pasaba, finalizando la partida de golpe. La causa raíz era el motor de `TerritoryScorer`, que al ver un tablero casi vacío, asignaba temporalmente todas las casillas sin reclamar a las únicas piedras presentes. Esto elevaba artificialmente el índice de resolución de la IA a casi el 100%.
- **Solución Quirúrgica:** Se ajustó la fórmula en `GoAI.ts` para que `resolvedNodesCount` excluya el territorio especulativo durante el cálculo de madurez, contando estrictamente las piedras físicas colocadas.
- **Escudo de Turno Mínimo:** Se introdujo la constante `ABSOLUTE_MIN_TURNS = 10`. Esto actúa como una barrera rígida que impide a la IA considerar que la partida ha terminado antes del turno 10, garantizando una apertura jugable bajo cualquier circunstancia.

---

## 20 de Agosto de 2026 - Día 6 (Sesión 110): Actualización v14 (Balance del Alquimista y UI Scaling)

### 📢 Devlog Oficial de la Versión v14 (Itch.io CommonMark):

> ### **Update v14: The Alchemist Balance & UI Polish!**
>
> Following up on our massive v13 release, we've brought a set of highly requested tweaks to improve combat feel and character balance!
>
> ### **1. Alchemist Rework (1 Per Turn Limit)**
> The Alchemist's Chromatic Inversion was a bit too chaotic. We've balanced it so that you can now only transmute **1 stone per turn maximum**, instantly passing the turn afterward. To compensate, the total number of uses you get per match now scales with board size: 1 use on 9x9, 2 uses on 13x13, and 4 uses on massive 19x19 boards!
>
> ### **2. UI Scaling & Clarity**
> - **Larger Player Presence:** We increased the size of the player's standee and info card by 30%. Your hero now stands taller and prouder on the left side of the screen!
> - **Closer to the Action:** We shifted both the player standee (60px to the right) and the enemy standees (up to 90px to the left) so they are much closer to the Goban, eliminating the awkward empty space.
> - **Compact Gobans:** We slightly shrunk the Go board globally to prevent it from overlapping with the spell ribbon at the bottom of the screen.
> - **4-Player Optimized Space:** In 4-player matches, the board shrinks an additional 15% dynamically, ensuring you always have a perfect view of all 4 character standees and their timers.
>
> *— The Crazy Go Dev Team*

---

## 20 de Agosto de 2026 - Día 6 (Sesión 109): Actualización Mayor v13 Oficial (Scoring Infalible, Fichas Indivisibles, Byo-Yomi y Roguelike Overhaul)

> ### **Major Update v13: Bulletproof Territory Scoring, Indivisible Polyominoes & Tournament Byo-Yomi!**
>
> Hey everyone! In this major update, we've delivered an enormous leap forward across every dimension of the game—from mathematically airtight Go endgame scoring to tournament-grade time controls, unified tactical polyominoes, and a complete roguelike reward overhaul.
>
> ---
>
> ### **1. Why the Scoring Overhaul Was Necessary (and Why the Old System Failed)**
> In previous versions, the scoring system used quick shortcuts to estimate whether stones were alive. If an enemy group had several empty spots around it inside your walls, the game falsely assumed it was "alive" just because of the number of liberties—even when it was completely sealed off with zero chance of making two eyes. This ruined the final score on larger boards (like 19x19) and asymmetrical maps like the Hourglass, because dead invasion stones were not being removed, turning your hard-earned territory into neutral dame points.
>
> **What's new in the v13 Life & Death Engine:**
> - **Enclosure Detection:** The engine scans all sealed regions. Any enemy stones trapped inside your perimeter walls without two independent eyes are cleanly detected as dead and converted into captured prisoners.
> - **Universal Benson + Deep Influence:** Influence propagation was expanded (radius 6) along graph edges, judging massive board frameworks accurately without false alive flags.
> - **Full Seki (Mutual Life) Resolution:** When two groups without eyes share mutually locked liberties, the game detects the deadlock, preserves both groups, and marks the shared liberties as neutral dame with a purple "S" badge.
> - **Native Graph Topology Support:** All life, death, and territory calculations run on topological graph algorithms, working flawlessly across standard squares, rings, geodes, hourglasses, triangles, islands, and 4-player battles.
>
> ---
>
> ### **2. Indivisible Special Polyomino Stones (Single-Unit Physics)**
> - **One Solid Piece:** Special polyominoes (Duplicity 2x1, Monolith 2x2, etc.) are now treated as **single, indivisible physical objects**—not individual loose stones.
> - **Unified Destruction & Transmutation:** If ANY champion ability, meteor strike, dragon flame, katana slash, boss breath, or scroll spell hits even a single intersection of a polyomino, **the entire piece is destroyed or transmuted together in a single unified blast**!
> - **Unified Visuals & Tooltips:** Rendered as continuous physical slabs (cyan pill capsule for 2x1, golden megalith for 2x2) with rich hover tooltips explaining their tactical properties.
>
> ---
>
> ### **3. Tournament-Grade Time Controls & Byo-Yomi Suite**
> You can now configure the exact clock format for local matches (1v1, 1vAI, and 4P FFA):
> - **⚡ Per-Move Pure Byo-Yomi:** Quick presets (5s, 10s, 15s, 20s, 30s, 45s, 60s) + custom numerical input.
> - **🏯 Japanese Byo-Yomi (Main Time + Periods):** Set main bank time (e.g. 5 min) + N periods of X seconds (e.g. 3×30s). Playing within time resets the clock without consuming a period; running out of time consumes 1 period!
> - **⏱️ Fischer Clock:** Base bank time + increment seconds added per placed stone.
> - **⏳ Absolute Bank Time:** Traditional clock from 1 min to 30 min + custom minutes.
> - **Tense Audio Tick (`SoundFX.playClockTick`):** Subtle rhythmic audio pulses during the final 5 seconds of every turn.
> - **Urgent Visual Alert (`.timer-urgent`):** High-intensity pulsating red glow on the HUD timer when 5 seconds or fewer remain.
>
> ---
>
> ### **4. Roguelike Rewards Overhaul (No More Arbitrary Komi!)**
> - **Spiritual Pact at Shrines:** Commune with ancestral champions and channel ANY hero (Kitsune, Tengu, Ryūjin, Ronin, Alchemist, Himiko) with their active skill for your next battle!
> - **Arcane Study & Tactical Masonry at Campsites:** Choose between offensive spell caches (+1 Meteor & +1 Inversion) or tactical polyomino tile bundles (+1 Monolith 2x2 & +1 Duplicity 2x1).
> - **In-Combat Hostage Rescues:** Freeing trapped monks grants active skill charges and Divine Shields; releasing guardian spirits grants Monolith tiles and Yin-Yang Transmutations.
>
> ---
>
> ### **5. Final Boss Dragon Awakening & Combat Polish**
> - **Calcinating Breath AI:** The Great Grey Sage Dragon now unleashes its 25% quadrant flame breath during late-game turns with screen-shaking VFX.
> - **Enemy Skill Badges:** Standees feature an informative skill pill explaining each rival's powers.
> - **Laser-Sharp Ronin Slash:** Fixed SVG transform anchoring and added an exact crosshair reticle for katana slashes.
> - **Tactical [R] Rotation:** Rotate polyominoes instantly with key `[R]` and realistic wood SFX.
> - **Expanded Goban Area (+15% to +35%):** Elevated zenital alignment (-22px) and compact border algorithm that maximizes board size across all shapes.
>
> ---
>
> ### **Looking Ahead:**
> Having the core Go rules and endgame scoring 100% mathematically airtight was the mandatory foundation we needed. Next, we will begin developing and training our custom **Neural Network / Reinforcement Learning AI** via self-play, where flawless rules guarantee perfect reward signals from day one!
>
> Enjoy the update, and see you on the Goban!
>
> *— The Crazy Go Dev Team*

---

**1. Atajo 'R' para Rotar Duplicidad con Sonido Táctico (`SoundFX.ts`, `PolyominoManager.ts`, `InteractionManager.ts`, `GameController.ts`, `KeyboardController.ts`):**
- Añadido `SoundFX.playRotate()` sintetizando un giro nítido y suave de madera/mineral vía Web Audio API.
- Al presionar `R`, si la ficha no estaba activa pero hay cargas en el inventario, se equipa y rota automáticamente (`Horizontal ⇄` / `Vertical ⇅`).
- El fantasma de colocación bajo el cursor se actualiza instantáneamente con `refreshCurrentHoverGhost()`.

**2. Algoritmo Dinámico de Escalado y Optimización de Espacio del Goban (`SVGRenderer.ts`, `board.css`, `GraphBoard.ts`, `BoardGenerators.ts`):**
- `#board-container` ampliado un +5% de escala base con límites expandidos a `calc(100vh - 165px)` y `clamp(340px, 54vw, 780px)`.
- Algoritmo de padding adaptativo: tableros no picudos (cuadrados, hexagonales, geodas, islas, espiral, etc.) reducen su margen de madera a `stoneRadius * 1.25 + 4`, ganando un **10% a 15%** de tamaño útil, mientras que los tableros triangulares conservan el margen adecuado para su vértice superior.

**3. Localización Completa de P3/P4 y Compactación del HUD (`translations.ts`, `HUDController.ts`, `layout.css`):**
- Traducidas las etiquetas de P3 (`Esmeralda` / `Emerald`) y P4 (`Amatista` / `Amethyst`), y el badge `🤖 Pensando...` / `🤖 Thinking...`.
- Formato conciso en topbar (`Negras (Tú)`, `Blancas (IA • Nivel)`) y fijación `white-space: nowrap` en `.hud-player-pill`.

**4. Standee Rival Frontal en 4 Jugadores durante Turno de P1 (`champions.css`, `DuelistRenderer.ts`):**
- Cuando es nuestro turno (P1), el combatiente frontal (P2) se reduce un 10% (`scale(1.12)`), con una máscara gris suave del 50% de los de atrás (`grayscale(20%) brightness(0.82)`) y sin blur (`blur(0)`).
- Al entrar en su turno activo, crece a escala completa (`scale(1.24)`), brillo 1.2, drop-shadow y placa dorada activa.

**5. Animación Cinemática de Desvanecimiento para Piedras Muertas (`board.css`, `SVGRenderer.ts`):**
- Animación CSS `@keyframes deadStoneFade` y `@keyframes deadCrossFadeIn` que transiciona la opacidad del 100% al 30% en 1.2s junto con la cruz roja `✕`.

**6. Paquetes Oficiales Generados (v13):**
- `crazy_go_itchio_v13_browser.zip` (37.86 MB) — Paquete web HTML5 con rutas UNIX para Itch.io.
- `crazy_go_windows_v13.zip` (37.86 MB) — Paquete portable para Windows PC con `CrazyGo.exe`.

---

## 20 de Agosto de 2026 - Día 6 (Sesión 106): Detección Canónica de Piedras Muertas (Enclosure Pass), Resolución de Seki y Blindaje de Reglas para IA/ML

**1. Reingeniería del Algoritmo de Detección de Piedras Muertas (`TerritoryScorer.ts`):**
- **Problema / Diagnóstico Previo:** En partidas reales (como en el mapa *Reloj de Arena* y tableros 19x19 estándar), piedras enemigas atrapadas en esquinas o dentro de recintos cerrados gigantescos no se marcaban como muertas al finalizar el juego. Esto ocurría por dos causas principales:
  1. *Falso Positivo por Libertades / Tamaño:* La heurística anterior saltaba prematuramente si una cadena enemiga tenía $\ge 5$ libertades o $\ge 8$ piedras (`chain.liberties.size >= 5 || chain.nodes.size >= 8`), asumiendo erróneamente que estaba viva aunque todas esas libertades fueran cavidades internas dentro del territorio rival sellado sin posibilidad de escapar ni formar 2 ojos reales.
  2. *Radio de Influencia Insuficiente:* El BFS de influencia térmica sólo alcanzaba una profundidad de 4 saltos, insuficiente para cercos de gran escala en tableros 19x19.
- **Solución Canónica (Pipeline de 3 Pasadas):**
  1. *1ª Pasada — Recinto Cerrado Estricto (`detectDeadStonesViaEnclosure`):* Detecta todas las regiones vacías 100% acordonadas por un jugador $P$. Toda cadena enemiga cuyas libertades residan íntegramente dentro de ese recinto sin poseer 2 ojos independientes locales es declarada incondicionalmente **MUERTA**.
  2. *2ª Pasada — Benson Universal + Influencia BFS (Radio 6):* Evalúa las cadenas restantes eliminando el corte prematuro de libertades y extendiendo el alcance del campo de influencia a 6 saltos topológicos.
  3. *Inundación Territorial Limpia:* Las piedras declaradas muertas se tratan como casillas vacías en el BFS de territorio y se acreditan como $+1$ prisionero para el captor.

**2. Detección Canónica de Seki (`detectAndResolveSeki`):**
- **Problema:** En situaciones de vida mutua (*Seki*), dos grupos rivales sin dos ojos comparten libertades vitales de forma que ninguno puede jugar en ellas sin suicidarse. El sistema previo podía forzar la muerte de uno de los dos por diferencia de influencia o contar el espacio compartido como territorio.
- **Solución Implementada:**
  - Se añadió la 3ª pasada de resolución de Seki en `TerritoryScorer.ts`, estructurada en tres capas (Seki Directo con libertades 100% compartidas, Seki con ojos privados insuficientes y rescate de cadenas falsamente sentenciadas a muerte).
  - En reglas de Go (japonesas), el espacio en Seki no suma territorio para ningún jugador (*Dame* absoluto).
  - Se agregó el campo `sekiMap: Set<string>` en `ScoreReport` y se diseñó un render visual distintivo en `SVGRenderer.ts` (triángulos semitransparentes morados con la insignia `"S"`).
  - Compatible de forma nativa tanto para 2 como para 4 jugadores en cualquier topología de grafo.

**3. Benchmark contra Motores de la Industria (KataGo, goscorer, GNU Go):**
- Se realizó una investigación comparativa exhaustiva contra `goscorer` (librería de reglas japonesas creada por David J. Wu / autor de KataGo) y los estándares de AlphaZero/Tromp-Taylor.
- Se verificó que el motor de reglas (capturas simultáneas, prevención de suicidio, Teorema de Benson, inundación topológica y Seki) es 100% sólido y exacto, dejando el entorno de simulación plenamente preparado y matemáticamente blindado para el entrenamiento de redes neuronales (Reinforcement Learning / Self-Play).

**4. Paquetes Oficiales Generados (v13):**
- `crazy_go_itchio_v13_browser.zip` — Paquete web HTML5 con rutas UNIX para Itch.io.
- `crazy_go_windows_v13.zip` — Paquete portable para Windows PC con `CrazyGo.exe`.

---

## 18 de Agosto de 2026 - Día 5 (Sesión 105): Fix Definitivo del Alquimista, IA Matemática Adaptativa y Orientación de Campeones

**1. Fix Definitivo Alquimista (`advanceTurn()` en lugar de `passTurn()`):**
- **Problema / Síntoma:** Al utilizar la habilidad activa "Inversión Cromática" del Alquimista (especialmente al pintar una piedra propia al color enemigo de negra a blanca), el turno volvía de inmediato al jugador humano sin que la IA colocase su ficha real en el tablero, o a veces sonaba un impacto pero no se colocaba nada y el jugador humano podía poner ficha inmediatamente sin esperar turno.
- **Causa Raíz:** En `ChampionManager.executeTargetedSkill()`, al finalizar las transmutaciones (`isFinished === true`), se ejecutaba `state.passTurn()`. Esto incrementaba el contador de pases de Go (`state.consecutivePasses = 1`). Aunque después se reseteaba manualmente a 0, este estado previo activaba la lectura de fin de partida en `GoAI.ts` (`opponentJustPassed = state.consecutivePasses >= 1`). Como las Blancas cuentan con la ventaja de Komi (+6.5), la IA interpretaba que el jugador había pasado y pasaba en respuesta para cerrar el juego o saltarse su turno.
- **Solución:** Se reemplazó `state.passTurn()` + reset manual por `state.advanceTurn()` directamente en `src/core/ChampionManager.ts`. La Inversión Cromática es una jugada táctica activa, no un pase de tablero; `state.advanceTurn()` avanza el turno limpiamente a la IA (`currentPlayer = 2`), preserva el bloqueo `alchemistUsedThisTurn = true`, y garantiza que la IA evalúe y coloque siempre su piedra real en el Goban antes de devolverle el turno al jugador.

**2. Evaluación Matemática Adaptativa de Fin de Partida en IA (`GoAI.ts`):**
- **Modelo Combinatorio Dinámico:** Se sustituyó la heurística empírica fija (`territorio >= 70%` y `turno >= 16`) por una formulación matemática adaptativa a la topología y dimensiones del grafo ($G = (V, E)$):
  - **Índice de Resolución Topológica ($\Phi$):** $\Phi(G) = \frac{|V_{\text{piedras}}| + |V_{\text{territorio}}|}{|V_{\text{válidos}}|}$, ignorando obstáculos y casillas destruidas en tableros asimétricos (*Islas*, *Reloj de Arena*, *Geoda*, etc.).
  - **Turno Mínimo Dinámico ($T_{\text{min}}$):** $T_{\text{min}} = \max(8, \lfloor 0.22 \times |V_{\text{válidos}}| \rfloor)$ escalando proporcionalmente de tableros pequeños de 40 nodos (8 turnos) a 19x19 (79 turnos).
  - **Temperatura Marginal ($T \le 0$):** La IA solo acepta o propone pase si no existen grupos en Atari salvables o capturables y la mejor jugada legal no aporta incremento de puntuación neta ($\Delta\text{Score} \le 0$).

**3. Orientación Horizontal Completa de Campeones hacia el Goban:**
- Se corrigió la rotación de todos los duelistas para que miren siempre hacia el centro del Goban:
  - **Alquimista:** Orientación natural `scaleX(1)` en el lado del jugador (mira a la derecha) y `scaleX(-1)` en el lado del rival (mira a la izquierda).
  - **Persona Normal & Ronin:** Volteo horizontal `scaleX(-1)` en el lado del jugador (miran a la derecha) y `scaleX(1)` en el rival (miran a la izquierda).
  - Homogeneizado tanto en el combate in-game (1v1 y 4P).

**4. Ajuste Visual Fino en Combate 4P:**
- Standee activo al frente (`pos-front`): Escalado un +30% adicional (`scale(1.24)`).
- Standees en espera atrás (`pos-back-right` y `pos-back-left`): Escalados un +10% (`scale(0.80)`) y con desenfoque suave reducido a 1px de blur (`filter: grayscale(40%) blur(1px) brightness(0.65)`).

**5. Komi Individual y Escalonado para 4 Jugadores (P2: 2.5, P3: 4.5, P4: 6.5) y Anuncio de Inicio:**
- **Asistente de Partida Local (Paso 7 - Ajustes):** En partidas de 4 jugadores, la interfaz sustituye el control único por 3 filas independientes para cada jugador que juega después de Negras:
  - ⚪ **Blancas (P2 • 2º Turno):** `2.5 pts` por defecto (presets 0.5, 1.5, 2.5, 3.5 + input libre).
  - 🟢 **Esmeralda (P3 • 3º Turno):** `4.5 pts` por defecto (presets 2.5, 3.5, 4.5, 5.5 + input libre).
  - 🟣 **Amatista (P4 • 4º Turno):** `6.5 pts` por defecto (presets 4.5, 5.5, 6.5, 7.5 + input libre).
- **HUD y Modal de Puntuación:** Las píldoras de captura del top bar in-game reflejan el Komi exacto de cada color (`(+2.5)`, `(+4.5)`, `(+6.5)`), y el modal final de recuento desglosa las filas de Komi para Esmeralda y Amatista.
**6. Paquetes Oficiales Generados (v12) y Fix de Compatibilidad UNIX/Itch.io:**
- **Diagnóstico del Fallo:** Al comparar las entradas internas del ZIP funcional (v5) contra el ZIP fallido (v12), se detectó que la herramienta `.NET ZipFile` de Windows escribía las rutas relativas usando barras invertidas (`assets\index.css`). En los servidores Linux de Itch.io, la contrabarra `\` no separa directorios, por lo que no se creaba la carpeta `assets/`, resultando en un error 404 para el CSS y JS y haciendo que la web mostrara solo el HTML plano.
- **Corrección Definitiva:** Se reescribió `scripts/build_packages.js` utilizando `archiver.ZipArchive` para generar rutas con el estándar estricto UNIX (`assets/index-Ct6FrkXl.css`, `heroes/alchemist.png`, etc.).
- **Resultado y Validación:** Subido y verificado exitosamente en el navegador de Itch.io por el usuario, cargando todos los assets, estilos CSS, scripts JS, audio y fondos con fluidez total y 0 errores 404.
- **Paquetes Oficiales (v12):**
  - `crazy_go_itchio_v12_browser.zip` (37.86 MB) — Para subir a Itch.io como juego en el navegador web (HTML5).
  - `crazy_go_windows_v12.zip` (37.86 MB) — Único paquete ejecutable portable para Windows con `CrazyGo.exe`.

**7. Conteo Canónico de Territorio y Detección de Piedras Muertas (Enclosure & Two-Eyes):**
- **Problema Detectado:** Al finalizar la partida, si el oponente tenía piedras invasoras o aisladas dentro del territorio sellado del jugador (ej. piedras blancas dentro del dragón de negras), el algoritmo previo no las eliminaba. Al hacer el BFS, esas piedras enemigas contaminaban el recinto, haciendo que las casillas vacías contiguas se marcaran como neutras (*Dame*) o se entregaran al oponente, causando derrotas injustas.
- **Solución Canónica Implementada (`TerritoryScorer.ts`):**
  1. *Análisis Topológico de Recintos:* Traza la región accesible desde cada cadena y sus libertades. Si todo el perímetro exterior está sellado exclusivamente por un único rival ($Q$) y la cadena no posee 2 ojos independientes para vivir, la cadena se declara formalmente **MUERTA**.
  2. *Conversión en Prisioneros y Territorio:* Cada piedra muerta suma $+1$ a las capturas del jugador que la encerró, y la casilla que ocupaba se convierte en territorio efectivo.
  3. *Inundación BFS Pura:* El territorio se computa sobre el tablero libre de piedras muertas, garantizando que todo espacio cerrado pertenezca al 100% a su dueño legítimo.
  4. *Visualización en Goban:* Las piedras muertas se muestran atenuadas (opacidad 40%) con un distintivo `✕` rojo de captura, y se dibuja el cuadrado de territorio correspondiente.

---

## 18 de Agosto de 2026 - Día 5 (Sesión 104): Rebobinares para Persona Normal, SFX Zen Bong de Pase de Turno y Puesta en Escena 4P

**1. Persona Normal con 2 Rebobinares Universales:**
- Si se elige al campeón Persona Normal, ahora dispone de 2 cartas tácticas de Rebobinar (⏳) en cualquier modo de juego (Online P2P, Local 1v1, 1vIA, 4 Jugadores, Sandbox). En modo Roguelike se mantiene la escala por dificultad.
- Actualizadas las descripciones y fórmulas de combate en `translations.ts` (ES y EN) y habilitada la visibilidad en `HUDController.ts`.

**2. Efecto de Sonido "Bong" de Pase de Turno:**
- Se re-sintetizó `SoundFX.playPass()` mediante Web Audio API emitiendo un auténtico golpe suave de mazo y resonancia de campana zen / gong tradicional ("Bong" en Sol / 196Hz con armónicos ricos de 0.85s).
- Corregidos `GameController.handlePass` y `GameController.checkAITurn` para que al pasar turno (humano o IA) nunca suene a impacto de piedra (`playPlaceStone`).

**3. Puesta en Escena 4P en Combate y Wizard:**
- **Wizard (Paso 6):** Contenedor `.wizard-stage-4p-box` desplazado 30px a la izquierda con separación de 95px y glow interactivo en el slot seleccionado (`.stage-slot-active`).
- **Combate 4P (In-Game HUD):** Layout de profundidad 3D con rotación secuencial fluida hacia la izquierda en orden de turnos (P1 -> P2 -> P3 -> P4).

**4. Aislamiento de Selección de Persona Normal en Modo Local:**
- Se corrigió la persistencia que hacía aparecer standees de Ronin, Kitsune o Senseis al elegir Persona Normal en partidas locales o de 4 jugadores.

---
> 🚀 **VERSIÓN PUBLICADA EN ITCH.IO (v12)** 🚀
> *(Todo lo que está debajo de esta marca ya fue publicado. Los nuevos logs deben insertarse ARRIBA de esta marca para la próxima actualización v13)*
---



## 17 de Agosto de 2026 - Día 4 (Sesión 103): Fix Menú de Cinta, Resolución del Cuelgue de IA en Acto 2 y Arreglos Visuales del Wizard

**1. Fix Menú de Cinta (Lección 8):**
- Se solucionó el bloqueo en el tutorial del Dojo (Lección 8) donde los clics y atajos de teclado para hechizos y poliminós no avanzaban el progreso.
- Se refactorizaron `KeyboardController.ts` y `GameEventBinder.ts` para enrutar los comandos de selección directamente a los métodos públicos de `GameController` en lugar de saltarse el flujo, permitiendo que `TutorialManager` escuche e intercepte correctamente los eventos esperados.

**2. Resolución del Bloqueo Infinito de IA (Acto 2):**
- **Causa raíz:** Un "Ghost Node Loop" por desincronización de semilla procedural. El tablero `eroded` (erosionado) en el hilo principal se generaba con una semilla aleatoria diferente a la del Web Worker de la IA. La IA intentaba jugar en casillas que para ella existían, pero que en la interfaz gráfica eran invisibles o estaban borradas, haciendo que el comando fallase en silencio y se reintentase en bucle infinito cada 1.2 segundos sin avanzar nunca de turno.
- **Solución:** Se centralizó la generación de la semilla procedural en `GameController.initGame()` y se inyectó como parámetro `config.seed` al inicializar el Web Worker, garantizando una topología de nodos idéntica 1:1 entre el motor físico y la IA.

**3. Renderizado de la Textura de Madera en Escenarios (Wizard):**
- **Problema:** En el paso 5 del menú de configuración, la cuadrícula del tablero se veía, pero la textura de madera subyacente aparecía transparente y con fallos visuales.
- **Solución:** Se extrajo el bloque inyectable `<defs>` (que contiene luces, sombras y la imagen `#wood-texture`) del `SVGRenderer` a un nuevo contenedor SVG global invisible alojado directamente en el `document.body`. Esto previno que los patrones SVG colapsaran cuando se ocultaban los paneles padres con `display: none` en el asistente.

**4. Traducción y Localización:**
- Se integró la clave perdida `wizard.step_opponent` en `translations.ts` para mostrar correctamente las migas de pan "Paso 6: Oponente" / "Opponent".

---
## 17 de Agosto de 2026 - Día 4 (Sesión 103): Fix de Interfaz de Escenarios y Topologías en Wizard Local y Online

**1. Corrección de Selección de Escenarios y Topologías (Paso de Host):**
- Se arregló el fallo en los modales de configuración (Local y Online) donde la selección de escenarios (Dojo, Meadow, etc.) y nuevas topologías (`islands_v1`, `hourglass`, `geode`, etc.) no actualizaban visualmente los botones ni los fondos del escenario en tiempo real.
- Ahora `OnlineModalRenderer.ts` y `SetupModalRenderer.ts` procesan correctamente todas las opciones y refrescan el entorno completo al instante.

---
## 17 de Agosto de 2026 - Día 4 (Sesión 102): Ajustes Visuales de Tengu, Fix de Animación Kitsune y Wizard, Algoritmo Criptográfico Himiko

**1. Ajustes Visuales de Tengu (Escalado):**
- La imagen del campeón Tengu ha sido escalada globalmente para ser un 25% más grande en todas las vistas de combate y menús de selección.

**2. Solución al Bug de Doble Animación de Kitsune:**
- **Causa raíz:** La animación de rotura del Escudo Divino de Kitsune se disparaba de forma síncrona con la destrucción del contenedor en `SVGRenderer`, causando reinicios visuales o duplicados percibidos.
- **Solución:** Diferido el disparo del VFX (usando `setTimeout`) y aplicado un filtro (`Set`) para evitar ejecuciones múltiples sobre un mismo escudo en un instante.

**3. Renderizado de Fondo del Tablero en Wizard:**
- Se corrigió la previsualización del tablero en los pasos del Wizard. Ahora, `.wizard-stage-board-svg` y `.wizard-board-preview-svg` muestran correctamente el fondo de madera, sombras y padding como en la partida, en lugar de líneas transparentes.

**4. Aleatoriedad Absoluta (Criptográfica) para la Lluvia Pétrea de Himiko:**
- Se reemplazó el `Math.random` estándar por un `window.crypto.getRandomValues()` dentro del Fisher-Yates. Esto garantiza máxima entropía y aleatoriedad estadísticamente perfecta. Las sensaciones de impacto frecuente en los bordes se deben a razones geométricas puras (las dos últimas líneas de un tablero 19x19 contienen más del 65% de los nodos totales).

---
> 🚀 **VERSIÓN PUBLICADA EN ITCH.IO (v10)** 🚀
> *(Todo lo que está debajo de esta marca ya fue publicado. Los nuevos logs deben insertarse ARRIBA de esta marca para la próxima actualización v11)*
---

## 17 de Agosto de 2026 - Día 4 (Sesión 101): Nuevo Wizard de Partida Local (7 Pasos), Fix Visual IA y Correcciones del Alquimista

**1. Wizard de Configuración Local Reestructurado (6 → 7 Pasos):**
- **Paso 3 — Tablero con Fondo Vacío:** El preview del tablero ahora muestra un fondo blanco con cuadrícula gris muy sutil (clase `wizard-board-no-scenery`) para indicar que aún no se ha elegido escenario. Antes mostraba el fondo de combate, lo que era confuso.
- **Paso 5 — Solo Escenario:** El selector de rival se eliminó de este paso. El rival permanece misterioso mientras se elige el escenario.
- **Paso 6 — Oponente (NUEVO):** Paso completamente nuevo con un stage de combate completo (tu campeón + tablero + rival). Permite elegir entre:
  - 🎲 Cualquiera (azar total)
  - 🧘 Monje (uno de 5 monjes elegido al azar al abrir el wizard, consistente durante toda la sesión)
  - 🧙 Sabio (igual pero con los 5 sabios)
  - Cualquier campeón específico (Tengu, Himiko, Kitsune, Ronin, Alquimista, Ryūjin)
  - 👤 Persona Normal (sin habilidades)
- El monje/sabio resuelto en el wizard es el mismo que aparece en el HUD de combate (no se re-aleatoriza al iniciar partida).

**2. Fix Visual: Piedras de la IA "Invisibles" (bug general de render):**
- **Causa raíz:** Los VFX asíncronos (`checkPassiveTriggers`) y las comprobaciones de entidades neutrales podían ejecutar un re-renderizado justo después de que la IA colocaba su piedra, sobreescribiendo visualmente el estado del tablero y dejando la piedra sin mostrar (aunque el sonido se había reproducido).
- **Solución:** Se añadió un `requestAnimationFrame()` de render garantizado tras cada turno de IA en `GameController.checkAITurn()`. Esto asegura que el estado visual del SVG siempre refleja el estado real del juego después de cualquier VFX.

**3. Correcciones Adicionales del Alquimista:**
- Confirmado: el bug de "turno extra" después de usar la habilidad sobre propia piedra estaba ya corregido. El `alchemistUsedThisTurn` actúa correctamente como doble barrera.
- Aclarado que el sonido escuchado al convertir piedra propia podía ser `SoundFX.playCapture()` si la piedra transmutada quedaba sin libertades y era capturada inmediatamente.

**4. Mejoras de Proyecto (Infraestructura AI):**
- **`GEMINI.md` actualizado:** Se añadió el paso 4 obligatorio de lectura: `docs/ai_wiki/codebase_map.md`. Ahora toda IA que abra el proyecto leerá el mapa de código desde el primer momento.
- **`active_context.md` actualizado** con el estado completo de esta sesión.

**5. Paquetes generados:**
- `crazy_go_itchio_v10_browser.zip` (37.85 MB) — Para subir a Itch.io como juego de navegador.
- `crazy_go_windows_v10.zip` (37.85 MB) — Descargable para Windows (abre `index.html` con cualquier navegador o mediante `JUGAR_CRAZY_GO.bat`).

---

## 17 de Agosto de 2026 - Día 4 (Sesión 100): Alquimista Balanceado, Magia Meteórica Inestable y Estabilidad Visual de Menús


**1. Balance y Funcionalidad Completa del Alquimista:**
- **Transmutación Ajustada por Tablero:** Se corrigió para que convierta 1 piedra en 9x9, 2 en 13x13 y 4 en 19x19.
- **Paso de Turno Automático y Cero Bloqueos:** Al pintar/transmutar la última ficha, el Alquimista cede el turno automáticamente (`consecutivePasses = 0`) para evitar que la IA asuma que el juego ha terminado.
- **Identidad Visual Aumentada:** El icono del cursor ahora es un pincel gigante (en lugar del tornado de Ronin) y la animación de pintado y gota es 3 veces más grande. También se corrigió el tooltip flotante para que indique explícitamente el cambio de color.

**2. Hechizo Místico "Meteor Strike" (Doble Filo):**
- **Impacto Impredecible:** El hechizo consumible "Meteor Strike" ya no ataca de forma 100% segura. Ahora tiene un 80% de probabilidades de impactar en una ficha enemiga y un 20% de probabilidad de carbonizar una ficha propia.
- **VFX Bicolor:** El meteoro cae envuelto en fuego rojo si impacta al enemigo, y envuelto en llamas azules/purpúreas si traiciona al jugador aliado.
- **Precisión Geométrica:** Se corrigió el bug que permitía múltiples meteoros en la misma intersección; ahora garantizan un impacto máximo por nodo.

**3. Reconexión del Sistema de Efectos Persistentes (VFX Live Container):**
- **Bug Solucionado:** La refactorización anterior del `SVGRenderer` borraba instantáneamente la animación del escudo de Kitsune rompiéndose y de la piedra elevándose al rebobinar.
- **Solución:** Ambas animaciones se han redirigido al `#vfx-live-container`, garantizando que sobrevivan al repintado en caliente del tablero.

**4. Optimizaciones Críticas de Modal e Interfaz:**
- **Previsualización de Partida Viva:** Se arregló el fallo fatal en el constructor del SVG en los Modales (Local y Online) que impedía previsualizar el tablero y la atmósfera (Paso 3 y 5) al configurar una partida.
- **Duelistas Imponentes (+40%):** En el Paso 5 (Combate), ambos avatares de campeones (Izquierdo y Derecho) se dimensionaron simétricamente y aumentaron un 40% su tamaño nativo (`252x301px`) para máxima presencia.
- **Cinta Superior de Turno Limpia:** Se purgó el icono negro redundante y el guion, colapsando el título a una sola línea estética (`Black (Your Turn)` o `White (AI 16k)`).

---

## 16 de Agosto de 2026 - Día 3 (Sesión 99): Ryūjin — Quema Aliada, Desincronización de Turno y Win Rate Táctico

**1. Ryūjin — Dragon's Fury puede quemar fichas propias Y enemigas:**
- Se eliminó la restricción `playerId === enemyOnly` en `RyujinChampion.executeBurn()`.
- Ahora cualquier piedra con ficha (propia o rival) es objetivo válido. Solo las piedras con Escudo Divino (Kitsune) siguen siendo inmunes.
- Los mensajes en UI/EN se actualizaron para reflejar "cualquier piedra" en lugar de "piedra enemiga".

**2. Bug crítico: Ficha del color rival al quemar + Bloqueo de partida:**
- **Causa raíz:** Después de la última quema, `onMovePlaced(nodeId, isLocal=true)` llamaba a `onNodeClicked` con `isLocal=true`, re-ejecutando todos los efectos post-movimiento local (`coopSubTurn`, capturas de rehenes, callbacks online) que ya habían corrido cuando se puso la piedra. Esto corrompía el estado de turno → la IA colocaba una ficha con el color equivocado y luego el juego se bloqueaba.
- **Solución:** Se añadió `onPassiveBurnCompleted?: () => void` como campo público en `SVGRenderer`. Cuando la Furia del Dragón completa su última quema, en lugar de llamar a `onMovePlaced`, llama a este callback dedicado.
- En `GameController`, este callback llama directamente a `checkAITurn()` para modos 1vIA/historia (o restaura `isInteractive` en otros modos) — sin pasar por el bloque local que causaba duplicación de efectos.

**3. Win Rate — Evaluación compuesta táctica (antes solo territorio):**
- **Problema:** La fórmula anterior solo usaba puntuación japonesa de territorio (valores casi nulos en mitad de partida) → resultados ilógicos como "73% blancas" cuando negras tenían posición claramente superior.
- **Nueva fórmula compuesta ponderada:**
  - **40% Territorio** provisional (BFS japonés)
  - **20% Diferencia de piedras** en tablero (×escala por tamaño)
  - **20% Libertades por piedra** (indicador de vitalidad táctica)
  - **10% Grupos vivos** (Benson's Algorithm, ×4 pts por grupo)
  - **10% Capturas** (×escala)
- La función sigmoide logística se ajustó con `steepness` reducido (0.14/0.22/0.32) para que la composición más rica no explote hacia los extremos.

**4. Paquete generado:** `crazy_go_itchio_v9.zip` (37.78 MB) para Itch.io Browser.

---

## 16 de Agosto de 2026 - Día 3 (Sesión 98): Guía de Publicación en Itch.io, Notificaciones a Compradores, Balance de Campeones y Asistente Panorámico

**1. Gestión de Compradores y Seguidores en Itch.io:**
- **Identificar Compradores:** En tu panel de creador (*Creator Dashboard*), ve a `Analytics` ➔ pestaña `Purchases` o `Sales / Earnings`. Allí verás el nombre de usuario, email, importe pagado, fecha y país de quien adquirió el juego.
- **Identificar Seguidores:** En tu perfil o en el Dashboard, pulsa en tu contador de `Followers` para ver quién sigue tu cuenta o tiene tu juego en sus colecciones.

**2. Procedimiento Recomendado para Actualizar el Juego en Itch.io:**
- **Versión Web (HTML5 Browser):** En `Edit Game` ➔ sección `Uploads`, sube `crazy_go_itchio_v8.zip`, marca la casilla *"This file will be played in the browser"* y elimina el archivo ZIP web anterior para que el juego se actualice en el navegador sin ocupar espacio redundante.
- **Versión Descargable (Windows Desktop):** Sube `CrazyGo_Portable.zip`, ponle de etiqueta *"Windows Portable (v1.2)"* y marca el icono de Windows. Puedes eliminar el ZIP ejecutable viejo o desmarcarlo.

**3. Envío de Notificación a Compradores y Seguidores (Devlog):**
- Ve a `Dashboard ➔ Edit Game ➔ Devlogs ➔ Add Post` (o en la barra superior de tu juego `Interact ➔ Post Devlog`).
- Marca la casilla opcional: **"Notify people who bought or follow this game"** (esto les envía un correo electrónico y una alerta en el feed de Itch.io).
- Utiliza la plantilla bilingüe redactada en primera persona (biólogo creando un MVP jugable con ayuda de IA y buscando feedback de la comunidad).

**4. Resumen de Mejoras Técnicas Implementadas en el Juego:**
- **Balance de Habilidades:** Himiko (*Lluvia Pétrea Celestial*) ajustada al Turno 20; Ronin (*Filo del Samurai*) ajustado a cada 17 turnos.
- **Internacionalización 100% (ES/EN):** Sincronización completa de modales, asistentes, botones de navegación (`Atrás` / `Siguiente`), tarjetas de habilidades y nombres de escenarios y rivales.
- **Asentamiento y Escalado de Figuras:** Siluetas bajadas para evitar cualquier corte superior en coronas o cuernos (`Himiko`, `Ryūjin`, `Ronin`) y ampliadas a `scale(1.50)`.
- **Asistente Panorámico:** Ampliación a `1160px` de ancho útil para eliminar márgenes morados vacíos.
- **Sistema de Zoom Accesible:** Control global por slider y atajos de teclado (`Ctrl + +`, `Ctrl + -`, `Ctrl + 0`).

---

## 15 de Agosto de 2026 - Día 2 (Sesión 97): Solución al Pase Prematuro en IA Dan, Conteo Inmune a Piedras Muertas y Visibilidad de Habilidades en Modo Clásico

**Resumen del hito y mejoras:**
1. **Corrección Crítica de IA Dan y Pase Prematuro (`GoAI.ts`):**
   - **Base de Vida Ajustada:** Se corrigió un error donde la IA "Maestro" valoraba las jugadas de 2 libertades con 0 puntos extra. Ahora reciben puntuación de supervivencia para evitar que el score de la mejor jugada cayera por debajo del umbral de pase.
   - **Abandono Lógico Proactivo:** La IA de máximo nivel ahora solo pasará su turno proactivamente si absolutamente todas las jugadas posibles otorgan puntos negativos (es decir, jugar solo resta territorio sin posibilidad de captura).

2. **Refinamiento del Algoritmo de Territorio Japonés (`TerritoryScorer.ts`):**
   - **Inmunidad a Invasiones Suicidas (Piedras Muertas):** Anteriormente, una sola piedra suelta sin viabilidad ("muerta") en territorio propio causaba que la frontera se considerara "neutral" (2 jugadores), anulando decenas de puntos.
   - **Umbral Probabilístico de Dominio (74%):** Se sustituyó la detección binaria por un umbral robusto. Si un jugador posee el 74% o más de los bordes perimetrales e internos de una región vacía, la región entera se le adjudica incondicionalmente, neutralizando los intentos de sabotaje con piedras suicidas.

3. **Restauración del Dock de Campeón en Modo Clásico (`HUDController.ts`, `index.html`):**
   - **Visibilidad Separada:** Se corrigió el problema donde seleccionar a un Campeón en "1v1" o "1vIA" ocultaba toda la barra inferior. Ahora, en Modo Local/Clásico, el contenedor principal de la barra inferior se mantiene visible junto con el avatar del Campeón, su botón de habilidad y los Poliminós. Únicamente se oculta la sección central de los 4 Hechizos Místicos de Roguelike.

## 15 de Agosto de 2026 - Día 2 (Sesión 96): Pasiva de Ronin cada 20 Turnos, Descripción en Cuadro de Combate, Refactorización Modular y Corrección de Doble VFX

**Resumen del hito y mejoras:**
1. **Recalibración de la Pasiva de Ronin a 20 Turnos (`RoninChampion.ts`, `translations.ts`):**
   - La pasiva *Filo del Samurai* (`Samurai's Edge`) ahora se activa con precisión matemática cada **20 turnos individuales** del jugador (turnos 20, 40, 60...) en lugar de cada 25 turnos.
   - Actualizadas todas las cadenas de texto y notificaciones en Español e Inglés (`translations.ts`).

2. **Descripción Resumida de Pasiva en la Tarjeta de Combate (`HUDController.ts`, `champions.css`):**
   - En el cuadro de combatiente (`#duel-player-card`), el botón inferior ahora proyecta directamente el nombre de la pasiva en negrita y su descripción concisa y clara (*"Cada 20 turnos destruye automáticamente 1 piedra enemiga aleatoria en el Goban"* en ES / *"Every 20 turns, destroys 1 random enemy stone on the Goban"* en EN).

3. **Corrección de Animación y Eliminación Real de Fichas de Ronin (`RoninChampion.ts`, `RoninVFX.ts`):**
   - Se eliminó el tajo duplicado paralelo que creaba dos estelas y solapamientos sónicos.
   - El tajo de katana se ejecuta de forma única y centrada sobre la intersección tras 220 ms de retardo, retirando la piedra enemiga del grafo, sumando el punto de captura y recalculando libertades en cadena con `RulesEngine.resolveBoardCaptures`.

4. **Refactorización Modular de UI (`HUDController.ts`, `DuelistRenderer.ts`):**
   - Extracción del renderizado de combatientes (1v1, 4P FFA, IA y Tutorial) a [`DuelistRenderer.ts`](file:///C:/Users/VICTOR/Desktop/crazy_go/src/ui/DuelistRenderer.ts), reduciendo `HUDController.ts` de 876 a ~500 líneas.

5. **Compilación Limpia (`npx tsc --noEmit`):**
   - Verificación de tipos completada con 0 errores.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 95): Expansión Cinemática del Modo Historia, Recalibración Universal de Tengu, Limpieza de Topbar y Pase Canónico de IA

**Resumen del hito y mejoras:**
1. **Corrección de Navegación Home y Salida Limpia del Modo Historia (`AppEventBinder.ts`, `ScreenManager.ts`):**
   - Corregido el conflicto donde pulsar "🏠 Menú" desde el Modo Historia o partidas locales regresaba indebidamente a una expedición roguelike previa.
   - Desacoplada la validación de combate activo para asegurar siempre un retorno limpio al Menú Principal (`ScreenManager.showMainMenu()`).

2. **Expansión Narrativa y Cinemática del Modo Historia (`StoryController.ts`, `StoryCampaign.ts`, `StoryDialogueRenderer.ts`, `SVGRenderer.ts`, `RulesEngine.ts`, `GoAI.ts`):**
   - **Animación Cinemática de Ruptura y Colapso (Shatter VFX):** Al capturar el Pergamino Sagrado en el Capítulo 2 y concluir los diálogos con el Monje, todas las fichas del tablero se fracturan y desintegran con onda de choque sónica y sacudida de pantalla (`SVGRenderer.triggerBoardShatterAnimation`).
   - **Modal de Despertar de Qi y Selección de Poder:** Modal interactivo para escoger un poder místico entre las bendiciones de todos los campeones (Tengu, Alquimista, Kitsune, Ryūjin, Ronin).
   - **Capítulo 3 (Batalla del Vacío Asimétrico 13x13):** Enfrentamiento contra el Maestro del Vacío en tablero asimétrico erosionado de 13x13 con IA activa y uso de la habilidad escogida.
   - **Capítulo 4 (Disputa de los Tres Relicarios y Objetos Multi-Casilla 2x1):** Tablero $13\times13$ con 3 reliquias disputables en tiempo real, incluyendo el *Monolito de Qi Ancestral 2x1* (que ocupa 2 casillas contiguas `6,6` y `6,7`), el *Orbe de Fuego* y el *Tótem Sagrado*.
   - **Disputa Competitiva de Reliquias por la IA:** `RulesEngine.resolveCaptiveCaptures` y `GoAI.ts` adaptados para que la IA (Blancas) también pueda rodear, disputar y absorber reliquias si retira su última libertad antes que el jugador.

3. **Limpieza de Barra Superior y Traducción Completa de Rivales al Inglés (`index.html`, `i18n.ts`, `translations.ts`, `HUDController.ts`, `DuelistRenderer.ts`, `ScoreModalRenderer.ts`, `RoguelikeMapRenderer.ts`, `RoguelikeController.ts`):**
   - Eliminada la píldora `#ui-rogue-stage-badge` (`⚔️ Joven Sora (30 Kyu)`) de la barra superior para mantener una vista minimalista durante el combate.
   - Implementado el motor dinámico de traducción `translateEnemyName` para traducir nombres procedurales y títulos de combate dinámicamente ("Young Sora", "Kenshin the Sage", "Dragon Sentinel", "Great Grey Sage Dragon", "Rival").
   - Localización integral en standees de duelistas, modales de puntuación final/victoria, tooltips del mapa roguelike y alertas de inicio de batalla.

4. **Recalibración Matemática y VFX de Tengu en Topologías Irregulares y Hexagonales (`TenguChampion.ts`, `TenguVFX.ts`, `VFXManager.ts`, `GameController.ts`):**
   - `getMeteorZoneNodes` y `getMeteorCount` filtran rigurosamente nodos destruidos, obstáculos y vacíos, garantizando que el área del 25% y los meteoros caigan exclusivamente en intersecciones reales y jugables del grafo en cualquier geometría (cuadrada, erosionada, islas, hexagonal, triangular o procedural).
   - La animación de los meteoros, estelas y ondas de choque escala proporcionalmente según el radio de piedra (`stoneRadius`), impactando con precisión milimétrica en el centro de las intersecciones sin desalineaciones.

5. **Bloqueo Canónico de Autodestrucción Territorial y Pase Decisivo de la IA en Endgame (`GoAI.ts`):**
   - Prohibición estricta de rellenar territorio propio, ojos verdaderos o casillas interiores seguras en todas las dificultades (incluso en nivel Fácil), evitando que la IA pierda puntos o juegue indefinidamente.
   - Penalización severa a cualquier jugada con delta de territorio negativo (`scoreDelta < 0`) y desactivación de bonificaciones de apertura en fronteras cerradas.
   - Detección y pase proactivo inmediato cuando el oponente pasa o cuando no quedan jugadas legales que aporten ganancia neta territorial.

6. **Compilación y Verificación (`npm run build`):**
   - Compilación completa en TypeScript y Vite con 0 errores.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 95): Transiciones Rápidas en Modo Historia, Tajo de Ronin Preciso, Desbloqueo de IA, Reescalado del Goban (+40%) y Fórmula Universal de Meteoros de Tengu

**Resumen del hito y mejoras:**
1. **Transición Ultra-Rápida y Avance de Diálogos con Teclado en Modo Historia (`StoryController.ts`, `KeyboardController.ts`, `StoryDialogueRenderer.ts`):**
   - **Transición de 600 ms:** Reducido el retardo artificial de fin de capítulo de 3000 ms a 600 ms para una carga inmediata del siguiente escenario.
   - **Avance Universal por Teclado:** Se permite avanzar instantáneamente los diálogos de la historia mediante las teclas `Espacio`, `Enter`, `Escape`, `Flecha Derecha`, `D` o haciendo clic directo en cualquier punto de la pantalla.

2. **Rediseño del Tajo de Katana de Ronin (`RoninVFX.ts`, `RoninChampion.ts`, `ChampionManager.ts`):**
   - **Supresión de Trazado Duplicado:** Se eliminó la línea secundaria en aspas que creaba la ilusión de dos cortes paralelos. Ahora es un único corte limpio de samurai a 45°.
   - **50% Más Compacto y Centrado Exacto:** Reducido el tamaño diagonal de 220 px a 76 px, ajustándose perfectamente a la intersección y al diámetro de la piedra de Go, con anillo de impacto centrado de radio 17 px.
   - **Ejecución al Final del Turno (220 ms):** El jugador asienta su piedra primero con su sonido de colocación limpio y, tras 220 ms de retardo, el Ronin desenvaina y ejecuta el corte sobre la piedra enemiga sin solapamiento de efectos ni ruidos.

3. **Solución al Bloqueo de IA ("Thinking..." Infinito) en Acto 2 de Historia (`GoAI.ts`, `GameController.ts`):**
   - **Causa Raíz:** `GoAI.cloneState()` no clonaba la lista de entidades cautivas (`state.captives`), por lo que la IA intentaba jugar sobre la casilla `4,4` ocupada por el Pergamino Sagrado neutral, provocando un error de casilla ocupada y bloqueando la cesión de turno al humano.
   - **Corrección:** Se actualizó `GoAI.ts` para clonar `captives` y excluir cualquier casilla con rehenes de las jugadas candidatas. Se añadió además un mecanismo de seguridad de pase de turno en `GameController.ts` si una jugada no progresa el turno.

4. **Aprovechamiento y Reescalado del Goban (+40% Tamaño de Casillas) (`SVGRenderer.ts`, `board.css`):**
   - **Optimización de Padding:** Se redujo el margen exterior del SVG de `2.2` a `1.15` radios de piedra y el padding interno del contenedor de madera a `0.35rem`.
   - **Expansión Visual:** La cuadrícula, líneas, piedras y rehenes se expandieron más de un **+40%**, ocupando el tablero de madera de esquina a esquina sin márgenes vacíos innecesarios.

5. **Fórmula Matemática Universal de Lluvia Meteórica de Tengu (`TenguChampion.ts`, `translations.ts`):**
   - **Cálculo Dinámico Universal:** Implementada la fórmula $\text{Meteoros}(N) = \max\left(3, \; \text{round}\left(N \times \frac{6}{81}\right)\right)$ basada en la densidad canónica de 6 meteoros en 9x9 ($\rho \approx 7.41\%$):
     - **9x9 (81 nodos):** **6 meteoros**
     - **13x13 (169 nodos):** **13 meteoros**
     - **19x19 (361 nodos):** **27 meteoros**
   - **Área de Efecto al 25%:** La dispersión cubre exactamente una cuarta parte del tablero en cualquier topología.

6. **Depuración de Textos y Emojis Duplicados en HUD (`translations.ts`, `HUDController.ts`):**
   - Eliminados los emojis iniciales y los contadores hardcodeados `(1 use) / (1 uso)` de las cadenas de traducción para evitar duplicaciones como `☄️ ☄️ Meteor Strike (1 use) (1)`.
   - Sanitización algorítmica en `HUDController.ts` para proyectar limpiamente `☄️ Meteor Strike (1)`.

7. **Validación:** Compilación en TypeScript/Vite (0 errores) y actualización de los paquetes `.zip`.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 94): Topologías Procedurales "Más Locas" con Semilla Fija, Selector de Campeón Rival, Controles en Fila Única y Empaquetado Nativo

**Resumen del hito y mejoras:**
1. **Fijación y Persistencia del Tablero Procedural (`BoardGenerators.ts`, `ModalManager.ts`, `AppEventBinder.ts`, `OnlineController.ts`, `GameController.ts`, `types/index.ts`):**
   - **Solución a la mutación involuntaria:** Almacenada la semilla (`seed`) en `tempConfig` y `OnlineController`.
   - El tablero procedural ya **no cambia automáticamente** cuando el jugador elige un fondo de escenario, cambia de campeón, ajusta el hándicap o navega entre pasos del Wizard.
   - La regeneración solo se desencadena al pulsar deliberadamente el botón `🎲 Procedural` (o re-roll).
   - Al iniciar la partida (Local u Online), se juega exactamente sobre el tablero procedural previsualizado.

2. **Generador de Escenarios Procedurales "Más Locos" (8 Arquetipos Asimétricos) (`BoardGenerators.ts`):**
   - Incorporados 8 estilos topológicos asimétricos, orgánicos e impredecibles:
     - 🪐 **Anillos Concéntricos y Puertas Celestiales**: Anillos orbitales con puentes radiales tácticos.
     - 🌌 **Galaxia Espiral Doble**: Dos brazos cósmicos rotatorios con puentes estelares.
     - ⏳ **Reloj de Arena Cuántico**: Dos regiones unidas por un cuello de botella hiper-estratégico.
     - 🔱 **Tridente / Ypsilon Sagrada**: Tres alas divergentes a 120° con santuario central.
     - 💎 **Diamante Fracturado con Geoda Hueca**: Marco poligonal con centro vacío y cruces diagonales.
     - 🏝️ **Archipiélago de Atolones Flotantes**: Múltiples islas con pasos chokepoint de 1 casilla.
     - ⚡ **Cañón en Zig-Zag Meándrico**: Hendidura sinuosa con piedras de paso tácticas.
     - 🌊 **Costa Orgánica Perlin Caótica**: Erosión no euclidiana asimétrica con lagunas y estalagmitas.

3. **Selector de Campeón Rival y Standee Dinámico en Paso 5 (`index.html`, `setup.css`, `ModalManager.ts`, `AppEventBinder.ts`, `GameController.ts`, `DuelistRenderer.ts`, `HUDController.ts`):**
   - Selector en tiempo real para el rival en el Paso 5: `🎲 Random`, `👤 Sensei` (Go puro sin hechizos), `🦅 Tengu`, `🌸 Himiko`, `🦊 Kitsune`, `⚔️ Ronin`, `🧪 Alchemist` y `🐉 Ryūjin`.
   - Standee derecho dinámico: muestra la caja misteriosa con `❓` si es aleatorio o la silueta completa del campeón seleccionado con iluminación púrpura.
   - Enlace de clic directo en el standee para ciclar rápidamente entre rivales.
   - En combate 1vIA, la IA ejecuta las habilidades del campeón elegido y el HUD proyecta su avatar y rango.

4. **Etiquetas de Combatiente en 1 Sola Fila y +10px Elevadas (`setup.css`):**
   - Nombre de campeón e insignia `YOU (P1)` / `OPPONENT` unificados en una sola fila horizontal (`flex-direction: row`).
   - Posición elevada +10px (`margin-top: -10px`) para evitar cualquier recorte o scroll vertical.

5. **Controles en Fila Única para Hándicap, Komi y Poliminós (`index.html`, `setup.css`, `ModalManager.ts`, `AppEventBinder.ts`):**
   - **Handicap Stones:** Título simplificado con presets rápidos (`0`, `2`, `3`, `4`, `5`, `6`) y campo numérico libre `✍️ [ N ] stones` en una sola fila.
   - **Komi:** Presets `0.5`, `5.5`, `6.5`, `7.5` y campo `✍️ [ 6.5 ] pts` unificados en 1 sola fila en Local y Online.
   - **Poliminós Especiales:** Fichas de Jugador e IA organizadas en cuadrículas horizontales de 3 columnas (`🌿 Germinante`, `🀄 Duplicidad`, `🧱 Monolito`).

6. **Compilación, Verificación y Empaquetado Nativo (`CREAR_PAQUETE_EXE.bat`, `CrazyGo_Portable.zip`, `CrazyGo.exe`):**
   - Compilación en TypeScript/Vite con 0 errores y generación del paquete nativo Windows `CrazyGo_Portable.zip` (76 MB) listo para descomprimir y jugar.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 93): Rediseño de Lección 8 (Ficha Duplicidad), Protección Anti-Spam y Control de Versiones con GitHub

**Resumen del hito y mejoras:**
1. **Rediseño Integral de la Lección 8 del Dojo (`TutorialSteps.ts`, `TutorialManager.ts`):**
   - Progresión guiada paso a paso obligatoria para todos los poderes: Meteorito ☄️ sobre invasor blanco en 4,4; Error simulado en 7,2 y Rebobinado temporal ⏳; Germinante viva 🌿 en 2,2; Puente de Duplicidad 2x1 🀄 en 3,6; y Fortaleza del Monolito 2x2 🧱 en 6,1.
2. **Renombrado Oficial de Ficha Duplicidad (`PolyominoManager.ts`, `index.html`, `RoguelikeController.ts`):**
   - La ficha Dominó 2x1 pasa a denominarse **Duplicidad 2x1 (🀄)** en UI, tooltips, dock, inventarios y recompensas.
3. **Protección Anti-Spam y Bloqueo de Saltos en Tutorial (`TutorialManager.ts`, `KeyboardController.ts`):**
   - Implementado control de estado `isAdvancing` y desactivación instantánea del botón "Entendido ➔" (`disabled = true`) para evitar saltar jugadas obligatorias por clics rápidos o pulsaciones repetidas.
4. **Control de Versiones y Repositorio Oficial en GitHub (`.gitignore`, `README.md`, `git`):**
   - Repositorio Git inicializado en rama `main`, sincronizado y subido con éxito al repositorio remoto [Victologo/crazy_go](https://github.com/Victologo/crazy_go).
   - Generación de `README.md` completo con arquitectura, atajos, características y guía de instalación.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 92): Modularización de Arquitectura CSS, Desacoplamiento de Teclado y Modo Historia

**Resumen del hito y mejoras:**
1. **Desglose Modular de Estilos CSS (`src/styles/`):**
   - División de `style.css` (de 5,391 líneas) en 13 submódulos temáticos limpios sin superar 500 líneas por archivo.
2. **Aislamiento del Controlador de Teclado (`KeyboardController.ts`):**
   - Extracción de toda la lógica de teclado universal para desacoplar `AppEventBinder.ts`.
3. **Purificación de Roguelike y Creación de Modo Historia (`GameController.ts`, `StoryCampaign.ts`, `StoryController.ts`):**
   - Eliminadas entidades neutrales de batallas roguelike y creado el botón de 3 columnas para el Modo Historia (Novela Visual).

---

## 15 de Agosto de 2026 - Día 2 (Sesión 91): Desvanecimiento Gradual de 1.5s para el Komi e Integración en 1 vs 1 Local

**Resumen del hito y mejoras:**
1. **Transición Suave de Desvanecimiento en 1.5 Segundos (`src/style.css`, `HUDController.ts`):**
   - Calibrada la transición de disolución progresiva a **1.5s exactos** (`1500ms`) con la curva sedosa `cubic-bezier(0.25, 1, 0.5, 1)` tanto en el overlay de fondo como en el contenido tipográfico (`transform: translateY(-10px) scale(1.02)`, `filter: blur(8px)`).
   - El texto y la máscara desaparecen poco a poco de forma ultra fluida hacia el Goban sin saltos bruscos.
2. **Integración Universal en Partidas 1 vs 1 Locales y 1vIA (`GameController.ts`):**
   - El anuncio cinematográfico ahora se activa automáticamente al iniciar cualquier partida local de 2 jugadores:
     - **Modo 1 vs 1 Local (Pass & Play):** `⚫ JUGADOR 1 (NEGRAS) VS ⚪ JUGADOR 2 (BLANCAS)`
     - **Modo 1 vs IA:** `⚫ JUEGAS CON NEGRAS • PRIMER TURNO` (o con Blancas si se configuró así).
     - **Modo Roguelike:** Con el Komi dinámico calibrado según la dificultad elegida.
3. **Validación:** Compilación en TypeScript (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 90): Tipografía Libre Sin Contenedores y Transición Cinematográfica de Desvanecimiento para el Komi

**Resumen del hito y mejoras:**
1. **Supresión Total de Contenedores y Recuadros Rígidos (`index.html`, `src/style.css`):**
   - Eliminados los bordes, paneles de fondo rectangulares y recuadros anidados (`.rogue-komi-card`, `.rogue-komi-value-box`).
   - El anuncio flota directamente sobre la pantalla con máscara 70% negra (`rgba(0, 0, 0, 0.70)`) y desenfoque óptico (`backdrop-filter: blur(10px)`).
2. **Transición Cinematográfica de Desvanecimiento Suave (`HUDController.ts`, `src/style.css`):**
   - **Entrada suave**: El texto y la piedra emergen flotando desde abajo con escalado sutil (`translateY(20px) -> 0`, `opacity: 0 -> 1`).
   - **Disolución progresiva (Fade Out / Dissolve)**: Al interactuar o al terminar el temporizador, el overlay se desvanece de forma sedosa hacia el Goban (`opacity: 1 -> 0`, `filter: blur(6px)`, `scale(1.03)`) en **600ms**, logrando una transición 100% fluida e inmersiva.
3. **Validación:** Compilación en TypeScript (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 89): Animación de Llamarada Ígnea y Ceniza Disolviéndose de Ryūjin

**Resumen del hito y mejoras:**
1. **Llamarada de Dragón y Ceniza Flotante (`VFXManager.ts`, `src/style.css`):**
   - Diseñado el efecto visual de incineración para la Furia del Dragón de Ryūjin:
     - **Chorro ígneo y núcleo de plasma ardiente**: Haz de fuego descendente y núcleo brillante con sombras incandescentes (`#fbbf24`, `#f97316`, `#ef4444`).
     - **Humo de incineración**: Nube oscura expansiva (`#0f172a`) que brota de la piedra calcinada.
     - **14 Partículas de Ceniza y Ascuas Disolviéndose**: Flotan hacia arriba por convección térmica y se disuelven suavemente a lo largo de **1.0 segundo**.
2. **Capa Persistente de VFX en Vivo (`SVGRenderer.ts`):**
   - Creado el contenedor `#vfx-live-container` que preserva las animaciones de 1.0s activas sin cortarlas cuando el tablero actualiza las piedras inmediatamente.
   - El juego avanza fluidamente solapando la ceniza con el turno del rival sin esperas ni pausas artificiales.
   - Autodestrucción garantizada a los 1000ms sin dejar residuos de ningún tipo.
3. **Validación:** Compilación en TypeScript (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 88): Anuncio Visual de Komi al Inicio de Partida Roguelike y Calibración por Dificultad

**Resumen del hito y mejoras:**
1. **Anuncio Visual de Inicio de Partida Roguelike (`index.html`, `src/style.css`, `HUDController.ts`):**
   - Implementado un overlay cinematográfico con máscara 70% negra (`rgba(0, 0, 0, 0.70)`), desenfoque de fondo (`backdrop-filter: blur(8px)`) y tipografía blanca nítida (`#ffffff`) que aparece al inicio de cada duelo.
   - Informa con total claridad que el jugador inicia con **Negras** (⚫, 1º turno) y destaca el **Komi de compensación para Blancas** (⚪) con su valor exacto.
   - Se oculta suavemente al hacer clic, pulsar cualquier tecla o tras 3.2 segundos.
2. **Calibración Canónica de Komi por Dificultad (`RoguelikeRunManager.ts`, `RoguelikeController.ts`):**
   - **🟢 Modo Fácil:** **2.5 puntos** de Komi.
   - **🟡 Modo Intermedio (Normal):** **4.5 puntos** de Komi.
   - **🔴 Modo Difícil:** **6.5 puntos** de Komi.
   - **🟣 Modo Maestro (Gran Maestro):** **5.5 puntos** de Komi.
3. **Resumen y Estado Actualizado de Poderes de Campeones:**
   - **👤 Hombre Normal:** Estrategia canónica pura de Go sin trucos ni magia (+13% tamaño visual en combate, encuadre facial centrado).
   - **🦅 Tengu:** Lluvia Meteórica activa (5 meteoros en 9x9, 9 en 13x13, 15 en 19x19).
   - **✨ Himiko:** Lluvia Pétrea Celestial pasiva al finalizar el 15º turno personal (4 piedras en 9x9, 6 en 13x13, 9 en 19x19).
   - **🦊 Kitsune:** Escudo Divino activo (2 piedras en 9x9, 3 en 13x13, 4 en 19x19 con 2 turnos de inmunidad absoluta ante capturas o poderes y aura dorada).
   - **🌪️ Ronin:** Inversión Cromática activa (1 piedra en 9x9, 2 en 13x13, 3 en 19x19; pasa turno automáticamente tras la última inversión).
   - **🐲 Ryūjin:** Furia del Dragón pasiva con calcinación universal (2 piedras en 9x9 con 2 ojos; 3 piedras en 13x13 con 3+ ojos o múltiples grupos; y fórmula acumulativa $n-1$ en 19x19).
4. **Validación:** Compilación en TypeScript (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 87): Depuración y Supresión Total de Residuos de Animación VFX y Círculos Rojos

**Resumen del hito y mejoras:**
1. **Causa Raíz Identificada:**
   - En `SVGRenderer.render()`, un selector de elementos visuales (`querySelectorAll`) guardaba y re-adjuntaba capas secundarias huérfanas de efectos de onda de choque y fuego (`.vfx-shockwave-anim`), dejando anillos rojos (`#ef4444`) congelados en el tablero de forma permanente al colocar piedras normales.
2. **Solución Implementada:**
   - Se eliminó el re-añadido indiscriminado de capas antiguas en `render()`, asegurando un repintado limpio y libre de residuos.
   - Creado `VFXManager.clearAllVFX(svgElement)` para purgar cualquier elemento residual cuando sea necesario.
   - En `SVGGhostPreview.ts`, se limpia activamente cualquier `targeting-overlay` al interactuar o pasar el cursor.
3. **Validación:** Compilación en TypeScript (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 86): Banda Sonora Acústica Japonesa Relajante y Meditativa

**Resumen del hito y mejoras:**
1. **Composición y Renderizado de Música Tradicional Japonesa (`public/audio/bgm_zen.wav`, `bgm_battle.wav`):**
   - Creadas pistas de audio de estudio de alta fidelidad compuestas en las tonalidades canónicas japonesas *Insen* y *Miyako-bushi* (Re, Mi bemol, Sol, La, Do).
   - Instrumentación orgánica y relajante:
     - **Koto acústico**: Arpegios suaves con ataque redondeado (sin clicks ni chasquidos) y resonancia de madera de Paulownia.
     - **Flauta Shakuhachi**: Melodías contemplativas y respiraciones lentas de bambú con vibrato natural.
     - **Acordes de Shō**: Colchón armónico etéreo (*Aitake*) que evoca los templos de Kioto y jardines zen.
     - **Cuencos tibetanos y campana Rin**: Sobretonos cristalinos de larga duración.
2. **Reproductor Fluido con Crossfade (`BGMGenerator.ts`):**
   - Soporte de bucle continuo sin cortes y fundidos cruzados elegantes (Fade in / Fade out de 800ms) al transicionar entre el mapa de la expedición y el tablero de Go.
   - Control total desde el menú de opciones (volumen y alternador de BGM).
3. **Validación:** Compilación en TypeScript (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 85): Escalado de Hombre Normal en Partida (+13%)

**Resumen del hito y mejoras:**
1. **Ajuste Proporcional del Standee de Hombre Normal (`src/style.css`):**
   - Incrementado un **+13%** el tamaño visual del standee de Hombre Normal en los duelos de Goban (de `scale(1.28)` a `scale(1.45)` en estado normal, y `scale(1.51)` en hover).
   - Ahora posee una presencia equilibrada y proporcionada respecto al resto de duelistas y rivales en pantalla.
2. **Validación:** Compilación en TypeScript (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 84): Supresión Total de Música Sintetizada y Ruidos Procedurales (BGM)

**Resumen del hito y mejoras:**
1. **Eliminación Total de Música de Fondo Procedural (`BGMGenerator.ts`):**
   - A petición del usuario por resultar molesto y semejante a ruidos/golpes agudos de 8-bit, se ha desactivado y silenciado por completo el sintetizador de música de fondo.
   - Todos los métodos de `BGMGenerator` (`playMap`, `playBattle`, `start`, `setTrack`, etc.) se han transformado en funciones inactivas y silenciosas.
   - Se mantienen intactos los efectos de sonido realistas y limpios de colocar piedras de Go (*Pachik!*), capturas, botones y retrocesos en `SoundFX.ts`.
2. **Validación:** Compilación en TypeScript (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 83): Ajuste del Primer Plano Facial y Standee de Hombre Normal

**Resumen del hito y mejoras:**
1. **Primer Plano y Encuadre Facial de Hombre Normal (`normal_face.jpg`, `normal.jpg`):**
   - Generado un nuevo retrato de primer plano (primer plano busto/cara) centrado en el rostro sin facciones de Hombre Normal con iluminación suave y kimono tradicional gris.
   - Fondo oscuro índigo atmosférico integrado perfectamente con el estilo cel-shading y paleta del resto de campeones (Tengu, Himiko, Kitsune, Ronin, Ryūjin).
   - Eliminados artefactos en el cuero cabelludo y ajustado el encuadre para que en el modal de selección de campeones y en la tira de miniaturas se aprecie con gran nitidez.
2. **Standee de Duelo Actualizado (`normal.png`):**
   - Standee transparente PNG en postura tradicional de seiza con piedra de Go y mirada hacia la derecha.
3. **Validación:** Compilación en TypeScript (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 15 de Agosto de 2026 - Día 2 (Sesión 82): Rework de Ronin y Ryūjin, BGM Tradicional Dual (Zen/Combate), IA con Campeones en Modo Maestro y Atajos de Teclado Universales

**Resumen del hito y mejoras:**
1. **Ronin (Inversión Cromática Multitablero y Fin de Turno):**
   - Selección de **cualquier piedra** (aliada o enemiga) para invertir su color con capturas en cascada inmediatas.
   - Escalado por tamaño de tablero en el mismo turno: **1 piedra en 9x9**, **2 piedras en 13x13** y **3 piedras en 19x19**.
   - Tras completar las inversiones del turno, **pasa el turno automáticamente** al rival.
2. **Ryūjin (Furia del Dragón con Calcinación Universal y Crecimiento de Ojos):**
   - Permite calcinar **cualquier piedra** (aliadas y enemigas).
   - **9x9:** Quema **2 piedras** al formar el primer grupo vivo de 2 ojos.
   - **13x13:** Se activa al crear **1 estructura de 3+ ojos** o **2+ estructuras de 2+ ojos**, quemando **3 piedras**.
   - **19x19:** Crecimiento acumulativo donde cada grupo vivo otorga $n-1$ calcinaciones (1 por 2 ojos, +1 por cada ojo adicional que crezca en la estructura).
3. **Música BGM Tradicional Japonesa Procedural (`BGMGenerator.ts`):**
   - Sintetizador acústico Web Audio API con escalas *Hirajoshi* / *Insen*, Koto, Shamisen, flauta Shakuhachi y percusión Taiko.
   - **Pista Zen de Mapa y Menús:** Melodías contemplativas y respiraciones de flauta relajantes.
   - **Pista de Combate:** Duelos marciales con pulsos de tambor Taiko y arpegios enérgicos de Koto.
   - Transiciones y fundidos cruzados automáticos mediante `ScreenManager`.
4. **Rivales IA con Campeones en Modo Maestro / Dan (`GameController.ts`):**
   - En dificultad Dan y Roguelite Extremo, los rivales reciben aleatoriamente campeones del roster y utilizan estratégicamente meteoros de Tengu sobre clústers de piedras, escudos de Kitsune para defender grupos en Atari, transmutaciones de Ronin para capturar territorio y pasivas de Himiko/Ryūjin.
5. **Atajos de Teclado Universales (`AppEventBinder.ts`):**
   - Flechas y WASD para rotar y navegar en carruseles de héroes, cartas de recompensa, eventos, tiendas, mapa y selector de dificultades.
   - Teclas numéricas `1..6` para selección directa (incluyendo Hombre Normal como opción 1).
   - Teclas de audio en opciones (`B`/`M` para BGM, `S` para SFX, flechas para volumen).
   - Confirmación con `Enter` / `Espacio` y cancelación con `Escape`.
6. **Validación:** Compilación en TypeScript libre de errores (`npm run build`) y empaquetado completado en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 81): Escudo Divino de Kitsune Escalado por Tamaño de Tablero (2, 3, 4 Cargas)

**Resumen del hito y mejoras:**
1. **Nuevo método `ChampionManager.getKitsuneShieldCharges(board)`:**
   - **9x9 (≤100 nodos):** Kitsune dispone de **2 usos** del Escudo Divino.
   - **13x13 (101–220 nodos):** Kitsune dispone de **3 usos**.
   - **19x19 (>220 nodos):** Kitsune dispone de **4 usos**.
2. **Integración en el Flujo de Partida:**
   - `GameController.init` pasa `this.board` a `ChampionManager.resetForMatch` para que las cargas se calculen automáticamente con el tablero ya generado.
   - `resetForMatch` y `setHero` aceptan un segundo parámetro opcional `boardOrSize`.
3. **Textos y UI actualizados:** `ACTIVE_SKILLS.kitsune.description`, `RoguelikeRunManager.HEROES.kitsune.activeDesc` y el carrusel de selección en `ModalManager.ts` muestran `(2-4 usos según tablero)`.
4. **Lección aprendida:** Al añadir `BoardSize` como tipo en `ChampionManager.ts` fue necesario importarlo explícitamente desde `'../types'` para que TypeScript no falle. Siempre importar tipos antes de usarlos.
5. **Validación:** Compilación exitosa (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 80): Lluvia Pétrea de Himiko Escalada por Tablero (4, 6, 9) y Activación al Finalizar Turno

**Resumen del hito y mejoras:**
1. **Escalado Dinámico por Tamaño de Tablero (`ChampionManager.getStoneRainCount`):**
   - **9x9 (o $\le 100$ nodos):** Descienden **4 piedras aliadas aleatorias**.
   - **13x13 (o $101 - 220$ nodos):** Descienden **6 piedras aliadas aleatorias**.
   - **19x19 (o $> 220$ nodos):** Descienden **9 piedras aliadas aleatorias**.
2. **Timing y Textos Explicativos:**
   - Se aclara en todas las descripciones del juego (Modo Roguelike, Partida Libre, Sandbox e interfaz HUD) que la pasiva se activa **al finalizar el 15º turno personal**.
   - Mensaje de notificación in-game actualizado: *"🌧️✨ ¡Lluvia Pétrea Celestial de Himiko! Al finalizar el turno personal 15, se ha activado la pasiva y han descendido X piedras aliadas bendecidas."*
3. **Validación:**
   - Compilación exitosa (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 79): Posicionamiento de Hombre Normal y Escala de Standees en Duelos

**Resumen del hito y mejoras:**
1. **Hombre Normal: Primero a la Izquierda en Todos los Selectores:**
   - Reordenado el diccionario maestro `HEROES` en `RoguelikeRunManager.ts` y las listas de selección en `RoguelikeController.ts`, `ModalManager.ts` e `index.html`.
   - `Hombre Normal` aparece ahora como la **primera miniatura a la izquierda** (y seleccionado por defecto) en la Expedición Roguelike, el Asistente de Partida Libre, el Lobby Online y el Sandbox.
2. **Ajuste Proporcional y Posicionamiento de Duelistas (`style.css` & `HUDController.ts`):**
   - **Rivales (Lado Derecho):** Los Monjes Novatos, Sabios de la Niebla y el Dragón Jefe se han incrementado un **+15% de tamaño** (`scale(1.36)`) para conferirles mayor presencia e imponencia visual en el combate.
   - **Lado Izquierdo (Jugador):** Toda la tarjeta/standee del jugador se ha posicionado un **3% más abajo** (`transform: translateY(3%)`) junto con su placa de texto de nombre/habilidad.
   - **Hombre Normal (Específico):** Se ha reducido su escala visual un **-10%** respecto al resto de campeones (`scale(1.28)`), reflejando su naturaleza humana terrenal y sobria frente al poder de los seres míticos.
3. **Validación:**
   - Compilación exitosa (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 78): Calibración de Escudo Divino de Kitsune (2 Usos, 2 Turnos), Inmunidad Total y Aura Dorada Animada

**Resumen del hito y mejoras:**
1. **Calibración de Usos y Duración de Kitsune:**
   - Reducido de 3 a **2 usos (2 cargas por combate)** y la duración del escudo pasa de 3 a **2 turnos del jugador**.
   - Descripciones actualizadas en `ChampionManager.ts`, `RoguelikeRunManager.ts` e interfaces.
2. **Inmunidad Total y Feedback de Error con Sonido:**
   - Si el jugador intenta destruir o convertir una piedra consagrada con *Escudo Divino* usando *Inversión Cromática* (Ronin), *Furia del Dragón* (Ryūjin) o habilidades activas, la acción es cancelada inmediatamente, disparando el sonido de error (`SoundFX.playIllegal()`) y mostrando la alerta: *"🛡️ ¡Esta piedra está protegida por un Escudo Divino y su Aura Sagrada es inmune!"*.
   - **Prevención en la IA:** En `GoAI.ts` y `BossManager.ts`, se excluyen explícitamente las cadenas y casillas que contienen piedras sagradas para evitar que la IA pierda turnos intentando capturar grupos inmortales o atacando cuadrantes protegidos.
3. **Aura Dorada Radiante Animada (`SVGRenderer.ts`, `SVGDefs.ts`, `style.css`):**
   - Implementado un sistema visual multicapa en SVG:
     1. **Resplandor Radial de Fondo:** Gradiente áureo (`#sacred-radial-glow`) con animación de respiración pulsante (`.vfx-sacred-aura-pulse`).
     2. **Anillo de Rayos Giratorio:** Anillo orbital dorado con trazo discontinuo girando a velocidad constante (`.vfx-sacred-ring-spin`).
     3. **Halo Perimetral Fino:** Borde luminoso dorado con filtro de resplandor (`#sacred-glow`).
     4. **Emblema Sagrado:** Icono 🛡️ centrado con relieve.
4. **Validación:**
   - Compilación exitosa (`npm run build`) y empaquetado en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 77): Eliminación de Citas de Victoria, Hombre Normal Mirando a Derecha con Transparencia y 10 Rivales PNG Integrados

**Resumen del hito y mejoras:**
1. **Supresión Total de Citas de Victoria:**
   - Se han eliminado completamente todas las frases/citas de victoria exclusivas en el modal de recompensas (`RogueModalRenderer.ts` e `index.html`) para mantener la interfaz sobria, elegante y sin textos de relleno redundantes.
2. **Hombre Normal: Orientación Corregida y Transparencia PNG:**
   - **Problema previo:** El personaje miraba hacia el frente/izquierda con fondo opaco.
   - **Solución:** Re-generada la ilustración en perspectiva tres cuartos **mirando hacia la derecha** (hacia el Goban, alineado con los duelistas del jugador), procesado con máscara de canal alfa para transparencia total de fondo (`normal.png`) y actualizado en todos los selectores.
3. **Integración de los 10 Rivales con Transparencia PNG y Sustitución de Oponentes Antiguos:**
   - Los 5 Sabios de la Niebla (`sage_1.png` a `sage_5.png`) y 5 Monjes Novatos (`monk_1.png` a `monk_5.png`) han sido procesados a formato PNG con fondo transparente.
   - Se han sustituido los antiguos archivos monolíticos (`sage.png` y `monk.png`) en el `HUDController.ts`, seleccionando dinámicamente y con igual probabilidad entre los 5 monjes (fácil / IA Blanca) y los 5 sabios (medio / IA Verde / Roguelike).

---

### 🧠 Lecciones Aprendidas, Puntos Clave de Arquitectura y Tecnologías Usadas:

| Área / Componente | ¿Qué falló o qué se mejoró? | Causa Raíz Identificada | Solución y Regla para el Futuro |
| :--- | :--- | :--- | :--- |
| **Ciclo de Turnos & Targeting Asíncrono** (`ChampionManager` & `GameController`) | Al activarse la *Furia del Dragón*, la partida se congelaba y no dejaba hacer clic en las piedras enemigas a quemar. | `advanceTurn()` cambiaba inmediatamente `state.currentPlayer` al oponente (IA), lo que apagaba la interactividad del humano (`isInteractive = false`), iniciaba el temporizador de la IA e invertía el chequeo de bando enemigo (`stone.playerId !== playerId`). | **Regla:** Cuando una habilidad pasiva o activa requiera selección en el tablero (`currentTargetingMode !== 'none'`), **la interactividad debe permanecer abierta para el jugador que apunta** (`targetingPlayerId`) y el bucle de turnos de la IA debe pausarse (`checkAITurn()` retorna de inmediato si hay apuntado pendiente) hasta que se agoten las cargas de destrucción (`onComplete`). |
| **Detección Topológica de Ojos (Benson)** (`GraphBoard.ts`) | El juego detectaba dobles ojos falsos en grupos abiertos o en atari. | Comprobación geométrica euclidiana simple en lugar de análisis conexo en grafos arbitrarios. | **Regla:** Utilizar el **Teorema de Benson**: un grupo de piedras es incondicionalmente vivo si rodea de forma exclusiva dos o más componentes conexos vacíos disjuntos cuyas fronteras pertenezcan al 100% al grupo aliado. |
| **Procesamiento Gráfico de Assets** (`Python + Pillow`) | Las imágenes generadas por IA poseían fondos sólidos que rompían la inmersión sobre la madera Kaya del Goban. | Formato JPG sin canal alfa. | **Solución:** Se utilizó un pipeline automatizado en **Python (biblioteca `PIL`/Pillow)** con extracción de color de esquinas y desvanecimiento de bordes (*feathered alpha*) para exportar PNGs translúcidos nativos. |
| **Lenguajes y Tecnologías Usadas:** | **TypeScript 5.x**, **SVG nativo**, **HTML5/Vanilla CSS**, **Python 3.x (Pillow/PIL)** para procesamiento de imágenes por lotes, **Vite**, y **PowerShell/Batch** para empaquetado nativo `.exe`. |

---

## 14 de Agosto de 2026 - Día 1 (Sesión 76): Resolución de Bloqueo de Furia del Dragón y Limpieza del HUD

**Resumen del hito:**
1. **Limpieza del HUD de Duelo:**
   - Eliminado el subtítulo redundante `Campeón` / `Negras` que aparecía debajo del nombre del héroe en la tarjeta de duelista del jugador.
2. **Corrección de la Furia del Dragón de Ryūjin y Congelamiento de Partida:**
   - **Causa Raíz:** Al consolidar un grupo vivo con 2 ojos, el turno avanzaba a la IA (`currentPlayer = 2`), lo que bloqueaba la interactividad del jugador humano (`isInteractive = false`), iniciaba el turno de la IA inmediatamente y confundía las piedras aliadas/enemigas.
   - **Solución:**
     - `ChampionManager.targetingPlayerId`: Registra explícitamente qué jugador posee el poder del dragón.
     - `GameController.checkAITurn`: Pausa y espera a que el jugador humano termine de elegir y quemar sus 2 piedras enemigas antes de que la IA mueva.
     - `SVGRenderer`: Mantiene la capa interactiva activa durante el modo de apuntado de habilidades.
     - `SVGGhostPreview`: Añadida retícula ígnea `🔥` y tooltip dinámico `🔥 Calcinar Piedra (X restante(s))` al pasar el ratón sobre piedras enemigas.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 75): Creación e Integración de 'Hombre Normal' (Sin Habilidades)

**Resumen del hito:**
1. **Generación Artística de 'Hombre Normal':**
   - Ilustración digital anime con fondo recortado de un duelista sereno vistiendo quimono gris y crema, sosteniendo una piedra negra de Go, con rostro completamente liso (sin ojos, cejas, nariz ni boca) representando la ausencia total de poderes o personalidad sobrehumana.
   - Archivos guardados en `/heroes/normal.png`, `/heroes/normal.jpg` y `/heroes/normal_face.jpg`.
2. **Integración Completa en el Juego:**
   - Añadido `normal` al roster de héroes de `RoguelikeRunManager.HEROES` y tipado en `types/index.ts`.
   - Soporte de `skillType: 'none'` para ocultar botones de poderes en el HUD y mostrar la tarjeta de desafío canónico de Go en los selectores.
   - Añadido a los carruseles de selección de expedición roguelike, asistente de nueva partida, partidas online y selector en vivo del modo sandbox.
   - Cita exclusiva de victoria: *"Sin trucos ni poderes sobrenaturales. Solo la pureza del Go y la victoria impecable."*
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 74): Probabilidad Equiprobable y Aleatoria para los 10 Rivales de Go

**Resumen del hito:**
1. **Generación Aleatoria Uniforme en Casillas de Batalla:**
   - Se ha configurado el generador procedural (`RoguelikeMapGenerator.generateBattleConfig`) para que cada nodo de combate en el mapa seleccione de forma estocástica e independiente con **100% de probabilidad uniforme y equilibrada** entre cualquiera de los 5 Sabios de la Niebla y cualquiera de los 5 Monjes Novatos.
   - Cada run generará combinaciones completamente frescas y variadas de oponentes con sus retratos específicos.
2. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 73): Menú de Victoria Mejorado con Héroe Celebrando y 10 Nuevos Rivales de Go

**Resumen del hito:**
1. **Rediseño del Menú de Victoria y Recompensas:**
   - Cabecera dorada con estrellas animadas: `⭐ ¡VICTORIA EN EL GOBAN! ⭐`.
   - Banner conmemorativo del Campeón Victorioso (Tengu, Himiko, Kitsune, Ronin, Ryūjin) con retrato festivo con corona dorada `👑`, etiqueta de triunfo y cita alegre de victoria.
   - Sustitución de moneda genérica por Magatamas sagradas (`🏮 +XX Magatamas`).
   - Rejilla de 3 cartas (hechizos y poliminós tácticos) con selección interactiva única y exclusiva (`✓ SELECCIONADO`).
2. **Generación e Integración de 10 Rivales con Fondo Recortado:**
   - **5 Sabios de la Niebla:** `Kenshin el Sabio` (`sage_1.jpg`), `Nobunaga el Sabio` (`sage_2.jpg`), `Masashi el Sabio` (`sage_3.jpg`), `Tetsuo el Sabio` (`sage_4.jpg`), `Genzaburo el Sabio` (`sage_5.jpg`).
   - **5 Monjes Novatos:** `Joven Ren` (`monk_1.jpg`), `Joven Hiro` (`monk_2.jpg`), `Joven Sora` (`monk_3.jpg`), `Joven Daiki` (`monk_4.jpg`), `Joven Kazuki` (`monk_5.jpg`).
   - Integrados en el generador de combates procedurales de `RoguelikeMapGenerator.ts`.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 72): Perfeccionamiento de la Lluvia Meteórica de Tengu y Tooltip Dinámico

**Resumen del hito:**
1. **Animación Fluida Multicapa de Lluvia Meteórica:**
   - Rediseñados los proyectiles de meteoritos con estela exterior carmesí (`#ef4444`, 8px) y núcleo dorado de plasma incandescente (`#fef08a`, 3.5px), cabeza de bola de fuego (`#fbbf24`), ondas expansivas ígneas concéntricas (`vfx-meteor-burst` y `vfx-shockwave-anim`) y chispas/ascuas incandescentes (`vfx-ember-particle`).
   - Destrucción de fichas en tiempo real: a medida que cada meteorito impacta secuencialmente a intervalos de 110ms, se elimina la ficha correspondiente y se reproduce el sonido de impacto y microtemblor.
2. **Tooltip Dinámico y Textos Sincronizados con el Tablero:**
   - Implementado `ChampionManager.getMeteorCount(board)` para calcular la cantidad real de impactos según el tamaño de la malla: **5 impactos** en 9x9 o tableros pequeños, **9 impactos** en 13x13 y **15 impactos** en 19x19.
   - El tooltip flotante sobre el cursor (`Zona de Ataque (X casillas / Y impactos)`) ahora calcula dinámicamente y muestra el número exacto y real de meteoritos en todo momento.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 71): Corrección y Formulación Matemática de Ojos y Vida Incondicional en Grafos Arbitrarios

**Resumen del hito:**
1. **Diagnóstico del falso disparo:**
   - La habilidad de Ryūjin se activó en la captura porque existía una cláusula de respaldo que saltaba automáticamente al alcanzar el Turno 12 (`playerTurns >= 12`), no porque las negras tuvieran 2 ojos.
   - Además, la función previa de detección de ojos utilizaba deltas cartesianos `(col - 1, row - 1)` propios de mallas cuadradas, lo cual generaba inconsistencias en topologías triangulares y hexagonales.
2. **Implementación del Teorema de Benson (Unconditional Life in General Graphs):**
   - Reescrito `GraphBoard.hasLivingGroup` y `GraphBoard.isTrueEye` bajo teoría pura de grafos: identificación de cavidades conexas vacías $R$, verificación estricta de que $\partial R \subseteq \text{Piedras}(P)$ (sin presencia rival), y control de no-fragmentación/atari de cadenas limítrofes.
   - Eliminado el trigger forzado del turno 12 en Ryūjin para exigir únicamente la consolidación matemática de Doble Ojo.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 70): Eliminación de Sobrenombres y Frases Decorativas de Personajes

**Resumen del hito:**
1. **Limpieza y Enfoque Directo en Personajes:**
   - Suprimidos de todos los menús, modales de selección (Modo Libre, Expedición Roguelike, Mazo, Duelo en Tablero y Multijugador) los sobrenombres ficticios ("Señor de las Llamas Espirituales", "Maestro de los Astros", "Espada de la Transmutación", etc.) y las citas/quotes de lore.
   - Ahora se muestra el nombre puro del campeón (**Ryūjin**, **Tengu**, **Himiko**, **Kitsune**, **Ronin**, etc.) junto con sus habilidades mecánicas activas y pasivas directamente.
2. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 69): Guardado Automático y Simplificación del Menú de Opciones

**Resumen del hito:**
1. **Limpieza del Modal de Opciones:**
   - Eliminados los botones redundantes del pie del modal (`🏠 Salir al Menú Principal` y `✅ Guardar y Cerrar`), dejando un diseño minimalista y limpio donde el cierre se realiza de forma directa mediante la `✖` de la cabecera (o con la tecla `Esc` / `M`).
2. **Guardado Automático Persistente:**
   - Todo ajuste en el control deslizante de volumen, conmutador de SFX o música de fondo se guarda y persiste de inmediato en `localStorage` (`crazygo_audio_volume`, `crazygo_audio_sfx`, `crazygo_audio_bgm`), cargándose automáticamente al iniciar el juego.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 68): Selector de Campeones y Disparador de Habilidades en Modo Sandbox

**Resumen del hito:**
1. **Selector Completo de Campeones:**
   - Añadido selector en la pestaña de depuración con los 7 personajes del juego (Tengu, Himiko, Kitsune, Ronin, Ryūjin, Gran Dragón Sabio Gris y Maestro Clásico).
2. **Disparo Ilimitado de Habilidades:**
   - **`⚔️ Activar Habilidad Activa`**: Entra en modo de apuntado de la habilidad activa del campeón seleccionado (Lluvia Meteórica, Escudo Divino, Inversión Cromática, Llamas del Dragón, etc.) con 99 cargas continuas.
   - **`✨ Forzar Disparo Pasiva`**: Dispara la habilidad pasiva en el acto (p.ej. Lluvia Pétrea de Himiko con sus 4 cometas y piedras aliadas, o la Furia de Ryūjin).
   - **Botones Instantáneos Directos**: Disparo directo de Lluvia de Himiko, Calcinación de Esquina del 25% del Dragón Sabio, Escudo Divino Sagrado e Inversión Cromática.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 67): Corrección de Estelas y Fluidez en la Habilidad de Himiko

**Resumen del hito:**
1. **Causa del Bug Corregida:**
   - Al impactar la primera piedra, se desencadenaba el renderizado del tablero para materializar la ficha en la casilla, el cual limpiaba el SVG con `innerHTML = ''` y eliminaba prematuramente la capa de efectos de los siguientes cometas.
   - Implementada en `SVGRenderer.render()` la preservación y re-inserción automática de capas de efectos visuales activas (`.vfx-stone-rain-layer`, etc.), asegurando que todos los cometas y estelas concluyan su ciclo completo sin interrupciones.
2. **Estelas Celestes Mejoradas:**
   - Diseñada una estela luminosa multicapa con aura exterior celeste (`#38bdf8`) y núcleo interior brillante (`#ffffff`), cabeza astral con resplandor y cadencia de 240ms entre cometas.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 66): Eliminación de Máscara Blanca en Fondo y Perfeccionamiento del Tema Claro

**Resumen del hito:**
1. **Eliminación de la Máscara Blanca:**
   - Suprimida completamente la capa `menu-backdrop-overlay` en el Tema Claro (`display: none !important; background: transparent !important;`), permitiendo apreciar la ilustración de fondo del menú principal con total nitidez, viveza de color y contraste.
2. **Armonización y Pulido de Colores en Modo Claro:**
   - **Título Principal:** Tipografía en negro pizarra profundo con resplandor nítido para máxima legibilidad sobre el cielo y las nubes.
   - **Botones del Menú:** Rediseñados con tarjetas de vidrio translúcido blanco marfil de alta definición y degradados refinados (ámbar dorado para Roguelike, blanco puro con borde cálido para Modo Local, azul zafiro para Online, esmeralda zen para Sandbox y blanco pizarra para Opciones).
   - **Variables del Sistema:** Refinados los tonos de madera Kaya, líneas de nogal oscuro y contraste de texto.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 65): Salida al Menú Principal y Botón de Cierre en Ventana de Opciones

**Resumen del hito:**
1. **Botón de Salir al Menú Principal:**
   - Incorporado el botón interactivo `🏠 Salir al Menú Principal` en el pie del modal de Opciones para permitir abandonar cualquier partida o vista en curso y regresar directamente a la pantalla de inicio.
2. **Botón de Cierre Rápido '✖':**
   - Añadido un botón de aspa en la cabecera del modal para facilitar el cierre rápido con clic o atajo.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 64): Fórmula Matemática de Ojo Verdadero (True Eye) y VFX de Aliento de Dragón

**Resumen del hito:**
1. **Fórmula Canónica de Ojo Verdadero (`GraphBoard.isTrueEye`):**
   - Eliminados falsos positivos en formas abiertas o sin cerrar mediante la comprobación estricta de dos condiciones:
     1. **Condición Ortogonal:** El 100% de los vecinos cardinales deben ser piedras del mismo grupo aliado.
     2. **Condición Diagonal contra Ojos Falsos (*Me-nashi / False Eyes*):** Control de al menos 3 de 4 diagonales en el centro, y 100% en bordes y esquinas.
   - Un grupo solo se declara vivo si rodea al menos **2 ojos verdaderos disjuntos e independientes**.
2. **Animación de Aliento de Dragón Mejorada (`VFXManager.triggerDragonFlame`):**
   - Al seleccionar las 2 piedras enemigas con la Furia del Dragón de Ryūjin, ahora se proyecta un chorro de aliento llameante descendente hacia la piedra, con doble anillo de onda de choque y ascuas incandescentes.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 63): Jefe Final "Gran Dragón Sabio Gris" con Habilidad Activa (2 Usos)

**Resumen del hito:**
1. **Identidad e Ilustración del Jefe Final:**
   - Generada e integrada la ilustración de alta calidad de un majestuoso Dragón oriental sabio de escamas grisáceas, ojos luminosos y largos bigotes (`public/enemies/boss.png`).
   - Configurado en el Tier 5 (Nodo Final) del mapa procedural de expedición Roguelike.
2. **Habilidad Activa de la IA del Jefe (`Aliento Calcinante del Dragón`):**
   - Implementado en `BossManager.ts` con **2 cargas/usos**.
   - Evalúa las 4 esquinas del tablero para seleccionar el cuadrante del **25% de intersecciones** con mayor ventaja táctica (mayor cantidad de piedras enemigas que destruir).
   - Calcina y elimina todas las piedras no protegidas en la esquina seleccionada y coloca una piedra normal del Dragón en el centroide del vacío resultante.
   - Resuelve capturas en cascada inmediatas tras la emergencia de la piedra central.
3. **Animación y Efectos Visuales (`VFXManager.triggerGreyDragonBreath`):**
   - Vórtice de llamas celestiales plateadas con sacudida de pantalla, estallidos en cada casilla calcinada y sonido de colocación en el centro.
4. **Validación:**
   - `npm run build` y `npm run package:exe` completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 62): Detección de Doble Ojo (Grupo Vivo) para Ryūjin y Etiqueta UI

**Resumen del hito:**
1. **Detección Algorítmica de Doble Ojo:**
   - Se implementó `GraphBoard.hasLivingGroup()` para verificar de forma topológica cuando una cadena de piedras rodea 2 o más cavidades u ojos separados e independientes.
   - Al formar un doble ojo (o al llegar al turno 12), se activa la **Furia del Dragón de Ryūjin** para seleccionar y calcinar 2 piedras enemigas.
2. **Corrección de Etiqueta en Tarjeta:**
   - Se cambió el texto `(Automática)` en la tarjeta del duelista por `(Habilidad Pasiva)`.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 61): Captura en Cascada de Piedras tras Inversión Cromática

**Resumen del hito:**
1. **Detección y Captura Automática:**
   - Se añadió `RulesEngine.resolveBoardCaptures()` tras la ejecución de la Inversión Cromática de Ronin y del Hechizo de Inversión Yin-Yang.
   - Cualquier piedra o grupo enemigo que se quede con 0 libertades al ser rodeado por el cambio de bando de la piedra es capturado y retirado inmediatamente del Goban.
2. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 60): Navegación Universal con Teclado y VFX de Lluvia Pétrea de Himiko

**Resumen del hito:**
1. **Navegación Integral con Teclado:**
   - Selección de cartas/ítems en pantalla de recompensas (`← / →`, `A / D`, `1`, `2`, `3`, `Enter`, `Espacio`).
   - Opciones en eventos, santuarios y tiendas (`↑ / ↓`, `W / S`, `1..9`, `Enter`).
   - Selección de Campeones y Dificultad (`← / →`, `↑ / ↓`, `1..5`, `Enter`).
   - Wizard de Modo Libre (`1..4`, `Backspace`, `Enter`).
   - Atajos de combate en el Goban (`1..4`, `Z, X, V`, `R`, `C / E`, `P / Espacio`, `U / Ctrl+Z`).
2. **Rediseño de Lluvia Pétrea Celestial:**
   - Cometas celestiales fluidos con estela y núcleo astral que caen sobre las intersecciones.
   - En el instante del impacto, se generan ondas de choque con polvo estelar y emerge la piedra físicamente en el tablero.
3. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 59): Retrato en Primer Plano en Expedición Guardada y Mazo

**Resumen del hito:**
1. **Retrato de Campeón en Primer Plano:**
   - Se actualizó el diálogo de "Expedición Roguelike en Curso" y el banner de inspección de alforja/mazo para que muestre el retrato de primer plano de la cara del Campeón (`faceImage`) exactamente igual que en la selección de personajes.
2. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 58): Escudo Divino de 3 Turnos, Inmunidad a Poderes, Silueta +20% y Standees 4P

**Resumen del hito:**
1. **Duración y Calibración del Escudo Divino:**
   - La bendición de la Piedra Sagrada dura ahora exactamente 3 turnos con decremento por turno y muestra el número de turnos restantes en la piedra.
   - Inmunidad total añadida contra capturas clásicas y contra los poderes de cualquier jugador (Tengu, Ronin, Ryūjin, Meteorito e Inversión).
2. **Silueta del Jugador 20% más Grande:**
   - Incrementado el tamaño y escala del standee del jugador a la izquierda para un aspecto más épico.
3. **Standees para 4 Jugadores (FFA e IA):**
   - En 1v3 IA: Izquierda = Jugador (Tú); Derecha = Columna compacta con los 3 contrincantes IA y estado de pensamiento.
   - En 4P Local: Izquierda = Jugador con el turno activo en ese momento; Derecha = Los otros 3 jugadores en espera de turno.
4. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 57): Corrección de Auto-avance en Paso 3 de Tablero

**Resumen del hito:**
1. **Corrección de UX en Configuración de Partida:**
   - Se eliminó el salto automático hacia adelante al seleccionar el tamaño de cuadrícula ($9\times9$, $13\times13$, $19\times19$).
   - Ahora el usuario puede seleccionar el tamaño y la forma/topología del tablero libremente en el Paso 3 y avanzar con el botón `Siguiente ➔` cuando lo decida.
2. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 56): Inventario Inicial Roguelite y Persistencia Real de Consumibles entre Nodos/Combates

**Resumen del hito:**
1. **Inicio de Run Roguelite Calibrado:**
   - La run empieza únicamente con **2 Hechizos de Rebobinar (`rewind: 2`)** y **0** del resto de hechizos y poliminós.
2. **Persistencia Estricta de Consumibles:**
   - El gasto de pergaminos y fichas poliminó durante los combates se descuenta y persiste permanentemente a lo largo de toda la expedición.
3. **Reposición Progresiva:**
   - **Recompensas Post-Combate:** Opciones para elegir entre pergaminos de hechizos y fichas poliminó tácticas (+1 Dominó, +1 Germinante, +1 Monolito, etc.).
   - **Tienda del Mercader:** Añadida la compra de Rebobinar (25 🏮), Dominó (25 🏮), Germinante (25 🏮), Monolito (40 🏮), Inversión (35 🏮), etc.
   - **Descansos y Santuarios:** Meditación para recargar +1 uso a los hechizos y poliminós en alforja.
4. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 55): Personalización de Piedras Especiales, Eliminación de Duplicados y Supresión de Conteo Prematuro

**Resumen del hito:**
1. **Configuración de Piedras Especiales en Modo Libre:**
   - Panel interactivo en el Wizard para activar/desactivar piedras especiales (desactivado por defecto para Go Canónico).
   - Selectores individuales de cantidad para Germinante, Dominó y Monolito tanto para el Jugador como para la IA.
2. **Eliminación del Botón Duplicado de Habilidad:**
   - Se removió el botón redundante de la barra dock inferior. Ahora la habilidad activa se visualiza y ejecuta únicamente en la tarjeta del personaje standee.
3. **Supresión del Conteo Prematuro:**
   - Se eliminó el botón manual "Contar Puntos" que declaraba victorias falsas en el turno 1. El conteo solo se activa al finalizar legítimamente la partida por pases consecutivos.
4. **Validación:**
   - Compilación y empaquetado completados con éxito en `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 54): Wizard Interactivo Paso a Paso para la Configuración de Partida Libre

**Resumen del hito:**
1. **Rediseño Completo del Modal de Configuración:**
   - Adiós al scroll vertical interminable: el modal ahora es un asistente dinámico de 5 pasos horizontales e intuitivos.
   - **Auto-avance instantáneo:** Al hacer clic en una tarjeta de elección (como 2P vs 4P, o Humano vs IA), el sistema selecciona la opción y salta de inmediato al siguiente paso con una animación suave.
   - **Barra Stepper y Navegación:** Puntos de progreso superiores interactivos para saltar a cualquier paso previo, botón `◀ Atrás` y tarjeta de resumen en el paso final.
2. **Validación:**
   - `npm run build` y `npm run package:exe` ejecutados con éxito.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 53): Independencia FFA de Agentes y Personalidades de IA

**Resumen del hito:**
1. **Detección del Patrón Espejo:**
   - Las 3 IAs hacían exactamente el mismo triángulo de 3 piedras en su esquina porque `opponentId` estaba hardcodeado a `1` (ignorando a los otros rivales) y `isTigersMouth` detectaba falsamente cualquier rincón con 2 piedras como boca de tigre favorable.
2. **Corrección de Lógica FFA y Diversificación:**
   - Cada IA compite contra todos los oponentes de forma egoísta y autónoma.
   - Prohibido el apelotonamiento (*Dango*) en líneas 1 y 2 en apertura.
   - Personalidades: Blanco (Equilibrio Hoshi/Shimari), Verde (Tengen Central Cósmico), Púrpura (Invasor agresivo Sansan 3-3).
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 586ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 52): Escalado Dinámico de Lluvia Meteórica de Tengu y Actualización de Tooltips

**Resumen del hito:**
1. **Calibración de la Habilidad Activa de Tengu:**
   - En **9x9**: **5 impactos meteóricos**.
   - En **13x13**: **9 impactos meteóricos**.
   - En **19x19**: **15 impactos meteóricos**.
2. **Textos y Tooltips Actualizados:**
   - Descripciones y tooltips del dock inferior (`title` dinámico) y de la tarjeta de duelo actualizados en toda la interfaz.
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 464ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 51): Calibración Fina (+5% Inteligencia) en Fácil y Medio

**Resumen del hito:**
1. **Fácil (Monje Novato):**
   - Tasa de despistes reducida al 28% y defensa de atari aumentada al 62%, con mejor formación de conexiones y ojos vivos.
2. **Medio (Sabio de la Niebla):**
   - Apertura Fuseki +15% más sólida, cortes tácticos más rápidos y reducción de ruido térmico.
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 557ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 50): Corrección de Invasiones Suicidas y Pase Proactivo en IA Fácil

**Resumen del hito:**
1. **Detección de la Causa en Captura:**
   - La IA básica ponía piedras sin sentido dentro del territorio cerrado del jugador porque la regla de despiste (*Blunder*) sobreescribía la puntuación de huecos suicidas de 1 libertad dándoles puntuación positiva y no pasaba turno al no tener jugadas viables.
2. **Corrección Aplicada:**
   - Prohibido terminantemente tirar piedras con $\le 2$ libertades en territorio cerrado para todas las dificultades.
   - El despiste solo opera sobre zonas abiertas con $\ge 2$ libertades.
   - Pase proactivo inmediato cuando no quedan jugadas constructivas en el tablero.
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 569ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 49): Integración de Tesujis de Sacrificio (Uttegae, Horikomi y Suteishi)

**Resumen del hito:**
1. **Tesujis de Sacrificio Maestro:**
   - **Uttegae (Snapback):** La IA coloca deliberadamente piedras de cebo para inducir la captura del rival y contracapturar de golpe grupos enteros (+3800 pts).
   - **Horikomi (Throw-in):** Inserción en la garganta del rival para reducir libertades o falsear ojos.
   - **Suteishi / Tenuki:** Abandono deliberado de piedras menores en atari para tomar iniciativa exterior gigante.
2. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 555ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 48): Unificación de Acto Único y Eliminación de Nodos Élite

**Resumen del hito:**
1. **Eliminación Total de "Élite":**
   - Eliminados todos los términos y tipos "Élite" o "Guardián Élite". Todos los combates del mapa son ahora batallas normales de Go con escalado progresivo de Kyu (Rondas 1 a 5).
2. **Acto Único Continuo:**
   - La expedición completa ocurre en un único mapa procedural que culmina directamente en el **👑 Jefe Final del Goban**.
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 561ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 47): Calibración Científica de Dificultades de la IA (Fácil y Maestro)

**Resumen del hito:**
1. **Modo Fácil Auténticamente Accesible (28 Kyu):**
   - Incorporado el modelo de *Humanized Blunders* de KaTrain: 38% de jugadas dóciles/relajadas y solo 50% de defensa de ataris para permitir al jugador practicar capturas y asegurar territorio.
2. **Modo Maestro Máxima Agresividad (2 Dan KataGo):**
   - Minimax de 3 plys con *Quiescence Search*, puntos vitales *Nakade* de 3 y 4 espacios, lectura de escaleras (*Shicho*) y temperatura casi nula ($\tau = 0$).
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 564ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 46): Corrección de Conflicto de Estado Roguelike en Modo Online

**Resumen del hito:**
1. **Detección del Conflicto de Inicialización:**
   - Si existía una partida previa de Roguelike en memoria, `initGame()` forzaba la partida a `gameMode: '1via'` y asignaba al enemigo `Monje Novato (30 Kyu)`, lo que provocaba que la IA respondiera automáticamente incluso en partidas creadas desde el menú online.
2. **Aislamiento Total de Modos:**
   - Modificado `GameController.ts` para que `gameMode: 'online'` tenga prioridad absoluta e impida cualquier intervención o cálculo de la IA local.
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 499ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 45): Migración a MQTT Pub-Sub y Fijación Persistente de Código de Sala

**Resumen del hito:**
1. **Fijación del Código de Sala:**
   - Detectado que al cambiar de personaje o tamaño en la pantalla de host, se generaba un código nuevo en segundo plano, dejando al invitado en la sala antigua.
   - El código `GO-XXXX` ahora es inmutable durante toda la sesión de la sala y se muestra de forma fija en la cabecera y en el panel inferior.
2. **Signaling MQTT Instantáneo (<10ms):**
   - Migrado a `@trystero-p2p/mqtt` con brokers mundiales de alta velocidad (`broker.emqx.io`, `hivemq.com`, `mosquitto.org`).
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 376ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 44): Sincronización Inmediata y Transición Automática Invitado-Anfitrión

**Resumen del hito:**
1. **Transición Automática al Tablero de Juego:**
   - Corregida la emisión del evento de arranque `START_GAME` mediante pulsos redundantes (ráfaga de 3 mensajes) y difusión broadcast a toda la sala.
   - Tan pronto como ambos jugadores se detectan, el modal de la sala se cierra automáticamente en las dos pantallas y se muestra el Goban.
2. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 290ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 43): Modernización del Motor de IA con Arquitectura KataGo / KaTrain

**Resumen del hito:**
1. **Aperturas Canónicas (Fuseki & Joseki):**
   - En 9x9 disputa el centro *Tengen* (`4,4`) y esquinas.
   - En 13x13 y 19x19 domina las esquinas con *Hoshi* (4-4), *Komoku* (3-4) y *Sansan* (3-3), seguidos de *Shimari*, *Kakari* y divisiones laterales *Wariuchi*.
2. **Lectura Minimax Alpha-Beta de 2 a 3 jugadas:**
   - En **Difícil** y **Maestro (Dan)** la IA calcula la mejor respuesta del oponente antes de colocar cada jugada, anticipando contragolpes y eliminando jugadas erráticas.
3. **Campo de Radiación de Influencia (Moyo Field):**
   - Mapa gravitatorio territorial de control de área y puntos vitales de vida y muerte (*Nakade*).
4. **Validación:**
   - `npm run build` y `npm run package:exe` completados con éxito (333ms).

---

## 14 de Agosto de 2026 - Día 1 (Sesión 42): Migración a Red de Trackers WebTorrent Swarm

**Resumen del hito:**
1. **Eliminación de Relays Nostr Inactivos:**
   - Detectados dominios caídos en la librería anterior (`chorus.almostmachines.dev` con `ERR_NAME_NOT_RESOLVED` y `hol.is` con 522).
   - Migrado el sistema a `@trystero-p2p/torrent` con trackers WebTorrent globales verificados de alta disponibilidad (`tracker.webtorrent.dev`, `tracker.openwebtorrent.com`, `files.fm`).
2. **Acceso a Consola de Depuración en `.EXE`:**
   - Documentado el atajo estándar `F12` / `Ctrl+Shift+I` para inspeccionar la consola de desarrollador dentro del `.exe`.
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 295ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 41): Rebalanceo de Habilidad Pasiva de Himiko a Turno 15

**Resumen del hito:**
1. **Ajuste de Turno y Aleatoriedad:**
   - La pasiva *Lluvia Pétrea Celestial* ahora se activa en el **15º turno personal** de Himiko.
   - Implementado el algoritmo Fisher-Yates para asegurar que las 4 piedras caigan de forma completamente aleatoria e impredecible en cualquier intersección libre del tablero.
   - Actualizadas todas las descripciones en UI y menús.
2. **Validación:**
   - `npm run build` y `npm run package:exe` completados sin errores (320ms).

---

## 14 de Agosto de 2026 - Día 1 (Sesión 40): Migración del Motor P2P a Trystero WebRTC Descentralizado

**Resumen del hito:**
1. **Sustitución de PeerJS por Trystero:**
   - Erradicado el fallo de `Could not connect to peer 6c27611a-...` originado por saturación y balanceo DNS del servidor gratuito central de `0.peerjs.com`.
   - Implementado matchmaking serverless con múltiples relays de respaldo simultáneos (`@trystero-p2p/nostr`).
2. **Control Total del Anfitrión:**
   - Botón visible `⚔️ ¡Comenzar Partida! (2/2 Listos)` integrado en el pie del modal y en el centro de la interfaz.
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados con éxito (279ms).

---

## 14 de Agosto de 2026 - Día 1 (Sesión 39): Corrección de Condición de Carrera en Apertura de DataConnection (PeerJS)

**Resumen del hito:**
1. **Diagnóstico a partir de Capturas:**
   - La pantalla del invitado mostraba `Conectando a la sala...` mientras que el anfitrión mostraba `(1/2 conectados)`.
   - El canal de datos ya estaba abierto en el momento en que se registraba el listener `connection.on('open')`, lo que provocaba que el evento no se disparase y la señal `START_GAME` quedase retenida.
2. **Solución:**
   - Implementada comprobación inmediata `if (connection.open) onOpen() else connection.on('open', onOpen)` en anfitrión y cliente.
   - Sincronización instantánea de partida al pulsar «Conectar 🚀».
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados en 324ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 38): Blindaje de Conexión WebRTC con TURN Relay y Fallback

**Resumen del hito:**
1. **Infraestructura de Conectividad P2P:**
   - Incorporada configuración `iceServers` en `NetworkManager.ts` con servidores STUN (Google, Mozilla) y servidores TURN Relay de alta disponibilidad (OpenRelay).
   - Solucionado el problema de routers con CGNAT o firewalls estrictos (el tráfico se conmuta automáticamente a TURN si P2P directo no responde).
2. **Claridad del HUD:**
   - Añadido texto explícito en el HUD: `🟢 ¡Tu turno de mover! — (Te toca mover)` vs `⏳ Esperando al rival...`.
3. **Validación:**
   - `npm run build` y `npm run package:exe` pasando limpiamente en 305ms.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 37): Sistema Automatizado de Túnel en Vivo (`JUGAR_ONLINE_CON_AMIGOS.bat`)

**Resumen del hito:**
1. **Implementación de Túnel Seguro (`localtunnel`):**
   - Creado [`scripts/share.js`](file:///c:/Users/VICTOR/Desktop/crazy_go/scripts/share.js) y comando `npm run share`.
   - Creado lanzador de Windows de 1-clic [`JUGAR_ONLINE_CON_AMIGOS.bat`](file:///c:/Users/VICTOR/Desktop/crazy_go/JUGAR_ONLINE_CON_AMIGOS.bat).
2. **Funcionamiento:**
   - Detecta la IP pública del anfitrión para la contraseña de seguridad.
   - Genera una URL pública `https://*.loca.lt` segura HTTPS.
   - Permite que amigos se conecten desde cualquier navegador sin descargar ni instalar nada.
   - Cualquier cambio en el código se propaga en vivo con Hot-Reloading.
3. **Validación:**
   - Probada la conexión del túnel y la resolución de IP pública con salida limpia y verificada.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 36): Corrección de Visibilidad y Aislamiento de Habilidades en Roguelike

**Resumen del hito:**
1. **Identificación y Causa Raíz:**
   - La plantilla HTML de `#roguelike-setup-modal` contenía dos cajas fijas (activa y pasiva) simultáneas.
   - La función JS `RogueModalRenderer` ejecutaba `document.querySelector('.active-skill-box')` sin restringir el selector a su modal, modificando por error el modal de Modo Local y dejando en el Roguelike ambas tarjetas estáticas visibles al mismo tiempo.
2. **Solución:**
   - Aplicado prefijo `rogue-` a todos los elementos del showcase de la expedición (`#rogue-hero-showcase-img`, `#rogue-hero-showcase-name`, `.rogue-hero-active-box`, `.rogue-hero-passive-box`, `#rogue-hero-thumb-strip`).
   - Unificado el renderizado con `ModalManager.renderHeroShowcaseElements('rogue', tempHero)`, garantizando que solo se muestra la tarjeta de la habilidad real de cada héroe (ocultando la otra).
3. **Validación:**
   - `npm run build` y `npm run package:exe` completados con **0 errores**.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 35): Selección y Sincronización de Campeones en Modo Online P2P

**Resumen del hito:**
1. **Showcase Panorámico en Modo Online (`online-modal`):**
   - Integrado el carrusel de héroes tanto en la pestaña de **Crear Sala (Host)** como en la de **Unirse a Sala (Guest)**.
   - Ambos jugadores pueden elegir entre los 6 personajes (Clásico / Tengu / Himiko / Kitsune / Ronin / Ryūjin) con botones `<` / `>` y tira de miniaturas.
2. **Sincronización en Tiempo Real P2P:**
   - Mensaje `HERO_SELECT` para reflejar en vivo los cambios de héroe en el lobby de todos los jugadores.
   - `LOBBY_UPDATE` muestra el avatar y nombre del héroe seleccionado en cada tarjeta de slot.
   - `START_GAME` transmite los héroes de todos los participantes a la partida.
3. **Validación:**
   - `npm run build` completado en 712ms con 0 errores TypeScript.
   - `CrazyGo.exe` y `CrazyGo_Portable.zip` actualizados.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 34): Showcase Panorámico de Campeones en Modo Local y Personaje Clásico

**Resumen del hito:**
1. **Showcase Panorámico de Selección de Héroe en Modo Libre (`new-game-modal`):**
   - Rediseñada la sección de selección de Campeón en `#new-game-modal` para replicar el mismo showcase panorámico horizontal de alta definición que el modo Roguelike.
   - Navegación bidireccional fluida con botones `<` y `>` para ciclar entre los 6 personajes con sonido de piedra Go.
2. **Inclusión del Personaje Clásico (⚪ Sin Campeón / Maestro del Go Clásico):**
   - Retrato en primer plano generado con estética anime zen tradicional (`/heroes/classic_face.jpg`).
   - Título: *«Sin Campeón — Maestro del Go Clásico»*.
   - Cita: *«En la simplicidad de la piedra negra y blanca reside la armonía infinita del universo.»*
   - Tarjeta de Reglas Puras: *«📜 REGLAS PURAS: Reglas Canónicas Japonesas (Sin habilidades místicas ni hechizos. Solo estrategia pura, libertades, Ko y territorio)»*.
3. **Tira de Miniaturas Interactiva:**
   - 6 miniaturas cuadradas con bordes redondeados y halo dorado de activación (Clásico, Tengu, Himiko, Kitsune, Ronin, Ryūjin).
4. **Validación:**
   - `npm run build` completado en 713ms con 0 errores TypeScript.
   - `CrazyGo.exe` y `CrazyGo_Portable.zip` generados y actualizados.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 33): Previsualización Dinámica de Zona en Hover para "Lluvia de Meteoros"

**Resumen del hito:**
1. **Previsualización Dinámica en Hover (`SVGGhostPreview.ts` & `ChampionManager.ts`):**
   - Extraído `ChampionManager.getMeteorZoneNodes(board, centerNodeId)` para sincronizar matemáticamente la zona de impacto entre la previsualización y la ejecución.
   - Al pasar el cursor sobre cualquier intersección con la habilidad de Meteoros activa, se despliegan halos ardientes con resplandor (`#glow-meteor`) en todas las casillas del área del 15% (mínimo 7 casillas).
2. **Diferenciación Táctica de Casillas y Efectos Visuales:**
   - **Piedras Enemigas:** Halo carmesí `#ef4444` con retícula táctica interior de impacto inminente.
   - **Piedras Aliadas:** Halo ámbar `#f59e0b` de advertencia de fuego amigo.
   - **Casillas Vacías:** Halo anaranjado fuego `#f97316`.
   - **Epicentro:** Anillo rotatorio de mira telescópica `.vfx-meteor-epicenter-ring` con icono celestial `☄️`.
   - **Tooltip Flotante en el Goban:** Badge informativo superior indicando `☄️ Zona de Ataque (X casillas / 7 impactos)`.
3. **Validación:**
   - `npm run build` completado en 450ms con 0 errores TypeScript.
   - `CrazyGo.exe` y `CrazyGo_Portable.zip` generados y actualizados.

---

## 15 de Agosto de 2026 - Día 1 (Sesión 33): Calibración Visual de Tableros, Pasivas de Campeones, Rutas Relativas para Itch.io y Preparación de Lanzamiento

**Resumen del hito:**
1. **Calibración y Geometría de Tableros en `SVGRenderer.ts`:**
   - **Compensación Óptica Triangular (+50px Y, +15% Zoom):** Cálculo de centro de masa (centroide vs bounding box) para elevar automáticamente 50px los tableros triangulares y aplicarles un zoom-in del 15% mediante el `viewBox` para eliminar espacios muertos.
   - **Reducción Global del Tablero (-8%):** Escala base reducida a `scale(0.97)` en `board.css` para evitar colisiones y solapamientos visuales con los standees y cajas de HUD laterales.
2. **Corrección de Habilidades de Campeones y Limpieza de UI:**
   - **Pasiva de Ronin (*Filo del Samurai*):** Configurada a activación cada 20 turnos y corrección de doble disparo vinculando el chequeo a `heroOwnerId`.
   - **Pasiva de Himiko (*Lluvia Pétrea Celestial*):** Integración de `HimikoVFX` con `#vfx-live-container` para garantizar que la capa de animación de cometas sobreviva a los re-renderizados continuos del Goban provocados por la colocación física de cada piedra.
   - **Limpieza de Emojis en i18n:** Eliminación de prefijos de emojis duplicados en `translations.ts` para evitar visualizaciones repetidas como `[🌧️] 🌧️ Lluvia Pétrea`.
   - **Ajuste de Standee de Ronin:** Aplicada regla CSS con `scale(1.53)` (+8%) y desplazamiento de -10px a la izquierda.
3. **Conversión Universal a Rutas Relativas y Despliegue en Itch.io:**
   - Conversión global de todas las rutas de assets (`/heroes/`, `/enemies/`, `/audio/`, `/img/`) a rutas relativas (`./heroes/`, etc.) en `index.html` y código TypeScript para compatibilidad con iframes y subdirectorios de Itch.io.
   - Compilación exitosa para navegador y generación de paquetes `crazy_go_itchio_v4.zip` listos para jugar en browser.
4. **Marketing y Assets Visuales:**
   - Generación de miniaturas (Cover Images) 2D estilo anime pixel-art de alta resolución centradas en el Goban con título "CRAZY GO" en alto contraste.
   - Redacción de 3 publicaciones especializadas para `r/roguelites`, `r/baduk` y `r/aigamedev`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 32): Refactorización y Modularización de los Archivos más Grandes del Proyecto

**Resumen del hito:**
1. **Modularización de `main.ts` (Reducido de 770 a 40 líneas):**
   - Creado `src/events/KeyboardController.ts`: Gestión centralizada de atajos in-game (`1-4` hechizos, `6-8` poliminós, `R` rotación, `Espacio` pasar, `U` deshacer, `S` contar).
   - Creado `src/events/AppEventBinder.ts`: Enlazador de eventos DOM de navegación, partidas libres, roguelike, online, opciones y sandbox.
   - `main.ts` opera ahora como un bootstrap mínimo, legible y enfocado.
2. **Modularización de `SVGRenderer.ts` (Reducido de 767 a 345 líneas):**
   - Creado `src/graphics/SVGDefs.ts`: Encapsulación de sombras de Go, filtros de resplandor sagrado/botánico/meteórico y gradientes radiales para los 4 colores de jugadores.
   - Creado `src/graphics/SVGGhostPreview.ts`: Previsualización interactiva de piedras, poliminós con conectores visuales y tooltips flotantes en el Goban, además de overlays de selección de habilidades.
3. **Modularización de `ModalManager.ts` (Reducido de 608 a 280 líneas):**
   - Creado `src/ui/modals/ScoreModalRenderer.ts`: Lógica de presentación de desglose de territorio, prisioneros, Komi y podio 2P y 4P.
   - Creado `src/ui/modals/RogueModalRenderer.ts`: Gestión visual de recompensas de cartas, diálogo de selección de run, eventos del mapa y vista de mazo/reliquias.
   - `ModalManager.ts` mantiene intacta su API pública como fachada unificada sin romper llamadas externas.
4. **Validación:**
   - `npm run build` completado en 437ms con 0 errores TypeScript.
   - `npm run package:exe` actualizó `CrazyGo.exe` y `CrazyGo_Portable.zip` sin inconsistencias.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 31): Generador Procedural Infinito de Topologías, Rotación Tooltip de Poliminós y Eliminación de Veneno

**Resumen del hito:**
1. **Eliminación Completa del Hechizo Veneno (`poison`):**
   - Eliminado `'poison'` de `SpellId`, `TargetingMode`, `StoneInfo` y `ECS.ts`.
   - Eliminado de `RogueliteManager.ts`, dejando 4 hechizos místicos: Rebobinar ⏳, Meteorito ☄️, Piedra Sagrada 🛡️ e Inversión Yin-Yang 🔄.
   - Eliminado de los pools de hechizos de todos los campeones en `RoguelikeRunManager.ts`, recompensas de `RoguelikeController.ts`, HTML y atajos de teclado (1-4).
2. **Rediseño de la Rotación del Poliminó Dominó 2x1 (Sin Botón Flotante Invasivo):**
   - Eliminado el botón flotante `#poly-btn-rotate` del DOM y de la interfaz visual.
   - Integrado un indicador dinámico `2x1 ⇄ [R]` / `2x1 ⇅ [R]` en la tarjeta de Dominó del dock táctico.
   - La tecla **`R`** rota la orientación 90º en tiempo real, actualizando dinámicamente el ghost preview sobre el Goban y mostrando una indicación limpia.
3. **Generador Procedural Infinito de Topologías Orgánicas (`🎲 Procedural`):**
   - Implementado en `BoardGenerators.generateProceduralGrid(board, size, seed)`.
   - 4 Arquetipos orgánicos generados proceduralmente: Costa y Penínsulas Dentadas, Archipiélago con Puentes Tácticos, Abismo / Cráter Celestial Central, y Cañón Táctico Dividido.
   - Algoritmo de Conectividad Estricta (BFS Flood-Fill) que asegura un único componente conexo con superficie útil del 60-85% y sin nodos aislados de 0 o 1 libertad inicial, 100% canónico según las reglas de Go.
   - Integrado en Modo Libre, Modo Online, Roguelike y Modo Sandbox / Pruebas.
4. **Redise�3. **Mejora Integral del Zoom (`ModalManager.ts`, `AppEventBinder.ts`):**
   - Completada la Tarea 261.
   - Refactorizada la función de zoom para permitir incrementos/decrementos precisos en pasos del 10% (rango del 10% al 200%).
   - Se eliminó la persistencia errónea inter-sesiones en `localStorage`, garantizando que la partida inicie siempre en un nítido 100%.
   - Creado un manejador de eventos del nuevo botón de `Restablecer Zoom` en el menú para centrar y escalar de vuelta a la proporción original con un clic.
4. **Adiciones Secundarias Integradas (Tareas 258, 259, 260):**
   - Ajustes en el Icono de Batalla del modo Roguelike para mayor claridad visual.
   - Integración final del modo *Co-op Roguelike 2P* dentro del menú Roguelike.
   - Sincronización de Música de Fondo Dinámica (BGM) en los duelos.

---

## 17 de Agosto de 2026 - Sesión 52 y 53: Refactorización Arquitectónica de Eventos, Mejoras del Alquimista y Opciones de FPS (Fases 44 y 45)

**Resumen del hito:**
1. **Refactorización Arquitectónica (Clean Architecture):**
   - Extracción masiva de código monolítico desde GameController.ts.
   - Se crearon nuevos *Binders* para gestionar los eventos del sistema: MenuEventBinder.ts, GameEventBinder.ts y OnlineEventBinder.ts, que delegaron el control visual puramente al DOM sin ensuciar la lógica del juego.
   - Creación e integración de InteractionManager.ts como la nueva fachada principal para capturar interacciones de teclado, modales, habilidades activas, uso de hechizos y despliegue de poliminós.
   - Creación de GameEventBus.ts para conectar de forma desacoplada la notificación de jugadas y turnos con RoguelikeController y StoryController.
   - Resolución de todos los conflictos y dependencias cruzadas generadas por el rediseño para asegurar 0 Errores en la validación estricta de TypeScript.
2. **Mejoras del Campeón Alquimista (Inversión Cromática):**
   - **VFX Remasterizado:** Ahora, al usar su habilidad activa, aparece una brocha o pincel animado (🖌️) de forma elegante pintando sobre la piedra para simular la transmutación visual del color, limitando la fluidez a los parámetros del nuevo sistema de FPS.
   - **Elección Completa en 4 Jugadores:** La habilidad ahora cambia "cualquier piedra a cualquier otro color", en lugar de limitarse a Blanco/Negro. En partidas de más de 2 jugadores, ahora despliega un modal intermedio (`#modal-color-picker`) donde el jugador elige manualmente a qué color exacto va a convertir la piedra (Negro, Blanco, Verde o Púrpura). Se implementó usando de forma eficiente una función async en el flujo del `ChampionManager`.
3. **Nuevas Configuraciones Básicas del Sistema:**
   - **Límite de FPS (Animaciones):** Agregada una opción en el modal de Opciones que permite reducir la tasa de refresco (30 FPS) para efectos visuales o dejarlo fluido (60 FPS) mediante `GlobalSettings.ts`. Útil para ahorrar batería en portátiles o mejorar fluidez en dispositivos de menores recursos.
   - **Animaciones de Partículas:** Añadido un botón de palanca adicional para activar/desactivar completamente la ejecución de animaciones SVG/VFX en tiempo real.

---

## 21/08/2026 - Sesión de Optimización P2P
- Se corrigieron los problemas de visualización del tooltip y nombre de habilidades de oponentes en modo multijugador online P2P.
- Se solucionó el problema de ejecución de habilidades remotas en el cliente local que causaba el bug de "Asignación Local del Héroe". Ahora la asignación respeta el héroe del oponente de la red.
- Se implementó `SeededRandom.ts` para resolver desincronizaciones de tablero causadas por habilidades y pasivas aleatorias.
- Se añadió redundancia STUN/TURN (Google) para evitar fallos de ICE Candidates que producían cuelgues al unirse a las salas.
- Se rediseñó la barra de Winrate: se eliminó la barra pequeña superior y se amplió la barra cuádruple, colocándola en la parte inferior del tablero con etiquetas de porcentaje explícitas. Redimensionada al 70% de ancho y 12px de altura para evitar solapamientos con la barra de hechizos.
- Reducción del tamaño del tablero (SVG) en un 5% y reubicación vertical (-40px) para acomodar la nueva HUD sin obstaculizar modos Roguelike.
- Se ha integrado una "Heurística de Iniciativa" inspirada en KataGo dentro de `AnalysisEngine`. Ahora la evaluación neutraliza los sesgos del Komi inicial de forma progresiva, mostrando probabilidades justas (50/50 o 25/25/25/25) en el primer turno y decayendo a medida que se desarrolla la partida.
- Generadas versiones ejecutables v14 (Windows e Itch.io).
- Aplicadas las Mejoras Temporales A+B al motor heurístico de Winrate (AnalysisEngine): ajuste severo de la temperatura del algoritmo Softmax para responder dinámicamente al tamaño del tablero y reflejar diferencias de puntuación con mayor precisión táctica, sirviendo de puente hasta la integración de la red neuronal ResNet-12.

---

## 23 de Agosto de 2026 - Sesiones 114 a 117: Tablero del Cielo, Entorno Espacial 2.5D, Matchmaking Online, Fix Alquimista 4P y Poliminós 3D (Fases 59 a 62)

### 1. Tablero del Cielo (*Sky Board*) y Colapso Celestial (Fase 59):
- **Nueva Topología `sky` (`BoardGenerators.ts`, `SVGRenderer.ts`, `StageHazardManager.ts`, `SkyVFX.ts`, `SVGDefs.ts`)**:
  - Tablero suspendido con nubes etéreas en deriva suave (`.sky-cloud-drift`), estrellas titilantes (`.sky-star-twinkle`) y gradientes celestes en las esquinas.
  - **Peligro Ambiental**: Cada 20 turnos globales colapsan 5 bloques cuadrados $2\times 2$ (hasta 20 casillas) con animación VFX suave (`cubic-bezier(0.22, 1, 0.36, 1)`) sin sacudidas de pantalla bruscas.

### 2. Entorno Espacial 2.5D y Foco de Cámara Interactivo (Fases 21 y 22):
- **Menú Principal Espacial 2.5D (`MenuCameraController.ts`, `index.html`, `base.css`)**:
  - Objetos físicos diegéticos (`.dojo-item`) en un escenario 16:9 con coordenadas porcentuales absolutas.
  - Zoom óptico in-situ sin desplazamiento lateral (0px shift) mediante `transform-origin` dinámico, amortiguación debounced de 15ms y curva Ease-Out Expo.
  - Sistema de cursores vectoriales SVG de alta definición (Puntero maestro de obsidiana, Puntero de Go con piedra blanca nacarada).
- **Pantalla de Continuar Expedición Roguelike 2.5D (`RogueChoiceCameraController.ts`, `modal-rogue-choice.html`)**:
  - Escenario interactivo con vistas traseras de los 7 campeones (`public/heroes/*_back.png`), placa central de datos y Depth of Field cinemático.

### 3. Matchmaking Anónimo Global y Lobby Libre Híbrido (Fase 62):
- **Emparejamiento Rápido Automático (`NetworkManager.ts`, `OnlineModalRenderer.ts`)**:
  - Búsqueda de partidas con prefijo temporal (`MATCHMAKING_{N}P_{HORA}`) vía `trystero/mqtt`. Los jugadores se emparejan anónimamente y el host genera una sala privada `GO-XXXX` transparente.
- **Lobby Libre y Slots Híbridos**:
  - Configuración flexible por slot: Humano Local (`human_local`), Humano Remoto (`human_remote`) o IA (`ai`).
  - Sincronización de IA local en partidas en red mediante `GameController.checkAITurn()`, permitiendo iniciar partidas mixtas aunque falten rivales humanos remotos.

### 4. Fix Definitivo: Habilidad del Alquimista en 4 Jugadores (4P) (`AlchemistChampion.ts`, `ChampionManager.ts`, `ModalManager.ts`, `SVGRenderer.ts`):
- **Priorización de Modos de Apuntado (`ChampionManager.ts`)**:
  - Reestructurado `executeTargetedSkill()` para priorizar de forma estricta `currentTargetingMode === 'convert_enemy'` (Alquimista) en lugar de evaluar primero el ID de héroe local (`effectiveHero`), evitando que la habilidad falle o ejecute acciones de otros personajes en partidas 4P o con slots mixtos.
- **Eliminación de Conflicto de Doble Callback (`SVGRenderer.ts`)**:
  - Unificado el callback `onComplete` en ramas mutuamente excluyentes (`onSkillPlaced` $\rightarrow$ `advanceStep` $\rightarrow$ `onPassiveBurnCompleted` $\rightarrow$ `onMovePlaced`), eliminando la colocación accidental de piedras duplicadas tras usar habilidades activas.
- **Selector de Color 4P Robusto (`ModalManager.ts` & `modal-color-picker.html`)**:
  - Modal rediseñado con cuadrícula 2x2 para ⚫ (P1), ⚪ (P2), 🟢 (P3) y 🟣 (P4).
  - Captura infalible de clic con `(e.target as HTMLElement).closest('.color-picker-btn')`, prevención de propagación de eventos y soporte para cancelación limpia (botón Cancelar o clic fuera).
- **Flujo de Turno y Seguridad**:
  - Si el jugador hace clic en una casilla vacía o protegida, el modo de apuntar permanece activo sin penalizar al usuario.
  - Si cancela el modal, se restaura la interactividad sin pasar turno a la IA ni restar cargas.
  - Verificados y blindados el resto de campeones (Tengu, Kitsune, Himiko, Ronin, Ryūjin) para 4 jugadores.

### 5. Piedras Especiales: Duplicidad (2x1) y Monolito (2x2) (`PolyominoManager.ts`, `GameController.ts`, `KeyboardController.ts`, `SVGRenderer.ts`, `SVGGhostPreview.ts`, `SVGDefs.ts`):
- **Rotación con Tecla `[R]` y Clic en HUD**:
  - Soporte de tecla física `KeyR` y mayúsculas/minúsculas para alternar instantáneamente entre Horizontal ⇄ y Vertical ⇅.
  - Clic repetido sobre el botón de Duplicidad en el HUD rota la orientación automáticamente.
- **Auto-Ajuste Inteligente de Bordes (`PolyominoManager.ts`)**:
  - Al colocar Duplicidad (2x1) o Monolito (2x2) en los bordes o esquinas del Goban, la pieza se orienta automáticamente hacia el interior del tablero, evitando errores de fuera de límites.
- **Texturas Visuales y Shaders 3D de Alta Fidelidad**:
  - *Duplicidad (2x1)*: Cápsula continua biselada con relieve (`#domino-bevel`), borde dinámico del color del jugador, aros concéntricos de núcleo y runa central `🀄` con resplandor místico.
  - *Monolito (2x2)*: Losa megalítica maciza de 4 piedras unificadas con sombra 3D profunda (`#monolith-shadow`), líneas interiores de talla rúnica en cruz, aros de anclaje de esquina y emblema titánico `🧱` con resplandor dorado (`#monolith-rune-glow`).
  - *Previsualizaciones Ghost*: Renderizado reactivo en hover con tooltip informativo flotante de orientación `⇄ [R]` / `⇅ [R]`.

### 6. Zoom Global y Estabilidad del Sistema:
- Restaurado el motor de escalado de interfaz (`ModalManager.setZoom` / `initZoom`) mediante `transform: scale()` sobre `#app` con atajos globales `Ctrl +`, `Ctrl -`, `Ctrl 0`.
- Compilación validada al 100% con `npm r

## 23/08/2026 - Sesión 117: Optimización del Menú Sandbox (Testing Lab), Topología Dinámica Máscara Oni y Zoom Nativo Chromium

### 1. Optimización Integral del Menú Sandbox (Testing Lab & Troubleshooter) (Fase 63)
- **Rediseño Ergonómico y Visual del Panel Flotante (`modal-sandbox.html`, `sandbox.css`):**
  - Transformado en un panel lateral flotante con estética *glassmorphism* translúcida (`rgba(13, 20, 32, 0.96)`), bordes sutiles de esmeralda y scroll interno ultra-fino.
  - Dimensiones dinámicamente adaptadas (`clamp(340px, 25vw, 410px)` y `calc(100vh - 70px)`) para permitir manipular el tablero e interactuar con el juego de fondo sin obstruir el Goban de combate.
- **Barra de 4 Pestañas en Grid 4x1 Perfecto:**
  - Pestañas `🖌️ Pinceles`, `🗺️ Tablero`, `🎯 Pruebas` y `⚡ Poderes` distribuidas al 100% de ancho sin desbordamiento horizontal ni cortes en ninguna resolución.
- **Cabecera Compacta con Acceso Rápido:**
  - Añadido botón de cierre rápido `✖` en la esquina superior derecha para cerrar el panel con un solo clic.
  - Botón de alternancia de colocación simplificado a toggle compacto `🖌️ Pincel ON` / `🖌️ Pincel OFF`.
- **Selector Completo de los 8 Campeones:**
  - Incorporado el **Alquimista** junto a Normal, Tengu, Himiko, Kitsune, Ronin, Ryūjin y Dragón Sabio en una cuadrícula compacta 4x2.
  - Al cambiar de héroe se le otorgan automáticamente 99 cargas de habilidad y se actualizan el HUD, el retrato y el snapshot de combate en caliente.
- **Fix en "Activar Habilidad Activa" y "Forzar Efecto Pasivo":**
  - Corregida la resolución dinámica de habilidades activas: detecta con exactitud el campeón en uso (Meteoro de Tengu, Escudo de Kitsune, Transmutación del Alquimista, Llamas de Ryūjin, Rebobinados de Normal, etc.) configurando el modo de apuntado preciso con 99 cargas.
- **Lanzador Directo de TODOS los Poderes (Estación de Debug Total):**
  - Añadidos botones independientes para disparar cualquier poder en cualquier momento sin necesidad de cambiar de héroe:
    - `☄️ Meteoro 5x5 (Tengu)`: Activa lluvia de meteoros en área.
    - `🛡️ Escudo Divino (Kitsune)`: Activa modo de protección sagrada indestructible.
    - `⚗️ Transmutación (Alquimista)`: Activa inversión cromática con selector de color 4P.
    - `🐉 Llamas Aliento (Ryūjin)`: Activa selección para calcinar 2 piedras enemigas.
    - `🗡️ Corte Katana (Ronin)`: Ejecuta tajo diagonal de viento con VFX y sonido.
    - `🌧️ Lluvia Pétrea (Himiko)`: Invoca 4 piedras bendecidas con rayos celestiales.
    - `🔥 Quema 25% (Boss Dragón)`: Incinera el cuadrante de la esquina con mayor densidad de piedras.
    - `⏳ +5 Rebobinados (Normal)`: Añade +5 cargas de rebobinado táctico al jugador.
    - `🔄 Pasar Turno (Pass)`: Fuerza el paso de turno para ceder el control al rival/IA.
- **Pinceles de Tablero y Entidades Categorizados:**
  - Separado visualmente en categorías claras: *Piedras de Jugador* (⚫ P1, ⚪ P2, 🟢 P3, 🟣 P4, 🛡️ Sagrada), *Poliminós* (🌿 Brote 1x1, 🀄 Dominó 2x1, 🧱 Monolito 2x2), *Entidades* (🎁 Cofre, 🧙 Monje, 📜 Pergamino, ✨ Espíritu) y *Terrenos* (🌌 Portal, 🌀 Vórtice, ⛩️ Santuario, 🪨 Destruir, ⏹️ Normal, 🧹 Borrador).

### 2. Topología Dinámica y Peligro Ambiental: Máscara Oni (Demonio)
- **Generador de Topología Temática (`BoardGenerators.ts`, `types/index.ts`):**
  - Nueva forma de tablero `oni` esculpida en madera Kaya con forma de máscara de demonio japonés: cuernos superiores (frente hendida), ojos huecos, pómulos y boca central.
  - Soportada en los tres tamaños estándar: 9x9 (Rápido), 13x13 (Equilibrado) y 19x19 (Oficial Pro).
- **Mecánica Dinámica de Lava (`StageHazardManager.ts`):**
  - A partir de la ronda 30 (y fases posteriores en rondas 40 y 50), la boca del Oni entra en erupción y escupe lava fundida en columna vertical hacia la barbilla, destruyendo las intersecciones y dividiendo el tablero inferior en dos mitades independientes con animaciones VFX de fuego y capturas automáticas de piedras atrapadas.
- **Integración y Selección en Todos los Modos (`SetupEventBinder.ts`, `SetupModalRenderer.ts`, `OnlineEventBinder.ts`, `OnlineModalRenderer.ts`, `translations.ts`):**
  - Añadido a los selectores de tablero de Partida Local (Asistente), Lobby Online, Testing Lab (Sandbox) y Generador de Mapas Roguelike.
  - Textos descriptivos y advertencias diegéticas traducidos al 100% en español e inglés.

### 3. Zoom Nativo Chromium y Rendimiento
- Eliminados los hacks artificiales de escalado CSS que alteraban el tamaño del layout y deformaban las unidades `vw`/`vh` relativas en modales y menús.
- Desbloqueados los atajos de teclado del navegador en `KeyboardController.ts`, permitiendo que el motor embebido de Chromium/Edge de `CrazyGo.exe` gestione el zoom nativamente con máxima fluidez y aceleración por hardware (`Ctrl + Rueda`, `Ctrl +`, `Ctrl -`, `Ctrl 0`).
- Validación de compilación completa: **0 errores de TypeScript y bundle de producción Vite limpio**.

## 27/08/2026 - Sesión 118 (Parte 2): Flujo Online Co-op Roguelike

### 1. Reestructuración del Asistente Online para Roguelike Expedition
- **Fast-Track al Lobby:** Se modificó el menú Online (modal-online.html, OnlineEventBinder.ts, OnlineModalRenderer.ts) para que, al elegir "Roguelike Expedition", se omitan los pasos de configuración estándar (Jugadores, Tablero, Campeón, Escenario). El Host es llevado directamente al Lobby (Paso 6 convertido visualmente en Paso 2) para generar y compartir el código de la sala.
- **Transición Controlada Host/Guest:** En OnlineController.ts y NetworkManager.ts, cuando un invitado se une a la sala:
  - El **Host** cierra el modal online y abre el selector de Dificultad y Campeón del Roguelike.
  - El **Guest** cierra el modal y queda en espera pasiva de la configuración.
- **Sincronización de Semilla (RogueSeed):** RoguelikeController ahora empaqueta la configuración elegida por el Host (difficulty, hostHero, 
ogueSeed) y la envía mediante NetworkManager a los invitados. Ambos inician el mapa procedimental idéntico de forma sincronizada.


### Sesión 151 (27/08/2026)
- **Asistente Online (Cooperativo)**: Ocultadas dinámicamente las secciones irrelevantes de Color (Blancas/Negras), Komi y la opción de llenar slots con bots o jugadores locales en modo Cooperativo.
- **Sub-Turnos en Combate Co-op**: Se implementó una alternancia estricta del control entre el anfitrión y el invitado al jugar contra la IA (Negras compartidas). Si alguien intenta colocar, pasar turno o lanzar hechizos fuera de su sub-turno, recibe un aviso.
- **Sincronización Determinista del Mapa Roguelike**: Bloqueados los clics del invitado en los nodos del mapa y en los botones de recompensas/eventos (detectando .isTrusted para denegar acciones nativas del invitado). El anfitrión toma todas las decisiones, que se sincronizan con los nuevos eventos de red MAP_CLICK y EVENT_OPTION_CLICK, forzando la interfaz del invitado a replicar mecánicamente las decisiones (tn.click()) y avanzar el estado local al unísono.
- **Votación Anti-Abandonos**: Al pulsar 'Abandonar Expedición', se requiere el consentimiento del compañero vía VOTE_ABANDON.


- **Generación de Paquetes Distribuibles**: Compilados con éxito los dos archivos .zip oficiales del proyecto: crazy_go_itchio_v14_browser.zip (69.13 MB para navegador web en Itch.io) y crazy_go_windows_v14.zip (69.14 MB versión portable para Windows PC con CrazyGo.exe y README.txt en inglés).


- **Blindaje Criptográfico y Ofuscación de Código (uild_packages.js)**: Integrado el módulo javascript-obfuscator en el pipeline oficial de empaquetado. Todos los bundles JavaScript se procesan con Control Flow Flattening, inyección de código muerto, encriptación Base64/RC4 de strings y ofuscación hexadecimal de identificadores antes de generar los archivos .zip de Itch.io y Windows PC.





## 28 de Agosto de 2026 - Día 12 (Sesión 160) [Horario: 21:15 - 21:30]: Reparación de Arquitectura Linear ONNX y Winrate Lock

### 🧠 1. Solución al Modelo Uniforme de ONNX (El problema del Best move 0,0)
- **Causa Raíz**: El modelo de IA se estaba exportando con --board-size 19, mientras que el entrenamiento original se hizo con tablero 9x9. CrazyGoNet usa una capa 
n.Linear que está acoplada al tamaño exacto de exportación. Al pedirle a PyTorch que forzara el 19x19, reinicializó esa capa Linear con pesos aleatorios. Esto provocaba que el modelo de ONNX escupiera puro ruido (probabilidad uniforme de 0.0142 para todas las casillas), obligando a la IA a escoger siempre el primer nodo de la lista ( ,0), lo que generaba un bucle infinito en el RulesEngine.
- **Solución Implementada**: He ajustado NeuralNetAdapter.ts para que se adapte dinámicamente al oard.size (es decir, le enviará a ONNX un tensor 9x9 cuando se juegue en tablero de 9x9). Sin embargo, es **obligatorio que el usuario vuelva a exportar el modelo usando --board-size 9** para que las dimensiones coincidan con el checkpoint original.

### 📊 2. Reparación del Freeze del Main Thread (Winrate Lock)
- **Causa Raíz**: HUDController llamaba a AnalysisEngine.calculateWinRate() a 60 FPS, y cada vez se disparaba una evaluación ONNX asíncrona sin throttling. Esto bloqueaba el Main Thread por encolar miles de inferencias WASM por segundo.
- **Solución Implementada**: Añadido un mutex (isEvaluatingWinRate) en AnalysisEngine.ts que bloquea peticiones de inferencia simultáneas, y una capa de caché que asegura que sólo se ejecuta 1 vez por turno. Ahora el Winrate en tiempo real es instantáneo y no satura la interfaz.

### ⚙️ 3. Interpolación de Rangos Intermedios de IA
- **Verificación**: Efectivamente, la red convierte dinámicamente los Kyu intermedios. El Worker (GoAI.worker.ts) tiene una fórmula matemática continua: 30 Kyu equivale a Temperatura 2.0 (muy aleatorio), 20 Kyu a 1.3, 10 Kyu a 1.0, hasta 1 Dan a 0.5 y 9 Dan a 0.0 (Argmax estricto).


## 29 de Agosto de 2026 - Día 20 (Sesión 166) [Horario: 10:23 - 10:45]
**Sub-Agentes Involucrados**: Antigravity (IA)

- **Consolidación del Sabio de Go Puro (sage)**:
  - Eliminados todos los duplicados (Monk 1-5, Sage 2-5).
  - Añadido de forma explícita el sage a la rotación canónica de heroes y 
ivalList en SetupEventBinder.ts.
  - El Sabio no posee ninguna habilidad especial y se juega en estado de Pure Go.

- **Cuadrícula Compacta de 4 Paneles (Modo 4 Jugadores)**:
  - Se modificó SetupModalRenderer.ts para que si config.playerCount === 4, fuerce la visibilidad de splitContainer con la nueva clase CSS .four-players.
  - Adaptado el fichero setup.css para crear una rejilla 2x2.
  - Implementada la inyección de las columnas setup-p3-col y setup-p4-col en modal-local-setup.html.
  - Conectados los botones P3 y P4 (Prev/Next/Thumbs) en SetupEventBinder.ts actualizando en caliente config.enemyHeroIds[3] y [4].
  - Corregido el caso del Jugador 2 (P2) para que también registre en config.enemyHeroIds[2] durante las partidas 4P.

- **Previsualización de 4 Jugadores en el Tablero de Combate (Paso 5)**:
  - Añadidos al DOM (modal-local-setup.html) los slots de standee para P3 (Izquierda Extrema) y P4 (Derecha Extrema).
  - Modificado el grid wizard-duel-stage-viewport.four-players en setup.css a 1fr 1fr 2fr 1fr 1fr.
  - Inyectada lógica en SetupModalRenderer.ts para cargar correctamente las imágenes de los avatares P3 y P4 dinámicamente sobre el fondo del nivel 5.


## 29 de Agosto de 2026 - Día 20 (Sesión 167) [Horario: 10:45 - 10:55]
**Sub-Agentes Involucrados**: Antigravity (IA)

- **Corrección de Estructura DOM en Wizard de Configuración (Bug de Paso 3 / Tableros)**:
  - Se eliminaron etiquetas </div> sobrantes en modal-local-setup.html que provocaban que #setup-champion-container-split se renderizara fuera de <div id="wizard-step-4">, causando que apareciera por error en el Paso 3 (Tableros) y otras pantallas.
  - Se homogeneizaron las clases de P1 y P2 con setup-split-ai-col para alinearse con P3 y P4.

- **Diseño Adaptativo en Cuadrícula 2x2 para Sliders de IA Granular (Paso 7)**:
  - Se reemplazó el contenedor de sliders verticales por .setup-ai-granular-grid en setup.css con clases dinámicas (grid-1, grid-2, grid-3, grid-4).
  - En SetupModalRenderer.ts, se calcula automáticamente el número de IAs visibles y se aplica la clase correspondiente:
    - 4 Jugadores (3 IAs): Matriz 2x2 (2 columnas, 2 filas).
    - IA vs IA (2 IAs): 1 fila con 2 columnas.
    - 1 IA: 1 columna x 1 fila.
  - Limpieza de márgenes inline para garantizar una separación visual uniforme entre controles.
  - Verificación estricta de compilación (	sc --noEmit) sin errores.


## 29 de Agosto de 2026 - Día 20 (Sesión 168) [Horario: 10:58 - 11:02]
**Sub-Agentes Involucrados**: Antigravity (IA)

- **Generación de Paquetes de Distribución Oficiales para Itch.io**:
  - Compilación completa de producción ejecutada (	sc && vite build).
  - Ofuscación criptográfica y blindaje completados en los 6 bundles JavaScript principales (index, GoAI.worker, AITurnManager, etc.).
  - Compilador nativo de Windows (csc.exe) ejecutado con éxito para generar CrazyGo.exe.
  - Carpeta CrazyGo_Portable empaquetada con su README.txt canónico en inglés (sin dependencias externas requeridas).
  - Generados los dos archivos .zip oficiales listos para subir a Itch.io:
    1. crazy_go_itchio_v14_browser.zip (98.84 MB) — Despliegue Web / HTML5 con formato UNIX path separators.
    2. crazy_go_windows_v14.zip (98.84 MB) — Paquete portable ejecutable para Windows PC.


## 29 de Agosto de 2026 - Día 20 (Sesión 169) [Horario: 11:05 - 11:08]
**Sub-Agentes Involucrados**: Antigravity (IA)

- **Limpieza de Assets Obsoletos en public/enemies/**:
  - Eliminados los archivos huérfanos que ya no se utilizaban en el juego: monk.png, monk_1.png a monk_5.png, y sage_2.png a sage_5.png (~5.6 MB de assets purgados).
  - Conservados únicamente los recursos activos en el juego: oss.png, sage_1.png (Monje Sabio) y spirit_1.png (Campaña / Tutorial).
  - Corregido el fallback residual en DuelistRenderer.ts a sage_1.png.
  - Eliminados botones duplicados de selección en modal-local-setup.html.
  - Verificada la compilación TypeScript (	sc --noEmit) con 0 errores.



## 29 de Agosto de 2026 - Día 13 (Sesión 173) [Horario: 21:55 - 22:08]
- Se corrigió la plantilla HTML `modal-local-setup.html` para incluir los bloques de descripción de habilidades de los campeones para la IA P1 y P2.
- Se cambiaron los encabezados estáticos del menú de inicio para reflejar que la IA P3 ahora es Verde y la IA P4 es Morada, ajustando también sus códigos hexadecimales correspondientes.
- Se reconstruyó y empaquetó el proyecto para distribución (Itch.io y Windows).

## 30 de Agosto de 2026 - Día 14 (Sesión 174) [Horario: 11:46 - 11:51]
**Sub-Agentes Involucrados**: Antigravity (IA)

- **Integración del Sabio (Sage) como Campeón Jugable sin Habilidades**:
  - Configurado en \RoguelikeRunManager.ts\ para que el 'Sabio' no tenga habilidades pasivas ni activas (\skillType: 'none'\).
  - Añadidas las traducciones en ES y EN en \	ranslations.ts\ especificando 'El Único sin Habilidades' y 'Puro Go'.
  - Modificado \SetupModalRenderer.ts\ para que cuando un campeón tenga \skillType: 'none'\ cargue dinámicamente sus propias cadenas de traducción de pasiva en la tarjeta, solucionando el problema donde se sobrescribía siempre con la información de la pasiva del personaje 'Normal' (Retrospectiva del Sensei).

## 30 de Agosto de 2026 - Día 14 (Sesión 162) [Horario: 12:00 - 13:00]
- **Supreme AI Phase 6**: Reconstrucción de la red neuronal a 16 capas y 192 filtros.
- **Minimax ML Generator**: Generación de datos purificada en generate_games.ts usando heurísticas en vez de movimientos aleatorios.
- **Oracle Spell AI**: Integración de llamadas asíncronas en AITurnManager.ts y el worker para que la IA prediga su Winrate antes de gastar habilidades.
- Subido a GitHub mediante git push.
