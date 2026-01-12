@echo off
echo ======================================
echo   VALORIS - Encerrando Servidores
echo ======================================
echo.

REM Encontrar e matar processos nas portas 3001 e 5173
echo [1/2] Encerrando backend (porta 3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/2] Encerrando frontend (porta 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Servidores encerrados!
echo.
pause

