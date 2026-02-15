import { createWalletClient, http, publicActions, parseUnits, formatUnits } from "viem";
import { arcTestnet } from "viem/chains";
import { createViemAccount } from "@privy-io/node/viem"
import { left, right } from "../../shared/either.js";
import User from "../../entity/user.js";

export default class Service {
  constructor({ repository, walletProvider, xClient }) {
    this.repository = repository;
    this.walletProvider = walletProvider;
    this.xClient = xClient;
  }

  async execute(input) {
    try {
      const user = await this.repository.loadOne({ twitterId: input.id });
      if (!user) return left({ type: "NOT_FOUND", message: "User not found" });
      const username = input.to.replace("@", "");
      const userX = await this.xClient.findUserByUsername(username);
      if (!userX) return left({ type: "NOT_FOUND", message: "User not found on X (twitter)" });
      let recipient = await this.repository.loadOne({ twitterId: userX.id });
      if (!recipient) {
        const wallet = await this.walletProvider.createWallet();
        const created = User.create({
          walletId: wallet.id,
          address: wallet.address,
          twitterId: userX.id,
        });
        if (created.isLeft()) return left({ type: "BAD_REQUEST", message: created.value });
        recipient = created.value;
        await this.repository.create(recipient);
      };
      const account = await createViemAccount(this.walletProvider.getClient(), {
        walletId: user.walletId,
        address: user.address
      });
      const client = createWalletClient({
        account: account,
        chain: arcTestnet,
        transport: http(),
      }).extend(publicActions);
      const balance = await client.getBalance({
        address: account.address,
      })
      const balanceFormatted = formatUnits(balance, arcTestnet.nativeCurrency.decimals);
      if (Number(balanceFormatted) < Number(input.value)) {
        return left({ type: "NOT_ENOUGH_BALANCE", message: "Not enough balance" });
      }
      const hash = await client.sendTransaction({
        to: recipient.address,
        value: parseUnits(input.value, arcTestnet.nativeCurrency.decimals),
      })
      return right(`Transfer completed successfully. Transaction hash: ${hash}`);
    } catch (error) {
      return left({ type: "SERVER_ERROR", message: error })
    }
  }
}