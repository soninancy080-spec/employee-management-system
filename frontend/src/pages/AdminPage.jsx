import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Users, ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react';

const AdminPage = () => {
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/auth/users` , {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();

        if (res.ok) {
          setUsersList(data);
        } else {
          setError(data.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError('Network error, could not load users list');
      } finally {
        setLoadingUsers(false);
      }
    };

    if (user && user.role === 'ADMIN') {
      fetchUsers();
    } else {
      navigate('/');
    }
  }, [token, user, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="auth-container">
      <div className="glow-blob-1"></div>
      <div className="glow-blob-2"></div>

      <div className="glass-card dashboard-container" style={{ maxWidth: '750px' }}>
        <div className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={36} style={{ color: 'var(--primary-end)' }} />
            <div>
              <h1>Admin Control Center</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>System Administration Portal</p>
            </div>
          </div>
          <Link to="/" className="btn-logout" style={{ width: 'auto', padding: '8px 16px', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
        </div>

        {error && (
          <div className="alert-banner error" style={{ marginBottom: '24px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: 600 }}>Registered System Users</h2>
          
          {loadingUsers ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 600 }}>ID</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 600 }}>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => (
                    <tr key={usr.id} style={{ borderBottom: '1px solid hsla(230, 25%, 25%, 0.2)' }}>
                      <td style={{ padding: '12px 8px', fontSize: '0.95rem' }}>{usr.id}</td>
                      <td style={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 500 }}>{usr.name}</td>
                      <td style={{ padding: '12px 8px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>{usr.email}</td>
                      <td style={{ padding: '12px 8px', fontSize: '0.95rem' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: usr.role === 'ADMIN' ? 'var(--primary-gradient)' : 'hsla(230, 25%, 25%, 0.4)',
                          color: '#fff',
                        }}>
                          {usr.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>{formatDate(usr.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
