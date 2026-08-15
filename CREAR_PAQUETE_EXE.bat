@echo off
setlocal
cd /d "%~dp0"
title Empaquetador de Crazy Go a EXE Portable

echo ======================================================
echo    EMPAQUETADOR AUTOMATICO DE CRAZY GO (.EXE)
echo ======================================================
echo.

echo [1/4] Compilando el juego con Vite y TypeScript...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo.
    echo Error durante la compilacion de Vite.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Generando ejecutable nativo Windows (CrazyGo.exe)...
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /out:CrazyGo.exe scripts\Launcher.cs >nul
if %errorlevel% neq 0 (
    echo.
    echo Error al compilar CrazyGo.exe.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Preparando carpeta portable distribuible...
if exist "CrazyGo_Portable" rmdir /s /q "CrazyGo_Portable"
mkdir "CrazyGo_Portable"
mkdir "CrazyGo_Portable\dist"

xcopy /E /I /Y "dist" "CrazyGo_Portable\dist" >nul
copy /Y "CrazyGo.exe" "CrazyGo_Portable\CrazyGo.exe" >nul

echo CRAZY GO - JUEGO PORTABLE > "CrazyGo_Portable\LEEME.txt"
echo. >> "CrazyGo_Portable\LEEME.txt"
echo INSTRUCCIONES: >> "CrazyGo_Portable\LEEME.txt"
echo 1. Haz doble clic en CrazyGo.exe para jugar. >> "CrazyGo_Portable\LEEME.txt"
echo 2. No requiere instalar nada ni tener Node.js instalado. >> "CrazyGo_Portable\LEEME.txt"

echo.
echo [4/4] Creando archivo comprimido ZIP listo para enviar a tus amigos...
if exist "CrazyGo_Portable.zip" del /f /q "CrazyGo_Portable.zip"
powershell -NoProfile -Command "Compress-Archive -Path 'CrazyGo_Portable\*' -DestinationPath 'CrazyGo_Portable.zip' -Force"

echo.
echo ======================================================
echo  EMPAQUETADO COMPLETADO CON EXITO
echo ======================================================
echo.
echo  Archivo listo para enviar: CrazyGo_Portable.zip
echo  Tu amigo solo tiene que descomprimir y hacer doble
echo  clic en 'CrazyGo.exe' para jugar.
echo ======================================================
echo.
