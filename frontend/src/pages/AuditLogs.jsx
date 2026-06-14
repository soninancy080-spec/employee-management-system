import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Terminal, Search, AlertTriangle, Clock } from 'lucide-react';

const AuditLogs = () => {
  const { token } = useSelector((state) => state.auth);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search state
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/audit` , {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      } else {
        setError(data.message || 'Failed to retrieve audit logs');
      }
    } catch (err) {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const employeeName = log.employee ? (log.employee.name || '').toLowerCase() : 'system';
    const action = log.action ? log.action.toLowerCase() : '';
    const details = log.details ? log.details.toLowerCase() : '';
    const term = search.toLowerCase();

    return employeeName.includes(term) || action.includes(term) || details.includes(term);
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ textAlign: 'left', margin: 0 }}>System Audit Trail</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Immutable ledger tracking system mutations and leave transactions</p>
        </div>
      </div>

      {error && (
        <div className="alert-banner error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search filter */}
      <div className="glass-card" style={{ maxWidth: '100%', padding: '20px', marginBottom: '32px' }}>
        <div className="input-wrapper" style={{ margin: 0 }}>
          <Search className="input-icon" size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search logs by action, details, or employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        </div>
      ) : (
        <div className="glass-card" style={{ maxWidth: '100%', padding: '24px' }}>
          <table className="portal-table">
            <thead>
              <tr>
                <th style={{ width: '200px' }}>Timestamp</th>
                <th>Employee / User</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                    No audit records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        <span>{formatDate(log.createdAt)}</span>
                      </span>
                    </td>
                    <td>
                      {log.employee ? (
                        <span style={{ fontWeight: 600 }}>{log.employee.name}</span>
                      ) : (
                        <span style={{ color: 'var(--primary-end)', fontWeight: 600 }}>SYSTEM</span>
                      )}
                    </td>
                    <td>
                      <span className="pill-badge" style={{
                        background: log.action.includes('APPROVED') 
                          ? 'var(--success-bg)' 
                          : log.action.includes('REJECTED') 
                            ? 'var(--error-bg)' 
                            : 'hsla(230, 25%, 25%, 0.3)',
                        borderColor: log.action.includes('APPROVED') 
                          ? 'var(--success)' 
                          : log.action.includes('REJECTED') 
                            ? 'var(--error)' 
                            : 'var(--card-border)',
                        color: log.action.includes('APPROVED') 
                          ? 'var(--success)' 
                          : log.action.includes('REJECTED') 
                            ? 'var(--error)' 
                            : 'var(--text-main)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
