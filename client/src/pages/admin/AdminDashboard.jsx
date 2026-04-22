import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiImage, FiAlertTriangle, FiSlash, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import './Admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const cards = stats ? [
    { label: 'Total Users', value: stats.stats.totalUsers, icon: <FiUsers />, color: '#0095f6' },
    { label: 'Total Posts', value: stats.stats.totalPosts, icon: <FiImage />, color: '#58c322' },
    { label: 'Pending Reports', value: stats.stats.pendingReports, icon: <FiAlertTriangle />, color: '#ffca28' },
    { label: 'Banned Users', value: stats.stats.bannedUsers, icon: <FiSlash />, color: '#ed4956' },
    { label: 'Pending Verifications', value: stats.stats.pendingVerifications, icon: <FiShield />, color: '#8134af' },
  ] : [];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link admin-nav-link--active">Dashboard</Link>
          <Link to="/admin/users" className="admin-nav-link">Users</Link>
          <Link to="/admin/posts" className="admin-nav-link">Posts</Link>
          <Link to="/admin/reports" className="admin-nav-link">Reports</Link>
          <Link to="/admin/verifications" className="admin-nav-link">Verifications</Link>
        </nav>
      </div>

      {loading ? (
        <div className="admin-stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }}></div>
          ))}
        </div>
      ) : (
        <>
          <div className="admin-stats-grid">
            {cards.map((card, i) => (
              <motion.div
                key={card.label}
                className="admin-stat-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="stat-card-icon" style={{ color: card.color }}>
                  {card.icon}
                </div>
                <div className="stat-card-value">{card.value}</div>
                <div className="stat-card-label">{card.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="admin-sections">
            <div className="admin-section glass-card">
              <h2>Recent Users</h2>
              <div className="admin-list">
                {stats?.recentUsers?.map(u => (
                  <div key={u._id} className="admin-list-item">
                    <span className="admin-list-name">{u.username}</span>
                    <span className="admin-list-meta">{u.fullName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-section glass-card">
              <h2>Recent Posts</h2>
              <div className="admin-list">
                {stats?.recentPosts?.map(p => (
                  <div key={p._id} className="admin-list-item">
                    <span className="admin-list-name">{p.user?.username}</span>
                    <span className="admin-list-meta">{p.caption?.substring(0, 50)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
