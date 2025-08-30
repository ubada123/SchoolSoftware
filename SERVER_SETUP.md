# 🖥️ Server Configuration Guide for School Admin System

## Overview
This guide provides complete server configuration requirements to host your Django + React school admin application with database.

---

## 📋 Server Requirements

### Minimum Specifications
```
CPU: 2 cores (4 cores recommended)
RAM: 4GB (8GB recommended)
Storage: 40GB SSD (80GB recommended)
Bandwidth: 1TB/month
OS: Ubuntu 20.04 LTS / CentOS 8 / Debian 11
```

### Recommended Specifications
```
CPU: 4 cores
RAM: 8GB
Storage: 80GB SSD
Bandwidth: 2TB/month
OS: Ubuntu 22.04 LTS
```

---

## 🔧 Software Stack Installation

### 1. System Updates
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip
```

### 2. Python 3.11 Installation
```bash
# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev
sudo apt install -y python3-pip

# Verify installation
python3.11 --version
```

### 3. Node.js 18+ Installation
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 4. PostgreSQL Database
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
-- In PostgreSQL prompt
CREATE DATABASE school_admin;
CREATE USER school_admin_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE school_admin TO school_admin_user;
ALTER USER school_admin_user CREATEDB;
\q
```

### 5. Nginx Web Server
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Redis (for caching - optional)
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## 🌐 Domain & SSL Configuration

### 1. Domain Setup
```bash
# Point your domain to server IP
# A record: yourdomain.com -> YOUR_SERVER_IP
# A record: www.yourdomain.com -> YOUR_SERVER_IP
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📁 Application Deployment

### 1. Create Application Directory
```bash
sudo mkdir -p /var/www/school-admin
sudo chown $USER:$USER /var/www/school-admin
cd /var/www/school-admin
```

### 2. Clone Repository
```bash
git clone https://github.com/your-username/SchoolSoftware.git .
```

### 3. Backend Setup (Django)
```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create production settings
cp server/settings_production.py server/settings_production_local.py
```

### 4. Database Configuration
Edit `server/settings_production_local.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'school_admin',
        'USER': 'school_admin_user',
        'PASSWORD': 'your_secure_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Security settings
SECRET_KEY = 'your-secret-key-here'
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com', 'localhost']

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

### 5. Database Migration
```bash
# Set Django settings
export DJANGO_SETTINGS_MODULE=server.settings_production_local

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic
```

### 6. Frontend Setup (React)
```bash
cd web

# Install dependencies
npm install

# Build for production
npm run build
```

---

## 🔧 Nginx Configuration

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/school-admin
```

### 2. Nginx Configuration Content
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Certbot will add this)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend (React)
    location / {
        root /var/www/school-admin/web/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API (Django)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/school-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔄 Process Management (Systemd)

### 1. Create Django Service
```bash
sudo nano /etc/systemd/system/school-admin.service
```

### 2. Service Configuration
```ini
[Unit]
Description=School Admin Django Application
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/school-admin
Environment=DJANGO_SETTINGS_MODULE=server.settings_production_local
Environment=PATH=/var/www/school-admin/venv/bin
ExecStart=/var/www/school-admin/venv/bin/gunicorn server.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable school-admin
sudo systemctl start school-admin
sudo systemctl status school-admin
```

---

## 🔒 Security Configuration

### 1. Firewall Setup
```bash
# Install UFW
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Fail2ban Installation
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Database Security
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/*/main/postgresql.conf

# Add/modify these lines:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB

# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Ensure only local connections:
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

---

## 📊 Monitoring & Logs

### 1. Log Configuration
```bash
# Create log directory
sudo mkdir -p /var/log/school-admin
sudo chown www-data:www-data /var/log/school-admin

# Add to Django settings
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/school-admin/django.log',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
}
```

### 2. Log Rotation
```bash
sudo nano /etc/logrotate.d/school-admin
```

```conf
/var/log/school-admin/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

---

## 🔄 Backup Strategy

### 1. Database Backup Script
```bash
sudo nano /var/www/school-admin/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/school-admin"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="school_admin"
DB_USER="school_admin_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
```

### 2. Setup Cron Job
```bash
chmod +x /var/www/school-admin/backup.sh
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /var/www/school-admin/backup.sh
```

---

## 🚀 Deployment Commands

### Quick Deployment Script
```bash
#!/bin/bash
cd /var/www/school-admin

# Pull latest code
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Build frontend
cd web
npm install
npm run build
cd ..

# Restart services
sudo systemctl restart school-admin
sudo systemctl reload nginx

echo "Deployment completed!"
```

---

## 💰 Cost Estimation

### VPS Providers:
- **DigitalOcean**: $12-24/month (2-4GB RAM)
- **Linode**: $10-20/month (2-4GB RAM)
- **Vultr**: $6-12/month (2-4GB RAM)
- **AWS EC2**: $15-30/month (t3.medium)
- **Google Cloud**: $15-30/month (e2-medium)

### Domain & SSL:
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)

**Total Monthly Cost**: $10-30/month

---

## 🎯 Performance Optimization

### 1. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_student_classroom ON core_student(classroom_id);
CREATE INDEX idx_payment_student ON core_payment(student_id);
CREATE INDEX idx_payment_date ON core_payment(payment_date);
```

### 2. Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 3. Django Optimization
```python
# Add to settings
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

---

## 🔧 Troubleshooting

### Common Issues:
1. **Permission Errors**: `sudo chown -R www-data:www-data /var/www/school-admin`
2. **Database Connection**: Check PostgreSQL service and credentials
3. **Static Files**: Run `python manage.py collectstatic`
4. **Nginx Errors**: Check `/var/log/nginx/error.log`
5. **Django Errors**: Check `/var/log/school-admin/django.log`

### Useful Commands:
```bash
# Check service status
sudo systemctl status school-admin nginx postgresql

# View logs
sudo journalctl -u school-admin -f
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart school-admin nginx postgresql
```

---

**🎉 Your School Admin System is now ready for production!**
