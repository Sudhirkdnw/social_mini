import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiImage, FiX, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../api/axios';
import useToastStore from '../store/toastStore';
import './CreatePost.css';

export default function CreatePost() {
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleAICaption = async () => {
    if (!caption && !tags) return addToast('Type a topic or some tags first', 'info');
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/caption', { prompt: caption || tags });
      setCaption(data.caption);
      addToast('AI caption generated!', 'success');
    } catch {
      addToast('AI service unavailable', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIHashtags = async () => {
    if (!caption) return addToast('Write a caption first', 'info');
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/hashtags', { prompt: caption });
      setTags(data.hashtags);
      addToast('AI hashtags generated!', 'success');
    } catch {
      addToast('AI service unavailable', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption && !image) return addToast('Add a caption or image', 'error');
    setLoading(true);

    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('tags', tags);
    formData.append('location', location);
    if (image) formData.append('image', image);

    try {
      await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Post created!', 'success');
      navigate('/');
    } catch {
      addToast('Failed to create post', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      <motion.div
        className="create-card glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="create-title">Create Post</h1>

        <form onSubmit={handleSubmit} className="create-form">
          {/* Image Upload */}
          <div className="create-image-section">
            {preview ? (
              <div className="create-preview">
                <img src={preview} alt="Preview" />
                <button type="button" className="create-remove-img" onClick={removeImage}>
                  <FiX />
                </button>
              </div>
            ) : (
              <label className="create-upload-area" htmlFor="create-image-input">
                <FiImage className="create-upload-icon" />
                <span>Click to upload an image</span>
                <input
                  id="create-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </label>
            )}
          </div>

          {/* Caption */}
          <div className="create-field">
            <textarea
              id="create-caption"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="create-textarea"
              rows={4}
            />
            <div className="create-ai-btns">
              <button type="button" className="create-ai-btn" onClick={handleAICaption} disabled={aiLoading}>
                <FiZap /> AI Caption
              </button>
              <button type="button" className="create-ai-btn" onClick={handleAIHashtags} disabled={aiLoading}>
                <FiZap /> AI Hashtags
              </button>
            </div>
          </div>

          {/* Tags */}
          <input
            id="create-tags"
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="auth-input"
          />

          {/* Location */}
          <input
            id="create-location"
            type="text"
            placeholder="Add location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="auth-input"
          />

          <button
            id="create-submit"
            type="submit"
            className="auth-btn"
            disabled={loading || (!caption && !image)}
          >
            {loading ? 'Posting...' : 'Share Post'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
