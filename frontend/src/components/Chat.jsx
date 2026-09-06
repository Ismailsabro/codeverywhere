import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const TRANSLATE_TARGETS = ['en', 'ru', 'uz'];

const Chat = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState({});
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages');
      setMessages(res.data);
      if (res.data.length > 0) {
        const maxId = Math.max(...res.data.map(m => m.id));
        localStorage.setItem('chatLastSeenId', String(maxId));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.post('/messages', { content: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (err) { alert(t('chat.sendError')); }
  };

  const translateMessage = async (msg, target) => {
    setTranslations(prev => ({ ...prev, [msg.id]: { lang: target, loading: true } }));
    try {
      const res = await api.post('/translate', { text: msg.content, target });
      setTranslations(prev => ({ ...prev, [msg.id]: { lang: target, text: res.data.translatedText } }));
    } catch (err) {
      setTranslations(prev => ({ ...prev, [msg.id]: { lang: target, error: true } }));
    }
  };

  const clearTranslation = (id) => {
    setTranslations(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (loading) return <div className="loading">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header"><h1>💬 {t('chat.title')}</h1><p>{t('chat.subtitle')}</p></div>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 ? <div className="empty-state">{t('chat.empty')}</div> : (
            messages.map(msg => {
              const translation = translations[msg.id];
              return (
                <div key={msg.id} className={`chat-message ${msg.sender_id === user?.id ? 'own' : ''}`}>
                  <div className="sender">{msg.sender_name} <span style={{opacity:0.7}}>({msg.sender_role})</span></div>
                  <div>{msg.content}</div>
                  {translation && (
                    <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(128,128,128,0.3)', fontStyle: 'italic', opacity: 0.85 }}>
                      {translation.loading ? t('common.loading') : translation.error ? t('chat.translateError') : (
                        <>
                          {translation.text}
                          <button onClick={() => clearTranslation(msg.id)} style={{ marginLeft: 8, background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7 }}>{t('chat.hideTranslation')}</button>
                        </>
                      )}
                    </div>
                  )}
                  <div className="time">
                    {new Date(msg.created_at).toLocaleTimeString()}
                    <span style={{ marginLeft: 8 }}>
                      {t('chat.translate')}:{' '}
                      {TRANSLATE_TARGETS.map(lang => (
                        <button
                          key={lang}
                          onClick={() => translateMessage(msg, lang)}
                          disabled={translation?.loading}
                          style={{ marginLeft: 4, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', opacity: translation?.lang === lang ? 1 : 0.7, fontWeight: translation?.lang === lang ? 'bold' : 'normal' }}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input-area" onSubmit={handleSend}>
          <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={t('chat.placeholder')} />
          <button type="submit" className="btn btn-primary">{t('chat.send')}</button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
