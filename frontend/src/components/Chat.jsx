import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (loading) return <div className="loading">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header"><h1>💬 {t('chat.title')}</h1><p>{t('chat.subtitle')}</p></div>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 ? <div className="empty-state">{t('chat.empty')}</div> : (
            messages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.sender_id === user?.id ? 'own' : ''}`}>
                <div className="sender">{msg.sender_name} <span style={{opacity:0.7}}>({msg.sender_role})</span></div>
                <div>{msg.content}</div>
                <div className="time">{new Date(msg.created_at).toLocaleTimeString()}</div>
              </div>
            ))
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
