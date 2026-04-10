import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { left, right } from "../../shared/either.js";
import { constants } from "../../shared/constant.js";
import { resolveChainWithDefault, resolveChainEurcWithDefault } from "../../shared/resolve-chain.js";
import { abi } from "../../abi/index.js";
import { recordMetric } from "../../shared/record-metric.js";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

const smartContractPlatformClient = initiateSmartContractPlatformClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

export default class Service {
  constructor({ repository }) {
    this.repository = repository;
  }

  async execute(input) {
    try {
      const user = await this.repository.loadOne({ userId: input.id });
      if (!user) return left({ type: "NOT_FOUND", message: "User not found" });

      let resolvedChain;
      if (input.token === "EURC") {
        resolvedChain = resolveChainEurcWithDefault(input.chain);
      } else if (input.token === "USDC" || !input.token) {
        resolvedChain = resolveChainWithDefault(input.chain);
      } else {
        return left({ success: false, type: "INVALID_TOKEN", message: "Invalid token" });
      }

      const [decimalsRes, balanceRes] = await Promise.all([
        smartContractPlatformClient.queryContract({
          address: resolvedChain.token,
          blockchain: resolvedChain.canonical_circle,
          abiFunctionSignature: "decimals()",
          abiJson: JSON.stringify(abi.ERC20),
        }),
        smartContractPlatformClient.queryContract({
          address: resolvedChain.token,
          blockchain: resolvedChain.canonical_circle,
          abiFunctionSignature: "balanceOf(address)",
          abiParameters: [user.address],
          abiJson: JSON.stringify(abi.ERC20),
        }),
      ]);

      const decimals = Number(decimalsRes.data?.outputValues?.[0] ?? 6);
      const balance = Number(balanceRes.data?.outputValues?.[0] ?? "0");
      const amount = Number(Math.round(Number(input.value) * 10 ** decimals));

      if (balance < amount) {
        return left({
          success: false,
          type: "NOT_ENOUGH_BALANCE",
          message: `Insufficient ${input.token || 'USDC'} balance. Available: ${balance / 10 ** decimals}, Required: ${amount / 10 ** decimals}`,
        });
      }

      const transaction = await client.createTransaction({
        blockchain: resolvedChain.canonical_circle,
        walletAddress: user.address,
        destinationAddress: input.to,
        amount: [input.value],
        tokenAddress: resolvedChain.token,
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });

      const TIMEOUT_MS = 60 * 1000; // 60 seconds
      const startTime = Date.now();
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      while ((startTime + TIMEOUT_MS) > Date.now()) {
        await sleep(1000); // await 1 second
        const transactionStatusResponse = await client.getTransaction({ id: transaction.data?.id });
        const { state, txHash, errorReason } = transactionStatusResponse.data.transaction;
        const TERMINAL_STATES = new Set(["CONFIRMED", "COMPLETE", "FAILED", "CANCELLED", "DENIED"]);
        if (TERMINAL_STATES.has(state) && (state == "CONFIRMED" || state == "COMPLETE")) {
          await recordMetric({
            type: "TRANSACTION",
            token: input.token || "USDC",
            amount: Number(input.value),
            chain: resolvedChain.canonical_circle,
            userId: input.id,
          });
          return right({
            success: true,
            message: `Withdrawal of ${input.value} ${input.token || 'USDC'} completed successfully on the ${resolvedChain.canonical_circle}. Hash: ${txHash}`
          });
        }
        if (TERMINAL_STATES.has(state) && (state != "CONFIRMED" && state != "COMPLETE")) {
          return left({
            success: false,
            type: "TRANSACTION_FAILED",
            message: `Withdrawal failed. State: ${state}. Reason: ${errorReason ?? "unknown"}`,
          });
        }
      }
      return left({ success: false, message: "Timeout reached while waiting for transaction completion" });
    } catch (error) {
      const message = error?.response?.data?.message ?? error?.message ?? String(error);
      return left({ success: false, type: "SERVER_ERROR", message });
    }
  }
}