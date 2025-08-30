# 🚀 School Admin System - PHP Installation Guide

## Overview
This guide will help you install the PHP version of the School Admin System on Hostinger or any PHP hosting provider.

## 📋 Requirements

### Server Requirements
- **PHP**: 8.0 or higher
- **MySQL**: 5.7 or higher (MariaDB 10.2+)
- **Web Server**: Apache/Nginx
- **Extensions**: PDO, PDO_MySQL, JSON, mbstring

### Hosting Providers
- ✅ Hostinger
- ✅ cPanel hosting
- ✅ Shared hosting
- ✅ VPS with PHP support

---

## 🔧 Installation Steps

### Step 1: Download Files
1. Download the PHP version files
2. Extract to your local computer
3. Upload to your hosting directory (usually `public_html/`)

### Step 2: Database Setup
1. **Create Database**:
   - Login to your hosting control panel
   - Go to phpMyAdmin or Database section
   - Create a new MySQL database named `school_admin`

2. **Import Schema**:
   - Open phpMyAdmin
   - Select your `school_admin` database
   - Go to "Import" tab
   - Upload and import `database/schema.sql`

### Step 3: Configure Database Connection
1. Edit `config/database.php`
2. Update database credentials:
   ```php
   private $host = 'localhost';
   private $db_name = 'school_admin';
   private $username = 'your_db_username';
   private $password = 'your_db_password';
   ```

### Step 4: Configure Application
1. Edit `config/config.php`
2. Update the APP_URL:
   ```php
   define('APP_URL', 'https://yourdomain.com');
   ```

### Step 5: Set Permissions
1. Make sure all files are readable by web server
2. Ensure `config/` directory is secure

### Step 6: Test Installation
1. Visit your domain: `https://yourdomain.com`
2. You should be redirected to login page
3. Use default credentials:
   - **Username**: `admin`
   - **Password**: `password`

---

## 🔒 Security Setup

### 1. Change Default Password
1. Login with default credentials
2. Go to Admin Users section
3. Change the admin password

### 2. Update Database Password
1. Change the default database password
2. Update `config/database.php` with new credentials

### 3. Enable HTTPS
1. Install SSL certificate (usually free with hosting)
2. Force HTTPS redirect in `.htaccess`

### 4. File Permissions
```bash
# Set proper permissions
chmod 644 *.php
chmod 755 config/
chmod 755 admin/
```

---

## 📁 File Structure

```
public_html/
├── config/
│   ├── database.php      # Database configuration
│   └── config.php        # Application settings
├── includes/
│   └── auth.php          # Authentication system
├── admin/
│   ├── dashboard.php     # Admin dashboard
│   ├── students.php      # Student management
│   ├── fees.php          # Fee management
│   └── users.php         # User management
├── database/
│   └── schema.sql        # Database schema
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── images/           # Images
├── login.php             # Login page
├── logout.php            # Logout handler
└── index.php             # Main entry point
```

---

## 🔧 Configuration Options

### Database Configuration (`config/database.php`)
```php
class Database {
    private $host = 'localhost';
    private $db_name = 'school_admin';
    private $username = 'your_username';
    private $password = 'your_password';
}
```

### Application Settings (`config/config.php`)
```php
// Application settings
define('APP_NAME', 'School Admin System');
define('APP_URL', 'https://yourdomain.com');

// Date format
define('DATE_FORMAT', 'd-m-Y');
define('CURRENCY', '₹');

// Security
define('SESSION_TIMEOUT', 3600); // 1 hour
```

---

## 🚀 Quick Installation Script

For automated installation, create a setup script:

```php
<?php
// setup.php - Run this once for initial setup
require_once 'config/config.php';
require_once 'config/database.php';

try {
    // Test database connection
    $db->getConnection();
    echo "✅ Database connection successful\n";
    
    // Check if admin user exists
    $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    
    if ($stmt->fetchColumn() == 0) {
        // Create admin user
        $hashedPassword = password_hash('password', PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO users (username, email, password, first_name, last_name, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute(['admin', 'admin@school.com', $hashedPassword, 'Admin', 'User', 'admin', 'active']);
        echo "✅ Admin user created\n";
    }
    
    echo "🎉 Setup completed successfully!\n";
    echo "Login: admin / password\n";
    
} catch (Exception $e) {
    echo "❌ Setup failed: " . $e->getMessage() . "\n";
}
?>
```

---

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check database credentials in `config/database.php`
   - Verify database exists and is accessible
   - Check PHP PDO extension is enabled

2. **500 Internal Server Error**
   - Check PHP error logs
   - Verify file permissions
   - Check PHP version compatibility

3. **Login Not Working**
   - Verify database schema is imported
   - Check if admin user exists
   - Clear browser cache and cookies

4. **Page Not Found**
   - Check file paths and URLs
   - Verify .htaccess configuration
   - Check hosting directory structure

### Error Logs
- **PHP Errors**: Check hosting error logs
- **Database Errors**: Check MySQL error logs
- **Application Logs**: Check browser console

---

## 📞 Support

### Getting Help
1. Check the troubleshooting section above
2. Review error logs
3. Contact your hosting provider
4. Check PHP and MySQL documentation

### Useful Commands
```bash
# Check PHP version
php -v

# Check PHP extensions
php -m | grep pdo

# Test database connection
php -r "require 'config/database.php'; echo 'Database OK';"
```

---

## 🎯 Next Steps

After successful installation:

1. **Change Default Password**
   - Login with admin/password
   - Go to Admin Users section
   - Update admin password

2. **Add Your Data**
   - Add classrooms and sections
   - Add students
   - Configure fee structure

3. **Customize**
   - Update school information
   - Modify fee structure
   - Add custom fields if needed

4. **Backup**
   - Set up regular database backups
   - Backup application files

---

**🎉 Congratulations! Your School Admin System is now ready to use!**
