import React, { useState, useEffect } from 'react';
const BASE_URL = 'http://localhost:5001/api/v1';
import { useSelector } from 'react-redux';
import { 
  Star, MessageSquare, Calendar, UserCheck, 
  AlertTriangle, CheckCircle, TrendingUp, Plus, Trash2, Award
} from 'lucide-react';

const Performance = () => {
  const { token, user } = useSelector((state) => state.auth);
  
  // Lists & data
  const [employees, setEmployees] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  
  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  // Tabs for privileged users: 'write' | 'view_team' | 'view_own'
  const isPrivileged = user && ['ADMIN', 'HR', 'MANAGER'].includes(user.role);
  const [activeTab, setActiveTab] = useState(isPrivileged ? 'write' : 'view_own');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      if (isPrivileged) {
        fetchEmployees();
      }
      
      // If employee, load their own reviews
      if (user && user.employee?.id) {
        fetchEvaluations(user.employee.id);
      }
    }
  }, [token, user]);

  // Refetch reviews when selected employee changes in privileged view
  useEffect(() => {
    if (isPrivileged && selectedEmpId && activeTab === 'view_team') {
      fetchEvaluations(selectedEmpId);
    }
  }, [selectedEmpId, activeTab]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BASE_URL}/employees?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setEmployees(data.data);
        if (data.data.length > 0) {
          setSelectedEmpId(data.data[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchEvaluations = async (empId) => {
    if (!empId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/evaluations/employee/${empId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEvaluations(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch evaluations');
      }
    } catch (err) {
      setError('Network error, could not retrieve evaluations.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedEmpId || !feedback.trim()) {
      setError('Please select an employee and write feedback comments.');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${BASE_URL}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: parseInt(selectedEmpId),
          rating,
          feedback: feedback.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Performance evaluation submitted successfully!');
        setFeedback('');
        setRating(5);
        
        // Auto redirect to team evaluations view to see the new log
        setActiveTab('view_team');
        fetchEvaluations(selectedEmpId);
      } else {
        setError(data.message || 'Failed to submit evaluation');
      }
    } catch (err) {
      setError('Network error submitting evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvaluation = async (evalId) => {
    if (!window.confirm('Are you sure you want to delete this evaluation review permanently?')) return;
    
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BASE_URL}/evaluations/${evalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Evaluation review deleted.');
        // Refresh list
        const activeEmpId = activeTab === 'view_own' ? user.employee?.id : selectedEmpId;
        fetchEvaluations(activeEmpId);
      } else {
        const data = await res.json();
        setError(data.message || 'Deletion failed.');
      }
    } catch (err) {
      setError('Network error deleting evaluation.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render a rating as nice stars
  const renderStars = (score, size = 18, interactive = false) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((starIdx) => {
          const isFilled = interactive 
            ? (hoverRating ? starIdx <= hoverRating : starIdx <= rating)
            : starIdx <= score;

          return (
            <Star
              key={starIdx}
              size={size}
              style={{
                fill: isFilled ? 'var(--primary-end)' : 'transparent',
                stroke: isFilled ? 'var(--primary-end)' : 'var(--text-muted)',
                cursor: interactive ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={() => interactive && setHoverRating(starIdx)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onClick={() => interactive && setRating(starIdx)}
            />
          );
        })}
      </div>
    );
  };

  // Calculate average rating
  const averageRating = evaluations.length > 0 
    ? (evaluations.reduce((acc, curr) => acc + curr.rating, 0) / evaluations.length).toFixed(1)
    : null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ textAlign: 'left', margin: 0 }}>Performance evaluations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {isPrivileged 
              ? 'Evaluate employee ratings, draft performance reviews, and view historical score sheets.'
              : 'View your historic performance evaluations and feedback from managers.'}
          </p>
        </div>
      </div>

      {success && (
        <div className="alert-banner success" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner error" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Row for Managers / Admins */}
      {isPrivileged && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>
          <button 
            onClick={() => { setActiveTab('write'); setSuccess(''); setError(''); }}
            className={`tab-btn ${activeTab === 'write' ? 'active' : ''}`}
            style={{
              background: activeTab === 'write' ? 'var(--primary-gradient)' : 'transparent',
              color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
            }}
          >
            Create Evaluation
          </button>
          
          <button 
            onClick={() => { setActiveTab('view_team'); setSuccess(''); setError(''); if(selectedEmpId) fetchEvaluations(selectedEmpId); }}
            className={`tab-btn ${activeTab === 'view_team' ? 'active' : ''}`}
            style={{
              background: activeTab === 'view_team' ? 'var(--primary-gradient)' : 'transparent',
              color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
            }}
          >
            Team Reviews
          </button>
          
          {user.employee?.id && (
            <button 
              onClick={() => { setActiveTab('view_own'); setSuccess(''); setError(''); fetchEvaluations(user.employee.id); }}
              className={`tab-btn ${activeTab === 'view_own' ? 'active' : ''}`}
              style={{
                background: activeTab === 'view_own' ? 'var(--primary-gradient)' : 'transparent',
                color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
              }}
            >
              My Own Reviews
            </button>
          )}
        </div>
      )}

      {/* Content blocks */}

      {/* Tab: Create Evaluation */}
      {activeTab === 'write' && isPrivileged && (
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} style={{ color: 'var(--primary-start)' }} />
            <span>Submit Performance Review</span>
          </h2>
          
          <form onSubmit={handleSubmitEvaluation}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Employee</label>
                <select 
                  className="form-input" 
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  disabled={submitting}
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label className="form-label" style={{ marginBottom: '8px' }}>Rating score</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {renderStars(rating, 24, true)}
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-end)' }}>{rating} / 5</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Review / Feedback comments</label>
              <textarea 
                className="form-input"
                style={{ minHeight: '130px', padding: '16px', lineHeight: '1.5', resize: 'vertical' }}
                placeholder="Write detailed assessment feedback on milestones met, key achievements, and performance highlights..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '12px 28px', marginTop: '8px' }} disabled={submitting}>
              {submitting ? <div className="spinner"></div> : <span>Submit Evaluation</span>}
            </button>
          </form>
        </div>
      )}

      {/* Tab: View team / View own logs list */}
      {(activeTab === 'view_team' || activeTab === 'view_own') && (
        <div>
          {/* Header controls for team view */}
          {activeTab === 'view_team' && isPrivileged && (
            <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
              <div className="form-group" style={{ margin: 0, maxWidth: '400px' }}>
                <label className="form-label">Filter by Employee</label>
                <select 
                  className="form-input" 
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
          ) : (
            <div>
              {evaluations.length > 0 && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {/* Summary Metric Card */}
                  <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '200px' }}>
                    <div style={{ background: 'var(--primary-gradient)', padding: '12px', borderRadius: '12px', color: '#fff' }}>
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{averageRating}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Rating Score</div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '200px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', color: 'var(--primary-end)' }}>
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{evaluations.length}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Reviews Logged</div>
                    </div>
                  </div>
                </div>
              )}

              {evaluations.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No performance reviews logged for this period.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {evaluations.map((evalObj) => (
                    <div key={evalObj.id} className="glass-card" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                            {renderStars(evalObj.rating, 18)}
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-end)' }}>({evalObj.rating}/5 stars)</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={12} />
                            <span>Reviewed on {formatDate(evalObj.evaluationDate)}</span>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Evaluator</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{evalObj.evaluator?.name || 'Manager'}</span>
                          </div>
                          {user.role === 'ADMIN' && (
                            <button 
                              onClick={() => handleDeleteEvaluation(evalObj.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                              }}
                              title="Delete review record"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ 
                        fontSize: '0.95rem', 
                        lineHeight: '1.6', 
                        color: 'var(--text-main)', 
                        background: 'rgba(255,255,255,0.01)', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        border: '1px dashed var(--card-border)',
                        whiteSpace: 'pre-line' 
                      }}>
                        {evalObj.feedback}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Performance;
