import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, FileText, Download, CheckCircle, 
  AlertTriangle, DollarSign, Calculator, Calendar,
  UploadCloud, Search, Check, RefreshCw, Trash2, 
  Play, LayoutDashboard, Clock, CalendarDays, Loader2,
  Menu, HelpCircle, ChevronRight, CheckSquare, Square
} from 'lucide-react';

const Salaries = () => {
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Lists & Selections
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  
  // Selection
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(2); // Default to February
  const [salarySlip, setSalarySlip] = useState(null);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dashboard Specific States (For Admin/HR)
  const [dashboardTab, setDashboardTab] = useState('EmployeeWise'); // EmployeeWise, Selective, All
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Selective selection
  const [selectedEmployeesList, setSelectedEmployeesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal for Detailed Statement view from Dashboard
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [modalSlip, setModalSlip] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Edit Salary States
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [newSalaryValue, setNewSalaryValue] = useState(15000);
  const [salarySaveLoading, setSalarySaveLoading] = useState(false);

  // Middle Column Checkbox States
  const [checklist, setChecklist] = useState({
    incomeTax: true,
    pendingLeaves: true,
    pendingOnduty: true,
    proofWise: true,
    separated: false,
    regularization: true
  });
  
  // Process execution states
  const [payrollRunning, setPayrollRunning] = useState(false);
  const [runStep, setRunStep] = useState(0);
  const [runSuccess, setRunSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Month Cards Value States
  const [decTotal, setDecTotal] = useState(0);
  const [janTotal, setJanTotal] = useState(0);
  const [febTotal, setFebTotal] = useState(0);
  const [febStatus, setFebStatus] = useState('Ongoing'); // Ongoing or Completed

  const isPrivileged = user && ['ADMIN', 'HR'].includes(user.role);

  useEffect(() => {
    if (token) {
      if (isPrivileged) {
        fetchEmployees();
      } else if (user) {
        setSelectedEmpId(user.employee?.id || '');
      }
    }
  }, [token, user]);

  useEffect(() => {
    if (!isPrivileged && selectedEmpId) {
      fetchSalarySlip();
    }
  }, [selectedEmpId, year, month]);

  // Calculate dynamic totals for Feb Card based on employee database salaries
  useEffect(() => {
    if (employees.length > 0) {
      const sum = employees.reduce((acc, e) => acc + (e.grossSalary || 0), 0);
      setFebTotal(sum);
    }
  }, [employees]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/employees?limit=100` , {
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

  const fetchSalarySlip = async () => {
    if (!selectedEmpId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/salaries/slip/${selectedEmpId}?year=${year}&month=${month}` ,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setSalarySlip(data.data);
      } else {
        setError(data.message || 'Failed to fetch salary details');
      }
    } catch (err) {
      setError('Network error loading salary slip');
    } finally {
      setLoading(false);
    }
  };

  const fetchModalSlip = async (empId) => {
    if (!empId) return;
    setModalLoading(true);
    setModalError('');
    setShowSlipModal(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/salaries/slip/${empId}?year=${year}&month=${month}` ,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setModalSlip(data.data);
      } else {
        setModalError(data.message || 'Failed to fetch salary details');
      }
    } catch (err) {
      setModalError('Network error loading salary slip');
    } finally {
      setModalLoading(false);
    }
  };

  const handleExportPayroll = async () => {
    setExportLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/salaries/export?year=${year}&month=${month}` ,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `salary_sheet_${year}_${String(month).padStart(2, '0')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setError('Failed to export payroll CSV');
      }
    } catch (err) {
      setError('Network error during export');
    } finally {
      setExportLoading(false);
    }
  };

  // Edit Salary logic
  const handleSaveSalary = async () => {
    if (!selectedEmpId || !newSalaryValue) return;
    setSalarySaveLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/employees/${selectedEmpId}` , {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grossSalary: parseFloat(newSalaryValue) })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Update local state list so top cards and UI update immediately
        setEmployees(prev => prev.map(emp => 
          emp.id === parseInt(selectedEmpId) ? { ...emp, grossSalary: parseFloat(newSalaryValue) } : emp
        ));
        setIsEditingSalary(false);
        alert('Employee monthly gross salary updated successfully!');
      } else {
        setError(data.message || 'Failed to update salary');
      }
    } catch (err) {
      setError('Network error updating salary');
    } finally {
      setSalarySaveLoading(false);
    }
  };

  // Drag & drop file handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx')) {
        simulateUpload(file);
      } else {
        setError('Only .xlsx format files are allowed.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.xlsx')) {
        simulateUpload(file);
      } else {
        setError('Only .xlsx format files are allowed.');
      }
    }
  };

  const simulateUpload = (file) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadedFile(null);
    setError('');
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploadedFile(file.name);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const toggleSelectiveEmployee = (id) => {
    setSelectedEmployeesList(prev => 
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    );
  };

  const handleRunPayroll = async () => {
    setPayrollRunning(true);
    setRunStep(0);
    setRunSuccess(false);
    setError('');
    
    // Simulate steps in the overlay for premium feel
    const stepDurations = [600, 800, 1000, 600, 400];
    for (let i = 0; i < stepDurations.length; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDurations[i]));
      setRunStep(i + 1);
    }
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/salaries/run` , {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ year, month })
      });
      
      const data = await res.json();
      if (res.ok) {
        setRunSuccess(true);
        setSuccessMsg(data.message);
        setFebStatus('Completed');
        
        // Sum dynamic gross salaries for Feb Card
        const totalGross = employees.reduce((sum, emp) => sum + (emp.grossSalary || 15000), 0);
        setFebTotal(totalGross);
      } else {
        setError(data.message || 'Failed to process payroll');
        setPayrollRunning(false);
      }
    } catch (err) {
      setError('Network error running payroll.');
      setPayrollRunning(false);
    }
  };

  const handleChecklistChange = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '8px',
    width: '100%',
    transition: 'all 0.2s ease',
    outline: 'none'
  };

  const navLabelStyle = {
    fontSize: '0.65rem',
    color: '#64748b',
    fontWeight: '500'
  };

  // If user is Employee (Non-Admin / Non-HR), render the classic detailed Statement Slip Console
  if (!isPrivileged) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ textAlign: 'left', margin: 0 }}>Payroll Console</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Check slab-wise calculations of TDS, ESIC, and PF deductions based on gross pro-rated pay.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert-banner error" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--error)' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Selector Controls Card */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Payroll Year</label>
              <select className="form-input" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Payroll Month</label>
              <select className="form-input" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          </div>
        ) : salarySlip ? (
          <div className="glass-card" style={{ padding: '32px' }}>
            {/* Slip Header */}
            <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>Salary Statement / Slip</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  For the period of {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--primary-start)' }}>
                  ₹{salarySlip.payroll.netPay.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Take-Home Pay</span>
              </div>
            </div>

            {/* Summary cards for Gross, Deductions, Net */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {/* Gross Card */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--card-border)', 
                padding: '20px', 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px' 
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Monthly Gross Salary</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)' }}>₹{salarySlip.payroll.gross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Deductions Card */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--card-border)', 
                padding: '20px', 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px' 
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Total Deductions</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ef4444' }}>₹{salarySlip.payroll.totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Net Take-Home Card */}
              <div style={{ 
                background: 'var(--primary-gradient)', 
                padding: '20px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px' 
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Net Take-Home Pay</span>
                  <span style={{ fontSize: '1.45rem', fontWeight: 'bold', color: '#ffffff' }}>₹{salarySlip.payroll.netPay.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Student Info Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', padding: '20px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Student Name</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{salarySlip.employee.name}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Email ID</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{salarySlip.employee.email}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Student ID</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>#{salarySlip.employee.id}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Base Monthly Gross</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>₹{salarySlip.employee.baseGross.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Attendance Pro-rating panel */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: 'var(--primary-start)' }} />
                <span>Attendance & Payable Days Calculation</span>
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{modalSlip ? modalSlip.attendance.totalDays : salarySlip.attendance.totalDays}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Logged Days</span>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{modalSlip ? modalSlip.attendance.present : salarySlip.attendance.present}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Presents</span>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>{modalSlip ? modalSlip.attendance.late : salarySlip.attendance.late}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Lates Logged</span>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>{modalSlip ? modalSlip.attendance.penaltyAbsents : salarySlip.attendance.penaltyAbsents}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Late Penalties (3:1)</span>
                </div>
                <div style={{ padding: '12px', background: 'var(--primary-gradient)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{modalSlip ? modalSlip.attendance.netPayableDays : salarySlip.attendance.netPayableDays}</span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', display: 'block', marginTop: '2px' }}>Payable Days</span>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                * Month-end gross is pro-rated: Base Gross × (Payable Days / Logged Days).
              </p>
            </div>

            {/* Calculations Table */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>Earnings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Base monthly gross</span>
                    <span style={{ color: 'var(--text-main)' }}>₹{salarySlip.employee.baseGross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-main)' }}>Pro-rated Gross pay</span>
                    <span style={{ color: 'var(--text-main)' }}>₹{salarySlip.payroll.gross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Basic Salary (50% gross)</span>
                    <span style={{ color: 'var(--text-main)' }}>₹{salarySlip.payroll.basic.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>Deductions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>PF Employee Contribution (12% basic)</span>
                    <span style={{ color: '#ef4444' }}>-₹{salarySlip.payroll.pf.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ESIC contribution</span>
                    <span style={{ color: '#ef4444' }}>-₹{salarySlip.payroll.esic.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>TDS Slab Deduction ({salarySlip.payroll.tdsRate}%)</span>
                    <span style={{ color: '#ef4444' }}>-₹{salarySlip.payroll.tds.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, borderTop: '1px dashed var(--card-border)', paddingTop: '4px' }}>
                    <span style={{ color: 'var(--text-main)' }}>Total Deductions</span>
                    <span style={{ color: '#ef4444' }}>-₹{salarySlip.payroll.totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No salary statement generated for this period.
          </div>
        )}
      </div>
    );
  }

  // IF ADMIN / HR: RENDER THE HIGH-FIDELITY SMHRT PAYROLL DASHBOARD
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: '1100px', 
      margin: '0 auto', 
      padding: '10px 0',
      zIndex: 2
    }}>
      {/* Visual background elements matching mockup */}
      <div style={{
        position: 'absolute',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.2) 60%, transparent 100%)',
        right: '-100px',
        top: '-100px',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(147,51,234,0.15) 70%, transparent 100%)',
        left: '-150px',
        bottom: '-50px',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>

      {/* Main Mockup Glass Card Container */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
        display: 'flex',
        minHeight: '620px',
        width: '100%',
        color: '#0f172a', // Dark theme text for high readability
        overflow: 'hidden',
        fontFamily: 'Outfit, sans-serif'
      }}>
        
        {/* Left Side Navigation (Mock Sidebar matching the layout) */}
        <div style={{
          width: '110px',
          background: '#f1f5f9',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '40px',
          gap: '24px',
          flexShrink: 0
        }}>
          {/* Dashboard Icon Button */}
          <button onClick={() => navigate('/')} style={navBtnStyle}>
            <LayoutDashboard size={20} color="#64748b" />
            <span style={navLabelStyle}>Dashboard</span>
          </button>

          {/* Attendance Icon Button */}
          <button onClick={() => navigate('/attendance')} style={navBtnStyle}>
            <Clock size={20} color="#64748b" />
            <span style={navLabelStyle}>Attendance</span>
          </button>

          {/* Payroll Active Card (Overlapping layout) */}
          <div style={{
            width: '90px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 6px',
            position: 'relative',
            zIndex: 10,
            transform: 'translateX(10px)',
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803d',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginBottom: '6px'
            }}>
              ₹
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#0f172a' }}>Payroll</span>
          </div>

          {/* Leave Icon Button */}
          <button onClick={() => navigate('/leaves')} style={navBtnStyle}>
            <CalendarDays size={20} color="#64748b" />
            <span style={navLabelStyle}>Leave</span>
          </button>
        </div>

        {/* Right Content Area */}
        <div style={{
          flexGrow: 1,
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto'
        }}>
          
          {/* Header Panel (Mockup branding removed per request) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '15px'
          }}>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#0f172a',
                textAlign: 'left',
                background: 'none',
                WebkitTextFillColor: 'initial',
                letterSpacing: '-0.5px'
              }}>
                Payroll Console
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a' }}>EMS Portal</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Payroll Management</div>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-start) 0%, var(--primary-end) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                boxShadow: '0 4px 6px -1px rgba(59,130,246,0.2)'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Month Cards Row (Hardcoded mockup demo values removed) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            {/* Dec 2024 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>Dec 2024</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>
                  No Run
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#94a3b8', marginBottom: '12px' }}>
                ₹ {decTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{
                background: '#cbd5e1',
                color: '#64748b',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '6px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                Not Processed
              </div>
            </div>

            {/* Jan 2025 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>Jan 2025</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>
                  No Run
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#94a3b8', marginBottom: '12px' }}>
                ₹ {janTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{
                background: '#cbd5e1',
                color: '#64748b',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '6px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                Not Processed
              </div>
            </div>

            {/* Feb 2025 (Dynamic total calculated from DB employees) */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>Feb 2025</span>
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  ↓ Active
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>
                ₹ {febTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{
                background: febStatus === 'Completed' ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #eab308 0%, #ca8a04 100%)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '6px',
                borderRadius: '8px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}>
                {febStatus}
              </div>
            </div>
          </div>

          {/* Lower 3-Column Processing Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            gap: '16px',
            alignItems: 'stretch'
          }}>
            
            {/* Column 1: Payroll Process Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Tab Header Selector */}
              <div style={{
                display: 'flex',
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '4px',
                border: '1px solid #f1f5f9'
              }}>
                {['EmployeeWise', 'Selective', 'All'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setDashboardTab(tab);
                      setError('');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      background: dashboardTab === tab ? '#ffffff' : 'transparent',
                      color: dashboardTab === tab ? '#1e3a8a' : '#64748b',
                      boxShadow: dashboardTab === tab ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                  >
                    {tab === 'EmployeeWise' ? 'Employee Wise' : tab === 'Selective' ? 'Selective Employees' : 'All Employees'}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                  Payroll Process - February 2025
                </h3>

                {dashboardTab === 'EmployeeWise' && (
                  <>
                    {/* Employee Search Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Employee Id / Employee Name
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          className="form-input"
                          value={selectedEmpId}
                          onChange={(e) => {
                            setSelectedEmpId(e.target.value);
                            setIsEditingSalary(false);
                          }}
                          style={{
                            padding: '10px 12px',
                            fontSize: '0.8rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            background: '#ffffff',
                            color: '#334155',
                            flexGrow: 1
                          }}
                        >
                          <option value="">-- Select Employee --</option>
                          {employees.map(e => (
                            <option key={e.id} value={e.id}>{e.name} (#{e.id})</option>
                          ))}
                        </select>

                        {selectedEmpId && (
                          <button
                            onClick={() => fetchModalSlip(selectedEmpId)}
                            style={{
                              padding: '10px 14px',
                              background: '#3b82f6',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <FileText size={14} /> View Slip
                          </button>
                        )}
                      </div>
                    </div>

                    {/* EDIT SALARY & Details Section */}
                    {selectedEmpId && (
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                              {employees.find(e => e.id === parseInt(selectedEmpId))?.name || 'Selected Employee'}
                            </h4>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              ID: #{selectedEmpId} | {employees.find(e => e.id === parseInt(selectedEmpId))?.email}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: '600',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            background: '#dbeafe',
                            color: '#1e40af'
                          }}>
                            {employees.find(e => e.id === parseInt(selectedEmpId))?.trackingMode || 'OFFLINE'}
                          </span>
                        </div>

                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          background: '#ffffff', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          border: '1px solid #f1f5f9' 
                        }}>
                          <div>
                            <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block' }}>Monthly Gross Salary</span>
                            {isEditingSalary ? (
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>₹</span>
                                <input
                                  type="number"
                                  value={newSalaryValue}
                                  onChange={(e) => setNewSalaryValue(e.target.value)}
                                  style={{
                                    width: '100px',
                                    padding: '4px 6px',
                                    fontSize: '0.8rem',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    background: '#ffffff',
                                    color: '#334155'
                                  }}
                                />
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0f172a' }}>
                                ₹{employees.find(e => e.id === parseInt(selectedEmpId))?.grossSalary?.toLocaleString('en-IN') || '15,000'}
                              </span>
                            )}
                          </div>

                          <div>
                            {isEditingSalary ? (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={handleSaveSalary}
                                  disabled={salarySaveLoading}
                                  style={{
                                    padding: '5px 8px',
                                    background: '#10b981',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.68rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {salarySaveLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setIsEditingSalary(false)}
                                  style={{
                                    padding: '5px 8px',
                                    background: '#ef4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.68rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  const currentEmp = employees.find(e => e.id === parseInt(selectedEmpId));
                                  setNewSalaryValue(currentEmp?.grossSalary || 15000);
                                  setIsEditingSalary(true);
                                }}
                                style={{
                                  padding: '5px 10px',
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontSize: '0.68rem',
                                  fontWeight: '600',
                                  color: '#475569',
                                  cursor: 'pointer'
                                }}
                              >
                                Edit Salary
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Excel Drag & Drop Upload Block */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      style={{
                        border: dragActive ? '2px dashed #3b82f6' : '1px dashed #cbd5e1',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        background: dragActive ? 'rgba(59,130,246,0.05)' : '#f8fafc',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <input 
                        type="file" 
                        id="excel-uploader" 
                        accept=".xlsx" 
                        onChange={handleFileSelect} 
                        style={{ display: 'none' }} 
                      />
                      <label htmlFor="excel-uploader" style={{ cursor: 'pointer', display: 'block' }}>
                        <UploadCloud size={28} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
                        {uploading ? (
                          <div>
                            <span style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px' }}>Uploading Spreadsheet...</span>
                            <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#3b82f6', transition: 'width 0.1s ease' }}></div>
                            </div>
                          </div>
                        ) : uploadedFile ? (
                          <div>
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <Check size={14} /> File Loaded
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{uploadedFile}</span>
                          </div>
                        ) : (
                          <>
                            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500', display: 'block' }}>Drag and drop a file here or click</span>
                            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>*Only .xlsx format allowed</span>
                          </>
                        )}
                      </label>
                    </div>
                  </>
                )}

                {dashboardTab === 'Selective' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="Search employee name/email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 30px',
                          fontSize: '0.8rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          background: '#ffffff',
                          color: '#334155'
                        }}
                      />
                    </div>
                    <div style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      padding: '8px',
                      background: '#f8fafc'
                    }}>
                      {filteredEmployees.map(emp => (
                        <label 
                          key={emp.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            fontSize: '0.75rem', 
                            padding: '6px 4px',
                            cursor: 'pointer',
                            color: '#334155'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmployeesList.includes(emp.id)}
                            onChange={() => toggleSelectiveEmployee(emp.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{emp.name} ({emp.email})</span>
                        </label>
                      ))}
                      {filteredEmployees.length === 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', padding: '10px' }}>No matches found</div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Selected: <strong>{selectedEmployeesList.length}</strong> employees
                    </span>
                  </div>
                )}

                {dashboardTab === 'All' && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    flexGrow: 1
                  }}>
                    <CheckSquare size={32} color="#16a34a" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#166534' }}>All Active Employees Selected</span>
                    <p style={{ fontSize: '0.72rem', color: '#15803d', margin: 0 }}>
                      Running payroll will process statements dynamically for all <strong>{employees.length}</strong> active profiles.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Month & Year & Checklist Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Dropdowns row */}
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Month & Year
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    style={{
                      padding: '8px 10px',
                      fontSize: '0.8rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#334155'
                    }}
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </select>

                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    style={{
                      padding: '8px 10px',
                      fontSize: '0.8rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#334155'
                    }}
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              {/* Checklist list */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                  onClick={() => handleChecklistChange('incomeTax')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: '#334155' }}
                >
                  {checklist.incomeTax ? <CheckSquare size={16} color="#16a34a" /> : <Square size={16} color="#cbd5e1" />}
                  <span>With Income Tax Process</span>
                </div>
                <div 
                  onClick={() => handleChecklistChange('pendingLeaves')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: '#334155' }}
                >
                  {checklist.pendingLeaves ? <CheckSquare size={16} color="#16a34a" /> : <Square size={16} color="#cbd5e1" />}
                  <span>Check Pending Leaves</span>
                </div>
                <div 
                  onClick={() => handleChecklistChange('pendingOnduty')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: '#334155' }}
                >
                  {checklist.pendingOnduty ? <CheckSquare size={16} color="#16a34a" /> : <Square size={16} color="#cbd5e1" />}
                  <span>Check Pending Onduty</span>
                </div>
                <div 
                  onClick={() => handleChecklistChange('proofWise')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: '#334155' }}
                >
                  {checklist.proofWise ? <CheckSquare size={16} color="#16a34a" /> : <Square size={16} color="#cbd5e1" />}
                  <span>Proof Wise</span>
                </div>
                <div 
                  onClick={() => handleChecklistChange('separated')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: '#334155' }}
                >
                  {checklist.separated ? <CheckSquare size={16} color="#16a34a" /> : <Square size={16} color="#cbd5e1" />}
                  <span>With Separated Employees</span>
                </div>
                <div 
                  onClick={() => handleChecklistChange('regularization')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: '#334155' }}
                >
                  {checklist.regularization ? <CheckSquare size={16} color="#16a34a" /> : <Square size={16} color="#cbd5e1" />}
                  <span>Check Pending Regularization</span>
                </div>
              </div>

              {/* Column 2 Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '6px' }}>
                <button 
                  onClick={() => alert('Process initialized!')}
                  style={{
                    padding: '8px 4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Process
                </button>
                <button 
                  onClick={() => alert('Re-process initialized!')}
                  style={{
                    padding: '8px 4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: '#0f766e',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Re-Process
                </button>
                <button 
                  onClick={() => {
                    setUploadedFile(null);
                    setSelectedEmployeesList([]);
                    alert('Configuration cleared!');
                  }}
                  style={{
                    padding: '8px 4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Column 3: Review & Run Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                  Review your payroll process
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Attendance from Biometric</span>
              </div>

              {/* Process checklists with green check circles */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                {['Time Consolidation', 'Leave Posting', 'Payroll Posting', 'Monthly Input'].map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#16a34a',
                      flexShrink: 0
                    }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: '500' }}>{step}</span>
                  </div>
                ))}
              </div>

              {/* Run button */}
              <button
                onClick={handleRunPayroll}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#22c55e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(34,197,94,0.3)',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <Play size={14} fill="#ffffff" />
                <span>Run Payroll</span>
              </button>
            </div>

          </div>

          {/* Export utility row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 16px',
            marginTop: '10px'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#334155' }}>Payroll Reporting Center</span>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>Export proration reports and ESIC/TDS slab spreadsheets.</p>
            </div>
            <button
              onClick={handleExportPayroll}
              disabled={exportLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Download size={14} />
              <span>{exportLoading ? 'Exporting...' : 'Export Salary Sheet'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* DETAILED SLIP MODAL VIEW FROM DASHBOARD */}
      {showSlipModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative',
            color: 'var(--text-main)'
          }}>
            {/* Modal close */}
            <button
              onClick={() => {
                setShowSlipModal(false);
                setModalSlip(null);
                setModalError('');
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '16px', textAlign: 'left' }}>
              Detailed Employee Salary Slip Statement
            </h2>

            {modalLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
              </div>
            ) : modalError ? (
              <div className="alert-banner error" style={{ padding: '12px', borderRadius: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--error)' }} />
                <span>{modalError}</span>
              </div>
            ) : modalSlip ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Info block */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Name</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{modalSlip.employee.name}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>ID</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>#{modalSlip.employee.id}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Base Gross</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>₹{modalSlip.employee.baseGross.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Net Take-Home Pay</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--primary-start)' }}>
                      ₹{modalSlip.payroll.netPay.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Days pro-rating */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px' }}>Attendance & Payable Days</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{modalSlip.attendance.totalDays}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Logged Days</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#10b981' }}>{modalSlip.attendance.present}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Presents</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f59e0b' }}>{modalSlip.attendance.late}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Lates</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#ef4444' }}>{modalSlip.attendance.penaltyAbsents}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Late Penalties</span>
                    </div>
                    <div style={{ background: 'var(--primary-gradient)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>{modalSlip.attendance.netPayableDays}</span>
                      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.9)', display: 'block' }}>Payable Days</span>
                    </div>
                  </div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px', borderBottom: '1px solid var(--card-border)', paddingBottom: '4px' }}>Earnings</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Pro-rated Monthly Gross</span>
                        <span>₹{modalSlip.payroll.gross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Basic Salary (50%)</span>
                        <span>₹{modalSlip.payroll.basic.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px', borderBottom: '1px solid var(--card-border)', paddingBottom: '4px' }}>Deductions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>PF (12% basic)</span>
                        <span style={{ color: '#ef4444' }}>-₹{modalSlip.payroll.pf.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>ESIC contribution</span>
                        <span style={{ color: '#ef4444' }}>-₹{modalSlip.payroll.esic.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>TDS ({modalSlip.payroll.tdsRate}%)</span>
                        <span style={{ color: '#ef4444' }}>-₹{modalSlip.payroll.tds.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px dashed var(--card-border)', paddingTop: '4px' }}>
                        <span>Total Deductions</span>
                        <span style={{ color: '#ef4444' }}>-₹{modalSlip.payroll.totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTC breakdown */}
                <div style={{ background: 'rgba(139, 92, 246, 0.03)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px' }}>Cost to Company (CTC)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Employer PF</span>
                      <span style={{ color: 'var(--text-main)' }}>₹{modalSlip.payroll.employerContributions.pf.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Employer ESIC</span>
                      <span style={{ color: 'var(--text-main)' }}>₹{modalSlip.payroll.employerContributions.esic.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Monthly CTC</span>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>₹{modalSlip.payroll.ctc.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* OVERLAY RUN PROGRESS DIALOG */}
      {payrollRunning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '420px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            color: '#0f172a'
          }}>
            {!runSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <Loader2 size={48} className="spinner" style={{ color: '#22c55e', animation: 'spin 1.5s linear infinite' }} />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 6px 0' }}>Executing Payroll Run</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>February 2025 Cycle</span>
                </div>
                
                {/* Visual steps */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  {[
                    "Consolidating biometric attendance data...",
                    "Posting pending employee leaves...",
                    "Calculating TDS, ESIC, and PF slab deductions...",
                    "Generating monthly salary slips...",
                    "Notifying employees and logging actions..."
                  ].map((stepText, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: runStep > idx ? 1 : runStep === idx ? 0.8 : 0.35 }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: runStep > idx ? '#dcfce7' : runStep === idx ? '#dbeafe' : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: runStep > idx ? '#16a34a' : runStep === idx ? '#2563eb' : '#94a3b8',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {runStep > idx ? <Check size={10} strokeWidth={3} /> : runStep === idx ? <Loader2 size={10} className="spinner" /> : idx + 1}
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: runStep === idx ? '600' : '400', color: runStep === idx ? '#2563eb' : '#334155' }}>
                        {stepText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a'
                }}>
                  <Check size={32} strokeWidth={3} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 6px 0', color: '#166534' }}>Payroll Run Completed</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                    {successMsg || 'Payroll for February 2025 successfully processed.'}
                  </p>
                </div>
                <button
                  onClick={() => setPayrollRunning(false)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Salaries;
