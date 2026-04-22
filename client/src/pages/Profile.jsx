import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiGrid, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import Avatar from '../components/ui/Avatar';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwn = currentUser?._id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/posts/user/${id}`)
        ]);
        setProfile(profileRes.data.user);
        setPosts(postsRes.data.posts);
        setIsFollowing(profileRes.data.user.followers?.some(f => f._id === currentUser?._id));
      } catch {
        addToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const { data } = await api.post(`/users/${id}/follow`);
      setIsFollowing(data.isFollowing);
      // Update follower count locally
      setProfile(prev => ({
        ...prev,
        followers: data.isFollowing
          ? [...prev.followers, currentUser]
          : prev.followers.filter(f => f._id !== currentUser._id)
      }));
    } catch {
      addToast('Failed to follow', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-header-skeleton">
          <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%' }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 12 }}></div>
            <div className="skeleton" style={{ width: 300, height: 16 }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="profile-page">
      <motion.div
        className="profile-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="profile-avatar-section">
          <Avatar src={profile.avatar} alt={profile.username} size={120} />
        </div>

        <div className="profile-info">
          <div className="profile-top-row">
            <h1 className="profile-username">{profile.username}</h1>
            {isOwn ? (
              <Link to="/profile/edit" className="profile-edit-btn">
                <FiSettings /> Edit Profile
              </Link>
            ) : (
              <button
                className={`profile-follow-btn ${isFollowing ? 'profile-follow-btn--following' : ''}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-num">{posts.length}</span> posts
            </div>
            <div className="profile-stat">
              <span className="profile-stat-num">{profile.followers?.length || 0}</span> followers
            </div>
            <div className="profile-stat">
              <span className="profile-stat-num">{profile.following?.length || 0}</span> following
            </div>
          </div>

          <div className="profile-bio-section">
            {profile.fullName && <span className="profile-fullname">{profile.fullName}</span>}
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          </div>
        </div>
      </motion.div>

      {/* Post Grid */}
      <div className="profile-tabs">
        <button className="profile-tab profile-tab--active">
          <FiGrid /> Posts
        </button>
      </div>

      <div className="profile-grid">
        {posts.length === 0 ? (
          <div className="profile-no-posts">
            <p>No posts yet</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/post/${post._id}`} className="profile-grid-item">
                {post.image ? (
                  <img src={post.image} alt={post.caption} />
                ) : (
                  <div className="profile-grid-text">
                    <p>{post.caption}</p>
                  </div>
                )}
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
