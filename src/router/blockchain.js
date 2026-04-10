import { Router } from "express";
import { CreateErc20Factory } from "../factory/blockchain/create-erc20.js";
import { TransferStablecoinFactory } from "../factory/blockchain/transfer-stablecoin.js";
import { httpStatusFromErrorType } from "../shared/http-status.js";
import AuthMiddleware from "../middleware/auth.js";

const router = Router();
router.use(AuthMiddleware);

router.post("/create-token", async (request, response, next) => {
  try {
    const result = await CreateErc20Factory().execute({
      id: request.user.id,
      name: request.body.name,
      symbol: request.body.symbol,
      supply: request.body.supply,
    });
    if (result.isRight()) return response.status(201).json(result.value);
    return response
      .status(400)
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

router.post("/transfer-stablecoin", async (request, response, next) => {
  try {
    const result = await TransferStablecoinFactory().execute({
      id: request.user.id,
      token: request.body.token,
      chain: request.body.chain,
      value: request.body.value,
      to: request.body.to,
    });
    if (result.isRight()) return response.status(201).json(result.value);
    return response
      .status(400)
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

export default router;