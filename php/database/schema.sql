-- School Admin System - PHP Version
-- Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS school_admin;
USE school_admin;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    notes TEXT
);

-- Classrooms table
CREATE TABLE classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(10) NOT NULL,
    section VARCHAR(5) NOT NULL,
    capacity INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_class_section (name, section)
);

-- Students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    father_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15),
    address TEXT,
    classroom_id INT,
    admission_date DATE NOT NULL,
    status ENUM('active', 'inactive', 'transferred') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL
);

-- Fee Structure table
CREATE TABLE fee_structure (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    fee_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    academic_year VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    fee_structure_id INT NOT NULL,
    total_fee DECIMAL(10,2) NOT NULL,
    total_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_method ENUM('cash', 'cheque', 'online', 'card') DEFAULT 'cash',
    receipt_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structure(id) ON DELETE CASCADE
);

-- Attendance table
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'present',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_date (student_id, date)
);

-- Grades table
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    total_marks DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2),
    grade VARCHAR(5),
    exam_date DATE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO users (username, email, password, first_name, last_name, role, status) VALUES 
('admin', 'admin@school.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin', 'active');

-- Insert sample classrooms
INSERT INTO classrooms (name, section, capacity) VALUES 
('1', 'A', 30),
('1', 'B', 30),
('2', 'A', 30),
('2', 'B', 30),
('3', 'A', 30),
('3', 'B', 30),
('4', 'A', 30),
('4', 'B', 30),
('5', 'A', 30),
('5', 'B', 30);

-- Insert sample fee structure
INSERT INTO fee_structure (classroom_id, fee_type, amount, frequency, academic_year) VALUES 
(1, 'Tuition Fee', 5000.00, 'monthly', '2024-25'),
(1, 'Transport Fee', 2000.00, 'monthly', '2024-25'),
(2, 'Tuition Fee', 5000.00, 'monthly', '2024-25'),
(2, 'Transport Fee', 2000.00, 'monthly', '2024-25'),
(3, 'Tuition Fee', 5500.00, 'monthly', '2024-25'),
(3, 'Transport Fee', 2000.00, 'monthly', '2024-25'),
(4, 'Tuition Fee', 5500.00, 'monthly', '2024-25'),
(4, 'Transport Fee', 2000.00, 'monthly', '2024-25');

-- Create indexes for better performance
CREATE INDEX idx_student_classroom ON students(classroom_id);
CREATE INDEX idx_student_roll_number ON students(roll_number);
CREATE INDEX idx_payment_student ON payments(student_id);
CREATE INDEX idx_payment_date ON payments(payment_date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_fee_structure_classroom ON fee_structure(classroom_id);
