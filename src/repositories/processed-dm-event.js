export class ProcessedDmEventRepository {
  constructor(database) {
    this.collection = "processed_dm_events";
    this.database = database;
  }

  async hasProcessed(dmEventId) {
    const event = await this.database.findOne(this.collection, { dmEventId });
    return Boolean(event);
  }

  async markProcessed({ dmEventId, senderId, status }) {
    await this.database.insert(this.collection, {
      dmEventId,
      senderId,
      status,
      createdAt: new Date(),
    });
  }
}
