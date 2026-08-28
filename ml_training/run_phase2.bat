@echo off
chcp 65001 > nul
cd /d "%~dp0.."
echo.
echo ============================================================
echo  CrazyGoNet ML Training - Phase 2 (Advanced Mastery)
echo  9x9 Deep Self-Play - Resuming from Step 50,000 to 150,000
echo ============================================================
echo.

REM --- Check virtual environment exists ---
if not exist "ml_venv\Scripts\activate.bat" goto error_no_venv

REM --- Check previous checkpoint exists ---
if not exist "ml_training\checkpoints\latest.pt" goto error_no_checkpoint

REM --- Activate Python environment ---
call ml_venv\Scripts\activate.bat
echo [OK] Python environment activated.

REM --- Create output directories ---
if not exist "ml_training\data\phase2" mkdir "ml_training\data\phase2"

echo.
echo ============================================================
echo  STEP 1 - Generating 2000 self-play games (~300,000 positions)
echo  Expected time: 1 to 2 minutes
echo ============================================================
echo.

call npx tsx ml_training\generate_games.ts --games 2000 --size 9 --batch-size 100 --output ml_training\data\phase2
if errorlevel 1 goto error_gen

echo.
echo ============================================================
echo  STEP 2 - Training CrazyGoNet on GPU (Steps 50,000 -> 150,000)
echo  Resuming from ml_training\checkpoints\latest.pt
echo ============================================================
echo.

python ml_training\train.py --data ml_training\data\phase2 --resume ml_training\checkpoints\latest.pt --checkpoint-dir ml_training\checkpoints --max-steps 150000

echo.
echo ============================================================
echo  Phase 2 training complete!
echo  Export new models with: python ml_training\onnx_export.py
echo ============================================================
pause
exit /b 0

:error_no_venv
echo [ERROR] Virtual environment ml_venv not found.
pause
exit /b 1

:error_no_checkpoint
echo [ERROR] ml_training\checkpoints\latest.pt not found. Run Phase 1 first!
pause
exit /b 1

:error_gen
echo [ERROR] Game generation failed.
pause
exit /b 1
