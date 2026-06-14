import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Plus, Search, Laptop, Monitor, CreditCard, 
  Trash2, UserCheck, RefreshCw, AlertTriangle, CheckCircle, Edit3 
} from 'lucide-react';

const Assets = () => {
  const { token, user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'ADMIN';

  // Tabs: 'registry' or 'my'
  const [activeTab, setActiveTab] = useState('registry');

  // Asset data states
  const [assets, setAssets] = useState([]);
  const [myAllocations, setMyAllocations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal / Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Asset Form fields
  const [formName, setFormName] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formType, setFormType] = useState('LAPTOP');
  const [formStatus, setFormStatus] = useState('AVAILABLE');
  const [isEditing, setIsEditing] = useState(false);

  // Allocation Form fields
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');

  useEffect(() => {
    if (activeTab === 'registry') {
      fetchAssets();
    } else {
      fetchMyAllocations();
    }
  }, [activeTab, search, filterType, filterStatus, page]);

  // Fetch all employees for dropdown
  useEffect(() => {
    if (isAdmin && showAllocateModal) {
      fetchEmployees();
    }
  }, [showAllocateModal]);

  const fetchAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        search,
        type: filterType,
        status: filterStatus
      });
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/assets?${queryParams}` , {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAssets(data.data || []);
        setTotal(data.total || 0);
      } else {
        setError(data.message || 'Failed to load assets registry');
      }
    } catch (err) {
      setError('Network error loading assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAllocations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/assets/allocations/my` , {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setMyAllocations(data.data || []);
      } else {
        setError(data.message || 'Failed to retrieve your allocations');
      }
    } catch (err) {
      setError('Network error retrieving allocations');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/employees?limit=100` , {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        // employee controller returns { success: true, data: [...] }
        setEmployees(data.data || []);
        if (data.data?.length > 0) {
          setSelectedEmployeeId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching employees list:', err);
    }
  };

  const handleCreateOrUpdateAsset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formName || !formSerialNumber) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/assets/${selectedAsset.id}` 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/assets` ;
      
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName,
          serialNumber: formSerialNumber,
          type: formType,
          status: formStatus
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Asset ${isEditing ? 'updated' : 'created'} successfully!`);
        setShowAddModal(false);
        resetForm();
        fetchAssets();
      } else {
        setError(data.message || 'Failed to save asset');
      }
    } catch (err) {
      setError('Network error saving asset');
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/assets/${id}` , {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Asset deleted successfully');
        fetchAssets();
      } else {
        setError(data.message || 'Failed to delete asset');
      }
    } catch (err) {
      setError('Network error deleting asset');
    }
  };

  const handleAllocateAsset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedEmployeeId) {
      setError('Please select an employee');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/assets/${selectedAsset.id}/allocate` , {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          notes: allocationNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Asset allocated successfully!');
        setShowAllocateModal(false);
        setAllocationNotes('');
        fetchAssets();
      } else {
        setError(data.message || 'Failed to allocate asset');
      }
    } catch (err) {
      setError('Network error allocating asset');
    }
  };

  const handleReturnAsset = async (id) => {
    if (!window.confirm('Confirm returning this asset? This will release the unit.')) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/assets/${id}/return` , {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: 'Returned to inventory.' })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Asset returned successfully!');
        fetchAssets();
      } else {
        setError(data.message || 'Failed to return asset');
      }
    } catch (err) {
      setError('Network error processing asset return');
    }
  };

  const openEditModal = (asset) => {
    setSelectedAsset(asset);
    setFormName(asset.name);
    setFormSerialNumber(asset.serialNumber);
    setFormType(asset.type);
    setFormStatus(asset.status);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const openAllocateModal = (asset) => {
    setSelectedAsset(asset);
    setShowAllocateModal(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormSerialNumber('');
    setFormType('LAPTOP');
    setFormStatus('AVAILABLE');
    setIsEditing(false);
    setSelectedAsset(null);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'LAPTOP': return <Laptop size={18} />;
      case 'MONITOR': return <Monitor size={18} />;
      case 'IDCARD': return <CreditCard size={18} />;
      default: return <Laptop size={18} />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'badge-approved';
      case 'ALLOCATED': return 'badge-pending-hr';
      case 'UNDER_REPAIR': return 'badge-rejected';
      default: return 'badge-pending';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ textAlign: 'left', margin: 0 }}>Asset Registry</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Allocate, return, and inventory company laptops, screens, and credentials
          </p>
        </div>
        {isAdmin && activeTab === 'registry' && (
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => { resetForm(); setShowAddModal(true); }}
          >
            <Plus size={18} />
            <span>Add Asset</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-container" style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--card-border)', marginBottom: '24px', paddingBottom: '10px' }}>
        <button 
          onClick={() => { setActiveTab('registry'); setPage(1); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'registry' ? 'var(--primary-start)' : 'var(--text-muted)',
            fontWeight: activeTab === 'registry' ? 600 : 400,
            cursor: 'pointer',
            padding: '6px 12px',
            fontSize: '0.95rem',
            borderBottom: activeTab === 'registry' ? '2px solid var(--primary-start)' : 'none',
          }}
        >
          All Assets Registry
        </button>
        <button 
          onClick={() => { setActiveTab('my'); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'my' ? 'var(--primary-start)' : 'var(--text-muted)',
            fontWeight: activeTab === 'my' ? 600 : 400,
            cursor: 'pointer',
            padding: '6px 12px',
            fontSize: '0.95rem',
            borderBottom: activeTab === 'my' ? '2px solid var(--primary-start)' : 'none',
          }}
        >
          My Allocations
        </button>
      </div>

      {success && (
        <div className="alert-banner success" style={{ marginBottom: '24px' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner error" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'registry' && (
        /* Filters Block */
        <div className="glass-card" style={{ maxWidth: '100%', padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div className="input-wrapper" style={{ margin: 0, flex: 1, minWidth: '240px' }}>
            <Search className="input-icon" size={18} />
            <input 
              type="text" 
              className="form-input"
              placeholder="Search by asset name or serial number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
            <select 
              className="form-input" 
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="LAPTOP">Laptops</option>
              <option value="MONITOR">Monitors</option>
              <option value="IDCARD">ID Cards</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
            <select 
              className="form-input" 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="UNDER_REPAIR">Under Repair</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        </div>
      ) : activeTab === 'registry' ? (
        /* Registry View */
        <div className="glass-card" style={{ maxWidth: '100%', padding: '24px' }}>
          <table className="portal-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Asset Info</th>
                <th style={{ textAlign: 'left' }}>Serial Number</th>
                <th style={{ textAlign: 'left' }}>Type</th>
                <th style={{ textAlign: 'left' }}>Status</th>
                <th style={{ textAlign: 'left' }}>Assigned To</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No hardware assets found matching filters.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const currentAlloc = asset.allocations?.[0];
                  return (
                    <tr key={asset.id}>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>{asset.name}</td>
                      <td style={{ textAlign: 'left' }}><code>{asset.serialNumber}</code></td>
                      <td style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getIcon(asset.type)}
                          <span style={{ fontSize: '0.85rem' }}>{asset.type}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        <span className={`badge ${getStatusBadgeClass(asset.status)}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        {currentAlloc ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{currentAlloc.employee.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentAlloc.employee.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {asset.status === 'AVAILABLE' ? (
                              <button 
                                className="btn"
                                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--primary-start)', border: 'none' }}
                                onClick={() => openAllocateModal(asset)}
                                title="Allocate to Employee"
                              >
                                <UserCheck size={14} />
                                <span style={{ fontSize: '0.75rem' }}>Assign</span>
                              </button>
                            ) : asset.status === 'ALLOCATED' ? (
                              <button 
                                className="btn"
                                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 170, 0, 0.1)', color: 'orange', border: 'none' }}
                                onClick={() => handleReturnAsset(asset.id)}
                                title="Approve Return"
                              >
                                <RefreshCw size={14} />
                                <span style={{ fontSize: '0.75rem' }}>Return</span>
                              </button>
                            ) : null}
                            <button 
                              className="btn"
                              style={{ padding: '6px', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: 'none' }}
                              onClick={() => openEditModal(asset)}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              className="btn"
                              style={{ padding: '6px', background: 'rgba(255, 0, 0, 0.1)', color: 'var(--error)', border: 'none' }}
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Simple Pagination */}
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <button 
                className="btn" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: '6px 12px' }}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '0.9rem' }}>
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <button 
                className="btn" 
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '6px 12px' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        /* My Allocations View */
        <div className="glass-card" style={{ maxWidth: '100%', padding: '24px' }}>
          <table className="portal-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Asset Info</th>
                <th style={{ textAlign: 'left' }}>Serial Number</th>
                <th style={{ textAlign: 'left' }}>Type</th>
                <th style={{ textAlign: 'left' }}>Allocation Date</th>
                <th style={{ textAlign: 'left' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {myAllocations.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No hardware assets currently allocated to your account.
                  </td>
                </tr>
              ) : (
                myAllocations.map((alloc) => (
                  <tr key={alloc.id}>
                    <td style={{ textAlign: 'left', fontWeight: 600 }}>{alloc.asset.name}</td>
                    <td style={{ textAlign: 'left' }}><code>{alloc.asset.serialNumber}</code></td>
                    <td style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getIcon(alloc.asset.type)}
                        <span style={{ fontSize: '0.85rem' }}>{alloc.asset.type}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      {new Date(alloc.allocatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {alloc.notes || 'No extra allocation notes provided.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Asset Form Modal (Add / Edit) */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem' }}>{isEditing ? 'Modify Asset Details' : 'Register New Asset'}</h3>
            <form onSubmit={handleCreateOrUpdateAsset}>
              <div className="form-group">
                <label className="form-label">Asset Friendly Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. MacBook Pro M3 Max"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number / Tag *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. SN-MBP88998822"
                  value={formSerialNumber}
                  onChange={(e) => setFormSerialNumber(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Hardware Type</label>
                  <select className="form-input" value={formType} onChange={(e) => setFormType(e.target.value)}>
                    <option value="LAPTOP">Laptop</option>
                    <option value="MONITOR">Monitor</option>
                    <option value="IDCARD">ID Card</option>
                  </select>
                </div>
                {isEditing && (
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Status</label>
                    <select className="form-input" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                      <option value="AVAILABLE">Available</option>
                      <option value="ALLOCATED">Allocated</option>
                      <option value="UNDER_REPAIR">Under Repair</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff' }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {isEditing ? 'Save Changes' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Allocation Modal */}
      {showAllocateModal && (
        <div className="modal-backdrop" onClick={() => setShowAllocateModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem' }}>Assign Hardware Asset</h3>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--card-border)', marginBottom: '16px', fontSize: '0.85rem' }}>
              <strong>Unit:</strong> {selectedAsset?.name} (S/N: <code>{selectedAsset?.serialNumber}</code>)
            </div>
            <form onSubmit={handleAllocateAsset}>
              <div className="form-group">
                <label className="form-label">Select Employee Profile *</label>
                <select 
                  className="form-input"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Allocation Notes</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Specify conditions, physical location, accessories included..."
                  value={allocationNotes}
                  onChange={(e) => setAllocationNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff' }} onClick={() => setShowAllocateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
