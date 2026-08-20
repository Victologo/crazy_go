# Mapa de Código — Crazy Go

> Archivo de referencia rápida para la IA. Actualizar tras refactorizaciones importantes.
> Referenciado desde `docs/ai_wiki/active_context.md` → leer este archivo al inicio de sesión.

## Stack y Entry Points

| Archivo | Rol |
|---|---|
| `src/main.ts` | Orquestador de 40 líneas. Importa todos los binders y arranca la app. |
| `index.html` | HTML principal. Todos los modales, HUD, botones y templates viven aquí. |
| `vite.config.ts` | Configuración de Vite (allowedHosts, exclusiones de empaquetado). |

---

## Capa de Eventos (src/events/)

> Conectan el DOM con los controladores. Patrón Fachada + Bus de Eventos.

| Archivo | Responsabilidad |
|---|---|
| `AppEventBinder.ts` | Bootstrap global: llama a todos los binders. Punto de entrada de eventos. |
| `MenuEventBinder.ts` | Botones del Menú Principal (Modo Local, Online, Roguelike, Tutorial, Historia, Sandbox). |
| `SetupEventBinder.ts` | Wizard de configuración de partida local (5 pasos). |
| `GameEventBinder.ts` | Botones in-game: pasar turno, deshacer, habilidad, hechizos, poliminós, pista. |
| `OnlineEventBinder.ts` | Crear/unirse sala P2P, lobby, inicio de partida online. |
| `OptionsEventBinder.ts` | Modal de Opciones: tema, idioma, volumen, modo dev, FPS, atajos. |
| `KeyboardController.ts` | Atajos de teclado globales (flechas, WASD, números, Enter, Escape, R). |
| `GameEventBus.ts` | Bus de eventos interno para comunicación entre controladores sin acoplamiento. |

---

## Capa de Controladores (src/controllers/)

| Archivo | Responsabilidad |
|---|---|
| `GameController.ts` | **Controlador central**. Ciclo de juego: iniciar, onNodeClicked, checkAITurn, handlePass, handleUndo, selectSpell, toggleChampionActiveSkill. |
| `AITurnManager.ts` | Gestiona el worker de IA. Controla delay y habilidades de IA (Tengu, Kitsune, Ronin como rivales en modo Maestro). |
| `InteractionManager.ts` | **Punto de entrada para acciones del jugador**. Valida y despacha: selectSpell, toggleChampionActiveSkill, triggerBestMoveHint. |
| `RoguelikeController.ts` | Flujo Roguelike: recompensas, mercader, santuario, eventos de nodo. |
| `OnlineController.ts` | Coordinación P2P online: conectar, mensajes de red, sincronizar estado. |
| `SandboxController.ts` | Modo Sandbox / Laboratorio: pinceles, escenarios de prueba, hacks de dev. |
| `TimeManager.ts` | Temporizadores de partida (Byo-yomi, Súbito, Fischer). |

---

## Capa Core / Motor de Juego (src/core/)

