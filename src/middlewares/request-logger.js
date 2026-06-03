import morgan from "morgan";
import logger from "../libraries/logger.js";

const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "test";
};

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream, skip },
);

export default morganMiddleware;
