---
aliases:
moc:
tags:
created: 2026-02-27T21:44
last_modified: 2026-08-27T12:38
---

# 🧠 Hoja de Ruta Completa: Sistema de ML para Crazy Go (AlphaZero-Style)

> [!IMPORTANT]
> **Documento fusionado y mejorado — Sesión 148 (27 Ago 2026)**
> Escrito por Antigravity tras auditoría completa del motor de juego.
> Incluye: estado real del código, plan de entrenamiento paso a paso, recomendaciones
> específicas para versión descargable (itch.io) y versión web.

---

## 📊 Estado del Motor de Go Antes de Entrenar

Antes de invertir tiempo en ML, la pregunta más importante es: **¿el motor está listo?**

### ✅ Lo que está correcto (no tocar)

| Regla de Go | Estado | Archivo |
|---|---|---|
| Libertades y cadenas (BFS) | ✅ Correcto | `GraphBoard.getLiberties` / `getChain` |
| Capturas (0 libertades) | ✅ Correcto | `RulesEngine.tryPlaceStone` |
| Capturas múltiples simultáneas | ✅ Correcto | `RulesEngine.tryPlaceMultiStones` |
| Suicidio ilegal | ✅ Correcto | `RulesEngine` paso 3 |
| Ko Simple canónico | ✅ Correcto (corregido Ses.148) | `RulesEngine` — ambos métodos alineados |
| Ojo verdadero vs falso (diagonales) | ✅ Correcto | `GraphBoard.isTrueEye` |
| Grupos vivos con 2 ojos (Benson 1976) | ✅ Correcto | `GraphBoard.getLivingGroupsInfo` |
| Seki (vida mutua, 3 capas) | ✅ Correcto | `TerritoryScorer.detectAndResolveSeki` |
| Conteo de territorio (BFS, Reglas Japonesas) | ✅ Correcto | `TerritoryScorer.calculateScore` |
| Piedras muertas al final de partida | ✅ Enclosure + Benson + Influencia | `TerritoryScorer` |
| Komi 6.5 (y diferencial en 4P) | ✅ Correcto | `GameState.playerKomis` |
| Fin de partida por 2 pases | ✅ Correcto | `GameState.passTurn` |
| Topologías asimétricas como grafos | ✅ Funciona | `GraphBoard` + `BoardGenerators` |

### ⚠️ Corrección realizada en la Sesión 148

`RulesEngine.isMoveLegal()` tenía el Ko condicionado a `nodesToCapture.size > 0`, mientras que
`tryPlaceStone()` lo comprobaba siempre. Esta inconsistencia fue **corregida**: ahora ambos métodos
comprueban Ko siempre que `boardHistory.length >= 2`, siendo idénticos y libres de edge-cases.

### ❌ Lo que NO está implementado (y por qué no importa para el ML)

| Característica | ¿Necesaria para ML? | Decisión |
|---|---|---|
| Superko posicional/situacional | ❌ No | Ciclos largos rarísimos en self-play |
| Amenazas de Ko (Ko threats) | ❌ No | El MCTS aprende estrategia de Ko solo |
| Fase de disputa de territorio | ❌ No | El Ownership Head la reemplaza perfectamente |
| Reglas de Ing / Nueva Zelanda | ❌ No | Crazy Go usa Reglas Japonesas |

---

## 🏗️ Arquitectura General del Sistema

```
[TU PC DE SOBREMESA: 12 GB VRAM + 64 GB RAM]
│
├── 1. Entorno Python (PyTorch 2.x + CUDA 12)
├── 2. Simulador Headless Node.js (reutiliza RulesEngine + GraphBoard)
├── 3. Red Neuronal CrazyGoNet (ResNet-12, 3 Cabezas)
├── 4. Bucle Self-Play masivo con MCTS (múltiples hilos CPU + GPU)
├── 5. Evaluador de calidad (nueva red vs red anterior)
└── 6. Exportador ONNX FP16 → crazy_go_brain.onnx (~45 MB web / ~90 MB desktop)
                         │
                         ▼
[PROYECTO CRAZY GO WEB (TypeScript / Vite)]
├── src/ai/GoAI.worker.ts       → Policy Head: elegir jugadas
├── src/core/AnalysisEngine.ts  → Value Head: Winrate en tiempo real
└── src/core/TerritoryScorer.ts → Ownership Head: conteo de territorio final
```

