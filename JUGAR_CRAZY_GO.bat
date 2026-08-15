@echo off
title Crazy Go - Roguelite
echo ========================================================
echo              ⚔️ CRAZY GO - ROGUELITE DE GO ⚔️
echo ========================================================
echo.
echo [1/2] Abriendo Crazy Go en tu navegador predeterminado...
start "" "http://localhost:5173"
echo [2/2] Iniciando servidor local...
echo.
echo Presiona Ctrl + C en esta ventana cuando quieras cerrar el juego.
echo.
npx -y serve dist -l 5173
