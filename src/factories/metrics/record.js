import { MongoDatabase } from "../../database/mongodb.js";
import { MetricRepository } from "../../repositories/metric.js";
import { RecordMetricService } from "../../services/metric/record.js";

export const RecordMetricFactory = () => {
  const database = new MongoDatabase();
  const metricRepository = new MetricRepository(database);
  return new RecordMetricService({ metricRepository });
};
