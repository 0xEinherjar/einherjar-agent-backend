import { MongoDatabase } from "../../database/mongodb.js";
import WalletProvider from "../../libraries/wallet-provider-circle.js";
import { UserRepository } from "../../repositories/user.js";
import { Erc20ToGmailService } from "../../services/transfers/erc20-to-gmail.js";

export const TransferErc20ToGmailFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  const walletProvider = new WalletProvider();
  return new Erc20ToGmailService({ userRepository, walletProvider });
};
