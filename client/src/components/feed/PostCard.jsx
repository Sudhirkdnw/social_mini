import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiSend, FiBookmark, FiMoreHorizontal, FiTrash2, FiEdit2, FiX, FiCheck } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import useToastStore from '../../store/toastStore';
import Avatar from '../ui/Avatar';
import './PostCard.css';

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user: currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showHeart, setShowHeart] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || '');
  const [editTags, setEditTags] = useState(post.tags?.join(', ') || '');
  const [editLocation, setEditLocation] = useState(post.location || '');
  const [editLoading, setEditLoading] = useState(false);
  const [currentCaption, setCurrentCaption] = useState(post.caption || '');
  const [currentTags, setCurrentTags] = useState(post.tags || []);
  const [currentLocation, setCurrentLocation] = useState(post.location || '');

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } catch {
      addToast('Failed to like post', 'error');
    }
  };

  const handleDoubleTap = async () => {
    if (!liked) {
      await handleLike();
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/posts/${post._id}/comment`, { text: commentText });
      setComments(data.comments);
      setCommentText('');
      setShowComments(true);
    } catch {
      addToast('Failed to add comment', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/posts/${post._id}`);
      addToast('Post deleted', 'success');
      onDelete?.(post._id);
    } catch {
      addToast('Failed to delete post', 'error');
    }
  };

  const handleEdit = () => {
    setEditCaption(currentCaption);
    setEditTags(currentTags.join(', '));
    setEditLocation(currentLocation);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    setEditLoading(true);
    try {
      const { data } = await api.put(`/posts/${post._id}`, {
        caption: editCaption,
        tags: editTags,
        location: editLocation,
      });
      setCurrentCaption(data.post.caption || '');
      setCurrentTags(data.post.tags || []);
      setCurrentLocation(data.post.location || '');
      setIsEditing(false);
      addToast('Post updated!', 'success');
      onUpdate?.(data.post);
    } catch {
      addToast('Failed to update post', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const isOwner = currentUser?._id === post.user?._id;

  return (
    <article className="post-card animate-fade-in">
      {/* Header */}
      <div className="post-header">
        <Link to={`/profile/${post.user?._id}`} className="post-user-info">
          <Avatar src={post.user?.avatar} alt={post.user?.username} size={36} />
          <div>
            <span className="post-username">{post.user?.username}</span>
            {currentLocation && !isEditing && <span className="post-location">{currentLocation}</span>}
          </div>
        </Link>
        {isOwner && (
          <div className="post-menu-wrapper">
            {isEditing ? (
              <div className="post-edit-actions">
                <button className="post-edit-action-btn post-edit-action-btn--save" onClick={handleSaveEdit} disabled={editLoading}>
                  <FiCheck /> {editLoading ? 'Saving...' : 'Save'}
                </button>
                <button className="post-edit-action-btn post-edit-action-btn--cancel" onClick={handleCancelEdit}>
                  <FiX /> Cancel
                </button>
              </div>
            ) : (
              <>
                <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}>
                  <FiMoreHorizontal />
                </button>
                {showMenu && (
                  <div className="post-menu-dropdown glass-card">
                    <button className="post-menu-item" onClick={handleEdit}>
                      <FiEdit2 /> Edit
                    </button>
                    <button className="post-menu-item post-menu-item--danger" onClick={handleDelete}>
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <div className="post-image-wrapper" onDoubleClick={handleDoubleTap}>
          <img src={post.image} alt={currentCaption} className="post-image" />
          <AnimatePresence>
            {showHeart && (
              <motion.div
                className="post-heart-burst"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <FaHeart />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <div className="post-actions-left">
          <button className={`post-action-btn ${liked ? 'post-action-btn--liked' : ''}`} onClick={handleLike}>
            {liked ? <FaHeart /> : <FiHeart />}
          </button>
          <button className="post-action-btn" onClick={() => setShowComments(!showComments)}>
            <FiMessageCircle />
          </button>
          <button className="post-action-btn"><FiSend /></button>
        </div>
        <button className="post-action-btn"><FiBookmark /></button>
      </div>

      {/* Likes */}
      <div className="post-likes">{likesCount} {likesCount === 1 ? 'like' : 'likes'}</div>

      {/* Caption — edit mode or display */}
      {isEditing ? (
        <div className="post-edit-form">
          <textarea
            className="post-edit-textarea"
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            placeholder="Edit caption..."
            rows={3}
          />
          <input
            className="post-edit-input"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            placeholder="Tags (comma separated)"
          />
          <input
            className="post-edit-input"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            placeholder="Location"
          />
        </div>
      ) : (
        <>
          {currentCaption && (
            <div className="post-caption">
              <Link to={`/profile/${post.user?._id}`} className="post-caption-user">{post.user?.username}</Link>{' '}
              {currentCaption}
            </div>
          )}

          {currentTags?.length > 0 && (
            <div className="post-tags">
              {currentTags.map((tag, i) => (
                <span key={i} className="post-tag">#{tag}</span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Comments preview */}
      {comments.length > 0 && !showComments && (
        <button className="post-view-comments" onClick={() => setShowComments(true)}>
          View all {comments.length} comments
        </button>
      )}

      {showComments && (
        <div className="post-comments">
          {comments.map((c) => (
            <div key={c._id} className="post-comment">
              <Link to={`/profile/${c.user?._id}`} className="post-comment-user">
                {c.user?.username}
              </Link>{' '}
              <span>{c.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <form className="post-comment-form" onSubmit={handleComment}>
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="post-comment-input"
        />
        {commentText.trim() && (
          <button type="submit" className="post-comment-submit">Post</button>
        )}
      </form>

      {/* Timestamp */}
      <div className="post-time">
        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
      </div>
    </article>
  );
}
