import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { getMongoConnectionStatus } from '../config/db.js';
import { readData, writeData } from '../config/jsonDb.js';

// Helper to generate tokens
const generateTokens = (id) => {
  const accessToken = jwt.sign(
    { id },
    process.env.JWT_ACCESS_SECRET || 'supersecretaccesskey123!@#',
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
  );

  const refreshToken = jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey456!@#',
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );

  return { accessToken, refreshToken };
};

// Set token cookies helper
const setCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 mins
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      // Check if user exists in MongoDB
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      // Create user
      const user = await User.create({ name, email, password });
      const { accessToken, refreshToken } = generateTokens(user._id.toString());

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      setCookies(res, accessToken, refreshToken);

      return res.status(201).json({
        success: true,
        message: 'Signup successful!',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    } else {
      // JSON File DB fallback
      const data = readData();
      const userExists = data.users.find(u => u.email === email);
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      // Hash password manually
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = 'local_' + Math.random().toString(36).substr(2, 9);
      const { accessToken, refreshToken } = generateTokens(userId);

      const newUser = {
        id: userId,
        name,
        email,
        password: hashedPassword,
        bio: 'Hello! I am a new user on this local platform.',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        refreshToken,
        createdAt: new Date().toISOString()
      };

      data.users.push(newUser);
      writeData(data);

      setCookies(res, accessToken, refreshToken);

      return res.status(201).json({
        success: true,
        message: 'Signup successful (Local database)!',
        accessToken,
        refreshToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          bio: newUser.bio,
          avatar: newUser.avatar,
          createdAt: newUser.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      // Find user and select password field explicitly
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const { accessToken, refreshToken } = generateTokens(user._id.toString());
      user.refreshToken = refreshToken;
      await user.save();

      setCookies(res, accessToken, refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    } else {
      // JSON File DB fallback
      const data = readData();
      const user = data.users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const { accessToken, refreshToken } = generateTokens(user.id);
      user.refreshToken = refreshToken;
      writeData(data);

      setCookies(res, accessToken, refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Login successful (Local database)!',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res) => {
  let refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey456!@#');
    const isMongo = getMongoConnectionStatus();

    let user;

    if (isMongo) {
      user = await User.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
      }

      const tokens = generateTokens(user._id.toString());
      user.refreshToken = tokens.refreshToken;
      await user.save();

      setCookies(res, tokens.accessToken, tokens.refreshToken);

      return res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } else {
      const data = readData();
      const userIndex = data.users.findIndex(u => u.id === decoded.id);
      if (userIndex === -1 || data.users[userIndex].refreshToken !== refreshToken) {
        return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
      }

      user = data.users[userIndex];
      const tokens = generateTokens(user.id);
      user.refreshToken = tokens.refreshToken;
      writeData(data);

      setCookies(res, tokens.accessToken, tokens.refreshToken);

      return res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(403).json({ success: false, message: 'Refresh token is invalid or expired' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  // User is attached to req in middleware
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

// @desc    Update profile details
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const { name, bio, avatar, password } = req.body;
  const userId = req.user.id || req.user._id.toString();

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (name) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (avatar) user.avatar = avatar;
      if (password) user.password = password; // Pre-save hook will hash it

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    } else {
      const data = readData();
      const userIndex = data.users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = data.users[userIndex];
      if (name) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (avatar) user.avatar = avatar;

      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }

      writeData(data);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error during profile update' });
  }
};

// @desc    Logout user / clear cookies
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  const userId = req.user.id || req.user._id.toString();

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      const user = await User.findById(userId);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    } else {
      const data = readData();
      const user = data.users.find(u => u.id === userId);
      if (user) {
        user.refreshToken = null;
        writeData(data);
      }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};
