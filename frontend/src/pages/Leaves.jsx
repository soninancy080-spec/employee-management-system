import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  CalendarDays, Calendar, Plus, X, Check, XCircle, 
  AlertTriangle, CheckCircle, Clock, FileText, ChevronRight
} from 'lucide-react';

const Leaves = () => {
  const { token, user } = useSelector((state) => state.auth);

  // Data states
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  
  // UX states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Apply leave form state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Approval form state
  const [actionNotes, setActionNotes] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchMyLeavesAndBalances();
    if (user && (user.role === 'MANAGER' || user.role === 'HR' || user.role === 'ADMIN')) {
      fetchPendingApprovals();
    }
  }, [user]);

  const fetchMyLeavesAndBalances = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/leaves/my` , {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLeaves(data.leaves || []);
        setBalances(data.balances || []);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/leaves/pending` , {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPendingApprovals(data);
      }
    } catch (err) {
      console.error('Error fetching pending leaves:', err);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setError('Please fill in all leave request fields');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/leaves` , {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Leave request submitted successfully!');
        setForm({
          leaveType: 'ANNUAL',
          startDate: '',
          endDate: '',
          reason: '',
        });
        setShowApplyModal(false);
        fetchMyLeavesAndBalances();
      } else {
        setError(data.message || 'Failed to submit leave request');
      }
    } catch (err) {
      setError('Network error, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessApproval = async (id, tier, action) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    setError('');
    setSuccess('');

    const notes = actionNotes[id] || '';

    try {
      const endpoint = tier === 'manager' ? 'approve-manager' : 'approve-hr';
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/leaves/${id}/${endpoint}` , {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, notes }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Leave request successfully ${action.toLowerCase()}d.`);
        setActionNotes(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        fetchPendingApprovals();
        fetchMyLeavesAndBalances(); // Refresh own balances in case admin approved own subordinate
      } else {
        setError(data.message || `Failed to process ${action.toLowerCase()} action`);
      }
    } catch (err) {
      setError('Network error during approval processing');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return { bg: 'var(--success-bg)', border: 'var(--success)', text: 'var(--success)' };
      case 'REJECTED': return { bg: 'var(--error-bg)', border: 'var(--error)', text: 'var(--error)' };
      case 'PENDING_HR': return { bg: 'hsla(263, 90%, 55%, 0.1)', border: 'var(--card-border-focus)', text: 'var(--primary-start)' };
      default: return { bg: 'hsla(230, 25%, 25%, 0.3)', border: 'var(--card-border)', text: 'var(--text-muted)' };
    }
  };

  const getRemainingDays = (bal) => {
    return bal.allocated - bal.used;
  };

  const renderBalancesGrid = () => {
    // Standard leave types
    const types = ['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY'];
    
    return (
      <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
        {types.map(type => {
          const bal = balances.find(b => b.leaveType === type) || { allocated: 15, used: 0 };
          const remaining = getRemainingDays(bal);
          return (
            <div key={type} className="stats-card" style={{ padding: '20px' }}>
              <div className="stats-icon-wrapper" style={{
                background: remaining > 5 ? 'var(--success-bg)' : 'var(--error-bg)',
                color: remaining > 5 ? 'var(--success)' : 'var(--error)',
                width: '44px',
                height: '44px',
                borderRadius: '12px'
              }}>
                <CalendarDays size={20} />
              </div>
              <div className="stats-info">
                <span className="stats-number" style={{ fontSize: '1.6rem' }}>{remaining}</span>
                <span className="stats-label" style={{ fontSize: '0.75rem' }}>{type} LEAVE</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Allocated: {bal.allocated} | Used: {bal.used}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ textAlign: 'left', margin: 0 }}>Leaves Console</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Track remaining leaves, apply for time off, and process approvals</p>
        </div>
        {user?.role === 'EMPLOYEE' && (
          <button onClick={() => setShowApplyModal(true)} className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
            <Plus size={18} />
            <span>Apply for Leave</span>
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
        <>
          {/* 1. Balances Section */}
          {balances.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: 600 }}>Your Remaining Balances</h2>
              {renderBalancesGrid()}
            </div>
          )}

          {/* 2. Pending Approvals Section (Admin/HR/Manager only) */}
          {pendingApprovals.length > 0 && (
            <div className="chart-widget" style={{ marginBottom: '40px' }}>
              <h2 className="chart-title">
                <Clock size={18} style={{ color: 'var(--primary-start)' }} />
                <span>Pending Approvals Request ({pendingApprovals.length})</span>
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Action Status</th>
                      <th style={{ width: '260px' }}>Approve / Reject Notes</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map(req => {
                      const tier = req.status === 'PENDING_MANAGER' ? 'manager' : 'hr';
                      const isLoading = actionLoading[req.id];
                      return (
                        <tr key={req.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{req.employee.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.employee.email}</div>
                          </td>
                          <td>
                            <span className="pill-badge" style={{ fontSize: '0.75rem' }}>{req.leaveType}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>{formatDate(req.startDate)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>to {formatDate(req.endDate)}</div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.reason}
                          </td>
                          <td>
                            <span className="pill-badge" style={{
                              fontSize: '0.75rem',
                              background: getStatusColor(req.status).bg,
                              borderColor: getStatusColor(req.status).border,
                              color: getStatusColor(req.status).text
                            }}>
                              {req.status}
                            </span>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Add review notes..."
                              style={{ padding: '8px 12px', height: 'auto', fontSize: '0.85rem' }}
                              value={actionNotes[req.id] || ''}
                              onChange={(e) => setActionNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                              disabled={isLoading}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button 
                                onClick={() => handleProcessApproval(req.id, tier, 'APPROVE')} 
                                className="btn-logout" 
                                style={{ width: 'auto', padding: '6px 12px', borderColor: 'var(--success)', color: 'var(--success)' }}
                                disabled={isLoading}
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => handleProcessApproval(req.id, tier, 'REJECT')} 
                                className="btn-logout" 
                                style={{ width: 'auto', padding: '6px 12px', borderColor: 'var(--error)', color: 'var(--error)' }}
                                disabled={isLoading}
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. My Leaves Table */}
          <div className="chart-widget">
            <h2 className="chart-title">
              <Calendar size={18} style={{ color: 'var(--primary-end)' }} />
              <span>Leave Applications History</span>
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Reason</th>
                    <th>Notes Feedback</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                        No leave requests applied yet.
                      </td>
                    </tr>
                  ) : (
                    leaves.map(req => (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 600 }}>{req.leaveType}</td>
                        <td>{formatDate(req.startDate)}</td>
                        <td>{formatDate(req.endDate)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{req.reason}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {req.managerNotes && (
                            <div style={{ color: 'var(--text-muted)' }}>
                              Manager: <span style={{ color: 'var(--text-main)' }}>{req.managerNotes}</span>
                            </div>
                          )}
                          {req.hrNotes && (
                            <div style={{ color: 'var(--text-muted)' }}>
                              HR: <span style={{ color: 'var(--text-main)' }}>{req.hrNotes}</span>
                            </div>
                          )}
                          {!req.managerNotes && !req.hrNotes && '—'}
                        </td>
                        <td>
                          <span className="pill-badge" style={{
                            fontSize: '0.75rem',
                            background: getStatusColor(req.status).bg,
                            borderColor: getStatusColor(req.status).border,
                            color: getStatusColor(req.status).text
                          }}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setShowApplyModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarDays size={24} style={{ color: 'var(--primary-start)' }} />
              <span>Apply for Leave</span>
            </h2>

            <form onSubmit={handleApplySubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="leave-type">Leave Category</label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="leave-type"
                    className="form-input"
                    style={{ paddingLeft: '16px', appearance: 'none' }}
                    value={form.leaveType}
                    onChange={(e) => setForm(prev => ({ ...prev, leaveType: e.target.value }))}
                    disabled={submitting}
                  >
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="CASUAL">Casual Leave</option>
                    <option value="MATERNITY">Maternity Leave</option>
                    <option value="PATERNITY">Paternity Leave</option>
                  </select>
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>▼</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="start-date">Start Date</label>
                  <input
                    type="date"
                    id="start-date"
                    className="form-input"
                    style={{ paddingLeft: '16px' }}
                    value={form.startDate}
                    onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="end-date">End Date</label>
                  <input
                    type="date"
                    id="end-date"
                    className="form-input"
                    style={{ paddingLeft: '16px' }}
                    value={form.endDate}
                    onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reason">Reason / Justification</label>
                <textarea
                  id="reason"
                  className="form-input"
                  rows={4}
                  placeholder="Explain why you are applying for leave..."
                  style={{ paddingLeft: '16px', height: 'auto', resize: 'vertical' }}
                  value={form.reason}
                  onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  disabled={submitting}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? <div className="spinner"></div> : <span>Submit Request</span>}
                </button>
                <button type="button" onClick={() => setShowApplyModal(false)} className="btn-logout" style={{ flex: 1 }} disabled={submitting}>
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

export default Leaves;
