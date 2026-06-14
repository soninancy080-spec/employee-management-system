import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, Plus, Search, Filter, Edit2, Trash2, X, User, Mail, Phone, 
  Building2, Layers, FileText, Image, Paperclip, AlertTriangle, CheckCircle 
} from 'lucide-react';

const Employees = () => {
  const { token, user } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === 'ADMIN';

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    skills: [], // array of skill IDs
    trackingMode: 'OFFLINE',
  });

  // File states
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [docsFiles, setDocsFiles] = useState([]);

  // Preview URLs
  const [profilePreview, setProfilePreview] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchFilterOptions();
  }, [search, deptFilter]);

  const fetchEmployees = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (deptFilter) queryParams.append('departmentId', deptFilter);

      const res = await fetch(`http://localhost:5001/api/v1/employees?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Fetch Departments
      const deptRes = await fetch('http://localhost:5001/api/v1/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deptData = await deptRes.json();
      if (deptRes.ok) setDepartments(deptData);

      // Fetch Skills
      const skillRes = await fetch('http://localhost:5001/api/v1/skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const skillData = await skillRes.json();
      if (skillRes.ok) setSkillsList(skillData);
    } catch (err) {
      console.error('Error fetching dropdown filters:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      departmentId: '',
      skills: [],
      trackingMode: 'OFFLINE',
      role: 'EMPLOYEE',
    });
    setProfileImageFile(null);
    setResumeFile(null);
    setDocsFiles([]);
    setProfilePreview('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditId(emp.id);
    setForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone || '',
      departmentId: emp.departmentId ? emp.departmentId.toString() : '',
      skills: emp.skills ? emp.skills.map(s => s.id) : [],
      trackingMode: emp.trackingMode || 'OFFLINE',
      role: emp.role || 'EMPLOYEE',
    });
    setProfileImageFile(null);
    setResumeFile(null);
    setDocsFiles([]);
    setProfilePreview(emp.profileImage ? `http://localhost:5001${emp.profileImage}` : '');
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSkillsCheckboxChange = (skillId) => {
    setForm((prev) => {
      const isSelected = prev.skills.includes(skillId);
      const updatedSkills = isSelected
        ? prev.skills.filter(id => id !== skillId)
        : [...prev.skills, skillId];
      return { ...prev, skills: updatedSkills };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and Email are required fields');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    // Prepare multipart form data
    const formDataObj = new FormData();
    formDataObj.append('name', form.name);
    formDataObj.append('email', form.email);
    formDataObj.append('phone', form.phone);
    if (form.departmentId) {
      formDataObj.append('departmentId', form.departmentId);
    } else {
      formDataObj.append('departmentId', '');
    }
    formDataObj.append('skills', JSON.stringify(form.skills));
    formDataObj.append('trackingMode', form.trackingMode);
    formDataObj.append('role', form.role || 'EMPLOYEE');

    if (profileImageFile) formDataObj.append('profileImage', profileImageFile);
    if (resumeFile) formDataObj.append('resume', resumeFile);
    
    if (docsFiles.length > 0) {
      for (let i = 0; i < docsFiles.length; i++) {
        formDataObj.append('documents', docsFiles[i]);
      }
    }

    try {
      const url = editId 
        ? `http://localhost:5001/api/v1/employees/${editId}` 
        : 'http://localhost:5001/api/v1/employees';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editId ? 'Employee updated!' : 'Employee added!');
        fetchEmployees();
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
    if (!window.confirm('Are you sure you want to delete this employee record? This will permanently delete their profile and uploaded documents from disk.')) return;

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:5001/api/v1/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setSuccess('Employee deleted successfully!');
        fetchEmployees();
      } else {
        const data = await res.json();
        setError(data.message || 'Deletion failed');
      }
    } catch (err) {
      setError('Network error during deletion');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ textAlign: 'left', margin: 0 }}>Employees Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Monitor and manage employee profiles and documents</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenAdd} className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
            <Plus size={18} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ maxWidth: '100%', padding: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <div className="input-wrapper" style={{ margin: 0 }}>
              <Search className="input-icon" size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ minWidth: '200px', position: 'relative' }}>
            <div className="input-wrapper" style={{ margin: 0 }}>
              <Filter className="input-icon" size={18} />
              <select
                className="form-input"
                style={{ appearance: 'none', paddingRight: '40px' }}
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>▼</div>
            </div>
          </div>
        </div>
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
        <>
          {employees.length === 0 ? (
            <div className="glass-card" style={{ maxWidth: '100%', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No employee records match the filters.
            </div>
          ) : (
            <div className="grid-cards">
              {employees.map((emp) => (
                <div key={emp.id} className="employee-card">
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {emp.profileImage ? (
                      <img 
                        src={`http://localhost:5001${emp.profileImage}`} 
                        alt={emp.name} 
                        className="avatar-large" 
                      />
                    ) : (
                      <div className="avatar-large" style={{
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.8rem',
                        color: '#fff'
                      }}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div style={{ overflow: 'hidden' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</h3>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <span className="pill-badge" style={{ background: emp.department ? 'hsla(263, 90%, 55%, 0.1)' : 'transparent', borderColor: emp.department ? 'var(--card-border-focus)' : 'var(--card-border)', margin: 0 }}>
                          {emp.department ? emp.department.name : 'No Department'}
                        </span>
                        <span className="pill-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', margin: 0, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          {emp.role || 'EMPLOYEE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)', padding: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
                    </div>
                    {emp.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={14} />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Work Mode:</span>
                      <span className="pill-badge" style={{ fontSize: '0.75rem', textTransform: 'uppercase', margin: 0 }}>
                        {emp.trackingMode || 'OFFLINE'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Skills</h4>
                    <div className="pill-group">
                      {emp.skills && emp.skills.length > 0 ? (
                        emp.skills.map(skill => (
                          <span key={skill.id} className="pill-badge" style={{ fontSize: '0.75rem' }}>
                            {skill.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No skills listed</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                    {emp.resumePath && (
                      <a href={`http://localhost:5001${emp.resumePath}`} target="_blank" rel="noreferrer" className="file-link">
                        <FileText size={14} />
                        <span>Download Resume</span>
                      </a>
                    )}
                    {emp.documents && emp.documents.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Paperclip size={12} />
                          <span>Documents ({emp.documents.length}):</span>
                        </span>
                        {emp.documents.map((doc, idx) => (
                          <a key={idx} href={`http://localhost:5001${doc}`} target="_blank" rel="noreferrer" className="file-link" style={{ fontSize: '0.8rem', marginLeft: '16px' }}>
                            <span>Document {idx + 1}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                      <button onClick={() => handleOpenEdit(emp)} className="btn-logout" style={{ flex: 1, padding: '8px 12px' }}>
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="btn-logout" style={{ flex: 1, padding: '8px 12px' }}>
                        <Trash2 size={14} style={{ color: 'var(--error)' }} />
                        <span style={{ color: 'var(--error)' }}>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <button onClick={handleCloseModal} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={24} style={{ color: 'var(--primary-start)' }} />
              <span>{editId ? 'Edit Employee Record' : 'Add New Employee'}</span>
            </h2>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                  {profilePreview ? (
                    <img src={profilePreview} alt="Preview" className="avatar-large" />
                  ) : (
                    <div className="avatar-large" style={{ background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyObject: 'center', justifyContent: 'center' }}>
                      <User size={32} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileChange}
                    style={{ fontSize: '0.85rem' }}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    placeholder="Jane Doe"
                    style={{ paddingLeft: '16px' }}
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="jane@company.com"
                    style={{ paddingLeft: '16px' }}
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    type="text"
                    id="phone"
                    className="form-input"
                    placeholder="+1 (555) 019-2834"
                    style={{ paddingLeft: '16px' }}
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="department">Department</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="department"
                      className="form-input"
                      style={{ paddingLeft: '16px', appearance: 'none' }}
                      value={form.departmentId}
                      onChange={(e) => setForm(prev => ({ ...prev, departmentId: e.target.value }))}
                      disabled={submitting}
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>▼</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="trackingMode">Work Mode</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="trackingMode"
                      className="form-input"
                      style={{ paddingLeft: '16px', appearance: 'none' }}
                      value={form.trackingMode}
                      onChange={(e) => setForm(prev => ({ ...prev, trackingMode: e.target.value }))}
                      disabled={submitting}
                    >
                      <option value="OFFLINE">Offline</option>
                      <option value="ONLINE">Online</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>▼</div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="role">User Role</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="role"
                      className="form-input"
                      style={{ paddingLeft: '16px', appearance: 'none' }}
                      value={form.role || 'EMPLOYEE'}
                      onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                      disabled={submitting}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGER">Manager</option>
                      <option value="HR">HR</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>▼</div>
                  </div>
                </div>
              </div>

              {/* Skills Dropdown Selection */}
              <div className="form-group">
                <label className="form-label">Employee Skills</label>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <select
                    className="form-input"
                    style={{ paddingLeft: '16px', appearance: 'none' }}
                    value=""
                    onChange={(e) => {
                      const skillId = parseInt(e.target.value);
                      if (skillId && !form.skills.includes(skillId)) {
                        setForm(prev => ({ ...prev, skills: [...prev.skills, skillId] }));
                      }
                    }}
                    disabled={submitting}
                  >
                    <option value="">-- Choose Skill to Add --</option>
                    {skillsList.map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>▼</div>
                </div>

                {/* Selected Skills Tags */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  background: 'hsla(230, 25%, 8%, 0.3)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '12px',
                  padding: '12px',
                  minHeight: '45px'
                }}>
                  {form.skills.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No skills selected yet.</span>
                  ) : (
                    form.skills.map(skillId => {
                      const skillObj = skillsList.find(s => s.id === skillId);
                      if (!skillObj) return null;
                      return (
                        <span key={skillId} className="pill-badge" style={{ 
                          fontSize: '0.8rem', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          background: 'var(--primary-gradient)',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 10px'
                        }}>
                          <span>{skillObj.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setForm(prev => ({ ...prev, skills: prev.skills.filter(id => id !== skillId) }));
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              padding: 0,
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              alignItems: 'center'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* File Uploads for resume and additional documents */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={14} />
                    <span>Upload Resume (PDF/DOC)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    style={{ fontSize: '0.85rem' }}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Paperclip size={14} />
                    <span>Attach Documents (Multiple)</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => setDocsFiles(Array.from(e.target.files))}
                    style={{ fontSize: '0.85rem' }}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? <div className="spinner"></div> : <span>Save Record</span>}
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

export default Employees;
