import { MongoDatabase } from "../../database/mongodb.js";
import { ProcessedDmEventRepository } from "../../repositories/processed-dm-event.js";

export const ProcessedDmEventFactory = () => {
  const database = new MongoDatabase();
  return new ProcessedDmEventRepository(database);
};
