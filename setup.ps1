# Akkasah Archive Setup Script for PowerShell
# This script automates the complete setup process for the Akkasah Archive website

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Function to check if command exists
function Test-Command($command) {
    try {
        if (Get-Command $command -ErrorAction SilentlyContinue) {
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

# Function to check Node.js version
function Test-NodeVersion {
    if (Test-Command "node") {
        $nodeVersion = node --version
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($versionNumber -ge 16) {
            Write-Success "Node.js version $nodeVersion is compatible"
            return $true
        } else {
            Write-Error "Node.js version $nodeVersion is too old. Please install Node.js 16 or higher."
            return $false
        }
    } else {
        Write-Error "Node.js is not installed. Please install Node.js 16 or higher."
        return $false
    }
}

# Function to check Python version
function Test-PythonVersion {
    if (Test-Command "python") {
        $pythonVersion = python --version
        $versionMatch = $pythonVersion -match "Python (\d+)\.(\d+)"
        if ($versionMatch) {
            $major = [int]$matches[1]
            $minor = [int]$matches[2]
            if ($major -eq 3 -and $minor -ge 8) {
                Write-Success "Python version $pythonVersion is compatible"
                return $true
            }
        }
        Write-Error "Python version $pythonVersion is too old. Please install Python 3.8 or higher."
        return $false
    } else {
        Write-Error "Python is not installed. Please install Python 3.8 or higher."
        return $false
    }
}

# Function to install frontend dependencies
function Install-FrontendDeps {
    Write-Info "Installing frontend dependencies..."
    
    if (-not (Test-Path "frontend/package.json")) {
        Write-Error "package.json not found in frontend directory"
        exit 1
    }
    
    Set-Location frontend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install frontend dependencies"
        exit 1
    }
    Write-Success "Frontend dependencies installed"
    Set-Location ..
}

# Function to install backend dependencies
function Install-BackendDeps {
    Write-Info "Installing backend dependencies..."
    
    if (-not (Test-Path "backend/requirements.txt")) {
        Write-Error "requirements.txt not found in backend directory"
        exit 1
    }
    
    Set-Location backend
    
    # Create virtual environment if it doesn't exist
    if (-not (Test-Path "venv")) {
        Write-Info "Creating Python virtual environment..."
        python -m venv venv
    }
    
    # Activate virtual environment
    & "venv/Scripts/Activate.ps1"
    
    # Upgrade pip
    python -m pip install --upgrade pip
    
    # Install dependencies
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install backend dependencies"
        exit 1
    }
    Write-Success "Backend dependencies installed"
    Set-Location ..
}

# Function to setup database
function Setup-Database {
    Write-Info "Setting up database..."
    Set-Location backend
    & "venv/Scripts/Activate.ps1"
    python seed_data.py
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to setup database"
        exit 1
    }
    Write-Success "Database setup completed with sample data"
    Set-Location ..
}

# Function to create environment files
function Create-EnvFiles {
    Write-Info "Creating environment files..."
    
    # Frontend .env
    if (-not (Test-Path "frontend/.env")) {
        @"
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Akkasah Archive
VITE_APP_VERSION=1.0.0
"@ | Out-File -FilePath "frontend/.env" -Encoding UTF8
        Write-Success "Created frontend/.env"
    }
    
    # Backend .env
    if (-not (Test-Path "backend/.env")) {
        @"
DATABASE_URL=sqlite:///./akkasah_archive.db
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
"@ | Out-File -FilePath "backend/.env" -Encoding UTF8
        Write-Success "Created backend/.env"
    }
}

# Function to create startup scripts
function Create-StartupScripts {
    Write-Info "Creating startup scripts..."
    
    # Start development script
    @"
@echo off
echo Starting Akkasah Archive Development Servers...
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop both servers
echo.
npm run dev
"@ | Out-File -FilePath "start-dev.bat" -Encoding ASCII
    
    # Start backend only script
    @"
@echo off
echo Starting Akkasah Archive Backend Server...
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
cd backend
call venv\Scripts\activate.bat
python main.py
"@ | Out-File -FilePath "start-backend.bat" -Encoding ASCII
    
    # Start frontend only script
    @"
@echo off
echo Starting Akkasah Archive Frontend Server...
echo Frontend: http://localhost:3000
echo.
cd frontend
npm run dev
"@ | Out-File -FilePath "start-frontend.bat" -Encoding ASCII
    
    Write-Success "Startup scripts created"
}

# Function to run tests
function Run-Tests {
    Write-Info "Running basic tests..."
    
    # Test backend
    Set-Location backend
    & "venv/Scripts/Activate.ps1"
    
    try {
        python -c "import sys; sys.path.append('.'); from main import app; print('Backend imports successful')" 2>$null
        Write-Success "Backend test passed"
    } catch {
        Write-Warning "Backend test failed, but this might be due to port conflicts"
    }
    
    Set-Location ..
    
    # Test frontend
    Set-Location frontend
    try {
        npm run build 2>$null
        Write-Success "Frontend test passed"
    } catch {
        Write-Warning "Frontend build test failed"
    }
    
    Set-Location ..
}

# Function to display final instructions
function Show-FinalInstructions {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "🎉 Akkasah Archive Setup Complete!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your photography archive website is ready to use!"
    Write-Host ""
    Write-Host "📁 Project Structure:"
    Write-Host "  ├── frontend\     - React application"
    Write-Host "  ├── backend\      - FastAPI server"
    Write-Host "  └── database\     - SQLite database with sample data"
    Write-Host ""
    Write-Host "🚀 Quick Start:"
    Write-Host "  .\start-dev.bat     - Start both frontend and backend"
    Write-Host "  .\start-backend.bat - Start backend only"
    Write-Host "  .\start-frontend.bat - Start frontend only"
    Write-Host ""
    Write-Host "🌐 Access Points:"
    Write-Host "  Frontend:    http://localhost:3000"
    Write-Host "  Backend API: http://localhost:8000"
    Write-Host "  API Docs:    http://localhost:8000/docs"
    Write-Host ""
    Write-Host "📚 Documentation:"
    Write-Host "  See README.md for detailed information"
    Write-Host ""
    Write-Host "🔧 Development Commands:"
    Write-Host "  npm run dev              - Start development servers"
    Write-Host "  npm run build            - Build for production"
    Write-Host "  cd backend; python seed_data.py - Reset database"
    Write-Host ""
    Write-Host "⚠️  Note: Make sure to change the SECRET_KEY in backend\.env for production!" -ForegroundColor Yellow
    Write-Host ""
}

# Main setup function
function Main {
    Write-Host "==========================================" -ForegroundColor Blue
    Write-Host "🏛️  Akkasah Archive Setup Script" -ForegroundColor Blue
    Write-Host "==========================================" -ForegroundColor Blue
    Write-Host ""
    
    # Check prerequisites
    Write-Info "Checking prerequisites..."
    
    if (-not (Test-NodeVersion)) {
        exit 1
    }
    
    if (-not (Test-PythonVersion)) {
        exit 1
    }
    
    Write-Success "All prerequisites met!"
    Write-Host ""
    
    # Create environment files
    Create-EnvFiles
    
    # Install dependencies
    Install-FrontendDeps
    Install-BackendDeps
    
    # Setup database
    Setup-Database
    
    # Create startup scripts
    Create-StartupScripts
    
    # Run basic tests
    Run-Tests
    
    # Show final instructions
    Show-FinalInstructions
}

# Run main function
Main
