# Reglas Oficiales y Canónicas del Go (Manual de Referencia Crazy Go)

Este documento contiene la especificación estricta de las reglas del juego de Go (Weiqi / Baduk)
y la adaptación específica implementada en el motor de juego de "Crazy Go".

> [!IMPORTANT]
> Este archivo es la referencia definitiva del estado **real del código**.
> Si el código y este documento contradicen, **el código manda**.
> Actualizado en la Sesión 148 (27 Ago 2026) para corregir la descripción del Ko.

---

## 1. El Tablero y los Elementos

- **Intersecciones:** El juego se juega en las **intersecciones** (vértices) de la red del Goban
  (9×9, 13×13 o 19×19, además de topologías poligonales asimétricas: hexagonal, triangular,
  erosionado, islas, cruz, procedural, volcánico, Máscara Oni, Cielo).
- **Piedras:** Hay dos bandos principales: **Negras (⚫)** y **Blancas (⚪)** (ampliable a 4 jugadores:
  Esmeralda 🟢 y Amatista 🟣). Las piedras no se mueven una vez colocadas, salvo si son capturadas.
- **Implementado en:** `GraphBoard.ts` (modelo de grafo), `BoardGenerators.ts` (topologías).

---

## 2. Turnos y Apertura

- **Las Negras SIEMPRE juegan primero (Turno 1 / Ronda 1a).**
- Los jugadores alternan turnos colocando una piedra por turno en una intersección vacía.
- Un jugador puede optar por **pasar su turno** (`GameState.passTurn()`) en cualquier momento
  si considera que no hay jugadas ventajosas en el tablero.
- **Fin de partida:** Cuando `consecutivePasses >= playerCount` (2 pases consecutivos en 2P,
  4 pases en 4P), `isGameOver = true`.

---

## 3. Libertades, Cadenas y Capturas

- **Libertad:** Cualquier intersección vacía adyacente conectada a una piedra o grupo de piedras.
  Implementada en `GraphBoard.getLiberties()` — BFS que recorre la cadena entera y recoge
  todos los nodos vacíos adyacentes. Ignora nodos DESTROYED y OBSTACLE.
- **Cadena (Grupo):** Conjunto de piedras del mismo color conectadas ortogonalmente a través de
  las aristas del tablero. `GraphBoard.getChain()` — BFS sobre piedras del mismo `playerId`.
- **Atari:** Estado en el que una cadena se queda con exactamente **1 libertad**. Está a punto de
  ser capturada.
- **Captura:** Si una jugada reduce las libertades de una cadena enemiga a **0**, todas las piedras
  de esa cadena son **retiradas inmediatamente del tablero** y pasan a sumar como **prisioneros**
  en el contador del atacante. Implementado en `RulesEngine.tryPlaceStone()` — paso 2 y 4.
- **Capturas múltiples simultáneas:** Soportadas. Si una jugada pone en atari a varias cadenas
  enemigas al mismo tiempo, todas se capturan en el mismo turno. `RulesEngine.tryPlaceMultiStones()`
  hace lo mismo para fichas poliminó (Dominó 2×1, Monolito 2×2).
- **Piedras indestructibles:** Las piedras con escudo Kitsune (`isIndestructible = true`) no pueden
  capturarse aunque tengan 0 libertades. El escudo dura 3 turnos del escudado.
- **Estado:** ✅ Completamente correcto.

---

## 4. Prohibición del Suicidio

- Es **ilegal** colocar una piedra en una intersección donde la piedra (o su cadena resultante)
  no tenga ninguna libertad restante.
- **EXCEPCIÓN:** Es legal si el movimiento **captura simultáneamente una o más piedras enemigas**.
  En ese caso, la captura ocurre primero, liberando espacio para que la nueva piedra tenga libertades.
- Implementado en `RulesEngine.tryPlaceStone()` — paso 3 (`nodesToCapture.size === 0 &&
  myLiberties.size === 0 → SUICIDE`).
- **Estado:** ✅ Completamente correcto.

---

## 5. Regla del Ko — ESTADO REAL DEL CÓDIGO

> [!WARNING]
> El estado documentado en versiones anteriores de este archivo era **incorrecto**.
> El Ko **SÍ está activo** en el código. Este apartado refleja la realidad exacta.

### Ko Simple (Simple Ko) — ✅ ACTIVO

- **Definición canónica:** Un jugador no puede realizar una jugada que restaure el tablero al
  estado exacto que tenía **antes del turno anterior** (estado `boardHistory[length-2]`).
- **Implementación:** `RulesEngine.tryPlaceStone()` líneas 192–217 y `RulesEngine.isMoveLegal()`
  líneas 74–96 (ambas alineadas tras corrección de la Sesión 148).
