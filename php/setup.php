<?php
/**
 * School Admin System - Setup Script
 * Run this script once for initial setup
 */

echo "🚀 School Admin System - Setup Script\n";
echo "=====================================\n\n";

// Check PHP version
if (version_compare(PHP_VERSION, '8.0.0', '<')) {
    echo "❌ Error: PHP 8.0 or higher is required. Current version: " . PHP_VERSION . "\n";
    exit(1);
}

echo "✅ PHP version: " . PHP_VERSION . "\n";

// Check required extensions
$required_extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
foreach ($required_extensions as $ext) {
    if (!extension_loaded($ext)) {
        echo "❌ Error: Required PHP extension '$ext' is not loaded\n";
        exit(1);
    }
    echo "✅ Extension '$ext' is loaded\n";
}

// Include configuration files
require_once 'config/config.php';
require_once 'config/database.php';

try {
    echo "\n🔧 Testing database connection...\n";
    
    // Test database connection
    $connection = $db->getConnection();
    if ($connection) {
        echo "✅ Database connection successful\n";
    } else {
        echo "❌ Database connection failed\n";
        exit(1);
    }
    
    // Check if tables exist
    $stmt = $connection->prepare("SHOW TABLES LIKE 'users'");
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        echo "❌ Database tables not found. Please import the schema first.\n";
        echo "   Import the file: database/schema.sql\n";
        exit(1);
    }
    
    echo "✅ Database tables found\n";
    
    // Check if admin user exists
    $stmt = $connection->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    
    if ($stmt->fetchColumn() == 0) {
        echo "\n👤 Creating admin user...\n";
        
        // Create admin user
        $hashedPassword = password_hash('password', PASSWORD_DEFAULT);
        $stmt = $connection->prepare("
            INSERT INTO users (username, email, password, first_name, last_name, role, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $result = $stmt->execute([
            'admin',
            'admin@school.com',
            $hashedPassword,
            'Admin',
            'User',
            'admin',
            'active'
        ]);
        
        if ($result) {
            echo "✅ Admin user created successfully\n";
        } else {
            echo "❌ Failed to create admin user\n";
            exit(1);
        }
    } else {
        echo "✅ Admin user already exists\n";
    }
    
    // Check if sample data exists
    $stmt = $connection->prepare("SELECT COUNT(*) FROM classrooms");
    $stmt->execute();
    $classroomCount = $stmt->fetchColumn();
    
    if ($classroomCount == 0) {
        echo "\n📚 Adding sample data...\n";
        
        // Add sample classrooms
        $classrooms = [
            ['1', 'A', 30],
            ['1', 'B', 30],
            ['2', 'A', 30],
            ['2', 'B', 30],
            ['3', 'A', 30],
            ['3', 'B', 30],
            ['4', 'A', 30],
            ['4', 'B', 30],
            ['5', 'A', 30],
            ['5', 'B', 30]
        ];
        
        $stmt = $connection->prepare("INSERT INTO classrooms (name, section, capacity) VALUES (?, ?, ?)");
        foreach ($classrooms as $classroom) {
            $stmt->execute($classroom);
        }
        echo "✅ Sample classrooms added\n";
        
        // Add sample fee structure
        $feeStructure = [
            [1, 'Tuition Fee', 5000.00, 'monthly', '2024-25'],
            [1, 'Transport Fee', 2000.00, 'monthly', '2024-25'],
            [2, 'Tuition Fee', 5000.00, 'monthly', '2024-25'],
            [2, 'Transport Fee', 2000.00, 'monthly', '2024-25'],
            [3, 'Tuition Fee', 5500.00, 'monthly', '2024-25'],
            [3, 'Transport Fee', 2000.00, 'monthly', '2024-25']
        ];
        
        $stmt = $connection->prepare("INSERT INTO fee_structure (classroom_id, fee_type, amount, frequency, academic_year) VALUES (?, ?, ?, ?, ?)");
        foreach ($feeStructure as $fee) {
            $stmt->execute($fee);
        }
        echo "✅ Sample fee structure added\n";
    } else {
        echo "✅ Sample data already exists\n";
    }
    
    echo "\n🎉 Setup completed successfully!\n";
    echo "===============================\n";
    echo "📋 Login Information:\n";
    echo "   Username: admin\n";
    echo "   Password: password\n";
    echo "\n⚠️  IMPORTANT: Change the default password after first login!\n";
    echo "\n🌐 Access your application at: " . APP_URL . "\n";
    
} catch (Exception $e) {
    echo "❌ Setup failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
