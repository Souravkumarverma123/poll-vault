import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Fail fast if MongoDB is unreachable (default is 30s which hangs deploys)
      serverSelectionTimeoutMS: 10000,
      // Connection pool size — default is 100 which is fine, but explicit is better
      maxPoolSize: 10,
      // Socket timeout: how long to wait for a response from MongoDB
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
