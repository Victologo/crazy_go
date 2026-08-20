# Estado Activo (Active Context)

## Version Actual: Fase 57 - Fichas Especiales Indivisibles y Refinado del Sistema de Tiempo Byo-Yomi (20 Agosto 2026)

**Hitos Recientes:**

### Sesión Actual (Sesión 109)
- **Fichas Especiales Indivisibles con Destrucción y Transmutación en Bloque (`RulesEngine.ts`, `TenguChampion.ts`, `RyujinChampion.ts`, `AlchemistChampion.ts`, `RoninChampion.ts`, `BossManager.ts`, `RogueliteManager.ts`, `AITurnManager.ts`, `GameController.ts`)**:
  - Nuevos métodos centrales `RulesEngine.destroyStoneAndPolyGroup()` y `RulesEngine.transmuteStoneAndPolyGroup()`.
  - Si cualquier habilidad activa o pasiva (Lluvia Meteórica de Tengu, Furia del Dragón de Ryūjin, Aliento Calcinante del Dragón Jefe, Tajo del Ronin, Inversión Cromática del Alquimista o Pergaminos de Hechizo) alcanza **cualquier casilla** de una ficha poliminó multi-casilla (Duplicidad 2x1, Monolito 2x2), **la pieza entera se destruye o transmuta como un único bloque físico indivisible**.
  - Efectos visuales de impacto y sonido disparados sobre todas las casillas del bloque.
- **Refinado Integral del Sistema de Tiempo (Byo-Yomi) para Partidas Locales (`TimeManager.ts`, `SetupModalRenderer.ts`, `SetupEventBinder.ts`, `modal-local-setup.html`, `SoundFX.ts`, `hud.css`, `HUDController.ts`, `types/index.ts`)**:
  - Soporte para 4 modos de reloj de Go en el Wizard de Partida Local:
    1. **⚡ Por Jugada (Byo-yomi puro)**: Presets de 5s, 10s, 15s, 20s, 30s, 45s, 60s + campo numérico personalizado en segundos.
    2. **🏯 Byo-yomi Japonés**: Tiempo principal de banco (ej. 5 min) + N periodos Byo-yomi de X segundos (ej. 3×30s). Mover a tiempo reinicia el reloj del periodo sin consumirlo; solo agotar el periodo consume 1 periodo de Byo-yomi.
    3. **⏱️ Reloj Fischer**: Tiempo base (ej. 3 min) + incremento de N segundos por jugada (ej. +5s).
    4. **⏳ Tiempo Absoluto**: Banco total (1m, 3m, 5m, 10m, 15m, 30m) + campo numérico personalizado.
  - **Efecto Sonoro de Cuenta Atrás Tensa**: `SoundFX.playClockTick()` en los últimos 5 segundos del turno.
  - **Estado Visual Urgente**: Clase `.timer-urgent` con pulsación rápida y resplandor rojo intenso en el HUD cuando restan $\le 5$ segundos.
  - Sincronización precisa en `GameController.ts` al colocar piedras o pasar turno.
- **Alquimista Limitado y Balanceado (Inversión Cromática)**:
  - Límite estricto de **1 uso por turno** máximo.
  - La cantidad total de usos por partida escala con el tamaño del tablero (9x9: 1 uso, 13x13: 2 usos, 19x19: 4 usos).
  - La habilidad finaliza inmediatamente tras invertir 1 piedra y pasa el turno. Se actualizó la descripción para dejarlo claro tanto en español como en inglés.
- **Escalado y Optimización Visual de Interfaz y Tablero (`board.css`, `champions.css`, `GameController.ts`)**:
  - **Silueta del Jugador Principal (Izquierda)**: Escalada un +30% uniformemente (figura y placa de nombre) para equilibrar visualmente con el rival y dar mayor protagonismo al héroe.
  - **Reducción General del Goban**: Tablero escalado al 96% de su tamaño anterior para evitar superposiciones con la cinta inferior de hechizos.
  - **Reducción Específica para 4 Jugadores**: El Goban ahora es un 15% más pequeño dinámicamente (`data-player-count="4"`) en las partidas de 4 jugadores (81% de escala) para garantizar máxima visibilidad del HUD de 4 contrincantes.
