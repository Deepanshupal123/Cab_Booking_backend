const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (userId, role) =>
  jwt.sign({ id: userId, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

module.exports = { generateToken, verifyToken };
