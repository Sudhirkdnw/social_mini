import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch as SearchIcon } from 'react-icons/fi';
import api from '../api/axios';
import Avatar from '../components/ui/Avatar';
import './Search.css';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get(`/users/search?q=${query}`);
      setResults(data.users);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <form className="search-bar glass-card" onSubmit={handleSearch}>
        <SearchIcon className="search-bar-icon" />
        <input
          id="search-input"
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-bar-input"
        />
      </form>

      {loading ? (
        <div className="search-results">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8, borderRadius: 12 }}></div>
          ))}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="search-empty">No users found</div>
      ) : (
        <div className="search-results">
          {results.map((user) => (
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
    </div>
  );
}
