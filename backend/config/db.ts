import mongoose from 'mongoose';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI environment variable is not set');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

      // Connection event listeners for production monitoring
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected — Mongoose will auto-reconnect');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });

      return; // Success — exit retry loop
    } catch (error: any) {
      console.error(`❌ MongoDB Connection Error (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);

      if (attempt < MAX_RETRIES) {
        console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        console.error('❌ All MongoDB connection attempts failed');
        process.exit(1);
      }
    }
  }
};

export default connectDB;
