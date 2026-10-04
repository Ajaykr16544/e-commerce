const mongoose = require('mongoose');

const sanitizeConnectionError = (message) =>
  message.replace(/(mongodb(?:\+srv)?:\/\/)[^@\s]+@/gi, '$1[redacted]@');

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI?.trim() || 'mongodb://127.0.0.1:27017/shopnest';
  const serverSelectionTimeoutMS = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 10000;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS,
      maxPoolSize: 10,
    });
    console.log(
      `[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );
    return conn;
  } catch (error) {
    console.error(
      `[Database] MongoDB connection failed: ${sanitizeConnectionError(error.message)}`
    );
    throw new Error('Unable to connect to MongoDB. Check MONGODB_URI and confirm the database server is running.', {
      cause: error,
    });
  }
};

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = { connectDatabase, disconnectDatabase };
