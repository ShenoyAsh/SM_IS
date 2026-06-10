import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, ArrowLeft, Send, Trash2, Edit, Plus, LogOut, LogIn, UserPlus, Eye, Clock, MessageSquare, Tag, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('blog_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
          } else {
            // Token expired/invalid
            logout();
          }
        } catch (err) {
          console.error('Auth verification error', err);
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('blog_token', data.token);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const signup = async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('blog_token', data.token);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('blog_token');
  };

  const value = { user, token, loading, login, signup, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Protected Route helper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Navbar
function Navigation() {
  const { user, logout } = useAuth();
  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        <BookOpen className="logo-icon" />
        <span>InkFlow</span>
      </Link>
      <div className="nav-menu">
        <Link to="/" className="nav-link">Explore</Link>
        {user ? (
          <>
            <Link to="/create" className="btn btn-primary" style={{ padding: '8px 16px', display: 'flex', gap: '4px' }}>
              <Plus size={16} />
              <span>Write Post</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
              <img src={user.avatar} alt={user.name} className="author-avatar" style={{ border: '2px solid #f43f5e' }} />
              <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px' }}>Sign In</Link>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '8px 16px' }}>Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

// Home / Feed View
function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page')) || 1;

  // Tag list (static list of popular tags for presentation)
  const popularTags = ['tech', 'design', 'lifestyle', 'productivity', 'coding', 'webdev'];

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/posts?page=${page}&limit=6`;
      if (searchQuery) url += `&search=${searchQuery}`;
      if (selectedTag) url += `&tag=${selectedTag}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages
        });
      }
    } catch (err) {
      console.error('Fetch posts error', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [page, searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ page: 1, search: searchQuery, tag: selectedTag });
  };

  const handleTagClick = (tag) => {
    const newTag = selectedTag === tag ? '' : tag;
    setSelectedTag(newTag);
    setSearchParams({ page: 1, search: searchQuery, tag: newTag });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setSearchParams({ page: newPage, search: searchQuery, tag: selectedTag });
    }
  };

  return (
    <div className="animate-fade">
      {/* Hero Header */}
      <header style={{ textAlign: 'center', margin: '40px 0 60px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '16px', background: 'linear-gradient(135deg, #fff 40%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Publish Your Passion
        </h1>
        <p style={{ fontSize: '16px', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto' }}>
          Discover insightful stories, technical tutorials, and creative thoughts from developers worldwide.
        </p>
      </header>

      {/* Search & Tags */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '40px' }}>
        <form onSubmit={handleSearchSubmit} className="search-bar" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search articles by title or content keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Search
          </button>
        </form>

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 600 }}>Filter by Tag:</span>
          <div className="tag-list">
            {popularTags.map(tag => (
              <button
                key={tag}
                className={`tag-badge ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Post Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#a1a1aa' }}>Loading posts feed...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.06)' }}>
          <AlertCircle size={36} style={{ color: '#f43f5e', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>No articles found</h3>
          <p style={{ fontSize: '14px', color: '#71717a' }}>Try refining your search terms or choosing a different tag.</p>
        </div>
      ) : (
        <>
          <div className="posts-grid">
            {posts.map(post => (
              <article key={post.id || post._id} className="post-card glass-card animate-slide">
                <div className="post-meta">
                  <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {post.readTime}
                  </span>
                </div>
                
                <Link to={`/post/${post.id || post._id}`}>
                  <h2 className="post-title">{post.title}</h2>
                </Link>
                <p className="post-summary">{post.summary}</p>
                
                <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {post.tags && post.tags.map(t => (
                    <span key={t} style={{ fontSize: '11px', color: '#f43f5e', background: 'rgba(244,63,94,0.08)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="post-footer">
                  <div className="author-info">
                    <img src={post.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'} alt={post.authorName} className="author-avatar" />
                    <div>
                      <div className="author-name">{post.authorName}</div>
                    </div>
                  </div>
                  <Link to={`/post/${post.id || post._id}`} style={{ color: '#f43f5e', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Read</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                style={{ padding: '8px 16px' }}
              >
                <ArrowLeft size={16} />
              </button>
              <span className="page-num">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                style={{ padding: '8px 16px' }}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Single Article View (with Comments)
function PostDetailsPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState('');

  const fetchPostAndComments = async () => {
    setLoading(true);
    try {
      // Fetch Post details
      const postRes = await fetch(`${API_BASE}/posts/${id}`);
      const postData = await postRes.json();
      if (postData.success) {
        setPost(postData.post);
      } else {
        navigate('/');
      }

      // Fetch Comments
      const commentsRes = await fetch(`${API_BASE}/posts/${id}/comments`);
      const commentsData = await commentsRes.json();
      if (commentsData.success) {
        setComments(commentsData.comments);
      }
    } catch (err) {
      console.error('Fetch post details error', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setSubmittingComment(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentContent })
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => [data.comment, ...prev]);
        setCommentContent('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection failed adding comment.');
    }
    setSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const res = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => prev.filter(c => c.id !== commentId && c._id !== commentId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this article?')) return;

    try {
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading article details...</div>;
  if (!post) return null;

  const isAuthor = user && (user.id === post.author || user._id === post.author);

  return (
    <div className="post-view animate-fade">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#a1a1aa', fontSize: '14px', marginBottom: '24px' }}>
        <ArrowLeft size={16} />
        <span>Back to Articles</span>
      </Link>

      <article>
        <header className="post-header">
          <h1 className="post-view-title">{post.title}</h1>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="author-info">
              <img src={post.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'} alt={post.authorName} className="author-avatar" style={{ width: '40px', height: '40px' }} />
              <div>
                <div className="author-name" style={{ fontSize: '14px' }}>{post.authorName}</div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>
                  {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} • {post.readTime}
                </div>
              </div>
            </div>

            {isAuthor && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to={`/edit/${post.id || post._id}`} className="btn btn-secondary" style={{ padding: '8px 14px', display: 'flex', gap: '4px' }}>
                  <Edit size={14} />
                  <span>Edit</span>
                </Link>
                <button onClick={handleDeletePost} className="btn btn-danger" style={{ padding: '8px 14px', display: 'flex', gap: '4px' }}>
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="post-view-content">{post.content}</div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {post.tags && post.tags.map(t => (
            <span key={t} className="tag-badge">#{t}</span>
          ))}
        </div>
      </article>

      {/* Comments Section */}
      <section className="comments-section">
        <h3 className="section-title">
          <MessageSquare size={18} style={{ color: '#f43f5e' }} />
          <span>Comments ({comments.length})</span>
        </h3>

        {/* Comment Form */}
        {token ? (
          <form onSubmit={handleCommentSubmit} className="comment-form">
            {error && <div className="alert alert-danger">{error}</div>}
            <textarea
              className="comment-input"
              placeholder="Join the discussion... write a constructive comment."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows="3"
            />
            <button type="submit" className="btn btn-primary" disabled={submittingComment} style={{ display: 'flex', gap: '8px' }}>
              <Send size={14} />
              <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </form>
        ) : (
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '12px' }}>You must be registered to leave comments.</p>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '6px 16px' }}>Login</Link>
          </div>
        )}

        {/* Comments List */}
        <div>
          {comments.length === 0 ? (
            <p style={{ color: '#71717a', textAlign: 'center', padding: '20px' }}>No comments yet. Be the first to share your thoughts!</p>
          ) : (
            comments.map(comment => {
              const isCommentAuthor = user && (user.id === comment.author || user._id === comment.author);
              const isPostOwner = user && (user.id === post.author || user._id === post.author);
              
              return (
                <div key={comment.id || comment._id} className="comment-card glass-card">
                  <img src={comment.authorAvatar} alt={comment.authorName} className="author-avatar" />
                  <div style={{ flexGrow: 1 }}>
                    <div className="comment-header">
                      <div>
                        <span className="author-name" style={{ fontSize: '13px', marginRight: '8px' }}>{comment.authorName}</span>
                        <span style={{ fontSize: '11px', color: '#71717a' }}>
                          {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      
                      {(isCommentAuthor || isPostOwner) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id || comment._id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignSelf: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="comment-content">{comment.content}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

// Write Article Page
function CreatePostPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !summary || !content) return;

    setSubmitting(true);
    setError('');

    // Parse comma-separated tags
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

    try {
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, summary, content, tags })
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/post/${data.post.id || data.post._id}`);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection failed publishing post.');
    }
    setSubmitting(false);
  };

  return (
    <div className="post-form-card glass-card animate-fade">
      <h2 className="section-title" style={{ fontSize: '24px' }}>Write a New Article</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Article Title</label>
          <input
            type="text"
            required
            className="form-input-text"
            placeholder="Give your article an engaging title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Short Summary</label>
          <input
            type="text"
            required
            className="form-input-text"
            placeholder="Briefly describe what this article covers (shows up in feed cards)"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tags (comma-separated)</label>
          <input
            type="text"
            className="form-input-text"
            placeholder="tech, webdev, javascript"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Body Content</label>
          <textarea
            required
            className="comment-input"
            style={{ minHeight: '300px' }}
            placeholder="Write the full content of your post here... Support simple formatting spacing."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish Article'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Edit Article Page
function EditPostPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_BASE}/posts/${id}`);
        const data = await res.json();
        if (data.success) {
          // Check ownership check
          if (user && (user.id !== data.post.author && user._id !== data.post.author)) {
            navigate('/');
            return;
          }
          setTitle(data.post.title);
          setSummary(data.post.summary);
          setContent(data.post.content);
          setTagsInput(data.post.tags ? data.post.tags.join(', ') : '');
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    if (user) fetchPost();
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !summary || !content) return;

    setSubmitting(true);
    setError('');

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

    try {
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, summary, content, tags })
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/post/${id}`);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection failed updating post.');
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading article values...</div>;

  return (
    <div className="post-form-card glass-card animate-fade">
      <h2 className="section-title" style={{ fontSize: '24px' }}>Edit Article</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Article Title</label>
          <input
            type="text"
            required
            className="form-input-text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Short Summary</label>
          <input
            type="text"
            required
            className="form-input-text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tags (comma-separated)</label>
          <input
            type="text"
            className="form-input-text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Body Content</label>
          <textarea
            required
            className="comment-input"
            style={{ minHeight: '300px' }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/post/${id}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Login Blogger
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate(-1); // Go back to where they were, or home
    } else {
      setError(res.message || 'Invalid credentials');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '24px' }}>
      <div className="glass-card" style={{ width: '100%', maxLength: '100%', maxWidth: '440px', padding: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>Sign In</h2>
        <p style={{ fontSize: '13px', color: '#a1a1aa', textAlign: 'center', marginBottom: '32px' }}>Enter credentials to publish articles and post comments</p>
        
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required className="form-input-text" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">Password</label>
            <input type="password" required className="form-input-text" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#a1a1aa' }}>
          New to InkFlow? <Link to="/signup" style={{ color: '#f43f5e', fontWeight: 600 }}>Create account</Link>
        </p>
      </div>
    </div>
  );
}

// Signup Blogger
function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signup(name, email, password);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || 'Signup failed');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '24px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>Create Account</h2>
        <p style={{ fontSize: '13px', color: '#a1a1aa', textAlign: 'center', marginBottom: '32px' }}>Join InkFlow to write creative blog posts and comment</p>
        
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" required className="form-input-text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required className="form-input-text" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">Password</label>
            <input type="password" required className="form-input-text" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#a1a1aa' }}>
          Already registered? <Link to="/login" style={{ color: '#f43f5e', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

// App Layout Wrapper
function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <main className="container">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/post/:id" element={<PostDetailsPage />} />
          <Route path="/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
