const { verifyToken } = require("../utils/token");
const rooms = require("./rooms");
const logger = require("../utils/logger");

const initSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication token missing"));
      socket.user = verifyToken(token);
      next();
    } catch (_err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.user;
    const room = role === "driver" ? rooms.driver(id) : rooms.customer(id);
    socket.join(room);
    logger.debug(`Socket connected: ${room}`);

    socket.on("disconnect", () => {
      logger.debug(`Socket disconnected: ${room}`);
    });
  });
};

module.exports = initSocket;
