import { MongoDatabase } from "../../database/mongodb.js";
import { UserRepository } from "../../repositories/user.js";
import { WithdrawService } from "../../services/user/withdraw.js";

export const WithdrawFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  return new WithdrawService({ userRepository });
};
