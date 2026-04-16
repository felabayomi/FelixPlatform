import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DocumentFormatter from './pages/DocumentFormatter';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Bookings from './pages/Bookings';
import QuoteRequests from './pages/QuoteRequests';
import PlatformContent from './pages/PlatformContent';
import AdrianStore from './pages/AdrianStore';
import WACI from './pages/WACI';
import WildlifePedia from './pages/WildlifePedia';
import Categories from './pages/Categories';
import Users from './pages/Users';
import ExpeditionAmerica from './pages/ExpeditionAmerica';
import ExpeditionAmericaStandalone from './pages/ExpeditionAmericaStandalone';
import CityTourHub from './pages/CityTourHub';
import WACIProjectHub from './pages/WACIProjectHub';
import DailyFelixWordOfDay from './pages/DailyFelixWordOfDay';
import CityDayInt from './pages/CityDayInt';
import CityOfDay from './pages/CityOfDay';
import TFCGChat from './pages/TFCGChat';
import FeliTrips from './pages/FeliTrips';

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
            <Route path="/document-formatter" element={<ProtectedRoute user={user}><DocumentFormatter /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute user={user}><Products /></ProtectedRoute>} />
            <Route path="/quote-requests" element={<ProtectedRoute user={user}><QuoteRequests /></ProtectedRoute>} />
            <Route path="/platform-content" element={<ProtectedRoute user={user}><PlatformContent /></ProtectedRoute>} />
            <Route path="/adrian-store" element={<ProtectedRoute user={user}><AdrianStore /></ProtectedRoute>} />
            <Route path="/waci" element={<ProtectedRoute user={user}><WACI /></ProtectedRoute>} />
            <Route path="/wildlife-pedia" element={<ProtectedRoute user={user}><WildlifePedia /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute user={user}><Orders /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute user={user}><Bookings /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute user={user}><Categories /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute user={user}><Users /></ProtectedRoute>} />
            <Route path="/expedition-america" element={<ProtectedRoute user={user}><ExpeditionAmerica /></ProtectedRoute>} />
            <Route path="/expedition-america-app" element={<ProtectedRoute user={user}><ExpeditionAmericaStandalone /></ProtectedRoute>} />
            <Route path="/city-tour-hub" element={<ProtectedRoute user={user}><CityTourHub /></ProtectedRoute>} />
            <Route path="/waci-project-hub" element={<ProtectedRoute user={user}><WACIProjectHub /></ProtectedRoute>} />
            <Route path="/dailyfelix-wordofday" element={<ProtectedRoute user={user}><DailyFelixWordOfDay /></ProtectedRoute>} />
            <Route path="/citydayint-international" element={<ProtectedRoute user={user}><CityDayInt /></ProtectedRoute>} />
            <Route path="/cityofday-daily" element={<ProtectedRoute user={user}><CityOfDay /></ProtectedRoute>} />
            <Route path="/tfcgchat" element={<ProtectedRoute user={user}><TFCGChat /></ProtectedRoute>} />
            <Route path="/felitrips" element={<ProtectedRoute user={user}><FeliTrips /></ProtectedRoute>} />
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
