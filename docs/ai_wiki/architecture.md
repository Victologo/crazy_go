# Arquitectura (Architecture)

Este documento describe las tecnologías principales y patrones arquitectónicos utilizados en Crazy Go.

## Tecnologías Principales
- **Lenguaje:** TypeScript (Vanilla)
- **Compilador/Empaquetador:** Vite
- **Renderizado (Futuro):** HTML5 Canvas / DOM / SVG (Por definir, actualmente sin UI).

## Patrones de Diseño Core

### 1. El Tablero como Grafo (Graph-Based Topology)
Dado que el juego soporta tableros con geometrías no euclidianas, estrellas y agujeros, el tablero no se modela como un Array 2D (`board[x][y]`).
Se modela matemáticamente como un **Grafo No Dirigido**:
- **Nodos:** Intersecciones `BoardNode`.
- **Aristas:** Conexiones entre nodos.
- **Ventaja:** El cálculo de libertades (las reglas de vida y captura del Go) se convierte en una simple búsqueda BFS a través de las aristas, funcionando perfectamente sin importar qué forma tenga el tablero real.

### 2. Entity-Component-System (ECS)
Cada pieza colocada en el tablero es una **Entidad**. Las propiedades de la pieza (veneno, invisibilidad, lógica de héroe) están divididas en **Componentes**.
- **Ventaja:** Evita jerarquías de herencia complejas (e.g. `class PoisonedInvisibleHero extends Stone`). Facilita añadir comportamientos apilables a cualquier ficha.

### 3. Timeline de Eventos (Event Queue)
El flujo de turnos tradicional es reemplazado por una cola cronológica alojada en el `GameState`.
- **Ventaja:** Permite mecánicas asíncronas, como fichas que tardan varios turnos en aparecer (Pre-carga) y penalizaciones que saltan el turno de un jugador (Post-carga).

### 4. Determinismo y Reversibilidad (Patrón Comando)
*(Planeado, implementación base)*
La existencia del hechizo "Rebobinar" exige que cada cambio en el estado del juego pueda deshacerse. El motor se basará en aplicar acciones deterministas y guardar instantáneas (o deltas) del estado para volver al turno anterior.
