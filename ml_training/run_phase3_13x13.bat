@echo off
chcp 65001 > nul
cd /d "%~dp0.."
echo.
echo ============================================================
echo  CrazyGoNet ML Training - Phase 3 (13x13 Medium Boards)
echo  Fuseki + Mid-Game Combat - Resuming from Step 150,000
echo ============================================================
echo.

REM --- Check virtual environment exists ---
if not exist "ml_venv\Scripts\activate.bat" goto error_no_venv

REM --- Activate Python environment ---
call ml_venv\Scripts\activate.bat
echo [OK] Python environment activated.

REM --- Create output directories ---
if not exist "ml_training\data\phase3" mkdir "ml_training\data\phase3"

echo.
echo ============================================================
echo  STEP 1 - Generating 1500 games on 13x13
echo  Expected time: 2 to 4 minutes
echo ============================================================
echo.

call npx tsx ml_training\generate_games.ts --games 1500 --size 13 --batch-size 50 --output ml_training\data\phase3
if errorlevel 1 goto error_gen

echo.
echo ============================================================
echo  STEP 2 - Training CrazyGoNet on 13x13 (Steps 150,000 -> 250,000)
echo ============================================================
echo.

python ml_training\train.py --board-size 13 --data ml_training\data\phase3 --resume ml_training\checkpoints\latest.pt --checkpoint-dir ml_training\checkpoints --max-steps 250000

echo.
echo ============================================================
echo  Phase 3 training complete!
echo  Export new models with: python ml_training\onnx_export.py --board-size 13
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
