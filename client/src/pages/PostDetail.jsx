import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/feed/PostCard';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/posts/${id}`);
        setPost(data.post);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        <div className="skeleton" style={{ height: 500, borderRadius: 16 }}></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Post not found
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <PostCard post={post} />
    </div>
  );
}
