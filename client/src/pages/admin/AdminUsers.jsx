import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import useToastStore from '../../store/toastStore';
import './Admin.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch {
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (id) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/ban`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isBanned: data.isBanned } : u));
      addToast(data.message, 'success');
    } catch {
      addToast('Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user and all their posts?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      addToast('User deleted', 'success');
    } catch {
      addToast('Failed to delete user', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">User Management</h1>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/users" className="admin-nav-link admin-nav-link--active">Users</Link>
          <Link to="/admin/posts" className="admin-nav-link">Posts</Link>
          <Link to="/admin/reports" className="admin-nav-link">Reports</Link>
        </nav>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {loading ? (
          <div className="skeleton" style={{ height: 300 }}></div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.email || '—'}</td>
                    <td>
                      <span className={`admin-badge ${user.role === 'admin' ? 'admin-badge--admin' : 'admin-badge--active'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${user.isBanned ? 'admin-badge--banned' : 'admin-badge--active'}`}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button className="admin-action-btn admin-action-btn--primary" onClick={() => handleBan(user._id)}>
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(user._id)}>
                        Delete
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
