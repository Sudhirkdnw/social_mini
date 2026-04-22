import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import useToastStore from '../../store/toastStore';
import './Admin.css';

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/admin/posts');
      setPosts(data.posts);
    } catch {
      addToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (id) => {
    try {
      const { data } = await api.put(`/admin/posts/${id}/hide`);
      setPosts(prev => prev.map(p => p._id === id ? { ...p, isHidden: data.isHidden } : p));
      addToast(data.message, 'success');
    } catch {
      addToast('Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts(prev => prev.filter(p => p._id !== id));
      addToast('Post deleted', 'success');
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Post Management</h1>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/users" className="admin-nav-link">Users</Link>
          <Link to="/admin/posts" className="admin-nav-link admin-nav-link--active">Posts</Link>
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
                  <th>Author</th>
                  <th>Caption</th>
                  <th>Likes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post._id}>
                    <td>{post.user?.username}</td>
                    <td>{post.caption?.substring(0, 60) || '—'}</td>
                    <td>{post.likes?.length || 0}</td>
                    <td>
                      <span className={`admin-badge ${post.isHidden ? 'admin-badge--banned' : 'admin-badge--active'}`}>
                        {post.isHidden ? 'Hidden' : 'Visible'}
                      </span>
                    </td>
                    <td>
                      <button className="admin-action-btn admin-action-btn--primary" onClick={() => handleHide(post._id)}>
                        {post.isHidden ? 'Show' : 'Hide'}
                      </button>
                      <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(post._id)}>
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
