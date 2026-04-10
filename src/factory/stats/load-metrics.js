import Database from "../../database/client.js";
import MetricRepository from "../../database/metric-repository.js";
import UserRepository from "../../database/user-repository.js";
import Service from "../../service/stats/load-metrics.js";

export const LoadMetricsFactory = () => {
  const database = new Database();
  const metricRepository = new MetricRepository(database);
  const userRepository = new UserRepository(database);
  const service = new Service({ metricRepository, userRepository });
  return service;
};
