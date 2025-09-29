# 🚀 Secure Deployment Guide

This guide provides step-by-step instructions for securely deploying the Akkasah Archive website to production.

## 🔒 Pre-Deployment Security Checklist

### 1. **Environment Configuration**

#### Generate Secure Secrets
```bash
# Generate a secure secret key (minimum 32 characters)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate database encryption key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate backup encryption key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Configure Environment Variables
```bash
# Copy the example environment file
cp backend/env.example backend/.env

# Edit with your production values
nano backend/.env
```

**Critical Environment Variables:**
```env
# Security (REQUIRED)
SECRET_KEY=your-super-secret-key-minimum-32-characters
DEBUG=False
ENVIRONMENT=production

# Database (REQUIRED)
DATABASE_URL=postgresql+psycopg://username:password@localhost/akkasah_archive

# CORS (REQUIRED)
CORS_ORIGINS=["https://yourdomain.com"]

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIRECTORY=/var/www/akkasah/uploads

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/akkasah/akkasah.log
```

### 2. **Server Security Hardening**

#### Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### Install Security Tools
```bash
# Install fail2ban for intrusion prevention
sudo apt install fail2ban -y

# Install ufw firewall
sudo apt install ufw -y

# Install fail2ban for intrusion prevention
sudo apt install fail2ban -y
```

#### Configure Firewall
```bash
# Enable UFW
sudo ufw enable

# Allow SSH (change port if needed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application port (if not using reverse proxy)
sudo ufw allow 8000/tcp

# Check status
sudo ufw status
```

#### Configure Fail2Ban
```bash
# Create jail configuration
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

### 3. **Database Security**

#### PostgreSQL Configuration
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE akkasah_archive;

-- Create user
CREATE USER akkasah_user WITH PASSWORD 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE akkasah_archive TO akkasah_user;

-- Exit
\q
```

#### Configure PostgreSQL Security
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf
```

```ini
# Security settings
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
password_encryption = scram-sha-256
```

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

```ini
# Local connections
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# Remote connections (if needed)
host    all             all             0.0.0.0/0               scram-sha-256
```

### 4. **SSL/TLS Configuration**

#### Install Certbot
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### Configure Nginx with Security Headers
```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/akkasah
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self';" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Frontend
    location / {
        root /var/www/akkasah/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security.txt
    location /.well-known/security.txt {
        alias /var/www/akkasah/security.txt;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|sql)$ {
        deny all;
    }
}
```

### 5. **Application Deployment**

#### Create Application User
```bash
# Create application user
sudo useradd -m -s /bin/bash akkasah
sudo usermod -aG www-data akkasah

# Create application directory
sudo mkdir -p /var/www/akkasah
sudo chown akkasah:akkasah /var/www/akkasah
```

#### Deploy Application
```bash
# Switch to application user
sudo su - akkasah

# Clone repository
git clone https://github.com/yourusername/akkasah-archive.git /var/www/akkasah

# Install dependencies
cd /var/www/akkasah
npm run install:all

# Build frontend
cd frontend
npm run build

# Setup backend
cd ../backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run database migrations
python seed_data.py

# Create systemd service
sudo nano /etc/systemd/system/akkasah.service
```

```ini
[Unit]
Description=Akkasah Archive API
After=network.target

[Service]
Type=exec
User=akkasah
Group=akkasah
WorkingDirectory=/var/www/akkasah/backend
Environment=PATH=/var/www/akkasah/backend/venv/bin
ExecStart=/var/www/akkasah/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Start Services
```bash
# Enable and start services
sudo systemctl enable akkasah
sudo systemctl start akkasah
sudo systemctl enable nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status akkasah
sudo systemctl status nginx
```

### 6. **Monitoring and Logging**

#### Setup Log Rotation
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/akkasah
```

```
/var/log/akkasah/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 akkasah akkasah
    postrotate
        systemctl reload akkasah
    endscript
}
```

#### Setup Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Create monitoring script
sudo nano /usr/local/bin/akkasah-monitor.sh
```

```bash
#!/bin/bash
# Akkasah Archive Monitoring Script

echo "=== Akkasah Archive System Status ==="
echo "Date: $(date)"
echo

# Service status
echo "=== Service Status ==="
systemctl is-active akkasah
systemctl is-active nginx
systemctl is-active postgresql
echo

# Memory usage
echo "=== Memory Usage ==="
free -h
echo

# Disk usage
echo "=== Disk Usage ==="
df -h
echo

# Network connections
echo "=== Network Connections ==="
ss -tuln | grep -E ':(80|443|8000|5432)'
echo

# Log file sizes
echo "=== Log File Sizes ==="
ls -lh /var/log/akkasah/
echo

# Recent errors
echo "=== Recent Errors ==="
tail -n 20 /var/log/akkasah/akkasah.log | grep -i error
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/akkasah-monitor.sh

# Add to crontab for regular monitoring
sudo crontab -e
```

```
# Monitor every 5 minutes
*/5 * * * * /usr/local/bin/akkasah-monitor.sh >> /var/log/akkasah/monitor.log 2>&1
```

### 7. **Backup Configuration**

#### Database Backup
```bash
# Create backup script
sudo nano /usr/local/bin/akkasah-backup.sh
```

```bash
#!/bin/bash
# Akkasah Archive Backup Script

BACKUP_DIR="/var/backups/akkasah"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="akkasah_archive"
DB_USER="akkasah_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/akkasah

# Uploads backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/akkasah/uploads

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/akkasah-backup.sh

# Add to crontab
sudo crontab -e
```

```
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/akkasah-backup.sh >> /var/log/akkasah/backup.log 2>&1
```

### 8. **Security Testing**

#### Run Security Tests
```bash
# Install security testing tools
sudo apt install nmap nikto -y

# Run security tests
cd /var/www/akkasah
npm run test:security

# Run port scan
nmap -sV -sC localhost

# Run web vulnerability scan
nikto -h https://yourdomain.com
```

#### Security Audit
```bash
# Run dependency audit
npm run audit
cd frontend && npm run audit

# Check for security updates
sudo apt list --upgradable | grep security

# Review logs for security issues
sudo grep -i "error\|fail\|denied" /var/log/akkasah/akkasah.log
```

## 🔍 Post-Deployment Security Checklist

### Immediate Checks
- [ ] HTTPS is working and redirecting HTTP
- [ ] Security headers are present
- [ ] Rate limiting is working
- [ ] Database is accessible only locally
- [ ] File uploads are restricted
- [ ] Error messages don't leak information
- [ ] Logs are being generated
- [ ] Backups are working

### Weekly Checks
- [ ] Review security logs
- [ ] Check for failed login attempts
- [ ] Monitor rate limiting
- [ ] Verify backup integrity
- [ ] Check for security updates

### Monthly Checks
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review access logs
- [ ] Update dependencies
- [ ] Test incident response

## 🚨 Incident Response

### Security Incident Response Plan
1. **Detection**: Monitor logs and alerts
2. **Assessment**: Evaluate severity and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threats
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Document and improve

### Emergency Contacts
- Security Team: security@yourdomain.com
- System Administrator: admin@yourdomain.com
- Incident Response: incident@yourdomain.com

## 📚 Additional Resources

### Security Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)

### Monitoring Tools
- [Prometheus](https://prometheus.io/)
- [Grafana](https://grafana.com/)
- [ELK Stack](https://www.elastic.co/elk-stack)
- [Sentry](https://sentry.io/)

---

**Remember**: Security is an ongoing process. Regular monitoring, updates, and testing are essential for maintaining a secure deployment.
