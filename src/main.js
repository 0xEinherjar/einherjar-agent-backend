import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import fetch from "node-fetch";
import { MongoDatabase } from "./database/mongodb.js";
import { auth } from "./libraries/auth.js";
import errorHandler from "./middlewares/error-handler.js";
import notFoundHandler from "./middlewares/not-found.js";
import requestLogger from "./middlewares/request-logger.js";
import {
  apiRateLimiter,
  corsOptions,
  securityMiddleware,
} from "./middlewares/security.js";
import blockchainRouter from "./routers/blockchain.js";
import contactRouter from "./routers/contact.js";
import metricRouter from "./routers/metric.js";
import transferRouter from "./routers/transfer.js";
import userRouter from "./routers/user.js";
import { constants } from "./shared/constant.js";
import { startTwitterService } from "./twitter.js";

const app = express();
const database = new MongoDatabase();

app.set("trust proxy", 1);
app.use(requestLogger);
app.use(securityMiddleware);
app.use(cors(corsOptions));
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json());
app.use(apiRateLimiter);
app.use("/api/user", userRouter);
app.use("/api/blockchain", blockchainRouter);
app.use("/api/stats", metricRouter);
app.use("/api/transfer", transferRouter);
app.use("/api/contact", contactRouter);

app.post("/api/avatar-token", async (_, response) => {
  const token = await fetch("https://api.liveavatar.com/v1/sessions/token", {
    method: "POST",
    headers: {
      "X-API-KEY": "d653e154-1a9c-11f1-a99e-066a7fa2e369",
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      mode: "FULL",
      is_sandbox: true,
      avatar_id: "dd73ea75-1218-4ef3-92ce-606d5f7fbc0a",
      avatar_persona: {
        language: "en",
      },
    }),
  });
  const tokenJson = await token.json();
  return response.status(200).json({ token: tokenJson.data.session_token });
});

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(constants.PORT).once("listening", async () => {
  try {
    await database.connect();
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
      await database.close();
      console.log("DB connection closed");
      process.exit(code);
    });
  };
}

process.on("SIGINT", gracefulShutdown("SIGINT"));
process.on("SIGTERM", gracefulShutdown("SIGTERM"));
