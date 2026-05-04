import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDatingStore from '../../store/datingStore';
import api from '../../api/axios';

export default function DatingMatches() {
    const { matches, fetchMatches, unmatch, isLoading } = useDatingStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchMatches();
    }, []);

    // Open DM with matched user and navigate directly to that conversation
    const handleMessage = async (userId) => {
        try {
            const { data: conversation } = await api.post(`/chat/dm/${userId}`);
            // Navigate to /chat and pass the conversation so it auto-opens
            navigate('/chat', { state: { openConversation: conversation } });
        } catch (err) {
            console.error('Failed to open DM:', err);
            navigate('/chat');
        }
    };

    if (isLoading) {
        return (
            <div className="dating-loader">
                <div className="dating-spinner" />
            </div>
        );
    }

    return (
        <div className="dating-matches">
            <div className="dating-matches-title">
                💞 Your Matches
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary, #888)' }}>
                    ({matches.length})
                </span>
            </div>

            <div className="matches-grid">
                {matches.length === 0 ? (
                    <div className="matches-empty">
                        <div className="matches-empty-icon">🌸</div>
                        <p>No matches yet.<br />Start swiping to find your match!</p>
                    </div>
                ) : (
                    matches.map(({ user, interests = [], bio, age }) => {
                        const displayName = user?.fullName || user?.username || 'Student';
                        const avatar = user?.avatar;

                        return (
                            <div key={user._id} className="match-card">
                                {avatar ? (
                                    <img src={avatar} alt={displayName} className="match-card-img" />
                                ) : (
                                    <div className="match-card-avatar-placeholder">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                <div className="match-card-info">
                                    <div className="match-card-name">
                                        {displayName}
                                        {age && (
                                            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-secondary, #888)' }}>
                                                {' '}· {age}
                                            </span>
                                        )}
                                        {user?.verificationStatus === 'verified' && ' ✅'}
                                    </div>
                                    {user?.collegeName && (
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary, #888)', marginTop: 2 }}>
                                            🎓 {user.collegeName}
                                        </div>
                                    )}
                                    {interests.length > 0 && (
                                        <div className="match-card-interests">
                                            {interests.slice(0, 3).map((interest, i) => (
                                                <span key={i} className="match-interest">• {interest}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="match-card-actions">
                                    <button
                                        className="match-msg-btn"
                                        onClick={() => handleMessage(user._id)}
                                        id={`match-msg-${user._id}`}
                                    >
                                        💬 Message
                                    </button>
                                    <button
                                        className="match-unmatch-btn"
                                        onClick={() => unmatch(user._id)}
                                        id={`match-unmatch-${user._id}`}
                                        title="Unmatch"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
