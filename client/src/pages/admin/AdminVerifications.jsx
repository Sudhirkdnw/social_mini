import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiX, FiExternalLink } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import useToastStore from '../../store/toastStore';
import './Admin.css';

export default function AdminVerifications() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const { data } = await api.get('/admin/verifications');
      setUsers(data.users);
    } catch {
      addToast('Failed to load verifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/verifications/${id}`, { action: 'approve' });
      setUsers(prev => prev.filter(u => u._id !== id));
      addToast('Student verified!', 'success');
    } catch {
      addToast('Action failed', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/verifications/${id}`, {
        action: 'reject',
        reason: rejectReason || undefined
      });
      setUsers(prev => prev.filter(u => u._id !== id));
      setRejectingId(null);
      setRejectReason('');
      addToast('Verification rejected', 'success');
    } catch {
      addToast('Action failed', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Student Verifications</h1>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/users" className="admin-nav-link">Users</Link>
          <Link to="/admin/posts" className="admin-nav-link">Posts</Link>
          <Link to="/admin/reports" className="admin-nav-link">Reports</Link>
          <Link to="/admin/verifications" className="admin-nav-link admin-nav-link--active">Verifications</Link>
        </nav>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {loading ? (
          <div className="skeleton" style={{ height: 200 }}></div>
        ) : users.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            ✅ No pending verifications
          </p>
        ) : (
          <div className="verification-list">
            {users.map((user, i) => (
              <motion.div
                key={user._id}
                className="verification-card glass-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="verification-info">
                  <div className="verification-row">
                    <strong>{user.username}</strong>
                    {user.fullName && <span className="verification-name">({user.fullName})</span>}
                  </div>
                  <div className="verification-row">
                    <span className="verification-label">College:</span>
                    <span>{user.collegeName}</span>
                  </div>
                  {user.collegeEmail && (
                    <div className="verification-row">
                      <span className="verification-label">College Email:</span>
                      <span>{user.collegeEmail}</span>
                    </div>
                  )}
                  <div className="verification-row">
                    <span className="verification-label">Applied:</span>
                    <span>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* ID Card Image */}
                {user.idCardImage && (
                  <div className="verification-id-card">
                    <img
                      src={user.idCardImage}
                      alt="College ID"
                      onClick={() => setViewingImage(user.idCardImage)}
                    />
                    <button
                      className="verification-view-btn"
                      onClick={() => setViewingImage(user.idCardImage)}
                    >
                      <FiExternalLink /> View Full
                    </button>
                  </div>
                )}

                {/* Actions */}
                {rejectingId === user._id ? (
                  <div className="verification-reject-form">
                    <input
                      type="text"
                      placeholder="Rejection reason (optional)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="auth-input"
                    />
                    <div className="verification-reject-actions">
                      <button
                        className="admin-action-btn admin-action-btn--danger"
                        onClick={() => handleReject(user._id)}
                      >
                        Confirm Reject
                      </button>
                      <button
                        className="admin-action-btn admin-action-btn--primary"
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="verification-actions">
                    <button
                      className="verification-approve-btn"
                      onClick={() => handleApprove(user._id)}
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      className="verification-reject-btn"
                      onClick={() => setRejectingId(user._id)}
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Full image modal */}
      {viewingImage && (
        <div className="verification-modal" onClick={() => setViewingImage(null)}>
          <div className="verification-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={viewingImage} alt="ID Card" />
            <button className="verification-modal-close" onClick={() => setViewingImage(null)}>
              <FiX />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
