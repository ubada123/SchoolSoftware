# 🚀 School Admin System - Deployment Guide

## Overview
This guide will help you deploy the School Admin System to Hostinger and a backend service.

## Architecture
- **Frontend**: React app (hosted on Hostinger)
- **Backend**: Django API (hosted on Railway/Render/Heroku)
- **Database**: PostgreSQL (provided by backend service)

---

## 📋 Prerequisites

1. **Hostinger Account** (for frontend hosting)
2. **Railway/Render/Heroku Account** (for backend hosting)
3. **GitHub Account** (for code repository)

---

## 🔧 Step 1: Deploy Backend (Django API)

### Option A: Railway (Recommended - Free Tier Available)

1. **Sign up at [Railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Create new project from GitHub repo**
4. **Add PostgreSQL database**:
   - Go to "New" → "Database" → "PostgreSQL"
   - Copy the database URL

5. **Configure environment variables**:
   ```
   DATABASE_URL=your_postgresql_url
   SECRET_KEY=your_secret_key
   DEBUG=False
   ALLOWED_HOSTS=your-domain.com,localhost
   CORS_ALLOWED_ORIGINS=https://your-domain.com,http://localhost:3000
   ```

6. **Deploy**:
   - Railway will automatically detect Django
   - Add build command: `pip install -r requirements.txt`
   - Add start command: `python manage.py migrate && python manage.py runserver 0.0.0.0:$PORT`

### Option B: Render (Alternative)

1. **Sign up at [Render.com](https://render.com)**
2. **Create new Web Service**
3. **Connect GitHub repository**
4. **Configure**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python manage.py migrate && gunicorn server.wsgi:application`
   - Environment: Python 3.11

---

## 🌐 Step 2: Deploy Frontend to Hostinger

### 2.1 Build Frontend for Production

```bash
cd web
npm run build
```

This creates a `dist/` folder with static files.

### 2.2 Configure API Endpoint

Before building, update the API base URL in `web/src/api/client.js`:

```javascript
// Change from localhost to your backend URL
const API_BASE_URL = 'https://your-backend-url.railway.app/api';
```

### 2.3 Upload to Hostinger

1. **Login to Hostinger Control Panel**
2. **Go to File Manager**
3. **Navigate to `public_html/`**
4. **Upload all files from `web/dist/` folder**
5. **Create `.htaccess` file** in `public_html/`:

```apache
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
```

---

## 🔧 Step 3: Database Setup

### 3.1 Create Superuser

After backend deployment, create an admin user:

```bash
# Access your backend terminal (Railway/Render dashboard)
python manage.py createsuperuser
```

### 3.2 Initial Data Setup

Create initial data if needed:

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from core.models import ClassRoom

# Create initial classrooms
classrooms = [
    {'name': '1', 'section': 'A'},
    {'name': '1', 'section': 'B'},
    {'name': '2', 'section': 'A'},
    {'name': '2', 'section': 'B'},
    # Add more as needed
]

for classroom_data in classrooms:
    ClassRoom.objects.get_or_create(
        name=classroom_data['name'],
        section=classroom_data['section']
    )
```

---

## 🔒 Step 4: Security Configuration

### 4.1 Update Django Settings

In `server/settings.py`, ensure production settings:

```python
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com', 'your-backend-url.railway.app']
CORS_ALLOWED_ORIGINS = [
    'https://your-domain.com',
    'http://localhost:3000'
]

# Use environment variables for sensitive data
SECRET_KEY = os.environ.get('SECRET_KEY')
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

### 4.2 SSL/HTTPS

- **Hostinger**: Automatically provides SSL
- **Backend**: Railway/Render provide SSL automatically

---

## 🧪 Step 5: Testing

1. **Test Backend API**: Visit your backend URL + `/api/`
2. **Test Frontend**: Visit your Hostinger domain
3. **Test Login**: Use the superuser credentials you created
4. **Test All Features**: Students, Fees, Admin Users

---

## 🔄 Step 6: Continuous Deployment

### For Backend Updates:
- Push to GitHub
- Railway/Render will auto-deploy

### For Frontend Updates:
1. Update code
2. Run `npm run build`
3. Upload new `dist/` files to Hostinger

---

## 📞 Support

### Common Issues:

1. **CORS Errors**: Check CORS_ALLOWED_ORIGINS in Django settings
2. **API Connection**: Verify API_BASE_URL in frontend
3. **Database Errors**: Check DATABASE_URL environment variable
4. **Static Files**: Ensure `.htaccess` is properly configured

### Useful Commands:

```bash
# Check backend logs
railway logs

# Access backend shell
railway run python manage.py shell

# Create new admin user
railway run python manage.py createsuperuser
```

---

## 💰 Cost Estimation

- **Hostinger**: $2-5/month (shared hosting)
- **Railway**: Free tier available, then $5-20/month
- **Render**: Free tier available, then $7-25/month

**Total**: $2-30/month depending on traffic and features needed.

---

## 🎯 Next Steps

1. **Domain Setup**: Point your domain to Hostinger
2. **Email Configuration**: Set up email for password resets
3. **Backup Strategy**: Regular database backups
4. **Monitoring**: Set up uptime monitoring
5. **SSL Certificate**: Ensure HTTPS is working

---

**🎉 Congratulations! Your School Admin System is now live!**
