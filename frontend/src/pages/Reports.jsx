import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Download, Users, Calendar, Laptop, FileText, AlertTriangle } from 'lucide-react';

const Reports = () => {
  const { token } = useSelector((state) => state.auth);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');

  const handleDownload = async (type) => {
    setError('');
    setDownloading(type);
    try {
      const res = await fetch(`http://localhost:5001/api/v1/reports/export?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to download report');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Network error occurred during download.');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ textAlign: 'left', margin: 0 }}>Reports Center</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Export systems registries, leave accounts, and asset databases to CSV
        </p>
      </div>

      {error && (
        <div className="alert-banner error" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
      }}>
        {/* Employee Report card */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '240px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                background: 'rgba(0, 242, 254, 0.1)',
                color: 'var(--primary-start)',
                padding: '8px',
                borderRadius: '8px',
              }}>
                <Users size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Employees Registry</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
              Generates a comprehensive CSV listing all employees, including their profile details, department name, manager, security roles, and registration dates.
            </p>
          </div>
          <button
            onClick={() => handleDownload('employees')}
            disabled={!!downloading}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Download size={18} />
            <span>{downloading === 'employees' ? 'Generating CSV...' : 'Download CSV'}</span>
          </button>
        </div>

        {/* Leave Requests Report card */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '240px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                background: 'rgba(255, 0, 127, 0.1)',
                color: 'var(--secondary)',
                padding: '8px',
                borderRadius: '8px',
              }}>
                <Calendar size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Leave Request Logs</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
              Generates a detailed summary of all leave request submissions, duration days, approval status, and notes written by Managers and HR staff.
            </p>
          </div>
          <button
            onClick={() => handleDownload('leaves')}
            disabled={!!downloading}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--secondary-gradient)' }}
          >
            <Download size={18} />
            <span>{downloading === 'leaves' ? 'Generating CSV...' : 'Download CSV'}</span>
          </button>
        </div>

        {/* Asset Inventory Report card */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '240px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                padding: '8px',
                borderRadius: '8px',
              }}>
                <Laptop size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Asset Allocation Database</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
              Generates a complete list of hardware assets (Laptops, Monitors, ID Cards), including serial numbers, current status, and active assignees.
            </p>
          </div>
          <button
            onClick={() => handleDownload('assets')}
            disabled={!!downloading}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Download size={18} />
            <span>{downloading === 'assets' ? 'Generating CSV...' : 'Download CSV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
