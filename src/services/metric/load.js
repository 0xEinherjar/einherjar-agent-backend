import { left, right } from "../../shared/either.js";

export class LoadMetricService {
  constructor({ metricRepository, userRepository }) {
    this.metricRepository = metricRepository;
    this.userRepository = userRepository;
  }

  async execute() {
    try {
      const [aggregated, users] = await Promise.all([
        this.metricRepository.getAggregatedMetrics(),
        this.userRepository.load({}),
      ]);

      const facets = aggregated[0] || {};
      const totalTransactions = facets.totalTransactions?.[0]?.count ?? 0;
      const volumeUsdc = facets.volumeUsdc?.[0]?.total ?? 0;
      const volumeEurc = facets.volumeEurc?.[0]?.total ?? 0;
      const tokensCreated = facets.tokensCreated?.[0]?.count ?? 0;
      const totalUsers = users?.length ?? 0;

      return right({
        totalUsers,
        volumeUsdc,
        volumeEurc,
        totalTransactions,
        tokensCreated,
      });
    } catch (error) {
      return left({
        type: "SERVER_ERROR",
        message: error.message || String(error),
      });
    }
  }
}
