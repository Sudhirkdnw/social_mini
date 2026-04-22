import './Avatar.css';

export default function Avatar({ src, alt = '', size = 40, hasStory = false, onClick }) {
  return (
    <div
      className={`avatar-wrapper ${hasStory ? 'avatar-story-ring' : ''}`}
      style={{ width: size + (hasStory ? 6 : 0), height: size + (hasStory ? 6 : 0) }}
      onClick={onClick}
    >
      <div
        className="avatar-img"
        style={{ width: size, height: size }}
      >
        {src ? (
          <img src={src} alt={alt} />
        ) : (
          <div className="avatar-placeholder">
            {alt?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
      </div>
    </div>
  );
}