---

## 🧠 Por Qué Necesitamos 3 Cabezas, No 2

### El problema del conteo de territorio y el Winrate

El motor heurístico actual (`TerritoryScorer.ts` + `AnalysisEngine.ts`) comete errores en:

1. **Piedras muertas dentro de territorio sellado:** El análisis de influencia (radio 6) a veces
   falla con grupos complejos encerrados. La red neuronal los detecta perfectamente porque ha visto
   millones de ejemplos similares.
2. **Winrate desequilibrado al inicio:** En el turno 1, la heurística Softmax da ventaja a Blancas
   por el Komi incluso antes de la primera piedra. La red aprende el balance real.
3. **4 jugadores:** La heurística no pondera correctamente quién domina cada zona en partidas 4P.

### La solución: Ownership Head (lo que usa KataGo)

```
Estado del tablero (NxNx16 canales)
              ↓
    CrazyGoNet (ResNet-12)
              ↓
   ┌──────────┬───────────┬──────────────────────┐
Policy Head  Value Head  Ownership Head
"¿Dónde      "¿Quién     "¿De quién es cada
 jugar?"     gana?"       intersección?"
  N+1 probs  [p1,p2,p3,p4]  Mapa NxN × 4 canales
  (N casillas               (probabilidad 0-1 por color)
  + Pase)
```

El **Ownership Head** produce un mapa donde cada intersección tiene
`[p_negro, p_blanco, p_verde, p_morado]`. Al final de partida:
- Casillas con `p_negro > 0.7` → territorio negro automático.
- Piedras enemigas dentro de territorio cuya `p_capturador > 0.8` → muertas.
- Esto reemplaza al BFS canónico de `TerritoryScorer` y funciona en **cualquier topología**
  sin necesidad de reglas especiales para hexagonal, triangular, etc.

---

## 📐 Arquitectura de la Red: CrazyGoNet

### Tensor de Entrada: `NxNx16` canales

| Canales | Qué representan |
|---|---|
| 0–3 | Presencia de piedras de cada color (1 = hay piedra, 0 = vacío). Ej. Canal 0 = Negras |
| 4 | Máscara de topología: 1 = casilla jugable, 0 = abismo/destruida/obstáculo |
| 5 | Libertades normalizadas de la cadena en ese nodo (0–1, siendo 1 = ≥ 8 libertades) |
| 6 | Indicador de Atari: 1 si la cadena en ese nodo tiene exactamente 1 libertad |
| 7–8 | Zonas de influencia de Negras y Blancas (ponderación BFS radio 3, normalizada) |
| 9 | Casilla del último movimiento rival (1 = aquí jugó el rival, 0 = resto) |
| 10 | Indicador de Ko: 1 en la casilla actualmente prohibida por Ko |
| 11–14 | Canales de habilidades de campeón (cargadas restantes, normalizado 0–1) |
| 15 | Turno relativo del jugador actual (constante en todo el plano: 0.0–1.0 según avance) |

> [!NOTE]
> Para la **Fase 1 de entrenamiento** (Go puro sin campeones), los canales 11–14 se rellenan
> con 0. Esto permite reutilizar la misma arquitectura cuando se añadan campeones en Fase 3.

### Arquitectura de la Red

