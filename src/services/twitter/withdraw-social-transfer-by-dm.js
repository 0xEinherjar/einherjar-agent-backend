import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { constants } from "../../shared/constant.js";
import { left, right } from "../../shared/either.js";
import {
  CHAINS_MAP_EURC,
  CHAINS_MAP_USDC,
} from "../../shared/resolve-chain.js";
import { waitForTxCompletion } from "../blockchain/helpers.js";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

const EVM_ADDRESS_RE = /0x[a-fA-F0-9]{40}/;
const WITHDRAW_INTENT_RE = /\b(withdraw|sacar|saca|saque|send|envia|enviar|manda|transfer|transferir)\b/i;
const ALL_RE = /\b(all|tudo|todos|total|saldo)\b/i;

function findStablecoinChain(token, canonicalCircle) {
  const chains = token === "EURC" ? CHAINS_MAP_EURC : CHAINS_MAP_USDC;
  return Object.values(chains).find(
    (chain) => chain.canonical_circle === canonicalCircle,
  );
}

function parseWithdrawCommand(text) {
  const address = text?.match(EVM_ADDRESS_RE)?.[0];
  if (!address || !WITHDRAW_INTENT_RE.test(text ?? "")) return null;
  return {
    address,
    withdrawAll: ALL_RE.test(text),
  };
}

export class WithdrawSocialTransferByDmService {
  constructor({ userRepository, socialTransferRepository }) {
    this.userRepository = userRepository;
    this.socialTransferRepository = socialTransferRepository;
  }

  async execute(input) {
    const command = parseWithdrawCommand(input.text);
    if (!command) return right({ ignored: true });

    try {
      const recipient = await this.userRepository.loadOne({
        twitterId: input.senderId,
      });
      if (!recipient) {
        return left({
          type: "NOT_FOUND",
          message: "No pending wallet was found for your X account.",
        });
      }

      const pendingTransfers =
        await this.socialTransferRepository.loadPendingByTwitterId(
          input.senderId,
        );
      if (!pendingTransfers.length) {
        return left({
          type: "NOT_FOUND",
          message: "No pending transfer was found for your X account.",
        });
      }

      const transfersToWithdraw = command.withdrawAll
        ? pendingTransfers
        : [pendingTransfers[0]];
      const withdrawn = [];

      for (const transfer of transfersToWithdraw) {
        const result = await this.#withdrawTransfer({
          transfer,
          recipient,
          destinationAddress: command.address,
        });
        if (result.isLeft()) return result;

        await this.socialTransferRepository.markWithdrawn({
          id: transfer.id,
          withdrawTxHash: result.value.hash,
          withdrawTo: command.address,
          withdrawDmEventId: input.dmEventId,
        });
        withdrawn.push({
          amount: transfer.amount,
          token:
            transfer.token === "ERC20" ? transfer.tokenAddress : transfer.token,
          chain: transfer.chain,
          hash: result.value.hash,
        });
      }

      return right({
        ignored: false,
        destinationAddress: command.address,
        withdrawn,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ?? error?.message ?? String(error);
      return left({ type: "SERVER_ERROR", message });
    }
  }

  async #withdrawTransfer({ transfer, recipient, destinationAddress }) {
    if (transfer.token === "USDC" || transfer.token === "EURC") {
      const chain = findStablecoinChain(transfer.token, transfer.chain);
      if (!chain)
        return left({
          type: "INVALID_CHAIN",
          message: "Unsupported chain for this withdrawal.",
        });

      const transaction = await client.createTransaction({
        blockchain: chain.canonical_circle,
        walletAddress: recipient.address,
        destinationAddress,
        amount: [String(transfer.amount)],
        tokenAddress: chain.token,
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });

      const result = await waitForTxCompletion(client, transaction.data?.id);
      if (result.isLeft()) {
        return left({
          type: "TRANSACTION_FAILED",
          message: result.value.message ?? String(result.value),
        });
      }
      return right({ hash: result.value });
    }

    const decimals = Number(transfer.tokenDecimals ?? 18);
    const amount = BigInt(Math.round(Number(transfer.amount) * 10 ** decimals));
    const transaction = await client.createContractExecutionTransaction({
      walletId: recipient.walletId,
      contractAddress: transfer.tokenAddress,
      blockchain: transfer.chain,
      abiFunctionSignature: "transfer(address,uint256)",
      abiParameters: [destinationAddress, amount.toString()],
      fee: {
        type: "level",
        config: { feeLevel: "MEDIUM" },
      },
    });

    const result = await waitForTxCompletion(client, transaction.data?.id);
    if (result.isLeft()) {
      return left({
        type: "TRANSACTION_FAILED",
        message: result.value.message ?? String(result.value),
      });
    }
    return right({ hash: result.value });
  }
}
