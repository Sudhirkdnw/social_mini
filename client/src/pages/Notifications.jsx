import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import api from '../api/axios';
import Avatar from '../components/ui/Avatar';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.notifications);
        // Mark all as read
        await api.put('/notifications/read-all');
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'mention': return '📢';
      default: return '🔔';
    }
  };

  return (
    <div className="notif-page">
      <h1 className="notif-title">Notifications</h1>

      {loading ? (
        <div className="notif-skeleton">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 12 }}></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="notif-empty glass-card">
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((n, i) => (
            <motion.div
              key={n._id}
              className={`notif-item glass-card ${!n.isRead ? 'notif-item--unread' : ''}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={`/profile/${n.sender?._id}`} className="notif-avatar">
                <Avatar src={n.sender?.avatar} alt={n.sender?.username} size={44} />
              </Link>
              <div className="notif-content">
                <p>
                  <span className="notif-icon">{getIcon(n.type)}</span>
                  <Link to={`/profile/${n.sender?._id}`} className="notif-user">{n.sender?.username}</Link>{' '}
                  {n.message?.replace(n.sender?.username, '').trim()}
                </p>
                <span className="notif-time">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </div>
              {n.post?.image && (
                <Link to={`/post/${n.post._id}`} className="notif-post-img">
                  <img src={n.post.image} alt="" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