```python
class CrazyGoNet(nn.Module):
    def __init__(self, board_size=9, in_channels=16, res_blocks=12, filters=128):
        super().__init__()
        # Capa de entrada
        self.input_conv = nn.Conv2d(in_channels, filters, 3, padding=1)
        self.input_bn   = nn.BatchNorm2d(filters)

        # 12 bloques residuales (ResNet-12)
        self.res_blocks = nn.ModuleList([ResBlock(filters) for _ in range(res_blocks)])

        # Policy Head
        self.policy_conv = nn.Conv2d(filters, 2, 1)
        self.policy_bn   = nn.BatchNorm2d(2)
        self.policy_fc   = nn.Linear(2 * board_size * board_size, board_size * board_size + 1)

        # Value Head
        self.value_conv  = nn.Conv2d(filters, 1, 1)
        self.value_bn    = nn.BatchNorm2d(1)
        self.value_fc1   = nn.Linear(board_size * board_size, 256)
        self.value_fc2   = nn.Linear(256, 4)   # [p1,p2,p3,p4] para 4P; usar [p1,p2] para 2P

        # Ownership Head
        self.own_conv    = nn.Conv2d(filters, 4, 1)  # 4 canales de salida = 4 colores
```

### Función de Pérdida Total

$$\mathcal{L} = \mathcal{L}_\text{policy} + \lambda_v \cdot \mathcal{L}_\text{value} + \lambda_o \cdot \mathcal{L}_\text{ownership}$$

- $\mathcal{L}_\text{policy}$: Entropía cruzada entre la distribución MCTS y la Policy Head.
- $\mathcal{L}_\text{value}$: MSE entre el resultado real de la partida y el Value Head.
- $\mathcal{L}_\text{ownership}$: BCE entre el ownership final real (quién ocupó cada casilla al final)
  y el Ownership Head. $\lambda_v = 1.0$, $\lambda_o = 0.15$ (siguiendo valores de KataGo).

---

## 🔧 Los 5 Pasos del Sistema

### Paso 1 — Configuración del Entorno (Día 1)

**Lo que tú tienes que hacer:**

1. Abrir PowerShell y ejecutar:
   ```powershell
   # Verificar versión de Python (necesitas 3.10 o 3.11)
   python --version

   # Verificar GPU disponible
   nvidia-smi
   ```

2. Ejecutar el script de un solo clic que yo generaré: **`ml_training/setup_ml_env.bat`**

   El script hará automáticamente:
   - Crear entorno virtual Python: `python -m venv ml_venv`
   - Activarlo e instalar PyTorch con CUDA 12.x
   - Instalar dependencias: `onnx`, `onnxruntime-gpu`, `numpy`, `tqdm`
   - Verificar que la GPU detecta los 12 GB de VRAM
   - Ejecutar un test mínimo de `torch.cuda.is_available()`

3. En el proyecto Node.js, instalar las dependencias para el simulador:
   ```powershell
   npm install tsx  # Para ejecutar TypeScript directamente en Node
   ```

**Duración estimada:** 15-30 minutos (la instalación de PyTorch+CUDA es lo más lento).

---

### Paso 2 — Simulador Headless (Días 2–3)

> [!IMPORTANT]
> **Esta es la decisión más importante de todo el sistema.**
> El boceto original decía "reescribir las reglas en Python". Esto sería un error grave.
> **La solución correcta:** simulador en **Node.js/TypeScript**, reutilizando directamente
> `RulesEngine.ts`, `GraphBoard.ts` y `GameState.ts` del proyecto.

**Por qué Node.js, no Python:**
- Las topologías asimétricas de `GraphBoard` son lógica compleja que no queremos duplicar.
- Reescribir en Python = 2 implementaciones que pueden divergir en bugs → datos de entrenamiento
  incorrectos → red que aprende Go mal.
- Node.js con `tsx` puede ejecutar el TypeScript existente directamente sin compilar.
- Velocidad: Node.js genera ~5.000–15.000 posiciones por segundo en 9×9 — suficiente.
  (Python puro sin C++ sería similar o más lento para grafos).

**Arquitectura del simulador (`ml_training/crazy_go_sim.ts`):**

