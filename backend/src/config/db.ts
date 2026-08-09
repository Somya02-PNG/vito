import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows DNS SRV lookup (querySrv ECONNREFUSED) with mongodb+srv://
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Fallback to default DNS
}

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vito_db';

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
};
