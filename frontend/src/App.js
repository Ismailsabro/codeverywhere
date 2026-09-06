import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Employees from './components/Employees';
import Chat from './components/Chat';
import LanguageSwitcher from './components/LanguageSwitcher';
import api from './api';
import './index.css';

const UNREAD_POLL_MS = 5000;

const useUnreadMessages = (user) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await api.get('/messages');
        const lastSeenId = Number(localStorage.getItem('chatLastSeenId') || 0);
        const unread = res.data.filter(m => m.id > lastSeenId && m.sender_id !== user.id).length;
        if (!cancelled) setCount(unread);
      } catch (err) { /* ignore */ }
    };

    check();
    const interval = setInterval(check, UNREAD_POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  return count;
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="loading">{t('common.loading')}</div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (!user) return <Navigate to="/login" />;
  return user.role === 'admin' ? children : <Navigate to="/tasks" />;
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const unreadCount = useUnreadMessages(user);
  if (!user) return children;

  const isAdmin = user.role === 'admin';

  const navLinkStyle = (path) => ({
    display: 'block', color: location.pathname === path ? '#60a5fa' : 'white', marginBottom: '1rem', textDecoration: 'none'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 200, background: '#111827', color: 'white', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{t('app.name')}</h2>
        {isAdmin && <Link to="/" style={navLinkStyle('/')}>📊 {t('nav.dashboard')}</Link>}
        {isAdmin && <Link to="/employees" style={navLinkStyle('/employees')}>👥 {t('nav.employees')}</Link>}
        <Link to="/tasks" style={navLinkStyle('/tasks')}>✅ {isAdmin ? t('nav.tasks') : t('nav.myTasks')}</Link>
        <Link to="/chat" style={navLinkStyle('/chat')}>
          💬 {t('nav.chat')}
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </Link>
        <div style={{ marginTop: 'auto' }}>
          <LanguageSwitcher />
          <button onClick={logout} style={{ marginTop: '1rem', width: '100%', background: 'transparent', border: '1px solid #374151', color: 'white', padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer' }}>
            {t('nav.logout')}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, padding: '1.5rem' }}>{children}</div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
            <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