```typescript
// Importa directamente el código del juego
import { GraphBoard } from '../src/core/GraphBoard';
import { GameState } from '../src/core/GameState';
import { RulesEngine } from '../src/core/RulesEngine';
import { BoardGenerators } from '../src/graphics/BoardGenerators';
import { TerritoryScorer } from '../src/core/TerritoryScorer';

interface SelfPlayGame {
    moves: string[];          // IDs de nodos jugados (o 'PASS')
    result: number[];         // [p1_score, p2_score, ...]
    ownershipFinal: number[]; // Quién ocupó cada casilla al final (ground truth)
    boardSnapshots: number[][][]; // Tensores NxNx16 de cada posición
}

function playRandomGame(boardSize: 9 | 13 | 19): SelfPlayGame { ... }
function extractFeatureTensor(board, state): number[][][] { ... }
```

**Qué randomizará el simulador en Fase 1 (Go puro):**
- Tamaño del tablero: 9×9, 13×13, 19×19.
- Temperatura de exploración MCTS (para generar partidas variadas, no siempre óptimas).
- No topologías asimétricas en Fase 1 (añadirlas en Fase 2).

---

### Paso 3 — Red Neuronal y Entrenamiento (`model.py` + `train_selfplay.py`) (Días 4–5)

**Lo que tú tienes que hacer:**
1. Abrir VS Code / PyCharm con el entorno `ml_venv` activado.
2. Yo generaré los archivos `ml_training/model.py` y `ml_training/train_selfplay.py`.
3. Ejecutar: `python ml_training/train_selfplay.py`
4. Observar el progreso en consola (aparecerán métricas cada 100 steps).

**Cómo funciona el bucle de Self-Play:**

```
┌─────────────────────────────────────────────────────┐
│                BUCLE PRINCIPAL                       │
│                                                      │
│  Generador (CPU, N hilos):                           │
│    └── crazy_go_sim.ts via child_process.spawn()     │
│    └── Genera partidas con la versión actual del red │
│    └── Guarda en ReplayBuffer (64 GB RAM)            │
│                                                      │
│  Entrenador (GPU):                                   │
│    └── Toma batch de 512 posiciones del buffer       │
│    └── Forward pass → [policy, value, ownership]     │
│    └── Calcula pérdida total L                       │
│    └── Backward pass + Adam optimizer                │
│    └── Guarda checkpoint cada 1000 steps             │
│                                                      │
│  Evaluador (cada 5000 steps):                        │
│    └── Nueva red vs red anterior: 100 partidas       │
│    └── Si win rate > 55% → nueva red pasa a ser      │
│        la "mejor" y se usa para generar más datos    │
└─────────────────────────────────────────────────────┘
```

**Hiperparámetros recomendados para tu hardware:**

| Parámetro | Valor | Razón |
|---|---|---|
| Batch size | 512 | Aprovecha los 12 GB VRAM sin overflow |
| Replay buffer | 500.000 posiciones | Cabe en tus 64 GB RAM con holgura |
| MCTS simulations | 200 por jugada | Balance velocidad/calidad en 9×9 |
| Learning rate | 2e-3 → 1e-4 decay | Schedule cosine annealing |
| ResNet bloques | 12 | Suficiente para 9×9–19×19 |
| Filtros | 128 canales | Óptimo para 12 GB VRAM |

**Checkpoints y Pausa Segura:**
- El script guarda automáticamente `checkpoint_step_XXXX.pt` cada 30 minutos.
- Para detener: `Ctrl+C`. Reanudación: `python train_selfplay.py --resume checkpoint_step_XXXX.pt`
- Nunca se pierde progreso.

**Etiquetas de Ownership (ground truth):**
- Al finalizar cada partida de self-play, el resultado real (quién terminó ocupando cada casilla)
  se usa como `ownership_target`. Las casillas con piedras muertas que el motor detectó al final
  → propietario = el jugador que las capturó.
