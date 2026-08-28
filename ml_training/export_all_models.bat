@echo off
chcp 65001 > nul
cd /d "%~dp0.."
echo.
echo ============================================================
echo  CrazyGoNet - Export All ONNX Models to src/ai/models
echo ============================================================
echo.

if not exist "ml_venv\Scripts\activate.bat" goto error_no_venv

call ml_venv\Scripts\activate.bat
echo [OK] Python environment activated.

echo Exporting ONNX models from latest checkpoint...
python ml_training\onnx_export.py

echo.
echo ============================================================
echo  Models exported to src/ai/models/ and public/models/
echo ============================================================
pause
exit /b 0

:error_no_venv
echo [ERROR] Virtual environment ml_venv not found.
pause
exit /b 1
