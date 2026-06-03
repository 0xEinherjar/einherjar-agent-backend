export class MetricRepository {
  constructor(database) {
    this.collection = "agent_metrics";
    this.database = database;
  }

  async record(metricEvent) {
    await this.database.insert(this.collection, {
      type: metricEvent.type,
      token: metricEvent.token,
      amount: metricEvent.amount,
      chain: metricEvent.chain,
      userId: metricEvent.userId,
      createdAt: metricEvent.createdAt,
    });
  }

  async countByType(type) {
    return await this.database.count(this.collection, { type });
  }

  async sumAmountByToken(type, token) {
    return await this.database.aggregate(this.collection, [
      { $match: { type, token } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
  }

  async getAggregatedMetrics() {
    const pipeline = [
      {
        $facet: {
          totalTransactions: [
            { $match: { type: "TRANSACTION" } },
            { $count: "count" },
          ],
          volumeUsdc: [
            { $match: { type: "TRANSACTION", token: "USDC" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ],
          volumeEurc: [
            { $match: { type: "TRANSACTION", token: "EURC" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ],
          tokensCreated: [
            { $match: { type: "TOKEN_CREATED" } },
            { $count: "count" },
          ],
        },
      },
    ];
    return await this.database.aggregate(this.collection, pipeline);
  }
}
