@echo off
chcp 65001 > nul
cd /d "%~dp0.."
echo.
echo ============================================================
echo  CrazyGoNet ML Training - Phase 4 (19x19 Full Goban Mastery)
echo  Grandmaster Strategy - Resuming from Step 250,000
echo ============================================================
echo.

REM --- Check virtual environment exists ---
if not exist "ml_venv\Scripts\activate.bat" goto error_no_venv

REM --- Activate Python environment ---
call ml_venv\Scripts\activate.bat
echo [OK] Python environment activated.

REM --- Create output directories ---
if not exist "ml_training\data\phase4" mkdir "ml_training\data\phase4"

echo.
echo ============================================================
echo  STEP 1 - Generating 1500 games on 19x19
echo  Expected time: 4 to 8 minutes
echo ============================================================
echo.

call npx tsx ml_training\generate_games.ts --games 1500 --size 19 --batch-size 20 --output ml_training\data\phase4
if errorlevel 1 goto error_gen

echo.
echo ============================================================
echo  STEP 2 - Training CrazyGoNet on 19x19 (Steps 250,000 -> 400,000)
echo ============================================================
echo.

python ml_training\train.py --board-size 19 --data ml_training\data\phase4 --resume ml_training\checkpoints\latest.pt --checkpoint-dir ml_training\checkpoints --max-steps 400000

echo.
echo ============================================================
echo  Phase 4 training complete!
echo  Export new models with: python ml_training\onnx_export.py --board-size 19
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