### Sesión Anterior (Sesión 108)
- **Eliminación Total de Recompensas de Komi y Reestructuración Roguelike (`RoguelikeController.ts`, `RoguelikeMapGenerator.ts`, `RoguelikeMapRenderer.ts`, `GameController.ts`)**:
  - Eliminados todos los bonos de Komi en el mapa, santuarios, descanso/meditación y rescates de rehenes.
  - **Santuario Místico**: Añadida la opción de *Pacto Espiritual* (permite elegir y tomar prestado cualquier campeón con su habilidad activa para el siguiente combate de Go), además de la bendición de cargas de habilidad y pergaminos/poliminós sagrados.
  - **Zona de Meditación / Descanso**: Reemplazado el Komi por opciones ricas de *Estudio Arcano* (+1 Pergamino de Meteorito y +1 Inversión Yin-Yang) y *Forja Táctica* (+1 Monolito 2x2 y +1 Dominó 2x1).
  - **Rescate de Rehenes en Combate**: Rescatar al Monje otorga +1 Carga de Habilidad y +1 Escudo Divino; liberar al Espíritu Guardián otorga +1 Ficha Monolito 2x2 y +1 Inversión Yin-Yang.
- **Precisión Milimétrica del Tajo de Ronin (`vfx.css`, `RoninVFX.ts`)**:
  - Añadido `transform-origin: center; transform-box: fill-box;` en animaciones SVG y retícula de corte cyan en cruz `(coord.x, coord.y)` para evitar cualquier desviación visual al ejecutar el Tajo del Samurai.
- **Rediseño Visual de Piedras Especiales y Poliminós Unificados + Tooltip Interactivo (`SVGRenderer.ts`, `RulesEngine.ts`, `GraphBoard.ts`, `types/index.ts`)**:
  - **Duplicidad (2x1)**: Renderizado como una cápsula continua unificada con borde cyan `#38bdf8`, relieve biselado y runa central `🀄`.
  - **Monolito (2x2)**: Renderizado como una losa titánica cuadrangular unificada con borde ámbar/dorado `#f59e0b`, textura de piedra ancestral y runa central `🧱`.
  - **Germinante (1x1)**: Icono de brote vivo `🌿` con resplandor esmeralda.
  - **Tooltips Contextuales al Pasar el Cursor**: Hover sobre cualquier piedra colocada en el Goban (Germinante, Duplicidad, Monolito, Escudo Divino) muestra una descripción emergente clara de sus efectos tácticos.
- **IA y Animación Cinemática del Jefe Final (Gran Dragón Sabio Gris) + Placa de Habilidad del Rival (`AITurnManager.ts`, `DuelistRenderer.ts`, `index.html`, `champions.css`)**:
  - Integrado `BossManager.checkAIBossTrigger()` en `AITurnManager.ts` para que el Dragón Jefe ejecute su Aliento Calcinante del 25% del tablero con sacudida de pantalla, cinemática `BossVFX.triggerGreyDragonBreath()` y aviso visual.
  - Refinados los efectos de la IA para Kitsune (`triggerDivineShieldAura`) y Alquimista (`triggerTransmuteSlash`).
  - Placa de habilidad única del rival (`#duel-enemy-skill-badge`) en el HUD que describe los poderes del contrincante.
  - Orientación e imagen del Dragón Jefe espejada (`scaleX(-1)`) mirando directamente hacia el Goban y el jugador.
- **Biblia Maestra de Prompts de Arte (`docs/ai_wiki/game_design/art_prompts_bible.md`)**:
  - Documento formal y exhaustivo con los prompts exactos, reglas estilísticas Sumi-e/anime, transparencia alfa, dimensiones y paletas para campeones, monjes, sabios, jefes, fondos e iconos.

### Sesión Anterior (Sesión 107)
- **Rotación Táctica y Atajo 'R' para Duplicidad (`SoundFX.ts`, `PolyominoManager.ts`, `InteractionManager.ts`, `GameController.ts`, `KeyboardController.ts`, `TutorialManager.ts`, `TutorialSteps.ts`)**:
  - Nuevo efecto de sonido `SoundFX.playRotate()` con barrido mineral/madera suave y nítido para la rotación táctica de poliminós.
  - Al pulsar 'R', si la ficha Duplicidad (Dominó 2x1) no estaba seleccionada pero el jugador dispone de cargas, se activa automáticamente y se alterna su orientación (horizontal ⇄ vertical).
  - Alerta informativa con orientación y sonido de error claro si no quedan cargas disponibles.
  - Actualización inmediata del hover ghost (`refreshCurrentHoverGhost()`) sin destruir el DOM del SVG.
  - **Soporte y Validación Completa en el Tutorial (Lección 8 - Fichas Poliminó)**: Sincronización explícita de `playerInventories`, preservación de `this.orientation` en `syncCardsWithInventory`, inicio de la lección 8 paso 8 en orientación vertical para que la pulsación de `[R]` gire a horizontal [⇄], y validación estricta con feedback de Sensei si se intenta colocar sin rotar.
