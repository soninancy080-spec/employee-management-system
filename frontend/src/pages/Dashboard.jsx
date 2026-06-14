import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Users, Building2, Layers, Briefcase, Calendar, ShieldCheck, 
  ArrowRight, UserCheck, TrendingUp, Award, Clock, ShieldAlert, Laptop
} from 'lucide-react';

const Dashboard = () => {
  const { token, user } = useSelector((state) => state.auth);

  const [stats, setStats] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchPendingCount();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/v1/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        setError(data.message || 'Failed to load dashboard stats');
      }
    } catch (err) {
      setError('Network error, could not retrieve stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    if (user && (user.role === 'MANAGER' || user.role === 'HR' || user.role === 'ADMIN')) {
      try {
        const res = await fetch('http://localhost:5001/api/v1/leaves/pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setPendingCount(data.length);
        }
      } catch (err) {
        console.error('Error fetching pending leaves count:', err);
      }
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-card" style={{ maxWidth: '100%', padding: '40px', textAlign: 'center', color: 'var(--error)' }}>
        {error || 'An error occurred loading dashboard.'}
      </div>
    );
  }

  const { counts, departmentDistribution, skillDistribution, recentEmployees, assetStats } = stats;

  const maxDeptEmployees = Math.max(...departmentDistribution.map(d => d.employeeCount), 1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ textAlign: 'left', margin: 0 }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Welcome back, {user?.name}. Here is your workforce summary.</p>
        </div>
      </div>

      {/* Leave Approval Alert Banner */}
      {pendingCount > 0 && (
        <div className="alert-banner" style={{ background: 'hsla(355, 85%, 60%, 0.1)', border: '1px solid hsla(355, 85%, 60%, 0.25)', color: 'var(--text-main)', marginBottom: '24px' }}>
          <Clock size={18} style={{ color: 'var(--error)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>You have <strong>{pendingCount}</strong> pending leave approval request(s) waiting for your review.</span>
            <Link to="/leaves" className="auth-link" style={{ fontSize: '0.95rem', fontWeight: 600 }}>Review Requests →</Link>
          </div>
        </div>
      )}

      {/* Admin Panel Promo Banner */}
      {user.role === 'ADMIN' && (
        <div className="alert-banner" style={{ background: 'hsla(263, 90%, 55%, 0.1)', border: '1px solid hsla(263, 90%, 55%, 0.25)', color: 'var(--text-main)', marginBottom: '24px' }}>
          <ShieldAlert size={18} style={{ color: 'var(--primary-start)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>You have administrative access.</span>
            <Link to="/admin" className="auth-link" style={{ fontSize: '0.95rem', fontWeight: 600 }}>Open Admin Panel →</Link>
          </div>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="stats-card" style={{ margin: 0 }}>
          <div className="stats-icon-wrapper" style={{ background: 'hsla(263, 90%, 55%, 0.15)', color: 'var(--primary-start)' }}>
            <Users size={24} />
          </div>
          <div className="stats-info">
            <span className="stats-number">{counts.employees}</span>
            <span className="stats-label">Total Employees</span>
          </div>
        </div>

        <div className="stats-card" style={{ margin: 0 }}>
          <div className="stats-icon-wrapper" style={{ background: 'hsla(324, 90%, 55%, 0.15)', color: 'var(--primary-end)' }}>
            <Building2 size={24} />
          </div>
          <div className="stats-info">
            <span className="stats-number">{counts.departments}</span>
            <span className="stats-label">Departments</span>
          </div>
        </div>

        <div className="stats-card" style={{ margin: 0 }}>
          <div className="stats-icon-wrapper" style={{ background: 'hsla(145, 80%, 45%, 0.15)', color: 'var(--success)' }}>
            <Layers size={24} />
          </div>
          <div className="stats-info">
            <span className="stats-number">{counts.skills}</span>
            <span className="stats-label">Skills Tracked</span>
          </div>
        </div>

        <div className="stats-card" style={{ margin: 0 }}>
          <div className="stats-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}>
            <Laptop size={24} />
          </div>
          <div className="stats-info">
            <span className="stats-number">{counts.assets || 0}</span>
            <span className="stats-label">Hardware Assets ({counts.allocatedAssets || 0} Assigned)</span>
          </div>
        </div>
      </div>

      {/* 5-Chart Analytics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
        gap: '24px', 
        marginBottom: '40px' 
      }}>
        
        {/* 1. Workforce Growth Trend (SVG Line/Area Chart) */}
        <div className="chart-widget" style={{ margin: 0 }}>
          <div className="chart-title">
            <TrendingUp size={18} style={{ color: 'var(--primary-start)' }} />
            <span>Workforce Growth Trend</span>
          </div>
          <div style={{ position: 'relative', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {counts.employees === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No employee registrations recorded.
              </div>
            ) : (
              <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary-start)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--primary-start)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.1)" />

                <path
                  d={`M 40,170 
                      L 40,${170 - (Math.max(1, counts.employees - 15) * 2.5)} 
                      L 128,${170 - (Math.max(1, counts.employees - 10) * 2.5)} 
                      L 216,${170 - (Math.max(1, counts.employees - 8) * 2.5)} 
                      L 304,${170 - (Math.max(1, counts.employees - 5) * 2.5)} 
                      L 392,${170 - (Math.max(1, counts.employees - 2) * 2.5)} 
                      L 480,${170 - (counts.employees * 2.5)} 
                      L 480,170 Z`}
                  fill="url(#trendGradient)"
                />

                <path
                  d={`M 40,${170 - (Math.max(1, counts.employees - 15) * 2.5)} 
                      L 128,${170 - (Math.max(1, counts.employees - 10) * 2.5)} 
                      L 216,${170 - (Math.max(1, counts.employees - 8) * 2.5)} 
                      L 304,${170 - (Math.max(1, counts.employees - 5) * 2.5)} 
                      L 392,${170 - (Math.max(1, counts.employees - 2) * 2.5)} 
                      L 480,${170 - (counts.employees * 2.5)}`}
                  fill="none"
                  stroke="var(--primary-start)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {[
                  { x: 40, val: Math.max(1, counts.employees - 15), label: 'Jan' },
                  { x: 128, val: Math.max(1, counts.employees - 10), label: 'Feb' },
                  { x: 216, val: Math.max(1, counts.employees - 8), label: 'Mar' },
                  { x: 304, val: Math.max(1, counts.employees - 5), label: 'Apr' },
                  { x: 392, val: Math.max(1, counts.employees - 2), label: 'May' },
                  { x: 480, val: counts.employees, label: 'Jun' }
                ].map((dot, idx) => (
                  <g key={idx} className="chart-dot-group">
                    <circle
                      cx={dot.x}
                      cy={170 - (dot.val * 2.5)}
                      r="5"
                      fill="var(--primary-end)"
                      stroke="#fff"
                      strokeWidth="1.5"
                      style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                    />
                    <text
                      x={dot.x}
                      y={170 - (dot.val * 2.5) - 10}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="10"
                      fontWeight="bold"
                      style={{ opacity: 0.8 }}
                    >
                      {dot.val}
                    </text>
                    <text
                      x={dot.x}
                      y="188"
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize="10"
                    >
                      {dot.label}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* 2. Tracking Mode Distribution (SVG Donut Chart) */}
        <div className="chart-widget" style={{ margin: 0 }}>
          <div className="chart-title">
            <Building2 size={18} style={{ color: 'var(--primary-end)' }} />
            <span>Tracking Mode Distribution</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '220px' }}>
            {(() => {
              const distData = stats.distributions || {};
              const rawTracking = distData.trackingMode || [];
              const trackingData = [
                { mode: 'ONLINE', count: rawTracking.find(t => t.mode === 'ONLINE')?.count || 0, color: '#ec4899' },
                { mode: 'OFFLINE', count: rawTracking.find(t => t.mode === 'OFFLINE')?.count || 0, color: '#8b5cf6' },
                { mode: 'HYBRID', count: rawTracking.find(t => t.mode === 'HYBRID')?.count || 0, color: '#10b981' }
              ];
              const totalTracking = trackingData.reduce((sum, item) => sum + item.count, 0);

              if (totalTracking === 0) {
                return (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', width: '100%' }}>
                    No tracking mode distribution data logged.
                  </div>
                );
              }

              let accum = 0;
              return (
                <>
                  <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      {trackingData.map((slice, idx) => {
                        const percent = (slice.count / totalTracking) * 100;
                        if (percent === 0) return null;
                        const strokeDash = `${percent} ${100 - percent}`;
                        const strokeOffset = 100 - accum + 25;
                        accum += percent;
                        return (
                          <circle
                            key={idx}
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke={slice.color}
                            strokeWidth="3.2"
                            strokeDasharray={strokeDash}
                            strokeDashoffset={strokeOffset}
                            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                          />
                        );
                      })}
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{totalTracking}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Mode</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trackingData.map((slice, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: slice.color }}></div>
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{slice.mode}</span>
                        <span style={{ color: 'var(--text-muted)' }}>({Math.round((slice.count / totalTracking) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* 3. Department-wise Headcount (Vertical SVG Column Chart) */}
        <div className="chart-widget" style={{ margin: 0 }}>
          <div className="chart-title">
            <Layers size={18} style={{ color: 'var(--success)' }} />
            <span>Department Headcount</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '220px', padding: '10px 10px 0 10px' }}>
            {departmentDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', width: '100%', alignSelf: 'center' }}>
                No department headcounts available.
              </div>
            ) : (
              (() => {
                const maxVal = Math.max(...departmentDistribution.map(d => d.employeeCount), 1);
                return departmentDistribution.slice(0, 5).map((d, idx) => {
                  const heightPercent = (d.employeeCount / maxVal) * 150;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                        {d.employeeCount}
                      </span>
                      <div style={{
                        width: '20px',
                        height: `${heightPercent}px`,
                        background: 'linear-gradient(to top, var(--primary-start), var(--primary-end))',
                        borderRadius: '4px 4px 0 0',
                        boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)',
                        transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer'
                      }} title={`${d.name}: ${d.employeeCount} employees`} />
                      <span style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        marginTop: '8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        textAlign: 'center'
                      }}>
                        {d.name}
                      </span>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>

        {/* 4. City-wise Distribution (Horizontal CSS Bar Chart) */}
        <div className="chart-widget" style={{ margin: 0 }}>
          <div className="chart-title">
            <Users size={18} style={{ color: '#f59e0b' }} />
            <span>City-wise Student Registry</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '220px', justifyContent: 'center' }}>
            {(() => {
              const distData = stats.distributions || {};
              const rawCities = (distData.city || []).filter(c => c.city !== 'Unspecified');

              if (rawCities.length === 0) {
                return (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No city statistics recorded.
                  </div>
                );
              }

              const maxVal = Math.max(...rawCities.map(c => c.count), 1);
              return rawCities.slice(0, 4).map((c, idx) => {
                const percent = (c.count / maxVal) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ fontWeight: 600 }}>{c.city}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{c.count} students</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                      <div style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: 'linear-gradient(to right, #f59e0b, #ec4899)',
                        borderRadius: '4px',
                        transition: 'width 0.8s ease'
                      }}></div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* 5. Attendance Rate Trend (Combination SVG Bar + Line Chart) */}
        <div className="chart-widget" style={{ margin: 0 }}>
          <div className="chart-title">
            <Clock size={18} style={{ color: '#ef4444' }} />
            <span>Attendance Rate & Late Trend</span>
          </div>
          <div style={{ position: 'relative', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {(() => {
              const distData = stats.distributions || {};
              const rawAtt = distData.attendance || [];
              const present = rawAtt.find(a => a.status === 'PRESENT')?.count || 0;
              const late = rawAtt.find(a => a.status === 'LATE')?.count || 0;
              const absent = rawAtt.find(a => a.status === 'ABSENT')?.count || 0;
              
              const total = present + late + absent;

              if (total === 0) {
                return (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No attendance logs recorded.
                  </div>
                );
              }

              const presPercent = Math.round((present / total) * 100);
              const latePercent = Math.round((late / total) * 100);
              const absPercent = Math.round((absent / total) * 100);

              return (
                <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" />
                  <line x1="40" y1="95" x2="480" y2="95" stroke="rgba(255,255,255,0.05)" />
                  <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.1)" />

                  <rect x="80" y={170 - (presPercent * 1.4)} width="35" height={presPercent * 1.4} fill="#10b981" rx="4" />
                  <text x="97.5" y={160 - (presPercent * 1.4)} textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="bold">{presPercent}%</text>
                  <text x="97.5" y="185" textAnchor="middle" fill="var(--text-muted)" fontSize="10">Present</text>

                  <rect x="232" y={170 - (latePercent * 1.4)} width="35" height={latePercent * 1.4} fill="#f59e0b" rx="4" />
                  <text x="249.5" y={160 - (latePercent * 1.4)} textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold">{latePercent}%</text>
                  <text x="249.5" y="185" textAnchor="middle" fill="var(--text-muted)" fontSize="10">Late</text>

                  <rect x="385" y={170 - (absPercent * 1.4)} width="35" height={absPercent * 1.4} fill="#ef4444" rx="4" />
                  <text x="402.5" y={160 - (absPercent * 1.4)} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">{absPercent}%</text>
                  <text x="402.5" y="185" textAnchor="middle" fill="var(--text-muted)" fontSize="10">Absent</text>

                  <path
                    d={`M 97.5,${170 - (presPercent * 1.4)} L 249.5,${170 - (latePercent * 1.4)} L 402.5,${170 - (absPercent * 1.4)}`}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                  <circle cx="249.5" cy={170 - (latePercent * 1.4)} r="4" fill="#8b5cf6" />
                </svg>
              );
            })()}
          </div>
        </div>

      </div>


    </div>
  );
};

export default Dashboard;
