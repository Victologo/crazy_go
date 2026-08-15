# ADR 001: Representación del Tablero como Grafo (Graph-Based Board)

## Contexto
El usuario quiere construir un juego ("Crazy Go") inspirado en el Go clásico, pero con tableros irregulares, hexagonales, estrellados y con huecos. El enfoque tradicional del Go es representar el tablero como una matriz bidimensional (Array 2D), donde las adyacencias se calculan sumando `+1` o `-1` a los ejes `x` e `y`.

## Problema
Una matriz bidimensional no puede representar eficientemente geometrías complejas (como un tablero hexagonal, circular, o una cuadrícula con huecos en el medio) sin escribir código espagueti con excepciones para calcular libertades.

## Decisión
El tablero se representa matemáticamente como un **Grafo No Dirigido**. Cada intersección donde se puede colocar una ficha es un `Nodo`, y las conexiones entre intersecciones válidas son `Aristas`.

## Consecuencias
- **Positivas:** El cálculo de cadenas y libertades usa una búsqueda BFS (Breadth-First Search) estándar. Funciona mágicamente sin importar qué forma tanga el tablero, siempre y cuando los nodos estén conectados correctamente.
- **Negativas:** La inicialización del tablero requiere definir manualmente (o algorítmicamente) los nodos y aristas en lugar de simplemente crear una matriz de NxN. Las fichas de tamaño especial (2x2) deberán redefinirse basándose en el grafo (ej. una piedra central y todos sus vecinos directos).
