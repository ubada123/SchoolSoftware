<?php
/**
 * Authentication System
 * School Admin System - PHP Version
 */

require_once 'config/config.php';
require_once 'config/database.php';

class Auth {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function login($username, $password) {
        try {
            $query = "SELECT id, username, password, role, status, first_name, last_name 
                      FROM users 
                      WHERE username = :username AND status = 'active'";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (password_verify($password, $user['password'])) {
                    // Set session variables
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['role'] = $user['role'];
                    $_SESSION['first_name'] = $user['first_name'];
                    $_SESSION['last_name'] = $user['last_name'];
                    $_SESSION['login_time'] = time();
                    
                    // Update last login
                    $this->updateLastLogin($user['id']);
                    
                    return ['success' => true, 'message' => 'Login successful'];
                } else {
                    return ['success' => false, 'message' => 'Invalid password'];
                }
            } else {
                return ['success' => false, 'message' => 'User not found or inactive'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function logout() {
        // Clear all session variables
        $_SESSION = array();
        
        // Destroy the session
        session_destroy();
        
        return ['success' => true, 'message' => 'Logout successful'];
    }

    public function register($userData) {
        try {
            // Check if username already exists
            $checkQuery = "SELECT id FROM users WHERE username = :username";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(':username', $userData['username']);
            $checkStmt->execute();

            if ($checkStmt->rowCount() > 0) {
                return ['success' => false, 'message' => 'Username already exists'];
            }

            // Hash password
            $hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT);

            $query = "INSERT INTO users (username, email, password, first_name, last_name, role, status, created_at) 
                      VALUES (:username, :email, :password, :first_name, :last_name, :role, :status, NOW())";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':username', $userData['username']);
            $stmt->bindParam(':email', $userData['email']);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->bindParam(':first_name', $userData['first_name']);
            $stmt->bindParam(':last_name', $userData['last_name']);
            $stmt->bindParam(':role', $userData['role']);
            $stmt->bindParam(':status', $userData['status']);

            if ($stmt->execute()) {
                return ['success' => true, 'message' => 'User registered successfully'];
            } else {
                return ['success' => false, 'message' => 'Registration failed'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function updateLastLogin($userId) {
        try {
            $query = "UPDATE users SET last_login = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();
        } catch (PDOException $e) {
            // Log error but don't fail login
            error_log("Failed to update last login: " . $e->getMessage());
        }
    }

    public function changePassword($userId, $currentPassword, $newPassword) {
        try {
            // Verify current password
            $query = "SELECT password FROM users WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (password_verify($currentPassword, $user['password'])) {
                    // Hash new password
                    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                    
                    // Update password
                    $updateQuery = "UPDATE users SET password = :password WHERE id = :id";
                    $updateStmt = $this->db->prepare($updateQuery);
                    $updateStmt->bindParam(':password', $hashedPassword);
                    $updateStmt->bindParam(':id', $userId);
                    
                    if ($updateStmt->execute()) {
                        return ['success' => true, 'message' => 'Password changed successfully'];
                    } else {
                        return ['success' => false, 'message' => 'Failed to update password'];
                    }
                } else {
                    return ['success' => false, 'message' => 'Current password is incorrect'];
                }
            } else {
                return ['success' => false, 'message' => 'User not found'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function getAllUsers() {
        try {
            $query = "SELECT id, username, email, first_name, last_name, role, status, created_at, last_login 
                      FROM users 
                      ORDER BY created_at DESC";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }

    public function deleteUser($userId) {
        try {
            $query = "DELETE FROM users WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $userId);
            
            if ($stmt->execute()) {
                return ['success' => true, 'message' => 'User deleted successfully'];
            } else {
                return ['success' => false, 'message' => 'Failed to delete user'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function updateUser($userId, $userData) {
        try {
            $query = "UPDATE users SET 
                      email = :email, 
                      first_name = :first_name, 
                      last_name = :last_name, 
                      role = :role, 
                      status = :status 
                      WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':email', $userData['email']);
            $stmt->bindParam(':first_name', $userData['first_name']);
            $stmt->bindParam(':last_name', $userData['last_name']);
            $stmt->bindParam(':role', $userData['role']);
            $stmt->bindParam(':status', $userData['status']);
            $stmt->bindParam(':id', $userId);
            
            if ($stmt->execute()) {
                return ['success' => true, 'message' => 'User updated successfully'];
            } else {
                return ['success' => false, 'message' => 'Failed to update user'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Initialize auth object
$auth = new Auth($db);
?>
