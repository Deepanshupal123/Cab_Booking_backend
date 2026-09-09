const dotenv = require("dotenv");

dotenv.config();

const REQUIRED = ["MONGO_URI", "JWT_SECRET"];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "*",
  driverSearchRadiusM: Number(process.env.DRIVER_SEARCH_RADIUS_M) || 5000,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  isProd: process.env.NODE_ENV === "production",
};

module.exports = env;
