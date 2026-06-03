import { MongoDatabase } from "../../database/mongodb.js";
import { UserRepository } from "../../repositories/user.js";
import { CreateErc20Service } from "../../services/blockchain/create-erc20.js";

export const CreateErc20Factory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  return new CreateErc20Service({ userRepository });
};
