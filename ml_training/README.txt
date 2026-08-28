================================================================================
  CrazyGoNet - Machine Learning Training System (AlphaZero-Style)
  RTX 4070 Ti SUPER (16 GB VRAM) + Python 3.11 + CUDA 12.9
================================================================================

PIPELINE SCRIPTS AVAILABLE:
  setup_ml_env.bat        - One-time environment setup (PyTorch CUDA + ONNX + tsx)
  run_phase1.bat          - Phase 1: 9x9 Pure Go fundamentals (50,000 steps) [COMPLETED]
  run_phase2.bat          - Phase 2: 9x9 Deep Mastery (50,000 -> 150,000 steps)
  run_phase3_13x13.bat    - Phase 3: 13x13 Medium Boards (150,000 -> 250,000 steps)
  run_phase4_19x19.bat    - Phase 4: 19x19 Full Goban Mastery (250,000 -> 400,000 steps)
  export_all_models.bat   - Exports latest checkpoint to ONNX (Desktop + Web)

================================================================================
HOW TO USE IN YOUR REMOTE PC:
================================================================================

1. Copy the updated "ml_training" folder to your remote PC.
2. In your remote PC console (or double clicking the .bat files):

   - To run Phase 2 (9x9 Advanced Mastery):
     ml_training\run_phase2.bat

   - To run Phase 3 (13x13 Boards):
     ml_training\run_phase3_13x13.bat

   - To run Phase 4 (19x19 Grandmaster):
     ml_training\run_phase4_19x19.bat

   - To export to ONNX at any time:
     ml_training\export_all_models.bat

3. The exported ONNX files in "src\ai\models\" are:
   - crazy_go_brain_fp32.onnx  (~12.6 MB, Desktop PC version)
   - crazy_go_brain_web.onnx   (~6.3 MB, Web browser version)

4. Both models are automatically integrated into:
   - src/ai/NeuralNetAdapter.ts
   - src/ai/GoAI.worker.ts  (Neural Policy move calculation)
   - src/core/AnalysisEngine.ts (Real-time Value Head Winrate)
================================================================================
