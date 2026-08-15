# Contexto Activo (Active Context) — Crazy Go

> **Última Actualización:** 15 de Agosto de 2026 (Sesión 69)  
> **Estado General:** ✅ Totalmente Funcional, Compilado en TypeScript/Vite (0 errores), Navegación de Héroes 1 en 1 Corregida y Sincronizado en GitHub.

---

## 1. 📌 Visión y Estado Global del Proyecto
Crazy Go es un roguelite estratégico basado en **Go Canónico** con topologías procedurales asimétricas, 7 Campeones Místicos balanceados, entidades capturables en el Goban, temporizadores clásicos de Go, fichas poliminó tácticas, hechizos consumibles, multijugador online P2P WebRTC (Duelo Competitivo y Roguelike Cooperativo), **Modo Desarrollador vs Modo Jugador Normal** y **Sistema Integral de Idiomas (Español / English)** en tiempo real.

* **Fase Actual:** Fase 21 — Modo Desarrollador, Optimización de IA y Empaquetado itch.io.
* **Plataforma:** Web (Vite + TS) y Desktop Nativo Windows (`CrazyGo.exe`).

---

## 2. 🧙‍♂️ Campeones Místicos y Habilidades

El juego respeta la división estricta entre **Habilidades Activas** (con objetivo y cargas) y **Habilidades Pasivas** (desencadenadas por condiciones de Go o turnos):

| Campeón / Entidad | Tipo Habilidad | Nombre | Efecto y Condiciones |
| :--- | :--- | :--- | :--- |
| **Hombre Normal** | Ninguna | **Desafío Puro** | Personaje sin rostro ni habilidades. Ideal para puristas del Go que buscan ascensión táctica sin magias en modo Roguelike. |
| **Tengu** | Activa (1 carga) | **Lluvia Meteórica** | Destruye piedras no protegidas en área: **5** en $9\times9$, **9** en $13\times13$, **15** en $19\times19$. |
| **Himiko** | Pasiva | **Lluvia Pétrea Celestial** | Al **finalizar el Turno 15 personal**, caen piedras bendecidas en casillas aleatorias: **4** en $9\times9$, **6** en $13\times13$, **9** en $19\times19$. |
| **Kitsune** | Activa (2 a 4 cargas) | **Escudo Divino** | Consagra una piedra haciéndola **indestructible e inmune a capturas y poderes durante 2 turnos** (**2** cargas en $9\times9$, **3** en $13\times13$, **4** en $19\times19$). |
| **Ronin** | Pasiva | **Filo del Samurai** | Cada **25 turnos transcurridos**, desenvaina su katana mística y destruye automáticamente **1 piedra enemiga aleatoria** en el Goban. |
| **Alquimista** | Activa (1 carga) | **Inversión Cromática** | Transmuta el color de cualquier piedra (aliada o enemiga): **1** en $9\times9$, **2** en $13\times13$, **3** en $19\times19$ en el mismo turno. **Pasa el turno automáticamente** al finalizar las transmutaciones. |
| **Ryūjin** | Pasiva | **Furia del Dragón** | Calcina cualquier piedra (aliada o enemiga): **2** en $9\times9$ (al formar 2 ojos), **3** en $13\times13$ (al formar 3+ ojos o múltiples grupos vivos), y **+1 por cada ojo adicional** en $19\times19$ ($n-1$). |
| **Gran Dragón Sabio Gris (Jefe Final)** | Activa IA (2 cargas) | **Aliento Calcinante del Dragón** | Calcina una **esquina equivalente al 25% del tablero** destruyendo todas las piedras y colocando una piedra aliada en el centro del vacío. |

