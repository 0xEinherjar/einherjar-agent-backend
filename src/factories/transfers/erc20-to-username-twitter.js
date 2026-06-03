import { MongoDatabase } from "../../database/mongodb.js";
import WalletProvider from "../../libraries/wallet-provider-circle.js";
import XClient from "../../libraries/x-client.js";
import { SocialTransferRepository } from "../../repositories/social-transfer.js";
import { UserRepository } from "../../repositories/user.js";
import { Erc20ToTwitterUsernameService } from "../../services/transfers/erc20-to-username-twitter.js";

export const TransferErc20ToUsernameTwitterFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  const socialTransferRepository = new SocialTransferRepository(database);
  const walletProvider = new WalletProvider();
  const xClient = new XClient();
  return new Erc20ToTwitterUsernameService({
    userRepository,
    socialTransferRepository,
    walletProvider,
    xClient,
  });
};
