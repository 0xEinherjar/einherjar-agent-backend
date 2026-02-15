import { Router } from "express";
import { LoadUserFactory } from "../factory/user/load.js";
import { WithdrawFactory } from "../factory/user/withdraw.js";
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

export default router;