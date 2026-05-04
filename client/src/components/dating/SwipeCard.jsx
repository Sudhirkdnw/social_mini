import { useState, useRef } from 'react';
import Avatar from '../ui/Avatar';

export default function SwipeCard({ candidate, onLike, onPass }) {
    const { user, interests = [], bio = '', age } = candidate;

    const [dragState, setDragState] = useState({ isDragging: false, startX: 0, deltaX: 0 });
    const cardRef = useRef(null);

    // Drag-to-swipe handlers
    const onPointerDown = (e) => {
        setDragState({ isDragging: true, startX: e.clientX, deltaX: 0 });
        cardRef.current?.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!dragState.isDragging) return;
        const deltaX = e.clientX - dragState.startX;
        setDragState(s => ({ ...s, deltaX }));
        if (cardRef.current) {
            const rotate = deltaX * 0.08;
            cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg)`;
            // Show stamps
            const likeStamp = cardRef.current.querySelector('.swipe-card-like-stamp');
            const nopeStamp = cardRef.current.querySelector('.swipe-card-nope-stamp');
            if (likeStamp) likeStamp.style.opacity = Math.min(deltaX / 80, 1).toString();
            if (nopeStamp) nopeStamp.style.opacity = Math.min(-deltaX / 80, 1).toString();
        }
    };

    const onPointerUp = (e) => {
        if (!dragState.isDragging) return;
        const deltaX = e.clientX - dragState.startX;

        if (deltaX > 100) {
            // Swipe right - like
            animateOut('right', onLike);
        } else if (deltaX < -100) {
            // Swipe left - pass
            animateOut('left', onPass);
        } else {
            // Snap back
            if (cardRef.current) {
                cardRef.current.style.transition = 'transform 0.3s ease';
                cardRef.current.style.transform = '';
                const likeStamp = cardRef.current.querySelector('.swipe-card-like-stamp');
                const nopeStamp = cardRef.current.querySelector('.swipe-card-nope-stamp');
                if (likeStamp) likeStamp.style.opacity = '0';
                if (nopeStamp) nopeStamp.style.opacity = '0';
                setTimeout(() => {
                    if (cardRef.current) cardRef.current.style.transition = '';
                }, 300);
            }
        }
        setDragState({ isDragging: false, startX: 0, deltaX: 0 });
    };

    const animateOut = (dir, callback) => {
        if (cardRef.current) {
            const x = dir === 'right' ? 600 : -600;
            const rot = dir === 'right' ? 30 : -30;
            cardRef.current.style.transition = 'transform 0.4s ease';
            cardRef.current.style.transform = `translateX(${x}px) rotate(${rot}deg)`;
            setTimeout(() => callback(), 350);
        }
    };

    const avatar = user?.avatar;
    const displayName = user?.fullName || user?.username || 'Student';

    return (
        <div style={{ width: '100%', maxWidth: 420 }}>
            {/* Card */}
            <div
                ref={cardRef}
                className="swipe-card"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            >
                {/* LIKE / NOPE stamps */}
                <span className="swipe-card-like-stamp">LIKE 💚</span>
                <span className="swipe-card-nope-stamp">NOPE ❌</span>

                {/* Photo */}
                {avatar ? (
                    <img src={avatar} alt={displayName} className="swipe-card-img" />
                ) : (
                    <div className="swipe-card-img-placeholder">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Info overlay */}
                <div className="swipe-card-overlay">
                    <div className="swipe-card-name">
                        {displayName}
                        {age && <span className="swipe-card-age">{age}</span>}
                        {user?.verificationStatus === 'verified' && (
                            <span title="Verified Student" style={{ fontSize: 18 }}>✅</span>
                        )}
                    </div>

                    {user?.collegeName && (
                        <div className="swipe-card-college">
                            🎓 {user.collegeName}
                        </div>
                    )}

                    {bio && <p className="swipe-card-bio">"{bio}"</p>}

                    {interests.length > 0 && (
                        <div className="swipe-card-interests">
                            {interests.slice(0, 4).map((interest, i) => (
                                <span key={i} className="interest-chip">{interest}</span>
                            ))}
                            {interests.length > 4 && (
                                <span className="interest-chip">+{interests.length - 4} more</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="swipe-actions">
                <button
                    className="swipe-btn swipe-btn-pass"
                    onClick={onPass}
                    title="Pass"
                    id="swipe-pass-btn"
                >
                    ✕
                </button>
                <button
                    className="swipe-btn swipe-btn-super"
                    title="Super Like"
                    id="swipe-super-btn"
                >
                    ⭐
                </button>
                <button
                    className="swipe-btn swipe-btn-like"
                    onClick={onLike}
                    title="Like"
                    id="swipe-like-btn"
                >
                    💗
                </button>
            </div>
        </div>
    );
}
