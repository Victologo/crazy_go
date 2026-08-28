@echo off
chcp 65001 > nul
cd /d "%~dp0.."
echo.
echo ============================================================
echo  CrazyGoNet ML Training - ENTRENAMIENTO NOCTURNO COMPLETO
echo  FASE 4 (19x19 Gran Maestro) + FASE 5 (Crazy Go Asim?trico)
echo  Pasos: 250,000 -> 700,000 con RTX 4070 Ti SUPER
echo ============================================================
echo.

REM --- Check virtual environment exists ---
if not exist "ml_venv\Scripts\activate.bat" goto error_no_venv

REM --- Activate Python environment ---
call ml_venv\Scripts\activate.bat
echo [OK] Python environment activated.

REM --- Create output directories ---
if not exist "ml_training\data\phase4" mkdir "ml_training\data\phase4"
if not exist "ml_training\data\phase5" mkdir "ml_training\data\phase5"
if not exist "ml_training\checkpoints" mkdir "ml_training\checkpoints"
if not exist "src\ai\models"           mkdir "src\ai\models"

echo.
echo ============================================================
echo  [BLOQUE 1/2] FASE 4: 19x19 Gran Maestro Tradicional
echo ============================================================
echo.

echo Generando 1500 partidas en 19x19...
call npx tsx ml_training\generate_games.ts --games 1500 --size 19 --batch-size 20 --output ml_training\data\phase4
if errorlevel 1 goto error_gen

echo.
echo Entrenando en GPU 19x19 (Pasos 250,000 -> 450,000)...
python ml_training\train.py --board-size 19 --data ml_training\data\phase4 --resume ml_training\checkpoints\latest.pt --checkpoint-dir ml_training\checkpoints --max-steps 450000

echo.
echo ============================================================
echo  [BLOQUE 2/2] FASE 5: Crazy Go Topologias Asimetricas
echo  (Circulares, Triangulares, Erosionados y Fauces Oni)
echo ============================================================
echo.

echo Generando 1500 partidas en topologias mixtas (13x13)...
call npx tsx ml_training\generate_games.ts --games 1500 --size 13 --topology mixed --batch-size 25 --output ml_training\data\phase5
if errorlevel 1 goto error_gen

echo Generando 1500 partidas en topologias mixtas (19x19)...
call npx tsx ml_training\generate_games.ts --games 1500 --size 19 --topology mixed --batch-size 20 --output ml_training\data\phase5
if errorlevel 1 goto error_gen

echo.
echo Entrenando en GPU Crazy Go Asimetrico (Pasos 450,000 -> 700,000)...
python ml_training\train.py --board-size 19 --data ml_training\data\phase5 --resume ml_training\checkpoints\latest.pt --checkpoint-dir ml_training\checkpoints --max-steps 700000

echo.
echo ============================================================
echo  EXPORTANDO MODELOS FINALES A ONNX (DESKTOP + WEB)
echo ============================================================
echo.

python ml_training\onnx_export.py --board-size 19

echo.
echo ================================================================================
echo  ?ENTRENAMIENTO NOCTURNO FINALIZADO CON ?XITO! (700,000 PASOS)
echo  Los modelos listos para jugar estan en: src\ai\models\
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
