@echo off
chcp 65001 > nul
cd /d "%~dp0.."
echo.
echo ============================================================
echo  CrazyGoNet ML Training - NEW START (Smart Policy)
echo  100k Steps on Smart Games
echo ============================================================
echo.

REM --- Check virtual environment exists ---
if not exist "ml_venv\Scripts\activate.bat" goto error_no_venv

REM --- Activate Python environment ---
call ml_venv\Scripts\activate.bat
echo [OK] Python environment activated.

REM --- Create output directories ---
if not exist "ml_training\data\phase_new" mkdir "ml_training\data\phase_new"

echo.
echo ============================================================
echo  STEP 1 - Generating 1000 Smart Self-Play games
echo  Expected time: 2 to 5 minutes
echo ============================================================
echo.

call npx tsx ml_training\generate_games.ts --games 200 --size 9 --batch-size 50 --output ml_training\data\phase_new
if errorlevel 1 goto error_gen

echo.
echo ============================================================
echo  STEP 2 - Training CrazyGoNet on GPU (20,000 steps)
echo  Starting from SCRATCH with double capacity!
echo ============================================================
echo.

python ml_training\train.py --data ml_training\data\phase_new --checkpoint-dir ml_training\checkpoints --max-steps 20000 --batch-size 128

echo.
echo ============================================================
echo  New Training Complete!
echo  Export new models with: python ml_training\onnx_export.py
echo ============================================================
pause
exit /b 0

:error_no_venv
echo [ERROR] Virtual environment ml_venv not found.
pause
exit /b 1

:error_gen
echo [ERROR] Game generation failed.
pause
exit /b 1
