# Crazy Go - Project Brief

## Visión General
"Crazy Go" es una reimaginación del milenario juego de mesa Go, fusionado con mecánicas de **rogue-like**, alteraciones topológicas y asimetría temporal (economía de turnos).
El objetivo sigue siendo el mismo que en el Go original: sumar más puntos capturando piedras o reclamando territorio, pero las herramientas para lograrlo son dinámicas y caóticas.

## Pilares Fundamentales
1. **Reglas Base de Go:** Colocación de piedras en intersecciones, libertades y capturas mediante el rodeo de grupos (cadenas).
2. **Alteraciones Topológicas:** Los tableros no son matrices rígidas. Pueden ser hexagonales, estrellados, irregulares y tener agujeros u obstáculos.
3. **Economía de Turnos Asíncrona (Carga):** Las piezas poderosas no se colocan instantáneamente. Requieren turnos de *Pre-carga* (bloqueo fantasma), *Carga* (materialización y captura), y *Post-carga* (turnos de inacción o aturdimiento).
4. **Entidades con Estado:** Las piezas pueden ser envenenadas, congeladas o volverse invisibles/indestructibles.
5. **Héroes y Hechizos:** Existencia de fichas únicas con comportamientos pasivos (ej. desdoblamiento) o activos (ej. rebobinar turnos, lluvias de meteoritos).
6. **Meta-Progresión (Run):** Una estructura inspirada en *Slay the Spire* donde los jugadores avanzan por nodos, se enfrentan a la IA con condiciones distintas y compran mejoras en mercados.

## Estado del Proyecto
Se están sentando las bases lógicas y matemáticas del motor (Core Engine). Todavía no hay una representación gráfica final, el foco es validar las reglas abstractas.
