import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { getMongoConnectionStatus } from '../config/db.js';
import { readData, writeData } from '../config/jsonDb.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_ACCESS_SECRET || 'supersecretaccesskey123!@#',
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '1h' }
  );
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  }

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const user = await User.create({ name, email, password });
      const token = generateToken(user._id.toString());

      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000 // 1 hour
      });

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    } else {
      const data = readData();
      const userExists = data.users.find(u => u.email === email);
      if (userExists) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const userId = 'user_' + Math.random().toString(36).substr(2, 9);

      const newUser = {
        id: userId,
        name,
        email,
        password: hashedPassword,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*1000000)}?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`,
        createdAt: new Date().toISOString()
      };

      data.users.push(newUser);
      writeData(data);

      const token = generateToken(userId);

      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000 // 1 hour
      });

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar
        }
      });
    }
  } catch (error) {
    console.error('Blogger signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user._id.toString());

      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000 // 1 hour
      });

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    } else {
      const data = readData();
      const user = data.users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user.id);

      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000 // 1 hour
      });

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    }
  } catch (error) {
    console.error('Blogger login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

export const logout = async (req, res) => {
  res.clearCookie('accessToken');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
