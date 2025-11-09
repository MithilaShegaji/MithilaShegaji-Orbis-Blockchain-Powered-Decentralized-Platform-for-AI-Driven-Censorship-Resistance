@echo off
echo ========================================
echo Starting Orbis Platform Services
echo ========================================
echo.

REM Start MongoDB (if not already running)
echo Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo MongoDB not running. Please start MongoDB first!
    echo Run: mongod
    pause
    exit /b 1
) else (
    echo ✓ MongoDB is running
)

echo.
echo Starting services...
echo.

REM Start Fake News Detection API in new window
echo [1/2] Starting Fake News Detection API (Port 5000)...
start "Fake News Detection API" cmd /k "cd Fake_News_Detection-main && venv\Scripts\activate && python api_service.py"

REM Wait a bit for Python service to start
timeout /t 5 /nobreak >nul

REM Start Node.js API in new window
echo [2/2] Starting Node.js Backend API (Port 4000)...
start "Node.js API Backend" cmd /k "cd api && npm start"

echo.
echo ========================================
echo All services are starting!
echo ========================================
echo.
echo Services running:
echo   - Fake News Detection API: http://localhost:5000
echo   - Node.js Backend API:     http://localhost:4000
echo.
echo To start the frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping services...
taskkill /FI "WindowTitle eq Fake News Detection API*" /T /F 2>nul
taskkill /FI "WindowTitle eq Node.js API Backend*" /T /F 2>nul
echo Services stopped.
pause
