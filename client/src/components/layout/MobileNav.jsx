import { NavLink } from 'react-router-dom';
import { AiOutlineHome, AiFillHome } from 'react-icons/ai';
import { FiSearch, FiPlusSquare, FiMessageSquare } from 'react-icons/fi';
import { FaCommentDots } from 'react-icons/fa';
import { GiHearts } from 'react-icons/gi';
import useAuthStore from '../../store/authStore';
import useSocketStore from '../../store/socketStore';
import Avatar from '../ui/Avatar';
import './MobileNav.css';

export default function MobileNav() {
  const { user } = useAuthStore();
  const { unreadMessages, resetUnreadMessages } = useSocketStore();

  // 5 icons: Home, Search, Create, Messages, Dating, Profile
  const links = [
    { to: '/', icon: <AiOutlineHome />, activeIcon: <AiFillHome /> },
    { to: '/search', icon: <FiSearch />, activeIcon: <FiSearch /> },
    { to: '/create', icon: <FiPlusSquare />, activeIcon: <FiPlusSquare /> },
    { to: '/chat', icon: <FiMessageSquare />, activeIcon: <FaCommentDots />, badge: unreadMessages },
    { to: '/dating', icon: <GiHearts />, activeIcon: <GiHearts /> },
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
            if (link.to === '/chat') resetUnreadMessages();
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
