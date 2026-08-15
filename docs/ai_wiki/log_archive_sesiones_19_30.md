# Log Crazy Go - Archivo Histórico (Sesiones 19 a 30)

Este documento almacena el histórico de las sesiones iniciales de desarrollo del proyecto Crazy Go. Para las sesiones recientes (31 en adelante), consulta [`log_crazy_go.md`](file:///c:/Users/VICTOR/Desktop/crazy_go/docs/ai_wiki/log_crazy_go.md).

---

## 14 de Agosto de 2026 - Día 1 (Sesión 30): Modo Online para 4 Jugadores (Go Cuádruple en Red P2P WebRTC y Topología en Estrella)

**Resumen del hito:**
1. **Ampliación del Motor de Red a 4 Jugadores (`NetworkManager.ts`):**
   - Implementado soporte para salas multijugador de 2 y 4 jugadores (`playerCount: 2 | 4`).
   - Topología en Estrella (Star Network Topology): el host centraliza las conexiones de hasta 3 clientes y retransmite deterministamente todos los movimientos (`MOVE`), pases (`PASS`) y final de partida (`SCORE`).
   - Asignación automática y sincronización de colores: P1 Negras ⚫ (Anfitrión), P2 Blancas ⚪, P3 Esmeralda 🟢, P4 Amatista 🟣.
2. **Lobby Interactivo con Slots Dinámicos (`index.html`, `ModalManager.ts`, `style.css`):**
   - Selector de 2 Jugadores (Duelo) vs 4 Jugadores (Go Cuádruple FFA) en la configuración de la sala.
   - Visualización de tarjetas de slot (`.online-slot-card`) que indican en tiempo real qué jugadores están conectados y cuáles están en espera.
   - Botón de inicio rápido para el anfitrión si desea arrancar la partida antes de que se llene la sala.
3. **Optimización del Entorno de Desarrollo (`vite.config.ts`):**
   - Configuración de exclusión en el observador de Vite (`ignored: ['**/CrazyGo_Portable/**', '**/dist/**']`) para evitar errores `EBUSY` durante los empaquetados de producción en Windows.
4. **Validación:**
   - `npm run build` completado con éxito en 356ms (0 errores), `CrazyGo.exe` y `CrazyGo_Portable.zip` generados.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 29): Ajuste Ergonómico del Tablero & Estandarización Panorámica Abierta en Todos los Modos

**Resumen del hito:**
1. **Ajuste Espacial y Altura del Tablero de Combate:**
   - Redimensionado `#board-container` a `max-width/max-height: min(calc(100vh - 180px), clamp(320px, 44vw, 610px))` con padding ajustado de 0.85rem y margen inferior de 0.35rem.
   - Desplazamiento zenital ascendente que garantiza que el borde inferior del goban nunca colisione con el dock de hechizos o quede recortado.
   - Figuras de los duelistas armonizadas a `height: clamp(300px, 44vh, 470px)`.
2. **Estandarización del Diseño Panorámico Abierto en Todos los Modos:**
   - Todos los modales convertidos al formato expansivo de cristal translúcido oscuro (`rgba(15, 20, 32, 0.96)`) con bordes sutiles dorados y eliminación de cajas oscuras sobre-anidadas:
     - Modo Libre / Local (`.modal-setup` 960px).
     - Modo Online (`.modal-online` 920px).
     - Opciones (`.modal-options` 860px).
     - Mazo y Reliquias (`.modal-deck` 920px).
3. **Validación:**
   - Compilación con `npm run build` en 435ms (0 errores), servidor Vite dev activo en `http://localhost:5173/` y empaquetado portable actualizado.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 28): Modo Sandbox, Laboratorio de Pruebas & Troubleshooter en Vivo (Editor de Tableros, Pincel Libre, Modificador de Topología y Simulador de Reglas)

