import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Briefcase, 
  ArrowRight, 
  Clock, 
  CreditCard, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Cpu,
  Laptop
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="landing-container">
      {/* Background Blobs */}
      <div className="glow-blob-1"></div>
      <div className="glow-blob-2"></div>
      
      {/* Top Navbar */}
      <header className="landing-header">
        <div className="portal-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Briefcase size={26} style={{ color: 'var(--primary-start)' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>EMS Portal</span>
        </div>
        
        <nav className="landing-nav">
          <a href="#features" className="nav-link">Features</a>
          <a href="#stats" className="nav-link">Analytics</a>
          <a href="#technology" className="nav-link">Platform</a>
        </nav>

        <div className="landing-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary landing-btn" style={{ textDecoration: 'none' }}>
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-link" style={{ marginRight: '16px' }}>Sign In</Link>
              <Link to="/signup" className="btn-primary landing-btn" style={{ textDecoration: 'none' }}>
                <span>Get Started</span>
                <ChevronRight size={16} />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Cpu size={14} />
            <span>Next-Gen Enterprise workforce Hub</span>
          </div>
          <h1>
            The Smart Way to <br />
            <span className="gradient-text">Manage Your Team</span>
          </h1>
          <p className="hero-subtitle">
            An all-in-one glassmorphic employee hub facilitating real-time attendance logging, interactive smart payroll calculation, granular asset allocation, and audit security analytics.
          </p>
          
          <div className="hero-buttons">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary hero-btn-main">
                <span>Access Workspace</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn-primary hero-btn-main">
                  <span>Start Free Onboarding</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary hero-btn-sub">
                  <span>Employee Login</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero Interactive Widget */}
        <div className="hero-visual">
          <div className="glass-card visual-widget">
            <div className="widget-header">
              <div className="dot red"></div>
              <div className="dot yellow"></div>
              <div className="dot green"></div>
              <span className="widget-title">EMS LIVE TERMINAL</span>
            </div>
            
            <div className="widget-body">
              {/* Stat Row */}
              <div className="widget-stat-grid">
                <div className="stat-pill">
                  <span className="label">SYS STATUS</span>
                  <span className="val success">ONLINE</span>
                </div>
                <div className="stat-pill">
                  <span className="label">PAYROLL ACCURACY</span>
                  <span className="val gradient-text">99.9%</span>
                </div>
              </div>

              {/* Attendance Mock Card */}
              <div className="mini-widget-card">
                <div className="mini-card-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  <Clock size={20} />
                </div>
                <div className="mini-card-info">
                  <div className="mini-card-title">Attendance Console</div>
                  <div className="mini-card-desc">Segmented SVG Donut & Late Check-in Rules</div>
                </div>
                <div className="mini-card-action">
                  <span className="badge-teal">Active</span>
                </div>
              </div>

              {/* Payroll Mock Card */}
              <div className="mini-widget-card">
                <div className="mini-card-icon" style={{ background: 'rgba(142, 68, 173, 0.15)', color: 'var(--primary-start)' }}>
                  <CreditCard size={20} />
                </div>
                <div className="mini-card-info">
                  <div className="mini-card-title">smHRt Payroll</div>
                  <div className="mini-card-desc">Automatic PF, ESIC & TDS Calculation</div>
                </div>
                <div className="mini-card-action">
                  <span className="badge-purple">Smart</span>
                </div>
              </div>

              {/* Assets Mock Card */}
              <div className="mini-widget-card">
                <div className="mini-card-icon" style={{ background: 'rgba(230, 126, 34, 0.15)', color: 'hsl(30, 90%, 55%)' }}>
                  <Laptop size={20} />
                </div>
                <div className="mini-card-info">
                  <div className="mini-card-title">Asset Console</div>
                  <div className="mini-card-desc">Hardware Allocation & Stored Procedures</div>
                </div>
                <div className="mini-card-action">
                  <span className="badge-orange">Secure</span>
                </div>
              </div>

              {/* Live activity feed ticker */}
              <div className="live-feed">
                <div className="feed-item">
                  <span className="bullet"></span>
                  <span>System Admin initialized core databases</span>
                </div>
                <div className="feed-item">
                  <span className="bullet"></span>
                  <span>Database views and functions verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features">
        <h2 className="section-title">Core Modules Built for Scale</h2>
        <p className="section-subtitle">Fully integrated administrative components running on PostgreSQL database views</p>
        
        <div className="features-grid">
          <div className="feature-card glass-card">
            <div className="icon-box purple">
              <Clock size={24} />
            </div>
            <h3>Smart Attendance tracking</h3>
            <p>One-tap attendance. Triggers custom late-reason dialogs after 09:30 AM. Supervised SVG donut chart visually displays metrics.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="icon-box green">
              <CreditCard size={24} />
            </div>
            <h3>smHRt Payroll</h3>
            <p>One-click payroll run that consolidates attendance and calculates ESIC, PF, and TDS. Instant employee statements and notifications.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="icon-box orange">
              <Users size={24} />
            </div>
            <h3>Granular Directories</h3>
            <p>Admin, HR, Manager, and Employee directory control. Real-time department additions, skill mappings, and profile updates.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="icon-box blue">
              <Laptop size={24} />
            </div>
            <h3>Asset Administration</h3>
            <p>Allocate hardware assets using PostgreSQL stored procedures. Enforces availability rules and records active allocation logs.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="landing-stats">
        <div className="glass-card stats-wrapper">
          <div className="stat-box">
            <div className="stat-num">500ms</div>
            <div className="stat-label">API Check-in Time</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">100%</div>
            <div className="stat-label">PostgreSQL View Integrity</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">0</div>
            <div className="stat-label">Paper Processes Required</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">1-Click</div>
            <div className="stat-label">Payroll Computations</div>
          </div>
        </div>
      </section>

      {/* Tech Stack section */}
      <section id="technology" className="landing-tech">
        <h2 className="section-title">Robust Engineering Foundations</h2>
        <div className="tech-pills">
          <span className="tech-pill">React 18</span>
          <span className="tech-pill">Vite</span>
          <span className="tech-pill">Node.js</span>
          <span className="tech-pill">Express</span>
          <span className="tech-pill">Prisma ORM</span>
          <span className="tech-pill">PostgreSQL</span>
          <span className="tech-pill">Docker</span>
          <span className="tech-pill">Vercel Edge</span>
          <span className="tech-pill">Render Cloud</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>&copy; {new Date().getFullYear()} EMS Enterprise Portal. All rights reserved.</div>
        <div className="footer-links">
          <a href="https://github.com/soninancy080-spec/employee-management-system" target="_blank" rel="noreferrer" className="footer-link">GitHub Repository</a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
