# Tareas y Roadmap (Task List)

### Fase 105: Red Neuronal AlphaZero (CrazyGoNet) — Entrenamiento en GPU RTX 4070 Ti SUPER e Integración ONNX Runtime (En Progreso)
- [x] **Tarea 283 (Auditoría Canónica de Reglas de Go y Corrección de Ko)**: Blindaje de `RulesEngine.isMoveLegal` y `tryPlaceStone` para evaluación incondicional de estados repetidos. Sincronización fiel de `docs/ai_wiki/go_rules.md`.
- [x] **Tarea 284 (Arquitectura ResNet-12 CrazyGoNet con 3 Cabezas)**: Modelo residual profundo con Policy Head ($N \times N + 1$), Value Head ($[p_1, p_2, p_3, p_4]$ para Winrate en vivo) y Ownership Head ($N \times N$ para territorio).
- [x] **Tarea 285 (Pipeline de Entrenamiento y Simulador Headless TypeScript)**: `GoSimulator.ts` y `generate_games.ts` generando ~3.000 posiciones/segundo sin dependencias de navegador.
- [x] **Tarea 286 (Fase 1 completada - 50.000 Pasos en 9x9)**: Convergencia de Value Loss a 0.0034 y Ownership Loss a 0.1660.
- [x] **Tarea 287 (Fase 2 completada - 150.000 Pasos en 9x9)**: Generación de 2.000 partidas y maestría táctica en combate cuerpo a cuerpo.
- [x] **Tarea 288 (Fase 3 completada - 250.000 Pasos en 13x13)**: Generación de 1.500 partidas (468.309 posiciones) y transfer learning de la espina dorsal convolucional.
- [x] **Tarea 289 (Integración en Motor de Juego)**: Creación de `NeuralNetAdapter.ts` con `onnxruntime-web` WASM SIMD, conexión en `GoAI.worker.ts` para cálculo de jugadas y en `AnalysisEngine.ts` para Winrate en tiempo real. Compilación exitosa (`npm run build`).
- [/] **Tarea 290 (Fase 4 + 5 Nocturna - 700.000 Pasos)**: Entrenamiento autónomo en GPU de 19x19 y topologías asimétricas (circular, triangular, erosionado, vórtice Oni) hasta 700.000 pasos.
- [x] **Tarea 291 (Selector Maestro y Granular de Dificultad 30k-9d en Partidas de 4P Local y Online)**: En partidas de hasta 4 jugadores con bots (1, 2 o 3 IAs), selector general que por defecto ajusta a todos los bots en pack y modo individual para personalizar el nivel específico de cada Bot conectando las simulaciones MCTS y la Red Neuronal (CrazyGoNet). Además de auto-escalado dinámico Kyu/Dan en el Modo Roguelike.
- [ ] **Tarea 292 (Modo Espectador / Arena de Combate IA vs IA)**: Permitir iniciar combates automáticos de Bot vs Bot con control de velocidad, para depuración y observación del Winrate en vivo.

### Fase 104: Corrección de Multijugador Local 2P y 4P, Animación Universal del Tablero Oni y Cooperativo Completo (Completada)
- [x] **Tarea 253 (StoryModeController reescrito)**: Reescritura completa con `gameMode: '1via'` (fix bug IA), array `STORY_CHAPTERS[]` tipado, sistema de eventos por turno vía `setInterval`, método `showCinematicIntro()`.
- [x] **Tarea 254 (Intro Cinemática)**: Overlay fullscreen `#story-cinematic-intro` con cosmos que hace zoom-in dramático (×2.2) y reveal secuencial de 4 líneas de lore. Botón explícito `[ SKIP INTRO ⏩ ]` interactivo desde el milisegundo 0.
- [x] **Tarea 255 (Sistema de Eventos Mid-batalla)**: Cada capítulo dispara `StoryEvent[]` por turno: `dialogue` (visual-novel), `alert` (HUD banner), `earthquake` (shake + fisura abisal en SVG directamente inyectada).
- [x] **Tarea 256 (Efecto Terremoto y Ruptura Mecánica)**: `vfx-screen-shake` doble + corte físico de nodos (`GraphBoard.removeNode`) trazando una grieta oscura/púrpura relampagueante en el SVG de la partida.
- [x] **Tarea 257 (3 Capítulos con narrativa completa)**: Cap.1 Islands 9×9 fácil, Cap.2 Eroded 13×13 con terremoto destructivo en Turno 5, Cap.3 Islands_v1 13×13 con Tenuki mecánico.
# Tareas y Roadmap (Task List)

