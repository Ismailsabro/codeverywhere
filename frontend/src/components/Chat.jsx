import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const TRANSLATE_TARGETS = ['en', 'ru', 'uz'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches backend limit

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileUrl = (msg) => `${api.defaults.baseURL}/messages/${msg.id}/file?token=${localStorage.getItem('token')}`;

const Chat = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [translations, setTranslations] = useState({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert(t('chat.fileTooLarge'));
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append('content', newMessage);
      if (selectedFile) formData.append('file', selectedFile);
      await api.post('/messages', formData);
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMessages();
    } catch (err) { alert(err.response?.data?.error || t('chat.sendError')); }
    finally { setSending(false); }
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
              const isImage = msg.file_type?.startsWith('image/');
              return (
                <div key={msg.id} className={`chat-message ${msg.sender_id === user?.id ? 'own' : ''}`}>
                  <div className="sender">{msg.sender_name} <span style={{opacity:0.7}}>({msg.sender_role})</span></div>
                  {msg.content && <div>{msg.content}</div>}
                  {msg.file_name && (
                    isImage ? (
                      <a href={fileUrl(msg)} target="_blank" rel="noopener noreferrer">
                        <img src={fileUrl(msg)} alt={msg.file_name} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, marginTop: 4, display: 'block' }} />
                      </a>
                    ) : (
                      <a href={fileUrl(msg)} download={msg.file_name} className="chat-file-chip">
                        📎 {msg.file_name} <span style={{opacity:0.7}}>({formatFileSize(msg.file_size)})</span>
                      </a>
                    )
                  )}
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
                    {msg.content && (
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
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        {selectedFile && (
          <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#374151' }}>
            📎 {selectedFile.name} ({formatFileSize(selectedFile.size)})
            <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ marginLeft: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626' }}>{t('chat.removeFile')}</button>
          </div>
        )}
        <form className="chat-input-area" onSubmit={handleSend}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} title={t('chat.attach')}>📎</button>
          <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={t('chat.placeholder')} />
          <button type="submit" className="btn btn-primary" disabled={sending}>{t('chat.send')}</button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
