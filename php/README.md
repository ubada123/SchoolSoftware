# 🏫 School Admin System - PHP Version

## Overview
This is the PHP version of the School Admin System, designed to run on Hostinger and other PHP hosting providers.

## Features
- ✅ Student Management
- ✅ Fee Management
- ✅ Admin User Management
- ✅ Attendance Tracking
- ✅ Grade Management
- ✅ Responsive Design
- ✅ Secure Authentication
- ✅ Database Management

## Technology Stack
- **Backend**: PHP 8.0+
- **Database**: MySQL/MariaDB
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Authentication**: PHP Sessions
- **Hosting**: Compatible with Hostinger, cPanel, etc.

## File Structure
```
php/
├── config/
│   ├── database.php
│   └── config.php
├── includes/
│   ├── auth.php
│   ├── functions.php
│   └── header.php
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── admin/
│   ├── dashboard.php
│   ├── students.php
│   ├── fees.php
│   └── users.php
├── api/
│   ├── students.php
│   ├── fees.php
│   └── auth.php
└── index.php
```

## Installation
1. Upload files to your hosting directory
2. Import the database schema
3. Configure database connection
4. Set up admin user
5. Access the application

## Database Schema
The application uses MySQL with the following tables:
- `users` - Admin users
- `students` - Student information
- `classrooms` - Class and section data
- `fees` - Fee structure and payments
- `attendance` - Student attendance
- `grades` - Student grades

## Security Features
- Password hashing with bcrypt
- Session-based authentication
- SQL injection prevention
- XSS protection
- CSRF protection
- Input validation and sanitization
