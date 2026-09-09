const env = require("../config/env");
const ApiError = require("../utils/apiError");
const logger = require("../utils/logger");

const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found - ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists`;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  if (statusCode >= 500) {
    logger.error(message, env.isProd ? undefined : err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: env.isProd ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
