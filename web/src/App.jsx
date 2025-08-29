import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { GraduationCap, Users, BookOpen, LogOut, Sparkles, LayoutDashboard, UserPlus, BarChart3, CreditCard } from 'lucide-react';
import Login from './pages/Login.jsx';
import Students from './pages/Students.jsx';
import Grades from './pages/Grades.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AddStudent from './pages/AddStudent.jsx';
import Reports from './pages/Reports.jsx';
import Fees from './pages/Fees.jsx';

function RequireAuth({ children }) {
  const { accessToken } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  return children;
}

function Navigation() {
  const location = useLocation();
  const { logout } = useAuth();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/grades', label: 'Grades', icon: BookOpen },
    { path: '/fees', label: 'Fees', icon: CreditCard },
    { path: '/students/new', label: 'Add Student', icon: UserPlus },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-xl border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <span className="text-2xl font-bold gradient-text">School Admin</span>
                <div className="flex items-center mt-1">
                  <Sparkles className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-xs text-gray-500">Management Portal</span>
                </div>
              </div>
            </div>
            <div className="ml-6 flex items-baseline space-x-2 overflow-x-auto custom-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={logout}
              className="nav-link-inactive hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 hover:border-red-200 border-2 border-transparent rounded-xl"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 custom-scrollbar">
      <Navigation />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
          <Route path="/students" element={<RequireAuth><Layout><Students /></Layout></RequireAuth>} />
          <Route path="/students/new" element={<RequireAuth><Layout><AddStudent /></Layout></RequireAuth>} />
          <Route path="/fees" element={<RequireAuth><Layout><Fees /></Layout></RequireAuth>} />
          <Route path="/grades" element={<RequireAuth><Layout><Grades /></Layout></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Layout><Reports /></Layout></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
