import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AiOutlineHome, AiFillHome } from 'react-icons/ai';
import { FiSearch, FiPlusSquare, FiHeart, FiLogOut, FiMessageSquare } from 'react-icons/fi';
import { FaHeart, FaCommentDots } from 'react-icons/fa';
import { MdOutlineExplore, MdExplore } from 'react-icons/md';
import { RiUser3Line, RiUser3Fill, RiAdminLine } from 'react-icons/ri';
import { GiHearts } from 'react-icons/gi';
import useAuthStore from '../../store/authStore';
import useSocketStore from '../../store/socketStore';
import api from '../../api/axios';
import Avatar from '../ui/Avatar';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { socket, unreadMessages, resetUnreadMessages } = useSocketStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);     // notification badge
  const [unreadMsgCount, setUnreadMsgCount] = useState(0); // message badge

  // Poll unread NOTIFICATIONS every 30s
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

  // Poll total unread MESSAGES every 15s by summing all conversations
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const { data } = await api.get('/chat');
        const total = data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadMsgCount(total);
      } catch {
        // silent
      }
    };
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 15000);
    return () => clearInterval(interval);
  }, []);

  // Real-time boost: when socket fires new-message-notification, immediately
  // increment the local badge (polling will correct the exact count shortly)
  useEffect(() => {
    if (!socket) return;
    const handleNotif = () => setUnreadMsgCount(prev => prev + 1);
    socket.on('new-message-notification', handleNotif);
    return () => socket.off('new-message-notification', handleNotif);
  }, [socket]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const links = [
    { to: '/', label: 'Home', icon: <AiOutlineHome />, activeIcon: <AiFillHome /> },
    { to: '/search', label: 'Search', icon: <FiSearch />, activeIcon: <FiSearch /> },
    { to: '/explore', label: 'Explore', icon: <MdOutlineExplore />, activeIcon: <MdExplore /> },
    { to: '/notifications', label: 'Notifications', icon: <FiHeart />, activeIcon: <FaHeart />, badge: unreadCount },
    { to: '/chat', label: 'Messages', icon: <FiMessageSquare />, activeIcon: <FaCommentDots />, badge: unreadMsgCount },
    { to: '/create', label: 'Create', icon: <FiPlusSquare />, activeIcon: <FiPlusSquare /> },
    { to: '/dating', label: 'Dating', icon: <GiHearts />, activeIcon: <GiHearts /> },
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
                if (link.to === '/chat') {
                  setUnreadMsgCount(0);
                  resetUnreadMessages();
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <span className="sidebar-link-icon">
                    {isActive ? link.activeIcon : link.icon}
                    {/* Dot badge on icon — always visible even when sidebar is collapsed */}
                    {link.badge > 0 && (
                      <span className="notif-badge">
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                  </span>
                  <span className="sidebar-link-label">
                    {link.label}
                    {/* Count pill next to label — hidden when sidebar collapses */}
                    {link.badge > 0 && (
                      <span className="sidebar-label-badge">
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                  </span>
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
