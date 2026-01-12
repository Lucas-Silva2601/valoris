@echo off
echo ======================================
echo   VALORIS - Iniciando Ambiente Dev
echo ======================================
echo.

REM Verificar se as portas estão em uso
echo [1/4] Verificando portas...
netstat -ano | findstr ":3001 :5173" >nul
if %errorlevel% equ 0 (
    echo AVISO: Porta 3001 ou 5173 ja esta em uso
    echo.
)

REM Iniciar backend
echo [2/4] Iniciando backend (porta 3001)...
start "Valoris Backend" cmd /k "cd backend && npm run dev"
timeout /t 5 /nobreak >nul

REM Iniciar frontend
echo [3/4] Iniciando frontend (porta 5173)...
start "Valoris Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo [4/4] Ambiente iniciado!
echo.
echo ======================================
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo ======================================
echo.
echo Pressione qualquer tecla para sair...
pause >nul

