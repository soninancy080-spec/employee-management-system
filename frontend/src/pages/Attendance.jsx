import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  MapPin, ClipboardList, Share2, CircleDot, ChevronDown, 
  CheckSquare, Radio, Bell, List, User, Search, 
  ArrowLeft, Calendar, AlertCircle, Check, X, LogOut, Info
} from 'lucide-react';

const Attendance = () => {
  const { token, user } = useSelector((state) => state.auth);

  // Core States
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null); // Employee object being viewed
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  
  // UI States
  const [activeSubTab, setActiveSubTab] = useState('my'); // 'my' | 'team'
  const [mobileBottomTab, setMobileBottomTab] = useState('attendance'); // 'attendance' | 'news' | 'alerts' | 'account'
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Late Check-in Drawer State
  const [showLateDrawer, setShowLateDrawer] = useState(false);
  const [lateReason, setLateReason] = useState('');

  // Admin Override Drawer State
  const [showOverrideDrawer, setShowOverrideDrawer] = useState(false);
  const [overrideDate, setOverrideDate] = useState(new Date().toISOString().split('T')[0]);
  const [overrideStatus, setOverrideStatus] = useState('PRESENT');
  const [overrideReason, setOverrideReason] = useState('');

  // Toast / Status Notifications
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'
  
  // Month Dropdown State
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const isPrivileged = user && ['ADMIN', 'HR', 'MANAGER'].includes(user.role);

  // Trigger Toast helper
  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all employees (for directory & dropdowns)
  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/v1/employees?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setEmployees(data.data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Fetch attendance summary
  const fetchAttendanceSummary = async (empId) => {
    if (!empId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5001/api/v1/attendance/summary/${empId}?year=${summaryYear}&month=${summaryMonth}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setAttendanceSummary(data.data);
      } else {
        showToast(data.message || 'Failed to fetch attendance summary', 'error');
      }
    } catch (err) {
      showToast('Network error loading summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial loads
  useEffect(() => {
    if (token) {
      fetchEmployees();
      // Default viewed profile is the logged-in employee profile
      if (user && user.employee) {
        setSelectedEmp({
          id: user.employee.id,
          name: user.name,
          email: user.email,
          role: user.role
        });
      }
    }
  }, [token, user]);

  // Fetch summary when viewed employee or date changes
  useEffect(() => {
    if (selectedEmp) {
      fetchAttendanceSummary(selectedEmp.id);
    }
  }, [selectedEmp, summaryYear, summaryMonth]);

  // Handle Select Employee in Team Tab
  const handleSelectEmployee = (emp) => {
    setSelectedEmp(emp);
    setActiveSubTab('my'); // Switch back to view summary
  };

  // Check today's clock status
  const getTodayStatus = () => {
    if (!attendanceSummary || !attendanceSummary.rawRecords) {
      return { text: 'Not Clocked In', color: '#64748b', logged: false, statusVal: null };
    }
    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayRecord = attendanceSummary.rawRecords.find(r => {
      const rDateStr = new Date(r.date).toLocaleDateString('en-CA');
      return rDateStr === todayStr;
    });

    const isClockedOutLocal = localStorage.getItem(`clock_out_${user.id}_${todayStr}`) === 'true';

    if (!todayRecord) {
      return { text: 'Not Clocked In', color: '#64748b', logged: false, statusVal: null };
    }
    if (isClockedOutLocal) {
      return { text: 'Clocked Out', color: '#ef4444', logged: true, statusVal: 'CLOCKED_OUT' };
    }
    return { text: 'Clocked In', color: '#10b981', logged: true, statusVal: todayRecord.status };
  };

  const todayStatusObj = getTodayStatus();

  // Clock In Action
  const handleClockIn = async (e) => {
    e?.preventDefault();
    
    // Check if already clocked in today
    if (todayStatusObj.logged) {
      showToast('You have already recorded attendance for today!', 'error');
      return;
    }

    // Determine if late (after 09:30 AM)
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = (hours > 9) || (hours === 9 && minutes > 30);

    if (isLate && !showLateDrawer) {
      // Prompt for reason via custom drawer
      setShowLateDrawer(true);
      return;
    }

    const finalStatus = isLate ? 'LATE' : 'PRESENT';
    
    try {
      const res = await fetch('http://localhost:5001/api/v1/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          date: new Date().toISOString().split('T')[0],
          status: finalStatus,
          lateReason: finalStatus === 'LATE' ? lateReason : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isLate ? 'Clocked in late successfully!' : 'Clocked in successfully! On time.');
        setLateReason('');
        setShowLateDrawer(false);
        // Refresh summary
        fetchAttendanceSummary(selectedEmp.id);
      } else {
        showToast(data.message || 'Failed to clock in', 'error');
      }
    } catch (err) {
      showToast('Network error while clocking in', 'error');
    }
  };

  // Clock Out Action
  const handleClockOut = () => {
    if (!todayStatusObj.logged) {
      showToast('You must Clock In first!', 'error');
      return;
    }
    if (todayStatusObj.statusVal === 'CLOCKED_OUT') {
      showToast('You have already clocked out for today!', 'error');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    localStorage.setItem(`clock_out_${user.id}_${todayStr}`, 'true');
    showToast(`Clocked out successfully at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`);
    fetchAttendanceSummary(selectedEmp.id);
  };

  // Admin Override Submit
  const handleAdminOverride = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;

    try {
      const res = await fetch('http://localhost:5001/api/v1/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          date: overrideDate,
          status: overrideStatus,
          lateReason: overrideStatus === 'LATE' ? overrideReason : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Attendance updated for ${selectedEmp.name}!`);
        setShowOverrideDrawer(false);
        setOverrideReason('');
        fetchAttendanceSummary(selectedEmp.id);
      } else {
        showToast(data.message || 'Failed to update record', 'error');
      }
    } catch (err) {
      showToast('Network error updating record', 'error');
    }
  };

  // Calculate 4 categories dynamically from summary database totals
  const getMetricData = () => {
    if (!attendanceSummary) return { onTime: 0, lateIn: 0, earlyExit: 0, absent: 0, workingDays: 0 };
    
    const dbPresent = attendanceSummary.present || 0;
    const dbLate = attendanceSummary.late || 0;
    const dbAbsent = attendanceSummary.absent || 0;

    // Split dbPresent into simulated "On Time" and "Early Exit" for high-fidelity visualization
    const simulatedEarlyExit = Math.min(2, Math.max(0, dbPresent - 1));
    const simulatedOnTime = dbPresent - simulatedEarlyExit;

    return {
      onTime: simulatedOnTime,
      lateIn: dbLate,
      earlyExit: simulatedEarlyExit,
      absent: dbAbsent,
      workingDays: dbPresent + dbLate // Total attended days
    };
  };

  const metrics = getMetricData();

  // Custom SVG Donut Component
  const renderDonutChart = () => {
    const total = metrics.onTime + metrics.lateIn + metrics.earlyExit + metrics.absent;
    const radius = 42;
    const circumference = 2 * Math.PI * radius;

    if (total === 0) {
      return (
        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto' }}>
          <svg width="220" height="220" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 'bold', color: '#1e293b' }}>0</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', tracking: '0.5px' }}>Working Days</div>
          </div>
        </div>
      );
    }

    const segments = [
      { val: metrics.onTime, color: '#2c9d83' },    // On Time (Teal green)
      { val: metrics.lateIn, color: '#f59e0b' },    // Late In (Orange)
      { val: metrics.earlyExit, color: '#3b82f6' },  // Early Exit (Blue)
      { val: metrics.absent, color: '#ef4444' }     // Absent (Red)
    ];

    let currentOffset = 0;

    return (
      <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto' }}>
        <svg width="220" height="220" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          {segments.map((seg, i) => {
            if (seg.val === 0) return null;
            const pct = (seg.val / total) * 100;
            const strokeLength = (pct / 100) * circumference;
            const dashOffset = circumference - strokeLength + currentOffset;
            currentOffset -= strokeLength;
            return (
              <circle
                key={i}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            );
          })}
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.6rem', fontWeight: 'bold', color: '#1e293b', lineHeight: 1 }}>{metrics.workingDays}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Working Days</div>
        </div>
      </div>
    );
  };

  // Filtered employees for search
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
      
      {/* Dynamic Toast System */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: toastType === 'success' ? '#2c9d83' : '#ef4444',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideIn 0.3s ease'
        }}>
          {toastType === 'success' ? <Check size={18} /> : <X size={18} />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Styled Scoped CSS Tag for animations & custom elements */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .custom-phone-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-phone-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-phone-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .clock-btn:active {
          transform: scale(0.97);
        }
        .header-bar-btn:hover {
          background: rgba(255,255,255,0.15);
        }
      `}</style>

      {/* MAIN Web Dashboard Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        position: 'relative',
        color: '#1e293b',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}>
        
        {/* Teal Header Navigation Bar */}
        <div style={{
          background: '#2c9d83',
          padding: '16px 20px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(44, 157, 131, 0.15)',
          zIndex: 5
        }}>
          <button 
            className="header-bar-btn"
            onClick={() => showToast('Opening Map View...')}
            style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }}
            title="Punches in Map"
          >
            <MapPin size={22} />
          </button>
          
          <div style={{ fontSize: '1.35rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            Attendance
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {isPrivileged && (
              <button 
                className="header-bar-btn"
                onClick={() => {
                  if (activeSubTab === 'team') {
                    setActiveSubTab('my');
                  } else {
                    setActiveSubTab('team');
                  }
                }}
                style={{ 
                  border: 'none', 
                  background: activeSubTab === 'team' ? 'rgba(255,255,255,0.2)' : 'transparent', 
                  color: '#fff', 
                  cursor: 'pointer', 
                  padding: '6px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  transition: 'all 0.2s' 
                }}
                title="Supervisor Attendance"
              >
                <ClipboardList size={22} />
              </button>
            )}

            <button 
              className="header-bar-btn"
              onClick={() => showToast('Sharing screenshot of attendance...')}
              style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }}
              title="Screenshot Share Button"
            >
              <Share2 size={22} />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs (My Attendance / Team) */}
        {isPrivileged && (
          <div style={{
            background: '#ffffff',
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            zIndex: 4
          }}>
            <button 
              onClick={() => {
                setActiveSubTab('my');
                setSelectedEmp({
                  id: user.employee.id,
                  name: user.name,
                  email: user.email,
                  role: user.role
                });
              }}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                background: 'transparent',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: activeSubTab === 'my' && selectedEmp?.id === user.employee?.id ? '#2c9d83' : '#64748b',
                borderBottom: activeSubTab === 'my' && selectedEmp?.id === user.employee?.id ? '3px solid #2c9d83' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              My Attendance
            </button>
            <button 
              onClick={() => setActiveSubTab('team')}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                background: 'transparent',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: activeSubTab === 'team' ? '#2c9d83' : '#64748b',
                borderBottom: activeSubTab === 'team' ? '3px solid #2c9d83' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Team
            </button>
          </div>
        )}

        {/* Scrollable body inside the card */}
        <div className="custom-phone-scroll" style={{
          overflowY: 'auto',
          padding: '24px',
          maxHeight: '620px',
          position: 'relative',
          background: '#f8fafc'
        }}>
          
          {/* RENDER VIEW: MAIN ATTENDANCE DASHBOARD */}
          {activeSubTab === 'my' && mobileBottomTab === 'attendance' && (
            <div>
              {/* Back to team directory button (only shown for Admin when viewing an employee) */}
              {isPrivileged && selectedEmp?.id !== user.employee?.id && (
                <button 
                  onClick={() => {
                    setActiveSubTab('team');
                    setSelectedEmp({
                      id: user.employee.id,
                      name: user.name,
                      email: user.email,
                      role: user.role
                    });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#2c9d83',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    padding: 0
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Team</span>
                </button>
              )}

              {/* Header with employee name if admin is viewing another employee */}
              {isPrivileged && selectedEmp?.id !== user.employee?.id && (
                <div style={{
                  background: 'rgba(44, 157, 131, 0.08)',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(44, 157, 131, 0.2)',
                  marginBottom: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Viewing Student</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{selectedEmp?.name}</div>
                  </div>
                  <button 
                    onClick={() => setShowOverrideDrawer(true)}
                    style={{
                      background: '#2c9d83',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Edit Record
                  </button>
                </div>
              )}

              {/* Status Dot indicator & Date selection Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                {/* Clock Status Dot Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#475569'
                }}>
                  <CircleDot size={18} fill={todayStatusObj.color} color={todayStatusObj.color} />
                  <span>{todayStatusObj.text}</span>
                </div>

                {/* Custom Month Dropdown Picker */}
                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      textAlign: 'right'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {months[summaryMonth - 1]}
                        <ChevronDown size={14} color="#64748b" />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{summaryYear}</div>
                    </div>
                  </div>

                  {/* Month Selection overlay card */}
                  {showMonthDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                      padding: '8px',
                      zIndex: 100,
                      width: '180px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '4px'
                    }}>
                      {months.map((m, idx) => (
                        <button
                          key={m}
                          onClick={() => {
                            setSummaryMonth(idx + 1);
                            setShowMonthDropdown(false);
                          }}
                          style={{
                            padding: '6px',
                            border: 'none',
                            background: summaryMonth === idx + 1 ? '#2c9d83' : 'transparent',
                            color: summaryMonth === idx + 1 ? '#ffffff' : '#334155',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {m}
                        </button>
                      ))}
                      <div style={{ gridColumn: 'span 3', borderTop: '1px solid #f1f5f9', padding: '6px 0 0 0', display: 'flex', justifyContent: 'center' }}>
                        <select 
                          value={summaryYear}
                          onChange={(e) => setSummaryYear(parseInt(e.target.value))}
                          style={{ border: 'none', background: '#f1f5f9', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          <option value="2025">2025</option>
                          <option value="2026">2026</option>
                          <option value="2027">2027</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Attendance Circular SVG Donut Chart */}
              <div style={{ margin: '16px 0 24px 0', textAlign: 'center' }}>
                {loading ? (
                  <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid #f3f3f3', borderTop: '3px solid #2c9d83', borderRadius: '50%' }}></div>
                  </div>
                ) : (
                  renderDonutChart()
                )}
              </div>

              {/* 4 Metric Summary Boxes */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '28px'
              }}>
                {/* Metric 1: On Time */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '12px 6px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2c9d83' }} />
                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b' }}>{metrics.onTime}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>On Time</div>
                </div>

                {/* Metric 2: Late In */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '12px 6px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b' }}>{metrics.lateIn}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Late In</div>
                </div>

                {/* Metric 3: Early Exit */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '12px 6px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b' }}>{metrics.earlyExit}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Early Exit</div>
                </div>

                {/* Metric 4: Absent */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '12px 6px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b' }}>{metrics.absent}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Absent</div>
                </div>
              </div>

              {/* Clock In / Out Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <button
                  onClick={handleClockIn}
                  disabled={todayStatusObj.logged}
                  className="clock-btn"
                  style={{
                    background: todayStatusObj.logged ? '#94a3b8' : '#2c9d83',
                    color: '#ffffff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '14px',
                    fontSize: '1.05rem',
                    fontWeight: 'bold',
                    cursor: todayStatusObj.logged ? 'not-allowed' : 'pointer',
                    boxShadow: todayStatusObj.logged ? 'none' : '0 4px 12px rgba(44, 157, 131, 0.25)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <CircleDot size={18} fill="#fff" />
                  <span>Clock In</span>
                </button>

                <button
                  onClick={handleClockOut}
                  disabled={!todayStatusObj.logged || todayStatusObj.statusVal === 'CLOCKED_OUT'}
                  className="clock-btn"
                  style={{
                    background: '#ffffff',
                    color: (!todayStatusObj.logged || todayStatusObj.statusVal === 'CLOCKED_OUT') ? '#94a3b8' : '#ef4444',
                    border: `2px solid ${(!todayStatusObj.logged || todayStatusObj.statusVal === 'CLOCKED_OUT') ? '#cbd5e1' : '#ef4444'}`,
                    padding: '14px',
                    borderRadius: '14px',
                    fontSize: '1.05rem',
                    fontWeight: 'bold',
                    cursor: (!todayStatusObj.logged || todayStatusObj.statusVal === 'CLOCKED_OUT') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <CircleDot size={18} fill="none" />
                  <span>Clock Out</span>
                </button>
              </div>

              {/* Late marks audit log for employee */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Info size={18} color="#2c9d83" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#475569' }}>Lates Log & Reasons</span>
                </div>
                
                {attendanceSummary?.latesDetail && attendanceSummary.latesDetail.length > 0 ? (
                  <div style={{
                    background: '#fff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    padding: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                  }}>
                    {attendanceSummary.latesDetail.map((item, index) => (
                      <div 
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderBottom: index === attendanceSummary.latesDetail.length - 1 ? 'none' : '1px solid #f1f5f9',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#64748b' }}>
                          {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span style={{ color: '#334155', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reason}>
                          {item.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '20px',
                    background: 'rgba(255,255,255,0.4)',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '14px',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    color: '#64748b'
                  }}>
                    No lateness records flagged for this period.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RENDER VIEW: TEAM SEARCH & DIRECTORY (ADMIN ONLY) */}
          {activeSubTab === 'team' && (
            <div>
              {/* Search Box */}
              <div style={{
                position: 'relative',
                marginBottom: '18px'
              }}>
                <Search size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 42px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#1e293b'
                  }}
                />
              </div>

              {/* Employee list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const initials = emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'EE';
                    return (
                      <div 
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: '#2c9d83',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.95rem'
                        }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {emp.email}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.78rem',
                          background: '#f1f5f9',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          color: '#475569',
                          fontWeight: 600
                        }}>
                          {emp.trackingMode || 'OFFLINE'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '28px', color: '#64748b', fontSize: '0.9rem' }}>
                    No employees found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RENDER VIEW: NEWS TAB (Simulated feed) */}
          {mobileBottomTab === 'news' && (
            <div style={{ animation: 'slideIn 0.25s ease' }}>
              <h3 style={{ margin: '0 0 18px 0', color: '#2c9d83', fontSize: '1.3rem', fontWeight: 'bold' }}>Company News</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px' }}>
                  <div style={{ color: '#2c9d83', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Announcement</div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 'bold', color: '#1e293b' }}>Summer Hackathon 2026 Announced</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                    Register your teams for the upcoming Pocket Hackathon before June 20th. Exciting awards & prizes await the winners!
                  </p>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px' }}>
                  <div style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>General</div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 'bold', color: '#1e293b' }}>Office Upgrade Project</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                    The 4th-floor cafeteria remodeling is now complete! Come experience the new bean bags and gaming consoles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* RENDER VIEW: ALERTS TAB (Simulated alerts) */}
          {mobileBottomTab === 'alerts' && (
            <div style={{ animation: 'slideIn 0.25s ease' }}>
              <h3 style={{ margin: '0 0 18px 0', color: '#2c9d83', fontSize: '1.3rem', fontWeight: 'bold' }}>Alerts & Notifications</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', display: 'flex', gap: '12px' }}>
                  <Bell size={22} color="#2c9d83" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b' }}>Attendance Checked</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.35 }}>
                      Your attendance record for yesterday has been successfully audited and approved.
                    </p>
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', display: 'flex', gap: '12px' }}>
                  <AlertCircle size={22} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b' }}>Late Punch Penalty</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.35 }}>
                      You have logged 3 late punches. 1 absent day penalty will be deducted from your payable balance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RENDER VIEW: ACCOUNT TAB (Simulated account page) */}
          {mobileBottomTab === 'account' && (
            <div style={{ animation: 'slideIn 0.25s ease', textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(44, 157, 131, 0.1)',
                color: '#2c9d83',
                fontSize: '2.2rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '18px auto 12px auto'
              }}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b' }}>{user?.name}</h3>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '22px' }}>{user?.email}</div>

              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '14px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>System Role</span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>{user?.role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Employee ID</span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>{user?.employee?.id || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Daily Punch Mode</span>
                  <span style={{ color: '#2c9d83', fontWeight: 600 }}>OFFLINE</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE-UP DRAWER: Lateness Reason Dialog */}
          {showLateDrawer && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'flex-end',
              borderRadius: '20px',
              animation: 'fadeIn 0.2s ease'
            }}>
              <form 
                onSubmit={handleClockIn}
                style={{
                  background: '#ffffff',
                  borderTopLeftRadius: '24px',
                  borderTopRightRadius: '24px',
                  padding: '24px',
                  width: '100%',
                  boxShadow: '0 -10px 25px rgba(0,0,0,0.1)',
                  animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>
                    Lateness Reason Required
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setShowLateDrawer(false)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={20} color="#64748b" />
                  </button>
                </div>
                
                <p style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45 }}>
                  You are checking in after <strong>09:30 AM</strong>. Please provide a reason for lateness to record this punch.
                </p>

                <textarea
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  placeholder="e.g. Traffic delay, train cancelation, personal emergency..."
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                    marginBottom: '18px',
                    fontFamily: 'inherit'
                  }}
                />

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Submit Late Clock-In
                </button>
              </form>
            </div>
          )}

          {/* SLIDE-UP DRAWER: Admin Override Attendance Dialog */}
          {showOverrideDrawer && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'flex-end',
              borderRadius: '20px',
              animation: 'fadeIn 0.2s ease'
            }}>
              <form 
                onSubmit={handleAdminOverride}
                style={{
                  background: '#ffffff',
                  borderTopLeftRadius: '24px',
                  borderTopRightRadius: '24px',
                  padding: '24px',
                  width: '100%',
                  boxShadow: '0 -10px 25px rgba(0,0,0,0.1)',
                  animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>
                    Edit Employee Attendance
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setShowOverrideDrawer(false)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={20} color="#64748b" />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Date</label>
                    <input 
                      type="date"
                      value={overrideDate}
                      onChange={(e) => setOverrideDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Status</label>
                    <select
                      value={overrideStatus}
                      onChange={(e) => setOverrideStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', outline: 'none' }}
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="LATE">LATE</option>
                      <option value="ABSENT">ABSENT</option>
                    </select>
                  </div>

                  {overrideStatus === 'LATE' && (
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Reason for Lateness</label>
                      <textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Enter reason..."
                        required
                        rows={2}
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: '#2c9d83',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Save Attendance Record
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Bottom Smartphone Navigation Bar */}
        <div style={{
          height: '66px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingBottom: '4px',
          zIndex: 10
        }}>
          {/* Tab 1: Attendance */}
          <button 
            onClick={() => {
              setMobileBottomTab('attendance');
              setActiveSubTab('my');
            }}
            style={{
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: mobileBottomTab === 'attendance' ? '#2c9d83' : '#64748b',
              fontSize: '0.68rem',
              fontWeight: 600
            }}
          >
            <CheckSquare size={20} fill={mobileBottomTab === 'attendance' ? 'rgba(44, 157, 131, 0.1)' : 'none'} />
            <span style={{ marginTop: '2px' }}>Attendance</span>
          </button>

          {/* Tab 2: News */}
          <button 
            onClick={() => setMobileBottomTab('news')}
            style={{
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: mobileBottomTab === 'news' ? '#2c9d83' : '#64748b',
              fontSize: '0.68rem',
              fontWeight: 600
            }}
          >
            <Radio size={20} />
            <span style={{ marginTop: '2px' }}>News</span>
          </button>

          {/* Tab 3: Alerts */}
          <button 
            onClick={() => setMobileBottomTab('alerts')}
            style={{
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: mobileBottomTab === 'alerts' ? '#2c9d83' : '#64748b',
              fontSize: '0.68rem',
              fontWeight: 600,
              position: 'relative'
            }}
          >
            <Bell size={20} fill={mobileBottomTab === 'alerts' ? 'rgba(44, 157, 131, 0.1)' : 'none'} />
            {/* Notification Badge */}
            <div style={{
              position: 'absolute',
              top: '-3px',
              right: '2px',
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '50%',
              width: '13px',
              height: '13px',
              fontSize: '0.55rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              2
            </div>
            <span style={{ marginTop: '2px' }}>Alerts</span>
          </button>

          {/* Tab 4: Others */}
          <button 
            onClick={() => showToast('Others options clicked')}
            style={{
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '0.68rem',
              fontWeight: 600
            }}
          >
            <List size={20} />
            <span style={{ marginTop: '2px' }}>Others</span>
          </button>

          {/* Tab 5: Account */}
          <button 
            onClick={() => setMobileBottomTab('account')}
            style={{
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: mobileBottomTab === 'account' ? '#2c9d83' : '#64748b',
              fontSize: '0.68rem',
              fontWeight: 600
            }}
          >
            <User size={20} fill={mobileBottomTab === 'account' ? 'rgba(44, 157, 131, 0.1)' : 'none'} />
            <span style={{ marginTop: '2px' }}>Account</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default Attendance;