**Resumen del hito:**
1. **Controlador Central de Laboratorio (`SandboxController.ts`):**
   - Implementado sistema de pinceles de colocación instantánea: piedras ⚫ Negras (P1), ⚪ Blancas (P2), 🟢 Esmeralda (P3), 🟣 Amatista (P4), 🛡️ Piedra Sagrada, 🌿 Germinante, 🀄 Dominó, 🧱 Monolito, 🪨 Terreno Destruido y 🧹 Borrador instantáneo.
   - Herramienta para vaciar todo el tablero (`Limpiar Todo el Tablero`).
   - Modificador en caliente de topología y tamaño (Cuadrado, Erosionado, Islas, Cruz, Triangular, Hexagonal / 9x9, 13x13, 19x19).
   - Generador de recursos ilimitados (99 cargas de Hechizos, Poliminós y Habilidad de Campeón).
   - Selector en caliente de Campeón y forzador de turnos personales (P1-P4).
2. **Escenarios de Prueba Predefinidos de 1-Clic (Troubleshooter):**
   - `ko_test`: Escenario canónico para probar la captura y bloqueo inmediato de la Regla de Ko.
   - `atari_chain`: Cadena de 4 piedras en atari para verificar capturas masivas.
   - `sacred_test`: Piedra dorada con 0 libertades para verificar inmunidad divina.
   - `two_eyes_alive`: Grupo con 2 ojos incondicionales para verificar el algoritmo de conteo japonés.
   - `islands_sprout`: Tablero de islas con brotación botánica en puentes estrechos.
3. **Acceso Dual al Laboratorio:**
   - Botón `🧪 Modo Pruebas / Sandbox` en el Menú Principal y botón `🧪 Pruebas` en la barra superior in-game (`game-topbar`).
