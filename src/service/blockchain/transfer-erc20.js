import { createWalletClient, erc20Abi, http, publicActions, BaseError, ContractFunctionRevertedError, parseUnits, formatUnits } from "viem";
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

      const decimals = await client.readContract({
        address: input.token,
        abi: erc20Abi,
        functionName: 'decimals',
      })

      const balance = await client.readContract({
        address: input.token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      })

      const balanceFormatted = formatUnits(balance, decimals);
  
      if (balanceFormatted < input.value) {
        return left({ type: "NOT_ENOUGH_BALANCE", message: "Not enough balance" });
      }

      const valueFormatted = parseUnits(String(input.value), decimals);
  
      const { request } = await client.simulateContract({
        address: input.token,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [input.to, valueFormatted],
      })      

      const hash = await client.writeContract(request);

      return right(`Transfer completed successfully. Transaction hash: ${hash}`);
    } catch (error) {
      if (error instanceof BaseError) {
        const revertError = error.walk(err => err instanceof ContractFunctionRevertedError);
        if (revertError instanceof ContractFunctionRevertedError) {
          const errorName = revertError.data?.errorName ?? '';
          return left({ type: "ERROR_CONTRACT", message: errorName });
        }
      }
      return left({ type: "SERVER_ERROR", message: error })
    }
  }
}