import { Router } from "express";
import { LoadUserFactory } from "../factory/user/load.js";
import { WithdrawFactory } from "../factory/user/withdraw.js";
import { AgentChatFactory } from "../factory/user/agent-chat.js";
import { FaucetFactory } from "../factory/user/faucet.js";
import { httpStatusFromErrorType } from "../shared/http-status.js";
import AuthMiddleware from "../middleware/auth.js";

const router = Router();
router.use(AuthMiddleware);

router.get('/', async (request, response, next) => {
  try {
    const result = await LoadUserFactory().execute({ userId: request.user.id });
    if (result.isRight()) return response.status(200).json(
      Object.assign(result.value, {
        avatar: request.user.image,
        name: request.user.name,
      })
    );
    return response
      .status(httpStatusFromErrorType(result.value.type))
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

router.post('/withdraw', async (request, response, next) => {
  try {    
    const result = await WithdrawFactory().execute(Object.assign({ id: request.user.id }, request.body ));
    if (result.isRight()) return response.status(201).json(result.value);
    return response
      .status(httpStatusFromErrorType(result.value.type))
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

router.post('/chat', async (request, response, next) => {
  try {
    const result = await AgentChatFactory().execute({
      userId: request.user.id,
      message: request.body.message,
    });
    if (result.isRight()) return response.status(200).json(result.value);
    return response
      .status(httpStatusFromErrorType(result.value.type))
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

router.post('/faucet', async (request, response, next) => {
  try {
    const result = await FaucetFactory().execute({ id: request.user.id });
    if (result.isRight()) return response.status(200).json(result.value);
    return response
      .status(httpStatusFromErrorType(result.value.type))
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

export default router;