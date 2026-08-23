import mongoose from 'mongoose';

let isConnected = false; // track the connection

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'carlight',
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.log('MongoDB connection error:', error);
  }
};

// Default export so both `import connectDB from '@/utils/database'`
// and `import { connectToDB } from '@/utils/database'` work.
const connectDB = connectToDB;
export default connectDB;
