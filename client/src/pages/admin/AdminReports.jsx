import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';
import useToastStore from '../../store/toastStore';
import './Admin.css';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/admin/reports');
      setReports(data.reports);
    } catch {
      addToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/admin/reports/${id}`, { status: 'resolved' });
      setReports(prev => prev.filter(r => r._id !== id));
      addToast('Report resolved', 'success');
    } catch {
      addToast('Action failed', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Reports</h1>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/users" className="admin-nav-link">Users</Link>
          <Link to="/admin/posts" className="admin-nav-link">Posts</Link>
          <Link to="/admin/reports" className="admin-nav-link admin-nav-link--active">Reports</Link>
        </nav>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {loading ? (
          <div className="skeleton" style={{ height: 200 }}></div>
        ) : reports.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No pending reports</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Target</th>
                  <th>Reason</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report._id}>
                    <td>{report.reporter?.username}</td>
                    <td>{report.reportedUser?.username || report.reportedPost?.caption?.substring(0, 30) || '—'}</td>
                    <td>{report.reason.substring(0, 50)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </td>
                    <td>
                      <button className="admin-action-btn admin-action-btn--primary" onClick={() => handleResolve(report._id)}>
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