- Esto enseña al Ownership Head a reconocer piedras muertas sin árbitro externo.

---

### Paso 4 — Exportación e Integración Web (Días 8–10)

**Exportar a ONNX:**

```python
# ml_training/onnx_export.py
import torch
import torch.onnx

model = CrazyGoNet(board_size=19, in_channels=16, res_blocks=12, filters=128)
model.load_state_dict(torch.load('best_model.pt')['model_state_dict'])
model.eval()

dummy_input = torch.randn(1, 16, 19, 19)  # batch=1, channels=16, 19x19

# Exportar en FP32 completo (para itch.io descargable)
torch.onnx.export(model, dummy_input, 'crazy_go_brain_fp32.onnx',
    input_names=['board'], output_names=['policy', 'value', 'ownership'],
    dynamic_axes={'board': {2: 'N', 3: 'N'}},  # Dimensiones N dinámicas
    opset_version=17)

# Exportar en FP16 cuantizado (para web)
model_fp16 = model.half()
dummy_fp16 = dummy_input.half()
torch.onnx.export(model_fp16, dummy_fp16, 'crazy_go_brain_fp16.onnx', ...)
```

**Integrar en GoAI.worker.ts:**

```typescript
import * as ort from 'onnxruntime-web';

const session = await ort.InferenceSession.create('/models/crazy_go_brain.onnx', {
    executionProviders: ['wasm'],  // 'webgl' como fallback
    graphOptimizationLevel: 'all'
});

// En getBestMove():
const tensor = new ort.Tensor('float32', boardFeatures, [1, 16, N, N]);
const { policy, value, ownership } = await session.run({ board: tensor });
```

---

## 🎮 Dos Versiones del Modelo: Desktop vs Web

> [!IMPORTANT]
> Esta es la diferencia clave entre la versión descargable de itch.io y la versión web.

### Versión Descargable (itch.io / CrazyGo.exe)

| Aspecto | Detalle |
|---|---|
| **Tamaño objetivo** | 85–100 MB está bien. El `.zip` de itch.io ya carga todo de golpe |
| **Precisión** | FP32 completo (máxima calidad) |
| **Arquitectura** | ResNet-12, 128 filtros (modelo completo sin comprimir) |
| **Backend ONNX** | `onnxruntime-node` (Node.js, binarios nativos) |
| **Velocidad** | < 15 ms por jugada en CPU i7/i9. < 5 ms si tiene GPU dedicada |
| **Integración** | El ejecutable incluye el `.onnx` en la carpeta `/resources/` del Electron/Tauri |
| **Nombre fichero** | `crazy_go_brain_fp32.onnx` |

### Versión Web (Browser / itch.io en modo HTML5)

| Aspecto | Detalle |
|---|---|
| **Tamaño objetivo** | ≤ 50 MB (carga sobre HTTP, afecta primera visita) |
| **Precisión** | FP16 cuantizado (pérdida de calidad < 0.3%, velocidad igual) |
| **Arquitectura** | ResNet-8 reducido, 96 filtros (modelo destilado) |
| **Backend ONNX** | `onnxruntime-web` con WebAssembly (WASM) + WebGL como fallback |
| **Velocidad** | 20–40 ms por jugada (WASM). Suficiente para un turno de Go |
| **Carga** | Usar `Cache-Storage API` del browser para no re-descargar en visitas posteriores |
| **Nombre fichero** | `crazy_go_brain_web.onnx` (~40–45 MB en FP16 + ResNet-8) |
| **Estrategia de carga** | Lazy load: descargar el modelo en background mientras el jugador configura la partida |

**Cómo comprimir el modelo web:**