- **Mecanismo:** Se compara la serialización determinista del tablero candidato
  (`GraphBoard.serializeState()`) con el penúltimo estado guardado en `state.boardHistory`.
- **Corrección de la Sesión 148:** `isMoveLegal` ahora comprueba Ko **siempre** (con o sin capturas)
  igual que `tryPlaceStone`, eliminando la inconsistencia previa donde solo lo verificaba cuando
  `nodesToCapture.size > 0`.
- **Error que devuelve:** `errorReason: 'KO'` + toast visual explicativo al jugador.

### Superko (Ko Posicional / Situacional) — ❌ NO IMPLEMENTADO

- El **Superko** prohíbe repetir cualquier posición global anterior en la partida (no solo la
  inmediatamente anterior). Se usa en reglas AGA y Ing.
- En Crazy Go, con las habilidades de campeones que pueden generar ciclos complejos, el Superko
  crearía muchas jugadas bloqueadas inesperadas. **Decisión de diseño: no implementar.**
- Para el entrenamiento de IA esto es irrelevante: el MCTS genera partidas que raramente llegan
  a ciclos de Ko prolongados.

### Ko Eterno / Lucha de Ko — ⚠️ Sin amenazas explícitas

- No existe un sistema de "amenazas de Ko" (Ko threats). El jugador simplemente no puede recapturar
  en la casilla de Ko. Las amenazas son decisión táctica del jugador/IA sin lógica especial en motor.

---

## 6. Komi (Compensación de Puntos para las Blancas)

- Dado que las Negras juegan primero y tienen la iniciativa estadística de ataque, las
  **Blancas reciben puntos de compensación llamados Komi**.
- **Valores Estándar:**
  - Tableros 9×9 / 13×13 / 19×19: **6.5 puntos** (más bonificaciones permanentes acumuladas en Roguelike).
  - En 4 jugadores: P2 = 2.5, P3 = 4.5, P4 = 6.5 (compensación escalonada por orden de turno).
- La fracción de **0.5 puntos** asegura matemáticamente que no haya empates (*Jigo*).
- Implementado en `GameState.playerKomis` y `TerritoryScorer.calculateScore()`.
- **Estado:** ✅ Correcto.

---

## 7. Fin de Partida y Conteo de Territorio (Reglas Japonesas)

### 7.1 Cuándo termina la partida

- La partida concluye oficialmente cuando **ambos jugadores pasan su turno consecutivamente**
  (2 pases seguidos en 2P, 4 en modo 4P): `consecutivePasses >= playerCount → isGameOver = true`.

### 7.2 Conteo de Territorio — 3 Pasadas + BFS Final

El `TerritoryScorer.calculateScore()` ejecuta un pipeline de 4 fases:

**Fase 1 — Detección de piedras muertas por recintos cerrados (Enclosure Analysis):**
- Para cada jugador P, encuentra regiones vacías 100% encerradas por P.
- Si una cadena rival tiene TODAS sus libertades dentro de ese recinto y no tiene 2 ojos
  independientes propios → marcada `isDead = true, killerId = P`.
- Cubre el caso canónico de "grupo rodeado sin escape".

**Fase 2 — Evaluación de vida/muerte (Benson 1976 + Análisis de Influencia):**
- `GraphBoard.getLivingGroupsInfo(playerId)` implementa el Teorema de Benson en grafos arbitrarios:
  1. Identifica cadenas del jugador.
  2. Identifica regiones vacías 100% encerradas por el jugador (filtrando ojos falsos con `isTrueEye`).
  3. Define "región saludable para cadena B": todo punto de la región es adyacente a B.
  4. Poda iterativa de punto fijo: elimina cadenas con < 2 regiones saludables; elimina regiones
     donde alguna piedra adyacente no pertenece al conjunto superviviente.
  5. Las cadenas que sobreviven → incondicionalmente vivas.
- Para grupos con < 2 ojos pero no encerrados: análisis de influencia BFS radio 6.
  Si influencia enemiga > 1.8× influencia propia → marcada muerta.

**Fase 3 — Detección de Seki (vida mutua):**
- Tres capas de detección en `TerritoryScorer.detectAndResolveSeki()`:
  - **Capa 1:** Seki directo — cadenas A y B sin libertades privadas, solo compartidas.
  - **Capa 2:** Seki con ojos privados insuficientes (< 2 ojos privados cada una).
  - **Capa 3:** Rescate de cadenas marcadas muertas erróneamente que en realidad están en Seki.
- Los nodos vacíos dentro de un Seki → `sekiMap` → no cuentan como territorio de nadie.
- Soporta 4 jugadores (compara pares de cualquier combinación de PlayerId).

