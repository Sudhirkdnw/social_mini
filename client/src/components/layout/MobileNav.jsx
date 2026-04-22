import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AiOutlineHome, AiFillHome } from 'react-icons/ai';
import { FiSearch, FiPlusSquare, FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import Avatar from '../ui/Avatar';
import './MobileNav.css';

export default function MobileNav() {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.unreadCount);
      } catch {
        // silent
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { to: '/', icon: <AiOutlineHome />, activeIcon: <AiFillHome /> },
    { to: '/search', icon: <FiSearch />, activeIcon: <FiSearch /> },
    { to: '/create', icon: <FiPlusSquare />, activeIcon: <FiPlusSquare /> },
    { to: '/notifications', icon: <FiHeart />, activeIcon: <FaHeart />, badge: unreadCount },
    { to: `/profile/${user?._id}`, icon: <Avatar src={user?.avatar} alt={user?.username} size={24} />, activeIcon: <Avatar src={user?.avatar} alt={user?.username} size={24} /> },
  ];

  return (
    <nav className="mobile-nav">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-link--active' : ''}`}
          onClick={() => {
            if (link.to === '/notifications') setUnreadCount(0);
          }}
        >
          {({ isActive }) => (
            <span className="mobile-nav-icon">
              {isActive ? link.activeIcon : link.icon}
              {link.badge > 0 && (
                <span className="notif-badge">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              )}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
