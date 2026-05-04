import { useState, useEffect, useRef } from 'react';
import useDatingStore from '../store/datingStore';
import useAuthStore from '../store/authStore';
import DatingSetup from '../components/dating/DatingSetup';
import SwipeCard from '../components/dating/SwipeCard';
import MatchModal from '../components/dating/MatchModal';
import DatingMatches from '../components/dating/DatingMatches';
import './Dating.css';

export default function Dating() {
    const { user } = useAuthStore();
    const {
        profile, candidates, fetchMyProfile, fetchDiscovery,
        swipeRight, swipeLeft
    } = useDatingStore();

    const [view, setView] = useState('swipe'); // 'swipe' | 'matches' | 'setup'
    const [matchData, setMatchData] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const init = async () => {
            const p = await fetchMyProfile();
            if (!p) {
                setView('setup');
            } else {
                await fetchDiscovery();
                setView('swipe');
            }
            setIsChecking(false);
        };
        init();
    }, []);

    const handleLike = async () => {
        if (!candidates[currentIndex]) return;
        const target = candidates[currentIndex];
        const result = await swipeRight(target.user._id);
        if (result?.isMatch) {
            setMatchData(target);
        }
        setCurrentIndex(prev => prev + 1);
    };

    const handlePass = async () => {
        if (!candidates[currentIndex]) return;
        const target = candidates[currentIndex];
        await swipeLeft(target.user._id);
        setCurrentIndex(prev => prev + 1);
    };

    const handleSetupComplete = async () => {
        await fetchDiscovery();
        setView('swipe');
        setCurrentIndex(0);
    };

    if (isChecking) {
        return (
            <div className="dating-loader">
                <div className="dating-spinner" />
                <p>Finding your matches...</p>
            </div>
        );
    }

    if (view === 'setup') {
        return <DatingSetup onComplete={handleSetupComplete} />;
    }

    const currentCard = candidates[currentIndex];

    return (
        <div className="dating-page">
            {/* Header */}
            <div className="dating-header">
                <button
                    className={`dating-tab ${view === 'swipe' ? 'active' : ''}`}
                    onClick={() => setView('swipe')}
                >
                    <span>💘</span> Discover
                </button>
                <div className="dating-logo">CampusDate</div>
                <button
                    className={`dating-tab ${view === 'matches' ? 'active' : ''}`}
                    onClick={() => setView('matches')}
                >
                    <span>💬</span> Matches
                </button>
            </div>

            {view === 'swipe' && (
                <div className="dating-swipe-area">
                    {currentCard ? (
                        <>
                            <SwipeCard
                                candidate={currentCard}
                                onLike={handleLike}
                                onPass={handlePass}
                            />
                        </>
                    ) : (
                        <div className="dating-empty">
                            <div className="dating-empty-icon">💔</div>
                            <h3>No more profiles nearby</h3>
                            <p>Check back later for new students!</p>
                            <button className="dating-btn-primary" onClick={fetchDiscovery}>
                                Refresh
                            </button>
                        </div>
                    )}

                    {/* Edit Profile */}
                    <button className="dating-edit-btn" onClick={() => setView('setup')}>
                        ✏️ Edit Profile
                    </button>
                </div>
            )}

            {view === 'matches' && <DatingMatches />}

            {/* Match Modal */}
            {matchData && (
                <MatchModal
                    match={matchData}
                    myUser={user}
                    onClose={() => setMatchData(null)}
                />
            )}
        </div>
    );
}
