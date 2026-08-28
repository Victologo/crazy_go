# Estado Activo (Active Context)

## Version Actual: Fase 105 - 290. [x] **Selector Maestro y Granular de Dificultad (30k a 9d)** (Completado)
291. [x] **Modo Espectador / Arena IA vs IA** (Completado)
292. [x] **Traducción Etiquetas Asistente Local** (Completado)
293. [x] **Integración de Menú Social/Amigos** (Completado)
294. [ ] **Recolección final de modelos (.onnx)** (Pendiente) para IA Local y Online (28 Agosto 2026)

**Hitos Recientes:**

### Sesión Actual (Sesión 154 — Modo Espectador, Red Social y Explicación de Red Neuronal)
- **Modo Espectador (IA vs IA) Corregido**:
  - Solucionado el bug en `GameController.ts` que interrumpía el bucle de turnos cuando la IA se enfrentaba a otra IA. `checkAITurn()` ahora valida correctamente `gameMode === 'aivsai'`.
  - Añadidas las traducciones faltantes (`wizard.mode_aivsai` y descripciones) al archivo `translations.ts`.
- **Integración Social / Amigos**:
  - Se eliminó el botón flotante "SOCIAL" del Dojo.
  - Se añadió la pestaña `👥 Perfil y Amigos` dentro del modal Online (`modal-online.html` y `OnlineModalRenderer.ts`), integrando el flujo de forma más limpia en la arquitectura existente de emparejamiento.
- **Documentación de Dificultad (AlphaZero / CrazyGoNet)**:
  - Explicado al usuario cómo la dificultad Kyu (30k-1k) usa Minimax/Heurísticas, mientras que Dan (1d-10d) usa la red neuronal ONNX calibrando matemáticamente la *Temperatura Softmax* de la Policy Head (0.6 para Dans bajos con alta aleatoriedad, 0.3 para intermedios, 0.0 Argmax para fuerza bruta máxima en 7d+).

### Sesión Anterior (Sesión 153 — Selector Maestro y Granular de Dificultad de IA)
- **Tarea 291 Completada Exitosamente**:
  - Implementación completa del **Selector de Dificultad Pack y Granular** para el Asistente Local (SetupModal) y Online (Lobby Host).
  - La dificultad ahora usa rangos estándar de Go (de **30 Kyu a 9 Dan**).
  - Se mapean los Kyus (30k a 1k) a heurísticas dinámicas de Minimax en el Worker (easy, medium, hard).
  - Se mapean los Dans (1d a 9d) a inferencias de la Red Neuronal AlphaZero (**CrazyGoNet**).
  - **Randomness / Temperatura dinámica** para la IA en niveles Dan, permitiendo cometer errores de manera progresiva si no es 9d.
  - **Escalado Automático de Dificultad en Roguelike**: El mapa ahora configura automáticamente niveles de Kyu/Dan incrementales a medida que avanza la expedición (ej. Base 26k en modo Fácil, sumando +1 Kyu por cada nodo conquistado). Todo adaptado al sistema Kyu/Dan.
  
### Sesión Anterior (Sesión 152 — Entrenamiento Integral de Red Neuronal CrazyGoNet Fases 1, 2 y 3, Integración ONNX y Lanzamiento Fase 4)
- **Hito Histórico: Red Neuronal AlphaZero (CrazyGoNet) Entrenada, Exportada e Integrada en el Motor**:
  - **Fase 1 (9x9 Fundamentos - 50.000 Pasos)**: Completada con éxito en GPU RTX 4070 Ti SUPER (16 GB VRAM). `Value` loss bajó a `0.0034` y `Ownership` loss a `0.1660`.
  - **Fase 2 (9x9 Maestría Táctica - 150.000 Pasos)**: Completada con 2.000 partidas adicionales (~300.000 posiciones).
  - **Fase 3 (13x13 Combate y Aperturas - 250.000 Pasos)**: Completada con 1.500 partidas de 13x13 (468.309 posiciones) y transfer learning de espina dorsal ResNet-12.
  - **Modelos ONNX Integrados en el Motor de Juego**:
    - `crazy_go_brain_fp32.onnx` (11.4 MB) y `crazy_go_brain_web.onnx` (5.7 MB) ubicados en `src/ai/models/` y `public/models/`.
    - `src/ai/NeuralNetAdapter.ts`: Cliente de inferencia WebAssembly SIMD para ejecución ultrarrápida.
    - `src/ai/GoAI.worker.ts`: IA de combate conectada a la red neuronal para selección de jugadas en dificultades altas.
    - `src/core/AnalysisEngine.ts`: Cálculo de Winrate en tiempo real conectado al Value Head de la red neuronal.
    - Build de producción (`npm run build`) verificado con 0 errores.
  - **Fase 4 + Fase 5 Encadenadas (`ENTRENAMIENTO_NOCTURNO_TOTAL.bat`)**:
    - Generación de partidas en 19x19 y topologías mixtas asimétricas (circular, triangular, erosionado, vórtice Oni).
    - Entrenamiento nocturno autónomo en GPU hasta el paso 700.000 con auto-exportación ONNX al finalizar.
  - **Fase de Disputa de Territorio (Implementada)**:
    - Se añadió fase intermedia donde los jugadores pueden marcar manuales piedras vivas o muertas.
    - Al aceptar, se calcula el puntaje final basado en las marcas.
  - **Sistema Online Backend (Implementado)**:
    - Base de datos simulada con `localStorage` (`DatabaseManager.ts`) para perfiles y sistema de amigos.
    - Integración de UI `SocialModalRenderer.ts` en menú (Botón Social).
    - Limitación de cambio de nombre de usuario a 1 vez cada 6 meses.
    - Sincronización de Display Names en salas P2P con Trystero (Envío en `GUEST_JOINED` y `HERO_SELECT`).

### Sesión Anterior (Sesión 151 — Finalización de Expediciones Cooperativas Online y Blindaje Criptográfico)
- **Blindaje Criptográfico y Ofuscación de Código (`build_packages.js`)**: Integración de `javascript-obfuscator` en el pipeline oficial de empaquetado (`npm run package`). Todos los bundles JavaScript se procesan automáticamente con aplanamiento de flujo de control (*Control Flow Flattening*), inyección de código muerto (*Dead Code Injection*), encriptación Base64/RC4 de strings y ofuscación hexadecimal de identificadores antes de generar los `.zip` de Itch.io y Windows PC, protegiendo al 100% el código fuente contra descompilación o copia no autorizada.
- **Modal de Protocolo y Aviso de Privilegios al Iniciar (`RoguelikeController.ts`, `OnlineController.ts`, `RogueModalRenderer.ts`)**: Se añadió un modal emergente diegético de briefing (`showCoopBriefing`) tanto para el anfitrión como para el invitado al comenzar la expedición roguelike online. Explica de forma clara los privilegios del Anfitrión (elección de dificultad, liderazgo en el mapa y selección de botines sincronizados), el rol del Invitado (acompañar y visualizar elecciones en tiempo real), la mecánica de turnos alternos en combate y la votación mutua de abandono.
- **Sistema Estricto de Sub-turnos Cooperativos (`GameController.ts`)**: Se integró el turno alterno (`coopSubTurn`). El motor rechaza jugadas, pases y hechizos si no es el turno del jugador que tiene el control, mostrando la alerta `"⏳ Espera a que tu compañero juegue."`
- **Control Exclusivo del Anfitrión sobre el Mapa (`RoguelikeController.ts`, `NetworkManager.ts`)**: Los invitados tienen bloqueada la interacción con el mapa. El anfitrión lidera la expedición y envía mensajes `MAP_CLICK` para que el invitado entre simultáneamente a los nodos.
- **Sincronización Determinista de Recompensas (`RogueModalRenderer.ts`)**: Modificados los botones de los eventos y santuarios. Verificando `e.isTrusted`, se impide a los invitados hacer selecciones. Cuando el anfitrión elige, se emite un `EVENT_OPTION_CLICK` que simula programáticamente (`btn.click()`) la acción exacta en el cliente del invitado para avanzar ambas run de forma sincronizada.
- **Votación de Abandono y Desconexiones (`OnlineController.ts`)**: Añadido mensaje `VOTE_ABANDON` con `confirm()` nativo para que salir de la expedición requiera mutuo acuerdo, evitando clics accidentales. Alerta HUD para caídas de red que pausa la interacción y aguarda el auto-reconnect de Trystero.
- **Limpieza del Asistente Online (`OnlineModalRenderer.ts`, `modal-online.html`)**: Se añadieron IDs a las secciones de color y Komi para ocultarlas dinámicamente si `onlineGameType === 'coop_rogue'`. Se deshabilitó el menú desplegable de "Añadir Bot" o "Jugador Local" para los slots del Lobby Cooperativo.

