import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Bookings from './pages/Bookings';
import QuoteRequests from './pages/QuoteRequests';
import Categories from './pages/Categories';
import Users from './pages/Users';
import { clearAuthSession, getStoredUser, hasAdminAccess } from './services/api';

function ProtectedRoute({ user, children }) {
  return hasAdminAccess(user) ? children : <Navigate to="/login" replace />;
}

function AppLayout({ user, onLogout, onAuthSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <div className="auth-shell">
        <main className="page-content">
          <Routes>
            <Route
              path="/login"
              element={
                hasAdminAccess(user)
                  ? <Navigate to="/dashboard" replace />
                  : <Login onAuthSuccess={(nextUser) => {
                    onAuthSuccess(nextUser);
                    navigate('/dashboard', { replace: true });
                  }} />
              }
            />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-content">
        <Navbar user={user} onLogout={onLogout} />

        <main className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to={hasAdminAccess(user) ? '/dashboard' : '/login'} replace />} />
            <Route path="/login" element={<Navigate to={hasAdminAccess(user) ? '/dashboard' : '/login'} replace />} />
            <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute user={user}><Products /></ProtectedRoute>} />
            <Route path="/quote-requests" element={<ProtectedRoute user={user}><QuoteRequests /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute user={user}><Orders /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute user={user}><Bookings /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute user={user}><Categories /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute user={user}><Users /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(getStoredUser());

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
  };

  return (
    <BrowserRouter>
      <AppLayout user={user} onLogout={handleLogout} onAuthSuccess={setUser} />
    </BrowserRouter>
  );
}

export default App;
