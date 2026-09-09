const http = require("http");
const { Server } = require("socket.io");
const createApp = require("./app");
const env = require("./config/env");
const { corsOrigins } = require("./config/cors");
const { connectDB } = require("./config/db");
const initSocket = require("./socket");
const logger = require("./utils/logger");

const start = async () => {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: corsOrigins(),
      methods: ["GET", "POST", "PATCH"],
    },
  });
  initSocket(io);
  app.set("io", io);

  server.listen(env.port, "0.0.0.0", () => {
    logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      const mongoose = require("mongoose");
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