- **Algoritmo Dinámico de Escalado y Optimización de Espacio del Goban (`SVGRenderer.ts`, `board.css`, `tutorial.css`, `GraphBoard.ts`, `BoardGenerators.ts`)**:
  - Elevación vertical global de **22 px hacia arriba** (`transform: translateY(-22px)`) en todo tipo de gobans para centrado zenital perfecto y holgura ergonómica respecto a la barra inferior de hechizos.
  - Escalado base expandido a `scale(1.06)` y límites de `#board-container` optimizados a `max-width: min(calc((100vh - 135px) * 2.2), clamp(380px, 66vw, 1080px))` y `max-height: min(calc(100vh - 135px), clamp(380px, 60vw, 840px))`.
  - Rediseño del padding de madera y `viewBox` compacto en `SVGRenderer.ts` (`padding = stoneRadius * 1.08`, `safetyMargin = padding + 4`): topologías anchas/duales como **`islands_v1`** crecen un **+35%** en área al aprovechar todo el espacio horizontal entre standees, y topologías picudas como **`triangle`** crecen entre un **+15% y +20%** eliminando márgenes de padding sobrantes.
- **Localización Completa y Compactación del HUD de Turno (`translations.ts`, `HUDController.ts`, `layout.css`, `modal-options.html`)**:
  - Traducción de las claves `"hud.player_green": "Esmeralda"` / `"Emerald"` y `"hud.player_purple": "Amatista"` / `"Amethyst"`.
  - Traducción de las etiquetas del modal de opciones (`options.fps_limit`, `options.fps_desc`, `options.particles`, `options.particles_desc`, `options.dev_mode`, `options.dev_mode_desc`).
  - Auditoría y paridad del 100% entre español e inglés (413/413 claves sincronizadas).
  - Traducción dinámica del badge de IA `🤖 Pensando...` / `🤖 Thinking...`.
  - Compactación del texto de rol: `Negras (Tú)` / `Blancas (IA)` / `Esmeralda (IA)` / `Amatista (IA)`.
  - Estilos CSS `white-space: nowrap` y `gap: 0.45rem` en `.hud-player-pill` para evitar saltos de línea desordenados en el HUD superior.
- **Standee Rival Frontal en Modo 4 Jugadores (`champions.css`, `DuelistRenderer.ts`)**:
  - Cuando es el turno de P1 (nuestro turno), el combatiente frontal (P2) se posiciona al frente pero con un escalado 10% menor (`scale(1.12)`), con una máscara gris suave del 50% de los de atrás (`grayscale(20%) brightness(0.82)`) y sin desenfoque (`blur(0)`).
  - Cuando un rival entra en su propio turno activo, pasa a escala completa (`scale(1.24)`), brillo 1.2, drop-shadow y placa dorada activa.
- **Animación Cinemática de Desvanecimiento para Piedras Muertas (`board.css`, `SVGRenderer.ts`)**:
  - Animación CSS `@keyframes deadStoneFade` (de opacidad 1.0 a 0.30 con curva suave de 1.2s) para piedras capturadas en territorio enemigo durante el conteo final de puntuación.
  - Animación `@keyframes deadCrossFadeIn` para que la cruz roja `✕` emerja progresivamente a medida que la piedra se desvanece.

