import { createWalletClient, http, publicActions, BaseError, ContractFunctionRevertedError, parseEventLogs } from "viem";
import { arcTestnet } from "viem/chains";
import { createViemAccount } from "@privy-io/node/viem"
import { left, right } from "../../shared/either.js";
import { abi, contract } from "../../abi/index.js";

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
        transport: http()
      }).extend(publicActions);
      
      const { request } = await client.simulateContract({
        address: contract.ERC20Factory,
        abi: abi.ERC20Factory,
        functionName: 'createToken',
        args: [input.name, input.symbol, input.supply, user.address],
      })

      const hash = await client.writeContract(request);
      const receipt = await client.waitForTransactionReceipt({ hash });

      const logs = parseEventLogs({
        abi: abi.ERC20Factory,
        eventName: 'ERC20TokenDeployed',
        logs: receipt.logs,
      });      

      return right(`Token created successfully. Token contract: ${logs[0].args.tokenAddress}. Transaction hash: ${hash}`);
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