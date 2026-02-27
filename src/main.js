import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node"
import { auth } from "./lib/auth.js";
import { constants } from "./shared/constant.js";
import Database from "./database/client.js";
import requestLogger from "./middleware/request-logger.js";
import errorHandler from "./middleware/error-handler.js";
import notFoundHandler from "./middleware/not-found.js";
import { corsOptions, securityMiddleware, apiRateLimiter } from "./middleware/security.js";
import userRouter from "./router/user.js";
import { startTwitterService } from "./twitter.js";

const app = express();
const database = new Database();

app.set("trust proxy", 1);
app.use(requestLogger);
app.use(securityMiddleware);
app.use(cors(corsOptions));
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json());
app.use(apiRateLimiter);
app.use("/api/user", userRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(constants.PORT).once("listening", async () => {
  try {
    await database.connect()
    startTwitterService();
    console.log(`Server running on port ${constants.PORT}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
});

function gracefulShutdown(event) {
  return (code) => {
    console.log(`${event} received! with ${code}`);
    server.close(async () => {
      console.log("http server closed");
      await database.close()
      console.log("DB connection closed");
      process.exit(code);
    })
  }
}

process.on("SIGINT", gracefulShutdown("SIGINT"));
process.on("SIGTERM", gracefulShutdown("SIGTERM"));
