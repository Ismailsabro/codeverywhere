import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Employees from './components/Employees';
import Chat from './components/Chat';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return children;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 200, background: '#111827', color: 'white', padding: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>codeverywhere</h2>
        <Link to="/" style={{ display: 'block', color: location.pathname === '/' ? '#60a5fa' : 'white', marginBottom: '1rem', textDecoration: 'none' }}>👥 Employés</Link>
        <Link to="/chat" style={{ display: 'block', color: location.pathname === '/chat' ? '#60a5fa' : 'white', marginBottom: '1rem', textDecoration: 'none' }}>💬 Chat</Link>
        <button onClick={logout} style={{ marginTop: '2rem', background: 'transparent', border: '1px solid #374151', color: 'white', padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer' }}>
          Déconnexion
        </button>
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
