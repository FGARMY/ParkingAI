@echo off
title Park_AI - Full Stack Launcher
color 0A

echo ============================================
echo         Park_AI - Starting Services
echo ============================================
echo.

:: Start Backend
echo [1/2] Starting Backend (FastAPI)...
cd /d "%~dp0backend"
start "Park_AI Backend" cmd /k "..\parking_env\Scripts\python.exe main.py"

:: Wait a moment for backend to boot
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Frontend (Next.js)...
cd /d "%~dp0frontend"
start "Park_AI Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:3000
echo ============================================
echo.
echo Both services are running in separate windows.
echo Close this window anytime - services will keep running.
echo To stop, close the Backend and Frontend windows.
pause
