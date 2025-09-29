#!/bin/bash

# Akkasah Archive Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

# Functions
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

check_requirements() {
    print_status "Checking requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f "env.production.example" ]; then
            cp env.production.example .env
            print_warning "Please edit .env file with your configuration before running again."
            exit 1
        else
            print_error "No environment template found. Please create .env file manually."
            exit 1
        fi
    fi
    
    print_success "All requirements met!"
}

backup_data() {
    print_status "Creating backup..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if running
    if docker-compose ps | grep -q "akkasah-db.*Up"; then
        print_status "Backing up database..."
        docker-compose exec -T db pg_dump -U akkasah_user akkasah_archive > "$BACKUP_DIR/database.sql"
    fi
    
    # Backup uploads if exists
    if [ -d "uploads" ]; then
        print_status "Backing up uploads..."
        cp -r uploads "$BACKUP_DIR/"
    fi
    
    print_success "Backup created in $BACKUP_DIR"
}

deploy_development() {
    print_status "Deploying in development mode..."
    
    # Stop existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    docker-compose up -d --build
    
    # Wait for services to be healthy
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check health
    if docker-compose ps | grep -q "Up (healthy)"; then
        print_success "Development deployment successful!"
        print_status "Frontend: http://localhost"
        print_status "Backend API: http://localhost:8000"
        print_status "API Docs: http://localhost:8000/docs"
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

deploy_production() {
    print_status "Deploying in production mode..."
    
    # Check if production compose file exists
    if [ ! -f "$PROD_COMPOSE_FILE" ]; then
        print_error "Production compose file not found: $PROD_COMPOSE_FILE"
        exit 1
    fi
    
    # Stop existing containers
    docker-compose -f "$PROD_COMPOSE_FILE" down 2>/dev/null || true
    
    # Build and start services
    docker-compose -f "$PROD_COMPOSE_FILE" up -d --build
    
    # Wait for services to be healthy
    print_status "Waiting for services to start..."
    sleep 60
    
    # Check health
    if docker-compose -f "$PROD_COMPOSE_FILE" ps | grep -q "Up (healthy)"; then
        print_success "Production deployment successful!"
        print_status "Application is running on ports 80 and 443"
    else
        print_error "Some services failed to start. Check logs with: docker-compose -f $PROD_COMPOSE_FILE logs"
        exit 1
    fi
}

show_logs() {
    print_status "Showing logs (Press Ctrl+C to exit)..."
    docker-compose logs -f
}

show_status() {
    print_status "Service status:"
    docker-compose ps
}

update_application() {
    print_status "Updating application..."
    
    # Pull latest changes
    git pull
    
    # Rebuild and restart
    docker-compose down
    docker-compose up -d --build
    
    print_success "Application updated!"
}

# Main script
case "${1:-deploy}" in
    "dev"|"development")
        check_requirements
        deploy_development
        ;;
    "prod"|"production")
        check_requirements
        backup_data
        deploy_production
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "update")
        update_application
        ;;
    "backup")
        backup_data
        ;;
    "help"|"-h"|"--help")
        echo "Akkasah Archive Deployment Script"
        echo ""
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  dev, development    Deploy in development mode (default)"
        echo "  prod, production    Deploy in production mode"
        echo "  logs                Show application logs"
        echo "  status              Show service status"
        echo "  update              Update application"
        echo "  backup              Create backup"
        echo "  help                Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                  # Deploy in development mode"
        echo "  $0 prod             # Deploy in production mode"
        echo "  $0 logs             # Show logs"
        echo "  $0 status           # Show status"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
