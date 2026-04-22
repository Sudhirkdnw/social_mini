import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Avatar from '../ui/Avatar';
import './StoryBar.css';

export default function StoryBar() {
  const [storyGroups, setStoryGroups] = useState([]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data } = await api.get('/stories/feed');
        setStoryGroups(data.storyGroups || []);
      } catch {
        // silently fail
      }
    };
    fetchStories();
  }, []);

  if (storyGroups.length === 0) return null;

  return (
    <div className="story-bar glass-card">
      <div className="story-bar-scroll">
        {storyGroups.map((group) => (
          <div key={group.user._id} className="story-item">
            <Avatar
              src={group.user.avatar}
              alt={group.user.username}
              size={60}
              hasStory={true}
            />
            <span className="story-username">{group.user.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