```python
# Paso 1: Cuantización FP16
model_fp16 = model.half()

# Paso 2: Reducir arquitectura (Knowledge Distillation)
#   El modelo ResNet-8 "estudiante" aprende del ResNet-12 "maestro"
#   Loss adicional: KL-divergence entre outputs del maestro y del estudiante
student = CrazyGoNet(res_blocks=8, filters=96)
train_distillation(teacher=model_full, student=student, ...)

# Paso 3: Exportar con optimizaciones ONNX
from onnxruntime.tools import optimizer as ort_optimizer
optimized = ort_optimizer.optimize_model('brain_fp16.onnx',
    model_type='bert',  # activa fusión de capas
    opt_level=99)
optimized.save_model_to_file('crazy_go_brain_web.onnx')
```

---

## 📅 Roadmap Realista: Qué Hace Falta y Cuándo

> [!WARNING]
> El roadmap anterior de "10 días" era optimista. Este es el plan realista
> con fases bien separadas y objetivos medibles.

### Fase 0 — Prerrequisitos (¿Ya tienes esto?) → 1 día

- [ ] Python 3.10 o 3.11 instalado (`python --version`)
- [ ] CUDA 12.x instalado (driver NVIDIA actualizado)
- [ ] PyTorch detecta la GPU (`torch.cuda.is_available()`)
- [ ] `tsx` instalado en el proyecto Node.js (`npm install tsx`)

### Fase 1 — Simulador + Red Básica + Self-Play 9×9 → 3–5 días de trabajo + GPU encendida 24h+

| Día | Lo que haces tú | Lo que genera la IA |
|-----|-----------------|---------------------|
| 1 | Ejecutar `setup_ml_env.bat`, verificar GPU | Script verificado y funcionando |
| 2 | Ejecutar `crazy_go_sim.ts --test`, revisar primeras partidas | Simulador headless |
| 3 | Lanzar `train_selfplay.py`, primera hora de entrenamiento | `model.py` + `train_selfplay.py` |
| 4–5 | **GPU entrenando sola** — tú puedes trabajar en otra cosa | Red entrenando en 9×9 |
| 5 | Revisar métricas (loss bajando? policy tiene sentido?) | `onnx_export.py` |

> [!NOTE]
> Después de **~24 horas de self-play en 9×9**, la red ya jugará mejor que un principiante
> humano. Después de **~48 horas**, superará la IA heurística actual en tablero 9×9.

### Fase 2 — Escalar a 13×13 y 19×19 → GPU corriendo 3–7 días más

- Continuar el entrenamiento desde el checkpoint de Fase 1 (transfer learning).
- Añadir partidas 13×13 y 19×19 al mix (70% 9×9 / 20% 13×13 / 10% 19×19 al inicio).
- Aumentar MCTS simulations a 400 para tableros más grandes.

### Fase 3 — Integración Web + Test en CrazyGo → 2 días de trabajo

| Tarea | Quién |
|---|---|
| `onnx_export.py` → `crazy_go_brain_fp32.onnx` + `crazy_go_brain_web.onnx` | Yo (script) |
| Modificar `GoAI.worker.ts` para cargar ONNX y usar Policy Head | Yo (código) |
| Modificar `AnalysisEngine.ts` para usar Value Head como Winrate | Yo (código) |
| Modificar `TerritoryScorer.ts` para usar Ownership Head | Yo (código) |
| Tú pruebas contra la IA en el juego y das feedback | Tú |

### Fase 4 — Topologías Asimétricas y Campeones → Futuro (después de Fase 3 validada)

- Añadir tableros hexagonales, triangulares y procedurales al simulador.
- Añadir mecánicas de campeones al tensor de entrada (canales 11–14).
- Reentrenar desde checkpoint de Fase 2 (no desde cero).

---

## 💡 La Pregunta Sobre la Fase de Disputa de Territorio

> **"Algunas apps ponen la regla de que pueden seguir jugando los jugadores si piensan que
> no poseen ciertamente esa cantidad de territorio. ¿Cómo se implementa? ¿Es necesaria?"**

