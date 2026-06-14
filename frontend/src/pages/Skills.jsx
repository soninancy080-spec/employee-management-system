import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Layers, Plus, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';

const Skills = () => {
  const { token, user } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === 'ADMIN';

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newSkill, setNewSkill] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/v1/skills', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSkills(data);
      } else {
        setError(data.message || 'Failed to load skills');
      }
    } catch (err) {
      setError('Network error loading skills list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:5001/api/v1/skills', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newSkill.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Skill "${data.name}" added successfully!`);
        setNewSkill('');
        fetchSkills();
      } else {
        setError(data.message || 'Failed to add skill');
      }
    } catch (err) {
      setError('Network error, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the skill "${name}"? This will unlink it from all employees.`)) return;

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:5001/api/v1/skills/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setSuccess(`Skill "${name}" deleted.`);
        fetchSkills();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete skill');
      }
    } catch (err) {
      setError('Network error, please try again');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ textAlign: 'left', margin: 0 }}>Skills Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Register and manage technical employee skill tags</p>
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

      {/* Add Skill Form inline */}
      <div className="glass-card" style={{ maxWidth: '100%', padding: '24px', marginBottom: '32px' }}>
        <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
            <label className="form-label" htmlFor="new-skill">Create Skill Tag</label>
            <div className="input-wrapper">
              <Layers className="input-icon" size={18} />
              <input
                type="text"
                id="new-skill"
                className="form-input"
                placeholder="e.g. React Native, Docker, C++"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '14px 24px' }} disabled={submitting || !newSkill.trim()}>
            {submitting ? <div className="spinner"></div> : <><Plus size={18} /><span>Add Tag</span></>}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        </div>
      ) : (
        <div className="glass-card" style={{ maxWidth: '100%', padding: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 600 }}>Active Skills</h2>
          {skills.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No skills registered yet. Create one above!</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {skills.map((skill) => (
                <div 
                  key={skill.id} 
                  className="pill-badge" 
                  style={{ 
                    padding: '8px 14px', 
                    fontSize: '0.9rem', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'hsla(230, 25%, 15%, 0.5)',
                    borderColor: 'var(--card-border)'
                  }}
                >
                  <span>{skill.name}</span>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteSkill(skill.id, skill.name)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: 'var(--text-muted)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Skills;
