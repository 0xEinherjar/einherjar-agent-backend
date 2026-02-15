import Database from "../../database/client.js";
import Repository from "../../database/user-repository.js";
import Service from "../../service/user/save.js";
import WalletProvider from "../../lib/wallet-provider.js";

export const SaveUserFactory = () => {
  const database = new Database();
  const repository = new Repository(database);
  const walletProvider = new WalletProvider();
  const service = new Service({ repository, walletProvider });
  return service;
};