### Sesión Anterior (Sesión 106)
- **Mejora del Motor de Detección de Piedras Muertas + Detección de Seki (`TerritoryScorer.ts`, `SVGRenderer.ts`)**:
  - **Fix 1 — Umbral de salida anticipada eliminado:** Se eliminó `chain.liberties.size >= 5 || chain.nodes.size >= 8` que marcaba como vivas cadenas con libertades dentro de un recinto enemigo.
  - **Fix 2 — Radio BFS de influencia 4 → 6:** Cubre mejor cercos grandes en tableros 19x19.
  - **Fix 3 — Primera pasada de Recinto Cerrado (NUEVO):** `detectDeadStonesViaEnclosure()` identifica cadenas rivales con TODAS sus libertades dentro de un recinto 100% enemigo. Si no tienen 2 ojos → muertas incondicionalmente.
  - **Fix 4 — SEKI DETECTION (NUEVO):** `detectAndResolveSeki()` — 3ª pasada del pipeline. Implementa detección canónica de Seki (vida mutua) en 3 capas:
    1. **Seki Directo:** Dos cadenas rivales con TODAS sus libertades compartidas → Seki inmediato.
    2. **Seki con ojos insuficientes:** Ambas cadenas tienen <2 ojos privados independientes del espacio compartido.
    3. **Rescate de cadenas mal marcadas:** Cadenas marcadas muertas en pasada anterior que en realidad están en Seki con su "asesino".
  - **Fix 5 — Render visual de Seki (`SVGRenderer.ts`):** `renderSekiOverlay()` dibuja triángulos morados semitransparentes con letra "S" sobre los nodos en Seki. Los nodos Seki no cuentan como territorio (dame bajo reglas japonesas).
  - **`ScoreReport`:** Nuevo campo `sekiMap: Set<string>` en `TerritoryScorer.ts` y `types/index.ts`.
  - **4 Jugadores:** El algoritmo de Seki funciona con cualquier combinación de PlayerId (1,2,3,4).
  - **Veredicto vs industria:** Nuestro pipeline (Recinto + Benson + Influencia + Seki) cubre los mismos casos que `goscorer` (librería oficial del creador de KataGo). Funciona además en topologías no euclidianas.

### Sesión Anterior (Sesión 105)
- **Conteo de Dobles Ojos y Teorema de Benson Canónico en Reglas Japonesas (`TerritoryScorer.ts` y `GraphBoard.ts`)**:
  - **Problema Anterior:** En el conteo de final de partida con reglas japonesas, si un jugador rival tiraba una piedra suicida en una de las cavidades de un ojo ajeno (o si la cavidad superaba un límite artificial de 8 casillas), el evaluador descartaba la cavidad como "contaminada" y no contaba el ojo. Esto provocaba que grupos incondicionalmente vivos con 2 o más ojos fueran juzgados falsamente como muertos en tableros asimétricos o con invasiones tardías.
  - **Solución Canónica (Doble Pase de Benson y Cavidades Puras):**
    1. **Certificación Benson:** Integrado el algoritmo canónico del Teorema de Benson (1976) en grafos para certificar incondicionalmente grupos inmortales con $\ge 2$ ojos independientes antes de cualquier evaluación de influencia.
    2. **Filtrado de Invasiones Muertas en Cavidades:** Las piedras rivales asfixiadas con $\le 2$ libertades dentro de una cavidad aliada se identifican como muertas y no invalidan la salud del ojo.
    3. **Cavidades de Ojo Sin Límite Arbitrario:** Se eliminó el límite de 8 casillas, permitiendo que grandes cámaras territoriales selladas actúen como ojos legítimos.
    4. **Detección de Falsos Ojos:** Para ojos de 1 casilla se verifica el control diagonal/esquinas con `isTrueEye`.
- **Motor de IA Topológico Universal "Todo-Terreno" (`GoAI.ts`)**:
  - **Problema Anterior:** Las funciones de análisis táctico como `calculateInfluenceField` (campo Moyo de KataGo), `countDistance2Neighbors` (Kosumi, Ikken-Tobi, Keima) e `isTigersMouth` asumían una cuadrícula euclidiana 2D `(x, y)` estándar con offsets fijos `[1,1]`, `[2,0]`, etc. En tableros **Hexagonales, Triangulares, Estrellas de 5/6 puntas, Anillos, Geodas, Espirales, Islas o Relojes de Arena**, esto provocaba fugas de influencia a través de vacíos/abismos y fallaba al reconocer formas canónicas en nodos no cartesianos.
  - **Reingeniería Topológica Pura (100% Graph-Based):**
    1. **Propagación BFS de Influencia:** `calculateInfluenceField` ahora propaga la influencia territorial paso a paso a lo largo de las aristas reales del grafo (camino topológico más corto), impidiendo que la influencia salte sobre agujeros, barrancos o islas aisladas.
    2. **Formas Canónicas Topológicas Universales:**
       - *Kosumi (Diagonal):* Nodos aliados a distancia 2 que comparten $\ge 2$ vecinos mutuos en el grafo.
       - *Ikken-Tobi (Salto de 1 espacio):* Nodos aliados a distancia 2 conectados por exactamente 1 nodo intermedio libre.
       - *Keima (Paso de Caballo):* Extensión angular a distancia 3 a través de caminos libres.
       - *Boca de Tigre:* Conexión de 2 piedras aliadas con profundidad topológica $\ge 2$ o defensa de contacto enemigo.
    3. **Compatibilidad Universal:** Funciona con máxima precisión y elegancia en todas las 14+ topologías de Crazy Go (`square`, `triangle`, `hex`, `eroded`, `islands_v1/v2`, `cross`, `hourglass`, `geode`, `spiral`, `rings`, `star_5`, `star_6`, `procedural`).
