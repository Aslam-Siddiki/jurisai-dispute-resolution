@echo off
echo =====================================================
echo    JurisAI - MERN Civil Dispute Resolution System
echo    (Node.js Core + Python AI NLP Evaluation Engine)
echo =====================================================
echo.

REM 1. Start Python AI Microservice on Port 8000
echo [1/3] Starting Python AI Evaluation Microservice on http://localhost:8000 ...
start "JurisAI Python AI Engine" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

REM Give Python AI engine a moment to initialize
timeout /t 2 /nobreak > nul

REM 2. Start Node.js MERN Core API on Port 5000
echo [2/3] Starting Node.js / Express MERN Core Backend on http://localhost:5000 ...
start "JurisAI MERN Server" cmd /k "cd /d %~dp0server && node index.js"

REM Give Node.js server a moment to connect to MongoDB
timeout /t 2 /nobreak > nul

REM 3. Start React Vite Frontend on Port 5173
echo [3/3] Starting React Frontend on http://localhost:5173 ...
start "JurisAI React Frontend" cmd /k "cd /d %~dp0frontend && npx vite --port 5173 --host 127.0.0.1"

timeout /t 3 /nobreak > nul

echo.
echo =====================================================
echo  All services are running:
echo   - React Frontend   : http://localhost:5173
echo   - MERN Core API    : http://localhost:5000/api
echo   - Python AI Engine : http://localhost:8000/docs
echo =====================================================
echo.
echo Open http://localhost:5173 in your browser.
pause
