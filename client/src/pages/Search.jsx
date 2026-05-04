import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch as SearchIcon, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import Avatar from '../components/ui/Avatar';
import './Search.css';

// Explore grid — shown when search is empty
function ExploreGrid() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (p = 1) => {
    try {
      const { data } = await api.get(`/posts/explore?page=${p}&limit=18`);
      if (p === 1) setPosts(data.posts);
      else setPosts(prev => [...prev, ...data.posts]);
      setHasMore(p < data.pagination.pages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  if (loading) {
    return (
      <div className="explore-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton explore-skeleton-item" />
        ))}
      </div>
    );
  }

  return (
    <>
      <p className="search-explore-label">Explore</p>
      <div className="explore-grid">
        {posts.map((post, i) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
          >
            <Link to={`/post/${post._id}`} className="explore-item">
              {post.image ? (
                <img src={post.image} alt={post.caption} />
              ) : (
                <div className="explore-text-post"><p>{post.caption}</p></div>
              )}
              <div className="explore-item-overlay">
                <span>❤️ {post.likes?.length || 0}</span>
                <span>💬 {post.comments?.length || 0}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      {hasMore && (
        <button
          className="feed-load-more"
          onClick={() => { setPage(p => p + 1); fetchPosts(page + 1); }}
        >
          Load more
        </button>
      )}
    </>
  );
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced search — fires 350ms after last keystroke
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(data.users);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const clearQuery = () => { setQuery(''); setResults([]); };

  const isSearching = query.trim().length > 0;

  return (
    <div className="search-page">
      {/* Search bar */}
      <form className="search-bar glass-card" onSubmit={e => e.preventDefault()}>
        <SearchIcon className="search-bar-icon" />
        <input
          id="search-input"
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="search-bar-input"
          autoComplete="off"
        />
        {isSearching && (
          <button type="button" className="search-clear-btn" onClick={clearQuery} aria-label="Clear search">
            <FiX />
          </button>
        )}
      </form>

      {/* Results or Explore */}
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {loading ? (
              <div className="search-results">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12 }} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="search-empty">No users found for "{query}"</div>
            ) : (
              <div className="search-results">
                {results.map(user => (
                  <Link key={user._id} to={`/profile/${user._id}`} className="search-result-item glass-card">
                    <Avatar src={user.avatar} alt={user.username} size={44} />
                    <div>
                      <span className="search-result-username">{user.username}</span>
                      {user.fullName && <span className="search-result-name">{user.fullName}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="explore"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ExploreGrid />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
