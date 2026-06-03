import { MongoDatabase } from "../../database/mongodb.js";
import { UserRepository } from "../../repositories/user.js";
import { SwapService } from "../../services/blockchain/swap.js";

export const SwapFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  return new SwapService({ userRepository });
};
