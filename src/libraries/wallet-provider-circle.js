import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { constants } from "../shared/constant.js";

export default class WalletClient {
  static client = initiateDeveloperControlledWalletsClient({
    apiKey: constants.CIRCLE_API_KEY,
    entitySecret: constants.CIRCLE_ENTITY_SECRET,
  });

  async createWallet() {
    const walletsResponse = await WalletClient.client.createWallets({
      blockchains: [
        "ARC-TESTNET",
        "ETH-SEPOLIA",
        "AVAX-FUJI",
        "ARB-SEPOLIA",
        "BASE-SEPOLIA",
        "OP-SEPOLIA",
        "MATIC-AMOY",
      ],
      count: 1,
      walletSetId: constants.CIRCLE_WALLET_SET_ID,
      accountType: "SCA",
    });
    return walletsResponse.data?.wallets[0];
  }

  getClient() {
    return WalletClient.client;
  }
}
