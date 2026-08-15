# Log Crazy Go - Diario de Desarrollo

Este registro cronológico documenta los avances diarios en el desarrollo del juego. (Orden: Más reciente arriba).

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
4. **Rediseño Panorámico Sin Cajas Sobre-anidadas & Tipografía Mejorada (+5% a +15%):**
   - Eliminados los elementos `.rogue-counter-badge` (`1 / 5`) y `.hero-portrait-badge` sobre el retrato de héroe.
   - Eliminado el contenedor interior `.hero-showcase-card`, integrando el retrato y descripción directamente sobre el panel modal sin cajas sobre-anidadas.
   - Aumento general de las fuentes pequeñas un 5-15% (`.diff-sub` a 0.78rem, `.modal-desc` a 0.94rem, `.hero-subtitle` a 0.94rem, `.hero-quote` a 0.90rem, `.skill-desc` a 0.88rem, `.hero-thumb-btn` a 0.90rem).
5. **Calibración Estratégica del Motor de IA (`GoAI.ts` - Fácil y Medio):**
   - Resuelto el problema de "arrastre ciego / serpiente" donde la IA fácil/medio solo jugaba piedras pegadas a las anteriores.
   - Implementadas formas canónicas de Go: **Kosumi** (diagonal), **Ikken-Tobi** (salto de 1 espacio), **Keima** (paso de caballo) y **Boca de Tigre** (Kake-tsugi).
   - Valoración de esquinas territoriales y lados en 3ª y 4ª línea, evitando el contacto innecesario en áreas abiertas.
6. **Validación:**
   - `npm run build` completado en 466ms (0 errores), servidor Vite dev activo y verificado en `http://localhost:5173/`.

---

## 🗄️ Archivo Histórico de Sesiones Anteriores
Las sesiones 19 a 30 han sido factorizadas y archivadas para optimizar el rendimiento y la legibilidad.
👉 **Consulta el histórico completo en:** [`log_archive_sesiones_19_30.md`](file:///c:/Users/VICTOR/Desktop/crazy_go/docs/ai_wiki/log_archive_sesiones_19_30.md).
