@echo off
chcp 65001 >nul
echo ======================================================
echo    🚀 CRAZY GO - SUBIR ACTUALIZACIÓN A GITHUB / WEB
echo ======================================================
echo.
echo [1/3] Compilando juego web con TypeScript y Vite...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Falló la compilación. Revisa los errores antes de subir.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Empaquetando versiones portables y web...
powershell -Command "Compress-Archive -Path dist\* -DestinationPath CrazyGo_Web_Itch.zip -Force; Compress-Archive -Path dist\*, JUGAR_CRAZY_GO.bat -DestinationPath CrazyGo_Portable.zip -Force"

echo.
echo [3/3] Subiendo cambios a GitHub (git add, commit y push)...
git add -A
git commit -m "Auto-update: %DATE% %TIME%"
git push origin main

echo.
echo ======================================================
echo    ✅ ¡ACTUALIZACIÓN SUBIDA CON ÉXITO A GITHUB!
echo ======================================================
echo GitHub desplegará automáticamente la nueva versión.
echo Puedes ver el progreso en:
echo https://github.com/Victologo/crazy_go/actions
echo.
pause
