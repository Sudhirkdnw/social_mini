import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AiOutlineHome, AiFillHome } from 'react-icons/ai';
import { FiSearch, FiPlusSquare, FiHeart, FiLogOut } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { MdOutlineExplore, MdExplore } from 'react-icons/md';
import { RiUser3Line, RiUser3Fill, RiAdminLine } from 'react-icons/ri';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import Avatar from '../ui/Avatar';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread notifications every 30s
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const links = [
    { to: '/', label: 'Home', icon: <AiOutlineHome />, activeIcon: <AiFillHome /> },
    { to: '/search', label: 'Search', icon: <FiSearch />, activeIcon: <FiSearch /> },
    { to: '/explore', label: 'Explore', icon: <MdOutlineExplore />, activeIcon: <MdExplore /> },
    { to: '/notifications', label: 'Notifications', icon: <FiHeart />, activeIcon: <FaHeart />, badge: unreadCount },
    { to: '/create', label: 'Create', icon: <FiPlusSquare />, activeIcon: <FiPlusSquare /> },
    { to: `/profile/${user?._id}`, label: 'Profile', icon: <RiUser3Line />, activeIcon: <RiUser3Fill /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <NavLink to="/" className="sidebar-logo">
          <span className="gradient-text">FriendZone</span>
        </NavLink>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              onClick={() => {
                if (link.to === '/notifications') setUnreadCount(0);
              }}
            >
              {({ isActive }) => (
                <>
                  <span className="sidebar-link-icon">
                    {isActive ? link.activeIcon : link.icon}
                    {link.badge > 0 && (
                      <span className="notif-badge">
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                  </span>
                  <span className="sidebar-link-label">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
            >
              <span className="sidebar-link-icon"><RiAdminLine /></span>
              <span className="sidebar-link-label">Admin</span>
            </NavLink>
          )}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <Avatar src={user?.avatar} alt={user?.username} size={32} />
          <span className="sidebar-username">{user?.username}</span>
        </div>
        <button className="sidebar-link" onClick={handleLogout} id="logout-btn">
          <span className="sidebar-link-icon"><FiLogOut /></span>
          <span className="sidebar-link-label">Log out</span>
        </button>
      </div>
    </aside>
  );
}
