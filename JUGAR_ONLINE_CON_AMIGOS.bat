@echo off
title Crazy Go - Servidor Multijugador Online
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================
echo    CRAZY GO - SERVIDOR MULTIJUGADOR EN VIVO
echo ======================================================
echo.
echo [1/3] Compilando la version mas reciente del juego...
call npm run build

echo.
echo [2/3] Iniciando servidor web de alta velocidad...
start /b "" npx vite preview --host 0.0.0.0 --port 5173 >nul 2>&1

echo.
echo [3/3] Conectando tunel seguro de internet...
timeout /t 2 /nobreak >nul

node scripts/share.js
pause
