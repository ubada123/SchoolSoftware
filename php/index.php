<?php
/**
 * School Admin System - Main Entry Point
 * Redirects to login page or dashboard based on authentication status
 */

require_once 'config/config.php';

// Redirect based on authentication status
if (is_logged_in()) {
    redirect('admin/dashboard.php');
} else {
    redirect('login.php');
}
?>
