# Reglas de Diseño de Crazy Go (Extraídas del archivo original)

## 🧱 Tipos de Fichas Especiales
- **Ficha 2x2 (cuadrado de 4 piedras):** 1 pre-carga, 1 carga, 1 post-carga.
- **Ficha 2x1:** 1 carga, 1 post-carga.
- **Ficha 1x1 Desdoblante:** 1 carga. Cada 3 turnos, genera una piedra nueva en una casilla adyacente vacía. Puede autodestruirse si provoca suicidio para capturar piezas.

## 🦸 Héroes (Personajes)
Primera ficha de la partida con efectos únicos:
- Héroe 1: crea dos piedras a la izquierda y derecha.
- Héroe 2: pone piedra al azar cada 3 turnos.
- Héroe 3: revive las 5 primeras piedras capturadas al azar.
- Héroe 4: genera n-1 piedras como extensión de su grupo.
- Héroe 5: genera su mismo grupo en otra zona del tablero.
- Héroe 6: puede intercambiar posiciones (teletransporte) cada 9 turnos.
- Héroe 7: coloca minas invisibles explosivas.
- Héroe 8: destruye una piedra y maldice casilla 1 turno.
- Héroe 9: hace que el rival vea las fichas grises (niebla de guerra).

## 🌀 Estados Especiales
1. **Veneno:** Tras 3 turnos, la piedra se destruye en el turno del oponente.
2. **Congelación:** Tarda 2 turnos en descongelarse. Actúa como escudo contra capturas para las fichas adyacentes a ella.
3. **Indestructibilidad:** 2 turnos donde no puede ser capturada bajo ninguna circunstancia.
4. **Invisibilidad:** 3 turnos invisible para el oponente.

## 🪄 Hechizos Especiales
- **Rebobinar:** Deshace 1 turno.
- **Lluvia Meteórica:** Destruye área de 11x11 al azar, sin puntos.
- **Lluvia Pétrea:** Caen 5 piedras. Tiene 1 turno de pre-, carga y post-carga.
- **Inversión Cromática:** Convierte ficha enemiga y suelta otra enemiga al azar.

## 🗺️ Terrenos
- **Arenoso:** Casillas colapsan y se destruyen.
- **Arenas Movedizas:** Las piedras puestas aquí se autodestruyen en 3 turnos.
- **Roca/Árbol:** Casilla bloqueada neutral.
