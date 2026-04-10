import { RecordMetricFactory } from "../factory/stats/record-metric.js";

export async function recordMetric({ type, token, amount, chain, userId }) {
  try {
    await RecordMetricFactory().execute({ type, token, amount, chain, userId });
  } catch (_) {
    // Silently ignore metric recording failures
  }
}
