import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { abi } from "../../abi/index.js";
import { SocialTransfer } from "../../entities/social-transfer.js";
import { User } from "../../entities/user.js";
import { constants } from "../../shared/constant.js";
import { left, right } from "../../shared/either.js";
import { recordMetric } from "../../shared/record-metric.js";
import { buildTransferReceiptDM } from "../../templates/dms/transferReceipt.js";
import { waitForTxCompletion } from "../blockchain/helpers.js";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

const smartContractPlatformClient = initiateSmartContractPlatformClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

export class Erc20ToTwitterUsernameService {
  constructor({
    userRepository,
    socialTransferRepository,
    walletProvider,
    xClient,
  }) {
    this.userRepository = userRepository;
    this.socialTransferRepository = socialTransferRepository;
    this.walletProvider = walletProvider;
    this.xClient = xClient;
  }

  async execute(input) {
    try {
      if (input.channel !== "twitter")
        return left({
          success: false,
          type: "BAD_REQUEST",
          message: "Invalid channel",
        });
      const user = await this.userRepository.loadOne({ userId: input.id });
      if (!user) {
        return left({
          success: false,
          type: "NOT_FOUND",
          message: "User not found",
        });
      }

      const username = input.to.replace("@", "");
      const userX = await this.xClient.findUserByUsername(username);
      if (!userX) {
        return left({
          success: false,
          type: "NOT_FOUND",
          message: "User not found on X (twitter)",
        });
      }

      let recipient = await this.userRepository.loadOne({
        twitterId: userX.id,
      });
      if (!recipient) {
        const wallet = await this.walletProvider.createWallet();
        const created = User.create({
          twitterId: userX.id,
          walletId: wallet.id,
          address: wallet.address,
        });
        if (created.isLeft())
          return left({
            success: false,
            type: "BAD_REQUEST",
            message: created.value,
          });
        recipient = created.value;
        await this.userRepository.create(recipient);
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
      await this.#recordSocialTransfer({
        sender: user,
        recipient,
        userX,
        tokenAddress: input.token,
        tokenDecimals: decimals,
        amount: input.value,
        hash: txResult.value,
      });

      const dmContent = buildTransferReceiptDM({
        senderName: user.twitterUsername || user.name || "Einherjar User",
        amount: input.value,
        tokenSymbol: input.token,
        network: "ARC-TESTNET",
        txHash: txResult.value,
      });

      // Fire and forget so we don't block
      this.xClient
        .sendDmByUsername(userX.id, dmContent)
        .catch((err) => console.error("DM sending failed:", err));

      return right({
        success: true,
        data: {
          chain: "ARC-TESTNET",
          hash: txResult.value,
          value: input.value,
          token: input.token,
        },
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ?? error?.message ?? String(error);
      return left({ success: false, type: "SERVER_ERROR", message });
    }
  }

  async #recordSocialTransfer({
    sender,
    recipient,
    userX,
    tokenAddress,
    tokenDecimals,
    amount,
    hash,
  }) {
    if (!this.socialTransferRepository) return;
    const created = SocialTransfer.create({
      senderUserId: sender.userId,
      senderAddress: sender.address,
      recipientTwitterId: userX.id,
      recipientUsername: userX.username,
      recipientWalletId: recipient.walletId,
      recipientAddress: recipient.address,
      token: "ERC20",
      tokenAddress,
      tokenDecimals,
      amount: Number(amount),
      chain: "ARC-TESTNET",
      originalTxHash: hash,
    });
    if (created.isRight())
      await this.socialTransferRepository.create(created.value);
  }
}
