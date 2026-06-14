import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  User, Mail, Phone, Building2, Layers, Laptop, Calendar, DollarSign,
  FileText, Upload, Image, Paperclip, CheckCircle, AlertTriangle, Clock,
  Globe, Briefcase, Check, Copy, Pencil, X, GraduationCap, Cpu, MessageSquare, Trash2, Download
} from 'lucide-react';

const Profile = () => {
  const { token, user } = useSelector((state) => state.auth);

  // States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active Tab: 'personal' | 'job' | 'salary' | 'payslips' | 'documents'
  const [activeTab, setActiveTab] = useState('personal');

  // Edit Modal States
  const [activeModal, setActiveModal] = useState(null); // 'basic' | 'professional' | 'address' | 'tax'
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/employees/profile/my` , {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.data);
      } else {
        setError(data.message || 'Failed to fetch profile details');
      }
    } catch (err) {
      setError('Network error, could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.id.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic file upload handlers
  const handleUploadFile = async (field, fileOrFiles) => {
    if (!fileOrFiles) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    // Maintain name
    formData.append('name', profile.name);
    
    if (field === 'profileImage') {
      formData.append('profileImage', fileOrFiles);
    } else if (field === 'resume') {
      formData.append('resume', fileOrFiles);
    } else if (field === 'documents') {
      for (let i = 0; i < fileOrFiles.length; i++) {
        formData.append('documents', fileOrFiles[i]);
      }
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/employees/profile/my` , {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.data);
        setSuccess(`${field === 'profileImage' ? 'Profile picture' : field === 'resume' ? 'Resume' : 'Verification documents'} updated successfully!`);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Network error during file upload');
    } finally {
      setSubmitting(false);
    }
  };

  // Open specific section editor
  const openEditModal = (section) => {
    if (section === 'basic') {
      setEditForm({
        name: profile.name || '',
        phone: profile.phone || '',
        nationality: profile.nationality || '',
        gender: profile.gender || '',
        age: profile.age || '',
        hireType: profile.hireType || 'Full Time',
      });
    } else if (section === 'professional') {
      setEditForm({
        educationLevel: profile.educationLevel || '',
        degree: profile.degree || '',
        hardSkill: profile.hardSkill || '',
        softSkill: profile.softSkill || '',
      });
    } else if (section === 'address') {
      setEditForm({
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postalCode || '',
      });
    } else if (section === 'tax') {
      setEditForm({
        taxNumber: profile.taxNumber || '',
      });
    }
    setActiveModal(section);
  };

  // Handle section saves
  const handleSaveSection = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/employees/profile/my` , {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.data);
        setSuccess('Profile updated successfully!');
        setActiveModal(null);
      } else {
        setError(data.message || 'Failed to save updates');
      }
    } catch (err) {
      setError('Network error saving details');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>
        <AlertTriangle size={36} style={{ marginBottom: '16px' }} />
        <span>{error}</span>
      </div>
    );
  }

  const activeAllocations = profile?.allocations?.filter(a => !a.returnedAt) || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* Breadcrumb Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <span>Employees</span>
          <span>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Employee Profile</span>
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

      {/* Main Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '28px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Cover Graphic, Avatar, Basic Stats */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Subtle wavy vector cover banner */}
          <div style={{ position: 'relative', height: '120px', background: 'var(--card-border-focus)', overflow: 'hidden' }}>
            <svg width="100%" height="100%" viewBox="0 0 500 120" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary-start)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary-end)" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#bannerGrad)" />
              <path d="M0,60 C150,100 300,30 500,70 L500,120 L0,120 Z" fill="rgba(255,255,255,0.03)" />
              <path d="M0,80 C180,120 320,50 500,90 L500,120 L0,120 Z" fill="rgba(255,255,255,0.02)" />
            </svg>
          </div>

          {/* Avatar Container (Overlaps Banner) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 28px 24px', position: 'relative' }}>
            
            <div style={{ position: 'relative', marginTop: '-55px', marginBottom: '16px' }}>
              {profile.profileImage ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${profile.profileImage}` } 
                  alt="" 
                  style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--card-bg)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} 
                />
              ) : (
                <div style={{
                  width: '110px', height: '110px', borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '2.5rem', fontWeight: 600,
                  border: '4px solid var(--card-bg)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Edit Photo Icon Overlay */}
              <label 
                htmlFor="avatarUploadInput" 
                style={{
                  position: 'absolute', bottom: '0', right: '0',
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                  color: 'var(--text-main)', width: '30px', height: '30px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.2s ease'
                }}
                title="Change photo"
              >
                <Pencil size={14} />
              </label>
              <input 
                type="file" 
                id="avatarUploadInput" 
                accept="image/*"
                onChange={(e) => handleUploadFile('profileImage', e.target.files[0])}
                style={{ display: 'none' }}
                disabled={submitting}
              />
            </div>

            {/* Name, ID & Designation Badge */}
            <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{profile.name}</span>
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {profile.id}</span>
              <button 
                onClick={handleCopyId}
                style={{ background: 'transparent', border: 'none', color: copied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                title="Copy ID to clipboard"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>

            <span style={{
              fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
              background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa',
              padding: '4px 12px', borderRadius: '9999px', border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              {user.role}
            </span>

            {/* Basic Information Section */}
            <div style={{ width: '100%', marginTop: '28px', borderTop: '1px solid var(--card-border)', paddingTop: '24px', textAlign: 'left' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Basic Information</h3>
                <button 
                  onClick={() => openEditModal('basic')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                  title="Edit basic information"
                >
                  <Pencil size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}><Mail size={16} /></div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Email</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>{profile.email}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}><Phone size={16} /></div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Mobile Phone</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{profile.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}><Globe size={16} /></div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Nationality</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{profile.nationality || 'Not specified'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}><User size={16} /></div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Gender</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{profile.gender || 'Not specified'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}><Calendar size={16} /></div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Age</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{profile.age ? `${profile.age} years` : 'Not specified'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}><CheckCircle size={16} style={{ color: 'var(--success)' }} /></div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Status</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Active</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}><Briefcase size={16} /></div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Type of Hire</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{profile.hireType || 'Full Time'}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Nav Tabs and Sub-views */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB HEADERS ROW */}
          <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap', borderRadius: '16px' }}>
            {[
              { id: 'personal', label: 'Personal Information' },
              { id: 'job', label: 'Job Information' },
              { id: 'salary', label: 'Salary Information' },
              { id: 'payslips', label: 'Payslips' },
              { id: 'documents', label: 'Documents' },
            ].map(t => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    background: isActive ? 'var(--text-main)' : 'transparent',
                    color: isActive ? 'var(--card-bg)' : 'var(--text-muted)',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 0 15px rgba(255, 255, 255, 0.1)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT PANELS */}
          
          {/* Tab: Personal Information */}
          {activeTab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Card 1: Professional Information */}
              <div className="glass-card" style={{ padding: '28px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: 'var(--primary-start)' }}><GraduationCap size={20} /></div>
                    <span>Professional Information</span>
                  </h3>
                  <button 
                    onClick={() => openEditModal('professional')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                  >
                    <Pencil size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Level of Education</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.educationLevel || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Degree</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.degree || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hard Skill</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.hardSkill || '-'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Soft Skill</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.softSkill || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Home Address */}
              <div className="glass-card" style={{ padding: '28px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: 'var(--primary-start)' }}><Globe size={20} /></div>
                    <span>Home Address</span>
                  </h3>
                  <button 
                    onClick={() => openEditModal('address')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                  >
                    <Pencil size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Address</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.address || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>City</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.city || '-'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Postal Code</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.postalCode || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Tax Information */}
              <div className="glass-card" style={{ padding: '28px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: 'var(--primary-start)' }}><FileText size={20} /></div>
                    <span>Tax Information</span>
                  </h3>
                  <button 
                    onClick={() => openEditModal('tax')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                  >
                    <Pencil size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tax Number</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.taxNumber || '-'}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab: Job Information */}
          {activeTab === 'job' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '28px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={20} style={{ color: 'var(--primary-start)' }} />
                  <span>Organization Details</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Department Assigned</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.department ? profile.department.name : 'No Department Assigned'}</span>
                  </div>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manager</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.manager ? profile.manager.name : 'No Manager Assigned'}</span>
                  </div>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Work Mode (Tracking)</span>
                    <span style={{ fontWeight: 600, color: '#ec4899', fontSize: '0.85rem' }}>{profile.trackingMode}</span>
                  </div>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enrollment Group / Semester</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{profile.semester || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Date Registered</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware Allocations */}
              <div className="glass-card" style={{ padding: '28px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Laptop size={20} style={{ color: 'var(--primary-start)' }} />
                  <span>Hardware Allocations ({activeAllocations.length})</span>
                </h3>

                {activeAllocations.length === 0 ? (
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--card-border)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No corporate hardware allocated to this profile.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeAllocations.map(all => (
                      <div key={all.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{all.asset.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                            Type: {all.asset.type} | SN: {all.asset.serialNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>Assigned on {new Date(all.allocatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Salary Information */}
          {activeTab === 'salary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '28px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DollarSign size={20} style={{ color: 'var(--primary-start)' }} />
                  <span>Compensation Details</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Base monthly gross</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>₹{profile.grossSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>TDS (Estimated 10% deduction)</span>
                    <span style={{ fontWeight: 500, color: 'var(--error)', fontSize: '0.85rem' }}>- ₹{(profile.grossSalary * 0.1).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                    <span style={{ flex: '1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PF Contribution (Estimated 12%)</span>
                    <span style={{ fontWeight: 500, color: 'var(--error)', fontSize: '0.85rem' }}>- ₹{(profile.grossSalary * 0.12).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', paddingTop: '4px' }}>
                    <span style={{ flex: '1', color: 'var(--success)', fontSize: '0.95rem', fontWeight: 700 }}>Estimated Net Take Home</span>
                    <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.95rem' }}>₹{(profile.grossSalary * 0.78).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '24px', textAlign: 'left', background: 'rgba(59, 130, 246, 0.02)', border: '1px solid rgba(59,130,246,0.1)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Disclaimer</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Tax, Provident Fund, and Employee State Insurance calculations are estimations. High-fidelity slab deductions will apply when payouts are committed in the Payroll Console.
                </p>
              </div>
            </div>
          )}

          {/* Tab: Payslips */}
          {activeTab === 'payslips' && (
            <div className="glass-card" style={{ padding: '28px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} style={{ color: 'var(--primary-start)' }} />
                <span>Historical Payslips</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { month: 'May 2026', gross: profile.grossSalary, net: profile.grossSalary * 0.78 },
                  { month: 'April 2026', gross: profile.grossSalary, net: profile.grossSalary * 0.78 },
                  { month: 'March 2026', gross: profile.grossSalary, net: profile.grossSalary * 0.78 },
                ].map((p, idx) => (
                  <div key={idx} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{p.month}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Gross Salary: ₹{p.gross.toLocaleString('en-IN')} | Net Paid: ₹{p.net.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button 
                      onClick={() => alert(`Downloading payslip pdf for ${p.month}...`)}
                      style={{ 
                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)', color: 'var(--text-main)', 
                        padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem'
                      }}
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Documents */}
          {activeTab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Document 1: Resume Upload */}
              <div className="glass-card" style={{ padding: '28px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Paperclip size={20} style={{ color: 'var(--primary-start)' }} />
                  <span>Resume / Curriculum Vitae</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Upload your latest resume. Accepted formats include PDF and Word documents.
                </p>

                {profile.resumePath ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifynContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} style={{ color: 'var(--primary-start)' }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>My_Resume.pdf</span>
                    </div>
                    <a 
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${profile.resumePath}` } 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        padding: '6px 12px', borderRadius: '6px', background: 'var(--card-border-focus)', color: 'var(--text-main)', fontSize: '0.75rem', textDecoration: 'none'
                      }}
                    >
                      View Document
                    </a>
                  </div>
                ) : (
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--card-border)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                    No resume uploaded yet.
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleUploadFile('resume', e.target.files[0])}
                    style={{ display: 'none' }}
                    id="resumeUploadTabBtn"
                    disabled={submitting}
                  />
                  <label htmlFor="resumeUploadTabBtn" className="btn-secondary" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, padding: '10px 18px' }}>
                    <Upload size={15} />
                    <span>{profile.resumePath ? 'Update Resume' : 'Upload Resume'}</span>
                  </label>
                </div>
              </div>

              {/* Document 2: Verification Documents */}
              <div className="glass-card" style={{ padding: '28px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Image size={20} style={{ color: 'var(--primary-start)' }} />
                  <span>Verification Documents</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Provide legal ID, education qualifications, and address proofs.
                </p>

                {profile.documents && profile.documents.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    {profile.documents.map((doc, idx) => (
                      <div key={idx} style={{ position: 'relative', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden' }}>
                        <img 
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${doc}` } 
                          alt="" 
                          style={{ width: '100%', height: '100px', objectFit: 'cover' }} 
                        />
                        <a 
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${doc}` } 
                          target="_blank" 
                          rel="noreferrer"
                          style={{
                            display: 'block', padding: '6px', fontSize: '0.7rem', color: '#fff', textDecoration: 'none', background: 'rgba(0,0,0,0.6)', textAlign: 'center'
                          }}
                        >
                          Document #{idx + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--card-border)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                    No verification documents uploaded yet.
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleUploadFile('documents', Array.from(e.target.files))}
                    style={{ display: 'none' }}
                    id="docsUploadTabBtn"
                    disabled={submitting}
                  />
                  <label htmlFor="docsUploadTabBtn" className="btn-secondary" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, padding: '10px 18px' }}>
                    <Upload size={15} />
                    <span>Upload Verification Docs</span>
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* EDITING DIALOG / MODAL */}
      {activeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, transition: 'all 0.3s ease'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', margin: '20px', textAlign: 'left' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                Edit {activeModal} Info
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Form Fields: Basic Information */}
              {activeModal === 'basic' && (
                <>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.phone || ''}
                      placeholder="e.g. +91 9876543210"
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Nationality</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.nationality || ''}
                      placeholder="e.g. Singapore"
                      onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Gender</label>
                    <select 
                      className="form-input" 
                      value={editForm.gender || ''}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    >
                      <option value="">-- Select Gender --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Age</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={editForm.age || ''}
                      placeholder="e.g. 32"
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Type of Hire</label>
                    <select 
                      className="form-input" 
                      value={editForm.hireType || 'Full Time'}
                      onChange={(e) => setEditForm({ ...editForm, hireType: e.target.value })}
                    >
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Contractor">Contractor</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                </>
              )}

              {/* Form Fields: Professional Information */}
              {activeModal === 'professional' && (
                <>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Level of Education</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.educationLevel || ''}
                      placeholder="e.g. Higher Education"
                      onChange={(e) => setEditForm({ ...editForm, educationLevel: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Degree</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.degree || ''}
                      placeholder="e.g. Electrical Engineering"
                      onChange={(e) => setEditForm({ ...editForm, degree: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Hard Skill</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.hardSkill || ''}
                      placeholder="e.g. Technical Support"
                      onChange={(e) => setEditForm({ ...editForm, hardSkill: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Soft Skill</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.softSkill || ''}
                      placeholder="e.g. Communication"
                      onChange={(e) => setEditForm({ ...editForm, softSkill: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Form Fields: Home Address */}
              {activeModal === 'address' && (
                <>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Address</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.address || ''}
                      placeholder="e.g. 729 Luxery House King's Garden"
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.city || ''}
                      placeholder="e.g. Garder City"
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Postal Code</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.postalCode || ''}
                      placeholder="e.g. 43203"
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Form Fields: Tax Information */}
              {activeModal === 'tax' && (
                <>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tax Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.taxNumber || ''}
                      placeholder="e.g. 93838403"
                      onChange={(e) => setEditForm({ ...editForm, taxNumber: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px', borderTop: '1px solid var(--card-border)', paddingTop: '18px' }}>
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)} 
                  className="btn-secondary" 
                  style={{ width: 'auto', padding: '10px 20px', margin: 0 }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: 'auto', padding: '10px 24px', margin: 0 }}
                  disabled={submitting}
                >
                  {submitting ? <div className="spinner"></div> : <span>Save Changes</span>}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
