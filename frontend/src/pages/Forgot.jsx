import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

const Forgot = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResetLink('');

    try {
      const res = await fetch('http://localhost:5001/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Reset link sent successfully!');
        if (data.resetUrl) {
          setResetLink(data.resetUrl);
        }
      } else {
        setError(data.message || 'Failed to request password reset');
      }
    } catch (err) {
      setError('Network error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glow-blob-1"></div>
      <div className="glow-blob-2"></div>

      <div className="glass-card">
        <h1>Forgot Password</h1>
        <p className="subtitle">Enter your email and we'll send you a password reset link</p>

        {success && (
          <div className="alert-banner success" style={{ marginBottom: '20px' }}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {success && resetLink && (
          <div className="dev-reset-card" style={{
            marginTop: '10px',
            marginBottom: '20px',
            padding: '16px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px dashed rgba(59, 130, 246, 0.4)',
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#60a5fa', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}></span>
              Development Helper
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.5' }}>
              Since SMTP is not configured for email sending in this local environment, you can use the generated reset link below to complete your password reset:
            </p>
            <a 
              href={resetLink} 
              className="reset-btn"
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: '500',
                fontSize: '13px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
              }}
            >
              Reset Password Now
            </a>
          </div>
        )}

        {error && (
          <div className="alert-banner error" style={{ marginBottom: '20px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '24px' }}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Requesting...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: '24px' }}>
          <Link to="/login" className="auth-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ArrowLeft size={16} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Forgot;
