import { Router } from "express";
import { TransferStablecoinFactory } from "../factories/transfers/stablecoin.js";
import { TransferStablecoinToGmailFactory } from "../factories/transfers/stablecoin-to-gmail.js";
import { TransferStablecoinToUsernameTwitterFactory } from "../factories/transfers/stablecoin-to-username-twitter.js";
import AuthMiddleware from "../middlewares/auth.js";

const router = Router();
router.use(AuthMiddleware);

router.post("/stablecoin", async (request, response, next) => {
  try {
    const result = await TransferStablecoinFactory().execute({
      id: request.user.id,
      token: request.body.token,
      chain: request.body.chain,
      value: request.body.value,
      to: request.body.to,
    });
    if (result.isRight()) return response.status(201).json(result.value);
    return response.status(400).json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

router.post("/stablecoin-to-gmail", async (request, response, next) => {
  try {
    const result = await TransferStablecoinToGmailFactory().execute({
      id: request.user.id,
      token: request.body.token,
      chain: request.body.chain,
      value: request.body.value,
      to: request.body.to,
    });
    if (result.isRight()) return response.status(201).json(result.value);
    return response.status(400).json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

router.post("/stablecoin-to-twitter", async (request, response, next) => {
  try {
    const result = await TransferStablecoinToUsernameTwitterFactory().execute({
      id: request.user.id,
      token: request.body.token,
      chain: request.body.chain,
      value: request.body.value,
      to: request.body.to,
      channel: "twitter",
    });
    if (result.isRight()) return response.status(201).json(result.value);
    return response.status(400).json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

export default router;
