import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Layers, 
  LogOut, 
  ShieldAlert,
  Briefcase,
  CalendarDays,
  FileSearch,
  Laptop,
  FileBarChart2,
  Clock,
  CreditCard,
  User,
  Award
} from 'lucide-react';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!user) return null;

  const isPrivileged = user.role === 'ADMIN' || user.role === 'HR';

  return (
    <aside className="portal-sidebar">
      <div>
        <div className="portal-logo">
          <Briefcase size={24} style={{ color: 'var(--primary-start)' }} />
          <span>EMS Portal</span>
        </div>

        <nav>
          <ul className="sidebar-menu">
            <li>
              <NavLink 
                to="/" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                end
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>

            <li>
              <NavLink 
                to="/profile" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <User size={18} />
                <span>My Profile</span>
              </NavLink>
            </li>
            
            {isPrivileged && (
              <>
                <li>
                  <NavLink 
                    to="/employees" 
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  >
                    <Users size={18} />
                    <span>Employees</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/departments" 
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  >
                    <Building2 size={18} />
                    <span>Departments</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/skills" 
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  >
                    <Layers size={18} />
                    <span>Skills Master</span>
                  </NavLink>
                </li>
              </>
            )}

            <li>
              <NavLink 
                to="/leaves" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <CalendarDays size={18} />
                <span>Leaves Console</span>
              </NavLink>
            </li>

            <li>
              <NavLink 
                to="/assets" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Laptop size={18} />
                <span>Asset Console</span>
              </NavLink>
            </li>

            <li>
              <NavLink 
                to="/attendance" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Clock size={18} />
                <span>Attendance</span>
              </NavLink>
            </li>

            <li>
              <NavLink 
                to="/salaries" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <CreditCard size={18} />
                <span>Payroll</span>
              </NavLink>
            </li>

            <li>
              <NavLink 
                to="/performance" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Award size={18} />
                <span>{['ADMIN', 'HR', 'MANAGER'].includes(user.role) ? 'Performance Reviews' : 'My Reviews'}</span>
              </NavLink>
            </li>

            {isPrivileged && (
              <>
                <li>
                  <NavLink 
                    to="/reports" 
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  >
                    <FileBarChart2 size={18} />
                    <span>Reports Center</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/audit" 
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  >
                    <FileSearch size={18} />
                    <span>Audit Logs</span>
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>

      <div>
        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#fff'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role}</div>
            </div>
          </div>
        </div>

        <ul className="sidebar-menu">
          {user.role === 'ADMIN' && (
            <li>
              <NavLink 
                to="/admin" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <ShieldAlert size={18} />
                <span>Admin Panel</span>
              </NavLink>
            </li>
          )}
          <li>
            <button 
              onClick={handleLogout} 
              className="sidebar-item" 
              style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <LogOut size={18} style={{ color: 'var(--error)' }} />
              <span style={{ color: 'var(--error)' }}>Sign Out</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
