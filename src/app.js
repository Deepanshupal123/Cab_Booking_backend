const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const env = require("./config/env");
const { corsOrigins } = require("./config/cors");
const { notFound, errorHandler } = require("./middleware/error");
const authRoutes = require("./routes/auth.routes");
const driverRoutes = require("./routes/driver.routes");
const bookingRoutes = require("./routes/booking.routes");
const adminRoutes = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payment.routes");

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins() }));
  app.use(express.json({ limit: "10kb" }));
  app.use(morgan(env.isProd ? "combined" : "dev"));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.isProd ? 300 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later" },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.isProd ? 20 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "GET",
    message: { success: false, message: "Too many auth attempts, please try again later" },
  });

  app.get("/api/health", (_req, res) => {
    const dbState = mongoose.connection.readyState;
    res.json({
      success: true,
      message: "Server is healthy",
      uptime: process.uptime(),
      database: dbState === 1 ? "connected" : "disconnected",
    });
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/payments", paymentRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
