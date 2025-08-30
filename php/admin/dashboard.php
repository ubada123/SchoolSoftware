<?php
require_once '../config/config.php';
require_once '../includes/auth.php';

// Require login
require_login();

// Get dashboard statistics
try {
    // Total students
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM students WHERE status = 'active'");
    $stmt->execute();
    $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total classrooms
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM classrooms");
    $stmt->execute();
    $totalClassrooms = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total payments this month
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM payments WHERE MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())");
    $stmt->execute();
    $totalPayments = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Overdue payments
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM payments WHERE due_date < CURRENT_DATE() AND total_paid < total_fee");
    $stmt->execute();
    $overduePayments = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Recent payments
    $stmt = $db->prepare("
        SELECT p.*, s.first_name, s.last_name, s.roll_number, c.name as class_name, c.section
        FROM payments p
        JOIN students s ON p.student_id = s.id
        JOIN classrooms c ON s.classroom_id = c.id
        ORDER BY p.created_at DESC
        LIMIT 5
    ");
    $stmt->execute();
    $recentPayments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Overdue payments details
    $stmt = $db->prepare("
        SELECT p.*, s.first_name, s.last_name, s.roll_number, c.name as class_name, c.section
        FROM payments p
        JOIN students s ON p.student_id = s.id
        JOIN classrooms c ON s.classroom_id = c.id
        WHERE p.due_date < CURRENT_DATE() AND p.total_paid < p.total_fee
        ORDER BY p.due_date ASC
        LIMIT 10
    ");
    $stmt->execute();
    $overdueDetails = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
} catch (PDOException $e) {
    $error = "Database error: " . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - <?php echo APP_NAME; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .sidebar {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .sidebar .nav-link {
            color: rgba(255, 255, 255, 0.8);
            padding: 12px 20px;
            border-radius: 8px;
            margin: 2px 0;
        }
        .sidebar .nav-link:hover,
        .sidebar .nav-link.active {
            color: white;
            background: rgba(255, 255, 255, 0.1);
        }
        .main-content {
            background: #f8f9fa;
            min-height: 100vh;
        }
        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 1.5rem;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            border-left: 4px solid;
        }
        .stat-card.students { border-left-color: #28a745; }
        .stat-card.classrooms { border-left-color: #007bff; }
        .stat-card.payments { border-left-color: #ffc107; }
        .stat-card.overdue { border-left-color: #dc3545; }
        .stat-icon {
            font-size: 2.5rem;
            opacity: 0.7;
        }
        .table-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-3 col-lg-2 px-0">
                <div class="sidebar p-3">
                    <div class="text-center mb-4">
                        <h4 class="text-white">
                            <i class="fas fa-graduation-cap"></i> <?php echo APP_NAME; ?>
                        </h4>
                    </div>
                    
                    <nav class="nav flex-column">
                        <a class="nav-link active" href="dashboard.php">
                            <i class="fas fa-tachometer-alt me-2"></i> Dashboard
                        </a>
                        <a class="nav-link" href="students.php">
                            <i class="fas fa-users me-2"></i> Students
                        </a>
                        <a class="nav-link" href="fees.php">
                            <i class="fas fa-money-bill me-2"></i> Fees
                        </a>
                        <a class="nav-link" href="attendance.php">
                            <i class="fas fa-calendar-check me-2"></i> Attendance
                        </a>
                        <a class="nav-link" href="grades.php">
                            <i class="fas fa-chart-line me-2"></i> Grades
                        </a>
                        <a class="nav-link" href="users.php">
                            <i class="fas fa-user-shield me-2"></i> Admin Users
                        </a>
                        <hr class="text-white">
                        <a class="nav-link" href="../logout.php">
                            <i class="fas fa-sign-out-alt me-2"></i> Logout
                        </a>
                    </nav>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="col-md-9 col-lg-10">
                <div class="main-content p-4">
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 class="mb-1">Dashboard</h2>
                            <p class="text-muted mb-0">Welcome back, <?php echo htmlspecialchars($_SESSION['first_name']); ?>!</p>
                        </div>
                        <div class="text-end">
                            <small class="text-muted">Last login: <?php echo format_datetime($_SESSION['login_time']); ?></small>
                        </div>
                    </div>
                    
                    <!-- Statistics Cards -->
                    <div class="row mb-4">
                        <div class="col-md-3 mb-3">
                            <div class="stat-card students">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 class="mb-1"><?php echo $totalStudents; ?></h3>
                                        <p class="text-muted mb-0">Total Students</p>
                                    </div>
                                    <div class="stat-icon text-success">
                                        <i class="fas fa-users"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 mb-3">
                            <div class="stat-card classrooms">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 class="mb-1"><?php echo $totalClassrooms; ?></h3>
                                        <p class="text-muted mb-0">Classrooms</p>
                                    </div>
                                    <div class="stat-icon text-primary">
                                        <i class="fas fa-chalkboard"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 mb-3">
                            <div class="stat-card payments">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 class="mb-1"><?php echo $totalPayments; ?></h3>
                                        <p class="text-muted mb-0">Payments This Month</p>
                                    </div>
                                    <div class="stat-icon text-warning">
                                        <i class="fas fa-money-bill"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 mb-3">
                            <div class="stat-card overdue">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 class="mb-1"><?php echo $overduePayments; ?></h3>
                                        <p class="text-muted mb-0">Overdue Payments</p>
                                    </div>
                                    <div class="stat-icon text-danger">
                                        <i class="fas fa-exclamation-triangle"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <!-- Recent Payments -->
                        <div class="col-md-6 mb-4">
                            <div class="table-card">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0"><i class="fas fa-clock me-2"></i>Recent Payments</h5>
                                </div>
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-hover mb-0">
                                            <thead class="table-light">
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Class</th>
                                                    <th>Amount</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php foreach ($recentPayments as $payment): ?>
                                                <tr>
                                                    <td>
                                                        <strong><?php echo htmlspecialchars($payment['first_name'] . ' ' . $payment['last_name']); ?></strong>
                                                        <br><small class="text-muted"><?php echo htmlspecialchars($payment['roll_number']); ?></small>
                                                    </td>
                                                    <td><?php echo htmlspecialchars($payment['class_name'] . '-' . $payment['section']); ?></td>
                                                    <td><?php echo format_currency($payment['total_paid']); ?></td>
                                                    <td><?php echo format_date($payment['payment_date']); ?></td>
                                                </tr>
                                                <?php endforeach; ?>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Overdue Payments -->
                        <div class="col-md-6 mb-4">
                            <div class="table-card">
                                <div class="card-header bg-danger text-white">
                                    <h5 class="mb-0"><i class="fas fa-exclamation-triangle me-2"></i>Overdue Payments</h5>
                                </div>
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-hover mb-0">
                                            <thead class="table-light">
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Class</th>
                                                    <th>Due Date</th>
                                                    <th>Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php foreach ($overdueDetails as $payment): ?>
                                                <tr>
                                                    <td>
                                                        <strong><?php echo htmlspecialchars($payment['first_name'] . ' ' . $payment['last_name']); ?></strong>
                                                        <br><small class="text-muted"><?php echo htmlspecialchars($payment['roll_number']); ?></small>
                                                    </td>
                                                    <td><?php echo htmlspecialchars($payment['class_name'] . '-' . $payment['section']); ?></td>
                                                    <td>
                                                        <span class="text-danger"><?php echo format_date($payment['due_date']); ?></span>
                                                    </td>
                                                    <td><?php echo format_currency($payment['total_fee'] - $payment['total_paid']); ?></td>
                                                </tr>
                                                <?php endforeach; ?>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
