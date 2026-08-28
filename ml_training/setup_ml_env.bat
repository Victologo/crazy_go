@echo off
chcp 65001 > nul
echo.
echo ============================================================
echo  CrazyGoNet ML Training - Environment Setup
echo  RTX 4070 + CUDA 12 + PyTorch 2.x
echo ============================================================
echo.

REM --- Check Python ---
python --version >nul 2>&1
if errorlevel 1 goto error_python
echo [OK] Python found.

REM --- Check Node.js ---
node --version >nul 2>&1
if errorlevel 1 goto error_node
echo [OK] Node.js found.

REM --- Check nvidia-smi ---
nvidia-smi >nul 2>&1
if errorlevel 1 (
    echo [INFO] nvidia-smi not in PATH. PyTorch will attempt direct CUDA detection.
) else (
    echo [OK] NVIDIA GPU detected.
)

echo.
echo [1/5] Creating Python virtual environment ml_venv...
python -m venv ml_venv
if errorlevel 1 goto error_venv

echo [2/5] Activating virtual environment...
call ml_venv\Scripts\activate.bat

echo [3/5] Upgrading pip...
python -m pip install --upgrade pip --quiet

echo [4/5] Installing PyTorch 2.x with CUDA 12.1 support...
echo       This may take several minutes depending on connection speed...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
if errorlevel 1 goto error_pytorch

echo [5/5] Installing other ML dependencies: onnx, onnxruntime-gpu, numpy, tqdm...
pip install onnx onnxruntime-gpu numpy tqdm --quiet
if errorlevel 1 goto error_deps

echo.
echo [OK] Installing tsx for TypeScript Go simulator...
call npm install tsx --save-dev --quiet

echo.
echo ============================================================
echo  Running GPU verification...
echo ============================================================
python ml_training\verify_setup.py

echo.
echo ============================================================
echo  Setup COMPLETE!
echo  Next step: run ml_training\run_phase1.bat to start training
echo ============================================================
pause
exit /b 0

:error_python
echo [ERROR] Python not found. Make sure Python 3.10 or 3.11 is installed
echo         and added to your PATH environment variable.
pause
exit /b 1

:error_node
echo [ERROR] Node.js not found. Install Node.js 18+ from nodejs.org
pause
exit /b 1

:error_venv
echo [ERROR] Failed to create virtual environment.
pause
exit /b 1

:error_pytorch
echo [ERROR] Failed to install PyTorch. Check your internet connection.
pause
exit /b 1

:error_deps
echo [ERROR] Failed to install dependencies.
pause
exit /b 1
