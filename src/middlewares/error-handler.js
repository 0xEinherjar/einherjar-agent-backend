import logger from "../libraries/logger.js";

export default function errorHandler(error, request, response, _) {
  logger.error("Error occurred", {
    error: error.message,
    stack: error.stack,
    path: request.path,
    method: request.method,
    ip: request.ip,
  });

  const statusCode = error.status || 500;
  return response.status(statusCode).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
}
