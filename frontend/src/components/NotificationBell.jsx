import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Bell, Check, Clock } from 'lucide-react';

const NotificationBell = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/v1/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:5001/api/v1/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '40px',
      zIndex: 1000,
    }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-main)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: 'var(--primary-gradient)',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px var(--primary-start)',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '55px',
          right: '0',
          width: '320px',
          background: 'rgba(20, 20, 30, 0.95)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--primary-start)',
                fontWeight: 500,
              }}>
                {unreadCount} unread
              </span>
            )}
          </div>

          <div style={{
            maxHeight: '280px',
            overflowY: 'auto',
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: n.isRead ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    position: 'relative',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ 
                      fontWeight: n.isRead ? 500 : 600, 
                      fontSize: '0.8rem',
                      color: n.isRead ? 'var(--text-main)' : 'var(--primary-start)', 
                    }}>
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <button 
                        onClick={(e) => handleMarkRead(n.id, e)}
                        title="Mark as Read"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 4px',
                          color: 'var(--primary-start)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.3',
                    textAlign: 'left',
                  }}>
                    {n.message}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                  }}>
                    <Clock size={10} />
                    <span>{formatDate(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
