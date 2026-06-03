import { Router } from "express";
import { DeletePaymentContactFactory } from "../factories/contact/delete.js";
import { LoadPaymentContactsFactory } from "../factories/contact/load.js";
import { SavePaymentContactFactory } from "../factories/contact/save.js";
import { UpdatePaymentContactFactory } from "../factories/contact/update.js";
import AuthMiddleware from "../middlewares/auth.js";
import { httpStatusFromErrorType } from "../shared/http-status.js";

const router = Router();
router.use(AuthMiddleware);

router.get("/", async (request, response, next) => {
  try {
    const result = await LoadPaymentContactsFactory().execute({
      userId: request.user.id,
    });
    if (result.isRight()) return response.status(200).json(result.value);
    return response
      .status(httpStatusFromErrorType(result.value.type))
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const result = await SavePaymentContactFactory().execute({
      userId: request.user.id,
      label: request.body.label,
      address: request.body.address,
      chainPreference: request.body.chainPreference,
    });
    if (result.isRight()) return response.status(201).json(result.value);
    return response
      .status(httpStatusFromErrorType(result.value.type))
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (request, response, next) => {
  try {
    const result = await UpdatePaymentContactFactory().execute({
      userId: request.user.id,
      id: request.params.id,
      label: request.body.label,
      address: request.body.address,
      chainPreference: request.body.chainPreference,
    });
    if (result.isRight()) return response.status(200).json(result.value);
    return response
      .status(httpStatusFromErrorType(result.value.type))
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (request, response, next) => {
  try {
    const result = await DeletePaymentContactFactory().execute({
      userId: request.user.id,
      id: request.params.id,
    });
    if (result.isRight()) return response.status(200).json(result.value);
    return response
      .status(httpStatusFromErrorType(result.value.type))
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

export default router;
