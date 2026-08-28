---
created: 2026-08-26T15:51
last_modified: 2026-08-27T11:45
tags: [crazy-go, gdd, game-design, story-mode, roguelite]
---
# 🪨 Crazy Go — Modo Historia: El Gran Goban Roto
###### Documento de Diseño Canónico (GDD) — Última actualización: 27 Agosto 2026

> **Fuente de verdad definitiva** para el diseño y desarrollo del Modo Historia de Crazy Go. Incluye premisa narrativa, cinemática, flujo de 4 escenas, mecánicas por turno, captura de artefactos, progresión macro cósmica y arquitectura técnica.

---

## 🌌 1. Premisa y Hilo Conductor

```
                       [ EL GRAN GOBAN ANCESTRAL ]
                    (Tejido cósmico de Qi infinito)
                                   ↓
                         ⚡ LA GRAN FRACTURA ⚡
               (El Vacío desgarra la realidad en islas)
                                   ↓
                   [ EL TEJEDOR CÓSMICO (JUGADOR) ]
      (Cose las grietas colocando piedras de Qi negro en el cosmos)
```

### 1.1. La Gran Fractura
El universo original (el **Gran Goban**) era un tejido continuo e infinito de energía (Qi) donde los Grandes Sabios meditaban y jugaban para mantener el equilibrio cósmico de las constelaciones.

Una fuerza entrópica ancestral — **El Vacío / The Void** — fracturó este tejido en miles de fragmentos de tierra flotante desconectados que flotan en el abismo del cosmos. La realidad está deshecha.

### 1.2. El Jugador: El Tejedor Cósmico
No eres un guerrero que empuña espadas. Eres el **Tejedor Cósmico**, el único ser capaz de canalizar el Qi primordial y coser las fisuras de la realidad.

- **Cada piedra colocada** = una puntada que cierra una grieta en el tejido de la realidad.
- **Ganar un tablero** = purificar la isla; la naturaleza reclama el territorio y la vida regresa.
- **La IA (Blancas) = La Corrupción del Vacío**, una fuerza entrópica voraz que devora intersecciones y abre nuevas fallas.

### 1.3. La Misión
Atravesar el cosmos viajando de fragmento en fragmento, purificando las islas flotantes, rescatando sabios atrapados y recolectando Fragmentos de Qi hasta **reconstruir el Gran Goban completo**.

---

## 🎬 2. Flujo Canónico de las 4 Escenas

El Modo Historia no utiliza menús tradicionales de selección de nivel. La experiencia es un **viaje cinematográfico sin fisuras por el universo**:

```
[ Escena 1: Cosmos Puro ] 
         ↓
[ Escena 2: Vista Macro (Goban Diminuto en el Universo) ] ── (Zoom-In Dive 1.4s) ──> [ Escena 3: Batalla en el Cosmos ]
                                                                                                 ↓ (Victoria + Naturaleza)
                                                                                     [ Escena 4: Zoom-Out Cósmico ]
                                                                                     ┌───────────────────────────┐
                                                                                     │    ✦ NUEVO (ISLA 2) ✦     │
                                                                                     │                           │
                                                                                     │   🌿 CONQUISTADO (ISLA 1) │
                                                                                     └───────────────────────────┘
```

### 🌠 Escena 1: El Cosmos Puro y la Introducción Cinemática
- **Fondo**: Nebulosa cósmica púrpura y azul profunda (`/bg_story.jpg`) con polvo estelar.
- **Coreografía**:
  1. *Fade in* en oscuridad con destellos de estrellas lejanas.
  2. Revelación secuencial de las 4 frases fundacionales del lore:
     - *"ANTES DEL TIEMPO..."*
     - *"Existía el Gran Goban, un tejido infinito donde los Sabios jugaban para sostener las estrellas."*
     - *"Entonces llegó El Vacío. Desgarró la realidad en islas flotantes..."* (Zoom dramático del cosmos ×2.2).
     - *"Eres el Tejedor Cósmico. Solo tú puedes coser las grietas y restaurar el mundo."*
  3. Botón `[ SKIP INTRO ⏩ ]` interactivo desde el milisegundo 0 para jugadores recurrentes.

