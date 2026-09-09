const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

const connectDB = async () => {
  const conn = await mongoose.connect(env.mongoUri);
  logger.info(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

const disconnectDB = async () => {
  await mongoose.connection.close();
};

module.exports = { connectDB, disconnectDB };