4. **Validación:**
   - Compilación TypeScript / Vite (`npm run build`) en 398ms con 0 errores y actualización de `CrazyGo.exe` y `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 27): Retratos en Primer Plano de los 5 Campeones & Menú Roguelike Panorámico Expansivo

**Resumen del hito:**
1. **Retratos en Primer Plano de Alta Definición (`public/heroes/*_face.jpg`):**
   - Creados recortes dedicados centrados en las caras y expresiones faciales de los 5 Campeones: `tengu_face.jpg`, `himiko_face.jpg`, `kitsune_face.jpg`, `ronin_face.jpg` y `ryujin_face.jpg`.
   - Integrados en el showcase central y en la tira de miniaturas inferior (`.hero-thumb-btn img`).
2. **Rediseño Panorámico Abierto del Menú Roguelike (`.modal-rogue-panoramic`):**
   - Marco de 980px (`width: min(94vw, 980px)`) con estética de cristal translúcido oscuro (`rgba(15, 20, 32, 0.95)`), halo dorado y eliminación de contenedores oscuros dobles sobre-anidados.
   - Showcase horizontal de 190x190px con marco de oro, tipografía fluida y tarjetas de habilidad activas/pasivas claras.
   - Contador de campeones sincronizado a 5 (`1 / 5`).
3. **Validación:**
   - Compilación con `npm run build` en 291ms (0 errores) y empaquetado `.exe` completado.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 26): Regla Canónica de Ko Estricto, Selector de Campeones en Modo Local y Corrección de CrazyGo.exe

**Resumen del hito:**
1. **Regla Canónica del Ko Simple (`RulesEngine.ts`, `SVGRenderer.ts`):**
   - Prohibición estricta de reproducir de inmediato la posición idéntica del tablero previa al turno anterior ($S_t = S_{t-2}$).
   - Restauración automática de capturas provisionales, sonido de jugada ilegal y toast explicativo: *"🚫 ¡Regla de Ko! No puedes repetir la misma posición inmediatamente. Juega en otra zona."*.
2. **Selección de Campeones en Modo Local (`#new-game-modal`, `ModalManager.ts`, `GameController.ts`):**
   - Selector en el modal de partida local permitiendo elegir entre *"⚪ Sin Campeón (Reglas Puras)"* o cualquiera de los 5 Campeones Místicos (Ronin, Tengu, Himiko, Kitsune, Ryūjin) tanto para 1v1 como para 1vIA con standees 300% más grandes en combate.
3. **Corrección de `CrazyGo.exe` y Empaquetador Portable:**
   - Solucionado el fallo `ERR_CONNECTION_REFUSED` mediante perfiles de aplicación aislados `--user-data-dir` en `scripts/Launcher.cs`.
   - Servidor HTTP embebido persistente durante toda la sesión de juego como aplicación de escritorio nativa independiente.
4. **Validación:**
   - Compilación con `npm run build` y `csc.exe` generando `CrazyGo.exe` y `CrazyGo_Portable.zip`.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 25): Duelistas en Combate 300% Más Grandes & Perspectiva Cenital Zen

**Resumen del hito:**
1. **Limpieza y Transparencia de Standees:**
   - Eliminados artefactos y restos de fondo blanco entre las manos y la katana del Ronin y rivales.
2. **Perspectiva Cenital y Encuadre Sereno:**
   - Ronin rediseñado en pose serena y tranquila con la katana en reposo, escalado un 300% en combate con perspectiva superior zen sobre el tatami y sombras realistas.
3. **Validación:**
   - Compilación limpia con 0 errores.

---

## 14 de Agosto de 2026 - Día 1 (Sesión 24): Tableros Asimétricos y Erosionados & Fichas Poliminó Tácticas

**Resumen del hito:**
1. **Generador de Tableros Asimétricos (`BoardGenerators.ts`):**
   - Formas disponibles: 🪨 Erosionado (Carved Goban), 🕳️ Islas / Abismos interiores, ➕ Cruz / Diamante, 🔺 Triangular y ⬡ Hexagonal.
2. **Fichas Poliminó Tácticas (`PolyominoManager.ts`, `RulesEngine.ts`):**
   - 🌿 **Germinante (1x1):** Brota automáticamente una piedra aliada cada 2 turnos personales.
   - 🀄 **Dominó (2x1):** Bloque de 2 piedras unidas indisolublemente con rotación en tiempo real [Tecla R / Horiz ⇄ Vert].
   - 🧱 **Monolito (2x2):** Bloque titán de 4 piedras unidas simultáneamente.
   - Resolución de capturas multi-piedra en `RulesEngine.tryPlaceMultiStones`.
3. **Renderizado de Fantasmas Poliminó en Vivo:**
   - Renderizado dinámico de auras botánicas `🌿` y previsualización exacta de la orientación de los poliminós en `SVGRenderer.ts`.
4. **Validación:**
   - Compilación con `npx tsc --noEmit` y `npm run build` (0 errores).

---

## 14 de Agosto de 2026 - Día 1 (Sesión 23): Roster Completo de 5 Campeones Místicos, Standees Grandes y Piedras Sagradas

**Resumen del hito:**
1. **Roster Completo de 5 Campeones (`ChampionManager.ts`, `RoguelikeRunManager.ts`):**
   - 🧙‍♂️ **Tengu:** Lluvia Meteórica (Activa) + Lluvia Pétrea (Pasiva).
   - ✨ **Himiko:** Espejo Celestial (Activa) + Ojo Sagrado (Pasiva).
   - 🦊 **Kitsune:** Transformación Ilusoria (Activa con 3 cargas) + Paso Fantasma (Pasiva).
   - ⚡ **Ronin:** Corte Relámpago (Activa) + Filo Letal (Pasiva).
   - 🐲 **Ryūjin:** Furia del Dragón (Activa) + Escamas Inmortales (Pasiva).
2. **Piedras Sagradas e Iluminación Mística:**
   - Gradientes dorados con halo sagrado `#sacred-glow` para piedras inmunes a captura.
   - Dock de habilidades con recuento visual de cargas y estado agotado `(0 cargas)`.
3. **Validación:**
   - Compilación con `npm run build` limpia (0 errores).

---

## 14 de Agosto de 2026 - Día 1 (Sesión 22): Refactorización Arquitectónica Integral (Clean Architecture, SOLID y Modularización Total)

**Resumen del hito:**
1. **Descomposición del God Object (`main.ts`):**
   - El monolito de más de 1.850 líneas ha sido descompuesto en controladores de dominio y gestores de interfaz de responsabilidad única.
2. **Capa Centralizada de Tipos (`src/types/index.ts`):**
   - Single Source of Truth para contratos de Go, topologías, campeones, hechizos, expedición roguelike y multijugador online.
3. **Capa UI Especializada (`src/ui/`):**
   - `ThemeManager.ts`: Gestión de temas claro y oscuro con persistencia.
   - `ScreenManager.ts`: Navegación limpia entre pantallas sin acoplamientos.
   - `HUDController.ts`: Control en tiempo real del HUD superior, turnos 2P/4P, capturas, docks y alertas.
   - `ModalManager.ts`: Control de modales con interfaces tipadas.
4. **Controladores de Aplicación (`src/controllers/`):**
   - `GameController.ts`: Bucle de partida, turnos de jugador e IA, pases, undo/redo, hechizos y puntuación.
   - `RoguelikeController.ts`: Gestión de expediciones, carrusel de héroes, mapa de nodos, santuarios y mercader.
   - `OnlineController.ts`: Salas WebRTC P2P y sincronización de red.
5. **Validación:**
   - Compilación con `npx tsc --noEmit` y empaquetado de producción con `npm run build` limpios (0 errores).

---

## 14 de Agosto de 2026 - Día 1 (Sesión 21): Modo 4 Jugadores (Go Cuádruple con 4 Colores de Piedras, Reglas Multibando y Ranking)

**Resumen del hito:**
1. **Motor Canónico Cuádruple (`GraphBoard.ts`, `GameState.ts`, `RulesEngine.ts`):**
   - `PlayerId` ampliado a `1 | 2 | 3 | 4` con 4 colores canónicos: ⚫ Negras, ⚪ Blancas, 🟢 Esmeralda y 🟣 Amatista.
   - Rotación circular de turnos round-robin ($1 \to 2 \to 3 \to 4 \to 1$).
   - Regla de libertades multibando (bloqueo por cualquier color enemigo) y captura directa con atribución de prisioneros.
   - Regla de 4 pases consecutivos para finalización de partida.
2. **Cálculo de Territorio Multijugador (`TerritoryScorer.ts`):**
   - Flood-fill BFS de 4 vías: adjudicación exclusiva si la frontera es 100% de un solo jugador, o declaración de *Dame* (0 pts) en fronteras compartidas.
   - Ranking estructurado con podio de 1º a 4º puesto y resolución de empates.
3. **Renderizado SVG y Estilos (`SVGRenderer.ts`, `style.css`):**
   - Nuevos gradientes tridimensionales y brillos espectrales para piedras Esmeralda (`#green-stone-grad`) y Amatista (`#purple-stone-grad`).
   - Ghost preview, halos de última jugada y marcadores de territorio específicos para los 4 colores.
4. **Interfaz y Modos de Juego (`index.html`, `main.ts`):**
   - Selector de jugadores: `2 Jugadores (Duelo)` vs `4 Jugadores (Go Cuádruple)`.
   - Modos disponibles: 4P Local (pasa y juega) o 1 Humano vs 3 IAs.
   - HUD superior con 4 contadores de capturas en vivo y modal de podio cuádruple con desglose completo.
5. **Validación:**
   - Compilación con `npx tsc --noEmit` y empaquetado de producción con `npm run build` limpios (0 errores).

---

## 14 de Agosto de 2026 - Día 1 (Sesión 20): Sistema Completo de Mapa Procedural Roguelike con Grafo de Nodos, Bifurcaciones, Eventos y Recompensas

**Resumen del hito:**
1. **Generador de Grafo de Nodos Procedural (`RoguelikeMapGenerator.ts`):**
   - Grafo DAG de 6 niveles (Tiers 0 a 5) comenzando obligatoriamente en el **Nodo 0 (Batalla Inicial)**.
   - Generación de caminos interconectados sin callejones sin salida hacia el **Jefe Final (Tier 5)**.
   - Diversidad de 6 tipos de nodos: ⚔️ Batalla Normal, 💀 Guardián Élite, ⛩️ Santuario Sagrado, 🏕️ Zona de Meditación, 🛒 Mercader Espiritual y 👑 Jefe Supremo.
2. **Renderizador de Mapa Pergamino Sumi-e (`RoguelikeMapRenderer.ts`):**
   - Lienzo SVG/HTML interactivo con líneas de camino orgánicas, efectos de pulso para nodos disponibles, checks dorados para completados y tooltips descriptivos.
3. **Gestión de Recursos y Recompensas:**
   - Moneda espiritual: **🏮 Magatamas**.
   - Modal de Recompensa tras victoria en batalla: suma de Magatamas + elección de 1 entre 3 cartas de hechizos aleatorias (`#rogue-reward-modal`).
   - Modales interactivos para Santuario, Descanso y Tienda del Mercader (`#rogue-event-modal`).
4. **Validación:**
   - Compilación con `npx tsc --noEmit` y empaquetado de producción con `npm run build` (0 errores).
