import mongoose from 'mongoose';
import dns from 'dns';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Fix for Windows DNS SRV lookup (querySrv ECONNREFUSED) with mongodb+srv://
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Fallback to default DNS
}

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI;

  if (uri && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ MongoDB Atlas connected successfully');
      return true;
    } catch (err: any) {
      console.warn('⚠️ MongoDB Atlas connection failed, falling back to In-Memory MongoDB:', err.message);
    }
  }

  // Attempt local MongoDB with a short timeout
  try {
    const localUri = uri || 'mongodb://127.0.0.1:27017/vito_db';
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Local MongoDB connected successfully');
    return true;
  } catch (localErr) {
    console.log('⚡ Local MongoDB unavailable. Starting embedded In-Memory MongoDB Server...');
    try {
      mongod = await MongoMemoryServer.create();
      const inMemoryUri = mongod.getUri();
      await mongoose.connect(inMemoryUri);
      console.log('✅ In-Memory MongoDB connected successfully at:', inMemoryUri);
      return true;
    } catch (memErr: any) {
      console.error('❌ Failed to start In-Memory MongoDB:', memErr);
      return false;
    }
  }
};
