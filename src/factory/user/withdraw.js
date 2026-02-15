import Database from "../../database/client.js";
import Repository from "../../database/user-repository.js";
import Service from "../../service/user/withdraw.js";
import WalletProvider from "../../lib/wallet-provider.js";

export const WithdrawFactory = () => {
  const database = new Database();
  const repository = new Repository(database);
  const walletProvider = new WalletProvider();
  const service = new Service({ repository, walletProvider });
  return service;
};