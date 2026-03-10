import { createWalletClient, http, publicActions, parseUnits, formatUnits, erc20Abi } from "viem";
import * as chains from "viem/chains";
import { createViemAccount } from "@privy-io/node/viem"
import { left, right } from "../../shared/either.js";
import User from "../../entity/user.js";
import { resolveChainWithDefault } from "../../shared/resolve-chain.js";

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

      const resolvedChain = resolveChainWithDefault(input.chain);
      const chain = chains[resolvedChain.canonical_viem];

      const client = createWalletClient({
        account: account,
        chain: chain,
        transport: http(),
      }).extend(publicActions);

      const decimals = await client.readContract({
        address: resolvedChain.token,
        abi: erc20Abi,
        functionName: "decimals",
      })

      const balance = await client.readContract({
        address: resolvedChain.token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
      })

      const balanceFormatted = formatUnits(balance, decimals);
  
      if (balanceFormatted < input.value) {
        return left({ type: "NOT_ENOUGH_BALANCE", message: "Not enough balance" });
      }

      const valueFormatted = parseUnits(String(input.value), decimals);
  
      const { request } = await client.simulateContract({
        address: resolvedChain.token,
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient.address, valueFormatted],
      })      

      const hash = await client.writeContract(request);

      return right(`Transfer completed successfully. Transaction hash: ${hash}`);
    } catch (error) {
      return left({ type: "SERVER_ERROR", message: error })
    }
  }
}