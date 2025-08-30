#!/bin/bash

echo "🚀 School Admin System - Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Build frontend
print_status "Building React frontend..."
cd web
if npm run build; then
    print_status "Frontend build successful!"
else
    print_error "Frontend build failed!"
    exit 1
fi
cd ..

# Step 2: Create production settings
print_status "Creating production configuration..."

# Step 3: Generate secret key
SECRET_KEY=$(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
print_status "Generated new SECRET_KEY"

# Step 4: Create environment file template
cat > .env.example << EOF
# Production Environment Variables
SECRET_KEY=$SECRET_KEY
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-backend-url.railway.app

# Database Configuration (Railway/Render will provide these)
DATABASE_URL=postgresql://user:password@host:port/database
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=5432

# CORS Settings
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://localhost:3000
EOF

print_status "Created .env.example file"

# Step 5: Create deployment package
print_status "Creating deployment package..."
mkdir -p deployment
cp -r web/dist/* deployment/
cp Procfile deployment/
cp runtime.txt deployment/
cp requirements.txt deployment/
cp manage.py deployment/
cp -r server deployment/
cp -r core deployment/

print_status "Deployment package created in 'deployment/' directory"

# Step 6: Create .htaccess for Hostinger
cat > deployment/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Enable CORS for API calls
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
EOF

print_status "Created .htaccess file for Hostinger"

# Step 7: Instructions
echo ""
echo "🎉 Deployment package ready!"
echo "============================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🚂 Deploy Backend to Railway:"
echo "   - Go to https://railway.app"
echo "   - Connect your GitHub repository"
echo "   - Add PostgreSQL database"
echo "   - Set environment variables from .env.example"
echo ""
echo "2. 🌐 Deploy Frontend to Hostinger:"
echo "   - Login to Hostinger Control Panel"
echo "   - Go to File Manager → public_html/"
echo "   - Upload all files from 'deployment/' folder"
echo ""
echo "3. ⚙️ Update API URL:"
echo "   - Edit web/src/api/client.js"
echo "   - Change API_BASE_URL to your Railway backend URL"
echo "   - Rebuild frontend: cd web && npm run build"
echo ""
echo "4. 🔧 Configure Domain:"
echo "   - Update CORS_ALLOWED_ORIGINS in server/settings_production.py"
echo "   - Point your domain to Hostinger"
echo ""
echo "📁 Files ready for upload:"
echo "   - deployment/ (for Hostinger)"
echo "   - .env.example (for Railway environment variables)"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
