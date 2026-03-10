import { createWalletClient, http, publicActions, parseUnits, formatUnits, erc20Abi } from "viem";
import * as chains from "viem/chains";
import { createViemAccount } from "@privy-io/node/viem"
import { left, right } from "../../shared/either.js";
import { resolveChainWithDefault } from "../../shared/resolve-chain.js";

export default class Service {
  constructor({ repository, walletProvider }) {
    this.repository = repository;
    this.walletProvider = walletProvider;
  }

  async execute(input) {
    try {      
      console.log(input);
      const user = await this.repository.loadOne({ twitterId: input.id });
      if (!user) return left({ type: "NOT_FOUND", message: "User not found" });      
      
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
        args: [input.to, valueFormatted],
      })      

      const hash = await client.writeContract(request);

      return right(`Transfer completed successfully. Transaction hash: ${hash}`);
    } catch (error) {
      console.log(error);
      return left({ type: "SERVER_ERROR", message: error })
    }
  }
}