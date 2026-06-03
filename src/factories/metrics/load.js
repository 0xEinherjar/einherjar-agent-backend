import { MongoDatabase } from "../../database/mongodb.js";
import { MetricRepository } from "../../repositories/metric.js";
import { UserRepository } from "../../repositories/user.js";
import { LoadMetricService } from "../../services/metric/load.js";

export const LoadMetricsFactory = () => {
  const database = new MongoDatabase();
  const metricRepository = new MetricRepository(database);
  const userRepository = new UserRepository(database);
  return new LoadMetricService({ metricRepository, userRepository });
};
