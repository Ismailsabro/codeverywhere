import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

const emptyForm = { title: '', description: '', employee_id: '', status: 'pending', due_date: '' };

const Tasks = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [tasksRes, employeesRes] = await Promise.all([api.get('/tasks'), api.get('/employees')]);
      setTasks(tasksRes.data);
      setEmployees(employeesRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, employee_id: formData.employee_id || null };
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      setShowModal(false);
      setEditingTask(null);
      setFormData(emptyForm);
      fetchAll();
    } catch (err) { alert(err.response?.data?.error || t('common.error')); }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      employee_id: task.employee_id || '',
      status: task.status,
      due_date: task.due_date || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('tasks.deleteConfirm'))) return;
    try { await api.delete(`/tasks/${id}`); fetchAll(); }
    catch (err) { alert(t('common.error')); }
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>✅ {t('tasks.title')}</h1><p>{t('tasks.subtitle')}</p></div>
        <button className="btn btn-success" onClick={() => { setEditingTask(null); setFormData(emptyForm); setShowModal(true); }}>
          {t('tasks.addButton')}
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('tasks.table.title')}</th>
              <th>{t('tasks.table.employee')}</th>
              <th>{t('tasks.table.status')}</th>
              <th>{t('tasks.table.dueDate')}</th>
              <th>{t('tasks.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr><td colSpan="5" className="empty-state">{t('tasks.empty')}</td></tr>
            ) : (
              tasks.map(task => (
                <tr key={task.id}>
                  <td><strong>{task.title}</strong></td>
                  <td>{task.employee_name || t('tasks.unassigned')}</td>
                  <td><span className={`status-badge status-${task.status}`}>{t(`tasks.status.${task.status}`)}</span></td>
                  <td>{task.due_date || '—'}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(task)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)} style={{marginLeft:'0.5rem'}}>🗑️</button>
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
              <h3>{editingTask ? t('tasks.modal.editTitle') : t('tasks.modal.addTitle')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group"><label>{t('tasks.form.title')}</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
                  <div className="form-group"><label>{t('tasks.form.description')}</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                  <div className="form-group">
                    <label>{t('tasks.form.employee')}</label>
                    <select value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}>
                      <option value="">{t('tasks.unassigned')}</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('tasks.form.status')}</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="pending">{t('tasks.status.pending')}</option>
                      <option value="in_progress">{t('tasks.status.in_progress')}</option>
                      <option value="done">{t('tasks.status.done')}</option>
                    </select>
                  </div>
                  <div className="form-group"><label>{t('tasks.form.dueDate')}</label><input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingTask ? t('tasks.modal.submitEdit') : t('tasks.modal.submitAdd')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
