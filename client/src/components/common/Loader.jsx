import './Loader.css';

export default function Loader() {
  return (
    <div className="loader-overlay">
      <div className="loader-spinner">
        <div className="loader-ring"></div>
        <span className="gradient-text loader-brand">FriendZone</span>
      </div>
    </div>
  );
}
