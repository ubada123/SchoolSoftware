<?php
require_once 'config/config.php';
require_once 'includes/auth.php';

// Logout user
$auth->logout();

// Redirect to login page
redirect('login.php');
?>
