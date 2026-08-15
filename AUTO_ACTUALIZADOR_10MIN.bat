@echo off
chcp 65001 >nul
title Crazy Go - Auto-Actualizador en Segundo Plano (Cada 10 Minutos)

echo ======================================================================
echo    🔄 CRAZY GO - AUTO-ACTUALIZADOR CONTINUO (CADA 10 MINUTOS)
echo ======================================================================
echo  Este script revisa cada 10 minutos si has hecho cambios en el código.
echo  Si detecta cambios, compila y los sube automáticamente a GitHub e Itch.io.
echo  Puedes minimizar esta ventana y dejarla funcionando de fondo.
echo ======================================================================
echo.

:loop
echo [%TIME:~0,8%] Comprobando si hay cambios locales en el proyecto...

:: Verificar si hay cambios en git
for /f %%i in ('git status --porcelain') do (
    goto has_changes
)

echo [%TIME:~0,8%] No hay cambios nuevos. Esperando 10 minutos para la siguiente revision...
timeout /t 600 /nobreak >nul
goto loop

:has_changes
echo.
echo ======================================================================
echo  ⚡ ¡CAMBIOS DETECTADOS! Iniciando compilacion y subida automatica...
echo ======================================================================
echo.

echo [1/3] Compilando juego con TypeScript y Vite...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Falló la compilación. Se reintentará en 10 minutos.
    timeout /t 600 /nobreak >nul
    goto loop
)

echo [2/3] Empaquetando versiones portables y web...
powershell -NoProfile -Command "Compress-Archive -Path dist\* -DestinationPath CrazyGo_Web_Itch.zip -Force; Compress-Archive -Path dist\*, JUGAR_CRAZY_GO.bat -DestinationPath CrazyGo_Portable.zip -Force"

echo [3/3] Subiendo a GitHub e Itch.io (git push)...
git add -A
git commit -m "Auto-sync: %DATE% %TIME%"
git push origin main

echo.
echo ✅ ¡SUBIDA COMPLETADA CON ÉXITO! GitHub e Itch.io se estan actualizando.
echo Próxima comprobación en 10 minutos...
echo.

timeout /t 600 /nobreak >nul
goto loop
