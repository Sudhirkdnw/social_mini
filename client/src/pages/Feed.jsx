import { useState, useEffect } from 'react';
import api from '../api/axios';
import PostCard from '../components/feed/PostCard';
import StoryBar from '../components/feed/StoryBar';
import useToastStore from '../store/toastStore';
import './Feed.css';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { addToast } = useToastStore();

  const fetchPosts = async (p = 1) => {
    try {
      const { data } = await api.get(`/posts/feed?page=${p}&limit=10`);
      if (p === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setHasMore(p < data.pagination.pages);
    } catch {
      addToast('Failed to load feed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  };

  return (
    <div className="feed-page">
      <div className="feed-container">
        <StoryBar />

        {loading ? (
          <div className="feed-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 400, marginBottom: 20, borderRadius: 16 }}></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty glass-card">
            <h2>Welcome to FriendZone!</h2>
            <p>Follow people to see their posts in your feed, or create your first post.</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handleDelete} />
            ))}
            {hasMore && (
              <button className="feed-load-more" onClick={loadMore}>
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
