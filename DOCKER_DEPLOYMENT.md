# 🐳 Docker Deployment Guide for Akkasah Archive

This guide will help you deploy your Akkasah Archive website using Docker on a server.

## 📋 Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- Git
- A server with at least 2GB RAM and 10GB storage
- Domain name (optional, for production)

## 🚀 Quick Start

### 1. Clone and Prepare

```bash
# Clone your repository
git clone <your-repo-url>
cd akkasah

# Copy environment file
cp env.production.example .env

# Edit the environment file with your settings
nano .env
```

### 2. Configure Environment

Edit `.env` file with your production settings:

```bash
# Required settings
POSTGRES_PASSWORD=your-super-secure-postgres-password
SECRET_KEY=your-super-secret-key-minimum-32-characters
CORS_ORIGINS=["https://yourdomain.com"]

# Optional settings
ADMIN_EMAIL=admin@yourdomain.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Deploy

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 🏗️ Architecture

Your Docker setup includes:

- **Frontend**: React app served by Nginx
- **Backend**: FastAPI application
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Reverse Proxy**: Nginx (optional, for production)

## 📁 File Structure

```
akkasah/
├── docker-compose.yml          # Main orchestration file
├── env.production.example      # Environment template
├── backend/
│   ├── Dockerfile             # Backend container
│   ├── .dockerignore          # Backend ignore rules
│   └── init.sql               # Database initialization
├── frontend/
│   ├── Dockerfile             # Frontend container
│   ├── .dockerignore          # Frontend ignore rules
│   └── nginx.conf             # Frontend Nginx config
└── nginx/
    └── nginx.conf             # Production reverse proxy
```

## 🔧 Configuration Options

### Development Mode

```bash
# Start only essential services
docker-compose up -d db redis backend frontend
```

### Production Mode

```bash
# Start with reverse proxy
docker-compose --profile production up -d
```

### Custom Ports

Edit `docker-compose.yml` to change ports:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 8080 to your preferred port
```

## 🛠️ Management Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Database Management

```bash
# Access database
docker-compose exec db psql -U akkasah_user -d akkasah_archive

# Backup database
docker-compose exec db pg_dump -U akkasah_user akkasah_archive > backup.sql

# Restore database
docker-compose exec -T db psql -U akkasah_user -d akkasah_archive < backup.sql
```

## 🔒 Security Configuration

### SSL/HTTPS Setup

1. **Get SSL certificates** (Let's Encrypt recommended):

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

2. **Update nginx configuration** with your domain name

3. **Start with production profile**:

```bash
docker-compose --profile production up -d
```

### Environment Security

- Change all default passwords
- Use strong, unique passwords
- Enable firewall (ports 80, 443, 22)
- Regular security updates

## 📊 Monitoring

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost/health
curl http://localhost:8000/health
```

### Logs

```bash
# Real-time logs
docker-compose logs -f

# Log rotation (add to crontab)
0 0 * * * docker-compose logs --tail=1000 > /var/log/akkasah/$(date +\%Y\%m\%d).log
```

## 🔄 Backup Strategy

### Automated Backups

Create backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/akkasah"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T db pg_dump -U akkasah_user akkasah_archive > $BACKUP_DIR/db_$DATE.sql

# Uploads backup
docker-compose exec frontend tar -czf - /usr/share/nginx/html/uploads > $BACKUP_DIR/uploads_$DATE.tar.gz

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Restore from Backup

```bash
# Restore database
docker-compose exec -T db psql -U akkasah_user -d akkasah_archive < backup.sql

# Restore uploads
docker-compose exec frontend tar -xzf uploads_backup.tar.gz -C /
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using port 80
   sudo netstat -tulpn | grep :80
   ```

2. **Permission issues**:
   ```bash
   # Fix upload directory permissions
   sudo chown -R 1000:1000 uploads/
   ```

3. **Database connection issues**:
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Test connection
   docker-compose exec backend python -c "from database import engine; print(engine.execute('SELECT 1').scalar())"
   ```

4. **Memory issues**:
   ```bash
   # Check resource usage
   docker stats
   
   # Increase memory limits in docker-compose.yml
   ```

### Reset Everything

```bash
# Stop and remove all containers
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## 📈 Performance Optimization

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Caching

- Redis is already configured for caching
- Nginx static file caching is enabled
- Consider CDN for production

## 🔄 Updates

### Application Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run database migrations (if any)
docker-compose exec backend alembic upgrade head
```

### System Updates

```bash
# Update Docker
sudo apt update && sudo apt upgrade docker.io

# Update system
sudo apt update && sudo apt upgrade
```

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Check service status: `docker-compose ps`
3. Verify environment configuration
4. Check server resources: `docker stats`

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Backup strategy implemented
- [ ] Monitoring set up
- [ ] Domain DNS configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Log rotation set up
- [ ] Health checks working

Your Akkasah Archive is now ready for production deployment! 🚀
