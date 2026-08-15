# Reglas Oficiales y Canónicas del Go (Manual de Referencia Crazy Go)

Este documento contiene la especificación estricta de las reglas del juego de Go (Weiqi / Baduk) y la adaptación específica implementada en el motor de juego de "Crazy Go".

---

## 1. El Tablero y los Elementos
- **Intersecciones:** El juego se juega en las **intersecciones** (vértices) de la red del Goban (9x9, 13x13 o 19x19, además de topologías poligonales asimétricas).
- **Piedras:** Hay dos bandos principales: **Negras (⚫)** y **Blancas (⚪)** (ampliable a 4 jugadores: Esmeralda 🟢 y Amatista 🟣). Las piedras no se mueven una vez colocadas, salvo si son capturadas.

---

## 2. Turnos y Apertura
- **Las Negras SIEMPRE juegan primero (Turno 1 / Ronda 1a).**
- Los jugadores alternan turnos colocando una piedra por turno en una intersección vacía.
- Un jugador puede optar por **pasar su turno** en cualquier momento si considera que no hay jugadas ventajosas en el tablero.

---

## 3. Libertades, Cadenas y Capturas
- **Libertad:** Cualquier intersección vacía adyacente conectada a una piedra o grupo de piedras.
- **Cadena (Grupo):** Conjunto de piedras del mismo color conectadas ortogonalmente a través de las aristas del tablero. Todas las piedras de una misma cadena comparten sus libertades como un único cuerpo vivo.
- **Atari:** Estado en el que una cadena se queda con exactamente **1 libertad**. Está a punto de ser capturada.
- **Captura:** Si una jugada reduce las libertades de una cadena enemiga a **0**, todas las piedras de esa cadena son **retiradas inmediatamente del tablero** y pasan a sumar como **prisioneros** en el contador del atacante.

---

## 4. Prohibición del Suicidio
- Es **ilegal** colocar una piedra en una intersección donde la piedra (o su cadena resultante) no tenga ninguna libertad restante...
- **EXCEPCIÓN:** Es legal si el movimiento **captura simultáneamente una o más piedras enemigas**. En ese caso, la captura ocurre primero, liberando espacio para que la nueva piedra tenga libertades.

---

## 5. Regla del Ko en Crazy Go
- **Sin Restricción de Ko:** En el motor de Crazy Go, la prohibición estricta de repetición inmediata (Ko tradicional) ha sido **desactivada**. Los jugadores y la IA pueden recapturar sin bloqueos ni penalizaciones artificiales, fomentando un combate roguelike fluido y dinámico.

---

## 6. Komi (Compensación de Puntos para las Blancas)
- Dado que las Negras juegan primero y tienen la iniciativa estadística de ataque, las **Blancas reciben puntos de compensación llamados Komi**.
- **Valores Estándar:**
  - Tableros 9x9 / 13x13 / 19x19: **6.5 puntos** (más bonificaciones permanentes acumuladas en Roguelike).
- La fracción de **0.5 puntos** asegura matemáticamente que no haya empates (*Jigo*).

---

## 7. Fin de Partida y Conteo de Territorio (Reglas Japonesas / Japanese Rules)
- La partida concluye oficialmente cuando **ambos jugadores pasan su turno consecutivamente** (2 pases seguidos).
- **Territorio:** Cualquier intersección vacía (o grupo de intersecciones vacías) rodeada **únicamente por piedras de un solo color**.
  - Intersecciones rodeadas exclusivamente por piedras Negras = **Territorio de Negras** (+1 punto por intersección).
  - Intersecciones rodeadas exclusivamente por piedras Blancas = **Territorio de Blancas** (+1 punto por intersección).
  - Intersecciones compartidas que lindan con ambos colores = **Dame** (tierra de nadie, 0 puntos).
- **Puntuación Final Canónica (Reglas Japonesas de Territorio y Prisioneros):**
  $$\text{Puntos Totales de Negras} = \text{Territorio de Negras} + \text{Prisioneros capturados por Negras}$$
  $$\text{Puntos Totales de Blancas} = \text{Territorio de Blancas} + \text{Prisioneros capturados por Blancas} + \text{Komi}$$
- **Ganador:** Aquel jugador cuya suma total de puntos sea estrictamente superior. El margen de victoria es la diferencia entre el total del primer clasificado y el total del segundo clasificado. En el modo Roguelite, una victoria del jugador humano desbloquea automáticamente la recompensa y el avance del mapa.

---

## 8. Vida y Muerte (Dos Ojos)
- Un grupo de piedras es incondicionalmente **inmortal (vivo)** si posee al menos **dos ojos independientes** (dos huecos cerrados no contiguos), ya que el oponente nunca puede jugar en ambos a la vez sin cometer suicidio ilegal.
