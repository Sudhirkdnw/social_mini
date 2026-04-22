import { NavLink } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import './TopBar.css';

export default function TopBar() {
  return (
    <header className="topbar">
      <NavLink to="/" className="topbar-logo">
        <span className="gradient-text">FriendZone</span>
      </NavLink>
      <NavLink to="/notifications" className="topbar-action">
        <FiHeart />
      </NavLink>
    </header>
  );
}
