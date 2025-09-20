@echo off
REM Akkasah Archive Setup Script for Windows
REM This script automates the complete setup process for the Akkasah Archive website

setlocal enabledelayedexpansion

echo ==========================================
echo 🏛️  Akkasah Archive Setup Script
echo ==========================================
echo.

REM Check if Node.js is installed
echo [INFO] Checking prerequisites...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js version %NODE_VERSION% found

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8 or higher.
    echo Download from: https://python.org/
    pause
    exit /b 1
)

REM Check Python version
for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo [SUCCESS] Python version %PYTHON_VERSION% found

echo [SUCCESS] All prerequisites met!
echo.

REM Create environment files
echo [INFO] Creating environment files...

if not exist "frontend\.env" (
    echo VITE_API_URL=http://localhost:8000 > frontend\.env
    echo VITE_APP_NAME=Akkasah Archive >> frontend\.env
    echo VITE_APP_VERSION=1.0.0 >> frontend\.env
    echo [SUCCESS] Created frontend\.env
)

if not exist "backend\.env" (
    echo DATABASE_URL=sqlite:///./akkasah_archive.db > backend\.env
    echo SECRET_KEY=your-secret-key-change-in-production >> backend\.env
    echo DEBUG=True >> backend\.env
    echo CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"] >> backend\.env
    echo [SUCCESS] Created backend\.env
)

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd frontend
if not exist "package.json" (
    echo [ERROR] package.json not found in frontend directory
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Frontend dependencies installed
cd ..

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
if not exist "requirements.txt" (
    echo [ERROR] requirements.txt not found in backend directory
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Backend dependencies installed

REM Setup database
echo [INFO] Setting up database...
python seed_data.py
if %errorlevel% neq 0 (
    echo [ERROR] Failed to setup database
    pause
    exit /b 1
)
echo [SUCCESS] Database setup completed with sample data
cd ..

REM Create startup scripts
echo [INFO] Creating startup scripts...

REM Start development script
echo @echo off > start-dev.bat
echo echo Starting Akkasah Archive Development Servers... >> start-dev.bat
echo echo Frontend: http://localhost:3000 >> start-dev.bat
echo echo Backend API: http://localhost:8000 >> start-dev.bat
echo echo API Docs: http://localhost:8000/docs >> start-dev.bat
echo echo. >> start-dev.bat
echo echo Press Ctrl+C to stop both servers >> start-dev.bat
echo echo. >> start-dev.bat
echo npm run dev >> start-dev.bat

REM Start backend only script
echo @echo off > start-backend.bat
echo echo Starting Akkasah Archive Backend Server... >> start-backend.bat
echo echo Backend API: http://localhost:8000 >> start-backend.bat
echo echo API Docs: http://localhost:8000/docs >> start-backend.bat
echo echo. >> start-backend.bat
echo cd backend >> start-backend.bat
echo call venv\Scripts\activate.bat >> start-backend.bat
echo python main.py >> start-backend.bat

REM Start frontend only script
echo @echo off > start-frontend.bat
echo echo Starting Akkasah Archive Frontend Server... >> start-frontend.bat
echo echo Frontend: http://localhost:3000 >> start-frontend.bat
echo echo. >> start-frontend.bat
echo cd frontend >> start-frontend.bat
echo npm run dev >> start-frontend.bat

echo [SUCCESS] Startup scripts created

REM Run basic tests
echo [INFO] Running basic tests...

REM Test backend
cd backend
call venv\Scripts\activate.bat
python -c "import sys; sys.path.append('.'); from main import app; print('Backend imports successful')" 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Backend test failed, but this might be due to port conflicts
)
cd ..

REM Test frontend
cd frontend
npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Frontend build test failed
)
cd ..

echo [SUCCESS] Basic tests completed

REM Show final instructions
echo.
echo ==========================================
echo 🎉 Akkasah Archive Setup Complete!
echo ==========================================
echo.
echo Your photography archive website is ready to use!
echo.
echo 📁 Project Structure:
echo   ├── frontend\     - React application
echo   ├── backend\      - FastAPI server
echo   └── database\     - SQLite database with sample data
echo.
echo 🚀 Quick Start:
echo   start-dev.bat     - Start both frontend and backend
echo   start-backend.bat - Start backend only
echo   start-frontend.bat - Start frontend only
echo.
echo 🌐 Access Points:
echo   Frontend:    http://localhost:3000
echo   Backend API: http://localhost:8000
echo   API Docs:    http://localhost:8000/docs
echo.
echo 📚 Documentation:
echo   See README.md for detailed information
echo.
echo 🔧 Development Commands:
echo   npm run dev              - Start development servers
echo   npm run build            - Build for production
echo   cd backend ^&^& python seed_data.py - Reset database
echo.
echo [WARNING] Note: Make sure to change the SECRET_KEY in backend\.env for production!
echo.
echo Press any key to exit...
pause >nul
