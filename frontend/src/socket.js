import { io } from "socket.io-client";
import { apiUrl } from "./api";

export const connectSocket = (token) =>
  io(apiUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
