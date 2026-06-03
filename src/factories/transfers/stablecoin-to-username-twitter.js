import { MongoDatabase } from "../../database/mongodb.js";
import WalletProvider from "../../libraries/wallet-provider-circle.js";
import XClient from "../../libraries/x-client.js";
import { SocialTransferRepository } from "../../repositories/social-transfer.js";
import { UserRepository } from "../../repositories/user.js";
import { StablecoinToTwitterUsernameService } from "../../services/transfers/stablecoin-to-username-twitter.js";

export const TransferStablecoinToUsernameTwitterFactory = () => {
  const database = new MongoDatabase();
  const userRepository = new UserRepository(database);
  const socialTransferRepository = new SocialTransferRepository(database);
  const walletProvider = new WalletProvider();
  const xClient = new XClient();
  return new StablecoinToTwitterUsernameService({
    userRepository,
    socialTransferRepository,
    walletProvider,
    xClient,
  });
};
