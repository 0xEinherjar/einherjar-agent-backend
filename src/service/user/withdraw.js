import { createWalletClient, http, publicActions, parseUnits } from "viem";
import { createViemAccount } from "@privy-io/node/viem";
import { arcTestnet } from "viem/chains";
import { left, right } from "../../shared/either.js";

export default class Service {
  constructor({ repository, walletProvider }) {
    this.repository = repository;
    this.walletProvider = walletProvider;
  }

  async execute(input) {
    const user = await this.repository.loadOne({ userId: input.id });
    if (!user) return left({ type: "NOT_FOUND", message: "User not found" });
    const account = await createViemAccount(this.walletProvider.getClient(), {
      walletId: user.walletId,
      address: user.address
    });    

    const client = createWalletClient({ 
      account: account, 
      chain: arcTestnet,
      transport: http()
    }).extend(publicActions);

    const balance = await client.getBalance({
      address: account.address,
    });

    const valueFormatted = parseUnits(input.value, arcTestnet.nativeCurrency.decimals);

    if (String(balance) < input.value) {
      return left({ type: "NOT_ENOUGH_BALANCE", message: "Not enough balance" });
    }

    const hash = await client.sendTransaction({ 
      to: input.to,
      value: valueFormatted
    })

    return right(null);
  }
}