# ⛩️ Crazy Go (疯狂围棋)

> **Roguelite de Go con Topologías Asimétricas, Campeones Místicos, Hechizos y Reglas Canónicas Japonesas.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![WebRTC](https://img.shields.io/badge/Multiplayer-WebRTC_P2P-333333?style=flat&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Repositorio oficial en GitHub: **[https://github.com/Victologo/crazy_go](https://github.com/Victologo/crazy_go)**

---

## 🌟 ¿Qué es Crazy Go?

**Crazy Go** es una reinterpretación roguelite y táctica del milenario juego del **Go (Igo / Weiqi / Baduk)**. Conserva con pureza matemática las reglas canónicas de libertades, capturas en cadena, regla de Ko y puntuación territorial japonesa, combinándolas con:

- 🌌 **Topologías de Grafos Asimétricas:** Tableros circulares concéntricos, cuadrículas irregulares, zonas de colisión, islas flotantes y mapas fractales.
- 🧙‍♂️ **7 Campeones Místicos:** Cada uno con habilidades activas únicas, pasivas territoriales y standees animados en el tatami (Hombre Normal, Tengu 🦅, Himiko ✨, Kitsune 🦊, Ronin ⚡, Alquimista ⚗️ y Ryūjin 🐲).
- 📜 **Pergaminos Arcanos:** Rebobinar el tiempo (⏳), Lluvia Meteórica (☄️), Escudos Sagrados (🛡️) e Inversión Yin-Yang (☯️).
- 🀄 **Fichas Poliminó Tácticas:** Piedras Germinantes 1x1 (🌿), Fichas Duplicidad 2x1 rotatorias (🀄) y Monolitos de piedra sagrada 2x2 (🧱).
- 🥋 **Dojo Tutorial de 9 Lecciones:** Sistema pedagógico interactivo paso a paso con anotaciones visuales en vivo, conteo de libertades, dos ojos y prevención de errores.
- 📖 **Modo Historia (Crónicas del Goban):** Campaña narrativa tipo Novela Visual con misiones de rescate y duelos temáticos.
- 🌐 **Multijugador Online P2P:** Partidas en tiempo real punto a punto mediante WebRTC sin intermediarios ni servidores centrales.

---

## 🎮 Controles y Atajos de Teclado

| Tecla / Atajo | Acción |
| :--- | :--- |
| **Clic Izquierdo** | Colocar piedra, objetivo de habilidad o ficha poliminó en el nodo |
| **Espacio / Enter** | Pasar turno / Avanzar diálogo de Sensei o Novela Visual |
| **C / Clic en Retrato** | Activar Habilidad Activa del Campeón seleccionado |
| **1 - 4** | Seleccionar Pergaminos Místicos (Rebobinar, Meteorito, Escudo, Transmutación) |
| **5 / Z** | Seleccionar Ficha Poliminó: **Germinante 1x1 (🌿)** |
| **6 / X** | Seleccionar Ficha Poliminó: **Duplicidad 2x1 (🀄)** |
| **7 / V** | Seleccionar Ficha Poliminó: **Monolito 2x2 (🧱)** |
| **R** | Rotar Ficha Duplicidad 2x1 entre Horizontal (⇄) y Vertical (⇅) |
| **U / Ctrl+Z** | Deshacer jugada (Rebobinar) |
| **Ctrl+Y** | Rehacer jugada |
| **Escape** | Cerrar modales / Cancelar selección de objetivo |

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) (v18 o superior)
- Git

### Pasos
```bash
# 1. Clonar el repositorio
git clone https://github.com/Victologo/crazy_go.git

# 2. Entrar al directorio
cd crazy_go

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo local
npm run dev
```

Abre tu navegador en `http://localhost:5173/` para comenzar a jugar.

Para compilar el bundle de producción optimizado:
```bash
npm run build
```

---

## 📦 Control de Versiones con Git y GitHub

El proyecto está sincronizado con GitHub. Cualquier cambio se puede subir ejecutando:

```bash
# Ver estado de los archivos
git status

# Añadir cambios
git add .

# Crear commit descriptivo
git commit -m "feat: descripción de la mejora implementada"

# Subir a GitHub
git push origin main
```

*(La IA asistente puede ejecutar estos pasos de forma 100% automática tras cada sesión).*

---

## 📁 Estructura del Proyecto

```text
crazy_go/
├── docs/ai_wiki/         # Protocolo AI Wiki, Roadmap (task.md), ADRs y reglas
├── public/               # Audio procedural/BGM, fondos de tatami, avatares de campeones
├── src/
│   ├── ai/               # Motor de IA para Go con heurísticas de ojos y territorio
│   ├── audio/            # Sintetizador procedural Web Audio API (SoundFX y BGMGenerator)
│   ├── controllers/      # GameController, RoguelikeController, OnlineController, SandboxController
│   ├── core/             # RulesEngine, GraphBoard, GameState, TerritoryScorer, ChampionManager
│   │   └── champions/    # Clases individuales por Campeón (Tengu, Ronin, Alchemist...)
│   ├── events/           # AppEventBinder y KeyboardController (atajos universales)
│   ├── graphics/         # SVGRenderer (motor gráfico SVG), BoardGenerators, VFXManager
│   ├── story/            # Campaña del Modo Historia (StoryCampaign y StoryController)
│   ├── styles/           # Arquitectura CSS modularizada (< 500 líneas por módulo)
│   ├── tutorial/         # TutorialManager y TutorialSteps (Dojo interactivo)
│   └── ui/               # HUDController, ModalManager, ScreenManager, StoryDialogueRenderer
├── index.html            # Markup semántico de la aplicación
├── package.json
└── vite.config.ts
```

---

## 📜 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo de licencia para más detalles.
