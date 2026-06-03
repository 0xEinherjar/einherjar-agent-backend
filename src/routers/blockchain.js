import { Router } from "express";
import { CreateErc20Factory } from "../factories/blockchain/create-erc20.js";
import AuthMiddleware from "../middlewares/auth.js";

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
    return response.status(400).json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

export default router;
