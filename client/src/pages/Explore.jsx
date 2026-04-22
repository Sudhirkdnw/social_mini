import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import './Explore.css';

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (p = 1) => {
    try {
      const { data } = await api.get(`/posts/explore?page=${p}&limit=18`);
      if (p === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setHasMore(p < data.pagination.pages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="explore-page">
      <h1 className="explore-title">Explore</h1>

      {loading ? (
        <div className="explore-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="skeleton explore-skeleton-item"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="explore-grid">
            {posts.map((post, i) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link to={`/post/${post._id}`} className="explore-item">
                  {post.image ? (
                    <img src={post.image} alt={post.caption} />
                  ) : (
                    <div className="explore-text-post">
                      <p>{post.caption}</p>
                    </div>
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
            <button className="feed-load-more" onClick={() => { setPage(p => p + 1); fetchPosts(page + 1); }}>
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}
