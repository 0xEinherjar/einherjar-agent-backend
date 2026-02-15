import Database from "../../database/client.js";
import Repository from "../../database/user-repository.js";
import Service from "../../service/blockchain/transfer-native-to-username-twitter.js";
import WalletProvider from "../../lib/wallet-provider.js";
import XClient from "../../lib/x-client.js";

export const TransferNativeToUsernameTwitterFactory = () => {
  const database = new Database();
  const repository = new Repository(database);
  const walletProvider = new WalletProvider();
  const xClient = new XClient();
  const service = new Service({ repository, walletProvider, xClient });
  return service;
};
