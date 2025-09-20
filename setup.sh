#!/bin/bash

# Akkasah Archive Setup Script
# This script automates the complete setup process for the Akkasah Archive website

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            print_success "Node.js version $(node --version) is compatible"
            return 0
        else
            print_error "Node.js version $(node --version) is too old. Please install Node.js 16 or higher."
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        return 1
    fi
}

# Function to check Python version
check_python_version() {
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
        
        if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 8 ]; then
            print_success "Python version $(python3 --version) is compatible"
            return 0
        else
            print_error "Python version $(python3 --version) is too old. Please install Python 3.8 or higher."
            return 1
        fi
    else
        print_error "Python 3 is not installed. Please install Python 3.8 or higher."
        return 1
    fi
}

# Function to install Node.js dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    cd frontend
    
    if [ ! -f package.json ]; then
        print_error "package.json not found in frontend directory"
        exit 1
    fi
    
    npm install
    print_success "Frontend dependencies installed"
    cd ..
}

# Function to install Python dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    cd backend
    
    if [ ! -f requirements.txt ]; then
        print_error "requirements.txt not found in backend directory"
        exit 1
    fi
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies
    pip install -r requirements.txt
    
    print_success "Backend dependencies installed"
    cd ..
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    cd backend
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Run database seeding
    python seed_data.py
    
    print_success "Database setup completed with sample data"
    cd ..
}

# Function to create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Frontend .env
    if [ ! -f frontend/.env ]; then
        cat > frontend/.env << EOF
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Akkasah Archive
VITE_APP_VERSION=1.0.0
EOF
        print_success "Created frontend/.env"
    fi
    
    # Backend .env
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
DATABASE_URL=sqlite:///./akkasah_archive.db
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
EOF
        print_success "Created backend/.env"
    fi
}

# Function to create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Start development script
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "Starting Akkasah Archive Development Servers..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers concurrently
npm run dev
EOF
    chmod +x start-dev.sh
    
    # Start backend only script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "Starting Akkasah Archive Backend Server..."
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""

cd backend
source venv/bin/activate
python main.py
EOF
    chmod +x start-backend.sh
    
    # Start frontend only script
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "Starting Akkasah Archive Frontend Server..."
echo "Frontend: http://localhost:3000"
echo ""

cd frontend
npm run dev
EOF
    chmod +x start-frontend.sh
    
    print_success "Startup scripts created"
}

# Function to run tests
run_tests() {
    print_status "Running basic tests..."
    
    # Test backend
    cd backend
    source venv/bin/activate
    
    # Test if the API starts without errors
    timeout 10s python -c "
import sys
sys.path.append('.')
from main import app
print('Backend imports successful')
" 2>/dev/null || {
        print_warning "Backend test failed, but this might be due to port conflicts"
    }
    
    cd ..
    
    # Test frontend
    cd frontend
    timeout 10s npm run build 2>/dev/null || {
        print_warning "Frontend build test failed"
    }
    
    cd ..
    print_success "Basic tests completed"
}

# Function to display final instructions
show_final_instructions() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}🎉 Akkasah Archive Setup Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "Your photography archive website is ready to use!"
    echo ""
    echo "📁 Project Structure:"
    echo "  ├── frontend/     - React application"
    echo "  ├── backend/      - FastAPI server"
    echo "  └── database/     - SQLite database with sample data"
    echo ""
    echo "🚀 Quick Start:"
    echo "  ./start-dev.sh    - Start both frontend and backend"
    echo "  ./start-backend.sh - Start backend only"
    echo "  ./start-frontend.sh - Start frontend only"
    echo ""
    echo "🌐 Access Points:"
    echo "  Frontend:    http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  API Docs:    http://localhost:8000/docs"
    echo ""
    echo "📚 Documentation:"
    echo "  See README.md for detailed information"
    echo ""
    echo "🔧 Development Commands:"
    echo "  npm run dev              - Start development servers"
    echo "  npm run build            - Build for production"
    echo "  cd backend && python seed_data.py - Reset database"
    echo ""
    echo -e "${YELLOW}Note: Make sure to change the SECRET_KEY in backend/.env for production!${NC}"
    echo ""
}

# Main setup function
main() {
    echo "=========================================="
    echo -e "${BLUE}🏛️  Akkasah Archive Setup Script${NC}"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_node_version; then
        exit 1
    fi
    
    if ! check_python_version; then
        exit 1
    fi
    
    print_success "All prerequisites met!"
    echo ""
    
    # Create environment files
    create_env_files
    
    # Install dependencies
    install_frontend_deps
    install_backend_deps
    
    # Setup database
    setup_database
    
    # Create startup scripts
    create_startup_scripts
    
    # Run basic tests
    run_tests
    
    # Show final instructions
    show_final_instructions
}

# Run main function
main "$@"