### 🔭 Escena 2: Vista Macro del Universo (El Goban Enano)
- **Perspectiva**: La cámara se sitúa a escala macro galáctica (`scale(0.08)`).
- **El Tablero en el Cosmos**: En el centro flota un **pequeño Goban místico enano**, rodeado de un aura dorada pulsante (`drop-shadow(0 0 35px rgba(251, 191, 36, 0.85))`).
- **Atmósfera Zen**: Los retratos y barras de duelistas permanecen ocultos con `opacity: 0` para apreciar la inmensidad del universo.
- **El Salto (Zoom-In Dive)**:
  - Debajo del tablero flota el orbe interactivo: `✦ FRACTURE NODE 01 ✦ The Shattered Goban ✦ [ ⚔️ DIVE INTO GOBAN ✦ ]`.
  - Al hacer clic en el tablero diminuto o en el banner, la cámara desciende en picado a velocidad hiperespacial durante 1.4s (`scale(0.08) ➔ scale(1.0)`).
  - Al llegar al tablero:
    - Leve impacto sísmico (`vfx-screen-shake`).
    - Aparecen suavemente las cartas de duelistas.
    - Se activa el diálogo introductorio del Sabio / Tejedor.

### ⚔️ Escena 3: Batalla en el Cosmos y Florecimiento de la Naturaleza
- **Fondo Permanente**: El fondo **sigue siendo siempre el cosmos estelar**, haciendo sentir que el combate ocurre en una roca suspendida en el espacio.
- **Reglas Canónicas Asimétricas**: Tableros con agujeros y topologías rotas (`islands`, `eroded`, `islands_v1`), manteniendo libertades, capturas, Ko y territorio puros.
- **Eventos Narrativos por Turno**: Diálogos estilo novela visual, alertas de consejos estratégicos y eventos cataclísmicos (ej. Terremoto en Turno 5).
- **🌸 Victoria y Conquista de la Naturaleza (Assets Ilustrados 2D)**:
  - Al vencer, el tablero no se limita a cambiar de color: **brotan 4 ilustraciones botánicas de alta resolución**:
    - 🌲 **Pino Negro Matsu (`nature_pine.png`)**: Bonsái centenario de tronco retorcido.
    - 🌸 **Cerezo Sakura (`nature_sakura.png`)**: Árbol floral de copa rosada.
    - 🎍 **Bambú Zen (`nature_bamboo.png`)**: Macizo esmeralda de energía pura.
    - 🌿 **Enredaderas y Musgo (`nature_vines.png`)**: Manto de hiedra que trepa por las líneas SVG (`storyVineGrow`).
  - Animación elástica de brote: `@keyframes storyNaturePop`.

### 🌌 Escena 4: Zoom-Out Cósmico y Mapa de Islas Ensambladas
- Tras el mensaje de victoria del Tejedor:
  1. La cámara realiza un zoom-out fluido (`scale(0.08)`) regresando a la vista galáctica.
  2. **Doble Presencia en el Espacio**:
     - **Abajo**: El tablero purificado (`[ CONQUISTADO ]`) permanece visible en el espacio, resplandeciente con su halo verde de vida y su jardín botánico.
     - **Arriba**: La nueva isla fracturada (`[ NUEVO ]`, Capítulo 2: *The Crystal Fault*) aparece envuelta en grietas abisales púrpuras.
  3. El jugador hace clic en el nuevo tablero para iniciar el siguiente descenso en picado.

---

## 🗺️ 3. Capítulos y Progresión de la Campaña

| Cap. | Nombre | Topología | Tamaño | Dificultad | Mecánica Especial / Evento Mid-Batalla |
|:---:|---|---|:---:|:---:|---|
| **1** | **El Gran Goban Roto** | `islands` | 9×9 | Fácil | **Núcleo de Qi (💎)** central rodeable. Enseña libertades y cerco de territorio. |
| **2** | **La Falla de Cristal** | `eroded` | 13×13 | Medio | **Terremoto en Turno 5**: Ruptura mecánica que destruye una hilera de nodos y **parte el Goban en dos mitades independientes**. Rescate del Sabio Atrapado (🧙) y Pergamino (📜). |
| **3** | **Las Tres Islas** | `islands_v1` | 13×13 | Medio | **3 Frentes simultáneos (Tenuki)**: Costo de oportunidad. Cofre de Poliminós (🎁) en el atolón norte. |
| **4** | **El Lago Sagrado** *(Plan)* | `lake_donut` | 13×13 | Difícil | Casillas de agua centrales intransitables. Enseña grupos vivos con 2 ojos en espacios reducidos. |
| **5** | **Los 4 Vientos Celestiales** *(Plan)* | `quadrants` | 19×19 | Difícil | Batalla a 4 bandos simultáneos con santuarios en cada cuadrante. |
| **6** | **El Vórtice del Vacío** *(Plan)* | `vortex` | 19×19 | Gran Maestro | Agujero negro central que absorbe piedras que queden con 1 sola libertad tras 2 turnos. |
| **Final** | **El Dragón del Vacío** *(Plan)* | 19×19 canónico | 19×19 | Maestro | El Vacío rompe las reglas del Go en tiempo real (muta intersecciones y corrompe piedras aliadas). |

