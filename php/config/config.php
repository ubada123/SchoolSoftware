<?php
/**
 * Main Configuration
 * School Admin System - PHP Version
 */

// Start session
session_start();

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Application settings
define('APP_NAME', 'School Admin System');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'http://localhost'); // Change this to your domain

// Security settings
define('CSRF_TOKEN_NAME', 'csrf_token');
define('SESSION_TIMEOUT', 3600); // 1 hour

// File upload settings
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'pdf']);

// Pagination settings
define('ITEMS_PER_PAGE', 10);

// Date format
define('DATE_FORMAT', 'd-m-Y');
define('DATETIME_FORMAT', 'd-m-Y H:i:s');

// Currency
define('CURRENCY', '₹');

// Timezone
date_default_timezone_set('Asia/Kolkata');

// Helper functions
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

function generate_csrf_token() {
    if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

function verify_csrf_token($token) {
    return isset($_SESSION[CSRF_TOKEN_NAME]) && hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
}

function redirect($url) {
    header("Location: $url");
    exit();
}

function is_logged_in() {
    return isset($_SESSION['user_id']) && isset($_SESSION['username']);
}

function require_login() {
    if (!is_logged_in()) {
        redirect('login.php');
    }
}

function format_date($date) {
    return date(DATE_FORMAT, strtotime($date));
}

function format_datetime($datetime) {
    return date(DATETIME_FORMAT, strtotime($datetime));
}

function format_currency($amount) {
    return CURRENCY . ' ' . number_format($amount, 2);
}

function get_user_role() {
    return $_SESSION['role'] ?? 'user';
}

function is_admin() {
    return get_user_role() === 'admin';
}

function require_admin() {
    require_login();
    if (!is_admin()) {
        redirect('dashboard.php');
    }
}
?>
