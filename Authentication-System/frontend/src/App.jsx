import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, LogOut, User, Shield, Key, Eye, EyeOff, Terminal, Clock, RefreshCw } from 'lucide-react';

// API Base URL
const API_URL = 'http://localhost:5000/api/auth';

// Create Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Main Auth Provider
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  // Helper to add visual logs
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ id: Math.random().toString(), timestamp, message, type }, ...prev]);
  };

  // Initialize: Fetch profile if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (accessToken) {
        addLog('Initial access token found in localStorage. Verifying...', 'info');
        const success = await fetchProfile(accessToken);
        if (!success) {
          addLog('Access token invalid/expired. Attempting refresh token...', 'warning');
          await handleTokenRefresh();
        }
      } else {
        addLog('No active session found. Please login or register.', 'info');
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Fetch user profile with a given token
  const fetchProfile = async (token) => {
    try {
      addLog('GET /profile - Fetching user details...', 'api');
      const res = await fetch(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        addLog('GET /profile - 200 OK. Session authorized.', 'success');
        return true;
      }
      addLog(`GET /profile - ${res.status} Unauthorized.`, 'error');
      return false;
    } catch (err) {
      addLog('Connection error fetching profile.', 'error');
      return false;
    }
  };

  // Silent refresh token flow
  const handleTokenRefresh = async () => {
    const tokenToUse = refreshToken || localStorage.getItem('refreshToken');
    if (!tokenToUse) {
      addLog('No refresh token available. User must log in.', 'error');
      logout();
      return false;
    }

    try {
      addLog('POST /refresh - Requesting new access token...', 'api');
      const res = await fetch(`${API_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokenToUse })
      });
      const data = await res.json();
      if (data.success) {
        setAccessToken(data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        addLog('POST /refresh - 200 OK. Generated new short-lived Access Token.', 'success');
        await fetchProfile(data.accessToken);
        return true;
      } else {
        addLog('POST /refresh - 403 Forbidden. Refresh token invalid/expired.', 'error');
        logout();
        return false;
      }
    } catch (err) {
      addLog('Connection error during token refresh.', 'error');
      logout();
      return false;
    }
  };

  // Wrapped fetch that automatically handles 401s by refreshing token
  const authenticatedRequest = async (url, options = {}) => {
    let currentToken = accessToken || localStorage.getItem('accessToken');
    if (!currentToken) {
      addLog('Attempted auth request without access token.', 'error');
      throw new Error('No access token available');
    }

    // Set auth header
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`
    };

    try {
      let res = await fetch(url, options);
      
      // If 401 (Unauthorized / Expired Access Token)
      if (res.status === 401) {
        addLog('API returned 401 Unauthorized (Access Token expired). Intercepting request...', 'warning');
        
        // Attempt refresh
        const refreshSuccessful = await handleTokenRefresh();
        
        if (refreshSuccessful) {
          addLog('Token refreshed. Retrying original API call...', 'info');
          // Update headers with new token
          const newToken = localStorage.getItem('accessToken');
          options.headers['Authorization'] = `Bearer ${newToken}`;
          // Retry request
          res = await fetch(url, options);
          addLog('Retried request succeeded.', 'success');
          return res;
        } else {
          addLog('Token refresh failed. Redirecting to login.', 'error');
          throw new Error('Session expired');
        }
      }

      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Login action
  const login = async (email, password) => {
    try {
      addLog(`POST /login - Authenticating user: ${email}`, 'api');
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        addLog('POST /login - 200 OK. Credentials verified.', 'success');
        addLog('Access Token & Refresh Token saved securely.', 'info');
        return { success: true };
      } else {
        addLog(`POST /login - 401 Unauthorized: ${data.message}`, 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      addLog('Login connection failed.', 'error');
      return { success: false, message: 'Server connection error' };
    }
  };

  // Signup action
  const signup = async (name, email, password) => {
    try {
      addLog('POST /signup - Registering new account...', 'api');
      const res = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        addLog('POST /signup - 201 Created. Account database entry generated.', 'success');
        return { success: true };
      } else {
        addLog(`POST /signup - 400 Bad Request: ${data.message}`, 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      addLog('Signup connection failed.', 'error');
      return { success: false, message: 'Server connection error' };
    }
  };

  // Update profile details
  const updateProfile = async (profileData) => {
    try {
      addLog('PUT /profile - Updating user details...', 'api');
      const res = await authenticatedRequest(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        addLog('PUT /profile - 200 OK. Database fields updated.', 'success');
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      addLog('Update profile connection failed.', 'error');
      return { success: false, message: 'Server connection error' };
    }
  };

  // Logout action
  const logout = async () => {
    if (accessToken) {
      try {
        addLog('POST /logout - Invalidating refresh tokens...', 'api');
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });
      } catch (err) {
        // Silent catch
      }
    }
    
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    addLog('User logged out. Session variables deleted.', 'info');
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    loading,
    logs,
    addLog,
    login,
    signup,
    logout,
    updateProfile,
    handleTokenRefresh
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <RefreshCw style={{ animation: 'spin 1.5s linear infinite', color: '#6366f1' }} />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Nav Header
function Nav() {
  const { user, logout } = useAuth();
  return (
    <nav className="nav">
      <div className="nav-brand">
        <Shield className="nav-brand-logo" />
        <span>SecureAuth</span>
      </div>
      {user && (
        <div className="nav-user">
          <img src={user.avatar} alt={user.name} className="user-avatar-sm" />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{user.name}</span>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '6px 12px', width: 'auto', display: 'flex', gap: '4px' }}>
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}

// Login Page
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Invalid credentials');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Shield size={32} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Login to access your secure profile dashboard</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-container">
              <input
                type="email"
                required
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <User className="input-icon" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Key className="input-icon" />
              <button
                type="button"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}

// Signup Page
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
      navigate('/dashboard');
    } else {
      setError(res.message || 'Signup failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="auth-logo">
            <UserPlus size={32} />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Register to explore the token refresh mechanism</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-container">
              <input
                type="text"
                required
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <User className="input-icon" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-container">
              <input
                type="email"
                required
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <User className="input-icon" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <input
                type="password"
                required
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Key className="input-icon" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// Dashboard Page
function DashboardPage() {
  const { user, logs, updateProfile, handleTokenRefresh, addLog } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [password, setPassword] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Sync state if user loads late
  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio);
      setAvatar(user.avatar);
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');
    setUpdating(true);

    const data = { name, bio, avatar };
    if (password) data.password = password;

    const res = await updateProfile(data);
    setUpdating(false);

    if (res.success) {
      setFormSuccess('Profile details updated successfully!');
      setPassword('');
    } else {
      setFormError(res.message || 'Failed to update profile');
    }
  };

  // Simulate token expiry & refresh
  const triggerManualRefresh = async () => {
    setSimulating(true);
    addLog('Manual refresh triggered. Invalidating active access token...', 'warning');
    const res = await handleTokenRefresh();
    setSimulating(false);
    if (res) {
      setFormSuccess('Access token refreshed manually via background refresh token!');
    } else {
      setFormError('Failed to refresh token. Session expired.');
    }
  };

  const avatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80'
  ];

  return (
    <div className="app-layout animate-fade-in">
      <Nav />
      <main className="main-content">
        <div className="dashboard-grid">
          {/* Left Column - Profile Summary */}
          <div>
            <div className="profile-card glass-card" style={{ marginBottom: '24px' }}>
              <div className="profile-avatar-container">
                <img src={user?.avatar} alt={user?.name} className="profile-avatar" />
              </div>
              <h2 className="profile-name">{user?.name}</h2>
              <p className="profile-email">{user?.email}</p>
              <div className="profile-bio">{user?.bio}</div>
              
              <button 
                onClick={triggerManualRefresh} 
                disabled={simulating}
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', gap: '8px', justifyContent: 'center' }}
              >
                <RefreshCw size={16} className={simulating ? 'spin-icon' : ''} style={{ animation: simulating ? 'spin 1s linear infinite' : 'none' }} />
                <span>Force Token Refresh</span>
              </button>
            </div>

            {/* Behind the Scenes Console Log */}
            <div className="logs-card glass-card">
              <h3 className="section-title">
                <Terminal size={18} style={{ color: '#818cf8' }} />
                <span>Security logs console</span>
              </h3>
              
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {logs.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No logs recorded yet.</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} style={{ display: 'flex', gap: '8px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                      <span style={{ color: '#64748b', fontFamily: 'monospace' }}>[{log.timestamp}]</span>
                      <span style={{ 
                        color: log.type === 'success' ? '#4ade80' : 
                               log.type === 'error' ? '#f87171' : 
                               log.type === 'warning' ? '#fbbf24' : 
                               log.type === 'api' ? '#38bdf8' : '#e2e8f0' 
                      }}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Profile Management Forms */}
          <div className="edit-profile-card glass-card">
            <h3 className="section-title">
              <User size={20} style={{ color: '#818cf8' }} />
              <span>Profile Management Dashboard</span>
            </h3>

            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
            {formError && <div className="alert alert-danger">{formError}</div>}

            <form onSubmit={handleUpdate}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Select Profile Avatar</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  {avatars.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Avatar ${idx + 1}`}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: avatar === url ? '3px solid #6366f1' : '2px solid transparent',
                        padding: '2px',
                        transition: 'all 0.2s ease',
                        objectFit: 'cover'
                      }}
                      onClick={() => setAvatar(url)}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: '16px' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio Description</label>
                <textarea
                  className="form-input"
                  style={{ paddingLeft: '16px', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label className="form-label">Change Password (leave empty to keep current)</label>
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '16px' }}
                  placeholder="New password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={updating}>
                {updating ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Main App Container
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
