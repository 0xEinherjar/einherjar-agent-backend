import { Router } from "express";
import { LoadMetricsFactory } from "../factory/stats/load-metrics.js";
import { httpStatusFromErrorType } from "../shared/http-status.js";

const router = Router();

router.get("/", async (request, response, next) => {
  try {
    const result = await LoadMetricsFactory().execute();
    if (result.isRight()) return response.status(200).json(result.value);
    return response
      .status(httpStatusFromErrorType(result.value.type))
      .json({ error: result.value.message });
  } catch (error) {
    return next(error);
  }
});

export default router;
