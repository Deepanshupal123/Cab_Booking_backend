const dotenv = require("dotenv");

dotenv.config();

const REQUIRED = ["MONGO_URI", "JWT_SECRET"];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length && process.env.NODE_ENV !== "test") {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/cab-booking-test",
  jwtSecret: process.env.JWT_SECRET || "test-secret-do-not-use-in-prod",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "*",
  driverSearchRadiusM: Number(process.env.DRIVER_SEARCH_RADIUS_M) || 5000,
  isProd: process.env.NODE_ENV === "production",
};

module.exports = env;
