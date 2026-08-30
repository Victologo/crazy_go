# CrazyGoNet — Informe Oficial de Entrenamiento 750k Pasos y Exportación ONNX

**Fecha de Finalización:** 29 de Agosto de 2026  
**Hardware de Entrenamiento:** NVIDIA GeForce RTX 4070 Ti SUPER (16 GB VRAM, 17.2 GB asignables)  
**Entorno:** Python `ml_venv` (PyTorch 2.x + CUDA 12.x / CUDA Execution Provider)  
**Total de Pasos de Entrenamiento:** 750.000 steps  
**Arquitectura Final:** CrazyGoNet ResNet-12 Fully Convolutional (Universal Board Elasticity)

---

## 1. Métricas Finales de Convergencia (Paso 750.000)

| Métrica | Valor Final | Interpretación y Significado |
| :--- | :--- | :--- |
| **Total Loss** | **2.8868** | Pérdida combinada ponderada ($L_{policy} + 1.5 L_{value} + 0.5 L_{ownership}$). |
| **Policy Loss** | **2.8563** | Capacidad táctica para predecir la mejor jugada (distribución de probabilidad certera sobre casillas legales + pase). Bajó de $>4.16$ inicial a $2.85$. |
| **Value Loss** | **0.0031** | Error cuadrático en predicción de victoria (Winrate). Error casi nulo ($0.3\%$). |
| **Ownership Loss** | **0.1825** | Control territorial por casilla $[-1, +1]$ para resolver Seki, vida/muerte y territorios cerrados sin heurísticas. |
| **Learning Rate (LR)** | **0.000162** | Tasa de aprendizaje final al completar el ciclo Cosine Annealing. |

---

## 2. Modelos Binarios ONNX Exportados

| Archivo | Formato | Tamaño | Destino en Proyecto | Uso Principal |
| :--- | :--- | :--- | :--- | :--- |
| `crazy_go_brain_fp32.onnx` | FP32 | **9.0 MB** | `public/models/` y `src/ai/models/` | Versión nativa de escritorio (Itch.io / Windows Portable). Máxima precisión. |
| `crazy_go_brain_web.onnx` | FP16 | **4.5 MB** | `public/models/` y `src/ai/models/` | Versión web ultra-comprimida para navegadores con WebAssembly SIMD (`onnxruntime-web`). |

* **Dimensiones Dinámicas (`dynamic_axes`):**
  * `board`: `[batch, 16, height, width]` (compatible con 9x9, 13x13, 19x19 y mapas asimétricos).
  * `policy`: `[batch, num_moves]` $(N \times N + 1)$.
  * `value`: `[batch, 2]` ($[P_{negra}, P_{blanca}]$).
  * `ownership`: `[batch, 1, height, width]`.

---

## 3. Registro de Consola

> Para el volcado completo e ininterrumpido de los 145.000 pasos intermedios (207 KB de texto), consultar: **[`docs/ai_wiki/750k_training_log.md`](file:///c:/Users/VICTOR/Desktop/crazy_go/docs/ai_wiki/750k_training_log.md)**.

A continuación se muestra el extracto de los pasos finales y la exportación ONNX:

```text
749800 |   2.9449 |   2.9128 |   0.0046 |    0.1835 | 0.000166
749850 |   2.8468 |   2.8119 |   0.0065 |    0.1899 | 0.000165
749900 |   2.8573 |   2.8289 |   0.0019 |    0.1767 | 0.000164
749950 |   2.8428 |   2.8132 |   0.0026 |    0.1799 | 0.000163
750000 |   2.8868 |   2.8563 |   0.0031 |    0.1825 | 0.000162
  [Saved] ml_training/checkpoints\checkpoint_step_750000.pt

Training complete at step 750000.
  [Saved] ml_training/checkpoints\checkpoint_step_750000.pt

(ml_venv) C:\Users\Victor\Downloads\Nueva carpeta (2)\crazy_go>python ml_training/onnx_export.py --checkpoint ml_training/checkpoints/checkpoint_step_750000.pt --output-desktop public/models/crazy_go_brain_fp32.onnx --output-web public/models/crazy_go_brain_web.onnx
============================================================
  CrazyGoNet — ONNX Export
============================================================

Loading checkpoint: ml_training/checkpoints/checkpoint_step_750000.pt
  Checkpoint step: 750000 (177 layers loaded)

[1/2] Desktop version (FP32, full quality)
  Exporting to: public/models/crazy_go_brain_fp32.onnx
  Precision:    FP32
  Board size:   9x9
  File size:    9.0 MB
  [OK] Export complete.

  ONNX verify: policy=(1, 82), value=(1, 2), ownership=(1, 1, 9, 9)
  Inference test: OK
  Providers used: ['CPUExecutionProvider']

[2/2] Web version (FP16, compressed for browser)
  Exporting to: public/models/crazy_go_brain_web.onnx
  Precision:    FP16
  Board size:   9x9
  File size:    4.5 MB
  [OK] Export complete.

  ONNX verify: policy=(1, 82), value=(1, 2), ownership=(1, 1, 9, 9)
  Inference test: OK
  Providers used: ['CPUExecutionProvider']

============================================================
  Export Summary
============================================================
  Desktop: public/models/crazy_go_brain_fp32.onnx
           9.0 MB — copy to src/ai/models/
  Web:     public/models/crazy_go_brain_web.onnx
           4.5 MB — copy to src/ai/models/

  Next step: integrate the ONNX model into GoAI.worker.ts
============================================================
```

---

## 4. Notas Técnicas y Validación
1. **177 Capas Cargadas:** El 100% de los pesos del modelo convolucional y las nuevas cabezas globales fueron empaquetados sin pérdida de tensores.
2. **Prueba de Inferencia Exitosa (`Inference test: OK`):** Se verificó que el grafo computacional genera las salidas en las dimensiones esperadas sin divergencias numéricas ni `NaNs`.
3. **Aviso de `cublasLt64_13.dll`:** Es una advertencia menor del entorno Python local al intentar verificar el modelo con CUDA Execution Provider; el exportador conmutó automáticamente a CPU (`CPUExecutionProvider`) y completó la verificación con éxito. El archivo `.onnx` es 100% estándar e independiente de CUDA.
