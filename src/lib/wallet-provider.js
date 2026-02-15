import { PrivyClient } from "@privy-io/node";
import { constants } from "../shared/constant.js";

export default class WalletClient {
  static client = new PrivyClient({
    appId: constants.PRIVY_APP_ID,
    appSecret: constants.PRIVY_APP_SECRET
  });

  async createWallet(email) {
    let id = null;
    if (email) {
      const user = await this.createUser(email);
      id = user?.id;
    }
    const payload  = { chain_type: "ethereum" };
    if (id) Object.assign(payload, { owner: { user_id: id } });
    const walletResult = await WalletClient.client.wallets().create(payload);
    return Object.assign(walletResult, { userWalletId: id ?? null });
  }

  async createUser(email) {
    return await WalletClient.client.users().create({
      linked_accounts: [{ type: "email", address: email }],
      wallets: [{chain_type: "ethereum"}]
    });
  }

  async importWallet({ wallet, privateKey, userId }) {
    const walletResult = await WalletClient.client.wallets().import({
      wallet: {
        entropy_type: "private-key",
        chain_type: "ethereum",
        address: wallet,
        private_key: privateKey,
      },
      owner: {user_id: userId }
    });
    return walletResult;
  }

  async exportWallet(walletId) {
    const { private_key } = await WalletClient.client.wallets().export(walletId, {});
    return private_key;
  }

  getClient() {
    return WalletClient.client;
  }
}
