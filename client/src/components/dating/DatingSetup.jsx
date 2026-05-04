import { useState, useEffect } from 'react';
import useDatingStore from '../../store/datingStore';
import '../../pages/Dating.css';

const PRESET_INTERESTS = [
    '🎮 Gaming', '🎵 Music', '📚 Reading', '🎬 Movies', '🏋️ Fitness',
    '✈️ Travel', '🍕 Foodie', '🎨 Art', '💻 Tech', '🌿 Nature',
    '📷 Photography', '🧘 Yoga', '🎤 Singing', '⚽ Sports', '🐾 Pets',
    '🎭 Theatre', '🧪 Science', '💃 Dancing', '🏄 Adventure', '☕ Coffee'
];

export default function DatingSetup({ onComplete }) {
    const { profile, saveProfile, isLoading } = useDatingStore();

    const [gender, setGender] = useState(profile?.gender || '');
    const [interestedIn, setInterestedIn] = useState(profile?.interestedIn || '');
    const [interests, setInterests] = useState(profile?.interests || []);
    const [bio, setBio] = useState(profile?.bio || '');
    const [age, setAge] = useState(profile?.age || '');
    const [newInterest, setNewInterest] = useState('');
    const [error, setError] = useState('');

    // Auto-set interestedIn based on gender (like Bumble default)
    useEffect(() => {
        if (!profile?.interestedIn) {
            if (gender === 'male') setInterestedIn('female');
            else if (gender === 'female') setInterestedIn('male');
        }
    }, [gender]);

    const addInterest = () => {
        const val = newInterest.trim();
        if (val && !interests.includes(val) && interests.length < 10) {
            setInterests([...interests, val]);
            setNewInterest('');
        }
    };

    const addPreset = (preset) => {
        if (!interests.includes(preset) && interests.length < 10) {
            setInterests([...interests, preset]);
        }
    };

    const removeInterest = (idx) => {
        setInterests(interests.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!gender) return setError('Please select your gender');
        if (!interestedIn) return setError('Please select who you want to see');
        if (!age || age < 18 || age > 30) return setError('Age must be between 18 and 30');
        if (interests.length < 1) return setError('Add at least 1 interest');

        const result = await saveProfile({ gender, interestedIn, interests, bio, age: Number(age) });
        if (result.success) {
            onComplete();
        } else {
            setError('Failed to save profile. Try again.');
        }
    };

    return (
        <div className="dating-setup">
            <div className="dating-setup-header">
                <div style={{ fontSize: 48, marginBottom: 8 }}>💘</div>
                <h2>Set Up Your Dating Profile</h2>
                <p>Find your campus match — only verified students</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Gender */}
                <div className="dating-form-group">
                    <label>I am a</label>
                    <div className="gender-options">
                        {[
                            { value: 'male', icon: '👦', label: 'Male' },
                            { value: 'female', icon: '👧', label: 'Female' },
                            { value: 'other', icon: '🧑', label: 'Other' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`gender-option ${gender === opt.value ? 'selected' : ''}`}
                                onClick={() => setGender(opt.value)}
                            >
                                <span className="gender-icon">{opt.icon}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interested In */}
                <div className="dating-form-group">
                    <label>Show me</label>
                    <div className="interested-options">
                        {[
                            { value: 'female', icon: '👧', label: 'Girls' },
                            { value: 'male', icon: '👦', label: 'Boys' },
                            { value: 'both', icon: '🧑‍🤝‍🧑', label: 'Everyone' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`interested-option ${interestedIn === opt.value ? 'selected' : ''}`}
                                onClick={() => setInterestedIn(opt.value)}
                            >
                                <span className="gender-icon">{opt.icon}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Age */}
                <div className="dating-form-group">
                    <label>Age</label>
                    <input
                        type="number"
                        className="dating-input"
                        placeholder="Your age (18–30)"
                        value={age}
                        onChange={e => setAge(e.target.value)}
                        min={18}
                        max={30}
                    />
                </div>

                {/* Bio */}
                <div className="dating-form-group">
                    <label>About me</label>
                    <textarea
                        className="dating-textarea"
                        placeholder="Tell something interesting about yourself... (optional)"
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        maxLength={300}
                    />
                </div>

                {/* Interests */}
                <div className="dating-form-group">
                    <label>My Interests ({interests.length}/10)</label>

                    {interests.length > 0 && (
                        <div className="interests-container">
                            {interests.map((interest, i) => (
                                <span key={i} className="interest-tag">
                                    {interest}
                                    <button type="button" onClick={() => removeInterest(i)}>×</button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="interests-input-row">
                        <input
                            type="text"
                            placeholder="Add custom interest..."
                            value={newInterest}
                            onChange={e => setNewInterest(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                        />
                        <button type="button" onClick={addInterest}>+</button>
                    </div>

                    <div className="preset-interests">
                        {PRESET_INTERESTS.map(p => (
                            <button
                                key={p}
                                type="button"
                                className="preset-chip"
                                onClick={() => addPreset(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <p style={{ color: '#ff5252', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="dating-btn-primary"
                    style={{ width: '100%', fontSize: 16, padding: '16px' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : profile ? '✓ Save Changes' : 'Start Dating 💘'}
                </button>
            </form>
        </div>
    );
}