### Fase 104: Corrección de Multijugador Local 2P y 4P, Animación Universal del Tablero Oni y Cooperativo Completo (Completada)
- [x] **Tarea 273 (Causa Raíz de Fichas Negras Forzadas en Local)**: Eliminado el callback `getLocalPlayerColorCallback` de [`SVGRenderer.ts`](file:///c:/Users/VICTOR/Desktop/crazy_go/src/graphics/SVGRenderer.ts) y [`GameController.ts`](file:///c:/Users/VICTOR/Desktop/crazy_go/src/controllers/GameController.ts) que forzaba `placingPlayer` al valor por defecto `humanColor = 1` en todos los clics locales.
- [x] **Tarea 274 (Colocación Dinámica por `state.currentPlayer`)**: La colocación de piedras y poliminós en [`SVGRenderer.ts`](file:///c:/Users/VICTOR/Desktop/crazy_go/src/graphics/SVGRenderer.ts) lee ahora directamente `this.state.currentPlayer`, asignando con total fidelidad el color de P1 (Negras ⚫), P2 (Blancas ⚪), P3 (Esmeralda 🟢) y P4 (Amatista 🟣) en turnos 1a, 1b, 1c y 1d.
- [x] **Tarea 275 (Sincronización de Dock de Poliminós en Multijugador)**: Conectado `PolyominoManager.syncCardsWithInventory(currentPlayer)` en [`HUDController.ts`](file:///c:/Users/VICTOR/Desktop/crazy_go/src/ui/HUDController.ts) para actualizar los contadores de cartas según el jugador en turno.
- [x] **Tarea 276 (Suite de Pruebas Automatizadas de Multijugador Local)**: Creado el script [`scripts/test_local_multiplayer.mjs`](file:///c:/Users/VICTOR/Desktop/crazy_go/scripts/test_local_multiplayer.mjs) con validación de partidas 2P y 4P, rotación de rondas y poliminós.
- [x] **Tarea 277 (Animación Universal de Fauces Abismales Oni)**: Conectado `renderOniMouthAbyss` en [`SVGRenderer.ts`](file:///c:/Users/VICTOR/Desktop/crazy_go/src/graphics/SVGRenderer.ts) y [`CombatLogModalRenderer.ts`](file:///c:/Users/VICTOR/Desktop/crazy_go/src/ui/modals/CombatLogModalRenderer.ts) con anillos de rotación y brillo palpitante en [`vfx.css`](file:///c:/Users/VICTOR/Desktop/crazy_go/src/styles/vfx.css), mostrándose siempre en combate, replay y previsualizaciones de selección (Local y Online).
- [x] **Tarea 278 (Sistema Estricto de Sub-turnos Cooperativos)**: Implementación de turno alterno (`coopSubTurn`) en `GameController.ts` y alertas de interfaz interactiva en HUD bloqueando a un jugador durante el sub-turno del compañero, garantizando que el combate contra la IA sea "una jugada cada uno".
- [x] **Tarea 279 (Control Exclusivo del Anfitrión sobre el Mapa y Recompensas)**: `RoguelikeController` bloquea los clics locales del invitado en los nodos del mapa; sincroniza `MAP_CLICK` desde el anfitrión. Adicionalmente, se envuelve `RogueModalRenderer.ts` con verificación `e.isTrusted` para denegar la elección de recompensas (santuarios, tesoros) a invitados y se procesa el evento simulado vía `EVENT_OPTION_CLICK` cuando el anfitrión hace su elección.
- [x] **Tarea 280 (Red de Votación para Abandonar Expedición y Manejo de Desconexiones)**: Implementada la confirmación por votación mediante mensaje `VOTE_ABANDON` (`OnlineController.ts`), exigiendo conformidad mutua (`confirm()`) para abortar expediciones en modo `coop_rogue`. Pausa y alerta de advertencia en HUD ante desconexión de peers con reactivación transparente vía Trystero.
- [x] **Tarea 281 (Limpieza de Interfaz en Lobby Online para Cooperativo)**: Ocultados dinámicamente los campos confusos (Komi, Color, Añadir Bot/Jugador Local) en el Paso 2 de Multijugador Cooperativo (`OnlineModalRenderer.ts`).
- [x] **Tarea 282 (Blindaje Criptográfico y Ofuscación de Código en Pipeline de Empaquetado)**: Integración de `javascript-obfuscator` en `scripts/build_packages.js`. Se ofuscan los 8 bundles de JavaScript con Control Flow Flattening, inyección de código muerto, encriptación Base64/RC4 y sustitución hexadecimal de identificadores antes de generar los `.zip` de Itch.io y Windows PC.

### Fase 103: Modo Historia — Sistema de Eventos Narrativos, Intro Cinemática, Inmersión Macro Cósmica y Conquista de Naturaleza Ilustrada (Completada)
- [x] **Tarea 253 (StoryModeController reescrito)**: Reescritura completa con `gameMode: '1via'` (fix bug IA), array `STORY_CHAPTERS[]` tipado, sistema de eventos por turno vía `setInterval`, método `showCinematicIntro()`.
- [x] **Tarea 254 (Intro Cinemática)**: Overlay fullscreen `#story-cinematic-intro` con cosmos que hace zoom-in dramático (×2.2) y reveal secuencial de 4 líneas de lore. Botón explícito `[ SKIP INTRO ⏩ ]` interactivo desde el milisegundo 0.
- [x] **Tarea 255 (Sistema de Eventos Mid-batalla)**: Cada capítulo dispara `StoryEvent[]` por turno: `dialogue` (visual-novel), `alert` (HUD banner), `earthquake` (shake + fisura abisal en SVG directamente inyectada).
- [x] **Tarea 256 (Efecto Terremoto y Ruptura Mecánica)**: `vfx-screen-shake` doble + corte físico de nodos (`GraphBoard.removeNode`) trazando una grieta oscura/púrpura relampagueante en el SVG de la partida.
- [x] **Tarea 257 (3 Capítulos con narrativa completa)**: Cap.1 Islands 9×9 fácil, Cap.2 Eroded 13×13 con terremoto destructivo en Turno 5, Cap.3 Islands_v1 13×13 con Tenuki mecánico.
- [x] **Tarea 258 (Debug Panel Integrado en Topbar)**: Botón `🛠️ Story Debug ▼` integrado en `#game-topbar .topbar-left` con menú desplegable, atajos F3 / `~` y cierre por clic externo.
- [x] **Tarea 259 (GDD actualizado en Bóveda Obsidian)**: `CrazyGo_ModoHistoria_GDD.md` en `C:\Users\VICTOR\Desktop\Bóveda Victólogo\02 Negocios\` con toda la arquitectura, lore, backlog y decisiones fijas.
- [x] **Tarea 260 (Santuarios de Qi y Objetos Rodeables)**: Integración de Santuarios (`renderShrines`) y Entidades Cautivas (`state.captives`): Núcleo de Qi (💎), Pergamino del Sismo (📜), Monje Atrapado (🧙) y Cofre de Poliminós (🎁).
- [x] **Tarea 263 (Conquista de la Naturaleza con Assets Ilustrados 2D)**: Sustitución de emojis simples por assets ilustrados PNG transparentes (`nature_pine.png`, `nature_sakura.png`, `nature_bamboo.png`, `nature_vines.png`) con animación `storyNaturePop` y enredaderas SVG verdes (`storyVineGrow`) al purificar el Goban.
- [x] **Tarea 267 (Inmersión Galáctica Zoom-In y Transición Inter-Capítulos)**: Comienzo obligatorio en la escala macro del cosmos (0.08) con un pequeño tablero flotante brillante, botón / clic para descender en picado (zoom-in dive de 1.4s), y paneo horizontal por el universo hacia el siguiente fragmento al ganar.
- [x] **Tarea 268 (Renderizado de Goban de Madera en Registro de Combate)**: Integración del fondo de madera de Kaya con Convex Hull dinámico, líneas Urushi y estrellas Hoshi en `#replay-board-svg` dentro del visor interactivo de repetición (`CombatLogModalRenderer.ts`, `combat_log.css`).
- [x] **Tarea 269 (Eliminación de Winrate en Modo Historia)**: Ocultación de la barra de probabilidad de victoria en tiempo real (`#winrate-bar-wrapper`) y anulación de cómputo en `AnalysisEngine` para preservar el tono narrativo e inmersivo del Modo Historia (`HUDController.ts`).
- [x] **Tarea 270 (Suite de Pruebas Automatizadas de Combat Log & Replay)**: Suite integral de pruebas (`scripts/test_combat_log.mjs`) que verifica la captura del 100% de jugadas, habilidades de campeón, fichas poliminó, brotes, reversión de turnos con hechizo Rebobinar y exportación/importación `.cgo`.
- [x] **Tarea 271 (Adaptación de Topología Dinámica en Visor de Replay)**: Integración en `CombatLogModalRenderer.ts` del registro e inserción dinámica de nodos expandidos (Tablero del Cielo / Expansión Celestial) y encogimiento/destrucción (Volcanes / Fauces Oni) con recálculo automático de ViewBox y silueta de madera Convex Hull en tiempo real paso a paso.
- [x] **Tarea 272 (Reactivación de Peligros Ambientales y Mecánicas Únicas de Tablero)**: Integración de `StageHazardManager.checkStageHazards` en el flujo de colocación de piedras y poliminós de `SVGRenderer.handleNodeClick`, asegurando que la Expansión Celestial (Cielo), Erupciones de Magma (Volcán) y la Inhalación Gravitatoria (Máscara Oni) se ejecuten automáticamente en partidas normales y se registren en el Combat Log. Suite de tests automatizada en `scripts/test_stage_hazards.mjs`.
- [x] **Tarea 273 (Rediseño de Asistente Online: 2 Columnas y Selección Dedicada de Jugadores)**: Disposición de los modos `Classic Duel` y `Roguelike Expedition` en 2 columnas en la misma fila (`grid-2`). Creación del nuevo Paso 2 exclusivo para elegir 2 o 4 jugadores tras seleccionar Duelo Clásico, omitiéndolo automáticamente al elegir Expedición Roguelike con sincronización dinámica del Stepper y contadores.

## Fase 103 — BACKLOG STORY MODE (Pendiente)
- [ ] **Tarea 261**: Inventario de Seda Cósmica / Hilos del Destino — UI de telar cósmico y persistencia entre capítulos
- [ ] **Tarea 262**: Pantalla de recompensas post-capítulo (cosecha de territorio)
- [ ] **Tarea 264**: Capítulo 4 — El Vórtice del Vacío (agujero negro que absorbe piedras con ≤ 1 libertad)
- [ ] **Tarea 265**: Capítulo 5 — Los 4 Vientos Celestiales (4 cuadrantes en tablero 19x19)
- [ ] **Tarea 266**: Capítulo Final — Confrontación con el Dragón del Vacío (El Vacío rompe las reglas del Go en tiempo real)

## Fase 102: Cromatismo de Dificultad Avanzado y Transiciones de Escena por Disolución y Desenfoque (Completada)
- [x] **Tarea 250 (Rediseño Cromático de Llamas)**: Modificación de los filtros CSS en `carousel.css` para otorgar amarillo-dorado claro a Medium, carmesí puro de alta saturación a Hard y blanco cósmico brillante a Grandmaster.
- [x] **Tarea 251 (Efecto de Disolución y Blur en Pantallas)**: Reemplazo del fundido en negro por un cross-dissolve translúcido y desenfoque dinámico (`backdrop-filter`) en `theme.css`.
- [x] **Tarea 252 (Sincronización en ScreenManager)**: Adaptación de los tiempos de transición en `ScreenManager.ts` (240ms de entrada y 300ms de salida) para suavizar la interpolación de pantallas.

## Fase 101: Estilización Zen Minimalista y Reducción de Densidad de Conexiones en el Mapa (Completada)
- [x] **Tarea 248 (Reducción de Rutas a 3 Caminos Principales)**: Ajuste en `RoguelikeMapGenerator.ts` para reducir la densidad de líneas preservando la estructura completa del mapa.
- [x] **Tarea 249 (Capping Estricto de 2 Salidas por Nodo)**: Enforce de máximo 2 conexiones salientes en puntos de bifurcación clave (y 1 conexión directa en la mayoría de nodos) para lograr un árbol visualmente limpio y zen.

## Fase 100: Calibración Proporcional de Standees de Monjes y Sabios en Combate (Reducción del 25%) (Completada)
- [x] **Tarea 248**: Ajuste de la escala CSS en `champions.css` para los standees de Monjes Jóvenes (`monk_1` a `monk_5`) y Sabios Ancianos (`sage_1` a `sage_5`), reduciendo su tamaño un **25%** (`scale(1.26)` en reposo y `scale(1.31)` en hover) tanto en el lado izquierdo (Jugador / P1) como en el lado derecho (Rival / IA / P2) y en las tarjetas multijugador (4P).

## Fase 99: Sincronización Subpixel Inmune a Zoom de Nodos HTML y Trazos SVG (Completada)
- [x] **Tarea 246 (Unificación de Escenario `stageHeight`)**: Aplicación de altura fija compartida idéntica a `.rogue-map-scroll-wrapper`, `svg.style.height`, `viewBox` y `.rogue-map-nodes-layer` en `RoguelikeMapRenderer.ts`.
- [x] **Tarea 247 (Eliminación de Paddings Descuadrantes)**: Eliminación del padding del wrapper en `map.css` para anclar los cálculos porcentuales y en píxeles al origen $(0,0)$ compartido.

## Fase 98: Pacing Roguelike Óptimo: 2 Batallas Iniciales, Bifurcación Garantizada y Regla Anti-Grind (Completada)
- [x] **Tarea 242 (2 Nodos de Inicio de Batalla)**: Configuración en `RoguelikeMapGenerator.ts` para que el Tier 0 contenga exactamente 2 combates de apertura.
- [x] **Tarea 243 (Bifurcación Inmediata Garantizada)**: Conexión de cada nodo de inicio a múltiples destinos en Tier 1 para habilitar toma de decisiones desde el turno 1.
- [x] **Tarea 244 (Validador de Pacing Anti-Grind)**: Implementación de la regla estricta que prohíbe 3 batallas consecutivas en cualquier camino, favoreciendo la cadencia *Pelea -> Santuario/Tienda -> Pelea*.
- [x] **Tarea 245 (Longitud Dinámica de 6 a 8 Filas y Renderizado Adaptativo)**: Generación procedural de 6 a 8 niveles con ajuste dinámico de SVG y viewBox en `RoguelikeMapRenderer.ts`.

## Fase 97: Generador de Grafos DAG Canónico Tipo Slay the Spire (No-Cruces y No-Redundancia) (Completada)
- [x] **Tarea 239 (Algoritmo de Carvado de Caminos Puros)**: Reescritura del generador en `RoguelikeMapGenerator.ts` mediante tallado de 5 caminos completos continuos desde el inicio hasta el Jefe Final.
- [x] **Tarea 240 (Prevención Geométrica de Cruces `crossesAnyEdge`)**: Validación formal de intersección ($from_1 < from_2 \land to_1 > to_2$), impidiendo líneas cruzadas en 'X'.
- [x] **Tarea 241 (Filtro Estricto de No-Redundancia `createsRedundancy`)**: Eliminación de nodos paralelos con destinos idénticos duplicados para asegurar decisiones de ruta auténticas.

## Fase 96: Mapa Roguelike de 4 Columnas sin Callejones sin Salida y Progresión Escalonada de Tableros (9x9 -> 13x13 -> 19x19) (Completada)
- [x] **Tarea 236 (Barrido Bidireccional Anti-Callejones sin Salida)**: Implementación del doble barrido de alcanzabilidad en `RoguelikeMapGenerator.ts` garantizando que todo nodo existente en el mapa se conecte con el Boss en el Tier 5 y tenga entrada desde el Tier 0.
- [x] **Tarea 237 (Límite de 4 Columnas y 6 Nodos por Ruta)**: Configuración de exactamente 4 carriles horizontales con longitud fija de 6 Tiers.
- [x] **Tarea 238 (Progresión Canónica de Tableros 9x9 -> 13x13 -> 19x19)**: Ajuste en `RoguelikeMapGenerator.generateBattleConfig` para que en cualquier dificultad el tablero sea siempre 9x9 en Tiers 0-1, 13x13 en Tiers 2-3 y 19x19 en Tiers 4-5.

## Fase 95: Algoritmo Canónico de Caminos Planares Tipo Slay the Spire y Limpieza de UI del Mapa (Completada)
- [x] **Tarea 234 (Generador Planar Tipo Slay the Spire)**: Implementación del algoritmo canónico de caminos dirigidos planares sobre 5 carriles en `RoguelikeMapGenerator.ts` con garantía de no-cruce ($c_{t+1}(i) \le c_{t+1}(j)$), bifurcaciones/fusiones orgánicas y navegación estricta por ramas elegidas.
- [x] **Tarea 235 (Limpieza de UI de Biomas)**: Eliminación de las etiquetas de texto flotantes ("Zen Valley", "Misty Ridge", "Dragon Lair") en `RoguelikeMapRenderer.ts` y `map.css`, preservando el lienzo atmosférico degradado y las cenizas flotantes.

## Fase 94: Sistema Universal de Transiciones Fluidas entre Pantallas y Modales (Completada)
- [x] **Tarea 231 (Telón Cinemático Global)**: Creación de `#screen-transition-overlay` en `index.html` y estilos con aceleración por hardware en `theme.css` con opacidad y curvas bezier fluidas.
- [x] **Tarea 232 (Navegación Asíncrona en ScreenManager)**: Implementación de `ScreenManager.transitionTo` con punto ciego ordenado, sincronización de BGM, reseteo de cámara y revelado suave sin parpadeos.
- [x] **Tarea 233 (Apertura Dimensional de Modales)**: Animaciones `@keyframes modalBackdropFadeIn` y `@keyframes modalCardPopIn` en `modals/base.css` con `backdrop-filter` progresivo y escalado elástico.

## Fase 93: Firma de Autor, Disolución Zen de Capturas y Mapa Roguelike Procedural Vivo con Biomas Evolutivos (Completada)
- [x] **Tarea 228 (Firma de Autor en Menú de Inicio)**: Insignia elegante `.menu-creator-signature` ("⛩️ Created by Víctor Alonso") en la esquina inferior derecha del Dojo 2.5D en `index.html` y `base.css` con estética zen glassmorphic y resplandor ámbar en hover.
- [x] **Tarea 229 (Disolución Zen de Capturas de Piedras)**: Sistema de desintegración orgánica *in-situ* en `RulesEngine.ts`, `VFXManager.ts`, `SVGRenderer.ts` y `vfx.css` (anillo de Qi en expansión y micro-partículas de humo de tinta Sumi-e que se dispersan sin desplazamientos hacia la UI).
- [x] **Tarea 230 (Mapa Roguelike Procedural y Progresión de Biomas)**:
  - **Generación Procedural de Nodos**: Algoritmo en `RoguelikeMapGenerator.ts` con bifurcaciones orgánicas en cada expedición, balance de tipos de nodos y 0 callejones sin salida a lo largo de 6 Tiers.
  - **Lienzo Ambiental Vertical**: Fondo degradado en `map.css` y `RoguelikeMapRenderer.ts` que evoluciona desde el Valle Zen Verde inferior, pasando por la Cordillera de la Niebla, hasta la Tierra Calcinada superior con **cenizas vivas incandescentes flotando en el aire** (`.map-ember`).
  - **Senderos Iluminados**: Curvas Bezier con flujo de Qi animado (`.path-available`) y brillo áureo (`.path-traversed`).

## Fase 92: Arquitectura del Nuevo Modo Historia (Tableros Contiguos)
- [x] **Tarea 225**: Separar el antiguo Modo Historia en `Legacy` y crear la arquitectura `StoryModeController.ts` como nuevo entry point del botón principal.
- [x] **Tarea 226**: Añadir interfaz de depuración flotante (`StoryDebugUI.ts` con tecla `~`) para el desarrollo del Modo Historia con botones de Forzar Victoria/Derrota y salto de capítulo.
- [x] **Tarea 227**: Modificar el `index.html` para envolver el `#game-svg` en un `#story-world-container` con posiciones absolutas y transición CSS, logrando el efecto de tableros pegados al avanzar de capítulo.

## Fase 91: Pulido de Dificultad Roguelike: Normalización de Medium y Llamas Místicas en Expedición Activa (Completada)
- [x] **Tarea 223 (Llamas Místicas y Dificultad Limpia en Expedición Activa)**: Rediseño de la placa central de la pantalla de continuar expedición (`modal-rogue-choice.html` y `RogueModalRenderer.ts`):
  - Eliminados los subtítulos redundantes entre paréntesis (`(Principiante)`, `(Guerrero)`, `(Maestro)`, `(Gran Maestro)`), mostrando únicamente la denominación pura de dificultad (`Easy`, `Medium`, `Hard`, `Grandmaster` / `Fácil`, `Medio`, `Difícil`, `Gran Maestro`).
  - Integrado el icono dinámico de fuego elemental animado (`🔥`) con la misma animación (`flameFlicker`) y filtros cromáticos que en el selector de expedición (`.flame-easy`, `.flame-normal` / `.flame-medium`, `.flame-hard`, `.flame-extreme`).
- [x] **Tarea 224 (Unificación y Normalización de "Medium")**: Reemplazado "Normal" por "Medium" (en inglés) y "Medio" (en español) en `modal-roguelike-setup.html`, `carousel.css`, `ScreenManager.ts` y `translations.ts`, sincronizando también la barra superior del mapa roguelike.

### Fase 90: Normalización Simétrica y Escalado Heroico de Personajes y Tarjetas de Habilidades (Completada)
- [x] **Tarea 221 (Escalado Heroico Simétrico de Personajes)**: Unificación dimensional en `champions.css` aplicando `scale(1.28)` simétrico a ambas siluetas (`.duel-standee-player` y `.duel-standee-enemy`) para que llenen con elegancia el espacio vertical (~70-75% del Goban) sin verse pequeños, y escala compensatoria de `scale(1.68)` para personajes sentados (Sabios y Monjes) para igualar su presencia visual a los personajes de pie en todos los modos (Local, Online, Roguelike, Historia, Tutorial).
- [x] **Tarea 222 (Tarjetas de Habilidad Descriptivas para el Rival)**: Rediseño de `.duel-enemy-skill-pill` en `champions.css` y `DuelistRenderer.ts` para renderizar el nombre de habilidad/pasiva y la fórmula de combate (`.duel-skill-name` y `.duel-skill-formula`) con la misma estructura, dimensiones y tipografía que la tarjeta del jugador en todos los personajes y jefes.

## Fase 89: Corrección de Oponente e Héroes en Modo Online P2P (Completada)
- [x] **Tarea 220 (Sincronización de Oponente en Online)**: Corregida la resolución de héroes en `DuelistRenderer.ts` para modo Online 2P y 4P. Vinculada la resolución de `hostHero` y `guestHeroes` dinámicamente con `NetworkManager.currentConfig.hostColor` en lugar de asumir que el anfitrión siempre era el Jugador 1 (Negras), erradicando el clonado erróneo del campeón del invitado en el HUD del rival y estableciendo `'normal'` como fallback seguro.

## Fase 88: Tarjeta Lateral Flotante de Inhalación Oni, Vectores Ortogonales y Máscara Continua de Inmunidad (Completada)
- [x] **Tarea 218 (Tarjeta Lateral y Vectores Oni)**: Reposicionamiento del tooltip de la Máscara Oni como Tarjeta Flotante Lateral fijada a la derecha de la pantalla (`top: 60px; right: 24px;`), dejando el 100% del área del Goban despejada. Implementado el visualizador interactivo SVG `OniInhalationPreview.ts` al hacer hover sobre `👹`:
  - **Flechas de Arista Ortogonales con Alto Contraste**: Las flechas de atracción siguen estrictamente las líneas de la cuadrícula ($\downarrow$, $\uparrow$, $\rightarrow$, $\leftarrow$) en neón magenta vibrante con sombra de contraste y puntas triangulares nítidas en lugar de líneas diagonales flotantes.
  - **Exclusión de Grupos Inmunes**: Los grupos sólidos de 4+ piedras no muestran flechas moradas encima, eliminando el ruido visual.
  - **Máscara Azul Continua Unificada**: Las cadenas de 4+ piedras comparten un contorno perimetral continuo con relleno suave y badge centralizado `🛡️ Inmune (X piedras)` sin solapamiento de círculos internos.
  - **Puntas Prominentes en Trayectorias de Piedras**: Flechas gruesas con puntas marcadas hacia su casilla destino y calaveras de alerta si caen en la zona de devoración.
- [x] **Tarea 219 (Reparación de Targeting de Ryūjin y Habilidades)**:
  - Corregido el enlace de `heroOwnerId` en `ChampionManager.resetForMatch` para respetar al jugador humano independientemente de su color (Negras o Blancas).
  - Eliminado el disparo erróneo de `onMovePlaced` con la casilla de la piedra calcinada en `SVGRenderer.ts`.
  - Configurado `onPassiveBurnCompleted` en `GameController.ts` para avanzar ordenadamente el turno tras la Furia del Dragón.

## Fase 87: Escalado Canónico a Escala 19x19 de Habilidades de Campeones e IA en Tablero Máscara Oni (Completada)
- [x] **Tarea 217**: Estandarizar todas las habilidades activas y pasivas de campeones y agentes de IA para que en el Tablero Máscara Oni (`shape === 'oni'`, topología unificada 25x25) funcionen exactamente como si el tablero fuese **19x19** sin importar si en la configuración previa se seleccionó 9x9, 13x13 o 19x19:
  - **Kitsune (Escudo Divino)**: Otorga **5 cargas** de escudo (`KitsuneChampion.getShieldCharges`).
  - **Alquimista (Inversión Cromática)**: Otorga **4 transmutaciones** (`AlchemistChampion.getInversionCount`).
  - **Himiko (Lluvia Pétrea)**: Invoca **18 piedras celestiales** (`HimikoChampion.getStoneRainCount`).
  - **Tengu (Lluvia Meteórica)**: Descarga **27 meteoros** (`TenguChampion.getMeteorCount`).
  - **Ryūjin (Furia del Dragón)**: Activa la regla de 19x19 con 1 quema por grupo vivo de 2 ojos y +1 por cada ojo adicional (`RyujinChampion.checkPassiveTrigger`).
  - **IA & Motor de Apertura**: `AITurnManager`, `GameController` y `GoAI.ts` adaptados para ejecutar transmutaciones, meteoros, lluvia y aperturas Fuseki a escala de 19x19 en la Máscara Oni.

## Fase 86: Eliminación Definitiva del Selector de Modo Claro/Oscuro y Fijación Permanente de Tema Oscuro (Completada)
- [x] **Tarea 216**: Eliminar completamente los botones de alternancia de tema claro/oscuro (`#btn-menu-theme`, `#btn-game-theme`, `#btn-map-theme`), silenciar los listeners en `MenuEventBinder.ts` y fijar permanentemente `data-theme="dark"` en `ThemeManager.ts`.

## Fase 85: Rediseño Ergonómico y Nivelación de Previsualización de Escenario y Oponente (Sin Solapes, Standees Compactos, Posición Nivelada y Eliminación de Etiquetas) (Completada)
- [x] **Tarea 215**: Erradicar el 100% de solapamientos entre los personajes, el tablero y los botones inferiores en los pasos de Escenario (*Scenery*) y Oponente (*Opponent*) de todos los modos (Local y Online):
  - **Escala Compacta y Proporcional**: Standees de jugador y rival reducidos de 301px a 195px de altura (`width: 165px; height: 195px;`), caja misteriosa a `110x145px`, y tablero central a `135x135px`.
  - **Posición Nivelada Centrada**: Ajustada la posición vertical con `transform: translateY(0)` y `align-items: center` con `overflow: hidden` en el viewport, asentando los combatientes y el goban con naturalidad sobre el terreno escénico.
  - **Supresión de Etiquetas Inferiores**: Ocultadas y eliminadas las etiquetas y píldoras flotantes (`.duel-combatant-tag`, `.duel-stage-board-pill`) que causaban colisión directa con la cuadrícula de botones de fondos y rivales.
  - **Renderizado Completo Online**: Integrado el renderizado en tiempo real de `online-stage-board-svg` y actualización de la imagen del campeón anfitrión en el paso 4 del modo online.

## Fase 84: Placa CRAZY GO con Iluminación Uniforme, Escala Tipográfica (+30%) y Ajuste Fino de Posiciones (Completada)
- [x] **Tarea 214**: Regenerar la placa de madera "CRAZY GO" del menú de inicio (`title_board_crazy_go.png`) con iluminación ambiental uniforme y sin sombras laterales. Incrementar uniformemente el tamaño de todos los textos del menú un +30% (`font-size: 1.75rem`), y ajustar las posiciones espaciales relativas de Feedback (-10px a la izquierda), Story (+6px a la derecha), Options (+9px a la derecha) y Roguelike (+8px hacia abajo).

## Fase 83: Flujo Secuencial Diferido del Modo Online (Creación en Paso 5 Lobby para Host y Selección Previa de Héroe para Guest) (Completada)
- [x] **Tarea 211 (Host Lobby P2P diferido)**: Eliminada la apertura prematura de sala WebRTC/P2P y generación del código `GO-XXXX` en los pasos 1 a 4 del asistente (`OnlineController.openOnlineModal()` y `OnlineEventBinder.ts`). El banner `.room-code-banner` se reubicó exclusivamente en el **Paso 5 (Lobby)** en `modal-online.html`, y la sala se genera únicamente al alcanzar el Paso 5, garantizando que el anfitrión termine de configurar modo, tablero, campeón y escenario antes de que cualquier invitado pueda conectarse.
- [x] **Tarea 212 (Guest Selección Previa de Campeón)**: Reestructurada la pestaña "Join Room (Guest)" en dos fases lógicas secuenciales en `modal-online.html`: Fase 1 (Elección prominente del Campeón Místico del invitado con showcase panorámico y miniaturas) y Fase 2 (Entrada del código de sala `GO-XXXX` y botón `Connect 🚀`), evitando unirse accidentalmente con el héroe por defecto.
- [x] **Tarea 213 (Blindaje de Navegación y Limpieza de Conexiones)**: Al retroceder del paso 5 al 4 o cancelar en el anfitrión, `NetworkManager.disconnect()` limpia la sala para evitar conexiones a medio editar. Al cambiar de pestaña, se desconectan salas pendientes y se resetea el wizard al paso 1.

## Fase 82: Reparación Integral del Modo Online P2P, Copiado Limpio de Códigos, Desbloqueo del Jugador 2 y Corrección de Fondos (Completada)
- [x] **Tarea 206 (Modo Online P2P)**: Resolver las condiciones de carrera en el emparejamiento WebRTC P2P (`NetworkManager.ts` y `OnlineController.ts`): eliminación de `startGame()` anticipado en `onPeerJoin` del host, activación exclusiva tras `GUEST_JOINED` con margen de negociación de 500ms, y separación del caso `HERO_SELECT` para evitar bucles de handshake repetitivos.
- [x] **Tarea 207 (Interactividad del Jugador 2 en Red)**: Desbloqueo total de clics de Blancas en el tablero SVG (`SVGRenderer.ts`): evaluación reactiva de `isActionAllowed()` en la capa interactiva `.interactive-layer` en lugar de una clase CSS estática desactualizada, sincronización de `isInteractive` antes de `render()` en `handleNodeClick`, y re-renderizado reactivo en `onMoveReceived` y `onPassReceived`.
- [x] **Tarea 208 (Copiado de Códigos y Wizard Online)**: `copyRoomLink()` configurado para copiar únicamente el código de sala `GO-XXXX` sin URLs locales confusas, y visualización contextual de `Next ➔` (visible solo en pasos 1-4 del Host y oculto en Guest/Matchmaking para evitar confusión con `Connect 🚀`).
- [x] **Tarea 209 (Fondos Negros en Combate)**: Normalización de alias de escenarios en `HUDController.ts`, preservación de `config.background` en `GameController.ts` y corrección de rutas relativas `./bg_*.jpg` en `layout.css`, eliminando el 100% de pantallas negras en tableros especiales (Oni, Cielo, Volcán).
- [x] **Tarea 210 (Flujo de Tecla Escape)**: Manejo jerárquico de `Escape` en combate (deselección de habilidades/poliminós antes de abrir pausa), cierre limpio e inmediato del formulario de Feedback sin abrir Opciones por debajo, y restricción de la apertura de Opciones exclusivamente a partidas y expediciones roguelike.

## Fase 81: Placa Tradicional de Madera CRAZY GO y Unificación Tipográfica del Menú Principal (Completada)
- [x] **Tarea 205**: Sustituir el título de texto flotante "CRAZY GO" por una placa de madera tradicional (*Gaku / Kagami-ita*) no interactuable (`public/title_board_crazy_go.png`) perfectamente integrada con la viga del dojo, y unificar el `font-size` de todos los rótulos espaciales interactivos (`ROGUELIKE`, `LOCAL`, `ONLINE`, `STORY`, `FEEDBACK`, `TUTORIAL`, `OPTIONS`) exactamente a `1.35rem` con `font-weight: 900`.

## Fase 80: Rediseño Glassmorphism Borderless de Modo Online & Setup y Fuego Rojo Carmesí en Dificultad Hard (Completada)
- [x] **Tarea 203**: Rediseñar los componentes de configuración inicial (Expedición Roguelike y Modo Online) eliminando contenedores pesados y bordes rígidos: showcase de héroes abierto y transparente sin marcos oscuros interiores (`.hero-showcase-card`), tarjetas de selección `.btn-choice-card` con esquinas redondeadas de 20px y micro-iluminación orgánica, banner de código de sala y slots de lobby de cristal translúcido, y calibración de la llama de dificultad Hard (`.flame-hard`) a rojo carmesí puro de sangre (`hue-rotate(-60deg) saturate(6)`) eliminando cualquier tono naranja.
- [x] **Tarea 204 (Hotfix Crítico)**: Reparar la incapacidad de visualizar el modal de selección de colores del Alquimista en el cliente. Diagnosticar el *Event Bubbling* en SVG (`e.stopPropagation()`) que causaba una invocación concurrente de promesas, y la reparación de estructura del `modal-story.html` (cierres de `div` faltantes) que colapsaba el DOM ocultando todas las ventanas de UI inyectadas posteriormente por el Vite parser (`UITemplateLoader`).

## Fase 77: Rediseño Minimalista, Flotante y Borderless del Panel de Lección Completada en el Dojo Tutorial (Completada)
- [x] **Tarea 201**: Rediseñar integralmente la pantalla de finalización de lección en el Dojo Tutorial (`modal-tutorial.html`, `tutorial.css`, `TutorialManager.ts`): eliminar bordes rígidos y contenedores cerrados tipo caja, implementar panel flotante borderless con desenfoque de fondo cinemático (`backdrop-filter: blur(16px)`), nuevo medallón zen dorado con partículas pulsantes (`✦`), píldora minimalista para la siguiente lección, botón principal de acción con gradiente solar cálido y accesos directos de teclado (`↵ Enter`, `[R]`, `[Esc]`), además de fanfarria de victoria (`SoundFX.playVictoryFanfare()`).

## Fase 72: Desbloqueo Proactivo de Web Audio y Supresión de Advertencias de Autoplay (Completada)
- [x] **Tarea 197**: Supresión del 100% de advertencias de consola por `AudioContext` autoplay: guarda `hasUserInteracted` en `SoundFX.getContext()` para evitar llamadas automáticas de `MenuCameraController` en `mouseenter`/`focus`, activación proactiva en el primer gesto de usuario (`click`, `keydown`, `pointerdown`, `touchstart`), y regeneración de los paquetes `.zip` oficiales.

## Fase 71: Optimización de Relays MQTT y Arbitraje Determinista de Matchmaking (Completada)
- [x] **Tarea 196**: Depuración de la infraestructura P2P de Trystero eliminando brokers MQTT caídos/bloqueados que colgaban `Promise.all` (`NetworkManager.ts` y `OnlineController.ts`), fijando los dos clusters globales más estables (`broker.emqx.io` y `broker.hivemq.com`). Arbitraje determinista `selfId < peerId` en matchmaking para evitar colisión de hosts simultáneos, y blindaje de promesas en `AudioContext.resume()`.

## Fase 70: Reparación y Blindaje Integral del Registro de Combate y Repetición (Combat Log) (Completada)
- [x] **Tarea 195**: Resolver el bloqueo de la interfaz y fugas de eventos al abrir el Registro de Combate (`CombatLogModalRenderer.ts` y `KeyboardController.ts`): soporte de estado inicial vacío seguro para abrir desde el menú principal o antes del primer movimiento, aislamiento total de teclado para auto-play (`Espacio`), avance (`◀ / A`, `▶ / D`) y cierre (`Escape / L`) sin pasar turnos en combate de fondo, y reactivación correcta de `isInteractive` al salir.

## Fase 69: Blindaje de Red P2P y Matchmaking Online (Completada)
- [x] **Tarea 194**: Diagnosticar trazas de consola (extensiones de navegador y scripts de iframe web) y corregir el sistema de Matchmaking P2P en `OnlineController.ts` (migración a `@trystero-p2p/mqtt` con `makeAction` tipado, 5 brokers MQTT mundiales redundantes y servidores STUN/TURN). Soporte de copia de código de sala limpio en sandboxes/iframes (`hwcdn.net`, `itch.zone`).

## Fase 67: Sistema Integral de Efectos Especiales (SFX Web Audio) y Normalización de Música BGM (Completada)
- [x] **Tarea 191**: Implementar generadores acústicos procedurales en tiempo real mediante Web Audio API en `SoundFX.ts`: `playMeteorImpact` (Tengu), `playDragonFlame` (Ryūjin), `playCelestialDrop` (Himiko), `playAlchemicalTransmute` (Alquimista), `playDivineShieldCast` y `playDivineShieldShatter` (Kitsune), `playVolcanoEruption` (Tablero Volcánico), `playBossDragonBreath` (Gran Dragón Sabio Gris), `playSkyBlockLand` (Tablero del Cielo), `playVictoryFanfare` y `playDefeatGong` (Finales de Combate).
- [x] **Tarea 192**: Conectar los nuevos efectos de sonido en vivo en los VFX y gestores (`TenguVFX.ts`, `RyujinVFX.ts`, `HimikoVFX.ts`, `AlchemistVFX.ts`, `KitsuneVFX.ts`, `BossVFX.ts`, `SkyVFX.ts`, `StageHazardManager.ts`, `RogueliteManager.ts`, `ScoreModalRenderer.ts`, `BossManager.ts`).
- [x] **Tarea 193**: Corregir `BGMGenerator.ts` eliminando las referencias a archivos inexistentes `.mp3` (404), unificando el mapeo semántico de biomas hacia `bgm_zen.wav` (entornos pacíficos/zen) y `bgm_battle.wav` (entornos marciales/combate) con tolerancia a fallos.

## Fase 66: Reimaginación Temática del Tablero Máscara Oni (Inhalación Gravitacional, Fauces del Abismo 23x23 y Festín de Almas) (Completada)
- [x] **Tarea 189**: Rediseñar la mecánica del Tablero Máscara Oni (`board.shape = 'oni'`) sustituyendo la lava estática por dos dinámicas vivas basadas en Go:
  1. **La Inhalación del Demonio (Vórtice Gravitacional)**: Cada 10 turnos por jugador (20 totales), el Oni inhala y atrae 1 casilla hacia su boca a todas las piedras sueltas o parejas débiles (1-2 piedras), mientras las cadenas sólidas (3+ piedras) resisten firmes.
  2. **El Festín de Almas (Turno Extra / Sente Supremo)**: Al capturar un grupo de 2 o más piedras enemigas simultáneamente, el jugador recibe un turno consecutivo inmediato.
- [x] **Tarea 190**: Integración de VFX de vórtice gravitacional de viento/miasma, animaciones fluidas de desplazamiento de fichas y banner/HUD actualizados.

## Fase 64: Perfeccionamiento de Texturas 3D de Poliminós (2x1 y 2x2), Rotación [R] Reactiva y Mejora del Tutorial de Lluvia Meteórica y Hechizo Meteorito (Completada)
- [x] **Tarea 179**: Rediseño visual y shaders de alta fidelidad 3D para Monolito (2x2) (losa megalítica de Go, 4 piedras con brillo especular canónico, grabados rúnicos dorados en cruz y sello central `🧱`) y Duplicidad (2x1) (cápsula continua de Go, piedras gemelas 3D y sello `🀄`).
- [x] **Tarea 180**: Seguimiento continuo del cursor en el Goban (`mousemove` en SVG) y rotación inmediata con `[R]` y clic en HUD en tiempo real con previsualización ghost instantánea.
- [x] **Tarea 181**: Auto-ajuste de bordes `fitsAt` para Monolito 2x2 y soporte de agrupación `polyGroupId` en modo Sandbox.
- [x] **Tarea 182**: Mejora pedagógica de la Lección 11 del Tutorial (`TutorialSteps.ts`): explicación de área (25%), recuento de meteoros (6/13/27), probabilidades de impacto (~30% en 9x9), daño indiscriminado (fuego amigo) e inmunidad con Escudo Divino (ES/EN).
- [x] **Tarea 183**: Implementación de los 2 ejemplos interactivos del Hechizo consumible de Meteorito en la Lección 12 (`TutorialSteps.ts`, `TutorialManager.ts`, `RogueliteManager.ts`): solo 1 piedra blanca inicial en `(4,4)` para garantizar el impacto en Ejemplo 1, y corrección del Rebobinado a 1 solo paso (`steps = 1` en tutorial) con animación celestial de restauración de piedras.

## Fase 63: Optimización del Menú Sandbox y Tablero Máscara Oni (Completada)
- [x] **Tarea 177**: Rediseño compacto, ergonómico y visualmente optimizado del panel lateral flotante del Sandbox (`modal-sandbox.html`, `sandbox.css`, `SandboxController.ts`, `OptionsEventBinder.ts`). Grid 4x1 de pestañas perfecto sin overflow, layout responsive sin interferir con el Goban de combate, header con toggle directo de pincel y botón de cierre `✖`.
- [x] **Tarea 178**: Implementación completa del Tablero Dinámico "Máscara Oni" (`oni` en `BoardGenerators.ts`, `StageHazardManager.ts`, `types/index.ts`, modales) con vómito de lava en turno 30.

## Fase 62: Matchmaking, Lobby Libre, Fix Alquimista 4P y Poliminós Duplicity/Monolith (Completada)
- [x] **Tarea 174**: Permitir Lobby Libre y Matchmaking Anónimo, permitiendo que la IA y amigos jueguen juntos en online, y emparejamiento automático global.
- [x] **Tarea 175**: Arreglar la habilidad del Alquimista (y todos los campeones activos) en partidas de 4 jugadores (resolución de modalidad de color y des-congelamiento de UI).
- [x] **Tarea 176**: Mejorar las piedras especiales Duplicidad (rotación `[R]`, clic en HUD y auto-ajuste de bordes) y Monolito (losa 2x2, texturas y shaders 3D con relieve y runas talladas).

## Fase 61: Fixes y Mejoras de UI (Completada)
- [x] **Tarea 165**: Separación de lecciones en dos módulos visuales (Módulo I: Go Canónico y Módulo II: Crazy Go) en modal-tutorial.html y MenuEventBinder.ts.
- [x] **Tarea 166**: Añadir lección Ojos Falsos.
- [x] **Tarea 167**: Añadir lección Snapback (Uttegaeshi).
- [x] **Tarea 168**: Añadir lección Seki (Vida Mutua).
- [x] **Tarea 169**: Añadir lecciones especiales (Topologías y Vacío, Sinergias de Magia) a TutorialSteps.ts para ambos idiomas (ES/EN).
## Fase 59: Tablero del Cielo (Sky Board) y Colapso Celestial de Bloques Cuadrados (Completada)
- [x] **Tarea 160**: Nueva topología y forma de tablero `sky` en `BoardGenerators.ts`, `types/index.ts` con soporte en tamaños 9x9, 13x13 y 19x19.
- [x] **Tarea 161**: Decoraciones estéticas diegéticas de nubes celestiales etéreas (`.sky-cloud-drift`), estrellas titilantes (`.sky-star-twinkle`) y gradientes `#sky-cloud-grad` en las 4 esquinas del marco de madera Kaya en `SVGRenderer.ts` y `SVGDefs.ts`.
- [x] **Tarea 162**: Peligro ambiental procedural en `StageHazardManager.ts`: activación cada 20 turnos totales (10 turnos por jugador / 10b, 20b, 30b...). Selección aleatoria de 5 bloques cuadrados $2\times 2$ (4 casillas por bloque, total hasta 20 casillas) con destrucción de topología (`RulesEngine.destroyTopology`).
- [x] **Tarea 163**: Animación VFX cinematográfica `SkyVFX.ts` con 5 bloques cuadrados descendiendo de arriba a abajo, estelas celestes, ondas expansivas, partículas y sacudida de pantalla.
- [x] **Tarea 164**: Integración completa en el Asistente de Partida Local (`modal-local-setup.html`), Lobby Online (`modal-online.html`), HUD superior (`#ui-sky-warning`), controladores de eventos y localización 100% bilingüe (ES/EN).

## Fase 22: Rediseño Cinemático Diegético de la Pantalla de Continuar Expedición Roguelike (Completada)
- [x] **Tarea 155**: Generación de ilustraciones en perspectiva trasera (vistas de espalda) de los 7 campeones caminando hacia el sendero místico (`public/heroes/*_back.png`).
- [x] **Tarea 156**: Creación de fondos temáticos en dos caminos narrativos: interior del Dojo tradicional (`bg_choice_dojo.jpg`) y sendero de montaña con nodos de Go y Torii (`bg_choice_map.jpg`).
- [x] **Tarea 157**: Placa flotante central informativa con el nombre del héroe, icono, nodo/Tier actual y dificultad de la expedición activa.
- [x] **Tarea 158**: Controlador interactivo de cámara 2.5D con Depth of Field (`RogueChoiceCameraController.ts`), enfoque cinematográfico y revelación dinámica de etiquetas al pasar el cursor.

## Fase 21: Sistema de Foco de Cámara Interactivo (Completada)
- [x] **Tarea 150**: Reestructuración del contenedor del menú principal (`index.html`) añadiendo `perspective` y un subcontenedor de cámara.
- [x] **Tarea 151**: Implementación de Depth of Field (`filter: blur`, `brightness`) y separadores Z-index para el fondo de pantalla en `base.css`.
- [x] **Tarea 152**: Creación de `MenuCameraController.ts` para interpolar transformaciones 3D basándose en el hover relativo al centro.
- [x] **Tarea 153**: Integración del controlador de cámara en `MenuEventBinder.ts`.
- [x] **Tarea 154**: Migración total a **Entorno Espacial 2.5D**. Eliminados botones UI y reemplazados por elementos físicos (`.dojo-item`) en un escenario 16:9 posicionado con coordenadas porcentuales absolutas.
- [x] **Tarea 159**: Corrección de Jitter y Aceleración Logarítmica en la Cámara 3D del Menú Principal (`MenuCameraController.ts`, `base.css`): Zoom óptico in-situ (0px lateral shift) mediante `transform-origin` dinámico, amortiguación debounced de 75ms y curva Ease-Out Expo (`cubic-bezier(0.16, 1, 0.3, 1)`).

## Fase 1: Motor Canónico y Topologías
- [x] Grafo de adyacencia no euclidiano (`GraphBoard`).
- [x] Reglas puras de Go (Libertades, Capturas, Ko simple, Suicidio ilegal, Komi).
- [x] Conteo de territorio por Flood-Fill (BFS).
- [x] Topologías iniciales (Cuadrado, Triangular, Hexagonal).

## Fase 2: Roguelike & Campeones
- [x] 4 Campeones: Tengu, Kitsune, Oni, Ronin.
- [x] Habilidades activas y pasivas balanceadas.
- [x] Animaciones SVG fluidas.
- [x] Mapa procedural con 6 Tiers de nodos y bifurcaciones.
- [x] Pantallas de configuración estética con carrusel de héroes.

## Fase 3: Modos de Juego Especiales
- [x] **Modo 4 Jugadores (Go Cuádruple):** Negras ⚫, Blancas ⚪, Esmeralda 🟢, Amatista 🟣.
- [x] Multijugador Online P2P WebRTC con túnel Cloudflare.
- [x] Refactorización Arquitectónica Integral (Clean Architecture & SOLID).

## Fase 4: Pulido de Sistema, Táctica, Audio e Interfaz (Completada)
- [x] **Tarea 1**: Configuración de `allowedHosts: true` en `vite.config.ts` para túneles externos.
- [x] **Tarea 2**: Sistema de turnos y rondas ($1a, 1b\dots$) con conteo de turnos individuales por jugador para pasivas.
- [x] **Tarea 3**: Mejora táctica de la IA por niveles (aperturas en 3ª/4ª línea, lectura de contraataques y penalización de auto-atari).
- [x] **Tarea 4**: Rediseño de "Lluvia Meteórica" (zona del 15% del tablero con 7 impactos equiprobables).
- [x] **Tarea 5**: Rebobinado preciso intra-partida y persistencia del mapa roguelike en `localStorage`.
- [x] **Tarea 6**: Atajos de teclado completos y panel de referencia en el modal de Opciones.
- [x] **Tarea 7**: Corrección de distorsión acústica en `BGMGenerator.ts` (desconexión y ciclo de vida Web Audio).
- [x] **Tarea 8**: Rediseño estético del menú de inicio (Crazy Go +50% grande, renombre a "Modo Local" y "Online").

## Fase 5: Estética y Ambientación Premium de los Combates
- [x] **Tarea 9**: Ambientación visual in-game con fondo atmosférico oriental (dojo/tatami/jardín zen) y corrección visual del badge de escenario (`#stage-badge`) en la barra superior.
- [x] **Tarea 10**: Tablero de Go (Goban) con textura de madera de Kaya tradicional, biselado 3D, sombras profundas y cantoneras/florituras metálicas doradas ornamentales en las 4 esquinas.

## Fase 7: Roster de 5 Campeones, Piedras Sagradas, Poliminós y Pulido Visual
- [x] **Tarea 15**: Roster de 5 Campeones (Tengu, Himiko, Kitsune con 3 cargas, Ronin, Ryūjin con Furia del Dragón quemando 2 piedras enemigas).
- [x] **Tarea 16**: Efecto visual de Piedra Sagrada (halo dorado con filtro `#sacred-glow`, icono y tooltip descriptivo en hover).
- [x] **Tarea 17**: Visibilidad garantizada del número `0` en hechizos agotados y reposicionamiento del toast `#ui-alert` para no cubrir la barra inferior.
- [x] **Tarea 18**: Actualización del documento de diseño Obsidian (`Crazy Go - Juego.md`) con las 3 piedras poliminó (Germinante 1x1, Dominó 2x1 rotatorio, Monolito 2x2).
## Fase 8: Tableros Asimétricos / Erosionados & Fichas Poliminó Tácticas (Completada)
- [x] **Tarea 22**: Generador de Tableros Asimétricos y Erosionados (`BoardGenerators.ts` con 🪨 Erosionado / Carved Goban, 🕳️ Islas / Abismos interiores y ➕ Cruz / Diamante).
- [x] **Tarea 23**: Sistema de Fichas Poliminó en Combate (`PolyominoManager.ts` con 🌿 Germinante 1x1, 🀄 Dominó 2x1 rotatorio [Tecla R / Horiz ⇄ Vert] y 🧱 Monolito 2x2).
- [x] **Tarea 61**: Equipos y Lobby Libre
- [x] Arquitectura de Juego en Equipos (Rengo Style) en GameState y SVGGhostPreview
- [x] Estructura backend `GameSetupConfig.slots` para configuración libre
- [x] Lógica de control de turnos (Humano Local vs IA vs Humano Online) en GameController
- [x] Interfaz UI (Modales) para la creación de "Lobby Libre"
- [ ] Implementar el balanceo de la habilidad de escudo en grupo de Kitsune (Pendiente de decisión de diseño)
- [x] **Tarea 24**: Colocación y resolución de capturas multi-piedra simultáneas (`RulesEngine.tryPlaceMultiStones`).
- [x] **Tarea 25**: Renderizado dinámico de Ghosts Poliminó, auras botánicas `🌿` y rotación en tiempo real en `SVGRenderer.ts`.
- [x] **Tarea 27**: Duelistas en Combate 300% Más Grandes & Perspectiva Cenital Zen (Eliminados artefactos blancos en katana del Ronin y fondos opacos en rivales, encuadre superior sereno con katana en reposo, escalado grandioso en tatami y sombras realistas).

## Fase 9: Regla Canónica de Ko, Selección de Campeones en Modo Local y Corrección de CrazyGo.exe (Completada)
- [x] **Tarea 28**: Activación y validación estricta de la Regla de Ko simple en `RulesEngine.ts` y `SVGRenderer.ts` (prohibición de repetición inmediata del estado del tablero con toast explicativo y sonido de jugada ilegal).
- [x] **Tarea 29**: Selector de Campeones Místicos en Modo Local (`#new-game-modal`, `ModalManager.ts`, `GameController.ts` y `HUDController.ts` para 1v1 y 1vIA).
- [x] **Tarea 30**: Corrección completa del ejecutable `CrazyGo.exe` y empaquetador `CrazyGo_Portable.zip` (servidor HTTP embebido persistente con perfil aislado `--user-data-dir` eliminando el error `ERR_CONNECTION_REFUSED`).

## Fase 10: Retratos en Primer Plano & Menú Roguelike Panorámico Abierto (Completada)
- [x] **Tarea 31**: Generación e integración de retratos en primer plano de alta definición de las caras de los 5 Campeones (`tengu_face.jpg`, `himiko_face.jpg`, `kitsune_face.jpg`, `ronin_face.jpg`, `ryujin_face.jpg`).
- [x] **Tarea 32**: Rediseño panorámico expansivo sin contenedores claustrofóbicos (`.modal-rogue-panoramic`), con marco de 980px, cristal traslúcido, showcase horizontal de 200px con halo dorado, tira de miniaturas en primer plano y contador de 5 campeones (`1 / 5`).

## Fase 11: Modo Sandbox, Laboratorio de Pruebas & Troubleshooter en Vivo (Completada)
- [x] **Tarea 33**: Controlador central de laboratorio y depuración `SandboxController.ts` (pinceles de colocación directa de piedras P1-P4, sagradas, poliminós, hoyos y borrador).
- [x] **Tarea 34**: Panel interactivo `#modal-sandbox` con 4 pestañas operativas (Pinceles, Topología y Tamaño en vivo, Escenarios de prueba de reglas, Hechizos y Campeones).
- [x] **Tarea 35**: Escenarios predefinidos de 1-clic (Test de Regla de Ko, Test de Atari Múltiple, Test de Piedra Sagrada, Test de 2 Ojos Vivos & Territorio, Test de Islas y Germinante).
- [x] **Tarea 36**: Acceso dual directo desde el Menú Principal (`#btn-menu-sandbox`) y dentro de cualquier combate o run (`#btn-game-sandbox`).

## Fase 12: Ajuste de Altura del Tablero & Estandarización Panorámica Abierta en Todos los Modos (Completada)
- [x] **Tarea 37**: Reajuste de proporciones de `#board-container` (`max-width/max-height: min(calc(100vh - 180px), 610px)`), márgenes zenitales y reducción de padding en `#board-viewport` para visualización 100% visible y holgada sin tocar la barra inferior de hechizos.
- [x] **Tarea 38**: Estandarización del diseño panorámico de cristal translúcido oscuro sin cajas sobre-anidadas en todos los menús (`.modal-setup` 960px, `.modal-online` 920px, `.modal-options` 860px, `.modal-deck` 920px).

## Fase 13: Multijugador Online para 4 Jugadores (Go Cuádruple en Red P2P WebRTC) (Completada)
- [x] **Tarea 39**: Topología en Estrella P2P en `NetworkManager.ts` con gestión multi-peer de hasta 3 invitados concurrentes y retransmisión determinista de jugadas, pases y recuento.
- [x] **Tarea 40**: Lobby interactivo con slots de jugadores dinámicos (`.online-slot-card`), selector de 2P / 4P, botón de inicio forzado y sincronización de colores (P1 Negras, P2 Blancas, P3 Esmeralda, P4 Amatista).
- [x] **Tarea 41**: Orquestación en `OnlineController.ts` y enlace de eventos en `main.ts` con blindaje en `vite.config.ts` para exclusión de directorios de empaquetado.

## Fase 14: Generador Procedural Infinito de Topologías, Rotación Tooltip de Poliminós y Eliminación de Veneno (Completada)
- [x] **Tarea 42**: Eliminación total del hechizo veneno (`poison`) de `SpellId`, `RogueliteManager`, `RoguelikeRunManager`, recompensas de `RoguelikeController`, `ECS.ts`, HTML y mapeos de atajos de teclado (1-4).
- [x] **Tarea 43**: Rediseño ergonómico de rotación del Dominó 2x1 (eliminado el botón flotante invasivo, integrado indicador dinámico `2x1 ⇄ [R]` en la carta y rotación fluida con la tecla `R`).
- [x] **Tarea 44**: Generador Procedural Infinito de Topologías Orgánicas (`🎲 Procedural` en `BoardGenerators.ts`) con 4 arquetipos orgánicos, cuellos de botella tácticos y validación matemática de conectividad estricta (BFS Flood-Fill) para 100% cumplimiento canónico de Go.
- [x] **Tarea 45**: Eliminación de `.rogue-counter-badge` (`1 / 5`) y `.hero-portrait-badge`, eliminación de contenedores y bordes sobre-anidados en `.hero-showcase-card`, optimización de espaciado/márgenes e incremento general del 5-15% en tamaños de fuentes pequeñas.
- [x] **Tarea 46**: Reestructuración estratégica del motor de IA (`GoAI.ts`) para eliminar el arrastre ciego en dificultades Fácil y Medio, implementando formas canónicas de Go (Kosumi, Ikken-Tobi, Keima, Boca de Tigre), control de esquinas/lados y cortes tácticos.
- [x] **Tarea 47**: Refactorización y Modularización de los Archivos más Grandes del Proyecto (`main.ts` reducido a orquestador de 40 líneas, `SVGRenderer.ts` desacoplado con `SVGDefs.ts` y `SVGGhostPreview.ts`, y `ModalManager.ts` desacoplado con `ScoreModalRenderer.ts` y `RogueModalRenderer.ts`, más extracción de `KeyboardController.ts` y `AppEventBinder.ts`).
- [x] **Tarea 48**: Previsualización Dinámica de Zona de Impacto en Hover para "Lluvia de Meteoros" (cálculo de cluster del 15% / mín 7 casillas en `ChampionManager.getMeteorZoneNodes`, halos ardientes `#glow-meteor`, diferenciación cromática de piedras enemigas `#ef4444` y aliadas `#f59e0b`, anillo giratorio en epicentro `☄️` y tooltip flotante sobre el Goban).
- [x] **Tarea 49**: Estandarización del Showcase Panorámico de Campeones en Modo Local (`new-game-modal` con carrusel horizontal idéntico al Roguelike, botones `<` y `>`, tarjetas de habilidad, tira de miniaturas en primer plano e inclusión del personaje clásico **⚪ Sin Campeón / Maestro del Go Clásico** con retrato e información poética de reglas puras).
- [x] **Tarea 50**: Integración de Selección de Campeones en Modo Online P2P (Showcase panorámico tanto para el Anfitrión en "Crear Sala" como para el Invitado en "Unirse a Sala", sincronización P2P de `heroId` en `HERO_SELECT` / `LOBBY_UPDATE` / `START_GAME`, y visualización del héroe elegido en las tarjetas de jugadores del Lobby).
- [x] **Tarea 51**: Corrección de Aislamiento de Habilidades de Héroe en Menú Roguelike (Unificación y desacoplamiento de selectores con prefijo `rogue-`, eliminación de la duplicidad donde aparecían tarjetas activa + pasiva simultáneas de héroes distintos en Tengu, Himiko, etc., delegando a `ModalManager.renderHeroShowcaseElements('rogue', tempHero)`).
- [x] **Tarea 52**: Sistema Automatizado de Túnel en Vivo para Multijugador sin Descargas (`scripts/share.js`, comando `npm run share` y archivo de 1-clic `JUGAR_ONLINE_CON_AMIGOS.bat` con detección de IP pública y reenvío directo para conectar amigos sin pasar archivos `.zip`).
- [x] **Tarea 53**: Blindaje de Red P2P WebRTC con Servidores STUN (Google / Mozilla) y TURN Relay (OpenRelay) para garantizar 100% de éxito en conexiones a través de NATs simétricos, CGNAT y redes móviles sin cortes de WebSocket.
- [x] **Tarea 54**: Corrección de Condición de Carrera en `PeerJS DataConnection` (Verificación inmediata de `connection.open` en lugar de esperar pasivamente el evento `'open'` ya emitido, permitiendo que el handshake host-invitado y el inicio automático de partida `START_GAME` se dispare instantáneamente al conectarse).
- [x] **Tarea 55**: Migración del Motor P2P a Trystero Descentralizado Multi-Relay (Eliminación definitiva de la dependencia del servidor centralizado `0.peerjs.com` que causaba errores `Could not connect to peer ...` por fallos de enrutamiento DNS, sustituyéndolo por matchmaking descentralizado con múltiples relays redundantes, conexión instantánea y compatibilidad 100% P2P sin servidor único).
- [x] **Tarea 56**: Rebalanceo y Aleatoriedad Uniforme de la Pasiva de Himiko (Modificación del trigger pasivo a su 15º turno personal en lugar del 10º, aplicación del algoritmo de barajado Fisher-Yates para distribución uniforme de las 4 piedras por todo el tablero e integración con el motor de capturas y reglas).
- [x] **Tarea 57**: Migración a WebTorrent Swarm P2P (`@trystero-p2p/torrent` con trackers WebTorrent de alta disponibilidad `tracker.webtorrent.dev`, `openwebtorrent.com`, `files.fm` y servidores TURN redundantes, eliminando los relays caídos de Nostr `chorus.almostmachines.dev`).
- [x] **Tarea 58**: Modernización del Motor de IA con Arquitectura KataGo / KaTrain (`GoAI.ts`: Apertura Fuseki canónica para 9x9/13x13/19x19, Campo de Radiación de Influencia y Moyo, Puntos Vitales Nakade y Búsqueda en Árbol Minimax Alpha-Beta de 2 a 3 jugadas de profundidad para dificultades Difícil y Maestro).
- [x] **Tarea 59**: Corrección de Transición de Pantalla para Invitados en P2P (`NetworkManager.ts`: Sincronización de pulsos redundantes en `START_GAME`, soporte de `REQUEST_START` bidireccional y emisión broadcast a toda la sala sin pérdida de paquetes, cerrando el modal automáticamente y lanzando la partida en ambos extremos al instante).
- [x] **Tarea 60**: Migración a MQTT Pub-Sub Signaling y Fijación Persistente de Código de Sala (`NetworkManager.ts` y `ModalManager.ts`: Conexión de descubrimiento instantáneo <10ms vía brokers MQTT globales de alto rendimiento `broker.emqx.io`, `test.mosquitto.org`, `hivemq.com` y fijación estricta del código `GO-XXXX` evitando regeneraciones accidentales al cambiar de personaje o ajustes).
- [x] **Tarea 61**: Aislamiento Estricto entre Estado Roguelike y Multijugador Online (`GameController.ts`: Eliminado el secuestro de configuración de `RoguelikeRunManager.isRunActive` que forzaba `gameMode: '1via'` y activaba la IA en partidas online P2P).
- [x] **Tarea 62**: Calibración Científica de Dificultad KaTrain / KataGo (`GoAI.ts`: Modo Fácil humanizado con 38% de despistes dóciles y 50% de defensa de ataris para principiantes; Modo Maestro reforzado con Minimax 3-ply, Quiescence Search y puntos vitales Nakade para nivel 2 Dan).
- [x] **Tarea 63**: Unificación de Acto Único y Eliminación de Nodos Élite (`RoguelikeMapGenerator.ts` & `RoguelikeController.ts`: Todas las batallas intermedias se presentan como batallas estándar continuas con escalado progresivo de Kyu y únicamente el Tier final como 👑 Jefe Final del Goban).
- [x] **Tarea 64**: Implementación de Tesujis de Sacrificio Avanzado en la IA (`GoAI.ts`: Integración de *Uttegae / Snapback* (trampa de cebo para captura masiva inmediata), *Horikomi* (inserción para destrucción de ojos falsos y reducción de libertades en Semeai) y *Suteishi / Tenuki* (abandono intencionado de piedras menores muertas para ganar la iniciativa exterior y no crear formas pesadas)).
- [x] **Tarea 65**: Corrección de Invasiones Suicidas y Pase Proactivo de la IA Básica (`GoAI.ts`: Prohibición total de jugar piedras muertas de 1-2 libertades en territorio cerrado rival para todos los niveles, corrección del cálculo de *blunder* que inflaba jugadas suicidas en fácil y pase proactivo inmediato cuando no existen jugadas viables de territorio).
- [x] **Tarea 66**: Ajuste Fino (+5% Inteligencia) en Modos Fácil y Medio (`GoAI.ts`: Reducción del blunder rate al 28% y subida de defensa de atari al 62% en fácil; mayor ponderación de Fuseki, formas canónicas y cortes tácticos en medio con reducción de varianza térmica).
- [x] **Tarea 67**: Escalado Dinámico de Meteoros y Tooltips de Tengu el Astrónomo (`ChampionManager.ts`, `RoguelikeRunManager.ts` & `HUDController.ts`: Habilidad Activa calibrada a 5 meteoros en 9x9, 9 meteoros en 13x13 y 15 meteoros en 19x19 con actualización dinámica de tooltips, descripciones y notificaciones).
- [x] **Tarea 68**: Independencia Total de Agentes FFA y Personalidades de IA (`GoAI.ts`: Cada IA evalúa a todos los demás jugadores como rivales independientes en FFA sin aliarse, corrección del cálculo de *isTigersMouth* que forzaba triángulos de 3 piedras en esquinas vacías (*Dango*), penalización anti-apelotonamiento en apertura y estilos estratégicos diferenciados para Blanco, Verde y Púrpura).
- [x] **Tarea 69**: Wizard Interactivo y Dinámico Paso a Paso para el Modo Libre (`index.html`, `ModalManager.ts`, `AppEventBinder.ts` & `style.css`: Rediseño completo del modal de configuración en un flujo dinámico de 5 pasos horizontales con auto-avance instantáneo al clicar, stepper superior interactivo, tarjetas panorámicas y resumen visual).
- [x] **Tarea 70**: Configuración Personalizada de Piedras Especiales, Eliminación de Botón Duplicado de Habilidad y Supresión de Conteo Prematuro (`index.html`, `PolyominoManager.ts`, `HUDController.ts`, `ModalManager.ts` & `AppEventBinder.ts`: Selector completo de Piedras Especiales / Poliminós en el Wizard con cantidades para Jugador e IA, desactivado por defecto para Go Puro, eliminación del botón repetido de habilidad activa en la barra inferior manteniendo solo la tarjeta del duelista, y eliminación del botón manual de conteo prematuro en el HUD).
- [x] **Tarea 71**: Inventario Inicial Roguelite (2 Rebobinar) y Persistencia Real de Consumibles entre Nodos/Combates (`RoguelikeRunManager.ts`, `RogueliteManager.ts`, `PolyominoManager.ts`, `RoguelikeController.ts` & `RogueModalRenderer.ts`: Inicio de run únicamente con 2 hechizos de Rebobinar y 0 poliminós/hechizos extra, persistencia estricta del gasto y adquisición de consumibles a lo largo de toda la expedición, recompensas de batalla ampliadas con fichas poliminó, catálogo del mercader con reposición de todos los consumibles y meditación en descansos).
- [x] **Tarea 72**: Corrección de Salto Involuntario en Paso 3 de Configuración (`AppEventBinder.ts`: Eliminado el auto-avance al seleccionar el tamaño de cuadrícula 9x9 / 13x13 / 19x19, permitiendo seleccionar libremente el tamaño y la topología sin saltar de pantalla antes de tiempo).
- [x] **Tarea 73**: Escudo Divino de 3 Turnos con Inmunidad Absoluta a Poderes, Escalado +20% de Silueta y Standees para 4 Jugadores (`GraphBoard.ts`, `GameState.ts`, `ChampionManager.ts`, `RogueliteManager.ts`, `RulesEngine.ts`, `SVGRenderer.ts`, `HUDController.ts`, `index.html` & `style.css`: Duración de 3 turnos para el Escudo Divino con contador visual en el tablero e inmunidad completa contra meteoros, transmutaciones y llamas de todos los jugadores; aumento del 20% en escala de silueta del jugador; y panel lateral dinámico de 3 contrincantes para partidas de 4 jugadores con rotación activa en local y seguimiento de IA).
- [x] **Tarea 74**: Retrato en Primer Plano en Diálogo de Continuar Expedición y Mazo (`RogueModalRenderer.ts` & `index.html`: Sustituida la miniatura de cuerpo completo por la ilustración de primer plano de la cara del Campeón en el modal de continuar expedición y en la inspección de alforja/mazo).
- [x] **Tarea 75**: Navegación Universal con Teclado y VFX de Lluvia Pétrea Celestial de Himiko (`AppEventBinder.ts`, `VFXManager.ts`, `ChampionManager.ts` & `style.css`: Navegación integral por teclado con flechas, teclas rápidas numéricas y Enter/Espacio en todos los selectores de héroes, cartas de recompensa, eventos y hechizos; rediseño de la Lluvia Pétrea de Himiko con trayectoria fluida de cometas celestiales e impacto directo en la casilla donde emerge físicamente la piedra bendecida).
- [x] **Tarea 76**: Resolución de Capturas en Cascada tras Inversión Cromática y Transmutación (`RulesEngine.ts`, `ChampionManager.ts` & `RogueliteManager.ts`: Creado el método `RulesEngine.resolveBoardCaptures` para evaluar y retirar inmediatamente cualquier piedra o grupo enemigo que se quede con 0 libertades tras el uso de la Inversión Cromática de Ronin o el Hechizo de Inversión Yin-Yang).
- [x] **Tarea 77**: Detección de Doble Ojo (Grupo Vivo) para Ryūjin y Etiqueta de Habilidad Pasiva (`GraphBoard.ts`, `ChampionManager.ts`, `HUDController.ts`: Implementado el algoritmo `GraphBoard.hasLivingGroup` para reconocer grupos vivos con $\ge 2$ ojos separados, activando la Furia del Dragón de Ryūjin de inmediato; y corregida la etiqueta en la tarjeta de duelo para mostrar "(Habilidad Pasiva)" en lugar de "(Automática)").
- [x] **Tarea 78**: Jefe Final Roguelike "Gran Dragón Sabio Gris" con Habilidad Activa de Calcinación de Esquina del 25% (`BossManager.ts`, `RoguelikeMapGenerator.ts`, `GameController.ts`, `VFXManager.ts`, `HUDController.ts` & `style.css`: Creado el Jefe Final con retrato de Dragón oriental sabio y grisáceo con bigotes, dotado de la habilidad activa "Aliento Calcinante del Dragón" con 2 cargas utilizables por la IA para destruir el 25% del tablero en una esquina y colocar una piedra en el centro del vacío).
- [x] **Tarea 79**: Detección Matemática Rigurosa de Ojo Verdadero (True Eye) y Doble Ojo Canónico (`GraphBoard.ts` & `VFXManager.ts`: Implementada la fórmula canónica de Go en `GraphBoard.isTrueEye` con comprobación ortogonal y control estricto de esquinas diagonales para eliminar falsos positivos; y mejorada la animación de Aliento de Llamas del Dragón para Ryūjin con chorro de fuego descendente, ascuas y ondas de choque).
- [x] **Tarea 80**: Salida al Menú Principal y Botón de Cierre en Ventana de Opciones (`index.html`, `AppEventBinder.ts` & `style.css`: Añadido botón "🏠 Salir al Menú Principal" en el footer del modal de Opciones para abandonar la partida actual en cualquier momento, además de un botón '✖' de cierre rápido en la cabecera).
- [x] **Tarea 81**: Eliminación de Máscara Blanca y Pulido de Colores en Modo Claro (`style.css`: Suprimida la capa blanquecina sobre la ilustración de fondo del menú principal en Tema Claro para mostrar el arte nítido y cristalino; y rediseñada la paleta de colores de botones, tipografía y tarjetas con alto contraste y armonía estética).
- [x] **Tarea 82**: Corrección y Fluidez de la Lluvia Pétrea Celestial de Himiko (`SVGRenderer.ts` & `VFXManager.ts`: Resuelto el bug donde las capas activas de animación se limpiaban prematuramente tras impactar la primera ficha con `innerHTML = ''`; y mejoradas las 4 estelas luminosas celestes multicapa con núcleo de luz y cadencia coordinada para que cada cometa descienda e impacte de forma fluida y visible).
- [x] **Tarea 83**: Selector de Campeones y Disparador Universal de Habilidades en Modo Sandbox (`SandboxController.ts`, `index.html` & `AppEventBinder.ts`: Añadido selector completo de 7 campeones en el panel de pruebas con botones de activación ilimitada para disparar habilidades activas y forzar habilidades pasivas como la Lluvia Pétrea de Himiko, Furia de Ryūjin, Escudo de Kitsune, Inversión de Ronin o Calcinación del Dragón en cualquier instante).
- [x] **Tarea 84**: Guardado Automático Persistente y Limpieza del Modal de Opciones (`SoundFX.ts`, `index.html` & `AppEventBinder.ts`: Eliminados los botones redundantes del pie del modal de opciones dejando únicamente el botón de cierre '✖', y activado el guardado automático inmediato en `localStorage` ante cualquier cambio de volumen, SFX o música).
- [x] **Tarea 85**: Eliminación de Sobrenombres y Frases Decorativas de Personajes (`RoguelikeRunManager.ts`, `ModalManager.ts`, `RogueModalRenderer.ts`, `HUDController.ts` & `index.html`: Suprimidos todos los títulos/sobrenombres pomposos y frases/quotes de lore de todos los menús y paneles del juego para dejar una interfaz limpia, profesional y concisa con el nombre directo del personaje y sus habilidades).
- [x] **Tarea 86**: Reformulación Matemática Rigurosa de Ojos y Teorema de Benson en Grafos Arbitrarios (`GraphBoard.ts` & `ChampionManager.ts`: Eliminado el falso disparador por turno en Ryūjin y reescrita la detección matemática de ojos y grupos vivos sobre cualquier topología no euclidiana (triangular, hexagonal, procedural, etc.) mediante el Teorema de Vida Incondicional de David Benson, impidiendo que grupos cortados o abiertos se confundan con dobles ojos).
- [x] **Tarea 87**: Perfeccionamiento de la Lluvia Meteórica de Tengu y Tooltip Dinámico (`VFXManager.ts`, `style.css`, `SVGGhostPreview.ts` & `ChampionManager.ts`: Rediseñada la animación de meteoros con estelas de plasma multicapa, impactos secuenciales y destrucción en tiempo real de piedras, y sincronizado el contador de impactos en el tooltip flotante para reflejar con exactitud la escala real del tablero: 5 en 9x9, 9 en 13x13 y 15 en 19x19).
- [x] **Tarea 88**: Rediseño del Menú de Victoria y Recompensas Roguelike (`RogueModalRenderer.ts`, `index.html`, `style.css`: Implementado título dorado resplandeciente con estrellas `⭐ ¡VICTORIA EN EL GOBAN! ⭐`, banner conmemorativo del héroe victorioso celebrando su triunfo con corona y citas exclusivas, sustitución de monedas genéricas por Magatamas `🏮`, tarjetas de hechizos/poliminós mejoradas con selección única excluyente y botón de reclamación).
- [x] **Tarea 89**: Generación de 10 Variantes de Rivales con Fondo Recortado (`RoguelikeMapGenerator.ts` & `public/enemies/`: Generados 5 Sabios de la Niebla de cuerpo semi-completo con nombres japoneses distintivos: `Kenshin el Sabio`, `Nobunaga el Sabio`, `Masashi el Sabio`, `Tetsuo el Sabio`, `Genzaburo el Sabio`, y 5 Monjes Novatos: `Joven Ren`, `Joven Hiro`, `Joven Sora`, `Joven Daiki`, `Joven Kazuki`, integrados en la generación procedural del mapa).
- [x] **Tarea 90**: Distribución Equiprobable y Aleatoria de Rivales en Batallas (`RoguelikeMapGenerator.ts`: Implementada selección estocástica pura con idéntica probabilidad matemática entre los 5 Sabios de la Niebla y los 5 Monjes Novatos para garantizar máxima variabilidad de encuentros en cada partida).
- [x] **Tarea 91**: Creación e Integración del Personaje 'Hombre Normal' (`RoguelikeRunManager.ts`, `types/index.ts`, `ModalManager.ts`, `HUDController.ts`, `index.html`: Creado el personaje 'Hombre Normal' con ilustración anime sin rostro -sin ojos, cejas, nariz ni boca-, sin habilidades místicas ni poderes pasivos, seleccionable para runs roguelike normales, partidas clásicas y modo sandbox).
- [x] **Tarea 92**: Corrección Crítica de Interactividad y Apuntado de Furia del Dragón de Ryūjin y Limpieza Visual del HUD (`ChampionManager.ts`, `SVGRenderer.ts`, `GameController.ts`, `SVGGhostPreview.ts`, `HUDController.ts`: Eliminado el texto 'Campeón' redundante bajo el nombre del jugador, resuelto el bloqueo de interacción y congelamiento de turnos durante la Furia del Dragón de Ryūjin garantizando que la IA espere a que el jugador humano seleccione y queme las 2 piedras enemigas con retícula ígnea y tooltip dinámico).
- [x] **Tarea 93**: Eliminación Total de Citas de Victoria, Hombre Normal Mirando a la Derecha con Fondo Transparente y 10 Rivales PNG Integrados (`RogueModalRenderer.ts`, `index.html`, `HUDController.ts`, `RoguelikeMapGenerator.ts`: Suprimidas por completo las citas de victoria exclusivas en todos los personajes y modales; regenerado Hombre Normal mirando hacia la derecha en transparencia PNG; procesados y reemplazados los antiguos avatares de sabios y monjes por las 10 variantes PNG transparentes con selección procedural uniforme en todos los modos).
- [x] **Tarea 94**: Calibración de Escudo Divino de Kitsune (2 Usos, 2 Turnos), Inmunidad Total a Habilidades y Aura Dorada Animada (`ChampionManager.ts`, `RoguelikeRunManager.ts`, `GoAI.ts`, `BossManager.ts`, `SVGRenderer.ts`, `SVGDefs.ts`, `style.css`: Calibrado el Escudo Divino a 2 cargas y 2 turnos de duración; añadido bloqueo estricto con sonido y mensaje de error al intentar destruir o transmutar piedras sagradas con habilidades; exclusión de piedras sagradas en la IA para evitar jugadas erróneas; e implementada un aura dorada resplandeciente multicapa con resplandor radial pulsante, anillo solar giratorio y emblema sagrado).
- [x] **Tarea 95**: Posicionamiento Primario de Hombre Normal en Selectores y Ajuste Proporcional de Standees de Duelo (`RoguelikeRunManager.ts`, `RoguelikeController.ts`, `HUDController.ts`, `index.html`, `style.css`: Hombre Normal reordenado como la primera opción a la izquierda en todas las pantallas de selección y modales; rivales/jefe final escalados un +15% a la derecha para mayor presencia; standee del jugador desplazado un 3% hacia abajo junto a su placa de texto; y figura de Hombre Normal reducida un 10% adicional respecto a los demás héroes).
- [x] **Tarea 96**: Escalado por Tamaño de Tablero y Timing al Finalizar Turno de Lluvia Pétrea de Himiko (`ChampionManager.ts`, `RoguelikeRunManager.ts`, `SandboxController.ts`, `index.html`: Calibrada la pasiva de Himiko para activarse exactamente al finalizar el 15º turno personal con caída de 4 piedras en 9x9, 6 piedras en 13x13 y 9 piedras en 19x19; y actualizadas todas las descripciones, tooltips y mensajes de alerta).
- [x] **Tarea 97**: Escalado de Cargas del Escudo Divino de Kitsune por Tamaño de Tablero (`ChampionManager.ts`, `GameController.ts`, `RoguelikeRunManager.ts`, `ModalManager.ts`: El Escudo Divino ahora otorga 2 cargas en 9x9, 3 cargas en 13x13 y 4 cargas en 19x19; el tablero activo se pasa a `resetForMatch` y `setHero` para calcular dinámicamente las cargas al iniciar cada partida; actualizadas todas las descripciones).
- [x] **Tarea 98**: Escalado de Inversión Cromática de Ronin (1 en 9x9, 2 en 13x13, 3 en 19x19) y Pase de Turno Automático (`ChampionManager.ts`, `RoguelikeRunManager.ts`, `SVGGhostPreview.ts`, `GameController.ts`: Implementada selección de cualquier piedra aliada o enemiga con 1 en 9x9, 2 en 13x13 y 3 en 19x19 en el mismo turno, evaluando capturas inmediatas y pasando el turno automáticamente al terminar las inversiones).
- [x] **Tarea 99**: Furia del Dragón de Ryūjin con Calcinación Universal y Escalado Multitablero / Crecimiento de Ojos (`GraphBoard.ts`, `ChampionManager.ts`, `RoguelikeRunManager.ts`, `SVGGhostPreview.ts`: Habilitada selección de cualquier piedra aliada o enemiga; activada en 9x9 con 2 ojos [2 calcinaciones], en 13x13 con 3+ ojos o múltiples grupos vivos [3 calcinaciones], y en 19x19 con crecimiento progresivo de ojos según la fórmula acumulativa n-1).
- [x] **Tarea 100**: Banda Sonora Procedural Tradicional Japonesa BGM con Modos Zen y Combate Taiko (`BGMGenerator.ts`, `ScreenManager.ts`, `AppEventBinder.ts`: Motor Web Audio API de música clásica japonesa con sintetizador de Koto, Shamisen, flauta Shakuhachi y percusión Taiko; dos pistas diferenciadas: contemplativa para mapa/menús y marcial rítmica para combate en el Goban).
- [x] **Tarea 101**: Rivales IA con Habilidades de Campeones en Modo Maestro / Dan y Gran Maestro Roguelike (`GameController.ts`, `GoAI.ts`, `types/index.ts`: En dificultad Dan y Roguelite Extremo, los rivales reciben aleatoriamente campeones del roster y ejecutan meteoros de Tengu, escudos de Kitsune, transmutaciones de Ronin y pasivas de Himiko/Ryūjin estratégicamente).
- [x] **Tarea 102**: Sistema Universal de Atajos de Teclado para Menús, Modales, Mapas y Acciones (`AppEventBinder.ts`: Navegación ágil con flechas, WASD, números 1..6 para selección de campeones/cartas/dificultades, Enter/Espacio para confirmar y Escape para volver/cerrar en todos los menús y modales).
- [x] **Tarea 103**: Primer Plano y Encuadre Facial de Hombre Normal (`public/heroes/normal_face.jpg`, `normal.jpg`, `normal.png`: Generado y ajustado el primer plano centrado en el rostro sin facciones de Hombre Normal con fondo atmosférico uniforme, eliminando artefactos y armonizando su proporción y presencia visual con el resto de campeones del roster).
- [x] **Tarea 104**: Eliminación Total de Música Procedural Sintetizada / 8-Bit (`BGMGenerator.ts`: Desactivado y silenciado por completo el sintetizador de música de fondo procedural para erradicar ruidos y golpes agudos molestos de osciladores, preservando únicamente los efectos de sonido acústicos y realistas de las piedras y el tablero de Go).
- [x] **Tarea 105**: Incremento de Escala de Hombre Normal en Partida (+13%) (`src/style.css`: Calibrada la escala del standee de Hombre Normal en los duelos de Goban a `1.45` para otorgarle mayor presencia y balance visual en combate).
- [x] **Tarea 106**: Integración de Banda Sonora Tradicional Japonesa Acústica y Relajante (`public/audio/bgm_zen.wav`, `bgm_battle.wav`, `src/audio/BGMGenerator.ts`: Renderizadas e integradas dos pistas de audio japonesas de alta calidad con Koto acústico suave, frases meditativas de flauta Shakuhachi, acordes de Shō y campanas tibetanas Rin, en bucle continuo y sin ningún golpe molesto ni efecto 8-bit).
- [x] **Tarea 107**: Depuración y Limpieza Total de Residuos de Animación VFX y Círculos Rojos (`SVGRenderer.ts`, `VFXManager.ts`, `SVGGhostPreview.ts`: Eliminado el re-añadido indiscriminado de sub-elementos VFX en `render()`, implementado `VFXManager.clearAllVFX()` y purga automática de halos y superposiciones al colocar piedras normales).
- [x] **Tarea 108**: Anuncio de Komi de Blancas al Inicio de Partida Roguelike y Calibración por Dificultad (`index.html`, `src/style.css`, `RoguelikeRunManager.ts`, `RoguelikeController.ts`, `HUDController.ts`: Implementado overlay cinematográfico con máscara 70% negra, backdrop blur y texto blanco nítido al inicio de cada duelo; Komi calibrado a 2.5 en Fácil, 4.5 en Intermedio, 6.5 en Difícil y 5.5 en Maestro, con el jugador comenzando siempre como Negras).
- [x] **Tarea 109**: Animación de Llamarada Ígnea y Ceniza Disolviéndose de Ryūjin (`VFXManager.ts`, `SVGRenderer.ts`, `src/style.css`: Diseñado e integrado el efecto de fuego del dragón con chorro ígneo, núcleo ardiente y 14 partículas de ceniza y ascuas flotantes que ascienden y se disuelven durante 1.0s, preservándose en la capa viva de VFX y solapándose de forma fluida con el turno del rival sin bloquear el flujo de la partida).
- [x] **Tarea 110**: Tipografía Libre Sin Contenedores y Transición Cinematográfica de Desvanecimiento para el Komi (`index.html`, `src/style.css`, `HUDController.ts`: Eliminado el recuadro/caja/bordes para que el texto flote directamente en el centro con máscara 70% oscura y blur de 10px; implementada transición de entrada y disolución progresiva suave de 600ms hacia el Goban).
- [x] **Tarea 111**: Desvanecimiento Gradual de 1.5s para el Anuncio de Komi e Integración en 1 vs 1 Local (`src/style.css`, `src/ui/HUDController.ts`, `src/controllers/GameController.ts`: Calibrada la transición de disolución a 1.5 segundos exactos con curva suave `cubic-bezier(0.25, 1, 0.5, 1)`; extendido el anuncio visual a todas las partidas locales de 2 jugadores con adaptación de badges: J1 Negras vs J2 Blancas, o 1vIA).
- [x] **Tarea 112**: Modularización y Factorización Arquitectónica de Campeones y Animaciones VFX (`src/core/champions/` con `TenguChampion.ts`, `HimikoChampion.ts`, `KitsuneChampion.ts`, `RoninChampion.ts`, `RyujinChampion.ts`, `NormalChampion.ts`, `BossChampion.ts` y `src/graphics/vfx/` con `TenguVFX.ts`, `HimikoVFX.ts`, `KitsuneVFX.ts`, `RoninVFX.ts`, `RyujinVFX.ts`, `BossVFX.ts`, delegados a través de las fachadas limpias `ChampionManager.ts` y `VFXManager.ts`).
- [x] **Tarea 113**: Perfeccionamiento de la Transición de Salida (Fade-Out) del Anuncio de Komi y Sincronización Dinámica de Komi en HUD (`src/style.css`, `src/ui/HUDController.ts`, `index.html`: Blindada la visibilidad activa durante los 1.5s exactos de desvanecimiento suave de salida; sincronizado el subtexto `.cap-item small` `#ui-komi-sub` para mostrar dinámicamente el valor real de Komi del combate sin duplicaciones ni `(+0)` si Komi es nulo).
- [x] **Tarea 114**: Ocultación Automática de Hechizos con 0 Usos en Runs Roguelike (`src/ui/HUDController.ts`, `index.html`: Filtrado dinámico de cartas de hechizos para mostrar únicamente aquellos que el jugador posee con `usesLeft > 0`, ocultando la sección mágica y el dock inferior si no se poseen hechizos ni poliminós).
- [x] **Tarea 115**: Reconocimiento Matemático de Doble Ojo en Topologías Irregulares y Bordes Erosionados (`src/core/GraphBoard.ts`: Corregida la comprobación estricta de cadena única que descartaba ojos defendidos por cadenas mutuas en cortes/bordes del tablero, e integrado el Teorema de Vida Incondicional de Benson para conjuntos de cadenas que defienden conjuntamente cavidades en bordes de cualquier grafo irregular).
- [x] **Tarea 116**: Unificación de Pantalla de Victoria Roguelike, Fondo Translúcido del Campeón, Inspección de Tablero y Economía Gratuita sin Magatamas (`index.html`, `src/style.css`, `ScoreModalRenderer.ts`, `RoguelikeController.ts`, `GameController.ts`, `AppEventBinder.ts`: Fusión completa de desglose territorial y 3 cartas de recompensas en un único modal panorámico `.modal-victory-unified` con silueta translúcida del héroe de fondo; corrección del nombre real y rango del rival derrotado con Komi dinámico real; botón funcional de "Inspeccionar Tablero" con botón flotante `#floating-inspect-btn` para retornar; eliminación universal de Magatamas y reconversión del Mercader en selección gratuita de hasta 2 objetos de entre 4 opciones y bendición sagrada de poliminós en santuarios).
- [x] **Tarea 117**: Efecto VFX de Rotura de Escudo de Kitsune, Limpieza Visual Flat UI de Victoria y Herramientas Sandbox de Desarrollador (`GameState.ts`, `SVGRenderer.ts`, `KitsuneVFX.ts`, `index.html`, `hud.css`, `events.css`, `AppEventBinder.ts`, `RoguelikeRunManager.ts`: Sincronización de expiración de turnos del Escudo Divino para detonar una animación visual dinámica de fragmentación (0.6s) directamente en el SVG; rediseño de contenedores de puntuación y recompensas en el modal de victoria removiendo fondos y bordes para maximizar la inmersión panorámica; refinado del título de victoria a una única estrella dinámica; e integración de botones de hack de desarrollador "Instant Win" y "Free Map Travel" en el panel Sandbox).


## Fase 19: Modo Historia y Campañas de Rescate (Completada)
- [x] **Tarea 136**: Arquitectura del Modo Historia (`StoryController.ts`, `StoryCampaign.ts` con sistema de Capítulos, Escenarios asimétricos, soporte 5x5, modo puzle en solitario `isCurrentChapterSolo` y personajes con diálogos).
- [x] **Tarea 137**: Interfaz de Diálogo tipo Novela Visual (`StoryDialogueRenderer.ts`, `story.css` con `fade-in`, retratos laterales en primer plano y marco de texto inmersivo).
- [x] **Tarea 138**: Motor de Captura de Entidades (`RulesEngine.ts` interactuando con `StoryController` para disparar eventos narrativos o victorias `capture_specific` al retirar todas las libertades a un objeto en el tablero, con turno continuo de negras en capítulos de entrenamiento).
- [x] **Tarea 139**: Integración en el Menú Principal (Botón "Modo Historia" lanza directamente el Capítulo 1 en el mapa de islas asimétrico).
- [x] **Tarea 143**: Corrección de Retorno a Menú Principal y Aislamiento de Roguelike (`AppEventBinder.ts`: Valida estrictamente el modo de juego antes de invocar `resumeMap()`, asegurando salida limpia al Menú Principal).
- [x] **Tarea 144**: Animación Cinemática de Ruptura y Colapso del Tablero (`SVGRenderer.ts`, `vfx.css`: Animación `triggerBoardShatterAnimation` con onda de choque y destrucción de todas las piedras tras sellar el Pergamino en el Capítulo 2).
- [x] **Tarea 145**: Modal de Despertar de Qi y Selección de Poder de Campeón (`StoryDialogueRenderer.ts`, `story.css`: Permite elegir entre las habilidades de Tengu, Alquimista, Kitsune, Ryūjin y Ronin equipándose de inmediato).
- [x] **Tarea 146**: Capítulos 3 y 4 con Batalla Asimétrica 13x13 y Reliquias Disputables Multi-Casilla 2x1 (`StoryCampaign.ts`, `RulesEngine.ts`, `GoAI.ts`: Soporte de objetos de 2 casillas contiguas y disputa competitiva entre Jugador e IA).
- [x] **Tarea 147**: Limpieza de Topbar y Traducción Completa de Combates y Rivales al Inglés (`index.html`, `i18n.ts`, `DuelistRenderer.ts`, `ScoreModalRenderer.ts`, `RoguelikeMapRenderer.ts`: Eliminación de `#ui-rogue-stage-badge` de la barra superior y soporte de traducción para "Young / Joven", "Sage / Sabio", "Rival" y estados de duelo en inglés y español).
- [x] **Tarea 148**: Recalibración Matemática y VFX de Tengu en Topologías Irregulares y Hexagonales (`TenguChampion.ts`, `TenguVFX.ts`, `VFXManager.ts`, `GameController.ts`: Filtrado de nodos jugables para garantizar que los meteoros impacten exclusivamente en intersecciones válidas y escalado dinámico de animación según el radio de las casillas).
- [x] **Tarea 149**: Bloqueo Canónico de Autodestrucción Territorial y Pase Decisivo de la IA en Endgame (`GoAI.ts`: Prohibición estricta de rellenar territorio propio y ojos en todas las dificultades, desactivación de bonos en fronteras cerradas y pase proactivo cuando no hay ganancias netas o tras el pase del rival).

## Fase 20: Sistema de Escenarios y Fondos Dinámicos (Completada)
- [x] **Tarea 140**: Generación de 6 fondos panorámicos con encuadre lateral (detalles a izquierda/derecha y centro despejado para el goban: Dojo Zen, Vacío Astral, Guarida del Dragón, Pradera Esmeralda de Bambúes, Picos al Atardecer, Lago Nocturno).
- [x] **Tarea 141**: Selector visual de Escenarios en el Wizard de Partida Local / 1vIA (Paso 3 en `index.html`, `ModalManager.ts` y `AppEventBinder.ts`).
- [x] **Tarea 142**: Inyección dinámica en `#board-viewport[data-bg]` en `GameController.ts`, `TutorialManager.ts`, `StoryController.ts` y `layout.css`.

## Fase 15: Corrección de Modo Online y Conexión de Invitados (Guest Joining) (Completada)
- [x] **Tarea 50**: Corrección de conmutación de pestañas en modal online (`ModalManager.switchOnlineTab` con `view-create-room` y `view-join-room`).
- [x] **Tarea 51**: Corrección de desplazamiento de argumentos en `OnlineController.joinOnlineRoom` con soporte de héroes y callbacks de error / inicio.
- [x] **Tarea 52**: Sanitizador y autocompletado universal de códigos de sala (`sanitizeRoomCode` para `GO-XXXX`, `xxxx`, URLs completas y portapapeles).
- [x] **Tarea 53**: Ciclo de vida y desconexión limpia de PeerJS al cambiar de pestaña o cancelar modal, junto con empaquetado de `CrazyGo_Portable.zip`.

## Fase 16: Evaluación Proactiva de Pase de Turno y Detección de Fin de Partida en la IA (Completada)
- [x] **Tarea 54**: Corrección del umbral de pase y contención de heurísticas estáticas de apertura (`isEarlyOrOpen` en `GoAI.ts`).
- [x] **Tarea 55**: Detección y descarte de rellenado en territorio propio (`territoryMap.get(id) === aiPlayerId`) y descarte de invasiones suicidas en territorio rival cerrado.
- [x] **Tarea 56**: Respuesta instantánea de pase tras pase del oponente cuando no existen capturas de Atari ni ganancias territoriales (`scoreDelta <= 0`), desencadenando automáticamente los 2 pases consecutivos y la apertura del modal de victoria y puntuación final.
- [x] **Tarea 57**: Iniciativa proactiva de pase en la IA al detectar tablero consolidado sin jugadas que sumen puntos netos.
- [x] **Tarea 58**: Corrección de pase prematuro (Bug de Maestro/Dan AI) al asegurar una base de vida para jugadas de 2 libertades y condicionando el abandono solo a jugadas que resten territorio de forma neta (`bestMove.score < 0`).
- [x] **Tarea 59**: Refinamiento del Motor de Territorio (`TerritoryScorer.ts`) mediante un umbral de dominio probabilístico del 74% de bordes, impidiendo que piedras muertas invasoras neutralicen zonas cerradas completas bajo reglas clásicas.

## Fase 17: Temporizadores Clásicos, Entidades Capturables, Alquimista y Roguelike Co-op Online (Completada)
- [x] **Tarea 117**: Sistema de Temporizadores y Relojes Clásicos de Go (`index.html`, `src/types/index.ts`, `src/core/GameState.ts`, `src/controllers/GameController.ts`, `src/ui/HUDController.ts`, `src/ui/ModalManager.ts`, `src/events/AppEventBinder.ts`, `src/style.css`: Modos Sin Límite / Por Jugada (Byo-yomi) 10s..60s / Súbito 1m..15m / Fischer 3m..10m con incremento; soporte universal en Roguelike, Local 1v1/FFA, Sandbox y Online; relojes digitales integrados en HUD y standees con alerta roja parpadeante y caída de bandera).
- [x] **Tarea 118**: Entidades y Objetos Capturables en el Goban (`src/types/index.ts`, `src/core/GameState.ts`, `src/core/RulesEngine.ts`, `src/graphics/SVGRenderer.ts`, `src/controllers/GameController.ts`, `src/style.css`: Generación procedural de Cofres Místicos 🎁, Monjes Cautivos 🧙, Pergaminos Sagrados 📜 y Espíritus Guardián ✨; detección canónica de captura al retirar todas sus libertades cardinales con piedras y entrega inmediata de botín táctico).
- [x] **Tarea 119**: Reestructuración de Campeones: Nuevo Campeón Alquimista y Pasiva de Ronin (`src/core/champions/AlchemistChampion.ts`, `src/graphics/vfx/AlchemistVFX.ts`, `src/core/champions/RoninChampion.ts`, `src/core/ChampionManager.ts`, `src/core/RoguelikeRunManager.ts`, `src/controllers/RoguelikeController.ts`, `index.html`: Ronin ahora posee la pasiva *Filo del Samurai* cortando 1 piedra enemiga cada 25 turnos; Alquimista se incorpora como 6º héroe con la habilidad activa de *Inversión Cromática* y VFX de transmutación).
- [x] **Tarea 120**: Modo Roguelike Cooperativo Online P2P WebRTC (`src/types/index.ts`, `src/controllers/OnlineController.ts`, `src/controllers/GameController.ts`, `src/network/NetworkManager.ts`, `index.html`, `src/style.css`: Selector de modo Duelo vs Roguelike Co-op en sala online; ambos jugadores comparten bando Negras ⚫ y alternan sub-turnos secuenciales J1 $\to$ IA $\to$ J2 $\to$ IA contra el rival con sincronización de estado).

## Fase 18: Motor de Tutorial Interactivo (Dojo)
- [x] **Tarea 121**: Arquitectura Core del Tutorial (`TutorialManager.ts`, `TutorialSteps.ts`).
- [x] **Tarea 122**: Integración de Interfaz de Usuario (`index.html`, `style.css` y overlay de bocadillos).
- [x] **Tarea 123**: Inyección en el ciclo de juego (`GameController.ts`, bloqueo de IA y validación de nodos).
- [x] **Tarea 124**: Renderizado Visual (`SVGRenderer.ts` para resaltado dorado de objetivos).
- [x] **Tarea 125**: Cuadro Explicativo Final con 'Entendido ➔' en Todas las Lecciones del Tutorial (`TutorialSteps.ts`, `TutorialManager.ts`: Cada lección concluye con un mensaje pedagógico del Sensei y botón "Entendido ➔", abriendo el modal de victoria y avance de capítulo únicamente tras confirmar la asimilación del concepto).
- [x] **Tarea 126**: Corrección y Robustecimiento de Atajos de Teclado Universales para Campeones e Ítems (`AppEventBinder.ts`, `index.html`: Selección dinámica de hechizos e ítems con teclas 1..4 en dock inferior de combate, selección de cartas/recompensas en modales de victoria y roguelike con números y flechas/WASD, navegación y selección de campeones 1..7 en Setup local, Roguelike y Online Host/Guest con unificación de miniaturas).
- [x] **Tarea 127**: Rigor Matemático Canónico en Lección de Dos Ojos y Eliminación de Citas Ficticias (`TutorialSteps.ts`, `index.html`, `style.css`: Rediseño completo de la Lección 3 con asedio total de piedras blancas y cavidad de 3 en línea donde jugar en el punto vital central divide el espacio en 2 ojos independientes matemáticamente inmortales por la regla de suicidio; y eliminación total de los bloques de citas decorativas en el modal de fin de lección).
- [x] **Tarea 128**: Anotaciones Visuales Dinámicas y Conteo Numérico de Libertades en Todos los Pasos del Tutorial (`TutorialSteps.ts`, `style.css`, `SVGRenderer.ts`: Incorporación de badges animados con rebote elástico `badgePop` centrado en cada intersección del Goban para mostrar las libertades compartidas 1..7 de cadenas, estados de Atari, ojos vivos 1-2, excepciones de suicidio y puntos de territorio).
- [x] **Tarea 129**: Depuración y Limpieza Visual de Badges e Insignias del Dojo (`TutorialSteps.ts`, `SVGRenderer.ts`: Eliminación de emojis compuestos en insignias circulares para evitar desbordes visuales; centrado vertical nítido con `dominant-baseline: central` y uso de números y glifos simples y limpios).
- [x] **Tarea 130**: Corrección Definitiva del Selector de Teclado en la Pantalla de Expedición Roguelike (`AppEventBinder.ts`: Corrección del selector al ID canónico `#roguelike-setup-modal`; navegación fluida de héroes con `1..7`, `A`/`D`, flechas `←`/`→`, ajuste de dificultad con `W`/`S`, flechas `↑`/`↓`, inicio con `Enter`/`Espacio` y retorno con `Escape`).
- [x] **Tarea 131**: Rediseño Pedagógico Profundo de la Lección 6 de Territorio y Reglas Japonesas (`TutorialSteps.ts`: Desglose en 7 micro-pasos didácticos explicando el concepto de cerca/valla, valor de 1 punto por intersección, detección de brechas en la frontera, sellado hermético en 2,2, cómputo de prisioneros +1, compensación de Komi +6.5 y la fórmula canónica de victoria final).
- [x] **Tarea 132**: Ampliación Didáctica de la Lección 7 con el Campeón en el Panel Izquierdo (`TutorialSteps.ts`: Integración de Tengu en el lateral izquierdo con standee y botón de habilidad activa, desglose de habilidades activas vs pasivas, roster de 7 héroes, modo puntero con tecla C y sinergia con libertades canónicas).
- [x] **Tarea 133**: Habilitación Interactiva del Menú Inferior de Fichas Especiales y Hechizos en el Tutorial (`TutorialManager.ts`, `TutorialSteps.ts`: Activación de `#game-spellbar` con inventario real de Germinante 1x1, Dominó 2x1 rotatorio y Monolito 2x2 en los capítulos tácticos; validación interactiva que permite seleccionar la ficha desde el dock o atajos 5..7 / Z,X,V antes de colocarla en el Goban).
- [x] **Tarea 134**: Corrección de Persistencia del Campeón Alquimista y Regeneración de Sprites Transparentes de Monjes/Sabios (`RoguelikeController.ts`, `scripts/cutout_enemies.py`, assets `public/enemies/`: Inyección de `heroId: RoguelikeRunManager.selectedHero` en `startBattle` para evitar caídas al campeón default; y generación de nuevos assets limpios con fondo blanco puro recortados con anti-aliasing y algoritmo flood-fill sin afectar partes internas).
- [x] **Tarea 135**: Optimización de Espacio en Bocadillos del Dojo y Desacoplamiento del Botón Entendido (`TutorialManager.ts`, `style.css`: Eliminación del avatar de kimono para ahorrar espacio horizontal; desacoplamiento del botón "Entendido ➔" en su propio contenedor flotante independiente y reducción de padding/dimensiones para evitar que la ventana tape las piedras o intersecciones del Goban).
- [x] **Tarea 136**: Menú de Cinta Superior Limpio en Modo Tutorial (`HUDController.ts`, `TutorialManager.ts`, `style.css`: Activación de clase `#game-topbar.tutorial-active` que oculta todos los botones de deshacer, rehacer, reset, píldoras centrales, pruebas de sandbox, pasar turno y selector de tema, dejando visible de forma exclusiva el botón '🏠 Menú').
- [x] **Tarea 137**: Rediseño Interactivo de Lecciones 7 (Lluvia Meteórica de Tengu) y 8 (Disposición 1-Espacio-Espacio-1-1 y Dominó Limpio) (`TutorialSteps.ts`, `TutorialManager.ts`, `HUDController.ts`, `index.html`: En Lección 7, despliegue de fortaleza blanca 3x3 para invocar la Lluvia Meteórica mediante la tecla C o botón lateral en 6,4; en Lección 8, configuración de grupos 1 [ ] [ ] 1 1 conectados por ficha Dominó 2x1; y en la barra inferior el Dominó solo muestra flechas y [R] cuando está activamente seleccionado, manteniendo la vista compacta).
- [x] **Tarea 138**: Modularización Arquitectónica de Estilos CSS y Desacoplamiento de Controladores (`src/styles/`, `KeyboardController.ts`, `style.css`: Desglose del archivo monolítico `style.css` de 5,391 líneas en una estructura modular limpia de 13 submódulos temáticos en `src/styles/` y subcarpetas `modals/` y `roguelike/` sin superar 500 líneas por módulo; y extracción del gestor universal de teclado a `KeyboardController.ts` reduciendo la complejidad de `AppEventBinder.ts`).
- [x] **Tarea 139**: Desactivación de Entidades Capturables en Roguelike y Nuevo Botón/Modal de Modo Historia (`GameController.ts`, `index.html`, `base.css`, `modals/base.css`, `AppEventBinder.ts`, `KeyboardController.ts`: Desactivación de la generación automática de objetos/rehenes en expediciones roguelike para mantener batallas puras; e incorporación en el menú principal del botón de fila completa de 3 columnas '📖 Modo Historia (Por hacer)' con modal interactivo que presenta la visión de juego, misiones de rescate y campañas de campeones).
- [x] **Tarea 140**: Estilo Negro Elegante para el Botón Entendido en Tutoriales (`src/styles/tutorial.css`: Reemplazo del gradiente naranja de `.tutorial-continue-btn` por un fondo negro pizarra oscuro de alto contraste con relieve sutil y bordes luminosos).
- [x] **Tarea 141**: Corrección de Ejecución de Habilidad en Tutorial 7 y Asentamiento de Standees (-100px) (`SVGRenderer.ts`, `HUDController.ts`, `TutorialManager.ts`, `champions.css`: Activación y renderizado de Tengu en Lección 7 con botón de habilidad activa y avance automático garantizado tras desatar la lluvia meteórica; y descenso de 100px en las figuras de Aprendiz de Go / Hombre Normal y enemigos para apoyarlos firmemente sobre el tatami).
- [x] **Tarea 142**: Corrección del Avance de Tutorial en Colocación de Fichas Poliminó y Hechizos (`SVGRenderer.ts`, `GameController.ts`: Eliminación de la doble validación post-colocación que bloqueaba el avance del tutorial 8 al quedar la ficha en `null` tras colocarse; e invocación directa de `TutorialManager.advanceStep()` al completar `placePolyomino`).
- [x] **Tarea 143**: Protección Anti-Spam y Bloqueo de Saltos en Bocadillos del Dojo (`TutorialManager.ts`, `KeyboardController.ts`: Implementación de flag anti-rebote `isAdvancing` y desactivación instantánea del botón 'Entendido ➔' tras el primer clic o pulsación de tecla, impidiendo que clicks rápidos salten pasos interactivos donde el jugador debe colocar piedras o usar habilidades).
- [x] **Tarea 144**: Rediseño Integral de la Lección 8 con Progresión de Hechizos y Poliminós (Ficha Duplicidad) (`TutorialSteps.ts`, `TutorialManager.ts`, `PolyominoManager.ts`, `GameController.ts`, `index.html`: Renombrado universal de Dominó a **Duplicidad 2x1**; e implementación en el Dojo de situaciones progresivas guiadas para desatar Meteorito ☄️, Rebobinar ⏳ tras error táctico, plantar Germinante 1x1 🌿, tender el puente de Duplicidad 2x1 🀄 y fortificar con Monolito 2x2 🧱).
- [x] **Tarea 145**: Inicialización y Sincronización Completa con Repositorio GitHub (`.gitignore`, `git`: Inicialización del repositorio Git, exclusión de binarios pesados en `.gitignore`, configuración de rama principal `main` y subida completa del código a `https://github.com/Victologo/crazy_go`).

## Fase 20: Sistema Integral de Internacionalización (i18n Español / Inglés) (Completada)
- [x] **Tarea 146**: Motor Reactivo de Localización (`src/i18n/translations.ts`, `src/i18n/i18n.ts`: Diccionarios exhaustivos en Español e Inglés para menús, modales, campeones, hechizos, poliminós, tutoriales, modo historia, multijugador online y HUD con persistencia en `localStorage`).
- [x] **Tarea 147**: Selector de Idioma en el Menú de Opciones (`index.html`, `ModalManager.ts`, `AppEventBinder.ts`: Selector visual `🇪🇸 Español` / `🇬🇧 English` en `#options-modal` con actualización en vivo del DOM y HUD sin recargar la página).
- [x] **Tarea 148**: Localización Dinámica de Campeones y Entidades (`RoguelikeRunManager.ts`, `TerritoryScorer.ts`: Nombres, títulos, citas y descripciones de habilidades activas/pasivas traducidas reactivamente).
- [x] **Tarea 149**: Tutorial Dojo y Modo Historia Bilingüe (`TutorialSteps.ts`, `TutorialManager.ts`, `StoryCampaign.ts`: Traducción completa en inglés y español para todos los 9 capítulos pedagógicos del Sensei y campañas narrativas).
- [x] **Tarea 150**: Empaquetado y Compilación TypeScript (`npm run build`: 0 errores de compilación, generación de bundles finales y actualización de `.zip` descargables para Itch.io y Web).
## Fase 22: Rediseño de Opciones, Mercader Flotante, Previsualizador Local y Limpieza de Interfaz (Completada)
- [x] **Tarea 152**: Corrección de Modo Desarrollador y Bloqueo en Roguelike / Historia (`DevModeManager.ts`: Desactivación estricta de Sandbox y Deshacer/Rehacer en partidas roguelike e historia cuando el modo desarrollador está inactivo).
- [x] **Tarea 153**: Rediseño del Panel de Opciones con Scroll y Menos Verboso (`index.html`, `options.css`: Eliminación de descripciones redundantes de SFX y BGM, contenedor con scroll vertical `modal-body-scroll`, switches de palanca dinámicos `.btn-toggle` con indicadores luminosos).
- [x] **Tarea 154**: Supresión de Komi en Modo Historia (`GameController.ts`, `StoryCampaign.ts`: Eliminación del cartel cinematográfico de Komi en capítulos de historia y fijación de `komi: 0` en todas las misiones).
- [x] **Tarea 155**: Mercader Flotante con Arte Vectorial Transparente y Sin Etiquetas de Precio (`RoguelikeController.ts`, `RogueModalRenderer.ts`, `events.css`, `public/items/`: Generación de 7 iconos SVG transparentes de alta definición para pergaminos y poliminós, renderizado como objetos flotantes clicables con animación de levitación y eliminación total de "(Gratis)" o etiquetas de coste).
- [x] **Tarea 156**: Estética 'Ghost' y Menús Despejados (`setup.css`, `options.css`, `events.css`, `base.css`: Eliminación de contenedores pesados y anidados; reemplazo por fondos traslúcidos con bordes sutiles y padding optimizado).
- [x] **Tarea 157**: Calibración Universal de Himiko (Proporcional 4 en 9x9, 8 en 13x13, 18 en 19x19) y Kitsune (5 cargas en 19x19) (`HimikoChampion.ts`, `KitsuneChampion.ts`, `translations.ts`: Implementación de fórmula proporcional universal $\operatorname{round}(N \times 4 / 81)$ para la Lluvia Pétrea de Himiko y confirmación de 5 cargas para el Escudo de Kitsune en 19x19).
- [x] **Tarea 158**: Previsualizador de Tablero y Escenario en Vivo en Modo Local Paso 3 (`index.html`, `ModalManager.ts`, `setup.css`: Estructura en 2 columnas en el Paso 3 del Wizard; selección de dimensiones, geometría y escenario con renderizado SVG interactivo del Goban en tiempo real sobre el fondo seleccionado).
- [x] **Tarea 159**: Generación de Ejecutable Nativo Portable Windows y Paquete Itch.io (`CREAR_PAQUETE_EXE.bat`, `Launcher.cs`, `CrazyGo_Portable.zip`, `CrazyGo.exe`, `CrazyGo_v1.0_Windows.zip`: Compilación automatizada de la app de escritorio nativa con servidor HTTP embebido persistente, perfil aislado de usuario y ventana app dedicada sin navegador ni dependencias externas, listo para subir a Itch.io).

## Fase 23: Auditoría Integral y Erradicación de Filtraciones de Idioma (Español en Modo Inglés) (Completada)
- [x] **Tarea 160**: Auditoría y Paridad de Diccionarios i18n (`translations.ts`, `i18n.ts`: Validación de paridad 1:1 entre claves en `es` y `en` con 319 claves perfectamente sincronizadas).
- [x] **Tarea 161**: Localización de Alertas y Notificaciones Dinámicas de Partida (`GameController.ts`: Eliminación de todos los textos duros en español en avisos de banderas de tiempo por jugada, alertas de rescate de rehenes/cofres, avisos de habilidades y pasivas de IA rival, notificaciones de pase de turno, alertas de deshacer/rehacer y banner cinematográfico de Komi inicial).
- [x] **Tarea 162**: Localización de Textos Dinámicos del Asistente Wizard y Previsualizador (`ModalManager.ts`: Traducción reactiva de contadores de pasos "Step X of 5", descripciones de resumen del tablero, selector de dimensiones, geometrías, dificultad de IA y nombres de escenarios temáticos).
- [x] **Tarea 163**: Localización de HUD, Tooltips de Habilidades y Puntuación (`HUDController.ts`, `ScoreModalRenderer.ts`: Traducción bilingüe de descripciones emergentes de Duplicidad 2x1 y Lluvia Meteórica, rótulos de victorias 4P / Jigo y badges de dificultad).
- [x] **Tarea 164**: Localización de Eventos y Tienda del Mercader (`RoguelikeController.ts`, `RogueModalRenderer.ts`: Traducción bilingüe de todos los títulos, subtítulos, botones de reclamo, opciones de santuarios/descansos y catálogo flotante del mercader).
- [x] **Tarea 165**: Localización de Modo Online y Multijugador (`OnlineController.ts`, `NetworkManager.ts`: Mensajes de creación y unión de salas, estados del lobby, slots de jugadores y botón de copiar enlace bilingües).
- [x] **Tarea 166**: Recompilación Limpia y Regeneración de Binarios (.exe y .zip) (`CREAR_PAQUETE_EXE.bat`, `CrazyGo_Portable.zip`, `CrazyGo.exe`: Verificación TypeScript sin errores y actualización del paquete portable nativo listo para itch.io).
- [x] **Tarea 167**: Limpieza de Barra de Ítems en Lección 7 del Tutorial (`TutorialManager.ts`: Desactivación de fichas poliminó y hechizos en el capítulo de campeones, manteniendo la barra inferior oculta y enfocada al 100% en la habilidad de Tengu).

## Fase 24: Herramientas Tácticas Profesionales de Go (Conquest of Go Style) y Hándicap Universal (Completada)
- [x] **Tarea 168**: Restauración Total de Deshacer / Rebobinar (`GameState.ts`, `ChampionManager.ts`, `RogueliteManager.ts`, `PolyominoManager.ts`: Guardado y restauración de habilidades activas, pergaminos de hechizos e inventarios poliminó en cada snapshot de turno).
- [x] **Tarea 169**: Pasiva Innata del "Hombre Normal" (Sensei) (`ChampionManager.ts`, `RoguelikeRunManager.ts`, `translations.ts`: Inicia cada combate con 2 cargas gratuitas de Rebobinar ⏳ y descripción temática "Retrospectiva del Sensei").
- [x] **Tarea 170**: Gestor Universal de Piedras de Hándicap Canónicas (`HandicapManager.ts`, `GameController.ts`: Algoritmo canónico de puntos Hoshi para 9x9, 13x13 y 19x19, y algoritmo de dispersión de centralidad en grafos asimétricos; cesión del turno 1 a Blancas y Komi 0.5).
- [x] **Tarea 171**: Selector de Hándicap (0 a 9) en Wizard y Modos de Juego (`index.html`, `ModalManager.ts`, `AppEventBinder.ts`, `setup.css`: Selector visual de 0 a 9 piedras con ajuste automático de Komi y actualización de resumen).
- [x] **Tarea 172**: "El Ojo del Maestro" y "Proyección Astral" (`AnalysisEngine.ts`, `SVGRenderer.ts`, `GameController.ts`, `HUDController.ts`, `KeyboardController.ts`: Sugerencia de jugada óptima calculada por IA Dan con halo dorado pulsante, atajo `H`, justificación táctica y visualización proyectada de la secuencia 1-2-3).
- [x] **Tarea 173**: Barra de Probabilidad de Victoria en Tiempo Real (Win Rate % Bar) (`AnalysisEngine.ts`, `HUDController.ts`, `index.html`, `hud.css`: Estimación sigmoide logística continua en base a territorio, prisioneros y komi con barra animada en el HUD).
- [x] **Tarea 174**: Recompilación, Empaquetado y Pruebas (`CREAR_PAQUETE_EXE.bat`, `CrazyGo_Portable.zip`: Verificación con 0 errores y binarios actualizados).
- [x] **Tarea 175**: Disponibilidad Universal de Rebobinares del Hombre Normal y Sincronización Online P2P (`GameController.ts`, `OnlineController.ts`, `NetworkManager.ts`, `HUDController.ts`: El Hombre Normal dispone de sus 2 cargas de Rebobinar ⏳ en Local 1v1, 1vIA, Multijugador Online y Roguelike con sincronización bidireccional P2P vía mensaje `UNDO_REWIND` y renderizado activo del dock de hechizos).
- [x] **Tarea 176**: Animación Cinematográfica de Retorno Celestial de Fichas (`SVGRenderer.ts`, `vfx.css`: Animación con halo azul cian portal, levitación/rotación ascendente de la ficha y disolución en destellos celestiales al deshacer o rebobinar).
- [x] **Tarea 177**: Goban Geométrico Adaptativo en Previsualizador de Asistente (`ModalManager.ts`: Sustitución de contenedor rectangular genérico por cálculo de Convex Hull poligonal con bisel y sombra adaptada al contorno exacto en tableros triangulares, hexagonales, en cruz, erosionados y cuadrados).
- [x] **Tarea 178**: Reestructuración del Asistente Wizard a 6 Pasos con Escenario y Molde de Duelo (`index.html`, `ModalManager.ts`, `setup.css`, `translations.ts`, `KeyboardController.ts`: Desacoplamiento del selector de escenarios al nuevo Paso 5 independiente tras la elección de campeón; viewport panorámico cinemático con standee de campeón propio a la izquierda, Goban geométrico en el centro y silueta de rival desconocido con `❓` resplandeciente a la derecha).
- [x] **Tarea 179**: Asistente Wizard de 5 Pasos para Multijugador Online (Host) con Código/Semilla Persistente y Escena de Duelo en Vivo (`index.html`, `ModalManager.ts`, `OnlineController.ts`, `AppEventBinder.ts`, `KeyboardController.ts`, `types/index.ts`, `translations.ts`, `online.css`: Reestructuración del flujo de creación de sala online en 5 pasos interactivos con stepper y navegación bidireccional libre sin alterar el código de sala generado desde el paso 1; previsualización cinemática de duelo en paso 4 con standee de anfitrión, Goban adaptativo y caja misteriosa de invitado; y selección de fondo de combate con sincronización en la partida).
- [x] **Tarea 180**: Recompilación, Empaquetado y Pruebas del Paquete Portable Nativo (`CREAR_PAQUETE_EXE.bat`, `CrazyGo_Portable.zip`, `CrazyGo.exe`: Compilación TypeScript/Vite con 0 errores y binarios Windows de escritorio actualizados).
- [x] **Tarea 181**: Calibración Cinemática de Standees (+60% Campeón, -10% Rival) y Erradicación del Scroll Vertical (`setup.css`, `options.css`, `base.css`, `index.html`: Incremento del 60% en el tamaño del standee del campeón izquierdo, reducción del 10% en la caja misteriosa derecha con interrogación resplandeciente, eliminación del subtítulo redundante y optimización milimétrica de márgenes y paddings para un encuadre 100% libre de scroll vertical).
- [x] **Tarea 182**: Controles Compactos en Fila Única para Hándicap, Komi y Poliminós Especiales (`index.html`, `setup.css`, `translations.ts`, `ModalManager.ts`, `AppEventBinder.ts`: Agrupación de piedras poliminó especiales de Jugador e IA en una cuadrícula horizontal de 3 columnas por bando; simplificación del título de Hándicap a "Handicap Stones" y unificación de presets (0 a 6) más campo numérico libre en una sola fila; y disposición de Komi (0.5, 5.5, 6.5, 7.5 + valor libre) en una única fila horizontal en Local y Online).
- [x] **Tarea 183**: Selector de Campeón Rival y Standee Dinámico en Paso 5 (`index.html`, `setup.css`, `ModalManager.ts`, `AppEventBinder.ts`, `GameController.ts`, `DuelistRenderer.ts`, `HUDController.ts`: Selector horizontal de 8 opciones (`🎲 Random`, `👤 Sensei`, `🦅 Tengu`, `🌸 Himiko`, `🦊 Kitsune`, `⚔️ Ronin`, `🧪 Alchemist`, `🐉 Ryūjin`), standee dinámico con `❓` o ilustración del campeón, etiquetas de combatiente en fila única elevadas +10px y configuración táctica de IA in-game con HUD personalizado).
- [x] **Tarea 184**: Topologías Procedurales Orgánicas con Semilla Persistente y 8 Arquetipos Asimétricos (`BoardGenerators.ts`, `ModalManager.ts`, `AppEventBinder.ts`, `OnlineController.ts`, `GameController.ts`, `types/index.ts`: Persistencia de semilla al navegar entre pasos o cambiar opciones; re-generación exclusiva al pulsar 'Procedural'; e incorporación de 8 estilos asimétricos: Anillos Concéntricos con Puentes Radiales, Galaxia Espiral Doble, Reloj de Arena Cuántico, Tridente / Ypsilon Sagrada, Diamante Fracturado con Geoda Hueca, Archipiélago de Atolones Flotantes, Cañón Asimétrico Zig-Zag y Costa Orgánica Perlin Caótica).
- [x] **Tarea 185**: Recompilación, Empaquetado y Pruebas del Paquete Portable Nativo (`CREAR_PAQUETE_EXE.bat`, `CrazyGo_Portable.zip`, `CrazyGo.exe`: Compilación TypeScript/Vite con 0 errores y binarios Windows de escritorio actualizados).

## Fase 25: Calibración Visual, Fixes de Campeones, Rutas Relativas y Despliegue en Itch.io (Completada)
- [x] **Tarea 186**: Corrección de Habilidades de Campeones (Ronin e Himiko) (`GameController.ts`, `HimikoChampion.ts`, `HimikoVFX.ts`, `translations.ts`: Pasiva de Ronin configurada a cada 20 turnos sin doble disparo vinculada a `heroOwnerId`; fijación de la capa de cometas de Himiko a `#vfx-live-container` para sobrevivir a los re-renderizados del Goban; y eliminación de emojis duplicados en traducciones).
- [x] **Tarea 187**: Calibración Óptica de Tableros Geométricos y Standees (`SVGRenderer.ts`, `board.css`, `champions.css`, `DuelistRenderer.ts`: Elevación de +50px y zoom-in de +15% específico para tableros triangulares; reducción global del -8% en escala base del tablero; y ajuste del standee de Ronin con +8% de escala y -10px a la izquierda).
- [x] **Tarea 188**: Conversión Universal de Assets a Rutas Relativas (`index.html`, `src/`: Reemplazo global de `/heroes/`, `/enemies/`, `/audio/`, `/img/` por rutas relativas `./heroes/`, etc. para compatibilidad con iframes y subdirectorios de Itch.io).
- [x] **Tarea 189**: Generación de Builds Web y Empaquetado Itch.io (`crazy_go_itchio_v4.zip`: Compilación TypeScript/Vite y compresión de paquete ZIP optimizado para ejecución HTML5 en navegador).
- [x] **Tarea 190**: Generación de Cover Art 2D y Redacción de Campaña para Comunidades (`r/roguelites`, `r/baduk`, `r/aigamedev`: Generación de miniatura oficial 2D anime-pixel art y redacción de posts promocionales y técnicos).

## Fase 26: Desbloqueo de 1ª Línea de Tablero e Internacionalización Integral (ES / EN) (Completada)
- [x] **Tarea 191**: Desbloqueo de Interacción y Clics en la 1ª Línea del Goban (`champions.css`, `board.css`, `SVGRenderer.ts`: Desactivado `pointer-events: none` en siluetas y contenedores visuales de standees para impedir que el escalado de figuras bloquee las casillas periféricas del tablero; fijado `z-index: 20` y `pointer-events: auto` en `#board-container`).
- [x] **Tarea 192**: Internacionalización Integral de Alertas, Modales y Textos de Sensei (`SVGRenderer.ts`, `RoguelikeController.ts`, `RoguelikeMapRenderer.ts`, `ModalManager.ts`, `TutorialManager.ts`, `RogueModalRenderer.ts`: Localización dinámica en inglés y español de mensajes de error de Go [Suicidio, Ko, Casilla Ocupada], recompensas roguelike, tooltips del mapa, dojo y modales online).

## Fase 27: Purga de Assets Huérfanos, Optimización de Peso Web y Renovación Artística Unificada (Completada)
- [x] **Tarea 193**: Purga y Limpieza de 29 Archivos Huérfanos en `public/` (Eliminación de 23.46 MB de duplicados JPG y PNGs obsoletos no referenciados).
- [x] **Tarea 194**: Corrección Universal de Rutas de Texturas y Fondos (`base.css`, `layout.css`, `SVGDefs.ts`: Corrección de rutas absolutas `/bg_*.jpg` y `/wood_kaya.jpg` a rutas relativas `./` para compatibilidad de iframes en Itch.io).
- [x] **Tarea 195**: Generación de Roster de 7 Campeones con Estilo Artístico Unificado Ukiyo-e Cel-Shaded (`normal`, `tengu`, `himiko`, `kitsune`, `ronin`, `alchemist`, `ryujin`: Generación de standees de cuerpo entero con máscara alfa transparente limpia y retratos de primer plano 1:1 consistentes).
- [x] **Tarea 196**: Optimización y Compresión de Assets PNG y JPG (Compresión de fondos de 9.3 MB a 2.3 MB y optimización de siluetas de enemigos y campeones).
- [x] **Tarea 197**: Empaquetado Web Oficial Ligero (`crazy_go_itchio_v5.zip`: Compilación de paquete HTML5/JS/CSS de 38.2 MB listo para subir a Itch.io).

## Fase 28: Topologías Legendarias, Islas v1-v3, Zoom Global, Capas de Placas e IA Asimétrica (Completada)
- [x] **Tarea 198**: Integración de Escenarios Legendarios e Islas (`BoardGenerators.ts`, `types/index.ts`, `translations.ts`: Implementación de *Reloj de Arena Cuántico*, *Diamante Geoda*, *Galaxia Espiral*, *Anillos Concéntricos* e *Islas v1/v2/v3* como opciones fijas y en la generación de mapas Roguelike).
- [x] **Tarea 199**: Sistema de Zoom y Escalado Visual Configurable (`ModalManager.ts`, `KeyboardController.ts`, `index.html`: Atajos `Ctrl + +`, `Ctrl + -`, `Ctrl + 0`, slider en menú de opciones y persistencia en `localStorage`).
- [x] **Tarea 200**: Capa Frontal de Placas de Campeones (`champions.css`: `z-index: 50 !important` y desenfoque `blur(16px)` para asegurar que nombres y botones nunca sean eclipsados por la ilustración flotante).
- [x] **Tarea 201**: Orientación Óptica al Goban (`champions.css`, `DuelistRenderer.ts`: Ajuste de `scaleX` y `data-hero` para que ambos contendientes miren fijamente al centro del tablero).
- [x] **Tarea 202**: IA Táctica Topológica en Terrenos Asimétricos (`GoAI.ts`: Penalización de nodos trampa $\le 2$ libertades en apertura y bonificación de cuellos de botella/puentes estratégicos).
- [x] **Tarea 203**: Empaquetado Dual Oficial (`crazy_go_itchio_v6.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 29: Transparencia Total de Enemigos, Aviso Modo Historia y Tableros de Estrella (Completada)
- [x] **Tarea 204**: Purga y Transparencia Alfa de Enemigos (`public/enemies/`: Eliminación de 12 archivos duplicados `.webp` y `.jpg`, procesamiento de siluetas de monjes, sabios, jefe y espíritu con canal alfa limpio y formato único `.png`).
- [x] **Tarea 205**: Insignia 'En Desarrollo / In Development' en Modo Historia (`index.html`, `base.css`, `translations.ts`: Añadido badge `⚠️ En Desarrollo` bilingüe dinámico en el menú principal).
- [x] **Tarea 206**: Tableros de Estrella de 5 y 6 Puntas (`types/index.ts`, `BoardGenerators.ts`, `translations.ts`, `index.html`, `ModalManager.ts`, `AppEventBinder.ts`: Implementación de *Estrella de 5 Puntas / Pentagrama* y *Estrella de 6 Puntas / Estrella de David*).
- [x] **Tarea 207**: Empaquetado Dual Oficial Actualizado (`crazy_go_itchio_v7.zip` de 37.35 MB y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 30: Renovación de 'Persona Normal' (Sin Rostro) y Renombramiento Universal (Completada)
- [x] **Tarea 208**: Renombramiento Global a 'Persona Normal' / 'Normal Person' (`translations.ts`, `NormalChampion.ts`, `ModalManager.ts`, `StoryCampaign.ts`: Cambio universal de Hombre Normal / Normal Apprentice a Persona Normal / Normal Person).
- [x] **Tarea 209**: Ilustración y Retrato 100% Sin Rostro (`public/heroes/normal.png` y `public/heroes/normal_face.jpg`: Eliminación completa de ojos, cejas, nariz y boca conservando tonos de piel suaves, silueta ukiyo-e, transparencia limpia y fondo de papiro japonés).
- [x] **Tarea 210**: Empaquetado Dual Oficial Actualizado (`crazy_go_itchio_v7.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 31: Balance de Habilidades, Internacionalización 100%, Alineación de Escenario y Asistente Panorámico (Completada)
- [x] **Tarea 211**: Balance de Habilidades de Himiko y Ronin (`ChampionManager.ts`, `HimikoChampion.ts`, `RoninChampion.ts`, `translations.ts`: Himiko activa pasiva en Turno 20 y Ronin corta piedra cada 17 turnos).
- [x] **Tarea 212**: Internacionalización 100% en Asistente y Modales (`index.html`, `ModalManager.ts`, `translations.ts`: Eliminación de mezcla de idiomas en títulos, botones, tarjetas de habilidades y etiquetas de rivales/escenarios).
- [x] **Tarea 213**: Alineación Vertical en la Tarima de Duelo del Escenario (`setup.css`: Asentamiento del rival y del jugador en la misma línea base inferior sobre el tatami).
- [x] **Tarea 214**: Rediseño Panorámico del Asistente (`setup.css`, `options.css`: Ampliación a `max-width: 1160px` y `min-height: 580px` para aprovechar toda la pantalla).
- [x] **Tarea 215**: Empaquetado Dual Oficial Actualizado (`crazy_go_itchio_v8.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 32: Asentamiento Vertical y Escalado Majestuoso de Standees (Completada)
- [x] **Tarea 216**: Asentamiento y Ampliación de Figuras de Combate (`champions.css`: Descenso a `translateY(92px)` / `translateY(105px)` y aumento de escala a `scale(1.50)` para evitar que coronas/tocados altos como los de Himiko o cuernos de Ryūjin se corten con el borde superior).
- [x] **Tarea 217**: Empaquetado Dual Oficial Actualizado (`crazy_go_itchio_v8.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 33: Archipiélago Híbrido Tri-Geométrico (Cuadrado + Triángulo + Hexágono) (Completada)
- [x] **Tarea 218**: Generador de Archipiélago Híbrido Tri-Geométrico (`BoardGenerators.ts`: `islands_v1` genera una gran Isla Cuadrada central superior, una Isla Triangular inferior izquierda y una Isla Hexagonal inferior derecha conectadas por puentes tácticos diagonales).
- [x] **Tarea 219**: Variantes de Archipiélago Mixto Dual (`BoardGenerators.ts`: `islands_v2` Cuadrado + Dual Triangular e `islands_v3` Cuadrado + Dual Hexagonal con puentes tácticos).
- [x] **Tarea 220**: Localización y Empaquetado Dual (`translations.ts`, `ModalManager.ts`: Actualizados nombres bilingües y empaquetados oficiales `crazy_go_itchio_v8.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 34: Archipiélago Cruz Cuadrada (5 Islas Cuadradas con Puentes Cardinales) (Completada)
- [x] **Tarea 221**: Generador de Archipiélago Cruz Cuadrada (`BoardGenerators.ts`, `types/index.ts`: Implementación de `islands_v4` con 1 Gran Isla Cuadrada central conectada ortogonalmente a 4 Islas Cuadradas satélites Norte, Sur, Este y Oeste mediante puentes cardinales).
- [x] **Tarea 222**: Integración UI e Internacionalización Bilingüe (`index.html`, `ModalManager.ts`, `AppEventBinder.ts`, `translations.ts`: Selector y botones integrados en partida local y online con etiquetas bilingües dinámicas).
- [x] **Tarea 223**: Empaquetado Dual Oficial Actualizado (`crazy_go_itchio_v8.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 35: Reconstrucción Artística de 'Persona Normal' (Sin Rostro Puro) y Primer Plano de Ryūjin (Completada)
- [x] **Tarea 224**: Reconstrucción Pura de Rostro Sin Rasgos de 'Persona Normal' (`public/heroes/normal_face.jpg` y `public/heroes/normal.png`: Eliminado el parche circular de difuminado; reconstruida la superficie facial con degradado suave y radiante de tono de piel natural, preservando cabello oscuro, cintas, contorno mandibular y silueta con canal alfa limpio).
- [x] **Tarea 225**: Primer Plano Épico de Ryūjin (`public/heroes/ryujin_face.jpg`: Retrato en primer plano del Emperador Dragón sobre fondo de pergamino washi japonés y viñeta de tinta, a juego con el resto de campeones místicos).
- [x] **Tarea 226**: Empaquetado Dual Oficial Actualizado (`crazy_go_itchio_v8.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 36: Corrección de Carga de Fondos Web/Roguelike y Fórmulas Concisa de Combate (Completada)
- [x] **Tarea 227**: Resolución de Rutas de Fondos Temáticos en Web/Roguelike (`layout.css`, `base.css`, `HUDController.ts`: Corregidas las rutas relativas de CSS y añadido refresco dinámico explícito de fondo en `setBoardBackground` para asegurar la carga inmediata de `bg_combat.jpg`, `bg_boss.jpg`, etc., en navegadores e iframe de Itch.io).
- [x] **Tarea 228**: Fórmulas Sintéticas de Habilidades en Combate (`translations.ts`, `HUDController.ts`, `champions.css`: Añadidas fórmulas concisas con flechas limpias `→`, eliminado el icono gris que ocupaba espacio horizontal y ampliada la tarjeta de combate un 7% a 235px para lectura óptima).
- [x] **Tarea 229**: Empaquetado Dual Oficial Actualizado (`crazy_go_itchio_v8.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 37: Rediseño Integral de Archipiélagos con Paseos Anchos y Reorganización v1, v2, v3 (Completada)
- [x] **Tarea 230**: Reorganización de Topologías de Islas (`types/index.ts`, `BoardGenerators.ts`, `ModalManager.ts`, `AppEventBinder.ts`, `RoguelikeMapGenerator.ts`, `index.html`: Eliminada la antigua `islands_v2` dual triangular; `islands_v2` es ahora Cuadrado + Dual Hexagonal; `islands_v3` es ahora Cruz Cardinal de 5 Islas Cuadradas; eliminada `islands_v4`).
- [x] **Tarea 231**: Rediseño Geométrico con Islas Amplias y Paseos Anchos de 2-3 Carriles (`BoardGenerators.ts`: Centro y satélites ampliados sustancialmente; las conexiones ya no son una línea simple inclinada sino avenidas/paseos de 2 a 3 carriles de ancho con interconexiones completas).
- [x] **Tarea 232**: Localización Bilingüe y Empaquetado Oficial (`translations.ts`, `crazy_go_itchio_v8.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 38: Reconstrucción Artística 100% Sin Rostro de Persona Normal y Primer Plano de Ryūjin (Completada)
- [x] **Tarea 233**: Rostro 100% Sin Rasgos en Retrato de Persona Normal (`public/heroes/normal_face.jpg`: Cobertura milimétrica de ojos, cejas, pestañas, nariz y boca con textura de piel suave y radiante sin ninguna línea residual sobre fondo washi japonés tradicional).
- [x] **Tarea 234**: Standee Transparente de Persona Normal 100% Sin Rasgos (`public/heroes/normal.png`: Reconstruido desde el asset original de alta resolución con canal alfa limpio y superficie facial libre de ojos, cejas, nariz y boca, preservando peinado, cintas y oreja).
- [x] **Tarea 235**: Retrato en Primer Plano Auténtico de Ryūjin (`public/heroes/ryujin_face.jpg`: Encuadre de busto en primer plano con cuernos de dragón, ojos celestiales, orbe de agua y fondo de pergamino washi zen con viñeta de tinta).
- [x] **Tarea 236**: Empaquetado Dual Oficial Actualizado (`crazy_go_itchio_v8.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 39: Topologías Isométricas Triangulares (Estrellas de 5 y 6 Puntas) y Archipiélago Dual (Completada)
- [x] **Tarea 237**: Rediseño de `islands_v1` como Archipiélago Dual (`BoardGenerators.ts`: Eliminado el cuadrado central; ahora son 2 grandes islas de igual escala: 1 Hexágono + 1 Triángulo, ambas sobre la misma cuadrícula isométrica triangular y conectadas por un paseo ancho continuo de celdas triangulares/hexagonales).
- [x] **Tarea 238**: Reorganización de Archipiélagos (`types/index.ts`, `BoardGenerators.ts`, `ModalManager.ts`, `AppEventBinder.ts`, `RoguelikeMapGenerator.ts`, `translations.ts`, `index.html`: `islands_v2` es ahora la Cruz Cardinal de 5 Islas Cuadradas con avenidas anchas ortogonales de 2-3 carriles; eliminada la antigua `islands_v3`).
- [x] **Tarea 239**: Rediseño de Estrellas de 5 y 6 Puntas con Malla Triangular Pura (`BoardGenerators.ts`: `star_5` y `star_6` reconstruidas usando cuadrícula isométrica triangular pura de 6 direcciones en lugar de cuadrículas cuadradas ortogonales).
- [x] **Tarea 240**: Empaquetado Dual Oficial Actualizado (`crazy_go_itchio_v9.zip` de 37.78 MB y `CrazyGo_Portable.zip` / `CrazyGo.exe`).

## Fase 40: Corrección de Turnos y Escalado de Habilidades de Ryūjin (Completada)
- [x] **Tarea 241**: Corrección del Bug de Colocación de Ficha Rival tras Calcinación (`SVGRenderer.ts`, `ChampionManager.ts`, `GameController.ts`: Bloqueo inmediato de interacción al terminar de calcinar, sincronización adecuada del turno de la IA y protección de turno local).
- [x] **Tarea 242**: Restricción Canónica de Piedras Enemigas (`RyujinChampion.ts`: Verificación de `centerNode.stone.playerId !== playerId` para asegurar que solo se calcinan piedras del rival).
- [x] **Tarea 243**: Nuevas Reglas de Escalado de Furia del Dragón (`RyujinChampion.ts`, `GameController.ts`, `translations.ts`: 9x9 con 2 ojos quema 2 piedras enemigas; 13x13 con 3+ ojos quema 4 piedras enemigas; 19x19 otorga 1 quema por grupo vivo de 2 ojos y +1 quema por cada ojo adicional expandido).
- [x] **Tarea 244**: Algoritmo Canónico de Benson (1976) y Eliminación de Ojos Falsos (`GraphBoard.ts`: Poda iterativa de subregiones saludables y verificación diagonal de esquinas para descartar ojos falsos).
- [x] **Tarea 245**: Empaquetado Oficial Actualizado (`crazy_go_itchio_v9.zip` y `CrazyGo_Portable.zip` / `CrazyGo.exe`).



## Fase 41: Corrección de Bugs Críticos, Mejoras de IA, Nuevas Mecánicas y Pulido (Sesión 100+)

### Bugs Críticos (Alta Prioridad)
- [x] **Tarea 246**: Corrección del Bug de Ryūjin — Furia del Dragón Rota: tras quemar las piedras el cursor obliga a poner una piedra del color rival y bloquea el sistema de turnos; eliminar cualquier llamada a `onMovePlaced`/`onNodeClicked` con `isLocal=true` desde el flujo de calcinación y garantizar que `onPassiveBurnCompleted` sea el único punto de salida del callback de Ryūjin. Verificar también que `checkAITurn` y `renderer.isInteractive` se restauren correctamente en todos los modos (1vIA, 1v1, online).
- [x] **Tarea 247**: Corrección de Capturas en Tableros Irregulares — Pseudo-intersecciones Fantasmas: grupos que no tienen libertades visibles no se capturan. Revisar `GraphBoard.getLiberties` para asegurarse de que nodos con `terrain === 'DESTROYED'` o `terrain === 'OBSTACLE'` jamás cuentan como libertad, y eliminar adyacencias a nodos fuera-de-tablero que se añaden erróneamente durante la generación de topologías asimétricas en `BoardGenerators.ts`.
- [x] **Tarea 248**: Bug de IA en Itch.io Embebido — Sonido pero sin Piedra: la IA reproduce el sonido pero no coloca la piedra (posible condición de carrera entre el timeout de la IA y el render del iframe). Refactorizar `checkAITurn` para garantizar que `handleNodeClick` complete síncronamente su efecto antes de llamar al siguiente timeout; añadir un guard `isAIProcessing` para evitar llamadas solapadas.
- [x] **Tarea 249**: Bug de Fin de Partida No Detectado (Game Never Ends): la IA no pasa turno cuando debería, el tablero se llena, la última piedra captura todo el territorio del humano. Corrección triple: (1) `opponentJustPassed` en `GoAI.ts` debe usar **solo** `consecutivePasses >= 1` eliminando el `|| lastMoveNodeId === null` incorrecto; (2) el fallback doble-pase en `GameController.ts` L766-771 debe protegerse con un guard; (3) `consecutivePasses` debe resetearse a 0 explícitamente al colocar una piedra real en `RulesEngine.tryPlaceStone`.
- [x] **Tarea 250**: Corrección del Sistema de Turnos Múltiples: a veces el mismo jugador/IA juega varios turnos seguidos. Añadir mutex `isAITurnRunning` en `GameController` que impida que `checkAITurn` sea invocado concurrentemente; limpiar todos los `setTimeout` pendientes antes de iniciar un nuevo turno de IA.
- [x] **Tarea 251**: Modo Historia — Primer Combate Sin Botón de Pasar Turno y sin Fin de Partida: en modo historia `isCurrentChapterSolo()` puede forzar `currentPlayer = 1` bloqueando el paso de turno. Añadir botón de paso de turno visible en modo historia cuando `!isCurrentChapterSolo()`, y asegurarse de que la condición de victoria del capítulo se evalúa correctamente tras cada jugada.
- [x] **Tarea 252**: Ala de Tengu Cortada en el Standee: el asset `tengu.png` muestra el ala derecha recortada. Regenerar la ilustración con el ala completa visible, o ajustar el CSS `object-fit`/`object-position` del standee para que no recorte el ala; revisar también la restricción de altura en `.duel-standee`.

### Mejoras de Jugabilidad y UX
- [x] **Tarea 253**: Marcador de Última Jugada Universal: en todos los modos de juego, la última intersección donde se colocó una piedra debe quedar marcada con un pequeño círculo/halo de color contrastante (blanco para piedra negra, negro para blanca) persistente hasta el siguiente turno, visible también durante el turno de la IA.
- [x] **Tarea 254**: Demora Natural Adaptativa de la IA: reemplazar el delay fijo de la IA (250-450ms) por una demora aleatoria entre 0.7s y 1.5s que varía según la fase de la partida (apertura más rápida, endgame más lento) y la complejidad estimada de la jugada (número de candidatos evaluados); usar `Math.random()` con función cuadrática de progreso del turno.
- [x] InteractionManager, GameEventBus y refactorización de eventos completados.

## Fase 46: Fix Multijugador Online (Host Wizard) y Actualización de Versión
- [x] **Tarea 266**: **Corrección de la Navegación y Botón de Inicio en el Wizard del Host Online:**
  - Resuelto el problema por el cual el anfitrión no podía seleccionar opciones ni cambiar de paso al crear una sala online (OnlineModalRenderer.setOnlineWizardStep usaba una clase CSS inexistente).
  - Actualizado log_crazy_go.md con un separador explícito para la nueva versión (v11) a partir de este punto.
  - Solucionado el fallo de sincronización de configuración entre host y cliente (Guest) al iniciar la partida: se añadieron las propiedades faltantes (`seed`, `background`, `isCoopRogue`, `coopSubTurn`, y `ruleStyle`) en las llamadas a `GameController.initGame` dentro de `OnlineController.ts`, garantizando que tanto anfitrión como invitados generen exactamente el mismo tablero procedural y vean el mismo escenario.

## Fase 50: Rebobinares para Persona Normal, SFX Bong de Pase de Turno y Corrección de IA con Alquimista
- [x] **Tarea 272**: **Rebobinares Universales para Persona Normal:**
  - Configurados 2 Rebobinares tácticos gratuitos (⏳) para el campeón Persona Normal en todos los modos no roguelike (Local 1v1, 1vIA, 4P, Online P2P y Sandbox).
  - Escalado por dificultad preservado en modo Roguelike (Fácil 4, Media 2, Difícil 1, Extrema 0).
  - Actualizadas las descripciones y fórmulas de combate en `translations.ts` (español e inglés) y habilitada la visibilidad en `HUDController.ts`.
- [x] **Tarea 273**: **Efecto de Sonido "Bong" de Pase de Turno:**
  - Re-sintetizado `SoundFX.playPass()` mediante Web Audio API con un auténtico golpe suave de mazo y resonancia de campana zen / gong budista tradicional ("Bong" en Sol / 196Hz con armónicos ricos de 0.85s).
  - Corregidos `GameController.handlePass` y `GameController.checkAITurn` para reproducir `SoundFX.playPass()` al pasar turno en lugar del impacto de piedra.
- [x] **Tarea 274**: **Corrección de Pase Prematuro de IA con Alquimista:**
  - Ajustadas las condiciones heurísticas de fin de partida en `GoAI.ts` eliminando el disparador prematuro `score <= 150` en tableros abiertos.
  - La IA ahora calcula y coloca su piedra real en el Goban tras la Inversión Cromática del Alquimista antes de finalizar su turno.

## Fase 51: Fix Definitivo del Alquimista e IA (Pase de Turno Limpio)
- [x] **Tarea 275**: **Avance de Turno Limpio para Inversión Cromática (`advanceTurn`):**
  - Sustituido `state.passTurn()` por `state.advanceTurn()` en `ChampionManager.executeTargetedSkill()`.
  - Se evita el incremento indeseado de `state.consecutivePasses`, impidiendo que la IA lo interprete como un pase voluntario del jugador rival y garantizando que siempre responda colocando una piedra de su color en el Goban.

## Fase 52: Komi Individual 4 Jugadores (P2 2.5, P3 4.5, P4 6.5) y Anuncio de Inicio en Partida Local
- [x] **Tarea 276**: **Komi Escalonado 4P y Activación Universal de Anuncio de Inicio:**
  - Configuración independiente de Komi en el Paso 7 del Asistente para 4 Jugadores: Blancas (P2: 2.5), Esmeralda (P3: 4.5) y Amatista (P4: 6.5) con presets y campo libre.
  - Sincronización en `GameState`, `TerritoryScorer`, pills de captura del HUD in-game y modal de puntuación.
- [x] **Tarea 277**: **Generación y Empaquetado Dual Oficial (v12):**
  - Generado `crazy_go_itchio_v12_browser.zip` (37.86 MB) con estándar estricto UNIX (`/`) para subir a Itch.io como juego HTML5 de navegador.
  - Generado `crazy_go_windows_v12.zip` (37.86 MB) como único paquete ejecutable portable de Windows con `CrazyGo.exe`.

## Fase 53: Conteo Canónico de Territorio con Detección y Captura de Piedras Muertas
- [x] **Tarea 278**: **Algoritmo de Recintos Topológicos, Vida/Muerte y Territorio Puro:**
  - Implementada en `TerritoryScorer.ts` la detección canónica de grupos enemigos atrapados sin dos ojos independientes.
  - Conversión de piedras muertas en capturas (+1 prisionero por piedra) y territorio para el jugador que las encierra.
  - Inundación BFS sobre el tablero libre de piedras muertas y representación visual con marcadores `✕` en `SVGRenderer.ts`.

## Fase 54: Motor de Detección de Piedras Muertas y Seki (Vida Mutua)
- [x] **Tarea 279**: **Algoritmo de Seki en 3 Capas y Detección de Recintos 100%:**
  - Detección canónica de vida mutua (Seki) en `TerritoryScorer.ts` con overlay visual triangular morado `S` en `SVGRenderer.ts`.
  - Eliminación de umbrales anticipados y detección rigurosa de recintos enemigos sellados.

## Fase 55: Pulido de UX, Rotación Táctica, Escalado Dinámico de Goban, Localización y Animaciones
- [x] **Tarea 280**: **Atajo de Rotación 'R' y SFX Táctico de Duplicidad:**
  - `SoundFX.playRotate()` con barrido suave de madera mineral.
  - Selección inteligente al pulsar 'R' si la ficha no estaba activa y actualización instantánea de preview hover ghost sin reconstruir el DOM.
- [x] **Tarea 281**: **Algoritmo Dinámico de Escalado, Elevación Zenital (-22px) y Optimización de Espacio del Goban (+15% a +35%):**
  - Elevación global de 22 px hacia arriba (`transform: translateY(-22px)`) en todos los tableros para alineación perfecta y holgura ergonómica respecto a la barra inferior.
  - Ampliación de límites en `#board-container` a `max-width: min(calc((100vh - 135px) * 2.2), clamp(380px, 66vw, 1080px))` y `max-height: min(calc(100vh - 135px), clamp(380px, 60vw, 840px))`.
  - Rediseño de padding de madera y `viewBox` compacto en `SVGRenderer.ts` (`padding = stoneRadius * 1.08`, `safetyMargin = padding + 4`): archipiélagos anchos/duales (`islands_v1`) y topologías picudas (`triangle`) crecen entre un +15% y +35% llenando el espacio disponible sin solapar personajes ni recortar sombras.
- [x] **Tarea 282**: **Localización de P3/P4 y Compactación del HUD de Turno:**
  - Traducción de `hud.player_green` ("Esmeralda"/"Emerald") y `hud.player_purple` ("Amatista"/"Amethyst").
  - Formato conciso en topbar y traducción del badge de pensamiento `🤖 Pensando...`.
- [x] **Tarea 283**: **Standee Frontal Rival en 4 Jugadores durante Turno Propio:**
  - Posicionamiento frontal pero 10% más pequeño (`scale(1.12)`), con máscara gris al 50% de los de atrás y sin blur cuando es el turno del jugador humano P1.
- [x] **Tarea 284**: **Animación Cinemática de Desvanecimiento para Piedras Muertas:**
  - Animación CSS `@keyframes deadStoneFade` y `@keyframes deadCrossFadeIn` de 1.2s en `.stone-dead-captured`.
- [x] **Tarea 285**: **Soporte y Validación de Rotación [R] en Tutorial Lección 8:**
  - Sincronización íntegra de `playerInventories`, rotación táctica natural con `SoundFX.playRotate()` y validación guiada de Sensei.

## Fase 56: Recompensas Roguelike sin Komi, Piedras Especiales Unificadas, Precisión VFX de Ronin, IA Boss Dragon y Biblia de Prompts
- [x] **Tarea 286**: **Eliminación Total de Recompensas de Komi y Reestructuración Roguelike:**
  - Eliminados todos los bonos de Komi en el mapa, santuarios, descanso/meditación y rescates de rehenes en `RoguelikeController.ts`, `RoguelikeMapGenerator.ts`, `RoguelikeMapRenderer.ts` y `GameController.ts`.
  - Santuario: Añadido *Pacto Espiritual* para tomar prestado cualquier campeón para el próximo combate de Go, además de bendición de habilidad y lotes de pergaminos/poliminós.
  - Zona de Descanso: Añadidos *Estudio Arcano* (+1 Meteorito y +1 Inversión Yin-Yang) y *Forja Táctica* (+1 Monolito 2x2 y +1 Dominó 2x1).
  - Rescate de Rehenes: Monje otorga +1 Carga de Habilidad y +1 Escudo Divino; Espíritu Guardián otorga +1 Monolito 2x2 y +1 Inversión Yin-Yang.
- [x] **Tarea 287**: **Precisión Milimétrica del Tajo de Ronin:**
  - `transform-origin: center; transform-box: fill-box;` en `vfx.css` y retícula de corte cyan en cruz `(coord.x, coord.y)` en `RoninVFX.ts`.
- [x] **Tarea 288**: **Rediseño Visual de Piedras Especiales y Poliminós Unificados + Tooltip Interactivo:**
  - Duplicidad (2x1) como cápsula unificada cyan con grabado `🀄`.
  - Monolito (2x2) como losa titánica cuadrangular ámbar/dorada con relieve `🧱`.
  - Germinante (1x1) con brote vivo `🌿`.
  - Tooltip flotante interactivo al pasar el cursor sobre cualquier piedra especial en el Goban explicando sus propiedades tácticas.
- [x] **Tarea 289**: **IA, Animación Cinemática del Jefe Final (Gran Dragón Sabio Gris) y Placa de Habilidad del Rival:**
  - Conexión de `BossManager.checkAIBossTrigger()` en `AITurnManager.ts` para que el Dragón Jefe ejecute su Aliento Calcinante del 25% del tablero con sacudida de pantalla y VFX cinemático.
  - Placa de habilidad única del rival (`#duel-enemy-skill-badge`) en el HUD que describe las técnicas de cada oponente.
  - Orientación espejada del Dragón Jefe (`scaleX(-1)`) mirando hacia el Goban y el jugador.
- [x] **Tarea 290**: **Biblia Maestra de Prompts de Arte y Estilo Visual:**
  - Creado `docs/ai_wiki/game_design/art_prompts_bible.md` con las directrices de estilo Sumi-e/anime, transparencia alfa y la biblioteca completa de prompts para personajes, enemigos, jefes, artefactos y fondos.
- [x] **Tarea 291**: **Compilación y Empaquetado Dual Oficial v13:**
  - Generados `crazy_go_itchio_v13_browser.zip` (37.86 MB) y `crazy_go_windows_v13.zip` (37.87 MB).

## Fase 57: Fichas Especiales Indivisibles y Refinado del Sistema de Tiempo Byo-Yomi
- [x] **Tarea 292**: **Fichas Especiales Indivisibles con Destrucción y Transmutación en Bloque:**
  - `RulesEngine.destroyStoneAndPolyGroup()` y `RulesEngine.transmuteStoneAndPolyGroup()` implementados en `RulesEngine.ts`.
  - Destrucción y transmutación en bloque conectadas en Tengu, Ryūjin, Ronin, Alquimista, Dragón Jefe, Pergaminos de Hechizo, IA y controlador central.
- [x] **Tarea 293**: **Refinado Integral de Modos de Tiempo (Byo-yomi, Japonés, Fischer, Absoluto):**
  - Wizard de Partida Local con 4 modos de reloj, presets de 5s a 60s y campos numéricos personalizados para segundos, minutos y periodos.
  - Pulso acústico de cuenta atrás tensa `SoundFX.playClockTick()` en $\le 5$ segundos y clase visual `.timer-urgent`.
- [x] **Tarea 294**: **Compilación y Empaquetado Dual Oficial v13 Actualizado:**
  - Generados `crazy_go_itchio_v13_browser.zip` (37.86 MB) y `crazy_go_windows_v13.zip` (37.87 MB).






## Fase 58: Sincronización P2P Avanzada y Corrección de Tooltips Multijugador
- [x] **Tarea 295**: **Sincronización P2P de Animaciones y Tooltips:**
  - Extracción y renderizado de placas de habilidad enemiga (\#duel-enemy-skill-badge\) en modo online P2P.
  - Corrección de asignación de héroe local en \GameController.handleRemoteSkill\ y \ChampionManager.executeTargetedSkill\ para garantizar que se ejecute la habilidad del héroe remoto y no del local.
- [x] **Tarea 296**: **Determinismo Pseudoaleatorio (\SeededRandom.ts\):**
  - Semilla inicializada vía configuración compartida (\config.seed\) e instanciada para reemplazar \Math.random()\ en \TenguChampion\, \RoninChampion\ y \HimikoChampion\, sincronizando así los objetivos dinámicos entre clientes y previniendo desincronizaciones de tablero.
- [x] **Tarea 297**: **Empaquetado Dual v14:**
  - Compilación nativa y empaquetado para Itch.io y Windows con el script \scripts/build_packages.js\.
- [x] **Tarea 298**: **Rediseño y Unificación de la Barra de Winrate:**
  - Eliminación de la barra duplicada en la barra superior.
  - Rediseño de la barra de 4 jugadores: reubicada en la parte inferior, sobre la barra de hechizos.
  - Aumento de grosor (x3) y adición de etiquetas de porcentaje explícitas debajo de cada segmento coloreado.
- [x] **Tarea 299**: **Optimización de Winrate (KataGo style) y Layout:**
  - Ajustado el tamaño de los tableros en un -5% y reubicados (-40px en Y) para encajar perfectamente con la nueva barra de winrate sin solapar la Spellbar.
  - Modificada la altura de la barra a 12px y anchura al 70%.
  - Se ha programado una heurística avanzada de Ventaja de Iniciativa (Virtual Komi) en \AnalysisEngine.calculateWinRate\, la cual simula el comportamiento de KataGo asignando la compensación equitativa inicial en turnos tempranos y decayendo de forma progresiva. Ahora el Turno 1 evalúa la probabilidad como 25% equitativo en 4 jugadores o 50% en 1v1.
- [x] **Tarea 300**: **Mejoras temporales de Winrate (Puente A+B):**
  - Ajuste de la temperatura del Softmax en AnalysisEngine.ts para que sea más baja (cercana a 1.5 - 5 dependiendo del tablero), logrando una mayor sensibilidad a la diferencia de puntos, imitando parcialmente el comportamiento analítico agudo de KataGo.
  - Comprobación y estabilización del bucle de recuento de libertades para evitar multiplicadores irreales en cadenas masivas.

## Fase 59: Sandbox Entity Testing & Cheat Capture (Completada)
- [x] **Tarea 301**: Captura Inmediata de Entidades (\GameController.ts\, \SVGRenderer.ts\): Al activar el modo Sandbox/Desarrollador, hacer clic directo sobre una entidad en el tablero desencadena instantáneamente su recompensa (Cofre, Monje, Pergamino o Espíritu), sin requerir capturarla rodeando sus libertades.
- [x] **Tarea 302**: Brochas Generadoras de Entidades (\SandboxController.ts\, \modal-sandbox.html\): Implementados 4 pinceles específicos en el menú del Testing Lab para sembrar Cofres Místicos, Monjes Cautivos, Pergaminos Sagrados y Espíritus Guardianes proceduralmente sobre el Goban y testear comportamientos y recompensas.
- [x] **Tarea 303**: Corrección de Sistema de Zoom (\OptionsModalRenderer.ts\, \	heme.css\): Reemplazado el enfoque de variables CSS \--ui-scale\ (y \	ransform: scale\) por la propiedad directa \document.body.style.zoom\, evitando la pérdida de centrado de coordenadas SVG y los fallos de márgenes o scroll, igualándolo funcionalmente al nativo \Ctrl +\ / \Ctrl -\ de Google Chrome.

## Fase 60: Destrucción Topológica y Tableros Dinámicos (Lluvia de Meteoros) (Completada)
- [x] **Tarea 304**: Integración de Eliminación Física de Nodos (\GraphBoard.ts\, \RulesEngine.ts\): Método \
emoveNode()\ implementado sin romper referencias de coordenadas (se limpian los vecinos y se marca \	errain = 'DESTROYED'\) y \destroyTopology()\ para erradicar las aristas y evaluar asfixia masiva inmediata de todas las piedras que dependían de la intersección destruida.
- [x] **Tarea 305**: Máscaras Dinámicas de Agujeros en Madera (\SVGRenderer.ts\): Implementada una \SVG Mask\ que recorta dinámicamente el polígono de madera exterior mostrando un vacío oscuro puro (agujero transparente/negro) y detiene el renderizado de la cuadrícula interactiva, visualizando fielmente los estragos topológicos.
- [x] **Tarea 306**: Devastación Pasiva del Jefe Dragón (\BossManager.ts\, \AITurnManager.ts\, \GameState.ts\): Añadido \checkAIPassiveDevastation()\. A partir del turno global 22 de la batalla de jefe, en cada turno de la IA, caen automática y pasivamente 4 meteoros aleatorios (con cinemática de fuego) que pulverizan para siempre nodos del tablero.


## Fase 61: Rediseño del Combat Log e i18n Completo (Completada)
- [x] **Tarea 307**: Nomenclatura de Nodos Base-25: Columnas tipo Excel (A-Z, AA-ZZ) para escalar infinitamente.
- [x] **Tarea 308**: Eliminación de Bordes y Bounding Boxes (Convex Hull): Se ha quitado el borde rojo interpolado que arruinaba la topología cóncava.
- [x] **Tarea 309**: i18n del Log de Combate: Creados tokens en translations.ts y refactorización del DOM para traducir todo al inglés dinámicamente.
- [x] **Tarea 310**: Resolución de Bug Crítico de Renderizado de Retorno: Prevenido el fallo en navegadores por el cual inyectar un \<defs>\ repetido en un contenedor oculto apagaba los materiales SVG del viewport activo.
- [x] **Tarea 311**: Registro de Habilidades Activas: Conectado el \ChampionManager\ al \CombatLogManager\ para que las habilidades dirigidas lanzadas por el jugador se registren correctamente en el historial.
- [x] **Tarea 312**: Visibilidad de la Cuadrícula en el Log: Las líneas de la cuadrícula en el Combat Log ahora son semitransparentes brillantes (\gba(255, 255, 255, 0.15)\) para asegurar su visibilidad tras quitar el fondo de madera.
- [x] **Tarea 313**: Refinado del UI del Log: Eliminado el botón X redundante arriba a la derecha.
- [x] **Tarea 314**: Pestaña Tablero en Combat Log: Añadida pestaña de filtro 'board' en el Log de Combate para eventos de entorno.
- [x] **Tarea 315**: Integración de Eventos de Tablero al Log: El gestor de peligros (\StageHazardManager\) ahora reporta erupciones volcánicas, expansión celestial y la inhalación del Oni directo al registro, y se muestra en la pestaña 'Board' y 'All'.