**Fase 4 — BFS de territorio:**
- BFS estándar sobre el tablero efectivo (piedras muertas tratadas como vacías, zonas Seki = dame).
- Regla canónica: intersecciones vacías lindando **únicamente** con un color = territorio de ese jugador.
- Intersecciones lindando con 2+ colores = dame (0 puntos).

**Fórmula Final (Reglas Japonesas):**

$$\text{Puntos Negras} = \text{Territorio}_\text{negro} + \text{Capturas}_\text{negras} + \text{Piedras muertas blancas}$$
$$\text{Puntos Blancas} = \text{Territorio}_\text{blanco} + \text{Capturas}_\text{blancas} + \text{Piedras muertas negras} + \text{Komi}$$

- **Estado:** ✅ Correcto. Implementación de 3 pasadas más sofisticada que la mayoría de motores
  de Go amateurs.

### 7.3 Fase de Disputa de Territorio ("Territory Dispute" / "Final Phase") — ❌ NO IMPLEMENTADO

**Qué es:** Bajo las Reglas Japonesas estrictas, tras los dos pases, si un jugador **disputa**
que ciertas piedras están muertas, puede solicitar "continuar jugando". Los jugadores reanudan
la partida para demostrar si un grupo puede vivir o morir. Las piedras que no se puedan capturar
en esta reanudación se consideran vivas.

**Por qué no está implementado:**
- Crazy Go es un roguelite de arcade, no un torneo oficial. Los jugadores no disputan marcados.
- El `TerritoryScorer` ya usa Benson + Enclosure + Seki para determinar vida/muerte automáticamente,
  lo que en la práctica es más preciso que el veredicto humano en partidas casuales.

**¿Es necesario para el entrenamiento de IA?**
- **NO.** El sistema de self-play del entrenamiento ML nunca necesita esta fase porque:
  1. El propio modelo aprende a evaluar grupos vivos/muertos directamente.
  2. El Ownership Head de la red neuronal reemplazará el BFS heurístico, siendo más preciso.
  3. Las partidas de self-play terminan cuando ambos agentes pasan — nunca habrá desacuerdo.
- **Decisión:** Dejar para versión futura si se añade modo de torneo competitivo con árbitro.

---

## 8. Vida y Muerte (Dos Ojos)

- Un grupo de piedras es incondicionalmente **inmortal (vivo)** si posee al menos **dos ojos
  independientes** (dos huecos cerrados no contiguos), ya que el oponente nunca puede jugar en
  ambos a la vez sin cometer suicidio ilegal.
- **Ojo Verdadero vs Falso:** `GraphBoard.isTrueEye(nodeId, playerId)` implementa el criterio
  canónico de control de esquinas/diagonales:
  1. 100% de los vecinos cardinales directos deben contener piedras aliadas.
  2. Control de diagonales: en el centro se requiere controlar ≥ 3 de 4; en el borde el rival
     no puede tener ninguna diagonal; en la esquina no hay diagonal que controlar.
- **Grupos con 3+ ojos:** `getLivingGroupsInfo()` cuenta ojos exactos con Benson.
- **Estado:** ✅ Correcto.

---

## 9. Reglas Especiales de Crazy Go (No Canónicas)

Estas reglas **rompen** el Go canónico intencionalmente como mecánica de juego roguelite:

| Mecánica | Descripción | Archivo |
|---|---|---|
| Piedras Indestructibles (Escudo Kitsune) | Ignoran capturas 3 turnos | `KitsuneChampion.ts` |
| Inversión Cromática (Alquimista) | Cambia color de piedras enemigas | `AlchemistChampion.ts` |
| Lluvia Meteórica (Tengu) | Destruye zona del 15% del tablero | `TenguChampion.ts` |
| Lluvia Pétrea (Himiko) | Coloca piedras aliadas masivas | `HimikoChampion.ts` |
| Furia del Dragón (Ryūjin) | Calcina piedras al formar 2 ojos | `RyujinChampion.ts` |
| Fichas Poliminó | Dominó 2×1 y Monolito 2×2 simultáneos | `PolyominoManager.ts` |
| Topologías Asimétricas | Hexagonal, triangular, erosionado, etc. | `BoardGenerators.ts` |
| Peligros Ambientales | Erupciones, bloques del cielo, inhalación Oni | `StageHazardManager.ts` |
| Festín de Almas (Máscara Oni) | Turno extra al capturar ≥ 2 piedras | `StageHazardManager.ts` |

> [!NOTE]
> Para el entrenamiento de IA, se recomienda entrenar **primero sin estas mecánicas** (Go puro)
> y luego añadir capas de complejidad de forma incremental. Ver el documento de ML para el plan
> detallado.
