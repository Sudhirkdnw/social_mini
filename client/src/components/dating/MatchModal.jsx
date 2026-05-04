import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Random confetti colors
const CONFETTI_COLORS = ['#ee5a9b', '#ff6b6b', '#ffd700', '#c678dd', '#00e676', '#2979ff'];

function Confetti() {
    const pieces = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 1}s`,
        size: `${6 + Math.random() * 6}px`
    }));

    return (
        <div className="match-modal-confetti" aria-hidden="true">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: p.left,
                        top: '-20px',
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        animationDelay: p.delay
                    }}
                />
            ))}
        </div>
    );
}

export default function MatchModal({ match, myUser, onClose }) {
    const navigate = useNavigate();
    const { user, bio, interests = [] } = match;

    // Auto-close after 8 seconds
    useEffect(() => {
        const t = setTimeout(onClose, 8000);
        return () => clearTimeout(t);
    }, []);

    const handleMessage = () => {
        onClose();
        navigate('/chat');
    };

    const myAvatar = myUser?.avatar;
    const theirAvatar = user?.avatar;
    const theirName = user?.fullName || user?.username || 'Someone';

    return (
        <div className="match-modal-overlay" onClick={onClose}>
            <div className="match-modal" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                <Confetti />

                <div className="match-modal-title">It's a Match! 🎉</div>
                <p className="match-modal-subtitle">
                    You and <strong>{theirName}</strong> liked each other!
                </p>

                {/* Avatars */}
                <div className="match-modal-avatars">
                    {myAvatar ? (
                        <img src={myAvatar} alt="You" className="match-modal-avatar" />
                    ) : (
                        <div className="match-modal-avatar-placeholder">
                            {myUser?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                    <span className="match-heart">💞</span>
                    {theirAvatar ? (
                        <img src={theirAvatar} alt={theirName} className="match-modal-avatar" />
                    ) : (
                        <div className="match-modal-avatar-placeholder">
                            {theirName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {interests.length > 0 && (
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 16 }}>
                        Common vibes: {interests.slice(0, 3).join(', ')}
                    </p>
                )}

                <div className="match-modal-actions">
                    <button className="match-modal-btn-msg" onClick={handleMessage} id="match-send-msg-btn">
                        💬 Send a Message
                    </button>
                    <button className="match-modal-btn-close" onClick={onClose} id="match-keep-swiping-btn">
                        Keep Swiping
                    </button>
                </div>
            </div>
        </div>
    );
}
