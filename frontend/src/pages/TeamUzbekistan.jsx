import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

const emptyForm = { name: '', birth_date: '', start_date: '', salary: 0 };

const photoUrl = (member) => `${api.defaults.baseURL}/uzbek-team/${member.id}/photo?token=${localStorage.getItem('token')}`;

const TeamUzbekistan = () => {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/uzbek-team');
      setMembers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setEditingMember(null);
    setFormData(emptyForm);
    setSelectedPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('birth_date', formData.birth_date);
    data.append('start_date', formData.start_date);
    data.append('salary', formData.salary);
    if (selectedPhoto) data.append('photo', selectedPhoto);
    try {
      if (editingMember) {
        await api.put(`/uzbek-team/${editingMember.id}`, data);
      } else {
        await api.post('/uzbek-team', data);
      }
      setShowModal(false);
      resetForm();
      fetchMembers();
    } catch (err) { alert(err.response?.data?.error || t('common.error')); }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      birth_date: member.birth_date || '',
      start_date: member.start_date || '',
      salary: member.salary || 0
    });
    setSelectedPhoto(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('teamUzbekistan.deleteConfirm'))) return;
    try { await api.delete(`/uzbek-team/${id}`); fetchMembers(); }
    catch (err) { alert(t('common.error')); }
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>🌍 {t('teamUzbekistan.title')}</h1><p>{t('teamUzbekistan.subtitle')}</p></div>
        <button className="btn btn-success" onClick={() => { resetForm(); setShowModal(true); }}>
          {t('teamUzbekistan.addButton')}
        </button>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">{t('teamUzbekistan.empty')}</div>
      ) : (
        <div className="team-grid">
          {members.map(member => (
            <div key={member.id} className="team-card">
              {member.photo_type ? (
                <img src={photoUrl(member)} alt={member.name} className="team-card-photo" />
              ) : (
                <div className="team-card-photo team-card-photo-placeholder">👤</div>
              )}
              <div className="team-card-name">{member.name}</div>
              <div className="team-card-detail">{t('teamUzbekistan.form.birthDate')}: {member.birth_date || '—'}</div>
              <div className="team-card-detail">{t('teamUzbekistan.form.startDate')}: {member.start_date || '—'}</div>
              <div className="team-card-detail">${member.salary ? Number(member.salary).toFixed(2) : '0.00'}</div>
              <div className="team-card-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(member)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(member.id)} style={{marginLeft:'0.5rem'}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMember ? t('teamUzbekistan.modal.editTitle') : t('teamUzbekistan.modal.addTitle')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group"><label>{t('teamUzbekistan.form.name')}</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                  <div className="form-group">
                    <label>{t('teamUzbekistan.form.photo')}</label>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setSelectedPhoto(e.target.files[0] || null)} />
                  </div>
                  <div className="form-group"><label>{t('teamUzbekistan.form.birthDate')}</label><input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} /></div>
                  <div className="form-group"><label>{t('teamUzbekistan.form.startDate')}</label><input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} /></div>
                  <div className="form-group"><label>{t('teamUzbekistan.form.salary')}</label><input type="number" step="0.01" value={formData.salary} onChange={e => setFormData({...formData, salary: parseFloat(e.target.value)})} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingMember ? t('teamUzbekistan.modal.submitEdit') : t('teamUzbekistan.modal.submitAdd')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamUzbekistan;
