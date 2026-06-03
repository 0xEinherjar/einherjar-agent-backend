import { MongoDatabase } from "../../database/mongodb.js";
import WalletProvider from "../../libraries/wallet-provider-circle.js";
import { UserRepository } from "../../repositories/user.js";
import { StablecoinToGmailService } from "../../services/transfers/stablecoin-to-gmail.js";

export const TransferStablecoinToGmailFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  const walletProvider = new WalletProvider();
  return new StablecoinToGmailService({ userRepository, walletProvider });
};
