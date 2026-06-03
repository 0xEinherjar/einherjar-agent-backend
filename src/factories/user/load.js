import { MongoDatabase } from "../../database/mongodb.js";
import { UserRepository } from "../../repositories/user.js";
import { LoadUserService } from "../../services/user/load.js";

export const LoadUserFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  return new LoadUserService({ userRepository });
};