| Archivo | Responsabilidad |
|---|---|
| `GraphBoard.ts` | **Tablero como grafo**. Nodos, aristas, terreno, piedras. isTrueEye, hasLivingGroup (Teorema de Benson). |
| `GameState.ts` | **Estado de partida**. currentPlayer, historyStack, passTurn(), advanceTurn(), undo(), redo(). |
| `RulesEngine.ts` | **Reglas de Go**: libertades, capturas, Ko simple, suicidio, resolveBoardCaptures, tryPlaceMultiStones. |
| `TerritoryScorer.ts` | Conteo de territorio BFS. PLAYER_META (colores, nombres, iconos). Komi. |
| `ChampionManager.ts` | **Fachada de habilidades**. Estado global de targeting, cargas, alchemistUsedThisTurn. Delega a champions/. |
| `champions/AlchemistChampion.ts` | Inversión Cromática: transmuta N piedras, pasa turno al terminar. |
| `champions/TenguChampion.ts` | Lluvia Meteórica: destruye zona del 15% del tablero. |
| `champions/KitsuneChampion.ts` | Escudo Divino: protege piedras N turnos, escala por tablero. |
| `champions/RoninChampion.ts` | Pasiva Filo del Samurai: elimina 1 piedra enemiga cada 20 turnos. |
| `champions/HimikoChampion.ts` | Pasiva Lluvia Pétrea: N piedras aliadas en turno 20 personal. |
| `champions/RyujinChampion.ts` | Pasiva Furia del Dragón: calcinación al formar dobles ojos. |
| `champions/BossChampion.ts` | Gran Dragón Sabio Gris: Aliento Calcinante 25% de esquina. |
| `RoguelikeRunManager.ts` | Estado persistente del run: nodo actual, campeón, inventario, Komi permanente. |
| `RogueliteManager.ts` | Hechizos consumibles: castSpell, addSpell, getSpells, rewind, meteor. |
| `RoguelikeMapGenerator.ts` | Mapa roguelike procedural: tiers, tipos de nodo, rivales (Sabios, Monjes, Jefe). |
| `PolyominoManager.ts` | Fichas poliminó: Germinante, Dominó (rotación R), Monolito. |
| `AnalysisEngine.ts` | Análisis de posición para pista de mejor jugada (Ojo del Maestro). |
| `BossManager.ts` | Jefe Final: decide cuándo usar el Aliento Calcinante. |
| `DevModeManager.ts` | Modo desarrollador: undo libre, instant win, free map travel. |
| `GlobalSettings.ts` | FPS (30/60), partículas on/off. |
| `ECS.ts` | EntityManager para entidades capturables (cofres, monjes, pergaminos, espíritus). |

---

## Capa de IA (src/ai/)

| Archivo | Responsabilidad |
|---|---|
| `GoAI.worker.ts` | Web Worker del motor de IA. Mensajes: MOVE, SYNC, SYNC_UNDO. Arquitectura KataGo/KaTrain: Fuseki, Influencia/Moyo, Nakade, Minimax Alpha-Beta 3-ply. |

---

## Capa Gráfica (src/graphics/)

| Archivo | Responsabilidad |
|---|---|
| `SVGRenderer.ts` | **Renderizador principal**. Dibuja el tablero SVG. Gestiona clics en nodos, targeting de habilidades, isInteractive. |
| `SVGGhostPreview.ts` | Previsualización fantasma en hover: piedras, poliminós, halos, zona de meteoros. |
| `SVGDefs.ts` | Definiciones SVG reutilizables: filtros glow, gradientes, sombras. |
| `VFXManager.ts` | Fachada de efectos visuales. Delega a vfx/. |
| `vfx/AlchemistVFX.ts` | Animación de transmutación (pincel SVG animado). |
| `vfx/TenguVFX.ts` | Lluvia de meteoros con plasma y estelas. |
| `vfx/KitsuneVFX.ts` | Aura dorada + rotura de escudo. |
| `vfx/RoninVFX.ts` | Corte de viento. |
| `vfx/RyujinVFX.ts` | Llamarada ígnea + ceniza ascendente. |
| `vfx/HimikoVFX.ts` | Cometas celestiales de la lluvia pétrea. |
| `vfx/BossVFX.ts` | Aliento calcinante del Gran Dragón. |
| `BoardGenerators.ts` | Topologías: Cuadrado, Triangular, Hexagonal, Erosionado, Islas, Cruz, Procedural. |
| `RoguelikeMapRenderer.ts` | Renderiza el mapa visual del roguelike. |

---

## Capa UI (src/ui/)

