import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Building2, Edit2, Trash2, Plus, AlertTriangle, CheckCircle, X } from 'lucide-react';

const Departments = () => {
  const { token, user } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === 'ADMIN';

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/v1/departments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setDepartments(data);
      } else {
        setError(data.message || 'Failed to load departments');
      }
    } catch (err) {
      setError('Network error loading departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ name: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setEditId(dept.id);
    setForm({ name: dept.name, description: dept.description || '' });
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = editId 
        ? `http://localhost:5001/api/v1/departments/${editId}` 
        : 'http://localhost:5001/api/v1/departments';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editId ? 'Department updated!' : 'Department created!');
        fetchDepartments();
        setShowModal(false);
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Network error, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? All employees in it will have their department cleared.')) return;

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:5001/api/v1/departments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setSuccess('Department deleted successfully!');
        fetchDepartments();
      } else {
        const data = await res.json();
        setError(data.message || 'Delete failed');
      }
    } catch (err) {
      setError('Network error during deletion');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ textAlign: 'left', margin: 0 }}>Departments Master</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Configure company departments and divisions</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenAdd} className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
            <Plus size={18} />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {success && (
        <div className="alert-banner success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        </div>
      ) : (
        <div className="glass-card" style={{ maxWidth: '100%', padding: '24px' }}>
          <table className="portal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Department Name</th>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Employees Count</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                    No departments configured yet.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id}>
                    <td>{dept.id}</td>
                    <td style={{ fontWeight: 600 }}>{dept.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{dept.description || '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      <span className="pill-badge" style={{ background: 'hsla(230, 25%, 25%, 0.3)' }}>
                        {dept._count?.employees || 0}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleOpenEdit(dept)} className="btn-logout" style={{ width: 'auto', padding: '6px 12px', borderColor: 'var(--card-border)' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(dept.id)} className="btn-logout" style={{ width: 'auto', padding: '6px 12px', borderColor: 'var(--card-border)' }}>
                            <Trash2 size={14} style={{ color: 'var(--error)' }} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={handleCloseModal} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={24} style={{ color: 'var(--primary-start)' }} />
              <span>{editId ? 'Edit Department' : 'Create Department'}</span>
            </h2>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="dept-name">Department Name</label>
                <input
                  type="text"
                  id="dept-name"
                  className="form-input"
                  placeholder="e.g. Engineering"
                  style={{ paddingLeft: '16px' }}
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dept-desc">Description</label>
                <textarea
                  id="dept-desc"
                  className="form-input"
                  rows={4}
                  placeholder="Describe the department's operations..."
                  style={{ paddingLeft: '16px', height: 'auto', resize: 'vertical' }}
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting || !form.name.trim()}>
                  {submitting ? <div className="spinner"></div> : <span>Save Department</span>}
                </button>
                <button type="button" onClick={handleCloseModal} className="btn-logout" style={{ flex: 1 }} disabled={submitting}>
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
