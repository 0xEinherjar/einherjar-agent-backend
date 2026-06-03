import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { abi, bytecode } from "../../abi/index.js";
import { constants } from "../../shared/constant.js";
import { left, right } from "../../shared/either.js";
import { recordMetric } from "../../shared/record-metric.js";

export class CreateErc20Service {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(input) {
    try {
      const user = await this.userRepository.loadOne({ userId: input.id });
      if (!user)
        return left({
          success: false,
          type: "NOT_FOUND",
          message: "User not found",
        });

      const smartContractPlatformClient = initiateSmartContractPlatformClient({
        apiKey: constants.CIRCLE_API_KEY,
        entitySecret: constants.CIRCLE_ENTITY_SECRET,
      });

      const deployResponse = await smartContractPlatformClient.deployContract({
        name: "Token ERC20",
        description: "Standard ERC20 token",
        walletId: user.walletId,
        blockchain: "ARC-TESTNET",
        constructorParameters: [
          input.name,
          input.symbol,
          input.supply,
          user.address,
        ],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        abiJson: JSON.stringify(abi.ERC20),
        bytecode: `0x${bytecode.ERC20}`,
      });

      const TIMEOUT_MS = 60 * 1000; // 60 seconds
      const startTime = Date.now();
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      while (startTime + TIMEOUT_MS > Date.now()) {
        await sleep(1000); // await 1 second
        const transactionStatusResponse =
          await smartContractPlatformClient.getContract({
            id: deployResponse.data.contractId,
          });
        const { status, contractAddress, txHash } =
          transactionStatusResponse.data.contract;

        const TERMINAL_STATES = new Set([
          "COMPLETE",
          "FAILED",
          "CANCELLED",
          "DENIED",
          "STUCK",
        ]);
        if (TERMINAL_STATES.has(status) && status === "COMPLETE") {
          await recordMetric({
            type: "TOKEN_CREATED",
            token: null,
            amount: 0,
            chain: "ARC-TESTNET",
            userId: input.id,
          });
          return right({
            success: true,
            data: { contract: contractAddress, hash: txHash },
          });
        }
        if (TERMINAL_STATES.has(status) && status !== "COMPLETE") {
          return left({
            success: false,
            type: "TRANSACTION_FAILED",
            message: `Deploy failed. Status: ${status}.`,
          });
        }
      }
      return left({
        success: false,
        message: "Timeout reached while waiting for transaction completion",
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ?? error?.message ?? String(error);
      return left({ success: false, type: "SERVER_ERROR", message });
    }
  }
}
