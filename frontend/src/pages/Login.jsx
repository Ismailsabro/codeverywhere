import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('login.error'));
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <h2>{isRegister ? t('login.registerTitle') : t('login.loginTitle')}</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <div style={{ marginBottom: 12 }}>
            <label>{t('login.name')}</label>
            <input style={{ width: '100%', padding: 8 }} value={name} onChange={e => setName(e.target.value)} required />
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label>{t('login.email')}</label>
          <input type="email" style={{ width: '100%', padding: 8 }} value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>{t('login.password')}</label>
          <input type="password" style={{ width: '100%', padding: 8 }} value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 10 }}>
          {isRegister ? t('login.submitRegister') : t('login.submitLogin')}
        </button>
      </form>
      <p style={{ marginTop: 12, cursor: 'pointer', color: '#2563eb' }} onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? t('login.switchToLogin') : t('login.switchToRegister')}
      </p>
    </div>
  );
};

export default Login;
