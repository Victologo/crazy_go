@echo off
chcp 65001 > nul
cd /d "%~dp0.."
echo.
echo ============================================================
echo  CrazyGoNet ML Training - Phase 1
echo  9x9 Pure Go - Random Self-Play - RTX 4070 + CUDA
echo ============================================================
echo.

REM --- Check virtual environment exists ---
if not exist "ml_venv\Scripts\activate.bat" goto error_no_venv

REM --- Check Node.js ---
node --version >nul 2>&1
if errorlevel 1 goto error_no_node

REM --- Activate Python environment ---
call ml_venv\Scripts\activate.bat
echo [OK] Python environment activated.

REM --- Create output directories ---
if not exist "ml_training\data\phase1" mkdir "ml_training\data\phase1"
if not exist "ml_training\checkpoints" mkdir "ml_training\checkpoints"
if not exist "src\ai\models"           mkdir "src\ai\models"

echo.
echo ============================================================
echo  STEP 1 - Generating 1000 self-play games on 9x9
echo  Expected time: 2 to 5 minutes
echo ============================================================
echo.

call npx tsx ml_training\generate_games.ts --games 1000 --size 9 --batch-size 100 --output ml_training\data\phase1
if errorlevel 1 goto error_gen

echo.
echo ============================================================
echo  STEP 2 - Training CrazyGoNet on GPU
echo  Checkpoints saved every 500 steps in ml_training\checkpoints
echo  Press Ctrl+C to pause - training can be resumed any time.
echo ============================================================
echo.

python ml_training\train.py --data ml_training\data\phase1 --checkpoint-dir ml_training\checkpoints --max-steps 50000

echo.
echo ============================================================
echo  Training session ended.
echo  To resume: run this script again - it will auto-detect latest checkpoint.
echo  To export: python ml_training\onnx_export.py
echo ============================================================
pause
exit /b 0

:error_no_venv
echo [ERROR] Virtual environment ml_venv not found.
echo         Please run ml_training\setup_ml_env.bat first!
pause
exit /b 1

:error_no_node
echo [ERROR] Node.js not found. Please install Node.js from nodejs.org
pause
exit /b 1

:error_gen
echo [ERROR] Game generation failed.
pause
exit /b 1
