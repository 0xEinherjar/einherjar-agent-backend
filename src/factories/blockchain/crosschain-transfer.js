import { MongoDatabase } from "../../database/mongodb.js";
import { UserRepository } from "../../repositories/user.js";
import { CrosschainTransferService } from "../../services/blockchain/crosschain-transfer.js";

export const CrosschainTransferFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  return new CrosschainTransferService({ userRepository });
};