| Archivo | Responsabilidad |
|---|---|
| `HUDController.ts` | **HUD in-game**: turno, capturas, komi, hechizos, standees, alertas, temporizadores. |
| `DuelistRenderer.ts` | Standees y tarjetas de duelistas (campeón vs rival), habilidades. |
| `ModalManager.ts` | Fachada de modales: puntuación, victoria, roguelike, selector de color (Alquimista 4P). |
| `modals/ScoreModalRenderer.ts` | Modal de puntuación final: territorio, capturas, Komi. |
| `modals/RogueModalRenderer.ts` | Modal de victoria roguelike: recompensas, cartas, banner del héroe. |
| `ScreenManager.ts` | Transiciones entre pantallas (menú → juego → mapa roguelike). |
| `StoryDialogueRenderer.ts` | Diálogos tipo novela visual del Modo Historia. |
| `ThemeManager.ts` | Cambio de tema claro/oscuro. |
| `UITemplateLoader.ts` | Carga síncrona de templates HTML. |

---

## Capa de Red (src/network/)

| Archivo | Responsabilidad |
|---|---|
| `NetworkManager.ts` | P2P WebRTC via Trystero (WebTorrent swarm). Signaling MQTT. Moves, passes, skills, undo, sync. |

---

## Estilos (src/styles/)

| Archivo | Qué contiene |
|---|---|
| `layout.css` | board-viewport, board-container, fondos de escenario. |
| `hud.css` | HUD inferior: hechizos, poliminós, standees, temporizadores. |
| `modals.css` | Modales: setup wizard, online, opciones, victoria. |
| `roguelike.css` | Mapa roguelike, pantallas de recompensa. |
| `vfx.css` | Animaciones VFX (meteoros, escudo, dragón, komi overlay). |
| `events.css` | Toast alerts, badges de turno. |
| `story.css` | Modo Historia y diálogos. |

---

## Otros

| Ruta | Responsabilidad |
|---|---|
| `src/audio/SoundFX.ts` | SFX: placeStone, capture, illegal, undo, special. Web Audio API. |
| `src/audio/BGMGenerator.ts` | BGM: bgm_zen.wav (menús) y bgm_battle.wav (combate). |
| `src/i18n/i18n.ts` | ES/EN. getLanguage() → 'es' o 'en'. |
| `src/types/index.ts` | Tipos globales: SpellId, PolyominoType, BoardSize, GameMode, TimerConfig. |
| `src/story/StoryController.ts` | Controlador del Modo Historia. |
| `src/story/StoryCampaign.ts` | Capítulos y escenarios del Modo Historia. |
| `src/tutorial/TutorialManager.ts` | Motor del Dojo (Tutorial): pasos, bloqueos, validación. |

---

## Flujo de una Jugada Normal (1vIA)

```
Clic usuario en SVG
  → SVGRenderer.handleNodeClick(nodeId, isLocal=true)
    → RulesEngine.tryPlaceStone() → board actualizado + state.advanceTurn()
    → ChampionManager.checkPassiveTriggers() [Ronin/Himiko/Ryūjin]
    → SVGRenderer.onMovePlaced → GameController.onNodeClicked
      → GameController.checkAITurn()
        → AITurnManager → GoAI Worker → getBestMove()
        → SVGRenderer.handleNodeClick(aiNodeId, isLocal=false)
```

## Flujo de Habilidad Activa del Alquimista

```
InteractionManager.toggleChampionActiveSkill()
  → alchemistUsedThisTurn=false check → alchemistInversionsRemaining = N
  → currentTargetingMode = 'convert_enemy'

Clic usuario en SVG (modo targeting activo)
  → ChampionManager.executeTargetedSkill()
    → AlchemistChampion.executeSkill()
      → stone.playerId = nuevoColor
      → resolveBoardCaptures()
      → if isFinished: state.passTurn() + alchemistUsedThisTurn = true
    → onComplete():
      → SVGRenderer.isInteractive = false [bloquea clics inmediatamente]
      → GameController.onNodeClicked() → checkAITurn()
      → if isTurnAllowedCallback(): isInteractive = true [reactiva en 1v1]
```
