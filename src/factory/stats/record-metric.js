import Database from "../../database/client.js";
import MetricRepository from "../../database/metric-repository.js";
import Service from "../../service/stats/record-metric.js";

export const RecordMetricFactory = () => {
  const database = new Database();
  const metricRepository = new MetricRepository(database);
  const service = new Service({ metricRepository });
  return service;
};
