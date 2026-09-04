import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Employees from './components/Employees';
import Chat from './components/Chat';
import LanguageSwitcher from './components/LanguageSwitcher';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="loading">{t('common.loading')}</div>;
  return user ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  if (!user) return children;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 200, background: '#111827', color: 'white', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{t('app.name')}</h2>
        <Link to="/" style={{ display: 'block', color: location.pathname === '/' ? '#60a5fa' : 'white', marginBottom: '1rem', textDecoration: 'none' }}>👥 {t('nav.employees')}</Link>
        <Link to="/chat" style={{ display: 'block', color: location.pathname === '/chat' ? '#60a5fa' : 'white', marginBottom: '1rem', textDecoration: 'none' }}>💬 {t('nav.chat')}</Link>
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
            <Route path="/" element={<PrivateRoute><Employees /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