- **Fix Crítico: Apertura en Tableros Asimétricos y Corrección de Jugadas en Esquinas Muertas (`GoAI.ts`)**:
  - **Problema Anterior:** En topologías no euclidianas o asimétricas (como el Reloj de Arena, Geoda, Islas o mapas erosionados), la IA usaba fórmulas cartesianas fijas de Go tradicional (`dCol === 3 && dRow === 3`, Komoku, Sansan) basadas en el rectángulo contenedor (`maxCol, maxRow`). Esto hacía que nodos situados en esquinas estrechas, puntas muertas o escalones de borde con solo 2 o 3 libertades recibieran falsamente una bonificación masiva de apertura (+850 pts) considerándolos "esquinas 3-3 o 4-4", provocando que la IA regalara piedras en esquinas asfixiadas en lugar de disputar el centro o los cuellos de botella.
  - **Solución Topológica Canónica:**
    1. Detección de Tableros Estándar vs Asimétricos (`isStandardSquareBoard`): Si el tablero no es un cuadrado continuo 9x9/13x13/19x19, se apaga el libro de aperturas cartesiano.
    2. Profundidad Topológica Real (`getTopologicalDepth`): Calcula la distancia real en el grafo al borde/vacío más cercano. Las esquinas y escalones muertos con $\le 2$ vecinos o adyacentes al borde reciben una penalización estricta de $-850$ puntos en apertura.
    3. Motor de Apertura Asimétrica: Bonifica fuertemente nodos centrales de alta conectividad (grado 4 con amplio espacio radial abierto), cuellos de botella/puentes estratégicos (como el cuello del Reloj de Arena) y corazones de cada cámara.
- **Fix Crítico: AI Braindead y Conteo de Territorio (TerritoryScorer.ts)**:
  - **Problema Anterior:** El algoritmo de detección de piedras muertas usaba un umbral de tamaño topológico estricto (`isGenuinelyEnclosed <= 22%`), lo que provocaba que grandes territorios (ej. 30% del tablero) no se consideraran "recintos". Si la IA tiraba una piedra en un territorio enemigo grande, esta piedra no se marcaba como muerta, destruyendo masivamente la puntuación de territorio del rival. Como consecuencia, la IA evaluaba falsamente que suicidarse en territorio enemigo daba puntos netos enormes, y viceversa, llevando a la IA a jugar piedras inútiles por todas partes ("braindead behavior"). Además, piedras genuinamente muertas en el final de la partida se contaban como vivas, arruinando la puntuación final.
  - **Solución Definitiva (Detección por Influencia Local):** Se reemplazó completamente el sistema de recintos topológicos con un motor de influencia térmica (distancia máxima 4). Ahora, las piedras muertas se detectan matemáticamente si la influencia enemiga sobre ellas supera el 180% de su propia influencia estructural (y no forman 2 ojos, ni tienen libertades/tamaño grandes).
  - **Efecto:** La IA ahora comprende perfectamente que lanzar piedras suicidas en un Moyo o territorio enemigo consolidado no reduce los puntos rivales. Su evaluación es correcta, lo que la lleva a jugar con cordura, pasar turno a tiempo, y el conteo final de puntos retira las piedras muertas (o invasiones fallidas) con absoluta precisión.
