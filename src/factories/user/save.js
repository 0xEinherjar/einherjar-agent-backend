import { MongoDatabase } from "../../database/mongodb.js";
import WalletProvider from "../../libraries/wallet-provider-circle.js";
import { UserRepository } from "../../repositories/user.js";
import { SaveUserService } from "../../services/user/save.js";

export const SaveUserFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  const walletProvider = new WalletProvider();
  return new SaveUserService({ userRepository, walletProvider });
};
