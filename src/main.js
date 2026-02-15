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
import { corsOptions, securityMiddleware, apiRateLimiter, authRateLimiter } from "./middleware/security.js";
import userRouter from "./router/user.js";
import { startTwitterService } from "./twitter.js";

const app = express();
const database = new Database();

app.use(requestLogger);
// app.use(securityMiddleware);
app.use(cors(corsOptions));
app.all("/api/auth/{*any}", authRateLimiter, toNodeHandler(auth));
app.use(express.json());
app.use(apiRateLimiter);
app.use("/api/user", userRouter);
app.use(notFoundHandler);
app.use(errorHandler);

let server;

async function startServer() {
  try {
    await database.connect();
    console.log("DB connection established");

    server = app.listen(constants.PORT, () => {
      console.log(`Server running on port ${constants.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

function gracefulShutdown(event) {
  return (code) => {
    console.log(`${event} received! with ${code}`);
    if (server) {
      server.close(async () => {
        console.log("http server closed");
        await database.close();
        console.log("DB connection closed");
        process.exit(code);
      });
    } else {
      process.exit(code);
    }
  }
}

process.on("SIGINT", gracefulShutdown("SIGINT"));
process.on("SIGTERM", gracefulShutdown("SIGTERM"));
