import mongoose from 'mongoose';

let isMongoConnected = false;

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blogging_platform_db', {
      serverSelectionTimeoutMS: 3000
    });
    isMongoConnected = true;
    console.log('=== DATABASE STATUS ===');
    console.log('✅ MongoDB connected successfully.');
    console.log('=======================');
  } catch (error) {
    console.log('=== DATABASE STATUS ===');
    console.log('⚠️ MongoDB connection failed or not running.');
    console.log('📂 Falling back to local JSON database storage (backend/data/db.json).');
    console.log('=======================');
    isMongoConnected = false;
  }
};

export const getMongoConnectionStatus = () => isMongoConnected;
