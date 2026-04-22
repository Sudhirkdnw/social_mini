import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import Avatar from '../components/ui/Avatar';
import './EditProfile.css';

export default function EditProfile() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    isPrivate: user?.isPrivate || false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await api.put('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar: data.user.avatar });
      addToast('Avatar updated!', 'success');
    } catch {
      addToast('Failed to update avatar', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/edit', form);
      updateUser(data.user);
      addToast('Profile updated!', 'success');
      navigate(`/profile/${user._id}`);
    } catch {
      addToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-page">
      <motion.div
        className="edit-card glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="edit-title">Edit Profile</h1>

        <div className="edit-avatar-section">
          <Avatar src={user?.avatar} alt={user?.username} size={80} />
          <label className="edit-avatar-btn" htmlFor="avatar-upload">
            Change Photo
            <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
          </label>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="edit-field">
            <label>Username</label>
            <input name="username" value={form.username} onChange={handleChange} className="auth-input" />
          </div>
          <div className="edit-field">
            <label>Full Name</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} className="auth-input" />
          </div>
          <div className="edit-field">
            <label>Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className="create-textarea"
              rows={3}
              maxLength={150}
            />
            <span className="edit-char-count">{form.bio.length}/150</span>
          </div>
          <div className="edit-field edit-checkbox-field">
            <input type="checkbox" name="isPrivate" checked={form.isPrivate} onChange={handleChange} id="private-toggle" />
            <label htmlFor="private-toggle">Private Account</label>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