- **Conteo Canónico de Territorio y Detección de Piedras Muertas (`TerritoryScorer.ts` y `SVGRenderer.ts`)**:
  - **Causa Raíz del Fallo en Itch.io:** La utilidad de Windows `.NET ZipFile` usaba barras invertidas (`assets\index.css`). En los servidores Linux de Itch.io, la barra invertida no se interpreta como separador de directorio sino como parte del nombre del archivo, provocando que `assets/` no existiera (error 404) y el juego se viera en texto plano sin estilos ni JS.
  - **Solución Definitiva:** Se integró `archiver` con compresión `ZipArchive` nativa que fuerza rutas estándar POSIX/UNIX con barras inclinadas (`assets/index.css`), garantizando que Itch.io descomprima todas las carpetas y archivos correctamente en la raíz.
  - **Validación:** Probado y confirmado en producción en Itch.io con 100% de estilos, JS y assets cargados sin errores.
  - Se generan únicamente 2 paquetes oficiales por versión:
    - `crazy_go_itchio_v12_browser.zip` (37.86 MB): para jugar en navegador en Itch.io.
    - `crazy_go_windows_v12.zip` (37.86 MB): ejecutable portable para Windows con `CrazyGo.exe`.
- **Komi Escalonado e Individual en Modo 4 Jugadores (P2: 2.5, P3: 4.5, P4: 6.5)**:
  - En el Asistente de Partida Local (Paso 7 - Ajustes), al seleccionar 4 Jugadores, la sección de Komi se desglosa automáticamente en tres filas configurables con valores predeterminados canónicos:
    - ⚪ **Blancas (P2 • 2º Turno)**: `2.5 pts` (presets 0.5, 1.5, 2.5, 3.5 + valor libre)
    - 🟢 **Esmeralda (P3 • 3º Turno)**: `4.5 pts` (presets 2.5, 3.5, 4.5, 5.5 + valor libre)
    - 🟣 **Amatista (P4 • 4º Turno)**: `6.5 pts` (presets 4.5, 5.5, 6.5, 7.5 + valor libre)
  - En modo 2 Jugadores se mantiene la compensación tradicional única para Blancas (⚪ `6.5 pts`).
  - Sincronización completa con `GameState.playerKomis`, `TerritoryScorer.calculateScore` y visualización en tiempo real en las píldoras de captura del HUD superior in-game (`(+2.5)`, `(+4.5)`, `(+6.5)`) y en el desglose del modal de puntuación final (`ScoreModalRenderer`).
- **Anuncio Cinematográfico de Komi Garantizado en Partida Local (2P y 4P)**:
  - Corregido el condicional restrictivo `playerCount === 2` en `GameController.initGame()` que impedía que el splash/anuncio de inicio de combate apareciera en partidas de 4 jugadores y en modos locales.
  - Diseñado un layout multijugador para el overlay cinemático (`.rogue-komi-4p-row`) que muestra las 3 compensaciones simultáneamente con iconos y etiquetas bilingües.
- **Fix Definitivo Alquimista — `advanceTurn()` en lugar de `passTurn()`**: Se identificó la causa raíz del bug persistente del Alquimista: al terminar la habilidad, `ChampionManager.executeTargetedSkill()` llamaba a `state.passTurn()`, que incrementa `consecutivePasses` a 1. Aunque se reseteaba manualmente justo después (`consecutivePasses = 0`), ese flag de 1 era leído por `GoAI.getBestMove()` en la variable `opponentJustPassed = state.consecutivePasses >= 1`, haciendo que la IA pasara su turno en tableros maduros o con ventaja (Komi de Blancas). **Solución definitiva**: reemplazar `state.passTurn()` + reset manual con `state.advanceTurn()`, que avanza el turno correctamente sin tocar `consecutivePasses`. Archivo modificado: `src/core/ChampionManager.ts` (bloque `isFinished` del Alquimista).
- **Corrección de Orientación del Alquimista y Campeones hacia el Goban**:
  - En la ilustración original (`alchemist.png`), el Alquimista mira de forma natural hacia la **derecha**. Se homogeneizó para que use `scaleX(1)` en el lado izquierdo y `scaleX(-1)` en el rival para mirar siempre hacia el centro del Goban.
- **Ajuste Fino de Escala y Blur en Combate 4P**:
  - **Combatiente Activo al Frente (`pos-front`)**: Aumentado un 30% adicional (`scale(1.24) translateY(-15px)`).
  - **Combatientes en Espera Atrás (`pos-back-right` y `pos-back-left`)**: Aumentados un 10% adicional (`scale(0.80) translateY(10px)`) con 1px de blur suave.

