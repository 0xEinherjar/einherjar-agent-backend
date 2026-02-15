import { createWalletClient, http, publicActions, parseUnits, formatUnits } from "viem";
import { arcTestnet } from "viem/chains";
import { createViemAccount } from "@privy-io/node/viem"
import { left, right } from "../../shared/either.js";

export default class Service {
  constructor({ repository, walletProvider }) {
    this.repository = repository;
    this.walletProvider = walletProvider;
  }

  async execute(input) {
    try {      
      const user = await this.repository.loadOne({ twitterId: input.id });
      if (!user) return left({ type: "NOT_FOUND", message: "User not found" });      
      
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
        to: input.to,
        value: parseUnits(input.value, arcTestnet.nativeCurrency.decimals),
      })

      return right(`Transfer completed successfully. Transaction hash: ${hash}`);
    } catch (error) {
      return left({ type: "SERVER_ERROR", message: error })
    }
  }
}