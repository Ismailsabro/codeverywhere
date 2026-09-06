import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

const Employees = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', position: '', department: '', salary: 0, status: 'active', hire_date: ''
  });
  const [accessEmployee, setAccessEmployee] = useState(null);
  const [accessPassword, setAccessPassword] = useState('');

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setShowModal(false);
      setEditingEmployee(null);
      setFormData({ name: '', email: '', phone: '', position: '', department: '', salary: 0, status: 'active', hire_date: '' });
      fetchEmployees();
    } catch (err) { alert(err.response?.data?.error || t('common.error')); }
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({...emp, hire_date: emp.hire_date || ''});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('employees.deleteConfirm'))) return;
    try { await api.delete(`/employees/${id}`); fetchEmployees(); }
    catch (err) { alert(t('common.error')); }
  };

  const handleSetAccess = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/employees/${accessEmployee.id}/access`, { password: accessPassword });
      alert(t('employees.access.success'));
      setAccessEmployee(null);
      setAccessPassword('');
    } catch (err) { alert(err.response?.data?.error || t('common.error')); }
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>👥 {t('employees.title')}</h1><p>{t('employees.subtitle')}</p></div>
        <button className="btn btn-success" onClick={() => { setEditingEmployee(null); setFormData({ name: '', email: '', phone: '', position: '', department: '', salary: 0, status: 'active', hire_date: '' }); setShowModal(true); }}>
          {t('employees.addButton')}
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr><th>{t('employees.table.name')}</th><th>{t('employees.table.contact')}</th><th>{t('employees.table.position')}</th><th>{t('employees.table.department')}</th><th>{t('employees.table.salary')}</th><th>{t('employees.table.status')}</th><th>{t('employees.table.actions')}</th></tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan="7" className="empty-state">{t('employees.empty')}</td></tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id}>
                  <td><strong>{emp.name}</strong></td>
                  <td><div>{emp.email}</div><div style={{fontSize:'0.8rem',color:'#6b7280'}}>{emp.phone}</div></td>
                  <td>{emp.position}</td>
                  <td>{emp.department}</td>
                  <td>${emp.salary ? Number(emp.salary).toFixed(2) : '0.00'}</td>
                  <td><span className={`status-badge status-${emp.status}`}>{t(`employees.status.${emp.status}`)}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(emp)}>✏️</button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => emp.email ? setAccessEmployee(emp) : alert(t('employees.access.noEmail'))}
                      style={{marginLeft:'0.5rem'}}
                      title={t('employees.access.button')}
                    >🔑</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)} style={{marginLeft:'0.5rem'}}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEmployee ? t('employees.modal.editTitle') : t('employees.modal.addTitle')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group"><label>{t('employees.form.fullName')}</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                  <div className="form-group"><label>{t('employees.form.email')}</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div className="form-group"><label>{t('employees.form.phone')}</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                  <div className="form-group"><label>{t('employees.form.position')}</label><input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} /></div>
                  <div className="form-group"><label>{t('employees.form.department')}</label><input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
                  <div className="form-group"><label>{t('employees.form.salary')}</label><input type="number" step="0.01" value={formData.salary} onChange={e => setFormData({...formData, salary: parseFloat(e.target.value)})} /></div>
                  <div className="form-group"><label>{t('employees.form.hireDate')}</label><input type="date" value={formData.hire_date} onChange={e => setFormData({...formData, hire_date: e.target.value})} /></div>
                  {editingEmployee && (
                    <div className="form-group"><label>{t('employees.form.status')}</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="active">{t('employees.status.active')}</option><option value="on_leave">{t('employees.status.on_leave')}</option><option value="terminated">{t('employees.status.terminated')}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingEmployee ? t('employees.modal.submitEdit') : t('employees.modal.submitAdd')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {accessEmployee && (
        <div className="modal-overlay" onClick={() => setAccessEmployee(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('employees.access.modalTitle')} — {accessEmployee.name}</h3>
              <button className="modal-close" onClick={() => setAccessEmployee(null)}>×</button>
            </div>
            <form onSubmit={handleSetAccess}>
              <div className="modal-body">
                <p style={{ marginTop: 0, color: '#6b7280', fontSize: '0.9rem' }}>{accessEmployee.email}</p>
                <div className="form-group">
                  <label>{t('employees.access.passwordLabel')}</label>
                  <input type="text" value={accessPassword} onChange={e => setAccessPassword(e.target.value)} minLength={6} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAccessEmployee(null)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('employees.access.submit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