### Sesión Anterior (Sesión 104)
- **Persona Normal con 2 Rebobinares Universales**: Si se elige al campeón Persona Normal, ahora dispone de 2 cartas tácticas de Rebobinar (⏳) en cualquier modo de juego (Online P2P, Local 1v1, 1vIA, 4 Jugadores, Sandbox). En modo Roguelike, se mantiene la escala por dificultad (Fácil 4, Media 2, Difícil 1, Extrema 0). Se actualizaron las descripciones y fórmulas de combate en `translations.ts` (ES y EN), y se habilitó la visibilidad del dock de pergaminos en `HUDController.ts` siempre que existan cargas disponibles.
- **Efecto de Sonido "Bong" de Pase de Turno**: Se re-sintetizó `SoundFX.playPass()` con Web Audio API para emitir un auténtico golpe suave de mazo y resonancia de campana zen / gong budista tradicional ("Bong" en Sol / 196Hz con armónicos ricos de 0.85s de decaimiento). Se corrigieron `GameController.handlePass` y `GameController.checkAITurn` para que al pasar turno (humano o IA) nunca suene a impacto de piedra (`playPlaceStone`).
- **Fix Alquimista & Pase Prematuro de IA (Fix Parcial previo)**: Se detectó y eliminó una guarda al inicio de `GoAI.getBestMove()` que forzaba a la IA a pasar turno de inmediato si `state.consecutivePasses >= 1` y `currentNetLead >= 0`. Se blindó la lógica para que la IA **siempre coloque su ficha real en el Goban** salvo que el tablero esté maduro (`isBoardMatured`).
- **Sincronización Online de Rebobinar**: `GameController.selectSpell` ahora dispara `onOnlineUndoCallback()` al usar Rebobinar en red, y `handleRemoteUndo` retrocede el número correspondiente de movimientos sincronizados.
- **Localización Completa del Paso 6 (Oponente) y Wizard Setup**: Se tradujeron todas las etiquetas fijas y dinámicas de la sección de oponentes en el asistente de partida local (`wizard.q_opponent`, `wizard.opponent_type`, badges de rivales, nombres de monjes/sabios y botones).
- **Fix de Contención del Footer Modal**: Se corrigieron tags de cierre `</div>` duplicados en `modal-local-setup.html` que provocaban que los botones de navegación del footer ("Atrás" / "Siguiente") se renderizaran fuera del contenedor modal y quedaran visibles en la pantalla de inicio al cerrar el modal.

### Sesión Anterior (Sesión 103)
- **Fix Menú de Cinta (Lección 8)**: Se corrigió la lógica de selección de hechizos y fichas poliminó para que el teclado (hotkeys 1, 2, 5, 6, 7, Z, X, V) y los botones del UI invoquen directamente a `GameController`, validando correctamente los pasos de la lección con las guardas del `TutorialManager`. Se refactorizaron `GameEventBinder.ts` y `KeyboardController.ts` descartando falsos IDs estáticos o llamadas que bypassaban la progresión.
- **Fix Cuelgue IA Modo Historia (Acto 2)**: Se identificó y resolvió un "Ghost Node Loop" crítico en topologías asimétricas (`eroded` / Acto 2) con campeones como el Alquimista. El Web Worker de la IA generaba un tablero erosionado con semilla aleatoria (distinto al hilo principal), ocasionando que calculara coordenadas que no existían visualmente. Al intentar jugarlas, el renderizador fallaba silenciosamente, y la IA entraba en un bucle infinito cada 1.2 segundos sin avanzar el turno. Se solucionó centralizando la semilla en `GameController` y enviándola al Worker para generar topologías simétricas idénticas (1:1).
- **Tengu Escalado:** La imagen de Tengu se agrandó un 25% para no verse pequeña y se permitió solapamiento de alas eliminando `object-position`.
- **Kitsune Animación Doble:** Solucionado el bug que hacía parpadear o repetir la rotura de escudo. Se movió el VFX a un `setTimeout` post-render y se filtraron nodos duplicados con un `Set`.
- **Renderizado del Wizard:** Se añadió el fondo degradado de madera, `padding` y `border-radius` a `.wizard-stage-board-svg` y `.wizard-board-preview-svg` para que el tablero se renderice bien y no muestre líneas al vacío.
- **Aleatoriedad de Himiko:** Cambiado el motor de Fisher-Yates a `window.crypto.getRandomValues()` en la Lluvia Pétrea para asegurar entropía pura de selección, y explicado al usuario que estadísticamente la mayoría de nodos residen en el perímetro en topologías 19x19.

