import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { abi } from "../../abi/index.js";
import { constants } from "../../shared/constant.js";
import { left, right } from "../../shared/either.js";
import { recordMetric } from "../../shared/record-metric.js";
import { resolvePaymentContact } from "../../shared/resolve-payment-contact.js";
import { waitForTxCompletion } from "../blockchain/helpers.js";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

const smartContractPlatformClient = initiateSmartContractPlatformClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

export class Erc20Service {
  constructor({ userRepository, paymentContactRepository }) {
    this.userRepository = userRepository;
    this.paymentContactRepository = paymentContactRepository;
  }

  async execute(input) {
    try {
      const user = await this.userRepository.loadOne({ userId: input.id });
      if (!user) {
        return left({
          success: false,
          type: "NOT_FOUND",
          message: "User not found",
        });
      }
      const recipient = await resolvePaymentContact({
        paymentContactRepository: this.paymentContactRepository,
        userId: input.id,
        to: input.to,
      });
      if (!recipient.address?.match(/^0x[a-fA-F0-9]{40}$/)) {
        return left({
          success: false,
          type: "BAD_REQUEST",
          message:
            "Recipient must be a valid EVM address or saved payment contact.",
        });
      }

      const [decimalsRes, balanceRes] = await Promise.all([
        smartContractPlatformClient.queryContract({
          address: input.token,
          blockchain: "ARC-TESTNET",
          abiFunctionSignature: "decimals()",
          abiJson: JSON.stringify(abi.ERC20),
        }),
        smartContractPlatformClient.queryContract({
          address: input.token,
          blockchain: "ARC-TESTNET",
          abiFunctionSignature: "balanceOf(address)",
          abiParameters: [user.address],
          abiJson: JSON.stringify(abi.ERC20),
        }),
      ]);

      const decimals = Number(decimalsRes.data?.outputValues?.[0] ?? 18);
      const balance = Number(balanceRes.data?.outputValues?.[0] ?? "0");
      const amount = Number(Math.round(Number(input.value) * 10 ** decimals));

      if (balance < amount) {
        return left({
          success: false,
          type: "NOT_ENOUGH_BALANCE",
          message: `Insufficient funds. Available: ${balance / 10 ** decimals}, Required: ${amount / 10 ** decimals}`,
        });
      }

      const transaction = await client.createContractExecutionTransaction({
        walletId: user.walletId,
        contractAddress: input.token,
        blockchain: "ARC-TESTNET",
        abiFunctionSignature: "transfer(address,uint256)",
        abiParameters: [recipient.address, amount],
        fee: {
          type: "level",
          config: { feeLevel: "MEDIUM" },
        },
      });
      const txResult = await waitForTxCompletion(client, transaction.data?.id);

      if (txResult.isLeft()) return txResult;

      await recordMetric({
        type: "TRANSACTION",
        token: "ERC20",
        amount: Number(input.value),
        chain: "ARC-TESTNET",
        userId: input.id,
      });

      return right({
        success: true,
        data: {
          chain: "ARC-TESTNET",
          hash: txResult.value,
          value: input.value,
          token: input.token,
          to: recipient.address,
          contact: recipient.contact ? recipient.contact.label : null,
        },
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ?? error?.message ?? String(error);
      return left({ success: false, type: "SERVER_ERROR", message });
    }
  }
}