## Estado Actual del Desarrollo
- **Últimos Hitos Completados:**
  1. **Temporizadores de Go Configurables:** Soporte para modalidad Inactiva, Por Jugada / Byo-yomi (10s, 15s, 30s, 45s, 60s), Súbito / Absoluto (1m, 3m, 5m, 10m, 15m) y Fischer (3m+5s, 5m+5s, 10m+10s) en modo Roguelike, Local, Sandbox y Online. Relojes digitales en HUD y standees con alerta roja parpadeante en $\le 10$s.
  2. **Objetos y Rehenes Capturables en el Goban:** Generación de entidades neutrales (Cofres 🎁, Monjes Cautivos 🧙, Pergaminos Sagrados 📜, Espíritus Guardián ✨) que se capturan al retirarles todas sus libertades cardinales con piedras.
  3. **Reestructuración de Campeones (Alquimista y Ronin):**
     - **Ronin:** Nueva pasiva *Filo del Samurai* que corta 1 piedra enemiga cada 25 turnos.
     - **Alquimista (⚗️):** Nuevo campeón con arte original anime remasterizado (primer plano `alchemist_face.jpg` y cuerpo entero vertical estilizado `alchemist.png` con canal alfa puro y proporciones canónicas). Ejecuta la habilidad activa *Inversión Cromática* (transmuta 1 piedra en 9x9, 2 en 13x13 y 3 en 19x19) con VFX alquímico y paso de turno automático al finalizar. Disponible en Roguelike, Local, Sandbox y Online.
  4. **Modo Roguelike Cooperativo Online (2P Co-op P2P WebRTC):** Ambos jugadores comparten la expedición y el bando Negras ⚫ alternando turnos secuencialmente contra la IA.
  5. **Unificación de Victoria Roguelike y Tienda Gratuita:** Pantalla de victoria con arte translúcido grande, botón flotante de retorno e inventario sin Magatamas (4 opciones, elegir 2).
  6. **Unificación del Héroe Canónico:** Eliminada la opción redundante "Clásico / Sin Campeón" del selector local, unificando todo el juego canónico bajo **Hombre Normal** (👤).
  7. **Gestión de Campeones y Héroes Místicos (7 Héroes + Jefe Dragón):**
     - **Corrección de Persistencia en Expediciones Roguelike:** Corregido el paso de parámetros en [`RoguelikeController.ts`](file:///c:/Users/VICTOR/Desktop/crazy_go/src/controllers/RoguelikeController.ts#L157) (`startBattle`), inyectando explícitamente `heroId: RoguelikeRunManager.selectedHero`. Esto garantiza que al seleccionar el **Alquimista** (o cualquier otro campeón) en la pantalla de expedición, se cargue de inmediato su standee, su habilidad activa (*Inversión Cromática*) y sus pasivas sin caer nunca al *Hombre Normal*.
     - **Regeneración de Sprites de Rivales (Monjes y Sabios con Transparencia Pura):** Generados nuevos personajes monjes (`monk_1..5.png`) y maestros sabios (`sage_1..5.png`) sobre fondos `#FFFFFF` sólidos planos puros, procesados mediante un algoritmo de inundación (*flood-fill*) perimetral con suavizado anti-aliasing de bordes, eliminando halos residuales y artefactos rectangulares en los standees.
  8. **Motor de Tutorial Interactivo (Dojo Completo con 9 Capítulos, Selector Minimalista, Conteo Visual de Libertades y Modal de Progreso):** 
     - **Flujo y Turnos:** Turno bloqueado continuamente en Negras (`state.currentPlayer = 1`) y `isLocalPlayerTurn() === true` permanente en tutoriales para evitar cualquier bloqueo tras colocar piedras.
     - **Cinta Superior Minimalista ("Menú"):** Durante las lecciones del dojo se activa `#game-topbar.tutorial-active`, ocultando todos los botones de deshacer/rehacer, reset, píldoras centrales de turnos/capturas, modo pruebas, pasar turno y tema; dejando visible única y exclusivamente el botón **"🏠 Menú"** para salir al menú principal.
     - **Lección 7 Interactiva (Lluvia Meteórica de Tengu):** Tablero con un bastión defensivo de 9 piedras blancas en bloque 3x3 (`x=5..7, y=3..5`); el tutorial guía al jugador a pulsar **`C`** (o el botón lateral de Tengu) y apuntar al nodo central `6,4` para invocar la lluvia de meteoros, destruyendo la formación rival de forma espectacular.
     - **Lección 8 Precisa (Geometría 1 [ ] [ ] 1 1 con Dominó):** Configuración de piedras negras en `2,4` y `5,4`, `6,4` separadas exactamente por 2 casillas vacías (`3,4` y `4,4`); el jugador selecciona la ficha Dominó 2x1 y la coloca en `3,4` para conectar ambos grupos en un puente unificado.
     - **Botón Dominó Compacto en Dock:** En la barra inferior, la etiqueta del botón Dominó se mantiene limpia como `2x1`, mostrando las flechas de orientación y la indicación `[R]` únicamente cuando el jugador selecciona activamente dicha ficha.
     - **Optimización de Espacio en Bocadillos:** Eliminado el icono/avatar del kimono para maximizar la visibilidad del Goban; diseño ultra-compacto centrado en la parte superior (`top: 1.2%`, padding reducido y tipografía optimizada) que no cubre las piedras ni las primeras filas del tablero.
     - **Botón "Entendido ➔" Desacoplado con Fondo Negro:** El botón de avance se aloja fuera de la caja de texto en su propio contenedor independiente (`.tutorial-btn-container`), con fondo negro pizarra pulido (`linear-gradient(135deg, #1e293b, #090d16)`), borde nítido y texto blanco de alto contraste, evitando que la caja de diálogo se expanda innecesariamente hacia abajo.
     - **Integración del Menú Inferior de Fichas Especiales y Hechizos:** En los capítulos tácticos (Capítulos 7, 8 y 9), el dock inferior (`#game-spellbar`) permanece activo con inventario interactivo de fichas poliminó (🌿 Germinante 1x1, 🀄 Dominó 2x1 rotatorio, 🧱 Monolito 2x2) y hechizos (`#magic-spells-section`), permitiendo al usuario seleccionarlas desde el menú o mediante atajos (`5..7` / `Z,X,V`) y validando su colocación guiada sobre el Goban.
     - **Rediseño Exhaustivo de la Lección 6 (Territorio y Reglas Japonesas):** Desglose completo en 7 micro-pasos guiados: 1. Analogía de cercar terreno como una valla, 2. Valor de 1 punto por intersección interior, 3. Detección de la brecha/fisura en la frontera, 4. Jugada en 2,2 para sellado hermético, 5. Conteo de los 4 puntos conquistados en verde, 6. Explicación de prisioneros (+1 cada uno) y compensación de Komi (+6.5 para Blancas), 7. Fórmula canónica final de victoria ($\text{Territorio} + \text{Prisioneros} + \text{Komi}$).
     - **Anotaciones Visuales y Conteo Numérico de Libertades en Vivo:** Cada paso explicativo del dojo proyecta insignias nítidas con números o glifos únicos (`dominant-baseline: central`, animación `badgePop` con resorte elástico anclado en el centro del nodo sin emojis compuestos ni desbordes) para ilustrar las libertades individuales `1..4`, compartidas `1..7`, Atari `1`, dos ojos `1` y `2`, suicidio `🚫` y territorio `1..4`.
     - **Rigor Canónico en Lección 3 (Grupos Vivos y Dos Ojos):** Tablero con asedio exterior completo de piedras blancas y cavidad de 3 en línea en el interior. Colocar la piedra en el punto vital central divide el espacio en dos ojos independientes demostrando de forma didáctica por qué el rival nunca puede invadir (suicidio ilegal) y por qué el grupo es matemáticamente inmortal.
     - **Cuadro Explicativo Final con 'Entendido ➔':** Cada capítulo culmina con un mensaje pedagógico del Sensei y botón "Entendido ➔". El modal de felicitación y avance (`#modal-tutorial-complete`) solo aparece cuando el jugador presiona dicho "Entendido", libre de citas ficticias.
  9. **Navegación Fluida y Atajos de Teclado Universales:** Soporte robusto para selección de hechizos e ítems in-game con teclas `1`-`4` y poliminós con `Z`/`X`/`V` (o `5`/`6`/`7`); selección de cartas/recompensas en modales de victoria (`#score-modal`) y expedición roguelike (`#rogue-reward-modal`) con teclas `1`-`4`, `A`/`D` y flechas; y selección directa de campeones `1`-`7` y flechas/`A`/`D` en el Asistente Wizard local, Pantalla de Expedición Roguelike (`#roguelike-setup-modal`, con `W`/`S` para dificultad) y Multijugador Online Host/Guest.
  10. **Sincronización P2P Completa de Campeones en Modo Online:** Tanto el jugador de Negras como el de Blancas pueden utilizar sus habilidades activas y pasivas con sincronización en tiempo real vía WebRTC (`SKILL_USE`), asignación correcta de `targetingPlayerId` y visualización dinámica de los retratos y standees de ambos jugadores en el HUD.
  11. **Arquitectura Modular de Estilos CSS y Desacoplamiento de Teclado:**
     - **Modularización de `style.css` (de 5,391 líneas a 14 líneas de importación):** Desglose completo en 13 submódulos temáticos en `src/styles/` (`variables.css`, `theme.css`, `base.css`, `layout.css`, `board.css`, `champions.css`, `hud.css`, `polyominos.css`, `vfx.css`, `sandbox.css`, `tutorial.css`) y subcarpetas `modals/` (`base.css`, `online.css`, `setup.css`, `options.css`, `score.css`) y `roguelike/` (`carousel.css`, `map.css`, `events.css`, `relics_deck.css`), garantizando que ningún archivo CSS supere las 500 líneas.
     - **Extracción de `KeyboardController.ts`:** Toda la lógica de atajos globales y navegación de teclado (720 líneas) se aisló en su propio módulo, reduciendo la complejidad y tamaño de `AppEventBinder.ts`.
  13. **Corrección de Habilidad en Tutorial 7 y Asentamiento de Standees (-100px):**
     - **Avance de Lección 7 tras Habilidad:** Inyección de `TutorialManager.advanceStep()` al finalizar la Lluvia Meteórica de Tengu y asignación adecuada del perfil e interfaz de Tengu en el panel izquierdo (con 1 carga activa disponible).
     - **Asentamiento en Tatami (-100px):** Las figuras de Aprendiz de Go / Hombre Normal (`.hero-normal-img`) y todos los enemigos (`.duel-standee-enemy img`) descienden exactamente 100px (`translateY(100px)`) para asentarse de forma natural y realista sobre el suelo de tatami.
  14. **Corrección de Avance en Tutorial 8 (Fichas Poliminó y Dominó):**
     - **Resolución de Bloqueo Post-Colocación:** Desacoplado el avance de paso en `placePolyomino` eliminando la re-validación de selección activa una vez colocada la pieza en el Goban, permitiendo que la Lección 8 avance inmediatamente tras colocar el Dominó en `3,4`.
  15. **Protección Anti-Spam y Bloqueo de Saltos en el Tutorial:**
     - **Bandera Anti-Rebote `isAdvancing`:** Desactivación inmediata del botón "Entendido ➔" (`disabled = true`) y control de estado durante las transiciones asíncronas para evitar que pulsaciones o clics ultra-rápidos puedan saltar pasos interactivos donde el usuario debe colocar piedras o usar habilidades.
  16. **Rediseño Integral de la Lección 8 (Hechizos y Fichas Poliminó - Duplicidad):**
     - **Renombrado a Ficha Duplicidad:** Dominó 2x1 pasa a llamarse oficialmente **Duplicidad 2x1 (🀄)** en UI, menús, dock, recompensas roguelike y dojo.
     - **Secuencia Guiada Obligatoria en 10 Pasos:**
       1. Presentación del dock de magia y poliminós.
       2. **Meteorito (☄️)**: Destruye la piedra blanca invasora en `4,4`.
       3. Explicación del impacto sin consumir turno estándar.
       4. **Error Táctico**: Colocación deliberada de piedra en `7,2`.
       5. **Rebobinar (⏳)**: Retroceso temporal para recuperar la posición.
       6. Presentación de las 3 fichas poliminó.
       7. **Germinante 1x1 (🌿)**: Plantación en `2,2` (brota cada 2 turnos).
       8. **Duplicidad 2x1 (🀄)**: Puente unificador en `3,6` para conectar `1 [ ] [ ] 1 1` con rotación `[R]`.
       9. **Monolito 2x2 (🧱)**: Despliegue del bloque colosal de 4 piedras en `6,1`.
       10. Conclusión y maestría del arsenal místico.
  17. **Modo Historia: Crónicas del Goban (Novela Visual y 5x5 Solo):**
     - Orquestador de campaña en `StoryController.ts` y listado de misiones en `StoryCampaign.ts`.
     - Soporte para tableros 5x5 con espaciado de 56px y punto hoshi central en `BoardGenerators.ts`.
     - Bloqueo estricto de intersecciones con entidades en `RulesEngine.tryPlaceStone` y `SVGGhostPreview` (no se puede colocar una piedra directamente encima de una reliquia/espíritu no capturado).
     - Detección universal de 0 libertades en `RulesEngine.resolveCaptiveCaptures` para activar el sellado y disparo del evento narrativo.
     - Nuevo overlay tipo Novela Visual en `StoryDialogueRenderer.ts` y `story.css`.
     - Integración con motor de captura de entidades (`RulesEngine.resolveCaptiveCaptures`).
  18. **Sistema de Fondos Temáticos Dinámicos y Escenarios:**
     - Generadas 7 ilustraciones panorámicas en composición de encuadre lateral (detalles ricos a izquierda y derecha, centro limpio y despejado para el goban y tatami):
       1. **Modo Historia:** *Vacío Astral y Santuarios Flotantes* (`bg_story.jpg`).
       2. **Modo Tutorial:** *Dojo Zen con Shoji y Cerezos en Flor* (`bg_tutorial.jpg`).
       3. **Jefe Roguelike:** *Guarida de Dragones y Relámpagos Volcánicos* (`bg_boss.jpg`).
       4. **Pradera Esmeralda (Verde Exterior):** *Bambúes y Campos de Flores con Torii* (`bg_meadow.jpg`).
       5. **Picos al Atardecer:** *Acantilados Dorados y Pagoda* (`bg_sunset.jpg`).
       6. **Lago Nocturno:** *Bosque Encantado y Fuego Fatuo* (`bg_night.jpg`).
       7. **Dojo Tradicional:** *Arena Clásica de Madera* (`bg_combat.jpg`).
     - Selector de Escenarios integrado en el **Paso 3 del Wizard de Partida Local / 1vIA** (`index.html`, `ModalManager.ts`, `AppEventBinder.ts`).
     - Transición suave entre fondos en `#board-viewport[data-bg]` (`layout.css`).
  19. **Control de Versiones y Sincronización en GitHub:**
     - Repositorio Git inicializado en rama `main` con `.gitignore` optimizado.
     - Código fuente y documentación AI Wiki completamente sincronizados con [Victologo/crazy_go](https://github.com/Victologo/crazy_go).
- **Roster de Personajes:** Hombre Normal (👤), Tengu (🦅), Himiko (✨), Kitsune (🦊), Ronin (⚡), Alquimista (⚗️), Ryūjin (🐲).


---

## 3. ♟️ Motor de Reglas de Go y Conteo de Territorio

- **Regla Canónica de Ko:** Detección determinista que prohíbe repetir la posición del tablero inmediatamente anterior ($S_t = S_{t-2}$).
- **Suicidio Prohibido:** No se permite colocar piedras sin libertades a menos que la jugada capture inmediatamente piedras enemigas.
- **Detección Matemática de Ojo Verdadero y Grupo Vivo (`GraphBoard.isTrueEye`):**
  - **Condición Ortogonal:** 100% de vecinos cardinales deben pertenecer al mismo grupo aliado.
  - **Control Diagonal contra Ojos Falsos (False Eyes):** $\ge 3/4$ diagonales controladas en el centro, y $100\%$ en bordes y esquinas. Evita falsos positivos en formas abiertas con fisuras.
- **Captura tras Transmutación (`RulesEngine.resolveBoardCaptures`):** Cualquier cambio de color (Ronin, Inversión Yin-Yang) evalúa y retira al instante las piedras enemigas que se queden con 0 libertades.
- **Captura de Entidades:** El motor detecta cuando objetos neutrales (cofres, monjes) se quedan con 0 libertades vacías y los marca como capturados para entregar recompensas o avanzar historia.
* **Conteo Territorial Robusto (`TerritoryScorer.ts`):**
  * **Sistema de Umbral del 74%:** Si un jugador controla $\ge 74\%$ de la frontera de una región vacía, se adjudica íntegramente el territorio, neutralizando invasiones de piedras muertas.
  * **Komi y Prisioneros:** Desglose visual exacto de territorio, capturas y Komi ($6.5$ pts en 2P, $0.5$ pts en 4P).

---

## 4. 🤖 Inteligencia Artificial Estratégica (`GoAI.ts`)

* **Niveles Calibrados:**
  * **Principiante (~26 Kyu):** Tasa de fallos reducida ($28\%$), defensa activa de ataris y valoración básica de formas.
  * **Intermedio (~15 Kyu):** Apertura canónica Fuseki, cortes tácticos, esquinas territoriales (3-3, 3-4, 4-4) y formas sólidas (*Kosumi, Ikken-Tobi, Boca de Tigre*).
  * **Maestro Dan (~3 Dan - KataGo Heurístico):** Búsqueda profunda de lectura táctica, presión sobre grupos débiles y optimización milimétrica del territorio.
* **Independencia en 4 Jugadores (FFA):** Cada IA evalúa independientemente a los 3 rivales, evitando alianzas ficticias y adoptando estilos estratégicos propios (Estratega Clásico, Chamán Cósmico y Guerrero Agresivo).
* **Pase Proactivo:** La IA jamás juega piedras suicidas en territorio cerrado rival; cuando no existen ganancias territoriales netas o tras el pase del rival, pasa su turno inmediatamente para concluir la partida.

---

## 5. 🎒 Sistema Roguelite de Expedición (`RoguelikeRunManager.ts`)

* **Inventario Persistente:** Al iniciar una run se comienza estrictamente con **2 Hechizos de Rebobinar** (`rewind: 2`). El gasto de hechizos y poliminós persiste entre combates y nodos guardándose en `localStorage`.
* **Grafo DAG de Nodos:** 6 Tiers de progresión con combates normales, guardianes élite, santuarios sagrados, zonas de meditación, mercader de magatamas y jefe final.
* **Consumibles Disponibles:**
  * **Pergaminos Místicos:** Rebobinar ⏳, Meteorito ☄️, Escudo Sagrado 🛡️, Inversión Yin-Yang ☯️.
  * **Fichas Poliminó Tácticas:** Germinante 🌿 (1x1 que brota), Dominó 🀄 (2x1 con rotación `[R]`), Monolito 🧱 (2x2 titán).

---

## 6. 🎮 Interfaz, Controles y Navegación Universal

* **Asistente Wizard Dinámico (Modo Libre):** 5 pasos interactivos con auto-avance (1. Jugadores $\to$ 2. Modo $\to$ 3. Tablero $\to$ 4. Campeón $\to$ 5. Resumen & Inicio).
* **Navegación Universal con Teclado (`AppEventBinder.ts`):**
  * **Recompensas & Mazo:** `← / →` (`A / D`) o `1..3` para elegir cartas; `Enter / Espacio` para reclamar.
  * **Eventos & Tiendas:** `↑ / ↓` (`W / S`) o `1..9` para seleccionar opciones; `Enter` para confirmar.
  * **Selección de Héroes:** `← / →` (`A / D`) o `1..5` para rotar campeones; `↑ / ↓` (`W / S`) para dificultad; `Enter` para comenzar.
  * **En Combate:** `1..4` Hechizos, `Z, X, V` Poliminós, `R` Rotación, `C / E` Habilidad de Campeón, `P / Espacio` Pasar turno, `U / Ctrl+Z` Deshacer.
* **Standees Dinámicos 4P / 1v1:** Silueta del jugador ampliada (+20%) en la izquierda y panel de contrincantes a la derecha (con seguimiento de IA pensante o pase y juego local).

---

## 7. 📁 Mapeo de Arquitectura y Módulos Clave

```text
src/
├── core/                  # Dominio puro y reglas canónicas
│   ├── champions/         # Módulos especializados e independientes por campeón
│   │   ├── types.ts       # Interfaces de habilidades activas, pasivas y targeting
│   │   ├── TenguChampion.ts   # Lluvia Meteórica (cálculos de zona 15% e impactos)
│   │   ├── HimikoChampion.ts  # Lluvia Pétrea Celestial (Fisher-Yates en turno 15)
│   │   ├── KitsuneChampion.ts # Escudo Divino (cargas escaladas e inmunidad 2 turnos)
│   │   ├── RoninChampion.ts   # Inversión Cromática (inversión multi-piedra y pase)
│   │   ├── RyujinChampion.ts  # Furia del Dragón (calcinación universal y dobles ojos)
│   │   ├── NormalChampion.ts  # Hombre Normal (desafío puro sin magias)
│   │   └── BossChampion.ts    # Gran Dragón Sabio Gris (calcinación 25%)
│   ├── ChampionManager.ts # Fachada unificada que delega en los módulos de campeones
│   ├── GraphBoard.ts      # Grafo de topología, libertades, cadenas y detector de doble ojo
│   ├── RulesEngine.ts     # Colocación, Ko simple, capturas multi-piedra y resolveBoardCaptures
│   ├── GameState.ts       # Estado de partida, historial y recuento de turnos/prisioneros
│   ├── TerritoryScorer.ts # Algoritmo BFS de conteo territorial con umbral del 74%
│   ├── PolyominoManager.ts# Fichas Germinante, Dominó y Monolito
│   ├── RogueliteManager.ts# Gestión de baraja de 4 hechizos místicos
│   ├── RoguelikeRunManager.ts # Estado global de la run, inventario persistente y héroes
│   └── GoAI.ts            # Inteligencia artificial calibrada (Principiante, Intermedio, Maestro)
├── graphics/              # Renderizado SVG y efectos visuales
│   ├── vfx/               # Animaciones VFX desacopladas por campeón
│   │   ├── TenguVFX.ts    # Cometas meteóricos de plasma y ondas de choque
│   │   ├── HimikoVFX.ts   # Cometas celestiales astrales y emergencia de piedra
│   │   ├── KitsuneVFX.ts  # Teletransporte espiritual y polvo púrpura
│   │   ├── RoninVFX.ts    # Tajo de viento cortante (Wind Slash)
│   │   ├── RyujinVFX.ts   # Aliento de fuego y ceniza flotante disolviéndose en 1.0s
│   │   └── BossVFX.ts     # Calcinación y vórtice del Gran Dragón Sabio Gris
│   ├── VFXManager.ts      # Fachada central de VFX
│   ├── SVGRenderer.ts     # Tablero, intersecciones, piedras, auras y badges
│   └── SVGGhostPreview.ts # Previsualización interactiva de hover para piedras y habilidades
├── controllers/           # Orquestación de bucles de juego
│   ├── GameController.ts  # Partida local, turnos, pases y fin de juego
│   ├── RoguelikeController.ts # Nodos de expedición, recompensas y mercader
│   └── SandboxController.ts   # Modo laboratorio, pinceles libres y troubleshooter
├── story/                 # Modo Historia (Misiones narrativas y diálogos)
│   ├── StoryCampaign.ts   # Estructura de misiones y niveles
│   └── StoryController.ts # Lógica de flujo del modo historia y desencadenamiento de eventos
├── ui/                    # Presentación visual y componentes
│   ├── HUDController.ts   # Barra superior, capturas con Komi dinámico y hechizos
│   ├── ModalManager.ts    # Fachada unificada de modales
│   ├── StoryDialogueRenderer.ts # Renderizado de novela visual del modo historia
│   └── modals/            # ScoreModalRenderer y RogueModalRenderer
└── events/                # Controladores de interacción
    ├── AppEventBinder.ts  # Eventos del DOM, Wizard y navegación global por teclado
    └── KeyboardController.ts # Atajos directos in-game
```

---

## 8. 📚 Enlaces a Documentación del Proyecto

* **Roadmap de Tareas:** [`docs/ai_wiki/task.md`](file:///c:/Users/VICTOR/Desktop/crazy_go/docs/ai_wiki/task.md)
* **Diario de Desarrollo Reciente (Sesiones 31–62):** [`docs/ai_wiki/log_crazy_go.md`](file:///c:/Users/VICTOR/Desktop/crazy_go/docs/ai_wiki/log_crazy_go.md)
* **Archivo Histórico de Sesiones (Sesiones 19–30):** [`docs/ai_wiki/log_archive_sesiones_19_30.md`](file:///c:/Users/VICTOR/Desktop/crazy_go/docs/ai_wiki/log_archive_sesiones_19_30.md)
* **Reglas Canónicas de Go:** [`docs/ai_wiki/go_rules.md`](file:///c:/Users/VICTOR/Desktop/crazy_go/docs/ai_wiki/go_rules.md)
* **Reglas Especiales de Crazy Go:** [`docs/ai_wiki/game_design/rules.md`](file:///c:/Users/VICTOR/Desktop/crazy_go/docs/ai_wiki/game_design/rules.md)