---

## 💎 4. Sistema de Artefactos Rodeables y Santuarios de Qi

En los tableros existen entidades cautivas y reliquias que se conquistan mediante el control territorial:

```
    [ PIEDRA NEGRA ]
          │
[ PIEDRA NEGRA ] ── ( 💎 NÚCLEO DE QI ) ── [ PIEDRA NEGRA ]
          │
    [ PIEDRA NEGRA ]
    
    ➔ ¡RODEADO AL 100%! El jugador captura la reliquia y obtiene sus poderes.
```

### Reglas de Captura:
1. **Cerco Total (100% Rodeado)**: Si todas las intersecciones adyacentes contienen piedras del mismo jugador $\to$ Captura instantánea.
2. **Control por Territorio (Flood-Fill)**: Si el objeto está dentro de un territorio cerrado donde todos los límites pertenecen al mismo jugador $\to$ Capturado al sellar el territorio.
3. **Resonancia Inestable (Disputa)**: Si hay piedras de ambos colores tocando el objeto $\to$ Queda bloqueado. Si persiste 3 turnos, emite una onda de choque menor.

### Tipos de Artefactos:
- 💎 **Núcleo de Qi**: Otorga Seda Cósmica y +1 Escudo Divino.
- 📜 **Pergamino Antiguo**: +1 Rebobinar Sagrado (Deshacer jugada).
- 🧙 **Sabio Atrapado**: Libera al monje aliado, otorgando +1 Carga de Habilidad.
- 🎁 **Cofre de Poliminós**: Desbloquea fichas poliomino especiales (Dominó 2×1, Esquina 3×1).

---

## 🎒 5. Economía de Seda Cósmica y Telar del Destino *(Backlog)*

```
[ Puntos de Territorio Conquistados ] ──(Cosecha)──> [ Seda Cósmica (Recurso) ]
                                                                │
                                                                ↓ (Telar)
                                                   [ Fichas y Reliquias Místicas ]
```

- **Cosecha de Territorio**: Al finalizar cada capítulo victorioso, cada intersección de territorio purificado produce **1 Hebra de Seda Cósmica**.
- **El Telar del Destino**: Entre capítulos, el jugador puede tejer:
  - ⛰️ **Piedra Montaña**: Bloqueo topológico indestructible.
  - ⏳ **Fragmento de Tiempo**: Carga extra de Undo.
  - 🛡️ **Sello de Indestructibilidad**: Consagra una piedra para que no pueda ser capturada durante 2 turnos.
  - 💥 **Bomba de Vacío**: Destruye un área de 3×3.

---

## 🛠️ 6. Arquitectura Técnica y Depuración

### 6.1. Módulos Clave:
- **`src/story/StoryModeController.ts`**: Controlador maestro del modo historia. Gestiona ciclo de vida, escala cósmica, transiciones inter-capítulos, sismos y watcher de turnos.
- **`src/story/StoryDebugUI.ts`**: Panel de control para desarrollo integrado en `#game-topbar .topbar-left` (Atajos: **`F3`** / **`~`**).
- **`src/graphics/SVGRenderer.ts`**: Renderizado de cuadrícula, santuarios, capas de vegetación ilustrada (`story-nature-bloom-layer`) y captura de clics.
- **`src/ui/StoryDialogueRenderer.ts`**: Sistema de diálogos visual novel con avatares parlantes e historial.

### 6.2. Motor de IA:
- El Modo Historia utiliza internamente el motor **`gameMode: '1via'`** (en lugar de la etiqueta `'story'` legacy) para garantizar que la IA juegue con el algoritmo GoAI optimizado.

---

## 📌 7. Decisiones de Diseño Fijas (No Negociables)

1. ❌ **Sin Selección de Héroe**: En Story Mode el jugador encarna siempre al *Tejedor Cósmico* con la clase balanceada *Persona Normal*. La progresión se basa en artefactos y Seda Cósmica.
2. ❌ **Piedra Puente DESCARTADA**: No encaja con la pureza del Go.
3. ✅ **El fondo es SIEMPRE el cosmos (`/bg_story.jpg`)**: La inmersión cósmica es la identidad visual del modo historia.
4. ✅ **Naturaleza con Arte Ilustrado 2D**: Se prohíbe el uso de emojis de texto; se utilizan exclusivamente los assets PNG de alta resolución (`/public/nature/`).
5. ✅ **Transiciones con Zoom y Paneo**: Cada capítulo se descubre como una nueva isla en el universo sin pantallas de carga en negro.