**Cómo funciona en el Go real (Reglas Japonesas estrictas):**
Tras los dos pases, el árbitro (o los jugadores de mutuo acuerdo) marcan las piedras que
consideran muertas. Si un jugador disputa que su grupo está muerto, puede pedir reanudación.
Los jugadores vuelven a jugar hasta que el grupo es capturado (o demostrado vivo). Las piedras
que el oponente no puede capturar → vivas. Las que sí captura → muertas.

**¿Cómo se implementaría en Crazy Go?**
1. Tras `isGameOver = true`, mostrar el tablero con las piedras muertas marcadas automáticamente.
2. Añadir botón "Disputar esta piedra" que permita marcarla como "en disputa".
3. Si hay al menos 1 disputa → reanuda partida en modo "disputa": solo se puede jugar en zonas
   relevantes a la disputa (requiere lógica compleja de restricción de movimientos).
4. Cuando ambos pasan de nuevo → fin definitivo.

**¿Es necesario para el entrenamiento de ML? → NO, definitivamente.**
- Las partidas de self-play terminan limpiamente por doble pase.
- Los dos agentes del self-play nunca tendrán desacuerdo — ambos usan el mismo motor.
- El Ownership Head ya resuelve el problema mejor que el veredicto humano.
- **Decisión:** No implementar ahora. Añadir en versión futura si se añade modo torneo
  competitivo con árbitro (Fase 5 del proyecto).

---

## 🗓️ Resumen: Qué Necesitas Hacer Tú

### Esta semana (para empezar el ML):
1. ✅ Verificar que Python 3.10+ y CUDA están instalados.
2. ✅ Decirme si quieres empezar por el simulador headless o por el entorno Python.
3. ✅ Reservar tiempo de GPU: el entrenamiento necesita 24–48h continuas para Fase 1.

### Lo que yo haré por ti (cuando lo pidas):
1. Generar `ml_training/setup_ml_env.bat` — instalación automática de entorno Python.
2. Generar `ml_training/crazy_go_sim.ts` — simulador headless que reutiliza tu código.
3. Generar `ml_training/model.py` — CrazyGoNet con ResNet-12 y 3 cabezas.
4. Generar `ml_training/train_selfplay.py` — bucle completo de entrenamiento con checkpoints.
5. Generar `ml_training/onnx_export.py` — exportador FP32 (desktop) y FP16+ResNet-8 (web).
6. Modificar `GoAI.worker.ts`, `AnalysisEngine.ts` y `TerritoryScorer.ts` para integrar el ONNX.

> [!TIP]
> **Orden óptimo de trabajo:** Pide primero el simulador (`crazy_go_sim.ts`) y el entorno
> (`setup_ml_env.bat`). Con el simulador puedes verificar que las reglas del Go funcionan
> correctamente antes de invertir horas de GPU en entrenamiento.

---

## 📊 Comparativa: IA Heurística Actual vs IA con Red Neuronal

| Aspecto | Heurística actual (`GoAI.ts`) | Red Neuronal (post-Fase 2) |
|---|---|---|
| Conteo de territorio | BFS (exacto pero sin contexto) | Ownership Head (estima vida/muerte) |
| Winrate en tiempo real | Softmax heurístico (sesgado) | Value Head entrenado (calibrado) |
| Calidad de jugadas | Minimax 3-ply + reglas Fuseki | MCTS + Policy Head (profundidad variable) |
| Topologías asimétricas | Funciona (grafo genérico) | Fase 1: solo cuadrado; Fase 4: todas |
| Tiempo de respuesta | < 5 ms | 15–40 ms (aceptable) |
| Mejora posible | Limitada (reglas fijas) | Ilimitada (más self-play = mejor) |
| Tamaño | ~0 MB (código TypeScript) | 45–100 MB (modelo ONNX) |

> [!NOTE]
> Mientras la red no esté entrenada, el Winrate usa la heurística Softmax actual.
> La integración es transparente — **sin tocar la interfaz ni los `.zip`** — solo cambia
> qué función interna se llama en `GoAI.worker.ts`, `AnalysisEngine.ts` y `TerritoryScorer.ts`.