### Sesión Anterior (Sesión 150 — Corrección de Multijugador Local y Animación Universal de Boca Oni)
- **Animación del Abismo/Vórtice Morado en Boca de Tablero Oni Universal (`SVGRenderer.ts`, `CombatLogModalRenderer.ts`, `vfx.css`)**:
  - **Problema Reportado**: El efecto del abismo/vórtice giratorio de color morado solo aparecía en el Combat Log & Replay, pero faltaba en el tablero estándar durante el combate en vivo (`#game-svg`) y en las previsualizaciones de selección (Asistente Local y Asistente Online).
  - **Solución Implementada**:
    - Se integró `renderOniMouthAbyss` y `renderVolcanoCornerDecorations` directamente en el pipeline de renderizado de [`SVGRenderer.ts`](file:///c:/Users/VICTOR/Desktop/crazy_go/src/graphics/SVGRenderer.ts), ejecutándose de forma automática tras el trazado del fondo de madera (`renderBoardBackground`).
    - Se añadieron los anillos concéntricos animados de vórtice (`.oni-mouth-swirl-ring-1` y `.oni-mouth-swirl-ring-2`) con `transform-box: fill-box` y rotación infinita en [`vfx.css`](file:///c:/Users/VICTOR/Desktop/crazy_go/src/styles/vfx.css).
    - Ahora el vórtice abismal y su brillo místico morado/carmesí se muestran permanentemente en el combate estándar, en el Combat Log/Replay, en el Paso 3, 5 y 6 del Asistente Local (`wizard-board-preview-svg`, `wizard-stage-board-svg`, `wizard-rival-board-svg`) y en el Asistente Online (`online-board-preview-svg`, `online-stage-board-svg`).
- **Corrección de Bug Crítico en Partidas Multijugador Local (2P y 4P / Go Cuádruple) (`SVGRenderer.ts`, `GameController.ts`, `HUDController.ts`)**:
  - **Causa Raíz Diagnosticada**:
    - `SVGRenderer.handleNodeClick` calculaba `placingPlayer` usando `this.getLocalPlayerColorCallback()` si estaba presente.
    - `GameController.ts` pasaba `() => (this.config.humanColor || ...)` como callback al instanciar `SVGRenderer`.
    - Dado que `this.config.humanColor` está inicializado por defecto en `1` (Negras), la expresión siempre devolvía `1` incondicionalmente en todas las partidas locales.
    - Como resultado, aunque el indicador de turno en el HUD cambiaba a los turnos 1b (Blancas/P2), 1c (Esmeralda/P3) o 1d (Amatista/P4), cualquier clic local forzaba la colocación de una piedra Negra (PlayerId = 1).
  - **Solución Implementada**:
    - Se eliminó el parámetro y propiedad redundante `getLocalPlayerColorCallback` de `SVGRenderer`.
    - `placingPlayer` se obtiene ahora directamente de `this.state.currentPlayer`, garantizando que en cualquier modo local o mixto cada jugador coloca de forma exacta el color y material que le corresponde a su turno.
    - En `HUDController.updatePolyominoUI`, se añadió `PolyominoManager.syncCardsWithInventory(currentPlayer)` para sincronizar dinámicamente el dock de poliminós al turno del jugador activo en partidas multijugador.
    - En `GameController.onNodeClicked`, se ajustó la captura de entidades neutrales (`resolveCaptiveCaptures`) para usar `previousPlayerId` en lugar de asumir `humanColor`.
    - Creada la suite de tests `scripts/test_local_multiplayer.mjs` validando la colocación correcta de piedras y poliminós en 2P y 4P.

### Sesión Anterior (Sesión 149 — Auditoría de Reglas de Go y Hoja de Ruta ML)
- **Corrección de Inconsistencia en `RulesEngine.isMoveLegal()` (Ko Simple)**:
  - **Bug Encontrado**: `isMoveLegal` verificaba la regla del Ko solo cuando `nodesToCapture.size > 0`,
    mientras que `tryPlaceStone` la verificaba siempre. Esta inconsistencia podía causar que `isMoveLegal`
    reportara una jugada como legal cuando `tryPlaceStone` la rechazaría por Ko en edge-cases.
  - **Corrección**: Eliminada la condición `nodesToCapture.size > 0` de `isMoveLegal`. Ambos métodos
    ahora comprueban Ko siempre que `boardHistory.length >= 2`, siendo idénticos y coherentes.
  - **Archivo**: `src/core/RulesEngine.ts` (líneas 74-96).
- **Actualización Completa de `docs/ai_wiki/go_rules.md`**:
  - **Error crítico corregido**: La versión anterior decía "Ko desactivado" cuando el código lo tenía activo.
    El documento ahora refleja fielmente el estado real del código.
  - **Nuevas secciones añadidas**: Superko (no implementado, razón documentada), Ko Simple con descripción
    precisa de la implementación, Fase de Disputa de Territorio (no implementada, innecesaria para ML),
    tabla completa de reglas especiales de Crazy Go (no canónicas).
  - **Estado de cada regla documentado**: Libertades, cadenas, capturas, suicidio, Ko, ojos verdaderos/falsos,
    grupos vivos (Benson 1976), Seki (3 capas), conteo de territorio (Reglas Japonesas), Komi 6.5.
- **Reescritura Completa del Boceto de ML** (`entrenar la IA para el Go con machine learning.md`):
  - Fusionado con recomendaciones de la auditoría del motor.
  - Tabla de estado del motor (qué está correcto, qué no está implementado y por qué no importa para ML).
  - Arquitectura detallada: CrazyGoNet ResNet-12, 3 cabezas (Policy + Value + Ownership), tensor 16 canales.
  - **Decisión clave**: Simulador headless en Node.js/TypeScript (reutiliza código existente) en lugar de
    reescribir en Python — evita divergencia de implementación y bugs en datos de entrenamiento.
  - **Plan para dos versiones de modelo**: FP32 completo (~90 MB, para itch.io descargable) y FP16+ResNet-8
    destilado (~40-45 MB, para versión web).
  - Roadmap realista por fases con lo que el usuario debe hacer en cada paso.
  - Respuesta a la pregunta de la Fase de Disputa de Territorio: innecesaria para ML (el Ownership Head
    la reemplaza), dejar para futura versión de torneo competitivo.

- **Reactivación y Sincronización Universal de Peligros Ambientales y Mecánicas Únicas de Tablero (Cielo, Volcán, Máscara Oni) (`SVGRenderer.ts`, `StageHazardManager.ts`, `GameController.ts`, `AITurnManager.ts`)**:
  - **Causa Raíz Diagnosticada**: La rutina `StageHazardManager.checkStageHazards` solo se llamaba cuando un jugador o la IA pasaba turno (`passTurn`), pero **nunca** tras la colocación estándar de piedras o fichas de poliminó en `SVGRenderer.handleNodeClick`. Por este motivo, durante partidas normales donde los jugadores jugaban piedras continuamente, el turno llegaba al umbral de activación (ej. Turno 21 / 11a en Tablero del Cielo y Volcán, o Turno 15 / 8a en Máscara Oni) sin que los bloques cayeran, los meteoros impactaran o el vórtice gravitatorio inhalara piedras.
  - **Solución Implementada**:
    - Se conectó `StageHazardManager.checkStageHazards` en el flujo posterior a la colocación de piedras y poliminós en `SVGRenderer.handleNodeClick`.
    - Se implementó `StageHazardManager.isHazardInProgress` para pausar la interactividad del usuario y la ejecución inmediata de la IA mientras corren las animaciones y efectos de sonido VFX (lluvia de meteoros, caída celestial, vórtice de inhalación).
    - En `StageHazardManager`, se añadió registro de eventos al Combat Log (`CombatLogManager.logBoardEvent`) para las expansiones celestiales y la inhalación Oni.
    - Se actualizó el renderizado SVG del tablero (`SVGRenderer.ts`) para filtrar nodos destruidos (`terrain !== 'DESTROYED'`) en líneas de cuadrícula, puntos estrella y el casco convexo de madera dinámico.
    - Se creó la suite de pruebas `scripts/test_stage_hazards.mjs` validando al 100% el disparo automático de las tres mecánicas.

- **Reparación Integral de Registro en Combat Log & Replay Engine (`SVGRenderer.ts`, `CombatLogManager.ts`, `GameController.ts`, `CombatLogModalRenderer.ts`)**:
  - **Registro Universal de Jugadas y Poliminós**: Se conectó `CombatLogManager.logStonePlacement`, `logPolyominoPlacement` y `logSproutingGrowth` en `SVGRenderer.handleNodeClick`, capturando el 100% de los movimientos de todos los bandos.
  - **Combat Log & Replay en Tableros con Topología Dinámica y Destrucción**:
    - `CombatLogManager.createBoardSnapshot` registra en cada turno el estado real de cada nodo, incluyendo `terrain` (`DESTROYED`, `NORMAL`, etc.) y las piedras activas.
    - `CombatLogModalRenderer.renderStepBoard` sincroniza `node.terrain = snapNode.terrain` y marca como `DESTROYED` cualquier nodo ausente o destruido.
    - El renderizado de fondo (`renderBoardBackground`), líneas de cuadrícula (`renderGridLines`), puntos estrella (`renderStarPoints`), poliminós (`renderPolyominoBases`) y piedras (`renderStones`) descarta automáticamente cualquier intersección con `terrain === 'DESTROYED'`, adaptando dinámicamente el Convex Hull de madera y las aristas al estado de cada turno (ej. erupciones de volcanes, fracturas de terremoto o fauces Oni).
    - Verificado con prueba unitaria e integración Test 7 en `scripts/test_combat_log.mjs`.
  - **Robustez del Sistema de Turnos en Rebobinar**:
    - Se cancelan y limpian los timers de IA (`clearTimeout(this.aiTurnTimeout)`).
    - Se apaga el badge de cálculo de IA (`HUDController.setAIBadge(false)`).
    - Se resetea el modo de apuntado (`ChampionManager.currentTargetingMode = 'none'`) y poliminó activo.
    - Se restablece la interactividad del renderizador (`this.renderer.isInteractive = this.isLocalPlayerTurn()`).
    - En partidas de 2 jugadores (Humano vs IA), el hechizo de Rebobinar deshace automáticamente 2 pasos (el movimiento de la IA y el movimiento previo del jugador), devolviendo el turno al jugador humano en la ronda correcta con sus capturas y recursos sincronizados.
  - **Causa Raíz Diagnosticada**: Al salir del Modo Historia (o iniciar cualquier otro modo como 1v1 Local, 1vIA, Roguelite, Online o Tutorial), el contenedor `#story-world-container` permanecía con la escala macro cósmica reducida (`scale(0.08)` o traslación `translate`), los tableros SVG clonados de capítulos conquistados (`.story-conquered-island`) quedaban pegados en el DOM, `_turnWatcher` seguía corriendo en segundo plano y los duelistas quedaban con `opacity: 0; pointerEvents: none;`.
  - **Solución Implementada**:
    - Se creó un método público `StoryModeController.resetWorld()` que restaura de forma instantánea e incondicional el contenedor a `scale(1)` y `translate(0, 0)`, elimina los SVGs clonados, resetea `#game-svg`, restaura los duelistas a opacidad 1 y elimina prompts/overlays.
    - Se actualizó `GameController.initGame()` para que, al iniciar cualquier partida que no sea de historia, invoque automáticamente `StoryModeController.stopCampaign()` y `StoryModeController.resetWorld()`.
    - Se actualizó `ScreenManager.transitionTo()` para que al volver al menú principal o al mapa roguelike se limpie e interrumpa cualquier proceso de historia activo.
- **Resolución de Error Chromium `ERR_CACHE_OPERATION_NOT_SUPPORTED` en Audio (`BGMGenerator.ts`)**:
  - **Causa Raíz**: El reproductor creaba 16 instancias simultáneas de `new Audio()` en el arranque (7 de ellas apuntando en paralelo a `bgm_zen.wav` de 10.5 MB y 9 a `bgm_battle.wav`), generando peticiones concurrentes de *byte-range* HTTP sobre la misma URL en localhost que saturaban la caché de Chromium.
  - **Solución Implementada**: Se rediseñó `BGMGenerator` con un pool estricto de instancias de audio únicas por archivo. Si se cambia de pantalla entre pistas que comparten el mismo archivo (ej. menú ➔ mapa ➔ zen), la reproducción continúa de forma fluida sin reiniciar ni re-descargar el audio, eliminando colisiones de caché.
- **Fase 103: Modo Historia Cósmico: Flujo Completo de 4 Escenas (Diagrama de Usuario), Corrección Crítica de TypeError en Shrines y Trazado de Consola (`StoryModeController.ts`, `SVGRenderer.ts`, `index.html`, `public/nature/`, `board.css`, `GameController.ts`, `StoryDebugUI.ts`)**:
  - **Corrección Crítica de `Uncaught TypeError` en `SVGRenderer.renderShrines`**:
    - Se identificó la causa raíz que bloqueaba la ejecución de `loadChapter`, congelaba el fondo y abortaba la colocación de piedras: `storyCtrl.STORY_CHAPTERS` no estaba expuesto como propiedad estática de la clase `StoryModeController`.
    - Se declaró `public static readonly STORY_CHAPTERS = STORY_CHAPTERS;`, se asignó `StoryModeController` a `window` de forma inmediata e incondicional, y se envolvieron las rutinas de renderizado de santuarios y cautivos en bloques `try...catch` con registro seguro.
  - **Flujo de 4 Escenas Idéntico al Boceto del Usuario (`media_1787823593645.png`)**:
    - **Escena 1 (Cosmos Puro)**: Fondo estrellado galáctico `/bg_story.jpg`.
    - **Escena 2 (Vista Macro Cósmica con Tablero Diminuto)**: El Goban flota en escala macro `0.08` con resplandor dorado sobre el fondo cósmico, sin duelistas visibles. Botón pulsante `[ ⚔️ DIVE INTO GOBAN ✦ ]`. Clic en el tablero o botón = **Zoom-In Dive de 1.4s** hacia la batalla.
    - **Escena 3 (Combate en el Cosmos y Victoria)**: Fondo cósmico presente durante todo el duelo. Al ganar (`onWinCurrentChapter`), brotan sobre las casillas los 4 assets ilustrados 2D (`nature_pine.png`, `nature_sakura.png`, `nature_bamboo.png`, `nature_vines.png`) con enredaderas SVG verdes que trepan por las líneas.
    - **Escena 4 (Zoom Out y Doble Tablero: Conquistado abajo, Nuevo arriba)**: La cámara hace zoom-out a `scale(0.08)` en el cosmos. La isla conquistada (`conquistado`) queda anclada abajo con su halo verde de vida; la nueva isla (`nuevo`) se carga arriba con su resplandor y botón de inmersión para el Capítulo 2 (*The Crystal Fault*).
  - **Logs Detallados en Consola para Diagnóstico (`[StoryMode]`)**:
    - Añadidos `console.log` enriquecidos en cada punto clave: inicio de campaña, carga de capítulos, inmersión en picado, eventos por turno, victoria, florecimiento y salto entre mundos.
  - **Ubicación Integrada del Panel de Debug en la Topbar (`#game-topbar`)**:
    - Reubicado `#story-debug-panel` y su botón `🛠️ Story Debug ▼` directamente dentro de `topbar-left` (junto al botón `🔄`). Menú desplegable ámbar con atajos F3 / `~` y cierre por clic externo.
  - **Eliminación del Bloqueo de Entrada y Clics en el Goban**:
    - **Omisión de Splash de Komi**: Corregido `skipKomiSplash` en `GameController.initGame()` para modo historia, evitando el velo bloqueante de desenfoque.
    - **Doble Detección Global en SVG**: El manejador global de clics en SVG asegura que cualquier clic donde se dibuje la piedra fantasma consolida la jugada con 100% de efectividad.
    - **Intro Cinemática Inmediatamente Saltable**: El botón `[ SKIP INTRO ⏩ ]` y el overlay aceptan clics desde el milisegundo 0.
  - **Renderizado de Goban de Madera en Registro de Combate (`CombatLogModalRenderer.ts`, `combat_log.css`)**:
    - Integrado el algoritmo de *Convex Hull* para renderizar el fondo de madera dinámico de Kaya (`url(#wood-texture)` con `#board-shadow`) en el visor SVG interactivo de repetición (`#replay-board-svg`).
    - Añadido renderizado de **Puntos Estrella (Hoshi)** tradicionales (`#221308`) y calibradas las líneas de la cuadrícula a tinta tradicional Urushi (`#2a180b`).
    - Soporte completo para decoraciones de tableros especiales (Cráteres volcánicos y Fauces Oni) en las repeticiones del registro.
    - Sincronizado el cálculo de radio de piedra, márgenes y viewBox con el motor principal de `SVGRenderer`.
  - **Corrección de Tooltips y Shaders de Targeting para Ryūjin (`SVGGhostPreview.ts`)**:
    - Corregido el texto y el icono del tooltip flotante sobre las piedras al activarse la habilidad pasiva *Furia del Dragón* de Ryūjin: ahora muestra `🔥 Calcinar Piedra (X restante(s))` / `🔥 Incinerate Stone (X left)` leyendo correctamente `ChampionManager.dragonBurnKillsRemaining` en vez de `🌪️ Invert Color (0 left)`.
    - Ajustado el halo y resplandor de apuntado a rojo fuego carmesí (`#ef4444` con relleno `rgba(239, 68, 68, 0.25)`) para Ryūjin y `#0ea5e9` para Alquimista.
  - **Calibración Precisa del Hover y Previsualización Fantasma (`SVGRenderer.ts`)**:
    - Ajustado el umbral de captura magnética en `mousemove` de `2.2 * stoneRadius` a `1.15 * stoneRadius` (coincidiendo con el área de contacto física de las casillas `circle.board-hit-area`).
    - Elimina saltos agresivos y colocación "a medias" en intersecciones vecinas no deseadas, garantizando que el hover se active única y nítidamente sobre la intersección apuntada.
  - **Ajuste Espacial en Menú Principal**:
    - Elevado el texto "ROGUELIKE" del menú en 20px (`transform: translateY(-22px)`).
    - Desplazado el botón de **Feedback** (texto, icono de grulla y colliders) **9px adicionales a la derecha** en `index.html` (`left: calc(71.5% + 9px)`), alineándolo perfectamente con Opciones.
  - **Fondo Cósmico Universal y Rutas Vite**: Rutas `/bg_story.jpg` corregidas y sincronizadas en `/public`.
  - **Persona Normal Depurada**: Ocultado por defecto el botón de habilidades `#btn-duel-champion-skill` para mostrar únicamente el rasgo pasivo "2 Rewinds".

### Sesión Anterior (Sesión 147)
- **Fase 102: Cromatismo de Dificultad Avanzado y Transición por Disolución (`carousel.css`, `theme.css`, `ScreenManager.ts`)**:
  - **Rediseño Cromático de Llamas**:
    - **Medium**: Ajustado a un color amarillo-dorado brillante (`#fde047`) para desvincularlo visualmente de Hard.
    - **Hard**: Ajustado a un carmesí profundo y puro (`#ef4444`) con alta saturación para máxima distinción.
    - **Grandmaster**: Modificado a una llama blanca cósmica pura brillante (`brightness(3.2) saturate(0.1)`).
  - **Transición de Disolución y Desenfoque (Cross-dissolve)**:
    - Eliminado el flash a negro opaco de la transición de escenas.
    - Reemplazado por un efecto translúcido `rgba(8, 12, 22, 0.45)` con desenfoque dinámico `backdrop-filter: blur(18px) brightness(0.55)` para suavizar el cambio de pantallas y enmascarar tirones de carga.
    - Tiempos de `ScreenManager` ampliados en consonancia (240ms de fade-in y 300ms de fade-out).

### Sesión Anterior (Sesión 146)
- **Fase 101: Estilización Zen Minimalista y Reducción de Densidad de Conexiones (`RoguelikeMapGenerator.ts`)**:
  - **Reducción de Sobrecarga de Líneas**: Se limitó el número de caminos principales a 3 rutas directas bien diferenciadas, erradicando el aspecto de telaraña sin alterar la estructura fundamental del mapa.
  - **Capping Estricto de Salidas por Nodo (Máximo 2)**: La inmensa mayoría de nodos poseen 1 único camino directo, reservando la bifurcación (2 salidas) únicamente para puntos de elección estratégica clave como los nodos de apertura.
  - **Claridad de Ramas**: El mapa ofrece ahora un aspecto visual limpio, despejado y legible (*estética Zen*), donde las ramas izquierda, central y derecha son instantáneamente distinguibles por el jugador.

### Sesión Anterior (Sesión 145)
- **Fase 100: Calibración Proporcional de Standees de Monjes y Sabios en Combate (`champions.css`)**:
  - **Ajuste de Escala Reducida (-25%)**: Debido al ratio y postura sentada ancha de las ilustraciones de monjes jóvenes (`monk_1` a `monk_5`) y sabios ancianos (`sage_1` a `sage_5`), se veían desproporcionadamente grandes en combate respecto a los demás héroes. Se redujo su escala CSS exactamente un 25% (de `scale(1.68)` a `scale(1.26)` en reposo, y de `scale(1.74)` a `scale(1.31)` en hover).
  - **Simetría Izquierda / Derecha / 4P**: Aplicado tanto al lado del jugador (`.duel-standee-player`, `#duel-player-img`) con `scaleX(-1)`, como al lado rival (`.duel-standee-enemy`, `#duel-enemy-img`) y a las cartas multijugador (`.multi-standee-card`, `#duel-p2-img` a `#duel-p4-img`).

### Sesión Anterior (Sesión 144)
- **Fase 99: Sincronización Subpixel Inmune a Zoom de Nodos HTML y Trazos SVG (`RoguelikeMapRenderer.ts`, `map.css`)**:
  - **Unificación Geométrica de Lienzo (`stageHeight`)**: Se eliminó el padding del wrapper en `map.css` y se sincronizó la altura de SVG y contenedor para garantizar $\text{SVG}(X, Y) \equiv \text{Centro Botón}(X, Y)$ con precisión subpixel en cualquier zoom.

### Sesión Anterior (Sesión 143)
- **Fase 98: Pacing Roguelike Óptimo, 2 Nodos Iniciales con Bifurcación Garantizada y Validación Anti-Grind (`RoguelikeMapGenerator.ts`, `RoguelikeMapRenderer.ts`)**:
  - **Inicio Equilibrado con 2 Nodos de Combate**: El Tier 0 genera exactamente 2 nodos iniciales de batalla (ej. carriles $[1, 2]$ o $[0, 2]$).
  - **Bifurcación Inmediata Garantizada**: Cada nodo inicial de combate en Tier 0 se conecta a 2 o más nodos distintos en Tier 1, otorgando al jugador toma de decisiones estratégica desde el primer turno.
  - **Regla Estricta Anti-Grind (Máximo 2 Peleas Seguidas)**: Se implementó un validador de pacing que recorre todos los caminos y prohíbe una 3ª batalla consecutiva, transformando automáticamente el nodo en Santuario, Tienda o Descanso. El ritmo predominante es: *Pelea $\to$ Santuario/Tienda $\to$ Pelea $\to$ Santuario/Tienda/Descanso $\to$ Jefe Final*.
  - **Longitud Dinámica de 6 a 8 Filas**: `NUM_TIERS` configurable entre 6 y 8 niveles.
  - **Progresión Proporcional de Tablero**: $9\times9 \to 13\times13 \to 19\times19$.

### Sesión Anterior (Sesión 142)
- **Fase 97: Generador DAG Canónico de Mapas con Prevención Estricta de Cruces y No-Redundancia (`RoguelikeMapGenerator.ts`)**:
  - **Algoritmo de Carvado de Caminos Puros (Path-Carving DAG Generator)**:
    - Se erradicaron los algoritmos de parcheo y barridos posteriores. Ahora el 100% de los nodos y aristas se generan mediante tallado continuo de caminos hacia el Jefe Final.
    - **Prevención Geométrica de Cruces (`crossesAnyEdge`)**: Validación formal de intersección ($from_1 < from_2 \land to_1 > to_2$).
    - **Filtro Estricto de No-Redundancia (`createsRedundancy`)**: Se evita que dos nodos del mismo tier ofrezcan exactamente el mismo conjunto de nodos destino.

### Sesión Anterior (Sesión 141)
- **Fase 96: Mapa Roguelike de 4 Columnas, Cero Callejones sin Salida y Progresión Escalonada de Goban (`RoguelikeMapGenerator.ts`)**:
  - **Límite de 4 Columnas Horizontales**: Configurados 4 carriles espaciados con longitud fija de 6 niveles.
  - **Progresión Escalonada Canónica de Tamaño de Tablero**:
    - **Tier 0 y Tier 1 (Inicio)**: Siempre Goban **9x9**.
    - **Tier 2 y Tier 3 (Medio)**: Siempre Goban **13x13**.
    - **Tier 4 y Tier 5 / Jefe Dragón (Final)**: Siempre Goban **19x19**.

### Sesión Anterior (Sesión 140)
- **Fase 95: Algoritmo Canónico de Caminos Planares Tipo Slay the Spire y Limpieza de UI del Mapa (`RoguelikeMapGenerator.ts`, `RoguelikeMapRenderer.ts`, `map.css`)**:
  - **Generador de Grafos Planares Tipo Slay the Spire**:
    - Reemplazado el algoritmo de proximidad por el algoritmo canónico de *Directed Planar Random Walks*.
    - **Regla Estricta Planar**: Se garantiza matemáticamente que $c_{t+1}(i) \le c_{t+1}(j)$ para cualquier par de caminos adyacentes $i < j$, eliminando por completo los cruces diagonales en 'X' o conexiones caóticas de telaraña.
  - **Limpieza de UI de Biomas**: Eliminadas las etiquetas de texto flotantes ("Zen Valley", "Misty Ridge", "Dragon Lair"), manteniendo el fondo de lienzo ambiental degradado y las partículas vivas de cenizas flotantes sin distracciones.

### Sesión Anterior (Sesión 139)
- **Fase 94: Sistema Universal de Transiciones Fluidas entre Pantallas y Modales (`ScreenManager.ts`, `theme.css`, `index.html`, `modals/base.css`)**:
  - **Telón Cinemático de Transición (`#screen-transition-overlay`)**: Implementado un velo global acelerado por GPU con gradiente radial profundo que cubre suavemente la pantalla durante los cambios de escena sin tirones ni cortes abruptos de `display: none`.
  - **Controlador Asíncrono de Navegación (`ScreenManager.transitionTo`)**:
    - Transición suave de entrada en ~160ms $\to$ conmutación de clases `.hidden` en el punto ciego (midpoint) $\to$ reinicio/sincronización ordenada de cámara 2.5D, música de fondo (BGM) y HUD $\to$ revelado fluido en ~180ms con animación `@keyframes screenFadeIn`.
    - Totalmente retrocompatible con `showMainMenu()`, `showRoguelikeMapScreen()` y `showGameScreen()`.
  - **Apertura Fluida y Dimensional de Modales (`modals/base.css`)**:
    - Desenfoque de fondo progresivo (`@keyframes modalBackdropFadeIn`) con `backdrop-filter: blur(10px)`.
    - Entrada dimensional elástica de tarjetas modales (`@keyframes modalCardPopIn`) en todos los asistentes (Local, Online, Opciones, Puntuación, Registro de Combate).

### Sesión Anterior (Sesión 138)
- **Fase 93: Firma de Autor, Disolución Zen de Capturas y Mapa Roguelike Procedural con Biomas Evolutivos**:
  - **Firma de Autor en Menú de Inicio (`index.html`, `base.css`)**: Añadido el sello de autor `.menu-creator-signature` ("⛩️ Created by Víctor Alonso") en la esquina inferior derecha del Dojo 2.5D, con efecto glassmorphic sutil y micro-resplandor ámbar/dorado al interactuar.
  - **Efecto de Disolución Zen en Capturas (`RulesEngine.ts`, `VFXManager.ts`, `SVGRenderer.ts`, `vfx.css`)**:
    - Al capturar piedras enemigas (tanto en jugadas estándar como con poliminós o transmutaciones), se desencadena una animación de desintegración orgánica *in-situ* sin proyectiles voladores.
    - Se despliega un anillo de *Qi* luminoso que se expande suavemente mientras el núcleo de la piedra se evapora en 6 micro-partículas de humo de tinta *Sumi-e* que se desvanecen en 350ms.
  - **Mapa Roguelike Procedural y Vivo con Biomas Evolutivos (`RoguelikeMapGenerator.ts`, `RoguelikeMapRenderer.ts`, `map.css`)**:
    - **Generación Procedural Real de Nodos**: Eliminado el árbol estático hardcodeado anterior; ahora cada expedición genera una topología ramificada única y orgánica de 6 Tiers con balance de tipos (Batallas, Mercaderes, Santuarios, Campamentos de Meditación) y garantía matemática de 0 callejones sin salida.
    - **Lienzo Ambiental Vertical con Transición de Biomas**:
      - *Base (Tier 0-1)*: Valle Zen Verde y Jardín de Bambú con bruma esmeralda y serenidad.
      - *Medio (Tier 2-3)*: Cordillera de la Niebla y Sendero Torii con tonos azul pizarra y noche fría.
      - *Cúspide (Tier 4-5)*: Tierra Calcinada y Cráter del Dragón con resplandor volcánico y **cenizas vivas incandescentes flotando en el aire** (`.map-embers-layer`).
    - **Senderos Vivos Iluminados**: Curvas Bezier orgánicas con animación de flujo de Qi (`.path-available`) hacia los nodos a los que el jugador puede avanzar y resplandor dorado en caminos recorridos (`.path-traversed`).

### Sesión Anterior (Sesión 137)
- **Internacionalización Dinámica de Botones de Campeones (`modal-local-setup.html`, `modal-online.html`, `modal-roguelike-setup.html`)**:
  - Se añadieron los atributos `data-i18n="champion.<hero>.name"` a todas las miniaturas y botones inferiores del selector de campeones en los asistentes de partida (Local, Online y Roguelike).
  - Corregido el texto que permanecía estático en español (*Persona Normal* y *Alquimista*) para que se traduzca reactivamente al inglés (*Normal Person* y *Alchemist*) al cambiar de idioma.
- **Fase 92: Arquitectura del Nuevo Modo Historia (Tableros Contiguos) (`StoryModeController.ts`, `StoryDebugUI.ts`, `index.html`)**:
  - **Reboot del Modo Historia**: Se ha desconectado la campaña `Legacy` del botón "Story" del menú principal, conectándolo al nuevo sistema base `StoryModeController`.
  - **Panel de Debug In-Game**: Se añadió una UI flotante oculta (tecla `~` o `F3`) específica para diseño de niveles, que permite forzar victorias/derrotas al instante y saltar de capítulos sin jugar.
  - **Mecánica de Tableros Contiguos (Prototipo)**: Modificado el layout SVG del tablero para envolverlo en un `#story-world-container`. Al ganar una partida ("Forzar Victoria"), el tablero actual se clona y se tiñe visualmente como terreno "conquistado" inactivo en el fondo, mientras la cámara (vía transiciones CSS) se desplaza para enfocar el nuevo SVG del siguiente capítulo contiguo, logrando el efecto visual del "Mundo como Tablero".

### Sesión Anterior (Sesión 136)
- **Fase 91: Pulido de Dificultad Roguelike: Normalización de Medium y Llamas Místicas en Expedición Activa (`modal-rogue-choice.html`, `RogueModalRenderer.ts`, `modal-roguelike-setup.html`, `carousel.css`, `ScreenManager.ts`, `translations.ts`, `index.html`)**:
  - **Llamas Animadas y Etiquetas Limpias en Expedición Activa**: En la pantalla 2.5D de expedición guardada (`modal-rogue-choice.html` / `RogueModalRenderer.ts`), se sustituyeron los subtítulos extensos redundantes (`(Principiante)`, `(Guerrero)`, `(Maestro)`, `(Gran Maestro)`) por las etiquetas puras de dificultad (**Easy / Fácil**, **Medium / Medio**, **Hard / Difícil**, **Grandmaster / Gran Maestro**), acompañadas del **mismo icono de fuego elemental animado (`🔥`)** y estilos cromáticos dinámicos (Esmeralda para Easy, Ámbar Solar para Medium, Carmesí para Hard y Púrpura Abisal para Grandmaster).
  - **Normalización Universal de "Normal" a "Medium"**: Sustituido el término "Normal" por "Medium" (en inglés) y "Medio" (en español) en todos los selectores de dificultad del modo Roguelike, asistentes de expedición, descripciones de pasivas e interfaces del mapa.
  - **Llamas Místicas en la Barra Superior del Mapa Roguelike (`ScreenManager.ts`, `index.html`)**: Sincronizado el badge `#map-diff-text` de la barra superior del mapa para renderizar la llama correspondiente con animación fluida `flameFlicker`.
- **Fase 90: Normalización Simétrica y Escalado Heroico de Personajes y Tarjetas de Habilidades (`champions.css`, `DuelistRenderer.ts`)**:
  - **Simetría Total y Presencia Heroica (Standees)**:
    - Se aplicó un escalado simétrico heroico `scale(1.28)` en ambos contenedores (`.duel-standee-player` y `.duel-standee-enemy`) con ancho `clamp(285px, 23vw, 400px)` y base `translateY(6%)`, permitiendo que ambos personajes llenen equilibradamente el espacio lateral vertical (~70-75% de la altura del Goban) sin verse reducidos.
    - **Calibración de Personajes Sentados**: Se añadió una escala compensatoria de `scale(1.68)` (hover `1.74`) para Sabios (`sage_*.png`) y Monjes (`monk_*.png`), igualando su presencia visual al nivel de ojos/hombros de los personajes de pie sobre el tatami.
    - Se homogeneizaron las transformaciones y orientaciones de todos los campeones (`normal`, `ronin`, `alchemist`, `tengu`, `boss`) para garantizar una escala idéntica en ambos lados del Goban en cualquier modo (Online, Local, Roguelike, Historia y Tutorial).
  - **Tarjetas de Habilidad Ricas y Descriptivas para el Rival**: Rediseñada `.duel-enemy-skill-pill` para igualar las dimensiones, padding, bordes redondeados y estructura interna de `.btn-card-skill.passive-badge`, mostrando el nombre de la habilidad en negrita (`.duel-skill-name`) y la fórmula de combate descriptiva (`.duel-skill-formula`) para todos los héroes (Kitsune, Tengu, Ryūjin, Ronin, Alquimista, Himiko, Gran Dragón Sabio y Aprendiz del Dojo).
- **Fase 89: Corrección del Rival del Invitado en Modo Online (`DuelistRenderer.ts`)**:
  - **Causa Raíz**: En `DuelistRenderer.render2PlayerDuelists`, la lógica online para determinar el héroe del oponente usaba `oppColor === 1` para decidir si el oponente era el host. Esto era incorrecto cuando el host no juega como P1 (Color Negro), ya que el host puede elegir color P2 (Blancas).
  - **Solución Aplicada**: Cambiado el chequeo a `oppColor === hostColor` (leyendo `NetworkManager.currentConfig.hostColor`), de forma que el héroe del rival se busca en `guestHeroes[oppColor]` cuando el oponente es invitado, y en `hostHero` cuando el oponente es el anfitrión. El fallback por defecto cambiado de `'kitsune'` a `'normal'`.
  - **Fix 4P Online (`render4PlayerDuelists`)**: Para el modo 4 jugadores en online, se derivaron de forma exacta los heroes de P1-P4 a partir de `NetworkManager.currentConfig.hostColor` y `guestHeroes`, superando la limitación de usar solo el `heroId` local.
- **Fase 88: Tarjeta Lateral Flotante de Inhalación Oni, Vectores Ortogonales y Máscara Continua de Inmunidad (`OniInhalationPreview.ts`, `hud.css`, `GameEventBinder.ts`, `ChampionManager.ts`, `GameController.ts`, `SVGRenderer.ts`)**:
  - **Tarjeta Lateral Flotante sin Solapamiento**: El tooltip de la Máscara Oni ahora se despliega anclado como tarjeta lateral en el margen superior derecho (`top: 60px; right: 24px;`), dejando el 100% del área del Goban despejada y visible.
  - **Visualizador Dinámico de Vectores Oni Mejorado (`OniInhalationPreview.ts`)**:
    - **Vectores de Viento Ortogonales**: Las flechas de flujo siguen con precisión las aristas reales de la cuadrícula ($\downarrow$, $\uparrow$, $\rightarrow$, $\leftarrow$) en neón magenta vibrante con sombra de contraste y puntas nítidas triangulares, eliminando las líneas diagonales flotantes.
    - **Limpieza de Ruido en Grupos Inmunes**: Cero flechas dibujadas sobre piedras de cadenas pesadas (4+ piedras).
    - **Máscara Azul Continua Compartida**: Las cadenas de 4+ piedras están protegidas por un contorno exterior perimetral continuo con suave relleno azul cian y badge `🛡️ Inmune (X piedras)` sin círculos superpuestos.
    - **Puntas de Flecha en Trayectorias de Piedras**: Flechas gruesas con puntas marcadas hacia el destino y calaveras `💀` de advertencia si la piedra va a ser devorada por las fauces.
  - **Corrección de Targeting y Clics de Ryūjin**: Corregido el enlace de `heroOwnerId` para permitir que el jugador humano ejecute la Furia del Dragón con cualquier color, eliminado el disparo erróneo de `onMovePlaced` con casillas quemadas, y enlazado `onPassiveBurnCompleted` en `GameController.ts` para avanzar el turno de la IA sin bloqueos.
- **Fase 87: Escalado Canónico a Escala 19x19 de Habilidades de Campeones e IA en Tablero Máscara Oni (`AlchemistChampion.ts`, `KitsuneChampion.ts`, `HimikoChampion.ts`, `TenguChampion.ts`, `RyujinChampion.ts`, `ChampionManager.ts`, `AITurnManager.ts`, `GameController.ts`, `GoAI.ts`)**:
  - **Estandarización 19x19 Universal en Máscara Oni**: Da igual qué tamaño de tablero seleccione el usuario (9x9, 13x13 o 19x19), en el Tablero Máscara Oni (`shape === 'oni'`) todos los personajes y rivales IA operan con sus habilidades calibradas exactamente a **escala 19x19**:
    - **Kitsune (Escudo Divino)**: Obtiene **5 cargas** de escudo (`KitsuneChampion.getShieldCharges`).
    - **Alquimista (Inversión Cromática)**: Obtiene **4 transmutaciones** (`AlchemistChampion.getInversionCount`).
    - **Himiko (Lluvia Pétrea)**: Desciende **18 piedras celestiales** (`HimikoChampion.getStoneRainCount`).
    - **Tengu (Lluvia Meteórica)**: Descarga **27 meteoros** (`TenguChampion.getMeteorCount`).
    - **Ryūjin (Furia del Dragón)**: Opera con la regla 19x19 (1 quema por grupo vivo de 2 ojos y +1 por cada ojo adicional que se expanda).
    - **IA & Motor de Juego**: `AITurnManager`, `GameController` y `GoAI.ts` adaptados para ejecutar transmutaciones, meteoros, lluvia y aperturas Fuseki a escala de 19x19 en la Máscara Oni.
- **Fase 86: Rediseño Ergonómico de Previsualización de Escenario y Oponente (`setup.css`, `champions.css`, `modal-local-setup.html`, `modal-online.html`, `OnlineModalRenderer.ts`)**:
  - **Eliminación Total de Solapamientos**: Erradicada la colisión de standees y goban con los botones inferiores en los pasos de Escenario (*Scenery*) y Oponente (*Opponent*) de todos los modos (Local y Online).
  - **Standees y Goban Redimensionados y Compactos**: Standees de jugador y rival ajustados de 301px a 195px (`width: 165px; height: 195px;`), caja misteriosa a `110x145px`, y tablero central a `135x135px`.
  - **Nivelación Centrada Natural**: Ajustada la posición vertical con `transform: translateY(0)` y `align-items: center` con `overflow: hidden` en el viewport, asentando los combatientes y el goban con naturalidad sobre el terreno escénico.
  - **Supresión de Etiquetas Inferiores**: Ocultadas y eliminadas las etiquetas y píldoras flotantes (`.duel-combatant-tag`, `.duel-stage-board-pill`) que causaban colisión directa con la cuadrícula de botones de fondos y rivales.
  - **Renderizado Completo Online**: Integrado el renderizado en tiempo real de `online-stage-board-svg` y actualización de la imagen del campeón anfitrión en el paso 4 del modo online.
- **Fase 85: Eliminación del Modo Claro/Oscuro y Fijación Permanente de Modo Oscuro (`index.html`, `MenuEventBinder.ts`, `ThemeManager.ts`)**:
  - **Eliminación Total de Botones de Tema (`index.html`)**: Se suprimieron los botones flotantes y de cabecera `#btn-menu-theme` (menú principal), `#btn-game-theme` (topbar de combate) y `#btn-map-theme` (topbar del mapa roguelike).
  - **Silenciado y Blindaje de Lógica (`MenuEventBinder.ts`, `ThemeManager.ts`)**: Se eliminaron los listeners de cambio de tema. `ThemeManager` ahora fija permanentemente `data-theme="dark"`, ignorando cualquier persistencia de modo claro y convirtiendo `toggleTheme()` en un método silencioso que devuelve siempre `'dark'`.
- **Fase 84: Placa CRAZY GO con Iluminación Uniforme y Escala Tipográfica (+30%) (`index.html`, `public/title_board_crazy_go.png`)**:
  - **Nueva Placa de Madera con Iluminación Uniforme**: Regenerada la placa de madera del título (`title_board_crazy_go.png`) con iluminación ambiental frontal homogénea sin zonas oscuras ni destellos asimétricos, perfectamente nivelada en la viga superior.
  - **Escala de Fuentes Unificada (+30% -> 1.75rem)**: Todos los rótulos espaciales (`LOCAL`, `ONLINE`, `ROGUELIKE`, `TUTORIAL`, `STORY`, `FEEDBACK`, `OPTIONS`) aumentados de forma idéntica a `font-size: 1.75rem` con peso `font-weight: 900`.
  - **Ajustes de Posicionamiento Fino**:
    - **Feedback**: Desplazado **10px a la izquierda** (`left: calc(71.5% - 10px)`).
    - **Story**: Desplazado **6px a la derecha** (`left: calc(73.5% + 6px)`).
    - **Options**: Desplazado **9px a la derecha** (`left: calc(71.5% + 9px)`).
    - **Roguelike**: Desplazado **8px hacia abajo** (`top: calc(53% - 2px)`, etiqueta `transform: translateY(-2px)`).
- **Fase 83: Flujo Secuencial Diferido del Modo Online (`modal-online.html`, `OnlineController.ts`, `OnlineEventBinder.ts`)**:
  - **Diferimiento Total de Sala P2P al Paso 5 (Host / Anfitrión)**:
    - Se eliminó la llamada prematura a `startHostingRoom()` al abrir el modal (`OnlineController.openOnlineModal()`) y en cada clic de los pasos 1 a 4.
    - El banner `.room-code-banner` (código `GO-XXXX`, badge `🟢 P2P Active` y botón `📋 Copy Code`) se trasladó al interior exclusivo del **Paso 5 (Lobby & Final Settings)** en `modal-online.html`.
    - La sala P2P WebRTC/MQTT se crea e inicializa únicamente cuando el anfitrión completa los pasos 1 (Modo), 2 (Tablero), 3 (Campeón) y 4 (Escenario) y entra al Paso 5, erradicando desincronizaciones y condiciones de carrera si un rival se unía antes de tiempo.
    - Si el anfitrión retrocede del paso 5 al 4 (o cancela), `NetworkManager.disconnect()` desconecta limpiamente la sala provisional para que nadie entre mientras se modifican ajustes.
  - **Estructuración en 2 Fases Claras para el Invitado (Guest / Join Room)**:
    - Reorganizada la pestaña *Join Room (Guest)*:
      - **Fase 1**: 🧙‍♂️ *Elige tu Campeón Místico (Guest)*: Showcase panorámico completo y selector de miniaturas situado en primer plano.
      - **Fase 2**: 🔑 *Código de Sala & Conectar*: Cuadro de texto para pegar el código `GO-XXXX` y botón `Connect 🚀`.
    - Elimina la confusión previa donde los jugadores pulsaban conectar inmediatamente sin percatarse de que podían elegir su héroe favorito.
- **Fase 82: Reparación Integral del Modo Online P2P, Copiado Limpio de Códigos, Desbloqueo del Jugador 2 y Corrección de Fondos (`NetworkManager.ts`, `SVGRenderer.ts`, `OnlineController.ts`, `HUDController.ts`, `GameController.ts`, `layout.css`, `KeyboardController.ts`)**:
  - **Fix de Emparejamiento P2P**: Sincronización robusta sin condiciones de carrera con delay de 500ms tras `GUEST_JOINED`.
  - **Desbloqueo de Blancas**: `isActionAllowed()` dinámico en `.interactive-layer` de `SVGRenderer.ts`.
  - **Copiado Limpio de Códigos**: Copiado exclusivo de `GO-XXXX`.
  - **Fondos de Combate**: Normalización de alias para evitar fondos negros.
- **Fase 81: Placa de Madera Tradicional CRAZY GO y Unificación de Tamaños de Fuente (`index.html`, `base.css`, `MenuCameraController.ts`)**:
  - **Placa Tradicional de Madera Tallada (*Gaku / Kagami-ita*)**: Sustituido el texto plano flotante "CRAZY GO" por una placa de madera lacada de cedro tradicional con letras grabadas en pan de oro y piedras de Go incrustadas en los laterales (`title_board_crazy_go.png`). Totalmente integrada con la iluminación del dojo, no interactuable (`pointer-events: none; user-select: none;`), sin hover ni clics.
  - **Unificación Tipográfica Total (1.35rem)**: Todos los rótulos espaciales interactivos del menú principal (`ROGUELIKE`, `LOCAL`, `ONLINE`, `STORY`, `FEEDBACK`, `TUTORIAL`, `OPTIONS`) fueron estandarizados a un tamaño uniforme de `font-size: 1.35rem` con peso `font-weight: 900` y sombras volumétricas consistentes.
- **Fase 80: Rediseño Borderless de Modo Online / Setup, Fuego Rojo Puro en Hard y Limpieza de Raíz (`carousel.css`, `online.css`, `options.css`)**:
  - **Llama de Dificultad Hard 100% Roja Carmesí (`carousel.css`)**: Se corrigió el filtro de la llama de dificultad Hard (`.flame-hard`) ajustando `hue-rotate(-60deg) saturate(6) brightness(0.9)` con resplandor carmesí (`drop-shadow(0 0 16px rgba(239, 68, 68, 1))`), erradicando cualquier matiz anaranjado y logrando un fuego rojo de sangre intenso y vivo.
  - **Eliminación de Cajas y Bordes Rígidos en Showcase de Campeones (`carousel.css`)**: Se eliminó la caja contenedora rectangular oscura de `.hero-showcase-card`, transformándola en un layout transparente y abierto. El retrato del héroe flota con aura dorada suave y las habilidades y miniaturas se presentan en tarjetas/píldoras de cristal translúcido con desenfoque de fondo (`backdrop-filter: blur(12px)`).
  - **Modernización y Apertura del Modo Online Inicial (`online.css`, `options.css`)**:
    - Se rediseñó el contenedor `.modal-online` con gradiente radial atmosférico y desenfoque de 28px sin bordes opacos pesados.
    - Se aligeraron las tarjetas de selección `.btn-choice-card` eliminando el borde grueso de 2px y aplicando esquinas de 20px, elevación suave y micro-resplandor dinámico en hover y selección activa.
    - Se modernizó el banner de código de sala `.room-code-banner` y las tarjetas de slots del lobby `.online-slot-card` con estética de cristal tintado.
    - Elevado el muñeco y el texto del Dojo Tutorial (`#btn-menu-dojo`) 10px en su contenedor (`top: calc(47% - 10px)`) y 25px hacia arriba en su texto `TUTORIAL` (`transform: translateY(-25px)`) para aproximarlo a la base del icono muñeco.
    - Elevado el mapa y texto de Roguelike (`#btn-menu-roguelike`) y su soporte (`#furniture-stand`) 10px de altura y 10px en su etiqueta `ROGUELIKE`.
    - Farolillos **Local** (`#btn-menu-free`) y **Online** (`#btn-menu-online`) aumentados un 10% en escala/hitbox (`width: 10%; height: 31%`), y el farolillo Online desplazado **30px a la derecha** (`left: calc(15% + 30px)`).
  - **Limpieza y Organización de la Raíz del Proyecto**:
    - `DEVLOG_ITCHIO_DAY9.md` reubicado en `docs/devlogs/`.
    - `oni_generator.ts`, `scratch_normal_jpg_head.png` y `scratch_normal_png_head.png` reubicados en `scratch/`.
    - `cover_itch.jpg` reubicado en `public/`.
    - Eliminada carpeta residual `__pycache__/`.
  - **Fallo Crítico Resuelto: Habilidad del Alquimista y Modales Invisibles (`modal-story.html`, `SVGRenderer.ts`, `ModalManager.ts`)**:
    - **Solución al Event Bubbling del Tablero**: En `SVGRenderer.ts`, el clic sobre el hitbox de las piedras (`hitArea`) propagaba el evento hasta el contenedor `<svg>`, lo que disparaba el listener global de respaldo y ejecutaba la habilidad objetivo dos veces simultáneas, corrompiendo las promesas de resolución. Se corrigió añadiendo `e.stopPropagation()` en el listener original.
    - **Solución al HTML Roto (Modales Fantasma)**: Aunque el modal de selección de color se abría por código y mostraba las clases CSS correctas, el archivo `modal-story.html` no tenía las etiquetas de cierre `</div>` finales. Esto provocaba que Vite anidara automáticamente los modales de Color Picker y Combat Log *dentro* del contenedor padre del Modo Historia. Como el Modo Historia estaba oculto (`.hidden`), forzaba la invisibilidad de todo su contenido sin importar el `z-index`. Se restauraron los cierres HTML, permitiendo de nuevo la visibilidad de todas las ventanas modales de la interfaz de partida.

### Sesión Anterior (Sesión 134)
- **Fase 79: Corrección del Alcance de la Tecla Escape (`KeyboardController.ts`)**:
  - **Causa Raíz Solucionada**:
    1. Al tener abierto el modal de Feedback (`#feedback-modal`), presionar `Escape` no cerraba el modal si un `<input>` o `<textarea>` tenía el foco debido a la exclusión global de inputs. Si no tenía foco, la tecla `Escape` caía en el listener del Menú Principal abriendo el modal de Opciones por debajo o por encima del feedback.
    2. El listener de `Escape` para abrir Opciones estaba activo de forma global en el Menú Principal, cuando únicamente debe poder abrirse en combates y expediciones roguelike.
  - **Solución Aplicada**:
    - **Modal de Feedback**: `Escape` ahora detecta de forma prioritaria el modal de feedback (incluso si el cursor está escribiendo dentro de los campos de texto del formulario), desenfoca el input (`blur()`), cierra el modal limpiamente (`ModalManager.closeFeedbackModal()`) y devuelve el control al menú sin abrir ninguna otra ventana.
    - **Menú Principal**: Eliminada la apertura del modal de Opciones con `Escape` en el Menú Principal.
    - **Apertura Restringida de Opciones**: `Escape` para abrir el menú de Opciones / Pausa solo se activa en **combates activos** (`game-screen`) y en **expediciones Roguelike** (mapa `roguelike-map-screen`, combates roguelike, tiendas, santuarios y eventos).

### Sesión Anterior (Sesión 133)
- **Fase 78: Reparación del Flujo de la Tecla Escape en Partida (`KeyboardController.ts`, `OptionsModalRenderer.ts`)**:
  - **Causa Raíz Solucionada**: Al presionar `Escape` en combate mientras se apuntaba una habilidad o se tenía un poliminó seleccionado, en vez de deseleccionarlo abría forzosamente el modal de Opciones, y al cerrarlo no se refrescaba la capa interactiva del SVG, dejando los clics en el tablero bloqueados.
  - **Solución Aplicada**:
    - `KeyboardController.ts`: `Escape` en combate ahora actúa con jerarquía ergonómica:
      1. Cierra el modal de registro de combate (`modal-combat-log`) si está abierto.
      2. Cierra el selector de color del Alquimista si está abierto.
      3. Cancela el modo de habilidad activa si está apuntando (`InteractionManager.toggleChampionActiveSkill`).
      4. Cancela y deselecciona cualquier poliminó activo (`PolyominoManager.activePolyomino = null`).
      5. Quita la pista táctica del Ojo del Maestro si está activa.
      6. Cierra el menú de Opciones si ya está abierto.
      7. Abre el menú de Opciones / Pausa si nada de lo anterior estaba activo.
    - `OptionsModalRenderer.closeOptionsModal()`: Ahora reactiva `isInteractive = isLocalPlayerTurn()`, actualiza el HUD y re-renderiza el tablero al cerrar el menú de opciones.

### Sesión Actual (Sesión 132)
- **Fase 77: Rediseño Minimalista, Flotante y Borderless de Lección Completada con Botón 2-en-1 (`modal-tutorial.html`, `tutorial.css`, `TutorialManager.ts`)**:
  - **Eliminación Total de Contenedores Rígidos**: Se erradicó el recuadro rígido con borde amarillo grueso (`2px solid #f59e0b`), el fondo opaco de tarjeta y las cajas anidadas toscas. Se sustituyó por un panel flotante y etéreo sobre el Goban (`.tutorial-complete-pane`), acompañado de un desenfoque cinemático ambiental (`backdrop-filter: blur(16px)`).
  - **Emblema de Honor Zen Refinado**: Sustituido el emoji genérico de fiesta por un medallón zen circular con resplandor dorado pulsante (`.tutorial-complete-emblem-glow`), estrella rúnica `✦` y halo místico.
  - **Tipografía y Jerarquía Minimalista**:
    - Overline sutil y distinguido `✦ LECCIÓN N COMPLETADA ✦` en dorado ámbar con `letter-spacing: 0.24em`.
    - Título oriental prominente con formato numérico y nombre de la lección completada (ej. `7. Captura Snapback (Uttegaeshi)`).
    - Subtítulo fluido y conciso con soporte de localización bilingüe (ES/EN).
  - **Botón 2-en-1 de Avance Rápido (`#btn-tutorial-next`)**: Se unificó la información y previsualización de la siguiente lección directamente en el botón de acción principal. Incluye el kicker superior (`SIGUIENTE LECCIÓN ➔` / `NEXT LESSON ➔`), el título completo con número (ej. `8. Seki (Vida Mutua)`), y el atajo de teclado integrado `[↵ Enter]`.
  - **Acciones Secundarias Ghost Glassmorphism (`#btn-tutorial-replay`, `#btn-tutorial-list`)**: Botones semitransparentes elegantes para Repetir `[R]` y volver a la Lista del Dojo `[Esc]`.
  - **Feedback Acústico**: Disparo de la fanfarria de victoria armónica `SoundFX.playVictoryFanfare()` al completar cada lección.

### Sesión Anterior (Sesión 131)
- **Fase 76: Acceso Universal al Menú de Opciones con ESC (`KeyboardController.ts`)**:
  - **Comportamiento Unificado**: Al presionar la tecla `Escape` (`Esc`) en cualquier momento durante un combate, dentro de un evento de run (tienda, santuario, encuentro misterioso), en la pantalla de elección de recompensas, en la selección de caminos o en el mapa de una expedición roguelike (así como en el menú principal), se abre inmediatamente el modal de Opciones / Ajustes (`ModalManager.openOptionsModal()`).
  - **Cierre Rápido / Toggle**: Si el modal de opciones ya se encuentra abierto en pantalla, presionar `Escape` o `Enter` lo cierra de inmediato devolviendo el control a la pantalla anterior sin interrumpir la partida.
- **Fix & Trazabilidad Exhaustiva de Habilidad del Alquimista en 4P (`SVGRenderer.ts`, `ChampionManager.ts`, `AlchemistChampion.ts`, `ModalManager.ts`)**:
  - **Fallback Global de Clic en SVG**: Se implementó un listener de respaldo a nivel del elemento `<svg>` en `bindSvgGlobalEvents()` para capturar clics de habilidad sin depender exclusivamente de `hitArea` ni verse afectado por solapamientos de capas.
  - **Trazabilidad en Consola**: Se añadieron `console.log` estructurados con el prefijo `🎯` a lo largo de toda la cadena (desde la detección del clic, paso por `ChampionManager`, apertura del modal de selección de color de 4P, hasta la transmutación y resolución de capturas).

### Sesión Actual (Sesión 130)
- **Fase 75: Rediseño Integral de Efectos de Sonido (SoundFX) y Banda Sonora Ambiental por Escenario (BGMGenerator)**:
  - **1. Desbloqueo Robusto y Universal de Web Audio (`SoundFX.ts`)**:
    - **Causa Raíz Solucionada**: La guarda estricta `hasUserInteracted` silenciaba llamadas directas de sonido si el usuario interactuaba directamente en elementos con `stopPropagation` o antes de registrarse los listeners pasivos.
    - **Solución Aplicada**: `SoundFX.getContext()` ahora inicializa y reanuda el `AudioContext` de forma limpia y transparente en cualquier interacción activa, garantizando reproducción inmediata sin silencios.
  - **2. Síntesis Acústica Mejorada de Colocación de Piedras y Poliminós (`SoundFX.ts`, `SVGRenderer.ts`, `PolyominoManager.ts`)**:
    - **Impacto "Pachik!" Canónico (`playPlaceStone`)**: Golpe acústico realista de doble componente (clic percusivo brillante de piedra mineral/pizarra + resonancia cálida de madera de Kaya y thump de masa).
    - **Colocación de Poliminós (`playPolyominoPlace`)**: Sonido masivo y contundente para bloques de piedra tallada (Duplicidad 2x1 con impacto gemelo, Monolito 2x2 con impacto colosal y retumbar de tierra).
  - **3. Feedback Acústico para Habilidades Activas y Pasivas de Campeones (`SoundFX.ts`, `InteractionManager.ts`, `ChampionManager.ts`, `KitsuneVFX.ts`, `RyujinChampion.ts`, `RoninChampion.ts`, `HimikoChampion.ts`)**:
    - **Activación y Cancelación en HUD**: Chime místico de energía Qi al activar modo apuntar (`playSkillActivate`) y tono suave de cancelación (`playSkillDeactivate`).
    - **Kitsune (Escudo Divino)**: Concesión con campana sacrosanta dorada (`playDivineShieldCast`), aura visual dorada unificada y crujido cristalino al romperse (`playDivineShieldShatter`).
    - **Alquimista (Inversión Cromática)**: Trazo de pincel caligráfico y campana alquímica de transmutación (`playAlchemicalTransmute`).
    - **Ryūjin (Furia del Dragón)**: Bramido de dragón al consolidar 2 ojos y llamarada ardiente calcinante (`playDragonFlame`).
    - **Ronin (Filo del Samurai)**: Tajo veloz de katana y viento afilado (`playKatanaSlash`).
    - **Himiko (Lluvia Pétrea)**: Cascada de cometas pentatónicos celestiales (`playCelestialDrop`).
    - **Tengu (Lluvia Meteórica)** y **Jefe Final (Aliento Calcinante)**: Silbido ardiente y detonación subsónica garantizada (`playMeteorImpact`, `playBossDragonBreath`).
  - **4. Banda Sonora y Atmósfera Acústica Adaptativa por Escenario (`BGMGenerator.ts`, `GameController.ts`, `types/index.ts`)**:
    - **Sintetizador Ambiental Procedural Multicapa**: Capas generativas en vivo adaptadas a cada campo de batalla.
  - **5. Fix Definitivo de Clic en Habilidad del Alquimista (`SVGRenderer.isActionAllowed`)**:
    - **Causa Raíz Solucionada**: `SVGRenderer.isActionAllowed()` tenía la comprobación `if (!this.isInteractive) return false;` en la línea 69, antes de evaluar `isTargeting` en las líneas 70-73. Aunque el hover preview y los círculos discontinuos se dibujaban en el SVG, al hacer clic sobre cualquier piedra para seleccionarla, `isActionAllowed()` devolvía `false` y abortaba el evento antes de llegar a `handleNodeClick` y `ModalManager.openColorPickerModal()`.
    - **Solución**: `isActionAllowed()` ahora evalúa `if (isTargeting || isDevSandbox) return true;` antes de cualquier bloqueo de interactividad, permitiendo que el clic abra el modal de color picker y transmute la piedra sin impedimentos en cualquier modo de 4 jugadores.
      - **Máscara Oni y Vacío (`oni`, `void`)**: Resonancia abisal dimensional y campana budista sombría.
- **Fase 75: Fix de Fondos Negros en Combate (`HUDController.ts`, `GameController.ts`, `layout.css`)**:
  - **Causa Raíz Solucionada**: Al iniciar una partida con ciertas formas de tablero (`volcano`, `oni`, `sky`), `GameController.initGame()` sobrescribía `activeBg` con el nombre de la forma del tablero (`'volcano'`, `'oni'`, `'sky'`), ignorando la elección de fondo del usuario. `HUDController.setBoardBackground` intentaba cargar `./bg_volcano.jpg`, `./bg_oni.jpg`, etc., que no existen en `/public`, produciendo un error 404 y dejando el fondo del combate en negro absoluto. Además, `layout.css` contenía rutas relativas `../bg_*.jpg` obsoletas.
  - **Solución Aplicada**:
    - `HUDController.setBoardBackground`: Se implementó un diccionario normalizador que mapea alias (`volcano` $\to$ `boss`, `dojo` $\to$ `combat`, `zen` $\to$ `tutorial`, `void` $\to$ `story`, `oni`/`sky` $\to$ `combat`) asegurando que siempre resuelva a una imagen JPG real existente en `/public`.
    - `GameController.initGame`: Se eliminó la sobrescritura destructiva de `activeBg`. Ahora respeta plenamente el fondo elegido por el jugador en la configuración de la partida (`config.background`), usando `boss` solo como fallback si el mapa es volcánico.
    - `layout.css`: Corregidas las rutas a `./bg_*.jpg` y añadidos selectores de alias (`#board-viewport[data-bg="volcano"]`).

### Sesión Anterior (Sesión 129)
- **Fase 74: Fix Multijugador Online — Copiar Código, Emparejamiento P2P y Botón Next (`OnlineController.ts`, `NetworkManager.ts`, `modal-online.html`)**:
  - **1. Copiar solo el código `GO-XXXX` (`OnlineController.copyRoomLink`, `modal-online.html`)**:
    - **Antes**: El botón "Copy Link" copiaba la URL completa (`http://127.0.0.1:5174/?join=GO-1127`), que es inútil para compartir en chats porque incluye el host local.
    - **Solución**: `copyRoomLink()` ahora siempre copia únicamente el código de sala (`GO-XXXX`) independientemente del entorno (local, itch.io, producción). El texto del botón cambia a "Copy Code" / "Copiar Código".
  - **2. Fix de Emparejamiento Online P2P — Condición de Carrera (`NetworkManager.ts`)**:
    - **Causa Raíz Solucionada (doble disparo de `startGame`)**: `onPeerJoin` del host llamaba a `startGame()` con delay 200ms. Luego el guest enviaba `GUEST_JOINED`, y el host volvía a llamar `startGame()` en `handleHostIncomingMessage`. Esto creaba una condición de carrera donde `START_GAME` podía llegar al guest antes de que su canal de datos WebRTC estuviera completamente negociado.
    - **Solución**: `onPeerJoin` del host ya NO llama `startGame()`. Solo reserva el slot y envía `INIT_GAME`. `startGame()` se lanza **únicamente** cuando el host recibe `GUEST_JOINED` (confirmando que el canal del guest está activo), con delay aumentado a **500ms** para dar margen a la negociación ICE/DTLS.
    - **Causa Raíz Solucionada (bucle de handshake)**: `GUEST_JOINED` y `HERO_SELECT` compartían el mismo `case`, por lo que `HERO_SELECT` (enviado por el guest en respuesta a `INIT_GAME`) también llamaba `startGame()` de nuevo, potencialmente lanzando otro ciclo.
    - **Solución**: Separados en dos `case` distintos. `HERO_SELECT` solo actualiza el `heroId` del slot y hace `broadcastLobbyUpdate()`; nunca llama `startGame()`.
    - **Causa Raíz Solucionada (HERO_SELECT duplicado del guest)**: El guest enviaba `sendHeroSelect()` cada vez que recibía `INIT_GAME` (podía ocurrir dos veces). Añadida guard en `handleClientIncomingMessage`: `sendHeroSelect` solo se envía la primera vez que se recibe `INIT_GAME` (cuando `currentConfig === null`).
  - **3. Corrección de Navegación del Wizard: Botón "Next ➔" Contextual (`modal-online.html`, `OnlineModalRenderer.ts`)**:
    - **Causa Raíz**: Al eliminar el botón `Next` globalmente, el anfitrión (Host) no podía avanzar del paso 2 (Board) a los pasos 3 (Champion), 4 (Scenery) y 5 (Lobby).
    - **Solución Aplicada**: 
      - En la pestaña **"Create Room (Host)"**: El botón `Next ➔` está **activo y visible** en los pasos 1, 2, 3 y 4 (y se oculta automáticamente en el paso 5 del Lobby).
      - En las pestañas **"Join Room (Guest)"** y **"Buscar Partida (Matchmaking)"**: El botón `Next ➔` y `◀ Back` se **ocultan al 100%**, dejando únicamente el botón nativo `Connect 🚀` / `Cancelar` para evitar que los invitados se confundan de botón.

### Sesión Anterior (Sesión 128)
- **Fase 73: Fix Crítico — Habilidad del Alquimista Bloqueaba Clics en Piedras en Partidas 4P (`SVGRenderer.ts`)**:
  - **Causa Raíz Solucionada**: Al activar la habilidad del Alquimista en un contexto de 4 jugadores (modo `custom` con slots), `render()` reconstruía la capa interactiva del SVG (`interactive-layer`) con `pointer-events: none` porque en ese instante `isInteractive` era `false` (el estado dejado por el turno de la IA anterior). Aunque `isActionAllowed()` devolvía `true` (ya que `currentTargetingMode !== 'none'`), el atributo CSS de nivel de grupo bloqueaba físicamente todos los eventos de clic antes de que llegaran a los listeners individuales de nodo.
  - **Solución Aplicada** (`SVGRenderer.ts`, líneas 1210-1217): La condición de `pointer-events: none` ahora verifica conjuntamente `!this.isInteractive && ChampionManager.currentTargetingMode === 'none'`. Si hay una habilidad en modo targeting activo, la capa siempre recibe eventos de puntero, permitiendo al Alquimista (y a cualquier otro campeón activo) clicar en el tablero para seleccionar su objetivo.
  - **Alcance del Fix**: Protege todos los campeones con habilidades activas de objetivo (Alquimista, Kitsune, Tengu) en cualquier modo de juego donde `isInteractive` pueda ser `false` en el momento de activar la habilidad.

### Sesión Anterior (Sesión 127)
- **Fase 72: Desbloqueo Proactivo de Web Audio y Supresión Total de Advertencias de Autoplay (`SoundFX.ts`, `MenuCameraController.ts`, `main.ts`)**:
  - **1. Supresión de Warnings de Autoplay en Carga Pasiva (`SoundFX.ts`)**:
    - **Causa Raíz Solucionada**: `MenuCameraController.ts` ejecutaba `SoundFX.playPlaceStone()` en eventos `mouseenter` / `focus` de la interfaz antes de que el usuario realizara un clic o gesto de interacción en la ventana. El navegador suspendía el `AudioContext` y emitía advertencias repetidas en la consola.
    - **Solución Aplicada**: Se implementó una guarda `hasUserInteracted` en `SoundFX.getContext()`. Si el usuario no ha realizado un gesto activo (clic, toque táctil o pulsación de tecla), las llamadas pasivas retornan `null` limpiamente sin tocar `AudioContext`, eliminando el 100% de los mensajes de advertencia en consola.
  - **2. Desbloqueo Proactivo en el Primer Gesto de Usuario (`SoundFX.ts`)**:
    - Se agregaron listeners globales de primer gesto (`click`, `keydown`, `pointerdown`, `touchstart`) que inicializan y reanudan el `AudioContext` de forma limpia dentro del evento confiable del navegador, garantizando que el audio suene con fidelidad total desde la primera interacción.
  - **3. Regeneración de Paquetes Distribuibles (`crazy_go_itchio_v14_browser.zip` y `crazy_go_windows_v14.zip`)**:
    - Re-empaquetado oficial completado con código limpio y sin errores.

### Sesión Anterior (Sesión 126)
- **Fase 71: Optimización de Relays MQTT y Arbitraje Determinista de Matchmaking (`NetworkManager.ts`, `OnlineController.ts`, `SoundFX.ts`)**:
  - **1. Depuración de Brokers MQTT y Eliminación de Bloqueos de Conexión (`NetworkManager.ts`, `OnlineController.ts`)**:
    - **Causa Raíz Solucionada**: Al incluir brokers caídos, con rutas no estándar o bloqueados regionalmente (`shiftr.io` cerrado, `mosquitto:8081/mqtt` ruta rechazada, `broker-cn`), Trystero esperaba indefinidamente (`Promise.all` sobre `client.once('connect')`), bloqueando la conexión WebRTC.
    - **Solución Aplicada**: Filtrada la lista de relays a los dos clústeres públicos MQTT de mayor velocidad y disponibilidad del mundo (`broker.emqx.io` y `broker.hivemq.com`), logrando conexión instantánea (<100ms) sin bloqueos.
  - **2. Arbitraje Determinista en Matchmaking (`OnlineController.ts`)**:
    - **Causa Raíz Solucionada**: En emparejamiento P2P, ambos peers recibían `onPeerJoin` a la vez y generaban salas privadas diferentes compitiendo por ser anfitriones.
    - **Solución Aplicada**: Implementado arbitraje por orden lexicográfico `selfId < peerId`: el peer con menor ID genera la sala privada y actúa como host, mientras el otro espera el mensaje y se une como invitado de forma 100% coordinada.
  - **3. Captura Segura de Autoplay de Audio (`SoundFX.ts`)**:
    - Controlada la promesa de reactivación de `AudioContext` con `.catch(() => {})` para evitar advertencias de consola previas a la interacción del usuario.

### Sesión Anterior (Sesión 125)
- **Fase 70: Reparación y Blindaje Integral del Registro de Combate y Repetición (`modal-combat-log.html`, `CombatLogModalRenderer.ts`, `KeyboardController.ts`)**:
  - **1. Apertura Grácil y Estado Vacío (*Zero-Crash Guarantee*) (`CombatLogModalRenderer.ts`)**:
    - **Causa Raíz Solucionada**: Al hacer clic en "Log" en el Menú Principal o antes de haber colocado piedras, `activeEntries.length === 0` abortaba silenciosamente y llamaba a `showAlert` en un contenedor oculto, impidiendo abrir el modal o usar el botón de "📂 Importar Replay".
    - **Solución Aplicada**: Ahora el modal abre siempre de manera segura. Si no hay partida previa, genera un estado visual limpio con instrucciones claras ("Sin Partida Activa"), permitiendo explorar, importar archivos `.cgo` / `.json` o volver sin errores.
  - **2. Blindaje de Teclado y Prevención de Fugas de Eventos (`KeyboardController.ts`)**:
    - **Causa Raíz Solucionada**: Al estar abierto el visor de repetición, pulsar `Espacio` (Play/Pausa) o flechas/WASD pasaba turnos o lanzaba hechizos en la partida de combate de fondo por falta de intercepción prioritaria.
    - **Solución Aplicada**: Añadido interceptor de primer nivel en `KeyboardController.ts` que captura `Espacio` (Auto-Play / Pausa), `◀ / A` (Paso anterior), `▶ / D` (Siguiente paso), `Home / End` (Inicio / Fin) y `Escape / L` (Cerrar registro), bloqueando cualquier acción accidental sobre la partida en segundo plano.
  - **3. Reactivación y Restauración de Tablero tras Cerrar (`CombatLogModalRenderer.ts`)**:
    - Al cerrar el modal, se reactiva limpiamente `isInteractive` en el `SVGRenderer` principal y se actualiza el HUD para que el flujo de combate continúe sin interrupciones ni bloqueos de interacción.

### Sesión Anterior (Sesión 124)
- **Fase 69: Diagnóstico de Consola y Blindaje de Multijugador Online P2P y Matchmaking**:
  - **1. Auditoría de Errores de Consola (`contentscript.js`, `lib.min.js`, `screen.orientation.lock`)**:
    - Se analizó el log de consola aportado por el usuario:
      - `contentscript.js:14083 MaxListenersExceededWarning / ObjectMultiplex`: Proviene de una extensión del navegador (ej. MetaMask / Web3 wallet) y es ajeno a Crazy Go.
      - `lib.min.js` / `screen.orientation.lock() NotSupportedError`: Proviene del contenedor de alojamiento web (ej. itch.io) al intentar fijar la orientación en dispositivos de escritorio (API no soportada en desktop).
      - `index-*.js ✅ UI Templates cargados correctamente vía Vite ?raw`: El core del juego inicializa de forma limpia y 100% libre de errores.
  - **2. Corrección Crítica en Matchmaking Automático (`OnlineController.ts`)**:
    - **Causa Raíz Solucionada**: `import('trystero/mqtt')` cargaba un stub deprecado sin exportación de `joinRoom`, y `makeAction` devolvía un objeto `{ send, onMessage }` en lugar de una tupla array, provocando fallos en la búsqueda de partidas.
    - **Solución Aplicada**: Migrado a importación tipada directa de `@trystero-p2p/mqtt`, suscripción correcta vía `matchAction.onMessage` / `matchAction.send`, e inyección de la red de 5 brokers MQTT mundiales redundantes y servidores STUN/TURN (Google y OpenRelay).
  - **3. Integración de Broker Adicional y Soporte para Sandboxes / Iframes (`NetworkManager.ts`, `OnlineController.ts`)**:
    - Añadido el broker `wss://test.mosquitto.org:8081/mqtt` a las listas de relés de host y join en `NetworkManager.ts`.
    - Mejorada la función de copiar enlace (`copyRoomLink`) para que, si el juego está embebido en sandboxes como itch.io (`hwcdn.net`, `itch.zone`), copie limpiamente el código de sala `GO-XXXX` directamente en lugar de URLs de CDN no enrutables.

### Sesión Anterior (Sesión 123)
- **Fase 68: Máscara Oni 25x25 (Inhalación Omnidireccional, Resistencia 4+ y Portal Abisal Permanente)**:
  - **1. Grid 25x25 y Cuernos Demoníacos (`BoardGenerators.ts`, `SetupModalRenderer.ts`, `OnlineModalRenderer.ts`)**:
    - Escala ampliada a **25x25** (`board.size = 25`, `spacing = 24px`, ~465 intersecciones jugables) con cuernos altos en las esquinas superiores (`(2..5, 0..4)` y `(19..22, 0..4)`), hendidura central en V, cuencas oculares vacías de 3x2 (`(6..8, 8..9)` y `(16..18, 8..9)`), cavidad bucal (`(8..16, 16..17)` y `(9..15, 18)`) y barbilla escalonada.
    - Sincronizado el previsualizador del asistente local y lobby online para que muestre el rótulo real **"25x25 Máscara Oni"** y su conteo de intersecciones exacto.
  - **2. Portal Abisal Permanente en la Boca (`SVGRenderer.ts`, `SVGDefs.ts`, `vfx.css`)**:
    - Eliminados los anillos rotatorios y los colmillos; simplificado a un elegante portal dimensional estático con horizonte de sucesos, gradiente de abismo profundo `url(#oni-void-core)`, núcleo oscuro y resplandor púrpura-carmesí.
  - **3. Inhalación Gravitacional Omnidireccional y Devoración (`StageHazardManager.ts`, `OniVFX.ts`)**:
    - **Cadencia Canónica**: Cada **7 turnos por jugador (14 turnos totales)** (turnos 15, 29, 43, 57...).
    - **Regla de Cadenas Pesadas vs Débiles**:
      - **Cadenas Pesadas ($\ge 4$ piedras aliadas)**: Sólidas e inamovibles, inmunes a la succión.
      - **Piedras y Grupos Ligeros ($\le 3$ piedras aliadas)**: Atraídas vectorialmente desde todas las direcciones hacia las fauces de la boca $(12, 17)$ (arriba $\to$ abajo, abajo $\to$ arriba, izquierda $\to$ derecha, derecha $\to$ izquierda).
    - **Mecánica de Devoración**: Si una piedra ligera entra en la cavidad de la boca, **el Oni la DEVORA y absorbe** en el abismo (`isDevoured: true`), destruyendo la entidad y animándola implosionando a escala 0 con rugido demoníaco.
  - **4. Localización y Textos Actualizados (`translations.ts`, `log_crazy_go.md`)**:
    - Sincronizadas las descripciones y advertencias en español e inglés y registrado el diario de desarrollo en el log central.

### Sesión Anterior (Sesión 122)
- **Fase 67: Sistema Integral de Efectos Especiales (SFX Web Audio) y Normalización de Música BGM**:
  - **Topología Unificada 23x23 con Cuernos, Ojos y Fauces (`BoardGenerators.generateOniGrid`)**:
    - El tablero Máscara Oni se unifica en una majestuosa cuadrícula **23x23** (`board.size = 23`) independientemente de la opción 9/13/19 elegida en la interfaz.
    - Presenta **cuernos demoníacos superiores** en las esquinas superiores (`2..4, 0..3` y `18..20, 0..3`), hendidura frontal en V, **ojos vacíos 3x2** (`5..7, 7..8` y `15..17, 7..8`), **cavidad abismal de la boca** (`7..15, 15..17`) y barbilla escalonada.
  - **Portal del Abismo Infinito en la Boca (`SVGRenderer.renderOniMouthAbyss`, `SVGDefs.ts`, `vfx.css`)**:
    - Decoración permanente en la cavidad de la boca del Oni con anillos cósmicos rotatorios (`oniVoidSwirl`), núcleo de singularidad oscura, resplandor pulsante (`oniVoidPulseGlow`) y colmillos de marfil superiores e inferiores (`url(#oni-fang-grad)`).
  - **1. 🌪️ La Inhalación del Demonio y Devoración de Piedras Ligeras (`StageHazardManager.ts`, `OniVFX.ts`, `SoundFX.ts`)**:
    - **Cadencia Canónica y Debug**: Activación cada 10 turnos por jugador (20 turnos totales) en juego regular y cada **5 turnos totales** (turnos 6, 11, 16, 21...) en **Dev Mode**. Añadido botón de disparo directo `🌪️ Inhalación Oni (Vórtice)` en Sandbox.
    - **Física y Devoración en las Fauces**:
      - **Cadenas Pesadas ($\ge 3$ piedras aliadas)**: Tienen masa y cohesión suficiente para resistir el vendaval; **permanecen firmes e inmóviles**.
      - **Piedras Ligeras ($\le 2$ piedras, sueltas o parejas)**: Son arrastradas hacia abajo. Si entran o caen en la cavidad de la boca, **¡EL ONI LAS DEVORA Y ABSORBE!** (`isDevoured: true`), destruyendo la entidad y animándolas encogiéndose e implosionando en el vórtice de las fauces con rugido demoníaco. Si no caen en la boca, se deslizan 1 casilla abajo o frenan contra obstáculos.
      - **Recálculo de Libertades y Asfixia**: Resolución inmediata de capturas de grupos que queden con 0 libertades tras el movimiento.
  - **2. 🩸 El Festín de Almas (Turno Extra Consecutivo / Sente Supremo) (`GameState.ts`, `SVGRenderer.ts`, `PolyominoManager.ts`, `OniVFX.ts`, `SoundFX.ts`)**:
    - Al capturar 2 o más piedras a la vez, `GameState.advanceTurn(board, true)` otorga inmediatamente un turno extra consecutivo con destello carmesí en el standee y rugido místico.
  - **3. Determinismo Absoluto en Multijugador Online (`StageHazardManager.ts`)**:
    - Generador pseudoaleatorio determinista sincronizado (`getDeterministicRandom`) implementado para que Tableros Volcánico, Cielo y Oni se ejecuten con 0 desincronizaciones en P2P.

### Sesión Anterior (Sesión 120)
- **Fase 65: Rediseño Didáctico e Interactivo del Dojo Tutorial, Llamas Místicas Animadas en Roguelike y UI Glassmorphism Borderless**:
  - **Reestructuración Modular del Dojo Tutorial (`TutorialSteps.ts`, `TutorialManager.ts`, `tutorial.css`, `translations.ts`, `GameController.ts`)**:
    - **División Canónica en 2 Módulos Temáticos**:
      - `dojo.module_classic` (*Fundamentos del Go Tradicional*): Lecciones 1 a 9 dedicadas a reglas puras de Go (Libertades, Capturas, Ojos, Seki, Snapback, Suicidio, Ko y Territorio).
      - `dojo.module_special` (*Mecánicas de Crazy Go*): Lecciones 10 a 14 dedicadas a topologías destruidas, poliminós tácticos, magia de campeones y entidades neutrales del mapa.
    - **Rediseño Didáctico e Interactivo de Lecciones Clave**:
      - **Lección 7 (Snapback / Uttegaeshi)**: Diseñado el patrón canónico de herradura de 6 piedras y corregido el flujo de IA con `RulesEngine.tryPlaceStone` para evitar bloqueos del botón de avance.
      - **Lección 8 (Seki / Vida Mutua)**: Integración diegética del botón `[Pasar Turno]` (`.tutorial-show-pass-only`) para permitir al jugador resolver el Seki pasando turno con [P] o clic en el botón iluminado.
      - **Lección 4 (Ojos Falsos y Muerte / La Trampa de los 2 Ojos)**: Transformada de un texto estático a un problema interactivo paso a paso enfocado en la regla de los 2 ojos. El jugador ve 2 ojos aparentes, blanco asedia la esquina del Ojo 2 en Atari, y el jugador se ve forzado a jugar dentro de su propio ojo para salvar sus piedras, experimentando de primera mano la desaparición del ojo, quedándose con 1 solo ojo y condenando al grupo entero a morir.
      - **Lección 9 (Puntuación Final y Territorio / Reglas Japonesas)**: Corregidas las coordenadas históricas 0-indexadas por coordenadas válidas 1-indexadas en 9x9 (`1,1` a `9,9`). Se convirtió en un ejercicio interactivo donde el jugador sella la brecha de su muralla en `(3,4)` cercando 11 puntos de territorio, aprende cómo las piedras muertas en `(2,2)` suman +1 prisionero sin gastar turnos, el funcionamiento del Komi (+6.5 para Blancas), y el desglose de la fórmula de victoria japonesa.
      - **Lección 13 (Sinergias de Magia / Alquimista)**: Sustituido el ejemplo previo de la cruz (donde la piedra transmutada se suicidaba al instante) por un Tesuji de Inversión Cromática real: transmutar la piedra central `(5,5)` de un muro de corte enemigo captura y elimina instantáneamente las 2 piedras blancas adyacentes `(5,4)` y `(5,6)` por falta de libertades, conectando a Negras en una fortaleza viva con 8 libertades.
    - **Limpieza de Interfaz en Tutoriales**: Ocultación del botón de Registro de Combate (`#btn-game-combat-log`) en modo tutorial para maximizar el área de juego y concentración.
  - **Modernización Visual y Glassmorphism del Modal de Expedición Roguelike (`modal-rogue-setup.html`, `carousel.css`, `base.css`)**:
    - **Llamas Místicas Animadas por Dificultad (🔥)**: Sustituidos los puntos estáticos y subtítulos redundantes ("Beginner", "Warrior", "Master", "Supreme Dan") por **Llamas Elementales Animadas** con efecto de fuego parpadeante (`@keyframes flameFlicker`) y auras luminosas:
      - **Easy (Fácil):** Llama Verde Esmeralda Mística 🔥 (`flame-easy`).
      - **Normal:** Llama Ámbar / Dorada Solar 🔥 (`flame-normal`).
      - **Hard (Difícil):** Llama Roja Carmesí de Sangre 🔥 (`flame-hard`).
      - **Grandmaster (Gran Maestro):** Llama Púrpura del Vacío Supremo 🔥 (`flame-extreme`).
    - **Contenedores Sin Bordes Rígidos (*Borderless Glassmorphism*)**: Eliminación de bordes sólidos pesados y sustitución por fondos con desenfoque de cristal (`backdrop-filter: blur(28px)`), sutiles relieves de luz interior (`inset 0 1px 0 rgba(255, 255, 255, 0.1)`), degradados ambientales de cristal tintado en las cajas de habilidades activas y pasivas, y píldoras de héroe iluminadas suavemente.
  - **Reparación de Tipos y Generador de Tableros (`BoardGenerators.ts`, `OnlineController.ts`)**: Corregida la sintaxis de plantillas de texto en `BoardGenerators.generateOniGrid`, tipado de `OnlineGameConfig.slots` y corrección de imports dinámicos en `OnlineController.ts`.

### Sesión Anterior (Sesión 119)
- **Fase 64: Perfeccionamiento de Texturas 3D de Poliminós (2x1 y 2x2), Rotación [R] Reactiva y Mejora del Tutorial de Lluvia Meteórica y Hechizo Meteorito**:
  - **Demostración Práctica del Hechizo Meteorito en la Lección 12 del Tutorial (`TutorialSteps.ts`, `TutorialManager.ts`, `RogueliteManager.ts`, `translations.ts`)**:
    - **Solo 1 Piedra Blanca en Posición Inicial**: Se configuró exactamente 1 sola piedra blanca en `(4,4)` al inicio de la lección para que el Ejemplo 1 impacte infaliblemente en la piedra señalada sin desvíos inesperados a otra blanca.
    - **Mecánica Estocástica**: El Pergamino de Meteorito posee un **80% de probabilidad de golpear una piedra enemiga** y un **20% de probabilidad de desvío a una piedra aliada (fuego amigo)**.
    - **Dos Ejemplos Claros en el Tutorial**:
      1. *Ejemplo 1 (Acierto Seguro 100%)*: Al haber solo 1 piedra blanca hostil en `(4,4)`, el meteorito la destruye directamente.
      2. *Ejemplo 2 (Riesgo del 20% / Fuego Amigo)*: Muestra qué ocurre cuando hay piedras de ambos bandos en el Goban y el meteorito impacta por azar en una piedra propia aliada, introduciendo de inmediato el uso del pergamino **⏳ Rebobinar** para restaurar el tiempo y salvar la ficha.
    - **Fix Rebobinado en Tutorial y Animación Visual (`RogueliteManager.ts`)**:
      - `steps` en Rebobinado ahora se fija en `1` cuando el tutorial está activo (`isTutorial`), evitando que se deshagan 2 turnos de golpe y no resucite la primera piedra destruida en Ejemplo 1.
      - La lista `affectedStones` ahora recoge tanto piedras retiradas como piedras resucitadas/restauradas, disparando el portal celestial azul y las chispas mágicas (`triggerRewindStoneLift`) exactamente en la posición de la piedra restaurada.
  - **Mejora Integral de la Lección 11 del Tutorial (`TutorialSteps.ts`)**:
    - **Explicación Matemática y Mecánica de ☄️ Lluvia Meteórica (Tengu)**: Detallado que el área abarca el **25% del tablero** alrededor del epicentro (~20 casillas en 9x9) y descarga un bombardeo orbital proporcional (6 meteoros en 9x9, 13 en 13x13, 27 en 19x19).
    - **Probabilidad y Daño Indiscriminado (¡Fuego Amigo!)**: Se explica con total claridad que cada casilla tiene una probabilidad estocástica (~30% en 9x9) de recibir un impacto y que los meteoros **destruyen cualquier piedra desprotegida, sea enemiga o aliada**.
    - **Sinergias con Escudo Divino**: Se enseña que las piedras protegidas por **🛡️ Escudo Divino** (Kitsune / Pergamino de Escudo) son 100% inmunes al bombardeo.
    - Sincronizado en ambos idiomas (Español e Inglés).
  - **Textura de Bloque de Piedra Maciza para Duplicidad 2x1 (`SVGRenderer.ts`, `SVGGhostPreview.ts`)**:
    - Sustituida la silueta redondeada por un auténtico **bloque rectangular de piedra/pizarra esculpida** (`<rect rx="stoneRadius*0.35">`) con bisel 3D interior tallado (`rgba(255,255,255,0.28)`), hendidura central de sillería con sombra y luz en relieve, y cabezas de piedras de Go engastadas con brillo canónico. Se eliminó por completo el icono de texto emoji para lograr una estética limpia y puramente táctil.
  - **Textura de Aparejo de Ladrillos para Monolito 2x2 (`SVGRenderer.ts`, `SVGGhostPreview.ts`)**:
    - Sustituido el icono emoji `🧱` por una auténtica **textura de muro de ladrillos entrelazados (Running Bond Masonry)**:
      - 4 filas horizontales de ladrillos con juntas de mortero realistas, alternando 2 ladrillos enteros y combinaciones de medio ladrillo + ladrillo entero.
      - Cada ladrillo individual posee su propio bisel superior de luz 3D y sombra inferior de junta de mortero en relieve.
      - Remaches y anclajes dorados de sillería en las 4 intersecciones del tablero para marcar la cuadrícula táctica sin romper la estética de muro de ladrillos macizo.
  - **Resolución Crítica de la Tecla [R] (Doble Listener Global) (`KeyboardController.ts`, `main.ts`)**:
    - **Causa Raíz del Fallo**: `KeyboardController.init()` se estaba invocando dos veces (en `main.ts` y en `AppEventBinder.ts`), registrando dos listeners idénticos de `keydown`. Cada pulsación de `[R]` ejecutaba la rotación dos veces consecutivas en milisegundos (`horizontal` -> `vertical` -> `horizontal`), anulando el cambio de forma instantánea. El clic con el ratón funcionaba porque el botón del HUD solo tenía un listener registrado.
    - **Solución**: Añadida la guarda estática `isInitialized` en `KeyboardController.ts` y eliminado el llamado duplicado en `main.ts`. Ahora pulsar `[R]` rota de manera infalible y reactiva 90º exactamente una vez por pulsación.
  - **Nuevos Shaders y Gradientes Dedicados de Poliminós 3D (`SVGDefs.ts`, `SVGRenderer.ts`, `SVGGhostPreview.ts`)**:
    - Se crearon definiciones SVG específicas para cada color de jugador (`#poly-domino-body-1..4` y `#poly-monolith-body-1..4`) resolviendo la limitación de renderizado de gradientes radiales SVG en elementos `<line>` y `<rect>`.
    - La ficha Duplicidad 2x1 y el Monolito 2x2 ahora se renderizan con acabados pulidos en pizarra/obsidiana/nácar, iluminación cenital, brillo especular canónico y sombreado 3D unificado tanto en el tablero como en el *ghost preview*.
  - **Auto-Ajuste Robusto de Bordes y Esquinas para 2x2 (`PolyominoManager.ts`)**:
    - Implementada la función `fitsAt` que prueba exhaustivamente `(c, r)`, `(c - 1, r)`, `(c, r - 1)` y `(c - 1, r - 1)` para garantizar que el Monolito 2x2 encaje perfectamente en bordes y esquinas sin desbordar.
  - **Corrección de Ghost Preview Fantasma en Previsualización y Turno Rival (`SVGRenderer.ts`, `GameController.ts`)**:
    - **Modo Previsualización Desactivado (`isInteractive = false`)**: Desactivados eventos de ratón (`pointer-events: none`) y comprobación de `isActionAllowed()` en los SVGs de previsualización de tablero (Asistente Local, Lobby Online y Stage Preview), eliminando por completo el cursor y retícula de colocación de ficha al posar el cursor sobre la maqueta.
    - **Turno del Rival / IA**: En combate, cuando es el turno del oponente remoto o de la IA, `isActionAllowed()` evalúa `false`, evitando que aparezca la piedra fantasma o cursor de colocar piedra en casillas vacías cuando no es el turno del jugador local.
  - **Icono, Tooltip y Banner de Advertencia de Máscara Oni (`index.html`, `HUDController.ts`, `modal-local-setup.html`, `modal-online.html`, `SetupModalRenderer.ts`, `OnlineModalRenderer.ts`, `translations.ts`, `hud.css`, `StageHazardManager.ts`)**:
    - **Activación en MODO DEBUG (Rondas 3, 6 y 9 / 3b, 6b, 9b)**:
      - *Fase 1 (Fin de 3b / turno 7 en 2P)*: El Oni despierta y la columna central inferior se calcina en lava fundida.
      - *Fase 2 (Fin de 6b / turno 13 en 2P)*: La lava se ensancha a las columnas laterales izquierda y derecha dividiendo el tablero.
      - *Fase 3 (Fin de 9b / turno 19 en 2P)*: Infierno desatado, expandiendo la destrucción.
    - **Banner Prominente en Previsualización (`.setup-board-hazard-banner`)**: Añadida una tarjeta de advertencia permanente, nítida y destacada debajo de la previsualización del goban en el Asistente Local y Lobby Online explicando la mecánica con icono y color diferenciado.
    - **Icono Interactivo `👹` en HUD de Combate**: Visible en tiempo real de forma inmediata y síncrona en la barra superior con animación de pulso y tooltip explicativo.
  - **Soporte de Agrupación en Modo Sandbox (`SandboxController.ts`)**:
    - Asignado `polyGroupId` uniforme a las piedras colocadas con los pinceles de Dominó y Monolito para que se rendericen como piezas unificadas en el laboratorio de pruebas.

- **Fase 63: Optimización del Menú Sandbox (Testing Lab) y Tablero Máscara Oni**:
  - **Rediseño Ergonómico del Panel Sandbox (`modal-sandbox.html`, `sandbox.css`, `SandboxController.ts`, `OptionsEventBinder.ts`)**:
    - **Lanzador Completo de Habilidades y Depuración Total (`SandboxController.ts`, `modal-sandbox.html`, `OptionsEventBinder.ts`)**:
      - Añadido el **Alquimista** al selector de campeones en caliente del Sandbox (ahora los 8 campeones están presentes: Normal, Tengu, Himiko, Kitsune, Ronin, Ryūjin, Alquimista, Dragón Sabio).
      - **Fix en "Activar Habilidad Activa"**: Ahora detecta correctamente las habilidades de cada héroe (incluyendo Transmutación del Alquimista, Escudo Divino de Kitsune, Lluvia Meteórica de Tengu, Llamas de Ryūjin, Rebobinados de Normal, etc.) otorgando 99 cargas instantáneamente y configurando el modo de apuntar preciso.
      - **Lanzador Directo de TODOS los Poderes**: Añadidos botones independientes para disparar cualquier poder en cualquier momento sin necesidad de cambiar de héroe:
        - `☄️ Meteoro 5x5 (Tengu)`
        - `🛡️ Escudo Divino (Kitsune)`
        - `⚗️ Transmutación (Alquimista)`
        - `🐉 Llamas de Ryūjin (Ryūjin)`
        - `🗡️ Corte Katana (Ronin)`
        - `🌧️ Lluvia Pétrea (Himiko)`
        - `🔥 Quema 25% (Boss Dragón)`
        - `⏳ +5 Rebobinados (Normal)`
        - `🔄 Pasar Turno (Pass)`
    - **Header Compacto con Cierre Rápido y Pincel**: Añadido botón de cierre `✖` en la cabecera superior y toggle conciso `🖌️ Pincel ON` / `OFF` que no deforma el título.
    - **Barra de 4 Pestañas en Grid 4x1**: Pestañas `🖌️ Pinceles`, `🗺️ Tablero`, `🎯 Pruebas`, `⚡ Poderes` distribuidas al 100% de ancho sin desbordamiento horizontal ni texto cortado.
    - **Cuadrículas y Botones Optimizados**:
      - Campeones en grid 4 columnas con etiquetas concisas.
      - Hechizos de héroe compactos en 2 columnas con bordes y brillos temáticos.
      - Pinceles organizados en categorías (Piedras, Poliminós, Entidades, Terrenos).
      - Altura e interactividad adaptada dinámicamente (`clamp(340px, 25vw, 410px)` y `calc(100vh - 70px)`) para permitir probar elementos y colocar en el Goban simultáneamente.
  - **Topología Dinámica "Máscara Oni" (`BoardGenerators.ts`, `StageHazardManager.ts`, `types/index.ts`, `SetupEventBinder.ts`, `SetupModalRenderer.ts`, `OnlineEventBinder.ts`, `OnlineModalRenderer.ts`)**:
    - Forma de máscara demoníaca con frente hendida, ojos y boca hueca.
    - Peligro ambiental: A partir de la ronda 30 escupe lava verticalmente dividiendo el tablero inferior en dos mitades con animación de fuego y capturas automáticas.
    - **Fix Selección en Asistente de Partida y Online**: Añadido el evento de clic y la sincronización de estado activo en `SetupEventBinder.ts`, `SetupModalRenderer.ts`, `OnlineEventBinder.ts`, `OnlineModalRenderer.ts` y `modal-online.html`.

- **Fase 62: Fix Definitivo — Habilidad del Alquimista en 4 Jugadores, Rotación [R] y Auto-Ajuste de Duplicity (2x1), Texturas 3D de Monolith (2x2) y Matchmaking + Lobby Libre**:
  - **Habilidad del Alquimista en 4P (`AlchemistChampion.ts`, `ChampionManager.ts`, `ModalManager.ts`, `modal-color-picker.html`)**:
    - **Causa Raíz Solucionada**: Cuando el usuario pulsaba la habilidad del Alquimista y hacía clic en una casilla vacía o cancelaba el modal de selección de color, se desactivaba prematuramente el modo de apuntado y se llamaba a `onSkillPlaced`, lo que forzaba el paso de turno a la IA o bloqueaba el tablero.
    - **Solución Aplicada**:
      - `openColorPickerModal()` ahora previene la propagación de eventos, soporta clic en el telón de fondo para cancelar y cierra de forma asíncrona limpia devolviendo `null`.
      - `AlchemistChampion.executeSkill()` distingue entre objetivo inválido (mantiene el modo activo y avisa con sonido/HUD) y cancelación voluntaria del modal (`cancelled: true`).
      - `ChampionManager.executeTargetedSkill()` mantiene el modo de apuntar activo tras un clic erróneo para que el jugador pueda clicar en la piedra deseada, y si se cancela el modal restaura la interactividad local sin avanzar el turno ni entregarlo a la IA.
      - Rediseñado `modal-color-picker.html` en cuadrícula 2x2 con botones interactivos elegantes para Negro (P1), Blanco (P2), Esmeralda (P3) y Amatista (P4) con soporte i18n completo (ES/EN).
  - **Piedras Especiales Duplicidad (Duplicity 2x1) y Monolito (Monolith 2x2) (`PolyominoManager.ts`, `GameController.ts`, `KeyboardController.ts`, `SVGRenderer.ts`, `SVGGhostPreview.ts`, `SVGDefs.ts`)**:
    - **Rotación con Tecla [R] y Clic en HUD**: Tecla `[R]` o `KeyR` rota la orientación horizontal ⇄ / vertical ⇅ al instante; hacer clic en el botón de Duplicidad en el HUD cuando ya está seleccionada también rota la ficha fluidamente.
    - **Auto-Ajuste Inteligente de Bordes**: Al apuntar en intersecciones de los bordes o esquinas del tablero, Duplicidad y Monolito auto-ajustan su orientación hacia el interior del Goban en lugar de fallar con error de fuera de límites.
    - **Texturas Visuales y Shaders 3D de Alta Fidelidad**:
      - *Duplicidad (2x1)*: Cápsula continua con gradiente de piedra de Go pulida, bisel perimetral (`#domino-bevel`), aros concéntricos de resonancia rúnica en ambos núcleos y conector central con runa `🀄` y resplandor místico.
      - *Monolito (2x2)*: Losa megalítica maciza de 4 piedras unificadas con sombra 3D profunda (`#monolith-shadow`), líneas interiores de talla rúnica en cruz, aros de anclaje de esquina y emblema titánico `🧱` con resplandor dorado (`#monolith-rune-glow`).
      - *Ghost Previews*: Previsualizaciones vectoriales nítidas en hover con indicadores de rotación `⇄ [R]` / `⇅ [R]`.
  - **Lobby Libre y Matchmaking Anónimo**:
    - **Buscar Partida**: Añadida interfaz de Matchmaking anónimo en el modal Online. Se conecta automáticamente a una sala de espera usando `trystero/mqtt` con prefijo temporal (`MATCHMAKING_{N}P_{HORA}`) para evitar salas colgadas. Una vez encontrados 2 jugadores, un jugador es elegido host temporalmente para generar un código privado `GO-XXXX`, enviarlo por el canal P2P y ambos se redirigen a la sala privada instantáneamente.
    - **Slots Híbridos (Lobby Libre)**: Actualizada la interfaz de Lobby (Host) para permitir configurar los slots individuales. El anfitrión puede asignar si un slot espera un rival Online (`human_remote`), es un jugador en el mismo PC local (`human_local`) o es controlado por la IA (`ai`).
    - **Sincronización de IA y Red (`NetworkManager.ts` y `GameController.ts`)**: Se actualizaron los estados del Lobby para reportar las IAs y jugadores locales extra como "Conectados", permitiendo empezar la partida aunque falten jugadores remotos. Se corrigió el bucle de IA en `GameController.checkAITurn()` (`this.isAISlot(this.state.currentPlayer)`) para garantizar que la IA local juegue sus turnos automáticamente incluso en partidas alojadas en la red.
  - **Zoom Global y Estabilidad TypeScript**:
    - Restaurado `ModalManager.setZoom` / `initZoom` con escalado `transform: scale()` sobre `#app` y 0 errores en compilación TypeScript y bundle de producción Vite.

### Sesión Anterior (Sesión 116)
- **Fase 61: Correcciones Críticas de UI, Zoom, Sandbox y 4 Jugadores**:
  - **Arreglo de Habilidades en 4 Jugadores (Alquimista)**: Corregido un bloqueo del estado de UI (`currentTargetingMode`) que ocurría cuando el usuario cancelaba el selector de color del Alquimista en partidas de 4 jugadores. Ahora el modal se cierra correctamente devolviendo `null` y `ChampionManager` restablece la interactividad sin consumir el turno.
  - **Modo Sandbox / Desarrollador Mejorado**: El clic en entidades cautivas (como Cofres y Monjes) ahora tiene prioridad absoluta sobre cualquier brocha activa del Sandbox y salta las restricciones de turno, permitiendo probar recompensas inmediatamente sin tener que rodear las entidades.
  - **Rediseño del Zoom Global**: Sustituida la propiedad `document.body.style.zoom` que desajustaba los SVG y creaba franjas negras. Ahora el zoom se aplica mediante `transform: scale(X)` sobre el contenedor `#app`, ajustando simultáneamente el `width` y `height` a `100/X vw` y `100/X vh` con `transform-origin: top left`, logrando un escalado limpio y manteniendo el centrado perfecto del tablero.
  - **Rediseño de la Interfaz del Sandbox**: Transformado el modal de Sandbox de una ventana bloqueante de pantalla completa a un panel lateral flotante sin telón de fondo (`pointer-events: none` en la envoltura, `pointer-events: auto` en el panel). Esto permite al jugador interactuar con la interfaz del Sandbox y simultáneamente pintar o interactuar con el tablero en vivo sin tener que abrir y cerrar el panel constantemente.
- **Nueva Topología y Mecánica Dinámica: Tablero del Cielo (`board.shape = 'sky'`) (`BoardGenerators.ts`, `SVGRenderer.ts`, `StageHazardManager.ts`, `SkyVFX.ts`, `SVGDefs.ts`, `board.css`, `hud.css`, `modal-local-setup.html`, `modal-online.html`, `translations.ts`)**:
    - **Animación VFX Suave y sin Sacudidas (`SkyVFX.ts`, `board.css`)**: Eliminada la sacudida de pantalla (`vfx-screen-shake`). Los 5 bloques descienden con una curva armónica suave de desaceleración gravitatoria (`cubic-bezier(0.22, 1, 0.36, 1)`), aterrizando con halos de luz celeste expansivos y partículas estelares sutiles.
  - **Refinamiento de la Pantalla de Continuar Expedición Roguelike (`RogueChoiceCameraController.ts`, `modal-rogue-choice.html`)**:
    - **Periodo de Gracia al Abrir (700ms)**: Bloqueado el hover automático inicial al abrir la pantalla para evitar que la posición del cursor en el menú principal (a la izquierda) fuerce inmediatamente el zoom sobre "NUEVA EXPEDICIÓN".
    - **Visibilidad Dual de Etiquetas en Estado Neutral**: En el encuadre neutral inicial (ambos caminos equilibrados 50/50), tanto *"NUEVA EXPEDICIÓN"* (`#fca5a5`) como *"CONTINUAR EXPEDICIÓN"* (`#34d399`) permanecen plenamente visibles y legibles en sus colores respectivos junto a sus subtítulos explicativos.
    - **Hover Dinámico Mejorado**: Al posar el cursor sobre un camino, ese camino se destaca con zoom, brillo y foco nítido, mientras que el otro atenúa suavemente su texto e ilustración.
  - **Aceleración y Respuesta Instantánea del Menú de Inicio (`MenuCameraController.ts`, `base.css`)**:
    - **Sincronización Inmediata de `transform-origin` (0ms)**: Eliminada la transición CSS sobre `transform-origin` para que el punto de pivote salte instantáneamente al nuevo icono sin derivas ni retrasos.
    - **Cámara 3D y Buffer Ultrarrápidos**: Reducida la transición de la cámara a **200ms** y el buffer de salida de 75ms a **15ms**.
    - **Transición de Objetos e Iconos**: Reducida a **180ms**, garantizando una navegación fluida, ágil e instantánea entre los iconos del dojo sin ningún retardo perceptible.

### Sesión Anterior (Sesión 115)
- **Rediseño Cinemático de la Pantalla de Continuar Expedición Roguelike (Escena 2.5D, Vistas Traseras, Gradación y Biblia de Prompts)**:
  - **Sustitución de Modal por Escenario 2.5D**: Pantalla completa interactiva dividida en dos caminos narrativos:
    - *Izquierda (Nueva Expedición / Regreso al Dojo)*: El héroe aparece de espaldas inclinado/girado sutilmente hacia el dojo (`scaleX(-1) rotate(-3deg)`), con paleta de color grisácea y atenuada que simboliza regresar a casa.
    - *Derecha (Continuar Expedición / Reanudar)*: El héroe aparece de espaldas avanzando hacia el sendero y los nodos de Go en colores saturados y brillantes (`saturate(1.25)`).
  - **Placa Central Informativa**: Card flotante con héroe activo, dificultad traducida y nodo/Tier actual en tiempo real con soporte bilingüe (ES/EN).
  - **Corrección de Eventos de Clic (`RogueChoiceCameraController.ts`)**: Eliminado el `cloneNode` que borraba los listeners, restaurando la activación instantánea al pulsar en ambos caminos.
  - **Biblia Maestra de Prompts Actualizada (`docs/ai_wiki/game_design/art_prompts_bible.md`)**: Documentados todos los prompts de frente y espalda para los 7 campeones, enemigos, escenarios y objetos 2.5D.

  - **Causa Raíz Eliminada**: En Windows/Chromium, al tener elementos 3D con `cursor: pointer` y atributos nativos `title="..."`, el subsistema de tooltips del sistema operativo intentaba preparar el tooltip nativo de Windows sobre capas de textura aceleradas por GPU, dibujando a la vez la flecha estándar del sistema y la mano de enlace (doble cursor superpuesto). Se eliminaron todos los atributos `title` nativos de los elementos espaciales del dojo.
  - **Sistema de Cursores Vectoriales SVG de Alta Resolución**:
    - **Cursor Maestro por Defecto (`--cursor-default`)**: Puntero estilizado en negro obsidiana (`#0c0f17`) con filo biselado dorado (`#fbbf24`), runa central ámbar y sombra suave.
    - **Corrección en BGMGenerator (`BGMGenerator.ts`)**: Solucionado el enrutamiento de música de fondo para entornos especiales. El método `playBackground` ignoraba los fondos `boss`, `tutorial` y `story` y reproducía erróneamente la música de `combat` estándar, ya que la condición estaba incompleta. Se ha actualizado para enrutar todas las pistas registradas.
    - **Cursor Táctico de Hover (`--cursor-pointer`)**: Flecha dorada resplandeciente que sostiene una **Piedra de Go de concha blanca nacarada** con aura celestial de energía Qi (`#f59e0b`).
    - **Cursor de Tablero / Colocación (`--cursor-grab`)**: Retícula circular zen con piedra de Go central.
    - Aplicados universalmente en `html, body` y todos los elementos interactivos (`button`, `.btn`, `.dojo-item`, etc.), asegurando una transición de puntero 100% limpia sin parpadeos ni interferencias del sistema operativo.
  - **Zoom Focal Centrado en la Silueta / Asset 3D**: Al pasar el cursor sobre cualquier parte del elemento (incluyendo el texto lateral como "FEEDBACK", "STORY" u "OPTIONS"), la cámara calcula las coordenadas de la silueta/imagen física (`target.querySelector('img')`) y sitúa el `transform-origin` exactamente en el centro del objeto 3D, ampliando e iluminando la figura física con máxima precisión.
  - **Zoom Óptico Focal con Desplazamiento Cero (0px under cursor)**: Se reemplazó la traslación lateral de la cámara (`translate3d`) por un cálculo de `transform-origin` dinámico en coordenadas porcentuales exactas sobre el objeto enfocado con `scale(1.045) translateZ(15px)`. Al escalar sobre su propio centro, el botón enfocado se mantiene fijo en el mismo píxel de la pantalla, eliminando totalmente la desorientación visual y el bucle de parpadeo/oscilación (*jitter loop*) de zoom in y out que ocurría en los bordes del cursor.
  - **Fiabilidad Absoluta del Clic e Interacción**:
    - Se habilitó `pointer-events: auto !important` con cursor interactivo en todos los textos e imágenes hijos, asegurando que tanto posar el cursor como hacer clic sobre las etiquetas de texto active y abra la sección inmediatamente.
    - Se estabilizó la escala de `:active` a `scale(0.98)` (en lugar de `scale(0.94)` brusco) para impedir que los bordes del botón se encojan bajo el cursor durante la pulsación del ratón.
    - Se corrigió la estructura HTML eliminando una etiqueta `</div>` huérfana para asegurar que `#modals-container` resida limpiamente dentro de `#app`.
  - **Aceleración Logarítmica / Frenado Exponencial (*Fast Out, Slow In*)**: Calibrada la curva de transición de la cámara (`cubic-bezier(0.16, 1, 0.3, 1)` - Ease Out Expo) para una respuesta instantánea y reactiva en la activación que decae exponencialmente con máxima suavidad orgánica.
  - **Hysteresis y Transiciones Suaves entre Opciones**: Añadido temporizador amortiguador (*debounce* de 75ms) para que al deslizar el cursor de un botón a otro la cámara fluya directamente de punto focal a punto focal sin saltos intermedios bruscos.
  - **Feedback Táctil y Sonoro**: Integrado sonido sutil de piedra Go (`SoundFX.playPlaceStone()`) al posar la mirada sobre cualquier opción y animación de pulsación elástica (`.is-activated`) al hacer clic.
  - **Interacción Multidireccional Restaurada**: Reemplazado `pointer-events: none` por `pointer-events: auto` en `.dof-blur` para permitir pasar el cursor inmediatamente sobre cualquier otra opción del dojo sin zonas muertas.
- **Optimización Tipográfica y Legibilidad en Placas de Combatientes (`champions.css`, `DuelistRenderer.ts`, `index.html`)**:
  - **Sustitución de Tipografía All-Caps por Mincho Serif Mixta**: Se sustituyó `var(--font-oriental)` (`Cinzel Decorative`, que forzaba mayúsculas desmedidas y truncaba nombres como `NORMAL PER...`) por `var(--font-serif)` (`'Shippori Mincho', 'Cinzel', serif`), permitiendo minúsculas y mayúsculas naturales con elegancia caligráfica tradicional japonesa.
  - **Ampliación de Placa y Envoltura de Texto (`.duel-standee-plate`, `.duel-plate-title-group strong`)**:
    - Ampliado el ancho máximo de la placa a `255px`.
    - Ajustado `font-size: 0.92rem; font-weight: 700; max-width: 100%; white-space: normal; word-break: break-word;` para que nombres largos como *Persona Normal*, *Kitsune (Tú)*, *Novice Monk* o *Sensei Hiroshi* se lean completos y nítidos sin elipses indeseadas.
  - **Lectura Simultánea de Identidad y Habilidad/Descripción**:
    - Añadido el subtítulo `#duel-player-sub` para reflejar la maestría canónica (*Maestría de Go Canónico • 2 Rebobinares*) en personajes normales o aprendices.
    - Para héroes con habilidades, el botón/placa inferior muestra directamente el **Nombre de la Habilidad** y su **Fórmula/Efecto de Combate** de forma simultánea.
- **Nueva Topología de Tablero: Tablero Volcánico (`board.shape = 'volcano'`) (`BoardGenerators.ts`, `SVGRenderer.ts`, `StageHazardManager.ts`, `SVGDefs.ts`, `board.css`, `modal-local-setup.html`, `modal-online.html`)**:
  - **Frecuencia de Erupción Ajustada (Turnos 11a, 21a, 31a)**: Modificado el temporizador en `StageHazardManager.checkAndTriggerVolcano`. Ahora la erupción ocurre al inicio del turno de Negro después de 10 rondas completas (turno global 21, 41, 61...).
  - **Eliminación de Huecos Transparentes**: Desactivada la generación de máscaras SVG (`<mask>`) en `SVGRenderer.ts` para las casillas destruidas. Ahora el meteorito sigue eliminando la casilla lógicamente (haciéndola injugable) pero mantiene el fondo de madera visualmente sólido, sin crear un agujero transparente.
  - **Tooltips e Iconos de Advertencia (HUD y Configuración)**: Añadido un icono animado de volcán gigante en el previsualizador del menú, y otro en el HUD. Animación de latido (20%-80%) aislada solo en el emoji. Al pasar el cursor, un tooltip flotante (que no parpadea y evita recortes de overflow) advierte sobre la destrucción. **100% traducido a Español e Inglés (ES/EN)** vía `data-i18n`.
  - **Desvinculación del Fondo**: La mecánica de erupción volcánica ya no depende de la imagen de fondo de la partida (`background === 'boss'`), sino de la forma y topología del tablero seleccionada (`board.shape === 'volcano'`).
  - **Generación y Tamaños Disponibles**: Disponible en **9x9, 13x13 y 19x19** con cuadrícula canónica completa de Go y puntos Hoshi oficiales.
  - **Capa Estética Diegética de Cráteres en las 4 Esquinas (`renderVolcanoCornerDecorations`)**:
    - En las 4 esquinas del marco de madera Kaya, fuera de la cuadrícula de juego, se renderizan 4 conos volcánicos de basalto (`#1c1917`), grietas radiales de lava (`#ea580c`), cráteres oscuros con caldera de magma ardiente resplandeciente (`#fef08a` -> `#f59e0b` -> `#dc2626`) con animación de pulso de calor en vivo (`.volcano-core-glow`) y sutiles penachos de humo (`.volcano-smoke-plume`).
    - Esto lo distingue de forma instantánea, épica y clara del tablero cuadrado normal.
  - **Mecánica Ambiental de Erupción**:
    - Cada **10 turnos globales** (turnos 10, 20, 30, 40, etc.), el tablero entra en erupción y un proyectil de magma impacta una casilla aleatoria, perforándola permanentemente (`RulesEngine.destroyTopology`).
    - **Interacción con Escudo Divino de Kitsune**:
      1. *Impacto Directo*: Si la roca de magma impacta directamente sobre una piedra con Escudo Divino, la piedra es destruida incondicionalmente y su escudo se quiebra con VFX de cristal dorado (`VFXManager.triggerDivineShieldShatter`), ya que el suelo físico sobre el que reposaba ha desaparecido en el vacío.
      2. *Protección del Resto del Grupo*: Las demás piedras del grupo que posean Escudo Divino **conservan intacta su protección** y **no mueren por falta de libertades**, manteniéndose invulnerables a la captura colateral.
    - Totalmente integrado en Local Wizard, Online Wizard y Sandbox, con i18n completa en Español e Inglés (`wizard.shape_volcano`).
- **Perfeccionamiento Visual del Selector del Dojo y Textos del Menú Principal (`tutorial.css`, `modal-tutorial.html`, `MenuEventBinder.ts`, `base.css`, `index.html`, `translations.ts`)**:
  - Eliminadas las líneas ondulantes y el kanji tradicional del título para un acabado limpio, puro y minimalista en el selector de lecciones.
  - **Internacionalización Completa (ES/EN)**: Título, subtítulo, etiquetas dinámicas de lección y botón de retorno traducidos al 100% en español e inglés.
  - **Relieve Volumétrico y Resplandor de Letreros del Menú Principal (`.dojo-item span`)**: Implementado un sistema multicapa de contorno oscuro profundo (`#05070c`), sombra proyectada y resplandor reactivo (`drop-shadow` + `currentColor`) que hace que los textos (ROGUELIKE, LOCAL, ONLINE, STORY, FEEDBACK, TUTORIAL, OPTIONS) resalten con máxima nitidez y legibilidad sobre el fondo del dojo.
- **Rediseño Orgánico y Diegético del Selector de Lecciones del Dojo (`tutorial.css`, `modal-tutorial.html`, `MenuEventBinder.ts`)**:
  - Eliminados los contenedores oscuros rígidos y los botones/pills encapsulados que encerraban las 9 lecciones.
  - Transformada la vista en un pergamino espacial abierto con fondo etéreo `modal-dojo-backdrop`, marca de agua tradicional en kanji (`道場`), título en `--font-oriental` con resplandor dorado y subtítulo caligráfico.
  - **Líneas Blancas Ondulantes y Asimétricas**: Cada lección se apoya sobre un trazo SVG ondulante y asimétrico único (9 curvas bézier distintas simulando pinceladas vivas de tinta Sumi-e), que se ilumina con resplandor ámbar al interactuar.
  - **Anillos Zen Ensō de Numeración**: Sustituidos los antiguos bloques de números cuadrados de color naranja por anillos circulares zen (`.dojo-zen-ring` y `.dojo-zen-num`) con gradiente radial y tipografía oriental.
  - **Interacción y Hover Zen**: Efecto de iluminación ambiental y elevación sutil de la lección seleccionada sin botones duros.
  - Totalmente adaptado para Modo Oscuro (Pizarra Obsidiana) y Modo Claro (Tatami y Madera Kaya Tradicional).
- **Actualización Integral del Sistema Tipográfico Híbrido ("Templo Zen & Clásico Ancestral") (`variables.css`, `base.css`, `modals/base.css`, `champions.css`)**:
  - Implementada la jerarquía tipográfica canónica de Crazy Go:
    1. **Títulos, Campeones, Banners y Novela Visual (`--font-oriental` / `--font-display`)**: `Shippori Mincho`, `Cinzel Decorative` y `Cinzel` con soporte completo de pesos (500 a 900), aportando majestuosidad ancestral y caligrafía zen.
    2. **Cuerpo de Interfaz, Modales, Hechizos y Descripciones (`--font-main` / `--font-body`)**: `Outfit` con soporte de pesos (300 a 800) para máxima legibilidad, modernidad y ergonomía visual.
    3. **Estadísticas, Conteo de Capturas, Temporizador y Coordenadas (`--font-mono`)**: `JetBrains Mono` con pesos 400 a 700 para estabilidad numérica sin desalineación.
  - Sincronizados títulos modales, placas de nombres de personajes y letreros del menú principal interactivo.
- **Rediseño Cinemático y Diegético de la Pantalla de Elección Roguelike (`modal-rogue-choice.html`, `RogueChoiceCameraController.ts`, `RogueModalRenderer.ts`)**:
  - Reemplazada la ventana modal convencional por una escena inmersiva 2.5D de pantalla completa dividida en dos caminos narrativos:
    1. **Izquierda (Comenzar Nueva Expedición / Abandonar)**: El campeón aparece girado hacia el interior del Dojo tradicional japonés (`bg_choice_dojo.jpg`), representando el regreso al santuario y el inicio de una nueva aventura.
    2. **Derecha (Continuar Expedición / Reanudar)**: El campeón aparece visto de espaldas (`[hero_id]_back.png`) avanzando a lo largo de un sendero de montaña místico con nodos dorados del mapa de expedición y un portal Torii a lo lejos (`bg_choice_map.jpg`).
  - **Placa Central de Información de la Run**: Muestra de forma flotante y elegante el héroe activo con su icono, la dificultad seleccionada (`Normal (Guerrero)`, `Fácil`, etc.) y el nodo/Tier actual en el que se encuentra la partida guardada.
  - **Controlador de Cámara Espacial con Profundidad de Campo (`RogueChoiceCameraController.ts`)**:
    - *Hover Izquierdo*: La cámara enfoca y amplía el dojo con brillo y contraste, aplicando blur y oscurecimiento al sendero derecho y revelando la etiqueta de "NUEVA EXPEDICIÓN".
    - *Hover Derecho*: La cámara enfoca el camino de la expedición, iluminando el sendero y al héroe de espaldas, desenfocando el dojo y revelando "CONTINUAR EXPEDICIÓN".
    - Sonido sutil de piedra Go al cambiar de foco y retorno fluido a la composición general al salir el cursor.
  - **Generación y Procesamiento de Assets de Espalda para los 7 Campeones**:
  - **Internacionalización Completa (ES / EN)**:
    - Integradas todas las etiquetas y textos dinámicos en `translations.ts` y `RogueModalRenderer.ts` con soporte bilingüe (`rogue.choice_active_badge`, `rogue.choice_start_new_title`, `rogue.choice_start_new_sub`, `rogue.choice_continue_title`, `rogue.choice_continue_sub`, `rogue.choice_return_menu`, `rogue.choice_node_tier`), traduciendo nombres de rivales (`translateEnemyName`), dificultades y nodos.
- **Sistema de Foco de Cámara Interactivo (Menú Principal 2.5D) (`MenuCameraController.ts`, `index.html`, `base.css`)**:
  - Transformado el menú principal en un entorno interactivo cinemático mediante CSS 3D Transforms (`perspective`, `translateZ`, `scale`) donde el cursor actúa como la mirada del jugador.
  - Al realizar *hover* sobre un objeto/botón, la cámara hace un suave *dolly-in* (zoom dinámico) centrándose sobre ese objeto.
  - Implementados efectos de profundidad de campo (Depth of Field / `filter: blur`) desenfocando gradualmente los objetos no enfocados y el título.
  - Diseñado de manera responsiva calculando offsets en tiempo real en `MenuCameraController.ts` sin necesidad de coordenadas hardcodeadas.
- **Migración a Entorno Físico 2.5D Modular (Spatial Scene)**:
  - Eliminados los botones HTML flotantes y sustituidos por una cuadrícula posicional.
  - Implementada arquitectura 2.5D desacoplada: Fondo de Dojo completamente vacío (`bg_dojo_empty.jpg`) + Muebles decorativos como PNGs transparentes independientes (`furniture_bookshelf.png`, `furniture_stand.png`) + Objetos interactivos (`item_*.png`).
  - Generados e integrados los assets de arte estilo Studio Ghibli: Fondo de dojo nocturno/tenue de cedro (`bg_dojo_empty.jpg`), Estantería limpia de 3 baldas (`furniture_bookshelf.png`) y Soporte tradicional de suelo para pergaminos (*Emakimono Stand*, `furniture_stand.png`) con transparencia alfa procesada.
  - Permite control total de coordenadas, escalado y movimiento sin depender de muebles dibujados de forma fija en la imagen de fondo.
- **Destrucción Topológica y Tableros Dinámicos (Meteoros y Lava) (`GraphBoard.ts`, `RulesEngine.ts`, `SVGRenderer.ts`, `BossManager.ts`, `AITurnManager.ts`)**:
  - Implementado `GraphBoard.removeNode()` (vaciando vecinos y marcando como `DESTROYED` para preservar coordenadas) y `RulesEngine.destroyTopology()` para romper físicamente partes del tablero en medio del combate.
  - El renderizador (`SVGRenderer`) ahora inyecta una máscara SVG (`<mask>`) dinámica en la textura del fondo de madera, creando agujeros negros vacíos (huecos topológicos transparentes) donde cayeron los impactos, y elimina las líneas de conexión.
  - Las piedras conectadas a las casillas destruidas son evaluadas inmediatamente por asfixia (al perder libertades vitales o vías de conexión), respetando las reglas canónicas de Go (pueden morir cadenas enteras si la vía destruida era su último ojo).
  - **Devastación Pasiva del Dragón (Boss Final)**: Añadido `BossManager.checkAIPassiveDevastation()`. A partir del turno global 22, el Jefe lanza de forma pasiva y automática 4 bolas de fuego (Lluvia Meteórica) en cada turno de la IA que destruyen casillas, alterando la topología de la batalla final.
- **Corrección del Sistema de Zoom y Escalado Global (`OptionsModalRenderer.ts`, `theme.css`)**:
  - Reemplazado el enfoque inestable de CSS Transform (`transform: scale`) en el contenedor `#app` por la propiedad nativa `document.body.style.zoom`. 
  - Esto elimina el problema de desplazamiento de coordenadas de objetos y la aparición de márgenes o recortes (franjas negras) en resoluciones grandes o muy bajas, replicando de forma exacta la experiencia y rendimiento del atajo nativo `Ctrl +` y `Ctrl -` de Google Chrome.
- **Captura Inmediata de Entidades en Modo Sandbox / Desarrollador (`SVGRenderer.ts`, `GameController.ts`, `SandboxController.ts`, `modal-sandbox.html`)**:
  - Habilitada la captura inmediata de entidades (Cofres Místicos 🎁, Monjes Cautivos 🧙, Pergaminos Sagrados 📜 y Espíritus Guardián ✨) al hacer clic directo sobre ellas en el tablero si el modo Sandbox o Desarrollador está activo, omitiendo la necesidad de rodearlas con 4 piedras y facilitando enormemente las pruebas de recompensas.
  - Refactorizado `GameController.handleCaptiveCapture` para extraer la lógica de recompensas centralizándola y permitiendo su invocación desde Dev Mode (Cheat) y Gameplay normal (IA/Humano).
  - Añadidas brochas (`SandboxBrush`) explícitas para generar entidades en tiempo real desde el *Testing Lab & Troubleshooter*, permitiendo poblar el mapa a voluntad para debug de mecánicas, efectos o balance.
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
  - **Fase 61 (Lobby Libre Backend Completado)**:
  - Estructura `GameSetupConfig.slots` integrada.
  - El motor (Rengo Style) y controladores (`GameController`, `AITurnManager`, renderizado del color en Hover) ahora manejan slots híbridos (ej: P1=Humano Local, P2=IA, P3=Humano Remoto).
  - Los errores de compilación TS inducidos en el CombatLogManager (por conflicto de versiones de `index.ts`) han sido subsanados.
  - Pendiente: Interfaz de usuario (UI) para seleccionar las opciones de los slots.
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
- **Corrección en Previsualización de Modo Procedural Online (`OnlineModalRenderer.ts`, `OnlineEventBinder.ts`)**:
  - Solucionado el error por el cual el botón de "Reroll Procedural" del anfitrión no actualizaba el tablero visualmente en el lobby. Se ha eliminado la semilla estática `12345` en el renderizado del preview, inyectando dinámicamente la semilla generada por el anfitrión para que la visualización y el juego final coincidan. Se re-sintetizó `SoundFX.playPass()` con Web Audio API para emitir un auténtico golpe suave de mazo y resonancia de campana zen / gong budista tradicional ("Bong" en Sol / 196Hz con armónicos ricos de 0.85s de decaimiento). Se corrigieron `GameController.handlePass` y `GameController.checkAITurn` para que al pasar turno (humano o IA) nunca suene a impacto de piedra (`playPlaceStone`).
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

### Sesión Actual - Expansión del Dojo y Go Tradicional
- **Reestructuración del Modal de Tutorial (modal-tutorial.html, MenuEventBinder.ts)**:
  - Se ha dividido la lista de lecciones en dos grandes bloques visuales: **Módulo I (Fundamentos del Go Canónico)** y **Módulo II (El Camino de Crazy Go)**.
- **Nuevas Lecciones de Go Tradicional y Crazy Go (TutorialSteps.ts)**:
  - category añadida a la interfaz de capítulos.
  - **Ojos Falsos**, **Snapback (Uttegaeshi)** y **Seki (Vida Mutua)** añadidos al Módulo I.
  - **Topologías y Vacío** y **Sinergias de Magia** añadidos al Módulo II.
- **Corrección de Lección 7 (Snapback / Uttegaeshi)**:
  - Se rediseñó la posición del tablero a una herradura canónica de 6 piedras blancas en Atari. Al jugar en (4,3), la piedra negra entra legalmente con 1 libertad en (5,3) reduciendo a blanco a 1 libertad, blanco captura en (5,3) y negro recaptura inmediatamente las 7 piedras en (4,3).
- **Ocultación del Menú Log en Tutoriales (	utorial.css, TutorialManager.ts)**:
  - #btn-game-combat-log y la barra de navegación innecesaria ahora se ocultan estrictamente al estar en modo tutorial.
- **Corrección del flujo de la IA en Lección 7 (Snapback)**:
  - Se reemplazó la llamada inválida por RulesEngine.tryPlaceStone(board, state, 5,3, 2) junto con GameController.renderer.render() en onStart del paso 3. Ahora la IA captura la piedra cebo limpiando (4,3) y permitiendo que el botón Understood avance de inmediato al paso 4 para la recaptura final.
- **Visibilidad del Boton Pasar Turno en Lecciones (Seki, etc.)**:
  - Se añadio la clase .tutorial-show-pass-only que activa exclusivamente el boton de Pasar Turno (#btn-pass) centrado y resaltado en la parte inferior durante las lecciones que lo requieren (como Seki), manteniendo ocultos hechizos y poliminos.
  - Se vinculo GameController.handlePass con TutorialManager.advanceStep() para que pasar turno avance la leccion con normalidad.
- **Rediseño Didáctico e Interactivo de la Lección 4 (Ojos Falsos)**:
  - Se transformó la lección de un texto estático a un problema interactivo paso a paso. El jugador ve dos grupos negros formando un ojo aparente en (4,4) asediados en las esquinas por blanco, blanco pone en Atari el grupo inferior, y el jugador se ve obligado a jugar en (4,4) para salvarlos, experimentando de primera mano cómo el ojo se autodestruye al tener que rellenarlo.
- **Explicacion de Ojos Falsos con 2 Ojos (Leccion 4)**:
  - Se enfoco la leccion en el verdadero peligro: creer tener 2 ojos (inmortalidad) cuando el Ojo 2 es falso. El jugador ve como al asediar blanco la esquina del Ojo 2, negro se ve forzado a rellenarlo, quedandose con un solo ojo y muriendo el grupo completo.
- **Rediseño Dinamico de la Leccion 9: Territorio y Puntuacion Japonesa (FINAL SCORING)**:
  - Se corrigieron las coordenadas historicas 0-indexadas por coordenadas validas 1-indexadas en tablero 9x9.
  - La leccion ahora es interactiva: el jugador sella la brecha de su muralla en (3,4) conquistando 11 puntos de territorio, aprende como las piedras muertas enemigas atrapadas en (2,2) suman +1 prisionero sin gastar turnos, el funcionamiento del Komi (+6.5 para Blancas), y la formula de recuento final de las Reglas Japonesas.
- **Rediseño Estrategico de la Leccion de Sinergias de Magia (Alquimista)**:
  - Se reemplazo el ejemplo autodestructivo de la cruz por un tesuji de captura por inversion real. Blancas tiene un muro de 3 piedras en (5,4)-(5,5)-(5,6) que corta a los grupos negros y tiene solo 1 libertad en (6,5). Al usar la Inversion Cromatica en la piedra central (5,5), las dos piedras blancas vecinas quedan con 0 libertades y son capturadas de inmediato, conectando a Negras en una fortaleza viva.
- **Modernizacion Visual del Modal de Expedicion Roguelike y Selector de Dificultad**:
  - Se reemplazaron los puntos de colores y subtitulos por Llamas Misticas Animadas con efecto de fuego y resplandor elemental para cada dificultad: Facil (Llama Verde Esmeralda), Normal (Llama Ambar Dorada), Dificil (Llama Carmesi Sangre) y Gran Maestro (Llama Purpura del Vacio).
  - Se rediseñaron todos los contenedores a una estetica glassmorphism sin bordes solidos (borderless) con sombras ambientales suaves y auras luminosas en habilidades, miniaturas y tarjetas.

- Fase 61 completada: Rediseño visual sin bordes del Combat Log, iconografía SVG pura, i18n dinámico (Inglés/Español) con \data-i18n\, y corrección de un bug crítico de duplicidad de \<defs>\ SVG que rompía el tablero principal al salir del Log.

- **Grass Texture for Conquered Boards:** Added #grass-texture pattern in SVGDefs.ts and dynamically apply it to wood polygons of the cloned board in StoryModeController.ts.
