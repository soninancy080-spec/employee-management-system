import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthUser } from './store/authSlice';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Forgot from './pages/Forgot';
import Reset from './pages/Reset';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Skills from './pages/Skills';
import Leaves from './pages/Leaves';
import AuditLogs from './pages/AuditLogs';
import Assets from './pages/Assets';
import Reports from './pages/Reports';
import Attendance from './pages/Attendance';
import Salaries from './pages/Salaries';
import Profile from './pages/Profile';
import Performance from './pages/Performance';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import NotificationBell from './components/NotificationBell';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'absolute',
        top: '20px',
        right: '100px',
        zIndex: 1000,
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-main)',
        cursor: 'pointer',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease',
      }}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

// Layout wrapper for authenticated portal
const PortalLayout = ({ children }) => (
  <div className="portal-layout">
    <Sidebar />
    <main className="portal-content" style={{ position: 'relative' }}>
      <NotificationBell />
      <ThemeToggle />
      {children}
    </main>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuthUser());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<Forgot />} />
        <Route path="/reset-password" element={<Reset />} />

        {/* Protected Dashboard/EMS Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <Dashboard />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <Profile />
              </PortalLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <Employees />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <Departments />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/skills"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <Skills />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaves"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <Leaves />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <Assets />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <Attendance />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/salaries"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <Salaries />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <Performance />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
              <PortalLayout>
                <Reports />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
              <PortalLayout>
                <AuditLogs />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Route (Only ADMIN role) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <PortalLayout>
                <AdminPage />
              </PortalLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
