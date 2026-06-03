import { MetricEvent } from "../../entities/metric-event.js";
import { left, right } from "../../shared/either.js";

export class RecordMetricService {
  constructor({ metricRepository }) {
    this.metricRepository = metricRepository;
  }

  async execute(input) {
    const created = MetricEvent.create(input);
    if (created.isLeft()) {
      return left({ type: "BAD_REQUEST", message: created.value });
    }
    await this.metricRepository.record(created.value);
    return right({ success: true });
  }
}
