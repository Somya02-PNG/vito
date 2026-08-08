import mongoose from 'mongoose';

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vito_db';

  try {
    // Attempt MongoDB connection (with short timeout so server starts even without active Mongo daemon)
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('✅ MongoDB connected successfully to:', uri);
    return true;
  } catch (error: any) {
    console.warn('⚠️ MongoDB Connection Notice:', error.message || error);
    console.warn('ℹ️ Backend will continue running in standalone mode for API & health check routes.');
    return false;
  }
};