### Fix Multijugador Online y Wizard del Host (Sesión 101)
- **Problema Principal**: No funcionaba la navegación entre pasos del wizard al crear una partida online (el host no podía cambiar de fase/paso ni seleccionar opciones, y el botón de iniciar partida no aparecía).
- **Causa Raíz**: 
  - `OnlineModalRenderer.setOnlineWizardStep` usaba una clase inexistente `.online-wizard-step` para alternar paneles, provocando que visualmente el wizard se quedara atascado en el paso 1.
  - El botón "Comenzar Partida" tenía el ID `btn-online-force-start` en HTML, pero se buscaba como `btn-online-modal-start` en TypeScript.
- **Solución**:
  - Se reescribió `setOnlineWizardStep` iterando del paso 1 al 5 y alternando la clase `hidden`/`active` en los contenedores `#online-host-step-${i}`.
  - Se corrigió la consulta del ID del botón de inicio de partida para que coincida con `btn-online-force-start`.
- **Registro y Notas de Versión**: Se añadió un separador explícito en `docs/ai_wiki/log_crazy_go.md` para indicar que los cambios anteriores a este punto constituyen la versión v10 publicada en Itch.io. Las actualizaciones futuras formarán la versión v11.

### Fix Alquimista (Sesión Anterior)

### Wizard Match Setup Reestructurado (Sesión Actual)
- Wizard ampliado de 6 a **7 pasos**: Players → Mode → Board → Campeón → Escenario → **Oponente (NUEVO)** → Ajustes.
- **Paso 3 (Tablero)**: Preview con fondo "espacio vacío" (blanco + cuadrícula gris sutil) en lugar de un escenario real. Clase CSS `wizard-board-no-scenery`.
- **Paso 5 (Escenario)**: Solo selector de fondos. El rival siempre es misterioso aquí.
- **Paso 6 (Oponente, NUEVO)**: Stage completo (personaje + tablero + rival). Selector de rival con opciones de Monje (5 aleatorios) y Sabio (5 aleatorios), además de campeones específicos.
- Tipos ampliados: `enemyHeroId` ahora acepta `'random_monk' | 'random_sage'`.
- Al iniciar partida (`GameController.initGame`), `random_monk` y `random_sage` se resuelven a un personaje concreto (imagen, nombre, icono) y se pasan al HUD.
- `DuelistRenderer` y `HUDController` extienden sus firmas para aceptar `rivalImage?/rivalName?/rivalIcon?`.

**Estado Técnico:**
- TypeScript Compiler (tsc --noEmit): **0 errores**
- Todos los cambios de wizard son retrocompatibles con multiplayer y roguelike.

**Archivos Modificados Esta Sesión:**
- `src/ui/templates/modal-local-setup.html` - Wizard 7 pasos, paso 6 NUEVO, paso 3 sin fondo
- `src/styles/modals/setup.css` - Clase `.wizard-board-no-scenery`
- `src/ui/modals/SetupModalRenderer.ts` - 7 pasos, random_monk/sage, updateRivalStage6(), renderSetupPreviews() ampliado
- `src/events/SetupEventBinder.ts` - Importa SetupModalRenderer, listeners para rivales actualizan stage 6
- `src/types/index.ts` - `enemyHeroId` acepta `random_monk | random_sage`
- `src/controllers/GameController.ts` - Resuelve random_monk/sage a personaje concreto + pasa al HUD
- `src/ui/HUDController.ts` - Firma extendida con rivalImage/Name/Icon
- `src/ui/DuelistRenderer.ts` - Firma extendida, usa rivalImage si se provee
- `src/core/ChampionManager.ts` - Fix alquimista: onTurnAdvanced(nextPlayer), isActiveSkillAvailable
- `src/core/GameState.ts` - Pasa nextPlayer a onTurnAdvanced()
- `src/core/champions/AlchemistChampion.ts` - Eliminado passTurn() interno

**Mapa de Navegación:**
- Consultar `docs/ai_wiki/codebase_map.md` para la arquitectura completa.
