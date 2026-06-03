import { MongoDatabase } from "../../database/mongodb.js";
import { SocialTransferRepository } from "../../repositories/social-transfer.js";

export const SocialTransferRepositoryFactory = () => {
  const database = new MongoDatabase();
  return new SocialTransferRepository(database);
};
