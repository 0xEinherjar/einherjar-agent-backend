import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { left, right } from "../../shared/either.js";
import { constants } from "../../shared/constant.js";
import User from "../../entity/user.js";
import { abi } from "../../abi/index.js";
import { waitForTxCompletion } from "./helpers.js";
import { recordMetric } from "../../shared/record-metric.js";
import { sendEmail } from "../../lib/resend.js";
import { buildTransferReceiptEmail } from "../../templates/emails/transferReceipt.js";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

const smartContractPlatformClient = initiateSmartContractPlatformClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

export default class Service {
  constructor({ repository, walletProvider }) {
    this.repository = repository;
    this.walletProvider = walletProvider;
  }

  async execute(input) {
    try {
      const to = input.to.toLowerCase();
      if (!to.endsWith("@gmail.com")) {
        return left({ success: false, type: "BAD_REQUEST", message: "Recipient must be a valid @gmail.com address" });
      }

      const user = await this.repository.loadOne({ userId: input.id });
      if (!user) return left({ success: false, type: "NOT_FOUND", message: "User not found" });

      let recipient = await this.repository.loadOne({ gmailAddress: to });
      if (!recipient) {
        const wallet = await this.walletProvider.createWallet();
        const created = User.create({
          walletId: wallet.id,
          address: wallet.address,
          gmailAddress: to,
        });
        if (created.isLeft()) return left({ success: false, type: "BAD_REQUEST", message: created.value });
        recipient = created.value;
        await this.repository.create(recipient);
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

      const htmlContent = buildTransferReceiptEmail({
        senderName: user.gmailAddress || user.twitterUsername || "Einherjar User",
        amount: input.value,
        tokenSymbol: "ERC20",
        network: "ARC-TESTNET",
        txHash: txResult.value,
      });

      // Fire and forget so we don't block the request response
      sendEmail({
        to: to,
        subject: `You received ${input.value} ERC20! 🚀`,
        html: htmlContent,
      }).catch(err => console.error("Email sending failed:", err));

      return right({
        success: true,
        data: {
          chain: "ARC-TESTNET",
          hash: txResult.value,
          value: input.value,
          token: input.token
        },
      });
    } catch (error) {
      const message = error?.response?.data?.message ?? error?.message ?? String(error);
      return left({ success: false, type: "SERVER_ERROR", message });
    }
  }
}