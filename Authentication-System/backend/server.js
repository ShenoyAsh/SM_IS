import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

// Create express app
const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);

// Base route to check API status
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication System API is running successfully.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Start Server after attempting database connection
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Authentication Server running on port ${PORT}`);
  });
};

startServer();
