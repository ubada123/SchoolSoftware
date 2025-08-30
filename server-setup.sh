#!/bin/bash

echo "🚀 School Admin System - Server Setup Script"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., schooladmin.com): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    print_error "Domain name is required"
    exit 1
fi

# Get database password
read -s -p "Enter database password: " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
    print_error "Database password is required"
    exit 1
fi

# Generate secret key
SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")

print_header "Starting server setup..."

# Step 1: System Updates
print_status "Updating system packages..."
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common

# Step 2: Install Python 3.11
print_status "Installing Python 3.11..."
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Step 3: Install Node.js
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Step 4: Install PostgreSQL
print_status "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Step 5: Setup Database
print_status "Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE school_admin;"
sudo -u postgres psql -c "CREATE USER school_admin_user WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE school_admin TO school_admin_user;"
sudo -u postgres psql -c "ALTER USER school_admin_user CREATEDB;"

# Step 6: Install Nginx
print_status "Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Step 7: Install Redis (optional)
print_status "Installing Redis..."
apt install -y redis-server
systemctl start redis-server
systemctl enable redis-server

# Step 8: Create Application Directory
print_status "Creating application directory..."
mkdir -p /var/www/school-admin
chown www-data:www-data /var/www/school-admin

# Step 9: Clone Repository
print_status "Cloning repository..."
cd /var/www/school-admin
git clone https://github.com/ubada123/SchoolSoftware.git .

# Step 10: Setup Python Environment
print_status "Setting up Python environment..."
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Step 11: Create Production Settings
print_status "Creating production settings..."
cp server/settings_production.py server/settings_production_local.py

# Update settings with domain and database info
sed -i "s/yourdomain.com/$DOMAIN_NAME/g" server/settings_production_local.py
sed -i "s/your-secret-key-here/$SECRET_KEY/g" server/settings_production_local.py

# Step 12: Setup Database
print_status "Setting up Django database..."
export DJANGO_SETTINGS_MODULE=server.settings_production_local
python manage.py migrate
python manage.py collectstatic --noinput

# Step 13: Build Frontend
print_status "Building frontend..."
cd web
npm install
npm run build
cd ..

# Step 14: Create Nginx Configuration
print_status "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/school-admin << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # Frontend (React)
    location / {
        root /var/www/school-admin/web/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API (Django)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/school-admin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Step 15: Create Systemd Service
print_status "Creating systemd service..."
cat > /etc/systemd/system/school-admin.service << EOF
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
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable school-admin
systemctl start school-admin

# Step 16: Setup Firewall
print_status "Setting up firewall..."
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Step 17: Install Fail2ban
print_status "Installing Fail2ban..."
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Step 18: Create Log Directory
print_status "Setting up logging..."
mkdir -p /var/log/school-admin
chown www-data:www-data /var/log/school-admin

# Step 19: Create Backup Script
print_status "Creating backup script..."
cat > /var/www/school-admin/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/school-admin"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="school_admin"
DB_USER="school_admin_user"

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /var/www/school-admin/backup.sh

# Step 20: Setup Cron Job for Backups
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/school-admin/backup.sh") | crontab -

# Step 21: Set Permissions
print_status "Setting final permissions..."
chown -R www-data:www-data /var/www/school-admin

print_header "Server setup completed!"
echo ""
echo "🎉 Your School Admin System is now installed!"
echo ""
echo "📋 Next Steps:"
echo "1. Point your domain ($DOMAIN_NAME) to this server's IP"
echo "2. Install SSL certificate: sudo certbot --nginx -d $DOMAIN_NAME"
echo "3. Create admin user: sudo -u www-data /var/www/school-admin/venv/bin/python manage.py createsuperuser"
echo "4. Access your application at: http://$DOMAIN_NAME"
echo ""
echo "🔧 Useful Commands:"
echo "- Check service status: sudo systemctl status school-admin"
echo "- View logs: sudo journalctl -u school-admin -f"
echo "- Restart application: sudo systemctl restart school-admin"
echo "- Update application: cd /var/www/school-admin && git pull && sudo systemctl restart school-admin"
echo ""
echo "📊 Server Information:"
echo "- Database: PostgreSQL (school_admin)"
echo "- Web Server: Nginx"
echo "- Application Server: Gunicorn"
echo "- Process Manager: Systemd"
echo "- Backup: Daily at 2 AM"
echo ""
print_status "Setup completed successfully!"
