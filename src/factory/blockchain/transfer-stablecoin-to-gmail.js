import Database from "../../database/client.js";
import Repository from "../../database/user-repository.js";
import Service from "../../service/blockchain/transfer-stablecoin-to-gmail.js";
import WalletProvider from "../../lib/wallet-provider-circle.js";

export const TransferStablecoinToGmailFactory = () => {
  const database = new Database();
  const repository = new Repository(database);
  const walletProvider = new WalletProvider();
  const service = new Service({ repository, walletProvider });
  return service;
};
