import React, { useEffect, useState } from 'react';
import api from '../api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', position: '', department: '', salary: 0, status: 'active', hire_date: ''
  });

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
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({...emp, hire_date: emp.hire_date || ''});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet employé ?')) return;
    try { await api.delete(`/employees/${id}`); fetchEmployees(); }
    catch (err) { alert('Erreur'); }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>👥 Employés (RH)</h1><p>Gestion des ressources humaines</p></div>
        <button className="btn btn-success" onClick={() => { setEditingEmployee(null); setFormData({ name: '', email: '', phone: '', position: '', department: '', salary: 0, status: 'active', hire_date: '' }); setShowModal(true); }}>
          + Ajouter un employé
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr><th>Nom</th><th>Contact</th><th>Poste</th><th>Département</th><th>Salaire</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan="7" className="empty-state">Aucun employé</td></tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id}>
                  <td><strong>{emp.name}</strong></td>
                  <td><div>{emp.email}</div><div style={{fontSize:'0.8rem',color:'#6b7280'}}>{emp.phone}</div></td>
                  <td>{emp.position}</td>
                  <td>{emp.department}</td>
                  <td>{emp.salary ? Number(emp.salary).toFixed(2) : '0.00'} DH</td>
                  <td><span className={`status-badge status-${emp.status}`}>{emp.status}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(emp)}>✏️</button>
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
              <h3>{editingEmployee ? 'Modifier' : 'Ajouter'} un employé</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group"><label>Nom complet</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                  <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div className="form-group"><label>Téléphone</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                  <div className="form-group"><label>Poste</label><input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} /></div>
                  <div className="form-group"><label>Département</label><input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
                  <div className="form-group"><label>Salaire (DH)</label><input type="number" step="0.01" value={formData.salary} onChange={e => setFormData({...formData, salary: parseFloat(e.target.value)})} /></div>
                  <div className="form-group"><label>Date d'embauche</label><input type="date" value={formData.hire_date} onChange={e => setFormData({...formData, hire_date: e.target.value})} /></div>
                  {editingEmployee && (
                    <div className="form-group"><label>Statut</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="active">Actif</option><option value="on_leave">En congé</option><option value="terminated">Terminé</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">{editingEmployee ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
