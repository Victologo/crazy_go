@echo off
chcp 65001 > nul
cd /d "%~dp0.."
echo.
echo ============================================================
echo  CrazyGoNet ML Training - FASE 5 (Topolog?as Asim?tricas)
echo  Circulares, Triangulares, Erosionados y Fauces Oni
echo  Resumiendo desde Paso 450,000 hasta 700,000 (GPU)
echo ============================================================
echo.

REM --- Check virtual environment exists ---
if not exist "ml_venv\Scripts\activate.bat" goto error_no_venv

REM --- Activate Python environment ---
call ml_venv\Scripts\activate.bat
echo [OK] Python environment activated.

REM --- Create output directories ---
if not exist "ml_training\data\phase5" mkdir "ml_training\data\phase5"
if not exist "ml_training\checkpoints" mkdir "ml_training\checkpoints"
if not exist "src\ai\models"           mkdir "src\ai\models"

echo.
echo ============================================================
echo  STEP 1 - Generando partidas en topologias mixtas
echo ============================================================
echo.

echo Generando 1500 partidas en topologias mixtas (13x13)...
call npx tsx ml_training\generate_games.ts --games 1500 --size 13 --topology mixed --batch-size 25 --output ml_training\data\phase5
if errorlevel 1 goto error_gen

echo Generando 1500 partidas en topologias mixtas (19x19)...
call npx tsx ml_training\generate_games.ts --games 1500 --size 19 --topology mixed --batch-size 20 --output ml_training\data\phase5
if errorlevel 1 goto error_gen

echo.
echo ============================================================
echo  STEP 2 - Entrenando CrazyGoNet Asimetrico en GPU
echo  (Pasos 450,000 -> 700,000)...
echo ============================================================
echo.

python ml_training\train.py --board-size 19 --data ml_training\data\phase5 --resume ml_training\checkpoints\latest.pt --checkpoint-dir ml_training\checkpoints --max-steps 700000

echo.
echo ============================================================
echo  EXPORTANDO MODELOS FINALES A ONNX (DESKTOP + WEB)
echo ============================================================
echo.

python ml_training\onnx_export.py --board-size 19

echo.
echo ================================================================================
echo  ?FASE 5 COMPLETADA CON ?XITO! (700,000 PASOS DE MAESTR?A TOTAL)
echo  Los modelos finales listos para jugar estan en: src\ai\models\
echo ================================================================================
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
