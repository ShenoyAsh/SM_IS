import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getMongoConnectionStatus } from '../config/db.js';
import { readData } from '../config/jsonDb.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'supersecretaccesskey123!@#');
    let user;

    if (getMongoConnectionStatus()) {
      user = await User.findById(decoded.id).select('-password');
    } else {
      const data = readData();
      const localUser = data.users.find(u => u.id === decoded.id);
      if (localUser) {
        const { password, ...userWithoutPassword } = localUser;
        user = userWithoutPassword;
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
  }
};
